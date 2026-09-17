const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloLectura } = require('../middleware/roles');

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
      ea.nombre_estado AS estado,
      pa.nombre_prioridad AS prioridad,
      pa.nivel_prioridad,
      CONCAT(s.primer_nombre, ' ', s.primer_apellido) AS nombre_solicitante,
      s.id_solicitante,
      CONCAT(u.primer_nombre, ' ', u.primer_apellido) AS nombre_responsable,
      u.id_usuario AS id_responsable
    FROM solicitud_actividad sa
    INNER JOIN estado_actividad ea ON sa.id_estado_actividad = ea.id_estado_actividad
    INNER JOIN prioridad_actividad pa ON sa.id_prioridad = pa.id_prioridad
    INNER JOIN solicitante s ON sa.id_solicitante = s.id_solicitante
    LEFT JOIN asignacion_usuario au ON sa.id_solicitud = au.id_solicitud
    LEFT JOIN usuario u ON au.id_usuario = u.id_usuario
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
    fechaActividad,
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
        hora_inicio,
        hora_fin,
        nombre_actividad,
        descripcion_actividad,
        lugar_actividad
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
      sqlSolicitud,
      [
        idSolicitante,
        idEstadoActividad,
        idPrioridad,
        fechaActividad,
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
          const sqlPersonal = 'INSERT INTO asignacion_usuario (id_solicitud, id_usuario, fecha_asignacion, observacion) VALUES ?';
          const valoresPersonal = personalAsignado.map(p => [idSolicitud, p.idUsuario, new Date(), p.observacion || null]);
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
  const { id } = req.params;
  const {
    idSolicitante,
    idEstadoActividad,
    idPrioridad,
    fechaActividad,
    horaInicio,
    horaFin,
    nombreActividad,
    descripcionActividad,
    lugarActividad,
    personalAsignado
  } = req.body;

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
        fecha_actividad = ?,
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
        fechaActividad,
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
              conexion.commit((error) => {
                if (error) {
                  return conexion.rollback(() => {
                    console.error('ERROR MYSQL:', error);
                    res.status(500).json({ mensaje: 'Error al confirmar cambios' });
                  });
                }
                res.json({ mensaje: 'Solicitud actualizada correctamente' });
              });
              return;
            }

            const sqlInsert = 'INSERT INTO asignacion_usuario (id_solicitud, id_usuario, fecha_asignacion) VALUES ?';
            const valores = personalAsignado.map(idUsuario => [id, idUsuario, new Date()]);
            conexion.query(sqlInsert, [valores], (error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({ mensaje: 'Error al asignar responsables' });
                });
              }
              conexion.commit((error) => {
                if (error) {
                  return conexion.rollback(() => {
                    console.error('ERROR MYSQL:', error);
                    res.status(500).json({ mensaje: 'Error al confirmar cambios' });
                  });
                }
                res.json({ mensaje: 'Solicitud actualizada correctamente' });
              });
            });
          });
        } else {
          conexion.commit((error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al confirmar cambios' });
              });
            }
            res.json({ mensaje: 'Solicitud actualizada correctamente' });
          });
        }
      }
    );
  });
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
