const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

// GET - Notificaciones del usuario autenticado
router.get('/notificaciones', (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  const sql = `
    SELECT 
      n.id_notificacion,
      n.id_solicitud,
      n.mensaje,
      n.fecha_notificacion,
      n.leida,
      tn.nombre_tipo_notificacion,
      sa.nombre_actividad
    FROM notificacion_usuario n
    INNER JOIN tipo_notificacion tn ON n.id_tipo_notificacion = tn.id_tipo_notificacion
    LEFT JOIN solicitud_actividad sa ON n.id_solicitud = sa.id_solicitud
    WHERE n.id_usuario = ?
    ORDER BY n.fecha_notificacion DESC
  `;
  conexion.query(sql, [idUsuario], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
    }
    res.json(resultados);
  });
});

// GET - Conteo de notificaciones no leidas
router.get('/notificaciones/no-leidas', (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  const sql = 'SELECT COUNT(*) AS total FROM notificacion_usuario WHERE id_usuario = ? AND leida = FALSE';
  conexion.query(sql, [idUsuario], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al contar notificaciones' });
    }
    res.json({ total: resultados[0].total });
  });
});

// PUT - Marcar notificacion como leida
router.put('/notificaciones/:id/leer', (req, res) => {
  const { id } = req.params;
  const idUsuario = req.usuario.id_usuario;
  const sql = 'UPDATE notificacion_usuario SET leida = TRUE WHERE id_notificacion = ? AND id_usuario = ?';
  conexion.query(sql, [id, idUsuario], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al marcar notificacion' });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Notificacion no encontrada' });
    }
    res.json({ mensaje: 'Notificacion marcada como leida' });
  });
});

// PUT - Marcar todas como leidas
router.put('/notificaciones/leer-todas', (req, res) => {
  const idUsuario = req.usuario.id_usuario;
  const sql = 'UPDATE notificacion_usuario SET leida = TRUE WHERE id_usuario = ? AND leida = FALSE';
  conexion.query(sql, [idUsuario], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al marcar notificaciones' });
    }
    res.json({ mensaje: 'Todas las notificaciones marcadas como leidas' });
  });
});

// DELETE - Eliminar notificacion
router.delete('/notificaciones/:id', (req, res) => {
  const { id } = req.params;
  const idUsuario = req.usuario.id_usuario;
  const sql = 'DELETE FROM notificacion_usuario WHERE id_notificacion = ? AND id_usuario = ?';
  conexion.query(sql, [id, idUsuario], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar notificacion' });
    }
    if (resultados.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Notificacion no encontrada' });
    }
    res.json({ mensaje: 'Notificacion eliminada correctamente' });
  });
});

module.exports = router;
