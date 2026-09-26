const soloAdmin = (req, res, next) => {
  if (req.usuario.id_rol !== 1) {
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

module.exports = { soloAdmin, soloAdminYJefe, soloLectura };
