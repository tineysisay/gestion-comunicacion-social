const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloAdmin } = require('../middleware/roles');

router.use(verificarToken);

// GET - Historial de estados de una solicitud
router.get('/solicitudes/:id/historial', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      he.id_historial_estado,
      he.fecha_cambio,
      he.observacion,
      ea_anterior.nombre_estado AS estado_anterior,
      ea_nuevo.nombre_estado AS estado_nuevo,
      CONCAT(du.primer_nombre, ' ', du.primer_apellido) AS usuario_cambio
    FROM historial_estado_actividad he
    INNER JOIN estado_actividad ea_anterior ON he.id_estado_anterior = ea_anterior.id_estado_actividad
    INNER JOIN estado_actividad ea_nuevo ON he.id_estado_nuevo = ea_nuevo.id_estado_actividad
    INNER JOIN datos_usuario du ON he.id_usuario = du.id_usuario
    WHERE he.id_solicitud = ?
    ORDER BY he.fecha_cambio DESC
  `;
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener historial' });
    }
    res.json(resultados);
  });
});

// POST - Registrar cambio de estado
router.post('/solicitudes/:id/historial', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { idEstadoNuevo, observacion } = req.body;
  const idUsuario = req.usuario.id_usuario;

  const sqlVerificar = 'SELECT id_estado_actividad FROM solicitud_actividad WHERE id_solicitud = ?';
  conexion.query(sqlVerificar, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al verificar solicitud' });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    const idEstadoAnterior = resultados[0].id_estado_actividad;

    if (idEstadoAnterior === idEstadoNuevo) {
      return res.status(400).json({ mensaje: 'El estado nuevo es igual al actual' });
    }

    conexion.beginTransaction((err) => {
      if (err) {
        console.error('ERROR MYSQL:', err);
        return res.status(500).json({ mensaje: 'Error al iniciar transaccion' });
      }

      const sql = `
        INSERT INTO historial_estado_actividad 
        (id_solicitud, id_estado_anterior, id_estado_nuevo, id_usuario, fecha_cambio, observacion) 
        VALUES (?, ?, ?, ?, NOW(), ?)
      `;
      conexion.query(sql, [id, idEstadoAnterior, idEstadoNuevo, idUsuario, observacion || null], (error, resultado) => {
        if (error) {
          return conexion.rollback(() => {
            console.error('ERROR MYSQL:', error);
            res.status(500).json({ mensaje: 'Error al registrar historial' });
          });
        }

        const sqlActualizar = 'UPDATE solicitud_actividad SET id_estado_actividad = ? WHERE id_solicitud = ?';
        conexion.query(sqlActualizar, [idEstadoNuevo, id], (error) => {
          if (error) {
            return conexion.rollback(() => {
              console.error('ERROR MYSQL:', error);
              res.status(500).json({ mensaje: 'Error al actualizar estado' });
            });
          }

          conexion.commit((error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al confirmar cambio' });
              });
            }
            res.status(201).json({
              mensaje: 'Estado actualizado correctamente',
              id: resultado.insertId
            });
          });
        });
      });
    });
  });
});

// GET - Historial de reportes de una solicitud
router.get('/solicitudes/:id/reportes', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      hr.id_historial_reporte,
      hr.fecha_reporte,
      hr.tipo_reporte,
      hr.descripcion_reporte,
      CONCAT(du.primer_nombre, ' ', du.primer_apellido) AS usuario_registro
    FROM historial_reportes hr
    INNER JOIN datos_usuario du ON hr.id_usuario = du.id_usuario
    WHERE hr.id_solicitud = ?
    ORDER BY hr.fecha_reporte DESC
  `;
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener reportes' });
    }
    res.json(resultados);
  });
});

// POST - Registrar reporte
router.post('/solicitudes/:id/reportes', (req, res) => {
  const { id } = req.params;
  const { tipoReporte, descripcionReporte } = req.body;
  const idUsuario = req.usuario.id_usuario;

  const sql = `
    INSERT INTO historial_reportes 
    (id_solicitud, id_usuario, fecha_reporte, tipo_reporte, descripcion_reporte) 
    VALUES (?, ?, NOW(), ?, ?)
  `;
  conexion.query(sql, [id, idUsuario, tipoReporte, descripcionReporte || null], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al registrar reporte' });
    }
    res.status(201).json({
      mensaje: 'Reporte registrado correctamente',
      id: resultado.insertId
    });
  });
});

module.exports = router;
