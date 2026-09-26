const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloAdmin } = require('../middleware/roles');

router.use(verificarToken);

// =========================================================
// TIPOS DE EMPLEADO
// =========================================================

router.get('/tipos-empleado', (req, res) => {
  const sql = 'SELECT id_tipo_empleado, nombre_tipo_empleado, descripcion_tipo_empleado FROM tipo_empleado';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener tipos de empleado' });
    }
    res.json(resultados);
  });
});

router.post('/tipos-empleado', soloAdmin, (req, res) => {
  const { nombreTipoEmpleado, descripcionTipoEmpleado } = req.body;
  const sql = 'INSERT INTO tipo_empleado (nombre_tipo_empleado, descripcion_tipo_empleado) VALUES (?, ?)';
  conexion.query(sql, [nombreTipoEmpleado, descripcionTipoEmpleado], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear tipo de empleado' });
    }
    res.status(201).json({ mensaje: 'Tipo de empleado creado correctamente', id: resultado.insertId });
  });
});

router.put('/tipos-empleado/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreTipoEmpleado, descripcionTipoEmpleado } = req.body;
  const sql = 'UPDATE tipo_empleado SET nombre_tipo_empleado = ?, descripcion_tipo_empleado = ? WHERE id_tipo_empleado = ?';
  conexion.query(sql, [nombreTipoEmpleado, descripcionTipoEmpleado, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar tipo de empleado' });
    }
    res.json({ mensaje: 'Tipo de empleado actualizado correctamente' });
  });
});

router.delete('/tipos-empleado/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tipo_empleado WHERE id_tipo_empleado = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar tipo de empleado' });
    }
    res.json({ mensaje: 'Tipo de empleado eliminado correctamente' });
  });
});

// =========================================================
// CARGOS DE USUARIO
// =========================================================

router.get('/cargos', (req, res) => {
  const sql = `
    SELECT c.id_cargo, c.nombre_cargo, c.descripcion_cargo, c.id_tipo_empleado,
           t.nombre_tipo_empleado
    FROM cargo_usuario c
    INNER JOIN tipo_empleado t ON c.id_tipo_empleado = t.id_tipo_empleado
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener cargos' });
    }
    res.json(resultados);
  });
});

router.post('/cargos', soloAdmin, (req, res) => {
  const { nombreCargo, descripcionCargo, idTipoEmpleado } = req.body;
  const sql = 'INSERT INTO cargo_usuario (nombre_cargo, descripcion_cargo, id_tipo_empleado) VALUES (?, ?, ?)';
  conexion.query(sql, [nombreCargo, descripcionCargo, idTipoEmpleado], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear cargo' });
    }
    res.status(201).json({ mensaje: 'Cargo creado correctamente', id: resultado.insertId });
  });
});

router.put('/cargos/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreCargo, descripcionCargo, idTipoEmpleado } = req.body;
  const sql = 'UPDATE cargo_usuario SET nombre_cargo = ?, descripcion_cargo = ?, id_tipo_empleado = ? WHERE id_cargo = ?';
  conexion.query(sql, [nombreCargo, descripcionCargo, idTipoEmpleado, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar cargo' });
    }
    res.json({ mensaje: 'Cargo actualizado correctamente' });
  });
});

router.delete('/cargos/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM cargo_usuario WHERE id_cargo = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar cargo' });
    }
    res.json({ mensaje: 'Cargo eliminado correctamente' });
  });
});

// =========================================================
// ROLES DE USUARIO
// =========================================================

router.get('/roles', (req, res) => {
  const sql = 'SELECT id_rol, nombre_rol, descripcion_rol FROM rol_usuario';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener roles' });
    }
    res.json(resultados);
  });
});

router.post('/roles', soloAdmin, (req, res) => {
  const { nombreRol, descripcionRol } = req.body;
  const sql = 'INSERT INTO rol_usuario (nombre_rol, descripcion_rol) VALUES (?, ?)';
  conexion.query(sql, [nombreRol, descripcionRol], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear rol' });
    }
    res.status(201).json({ mensaje: 'Rol creado correctamente', id: resultado.insertId });
  });
});

router.put('/roles/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreRol, descripcionRol } = req.body;
  const sql = 'UPDATE rol_usuario SET nombre_rol = ?, descripcion_rol = ? WHERE id_rol = ?';
  conexion.query(sql, [nombreRol, descripcionRol, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar rol' });
    }
    res.json({ mensaje: 'Rol actualizado correctamente' });
  });
});

router.delete('/roles/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM rol_usuario WHERE id_rol = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar rol' });
    }
    res.json({ mensaje: 'Rol eliminado correctamente' });
  });
});

// =========================================================
// ESTADOS DE USUARIO
// =========================================================

router.get('/estados-usuario', (req, res) => {
  const sql = 'SELECT id_estado_usuario, nombre_estado, descripcion_estado FROM estado_usuario';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener estados de usuario' });
    }
    res.json(resultados);
  });
});

router.post('/estados-usuario', soloAdmin, (req, res) => {
  const { nombreEstado, descripcionEstado } = req.body;
  const sql = 'INSERT INTO estado_usuario (nombre_estado, descripcion_estado) VALUES (?, ?)';
  conexion.query(sql, [nombreEstado, descripcionEstado], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear estado de usuario' });
    }
    res.status(201).json({ mensaje: 'Estado de usuario creado correctamente', id: resultado.insertId });
  });
});

router.put('/estados-usuario/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreEstado, descripcionEstado } = req.body;
  const sql = 'UPDATE estado_usuario SET nombre_estado = ?, descripcion_estado = ? WHERE id_estado_usuario = ?';
  conexion.query(sql, [nombreEstado, descripcionEstado, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar estado de usuario' });
    }
    res.json({ mensaje: 'Estado de usuario actualizado correctamente' });
  });
});

router.delete('/estados-usuario/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM estado_usuario WHERE id_estado_usuario = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar estado de usuario' });
    }
    res.json({ mensaje: 'Estado de usuario eliminado correctamente' });
  });
});

// =========================================================
// TIPOS DE RECURSO
// =========================================================

router.get('/tipos-recurso', (req, res) => {
  const sql = 'SELECT id_tipo_recurso, nombre_tipo_recurso, descripcion_tipo_recurso FROM tipo_recurso';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener tipos de recurso' });
    }
    res.json(resultados);
  });
});

router.post('/tipos-recurso', soloAdmin, (req, res) => {
  const { nombreTipoRecurso, descripcionTipoRecurso } = req.body;
  const sql = 'INSERT INTO tipo_recurso (nombre_tipo_recurso, descripcion_tipo_recurso) VALUES (?, ?)';
  conexion.query(sql, [nombreTipoRecurso, descripcionTipoRecurso], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear tipo de recurso' });
    }
    res.status(201).json({ mensaje: 'Tipo de recurso creado correctamente', id: resultado.insertId });
  });
});

router.put('/tipos-recurso/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreTipoRecurso, descripcionTipoRecurso } = req.body;
  const sql = 'UPDATE tipo_recurso SET nombre_tipo_recurso = ?, descripcion_tipo_recurso = ? WHERE id_tipo_recurso = ?';
  conexion.query(sql, [nombreTipoRecurso, descripcionTipoRecurso, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar tipo de recurso' });
    }
    res.json({ mensaje: 'Tipo de recurso actualizado correctamente' });
  });
});

router.delete('/tipos-recurso/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tipo_recurso WHERE id_tipo_recurso = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar tipo de recurso' });
    }
    res.json({ mensaje: 'Tipo de recurso eliminado correctamente' });
  });
});

// =========================================================
// ESTADOS DE ACTIVIDAD
// =========================================================

router.get('/estados-actividad', (req, res) => {
  const sql = 'SELECT id_estado_actividad, nombre_estado, descripcion_estado, orden_kanban FROM estado_actividad ORDER BY orden_kanban';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener estados de actividad' });
    }
    res.json(resultados);
  });
});

router.post('/estados-actividad', soloAdmin, (req, res) => {
  const { nombreEstado, descripcionEstado, ordenKanban } = req.body;
  const sql = 'INSERT INTO estado_actividad (nombre_estado, descripcion_estado, orden_kanban) VALUES (?, ?, ?)';
  conexion.query(sql, [nombreEstado, descripcionEstado, ordenKanban], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear estado de actividad' });
    }
    res.status(201).json({ mensaje: 'Estado de actividad creado correctamente', id: resultado.insertId });
  });
});

router.put('/estados-actividad/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreEstado, descripcionEstado, ordenKanban } = req.body;
  const sql = 'UPDATE estado_actividad SET nombre_estado = ?, descripcion_estado = ?, orden_kanban = ? WHERE id_estado_actividad = ?';
  conexion.query(sql, [nombreEstado, descripcionEstado, ordenKanban, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar estado de actividad' });
    }
    res.json({ mensaje: 'Estado de actividad actualizado correctamente' });
  });
});

router.delete('/estados-actividad/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM estado_actividad WHERE id_estado_actividad = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar estado de actividad' });
    }
    res.json({ mensaje: 'Estado de actividad eliminado correctamente' });
  });
});

// =========================================================
// PRIORIDADES
// =========================================================

router.get('/prioridades', (req, res) => {
  const sql = 'SELECT id_prioridad, nombre_prioridad, descripcion_prioridad, nivel_prioridad FROM prioridad_actividad ORDER BY nivel_prioridad';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener prioridades' });
    }
    res.json(resultados);
  });
});

router.post('/prioridades', soloAdmin, (req, res) => {
  const { nombrePrioridad, descripcionPrioridad, nivelPrioridad } = req.body;
  const sql = 'INSERT INTO prioridad_actividad (nombre_prioridad, descripcion_prioridad, nivel_prioridad) VALUES (?, ?, ?)';
  conexion.query(sql, [nombrePrioridad, descripcionPrioridad, nivelPrioridad], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear prioridad' });
    }
    res.status(201).json({ mensaje: 'Prioridad creada correctamente', id: resultado.insertId });
  });
});

router.put('/prioridades/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombrePrioridad, descripcionPrioridad, nivelPrioridad } = req.body;
  const sql = 'UPDATE prioridad_actividad SET nombre_prioridad = ?, descripcion_prioridad = ?, nivel_prioridad = ? WHERE id_prioridad = ?';
  conexion.query(sql, [nombrePrioridad, descripcionPrioridad, nivelPrioridad, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar prioridad' });
    }
    res.json({ mensaje: 'Prioridad actualizada correctamente' });
  });
});

router.delete('/prioridades/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM prioridad_actividad WHERE id_prioridad = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar prioridad' });
    }
    res.json({ mensaje: 'Prioridad eliminada correctamente' });
  });
});

// =========================================================
// TIPOS DE NOTIFICACION
// =========================================================

router.get('/tipos-notificacion', (req, res) => {
  const sql = 'SELECT id_tipo_notificacion, nombre_tipo_notificacion, descripcion_tipo_notificacion FROM tipo_notificacion';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener tipos de notificacion' });
    }
    res.json(resultados);
  });
});

router.post('/tipos-notificacion', soloAdmin, (req, res) => {
  const { nombreTipoNotificacion, descripcionTipoNotificacion } = req.body;
  const sql = 'INSERT INTO tipo_notificacion (nombre_tipo_notificacion, descripcion_tipo_notificacion) VALUES (?, ?)';
  conexion.query(sql, [nombreTipoNotificacion, descripcionTipoNotificacion], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear tipo de notificacion' });
    }
    res.status(201).json({ mensaje: 'Tipo de notificacion creado correctamente', id: resultado.insertId });
  });
});

router.put('/tipos-notificacion/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreTipoNotificacion, descripcionTipoNotificacion } = req.body;
  const sql = 'UPDATE tipo_notificacion SET nombre_tipo_notificacion = ?, descripcion_tipo_notificacion = ? WHERE id_tipo_notificacion = ?';
  conexion.query(sql, [nombreTipoNotificacion, descripcionTipoNotificacion, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar tipo de notificacion' });
    }
    res.json({ mensaje: 'Tipo de notificacion actualizado correctamente' });
  });
});

router.delete('/tipos-notificacion/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tipo_notificacion WHERE id_tipo_notificacion = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar tipo de notificacion' });
    }
    res.json({ mensaje: 'Tipo de notificacion eliminado correctamente' });
  });
});

// =========================================================
// INSTITUCIONES
// =========================================================

router.get('/instituciones', (req, res) => {
  const sql = 'SELECT id_institucion, nombre_institucion, representante, tel_representante, tel_institucion, correo_electronico, direccion, descripcion_institucion FROM institucion';
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener instituciones' });
    }
    res.json(resultados);
  });
});

router.post('/instituciones', soloAdmin, (req, res) => {
  const { nombreInstitucion, representante, telRepresentante, telInstitucion, correoElectronico, direccion, descripcionInstitucion } = req.body;
  const sql = 'INSERT INTO institucion (nombre_institucion, representante, tel_representante, tel_institucion, correo_electronico, direccion, descripcion_institucion) VALUES (?, ?, ?, ?, ?, ?, ?)';
  conexion.query(sql, [nombreInstitucion, representante, telRepresentante, telInstitucion, correoElectronico, direccion, descripcionInstitucion], (error, resultado) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al crear institucion' });
    }
    res.status(201).json({ mensaje: 'Institucion creada correctamente', id: resultado.insertId });
  });
});

router.put('/instituciones/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const { nombreInstitucion, representante, telRepresentante, telInstitucion, correoElectronico, direccion, descripcionInstitucion } = req.body;
  const sql = 'UPDATE institucion SET nombre_institucion = ?, representante = ?, tel_representante = ?, tel_institucion = ?, correo_electronico = ?, direccion = ?, descripcion_institucion = ? WHERE id_institucion = ?';
  conexion.query(sql, [nombreInstitucion, representante, telRepresentante, telInstitucion, correoElectronico, direccion, descripcionInstitucion, id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al actualizar institucion' });
    }
    res.json({ mensaje: 'Institucion actualizada correctamente' });
  });
});

router.delete('/instituciones/:id', soloAdmin, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM institucion WHERE id_institucion = ?';
  conexion.query(sql, [id], (error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al eliminar institucion' });
    }
    res.json({ mensaje: 'Institucion eliminada correctamente' });
  });
});

module.exports = router;
