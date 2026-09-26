const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloLectura } = require('../middleware/roles');

router.use(verificarToken);

// =========================================================
// ASIGNACION DE PERSONAL
// =========================================================

// GET - Listar personal asignado a una solicitud
router.get('/solicitudes/:id/asignaciones-usuario', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      au.id_asignacion_usuario,
      au.fecha_asignacion,
      au.observacion,
      du.id_usuario,
      du.primer_nombre,
      du.segundo_nombre,
      du.primer_apellido,
      du.segundo_apellido,
      ca.nombre_cargo
    FROM asignacion_usuario au
    INNER JOIN datos_usuario du ON au.id_usuario = du.id_usuario
    INNER JOIN cargo_usuario ca ON du.id_cargo = ca.id_cargo
    WHERE au.id_solicitud = ?
  `;
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener personal asignado' });
    }
    res.json(resultados);
  });
});

// POST - Asignar personal a una solicitud
router.post('/solicitudes/:id/asignaciones-usuario', soloLectura, (req, res) => {
  const { id } = req.params;
  const { idUsuario, observacion } = req.body;

  // Verificar que el usuario no este ya asignado
  const sqlVerificar = 'SELECT id_asignacion_usuario FROM asignacion_usuario WHERE id_solicitud = ? AND id_usuario = ?';
  conexion.query(sqlVerificar, [id, idUsuario], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al verificar asignacion' });
    }

    if (resultados.length > 0) {
      return res.status(400).json({ mensaje: 'Este usuario ya esta asignado a esta solicitud' });
    }

    const sql = 'INSERT INTO asignacion_usuario (id_solicitud, id_usuario, fecha_asignacion, observacion) VALUES (?, ?, NOW(), ?)';
    conexion.query(sql, [id, idUsuario, observacion || null], (error, resultado) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al asignar personal' });
      }
      res.status(201).json({
        mensaje: 'Personal asignado correctamente',
        id: resultado.insertId
      });
    });
  });
});

// DELETE - Eliminar asignacion de personal
router.delete('/solicitudes/:id/asignaciones-usuario/:idAsignacion', soloLectura, (req, res) => {
  const { idAsignacion } = req.params;
  const sql = 'DELETE FROM asignacion_usuario WHERE id_asignacion_usuario = ?';
  conexion.query(sql, [idAsignacion], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar asignacion' });
    }
    res.json({ mensaje: 'Asignacion eliminada correctamente' });
  });
});

// =========================================================
// ASIGNACION DE RECURSOS
// =========================================================

// GET - Listar recursos asignados a una solicitud
router.get('/solicitudes/:id/asignaciones-recurso', (req, res) => {
  const { id } = req.params;
  const sql = `
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
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener recursos asignados' });
    }
    res.json(resultados);
  });
});

// POST - Asignar recurso a una solicitud
router.post('/solicitudes/:id/asignaciones-recurso', soloLectura, (req, res) => {
  const { id } = req.params;
  const { idRecurso, cantidad, observacion } = req.body;

  // Verificar que el recurso no este ya asignado
  const sqlVerificar = 'SELECT id_asignacion_recurso FROM asignacion_recurso WHERE id_solicitud = ? AND id_recurso = ?';
  conexion.query(sqlVerificar, [id, idRecurso], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al verificar asignacion' });
    }

    if (resultados.length > 0) {
      return res.status(400).json({ mensaje: 'Este recurso ya esta asignado a esta solicitud' });
    }

    const sql = 'INSERT INTO asignacion_recurso (id_solicitud, id_recurso, cantidad, fecha_asignacion, observacion) VALUES (?, ?, ?, NOW(), ?)';
    conexion.query(sql, [id, idRecurso, cantidad || 1, observacion || null], (error, resultado) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al asignar recurso' });
      }
      res.status(201).json({
        mensaje: 'Recurso asignado correctamente',
        id: resultado.insertId
      });
    });
  });
});

// DELETE - Eliminar asignacion de recurso
router.delete('/solicitudes/:id/asignaciones-recurso/:idAsignacion', soloLectura, (req, res) => {
  const { idAsignacion } = req.params;
  const sql = 'DELETE FROM asignacion_recurso WHERE id_asignacion_recurso = ?';
  conexion.query(sql, [idAsignacion], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar asignacion' });
    }
    res.json({ mensaje: 'Asignacion eliminada correctamente' });
  });
});

// =========================================================
// DETALLE DE SOLICITUD
// =========================================================

// GET - Listar detalles de una solicitud
router.get('/solicitudes/:id/detalles', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT id_detalle_solicitud, descripcion_detalle, cantidad FROM detalle_solicitud WHERE id_solicitud = ?';
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener detalles' });
    }
    res.json(resultados);
  });
});

// POST - Agregar detalle a una solicitud
router.post('/solicitudes/:id/detalles', soloLectura, (req, res) => {
  const { id } = req.params;
  const { descripcionDetalle, cantidad } = req.body;
  const sql = 'INSERT INTO detalle_solicitud (id_solicitud, descripcion_detalle, cantidad) VALUES (?, ?, ?)';
  conexion.query(sql, [id, descripcionDetalle, cantidad], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al agregar detalle' });
    }
    res.status(201).json({
      mensaje: 'Detalle agregado correctamente',
      id: resultado.insertId
    });
  });
});

// PUT - Actualizar detalle
router.put('/solicitudes/:id/detalles/:idDetalle', soloLectura, (req, res) => {
  const { idDetalle } = req.params;
  const { descripcionDetalle, cantidad } = req.body;
  const sql = 'UPDATE detalle_solicitud SET descripcion_detalle = ?, cantidad = ? WHERE id_detalle_solicitud = ?';
  conexion.query(sql, [descripcionDetalle, cantidad, idDetalle], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar detalle' });
    }
    res.json({ mensaje: 'Detalle actualizado correctamente' });
  });
});

// DELETE - Eliminar detalle
router.delete('/solicitudes/:id/detalles/:idDetalle', soloLectura, (req, res) => {
  const { idDetalle } = req.params;
  const sql = 'DELETE FROM detalle_solicitud WHERE id_detalle_solicitud = ?';
  conexion.query(sql, [idDetalle], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar detalle' });
    }
    res.json({ mensaje: 'Detalle eliminado correctamente' });
  });
});

module.exports = router;
