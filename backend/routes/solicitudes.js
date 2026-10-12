const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloLectura } = require('../middleware/roles');
const {
  notificarUsuario,
  notificarAsignados,
  notificarVarios,
  obtenerDatosSolicitud,
  formatearFecha,
  formatearHora
} = require('../helpers/notificar');

router.use(verificarToken);

// GET - Listar todas las solicitudes con informacion completa
router.get('/solicitudes', (req, res) => {
  const sql = `
    SELECT 
      sa.id_solicitud,
      sa.nombre_actividad,
      sa.descripcion_actividad,
      sa.fecha_actividad,
      sa.hora_inicio,
      sa.hora_fin,
      sa.lugar_actividad,
      sa.fecha_creacion,
      COALESCE(sa.fecha_fin_actividad, sa.fecha_actividad) AS fecha_fin_actividad,
      ea.nombre_estado AS estado,
      pa.nombre_prioridad AS prioridad,
      pa.nivel_prioridad,
      CONCAT(s.primer_nombre, ' ', s.primer_apellido) AS nombre_solicitante,
      s.id_solicitante,
      GROUP_CONCAT(DISTINCT CONCAT(du.primer_nombre, ' ', du.primer_apellido) SEPARATOR ', ') AS nombre_responsable
    FROM solicitud_actividad sa
    INNER JOIN estado_actividad ea ON sa.id_estado_actividad = ea.id_estado_actividad
    INNER JOIN prioridad_actividad pa ON sa.id_prioridad = pa.id_prioridad
    INNER JOIN solicitante s ON sa.id_solicitante = s.id_solicitante
    LEFT JOIN asignacion_usuario au ON sa.id_solicitud = au.id_solicitud
    LEFT JOIN datos_usuario du ON au.id_usuario = du.id_usuario
    GROUP BY sa.id_solicitud
    ORDER BY sa.fecha_creacion DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
    }
    res.json(resultados);
  });
});

// GET - Obtener una solicitud por ID con toda la info
router.get('/solicitudes/:id', (req, res) => {
  const { id } = req.params;

  const sqlSolicitud = `
    SELECT 
      sa.*,
      ea.nombre_estado,
      pa.nombre_prioridad,
      pa.nivel_prioridad,
      s.primer_nombre AS s_nombre,
      s.segundo_nombre AS s_segundo_nombre,
      s.primer_apellido AS s_apellido,
      s.segundo_apellido AS s_segundo_apellido,
      s.telefono AS s_telefono,
      s.correo_electronico AS s_correo,
      s.descripcion_solicitante,
      i.nombre_institucion,
      i.representante,
      i.tel_representante,
      i.tel_institucion,
      i.direccion AS direccion_institucion
    FROM solicitud_actividad sa
    INNER JOIN estado_actividad ea ON sa.id_estado_actividad = ea.id_estado_actividad
    INNER JOIN prioridad_actividad pa ON sa.id_prioridad = pa.id_prioridad
    INNER JOIN solicitante s ON sa.id_solicitante = s.id_solicitante
    LEFT JOIN institucion i ON s.id_institucion = i.id_institucion
    WHERE sa.id_solicitud = ?
  `;

  conexion.query(sqlSolicitud, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener la solicitud' });
    }

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    const solicitud = resultados[0];

    // Obtener personal asignado
    const sqlPersonal = `
      SELECT 
        au.id_asignacion_usuario,
        au.fecha_asignacion,
        au.observacion,
        du.id_usuario,
        du.primer_nombre,
        du.primer_apellido,
        ca.nombre_cargo
      FROM asignacion_usuario au
      INNER JOIN datos_usuario du ON au.id_usuario = du.id_usuario
      INNER JOIN cargo_usuario ca ON du.id_cargo = ca.id_cargo
      WHERE au.id_solicitud = ?
    `;

    conexion.query(sqlPersonal, [id], (error, personal) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al obtener personal asignado' });
      }

      // Obtener recursos asignados
      const sqlRecursos = `
        SELECT 
          ar.id_asignacion_recurso,
          ar.cantidad,
          ar.fecha_asignacion,
          ar.observacion,
          r.id_recurso,
          r.nombre_recurso,
          r.estado_recurso,
          tr.nombre_tipo_recurso
        FROM asignacion_recurso ar
        INNER JOIN recurso r ON ar.id_recurso = r.id_recurso
        INNER JOIN tipo_recurso tr ON r.id_tipo_recurso = tr.id_tipo_recurso
        WHERE ar.id_solicitud = ?
      `;

      conexion.query(sqlRecursos, [id], (error, recursos) => {
        if (error) {
          console.error('ERROR MYSQL:', error);
          return res.status(500).json({ mensaje: 'Error al obtener recursos asignados' });
        }

        // Obtener detalle de solicitud
        const sqlDetalle = `
          SELECT 
            ds.id_detalle_solicitud,
            ds.descripcion_detalle,
            ds.cantidad
          FROM detalle_solicitud ds
          WHERE ds.id_solicitud = ?
        `;

        conexion.query(sqlDetalle, [id], (error, detalle) => {
          if (error) {
            console.error('ERROR MYSQL:', error);
            return res.status(500).json({ mensaje: 'Error al obtener detalle de solicitud' });
          }

          solicitud.personal = personal;
          solicitud.recursos = recursos;
          solicitud.detalle = detalle;

          res.json(solicitud);
        });
      });
    });
  });
});

// POST - Crear solicitud
router.post('/solicitudes', soloLectura, (req, res) => {
  const {
    idSolicitante,
    idEstadoActividad,
    idPrioridad,
    fechaCreacion,
    fechaActividad,
    fechaFinActividad,
    horaInicio,
    horaFin,
    nombreActividad,
    descripcionActividad,
    lugarActividad,
    detalle,
    personalAsignado,
    recursosAsignados
  } = req.body;

  if (!idSolicitante || !idEstadoActividad || !idPrioridad || !nombreActividad || !fechaActividad || !horaInicio || !horaFin || !lugarActividad) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  if (fechaFinActividad && fechaFinActividad < fechaActividad) {
    return res.status(400).json({ mensaje: 'La fecha fin no puede ser anterior a la fecha inicio' });
  }

  conexion.beginTransaction((error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar la transaccion' });
    }

    const sqlSolicitud = `
      INSERT INTO solicitud_actividad (
        id_solicitante,
        id_estado_actividad,
        id_prioridad,
        fecha_creacion,
        fecha_actividad,
        fecha_fin_actividad,
        hora_inicio,
        hora_fin,
        nombre_actividad,
        descripcion_actividad,
        lugar_actividad
      ) VALUES (?, ?, ?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
      sqlSolicitud,
      [
        idSolicitante,
        idEstadoActividad,
        idPrioridad,
        fechaCreacion || null,
        fechaActividad,
        fechaFinActividad || fechaActividad,
        horaInicio,
        horaFin,
        nombreActividad,
        descripcionActividad || null,
        lugarActividad
      ],
      (error, resultado) => {
        if (error) {
          return conexion.rollback(() => {
            console.error('ERROR MYSQL:', error);
            res.status(500).json({ mensaje: 'Error al crear la solicitud' });
          });
        }

        const idSolicitud = resultado.insertId;

        const insertsPendientes = [];

        if (detalle && detalle.length > 0) {
          const sqlDetalle = 'INSERT INTO detalle_solicitud (id_solicitud, descripcion_detalle, cantidad) VALUES ?';
          const valoresDetalle = detalle.map(d => [idSolicitud, d.descripcionDetalle, d.cantidad]);
          insertsPendientes.push({ sql: sqlDetalle, values: [valoresDetalle], msg: 'Error al insertar detalle' });
        }

        if (personalAsignado && personalAsignado.length > 0) {
          const valoresPersonal = personalAsignado.map((p) => {
            const idUsuario = (p !== null && typeof p === 'object') ? p.idUsuario : p;
            const observacion = (p !== null && typeof p === 'object') ? (p.observacion || null) : null;
            return [idSolicitud, idUsuario, new Date(), observacion];
          });

          if (valoresPersonal.some((v) => !v[1])) {
            return conexion.rollback(() => {
              res.status(400).json({ mensaje: 'Responsable invalido' });
            });
          }

          const sqlPersonal = 'INSERT INTO asignacion_usuario (id_solicitud, id_usuario, fecha_asignacion, observacion) VALUES ?';
          insertsPendientes.push({ sql: sqlPersonal, values: [valoresPersonal], msg: 'Error al asignar personal' });
        }

        if (recursosAsignados && recursosAsignados.length > 0) {
          const sqlRecursos = 'INSERT INTO asignacion_recurso (id_solicitud, id_recurso, cantidad, fecha_asignacion, observacion) VALUES ?';
          const valoresRecursos = recursosAsignados.map(r => [idSolicitud, r.idRecurso, r.cantidad || 1, new Date(), r.observacion || null]);
          insertsPendientes.push({ sql: sqlRecursos, values: [valoresRecursos], msg: 'Error al asignar recursos' });
        }

        if (insertsPendientes.length === 0) {
          conexion.commit((error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al guardar la solicitud' });
              });
            }
            res.status(201).json({ mensaje: 'Solicitud creada correctamente', id: idSolicitud });
          });
          return;
        }

        let i = 0;
        function ejecutarSiguiente() {
          if (i >= insertsPendientes.length) {
            conexion.commit((error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({ mensaje: 'Error al guardar la solicitud' });
                });
              }

              // Notificar al personal asignado (fire and forget)
              if (personalAsignado && personalAsignado.length > 0) {
                const ids = personalAsignado.map((p) => (p !== null && typeof p === 'object') ? p.idUsuario : p);
                obtenerDatosSolicitud(idSolicitud, (datos) => {
                  const nombre = datos ? datos.nombre_actividad : nombreActividad;
                  const fecha = datos ? formatearFecha(datos.fecha_actividad) : formatearFecha(fechaActividad);
                  const hora = datos && datos.hora_inicio && datos.hora_fin
                    ? ` de ${formatearHora(datos.hora_inicio)} a ${formatearHora(datos.hora_fin)}`
                    : '';
                  const lugar = datos && datos.lugar_actividad ? ` en ${datos.lugar_actividad}` : '';
                  const mensaje = `Se le ha asignado la actividad "${nombre}" el ${fecha}${hora}${lugar}.`;
                  notificarVarios(ids, 1, idSolicitud, mensaje);
                });
              }

              res.status(201).json({ mensaje: 'Solicitud creada correctamente', id: idSolicitud });
            });
            return;
          }
          const actual = insertsPendientes[i];
          conexion.query(actual.sql, actual.values, (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: actual.msg });
              });
            }
            i++;
            ejecutarSiguiente();
          });
        }
        ejecutarSiguiente();
      }
    );
  });
});

// PUT - Actualizar solicitud
router.put('/solicitudes/:id', soloLectura, (req, res) => {
  const id = parseInt(req.params.id);
  const {
    idSolicitante,
    idEstadoActividad,
    idPrioridad,
    fechaCreacion,
    fechaActividad,
    fechaFinActividad,
    horaInicio,
    horaFin,
    nombreActividad,
    descripcionActividad,
    lugarActividad,
    personalAsignado,
    recursosAsignados
  } = req.body;

  if (fechaActividad && fechaFinActividad && fechaFinActividad < fechaActividad) {
    return res.status(400).json({ mensaje: 'La fecha fin no puede ser anterior a la fecha inicio' });
  }

  // Leer valores actuales antes de editar (para detectar cambios y notificar)
  const sqlAntes = `
    SELECT fecha_actividad, fecha_fin_actividad, hora_inicio, hora_fin, lugar_actividad
    FROM solicitud_actividad WHERE id_solicitud = ?
  `;
  const sqlAsignadosAntes = 'SELECT id_usuario FROM asignacion_usuario WHERE id_solicitud = ?';

  conexion.query(sqlAntes, [id], (errorAntes, resAntes) => {
    const antes = (errorAntes || !resAntes || resAntes.length === 0) ? null : resAntes[0];

    conexion.query(sqlAsignadosAntes, [id], (errorAsig, resAsig) => {
      const asignadosAntes = (errorAsig || !resAsig) ? [] : resAsig.map((r) => r.id_usuario);

      ejecutarActualizacion(antes, asignadosAntes);
    });
  });

  function ejecutarActualizacion(antes, asignadosAntes) {

  // Normaliza valores para comparar (mysql2 puede devolver Date u objeto)
  function normFecha(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) {
      const m = String(v.getMonth() + 1).padStart(2, '0');
      const d = String(v.getDate()).padStart(2, '0');
      return `${v.getFullYear()}-${m}-${d}`;
    }
    return String(v).split(' ')[0].slice(0, 10);
  }

  function normHora(v) {
    if (v === null || v === undefined) return '';
    return String(v).slice(0, 5);
  }

  // Notificar cambios de fecha/horario/lugar y personal nuevo (fire and forget)
  function notificarCambios() {
    const idActor = req.usuario.id_usuario;

    // a) Detectar cambios en fechas, horario o lugar
    if (antes) {
      const campos = [
        { key: 'fecha_actividad', etiqueta: 'fecha de actividad', norm: normFecha },
        { key: 'fecha_fin_actividad', etiqueta: 'fecha fin', norm: normFecha },
        { key: 'hora_inicio', etiqueta: 'hora inicio', norm: normHora },
        { key: 'hora_fin', etiqueta: 'hora fin', norm: normHora },
        { key: 'lugar_actividad', etiqueta: 'lugar', norm: (v) => (v || '').toString().trim() }
      ];
      const nuevosValores = {
        fecha_actividad: fechaActividad,
        fecha_fin_actividad: fechaFinActividad || fechaActividad,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        lugar_actividad: lugarActividad
      };

      const cambiados = campos.filter((c) => c.norm(antes[c.key]) !== c.norm(nuevosValores[c.key]));

      if (cambiados.length > 0) {
        obtenerDatosSolicitud(id, (datos) => {
          const nombre = datos ? datos.nombre_actividad : nombreActividad;
          const detalles = cambiados.map((c) => {
            if (c.norm(nuevosValores[c.key]) === '') return `${c.etiqueta}: sin dato`;
            if (c.key === 'fecha_actividad' || c.key === 'fecha_fin_actividad') {
              return `${c.etiqueta}: ${formatearFecha(nuevosValores[c.key])}`;
            }
            if (c.key === 'hora_inicio' || c.key === 'hora_fin') {
              return `${c.etiqueta}: ${formatearHora(nuevosValores[c.key])}`;
            }
            return `${c.etiqueta}: ${nuevosValores[c.key]}`;
          });
          const mensaje = `Se actualizaron datos de la actividad "${nombre}" (${detalles.join(', ')}).`;
          notificarAsignados(id, 5, mensaje, idActor);
        });
      }
    }

    // b) Notificar personal recien agregado
    if (personalAsignado && Array.isArray(personalAsignado)) {
      const nuevosIds = personalAsignado
        .map((p) => (p !== null && typeof p === 'object') ? p.idUsuario : p)
        .map((v) => parseInt(v, 10))
        .filter((v) => v && !asignadosAntes.includes(v));

      if (nuevosIds.length > 0) {
        obtenerDatosSolicitud(id, (datos) => {
          const nombre = datos ? datos.nombre_actividad : nombreActividad;
          const fecha = datos ? formatearFecha(datos.fecha_actividad) : '';
          const mensaje = `Se le ha asignado la actividad "${nombre}" el ${fecha}.`;
          notificarVarios(nuevosIds, 1, id, mensaje);
        });
      }
    }
  }

  // Sincroniza recursos de la solicitud (delete + insert) y luego llama a callback
  function sincronizarRecursos(callback) {
    if (!recursosAsignados || !Array.isArray(recursosAsignados)) {
      return callback();
    }

    const sqlDeleteR = 'DELETE FROM asignacion_recurso WHERE id_solicitud = ?';
    conexion.query(sqlDeleteR, [id], (error) => {
      if (error) {
        return conexion.rollback(() => {
          console.error('ERROR MYSQL:', error);
          res.status(500).json({ mensaje: 'Error al actualizar recursos' });
        });
      }

      if (recursosAsignados.length === 0) {
        return callback();
      }

      const sqlInsertR = 'INSERT INTO asignacion_recurso (id_solicitud, id_recurso, cantidad, fecha_asignacion, observacion) VALUES ?';
      const valoresR = recursosAsignados.map((r) => {
        const idRecurso = (r !== null && typeof r === 'object') ? r.idRecurso : r;
        const cantidad = (r !== null && typeof r === 'object') ? (r.cantidad || 1) : 1;
        const observacion = (r !== null && typeof r === 'object') ? (r.observacion || null) : null;
        return [id, parseInt(idRecurso), cantidad, new Date(), observacion];
      });

      conexion.query(sqlInsertR, [valoresR], (error) => {
        if (error) {
          return conexion.rollback(() => {
            console.error('ERROR MYSQL:', error);
            res.status(500).json({ mensaje: 'Error al asignar recursos' });
          });
        }
        callback();
      });
    });
  }

  function finalizar() {
    conexion.commit((error) => {
      if (error) {
        return conexion.rollback(() => {
          console.error('ERROR MYSQL:', error);
          res.status(500).json({ mensaje: 'Error al confirmar cambios' });
        });
      }
      notificarCambios();
      res.json({ mensaje: 'Solicitud actualizada correctamente' });
    });
  }

  conexion.beginTransaction((error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar transaccion' });
    }

    const sql = `
      UPDATE solicitud_actividad SET
        id_solicitante = ?,
        id_estado_actividad = ?,
        id_prioridad = ?,
        fecha_creacion = COALESCE(?, fecha_creacion),
        fecha_actividad = ?,
        fecha_fin_actividad = ?,
        hora_inicio = ?,
        hora_fin = ?,
        nombre_actividad = ?,
        descripcion_actividad = ?,
        lugar_actividad = ?
      WHERE id_solicitud = ?
    `;

    conexion.query(
      sql,
      [
        idSolicitante,
        idEstadoActividad,
        idPrioridad,
        fechaCreacion || null,
        fechaActividad,
        fechaFinActividad || fechaActividad,
        horaInicio,
        horaFin,
        nombreActividad,
        descripcionActividad || null,
        lugarActividad,
        id
      ],
      (error) => {
        if (error) {
          console.error('ERROR MYSQL:', error);
          return conexion.rollback(() => {
            res.status(500).json({ mensaje: 'Error al actualizar la solicitud' });
          });
        }

        if (personalAsignado && Array.isArray(personalAsignado)) {
          const sqlDelete = 'DELETE FROM asignacion_usuario WHERE id_solicitud = ?';
          conexion.query(sqlDelete, [id], (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al actualizar responsables' });
              });
            }

            if (personalAsignado.length === 0) {
              sincronizarRecursos(finalizar);
              return;
            }

            const sqlInsert = 'INSERT INTO asignacion_usuario (id_solicitud, id_usuario, fecha_asignacion) VALUES ?';
            const valores = personalAsignado.map(p => [
              id,
              parseInt((p !== null && typeof p === 'object') ? p.idUsuario : p),
              new Date()
            ]);
            conexion.query(sqlInsert, [valores], (error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({ mensaje: 'Error al asignar responsables' });
                });
              }
              sincronizarRecursos(finalizar);
            });
          });
        } else {
          sincronizarRecursos(finalizar);
        }
      }
    );
  });
  } // fin ejecutarActualizacion
});

// DELETE - Eliminar solicitud (limpia registros relacionados)
router.delete('/solicitudes/:id', soloLectura, (req, res) => {
  const { id } = req.params;

  conexion.beginTransaction((error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar transaccion' });
    }

    const sqlVerificar = 'SELECT id_solicitud FROM solicitud_actividad WHERE id_solicitud = ?';
    conexion.query(sqlVerificar, [id], (error, resultados) => {
      if (error) {
        return conexion.rollback(() => {
          console.error('ERROR MYSQL:', error);
          res.status(500).json({ mensaje: 'Error al buscar la solicitud' });
        });
      }
      if (resultados.length === 0) {
        return conexion.rollback(() => {
          res.status(404).json({ mensaje: 'Solicitud no encontrada' });
        });
      }

      const deletes = [
        'DELETE FROM notificacion_usuario WHERE id_solicitud = ?',
        'DELETE FROM historial_reportes WHERE id_solicitud = ?',
        'DELETE FROM historial_estado_actividad WHERE id_solicitud = ?',
        'DELETE FROM asignacion_recurso WHERE id_solicitud = ?',
        'DELETE FROM asignacion_usuario WHERE id_solicitud = ?',
        'DELETE FROM detalle_solicitud WHERE id_solicitud = ?'
      ];

      let i = 0;
      function ejecutarDelete() {
        if (i >= deletes.length) {
          const sqlEliminar = 'DELETE FROM solicitud_actividad WHERE id_solicitud = ?';
          conexion.query(sqlEliminar, [id], (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al eliminar la solicitud' });
              });
            }
            conexion.commit((error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({ mensaje: 'Error al confirmar eliminacion' });
                });
              }
              res.json({ mensaje: 'Solicitud eliminada correctamente' });
            });
          });
          return;
        }
        conexion.query(deletes[i], [id], (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error('ERROR MYSQL:', error);
              res.status(500).json({ mensaje: 'Error al eliminar registros relacionados' });
            });
          }
          i++;
          ejecutarDelete();
        });
      }
      ejecutarDelete();
    });
  });
});

module.exports = router;
