const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

// GET - Listar todos los recursos con tipo de recurso
router.get('/recursos', (req, res) => {
  const sql = `
    SELECT 
      r.id_recurso,
      r.nombre_recurso,
      r.descripcion_recurso,
      r.estado_recurso,
      r.id_tipo_recurso,
      t.nombre_tipo_recurso
    FROM recurso r
    INNER JOIN tipo_recurso t ON r.id_tipo_recurso = t.id_tipo_recurso
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener recursos' });
    }
    res.json(resultados);
  });
});

// GET - Obtener un recurso por ID
router.get('/recursos/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      r.id_recurso,
      r.nombre_recurso,
      r.descripcion_recurso,
      r.estado_recurso,
      r.id_tipo_recurso,
      t.nombre_tipo_recurso
    FROM recurso r
    INNER JOIN tipo_recurso t ON r.id_tipo_recurso = t.id_tipo_recurso
    WHERE r.id_recurso = ?
  `;
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener el recurso' });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado' });
    }
    res.json(resultados[0]);
  });
});

// POST - Crear recurso
router.post('/recursos', (req, res) => {
  const { nombreRecurso, descripcionRecurso, estadoRecurso, idTipoRecurso } = req.body;
  const sql = 'INSERT INTO recurso (nombre_recurso, descripcion_recurso, estado_recurso, id_tipo_recurso) VALUES (?, ?, ?, ?)';
  conexion.query(sql, [nombreRecurso, descripcionRecurso || null, estadoRecurso, idTipoRecurso], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear recurso' });
    }
    res.status(201).json({ mensaje: 'Recurso creado correctamente', id: resultado.insertId });
  });
});

// PUT - Actualizar recurso
router.put('/recursos/:id', (req, res) => {
  const { id } = req.params;
  const { nombreRecurso, descripcionRecurso, estadoRecurso, idTipoRecurso } = req.body;
  const sql = 'UPDATE recurso SET nombre_recurso = ?, descripcion_recurso = ?, estado_recurso = ?, id_tipo_recurso = ? WHERE id_recurso = ?';
  conexion.query(sql, [nombreRecurso, descripcionRecurso || null, estadoRecurso, idTipoRecurso, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar recurso' });
    }
    res.json({ mensaje: 'Recurso actualizado correctamente' });
  });
});

// DELETE - Eliminar recurso
router.delete('/recursos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM recurso WHERE id_recurso = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar recurso' });
    }
    res.json({ mensaje: 'Recurso eliminado correctamente' });
  });
});

module.exports = router;
