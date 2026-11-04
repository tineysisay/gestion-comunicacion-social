const conexion = require('../db');

// Admin (1) y Desarrollador (7) tienen acceso total.
// El Desarrollador existe para poder rescatar cuentas (ej. si el admin olvida su contrasena).
const soloAdmin = (req, res, next) => {
  if (req.usuario.id_rol !== 1 && req.usuario.id_rol !== 7) {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
  }
  next();
};

const soloAdminYJefe = (req, res, next) => {
  if (req.usuario.id_rol !== 1 && req.usuario.id_rol !== 3) {
    return res.status(403).json({ mensaje: 'Acceso solo para administradores y jefes' });
  }
  next();
};

const soloLectura = (req, res, next) => {
  if (req.usuario.id_rol === 2 || req.usuario.id_rol === 3) {
    if (req.method !== 'GET') {
      return res.status(403).json({ mensaje: 'No tiene permisos para realizar esta accion' });
    }
  }
  next();
};

// Admin/Desarrollador pasa siempre; el resto solo si esta asignado a la solicitud (req.params.id)
const soloAdminOAsignado = (req, res, next) => {
  if (req.usuario.id_rol === 1 || req.usuario.id_rol === 7) {
    return next();
  }
  const idSolicitud = req.params.id;
  const sql = 'SELECT 1 FROM asignacion_usuario WHERE id_solicitud = ? AND id_usuario = ?';
  conexion.query(sql, [idSolicitud, req.usuario.id_usuario], (error, filas) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al verificar la asignacion' });
    }
    if (!filas || filas.length === 0) {
      return res.status(403).json({ mensaje: 'No esta asignado a esta solicitud' });
    }
    next();
  });
};

module.exports = { soloAdmin, soloAdminYJefe, soloLectura, soloAdminOAsignado };
