const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

// GET - Listar todos los solicitantes con institucion
router.get('/solicitantes', (req, res) => {
  const sql = `
    SELECT 
      s.id_solicitante,
      s.primer_nombre,
      s.segundo_nombre,
      s.primer_apellido,
      s.segundo_apellido,
      s.telefono,
      s.correo_electronico,
      s.descripcion_solicitante,
      s.id_institucion,
      i.nombre_institucion
    FROM solicitante s
    LEFT JOIN institucion i ON s.id_institucion = i.id_institucion
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener solicitantes' });
    }
    res.json(resultados);
  });
});

// GET - Obtener un solicitante por ID
router.get('/solicitantes/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      s.id_solicitante,
      s.primer_nombre,
      s.segundo_nombre,
      s.primer_apellido,
      s.segundo_apellido,
      s.telefono,
      s.correo_electronico,
      s.descripcion_solicitante,
      s.id_institucion,
      i.nombre_institucion,
      i.representante,
      i.tel_representante,
      i.tel_institucion,
      i.correo_electronico AS correo_institucion,
      i.direccion
    FROM solicitante s
    LEFT JOIN institucion i ON s.id_institucion = i.id_institucion
    WHERE s.id_solicitante = ?
  `;
  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener el solicitante' });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Solicitante no encontrado' });
    }
    res.json(resultados[0]);
  });
});

// POST - Crear solicitante
router.post('/solicitantes', (req, res) => {
  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    telefono,
    correoElectronico,
    descripcionSolicitante,
    idInstitucion
  } = req.body;

  const sql = `
    INSERT INTO solicitante (
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      telefono,
      correo_electronico,
      descripcion_solicitante,
      id_institucion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  conexion.query(
    sql,
    [
      primerNombre,
      segundoNombre || null,
      primerApellido,
      segundoApellido || null,
      telefono || null,
      correoElectronico || null,
      descripcionSolicitante || null,
      idInstitucion || null
    ],
    (error, resultado) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al crear solicitante' });
      }
      res.status(201).json({
        mensaje: 'Solicitante creado correctamente',
        id: resultado.insertId
      });
    }
  );
});

// PUT - Actualizar solicitante
router.put('/solicitantes/:id', (req, res) => {
  const { id } = req.params;
  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    telefono,
    correoElectronico,
    descripcionSolicitante,
    idInstitucion
  } = req.body;

  const sql = `
    UPDATE solicitante SET
      primer_nombre = ?,
      segundo_nombre = ?,
      primer_apellido = ?,
      segundo_apellido = ?,
      telefono = ?,
      correo_electronico = ?,
      descripcion_solicitante = ?,
      id_institucion = ?
    WHERE id_solicitante = ?
  `;

  conexion.query(
    sql,
    [
      primerNombre,
      segundoNombre || null,
      primerApellido,
      segundoApellido || null,
      telefono || null,
      correoElectronico || null,
      descripcionSolicitante || null,
      idInstitucion || null,
      id
    ],
    (error) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar solicitante' });
      }
      res.json({ mensaje: 'Solicitante actualizado correctamente' });
    }
  );
});

// DELETE - Eliminar solicitante
router.delete('/solicitantes/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM solicitante WHERE id_solicitante = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar solicitante' });
    }
    res.json({ mensaje: 'Solicitante eliminado correctamente' });
  });
});

module.exports = router;
