const conexion = require('../db');

// =========================================================
// HELP DE NOTIFICACIONES
// Todas las funciones son "fire and forget": si fallan solo
// registran el error en consola y NUNCA rompen la operacion
// principal que las invoca.
// =========================================================

// Obtener ids de los usuarios asignados a una solicitud
function obtenerAsignados(idSolicitud, excluirId, callback) {
  const sql = 'SELECT id_usuario FROM asignacion_usuario WHERE id_solicitud = ?';
  conexion.query(sql, [idSolicitud], (error, resultados) => {
    if (error) {
      console.error('ERROR NOTIFICACION (obtenerAsignados):', error);
      return callback([]);
    }
    let ids = resultados.map((r) => r.id_usuario);
    if (excluirId) {
      ids = ids.filter((id) => id !== excluirId);
    }
    callback(ids);
  });
}

// Insertar una notificacion individual
function notificarUno(idUsuario, idTipoNotificacion, idSolicitud, mensaje, callback) {
  const sql = `
    INSERT INTO notificacion_usuario
      (id_usuario, id_tipo_notificacion, id_solicitud, mensaje, fecha_notificacion, leida)
    VALUES (?, ?, ?, ?, NOW(), FALSE)
  `;
  conexion.query(sql, [idUsuario, idTipoNotificacion, idSolicitud, mensaje], (error) => {
    if (error) {
      console.error('ERROR NOTIFICACION (notificarUno):', error);
    }
    if (callback) callback();
  });
}

// Notificar a un solo usuario
function notificarUsuario(idUsuario, idTipoNotificacion, idSolicitud, mensaje) {
  notificarUno(idUsuario, idTipoNotificacion, idSolicitud, mensaje);
}

// Notificar a todos los asignados de una solicitud (opcionalmente excluyendo a alguien)
function notificarAsignados(idSolicitud, idTipoNotificacion, mensaje, excluirId) {
  obtenerAsignados(idSolicitud, excluirId, (ids) => {
    ids.forEach((idUsuario) => {
      notificarUno(idUsuario, idTipoNotificacion, idSolicitud, mensaje);
    });
  });
}

// Notificar a una lista explicita de usuarios
function notificarVarios(idsUsuarios, idTipoNotificacion, idSolicitud, mensaje) {
  (idsUsuarios || []).forEach((idUsuario) => {
    notificarUno(idUsuario, idTipoNotificacion, idSolicitud, mensaje);
  });
}

// Obtener datos basicos de una solicitud (nombre, fechas, horario, lugar)
function obtenerDatosSolicitud(idSolicitud, callback) {
  const sql = `
    SELECT
      nombre_actividad,
      fecha_actividad,
      fecha_fin_actividad,
      hora_inicio,
      hora_fin,
      lugar_actividad
    FROM solicitud_actividad
    WHERE id_solicitud = ?
  `;
  conexion.query(sql, [idSolicitud], (error, resultados) => {
    if (error) {
      console.error('ERROR NOTIFICACION (obtenerDatosSolicitud):', error);
      return callback(null);
    }
    callback(resultados.length > 0 ? resultados[0] : null);
  });
}

// Formatea una fecha a DD/MM/YYYY (acepta Date de mysql2 o string)
function formatearFecha(fecha) {
  if (!fecha) return '';
  if (fecha instanceof Date) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }
  const parte = String(fecha).split(' ')[0].split('-');
  if (parte.length !== 3) return String(fecha);
  return `${parte[2]}/${parte[1]}/${parte[0]}`;
}

// Formatea una hora HH:MM:SS a HH:MM
function formatearHora(hora) {
  if (!hora) return '';
  const partes = String(hora).split(':');
  return `${partes[0]}:${partes[1]}`;
}

module.exports = {
  obtenerAsignados,
  notificarUno,
  notificarUsuario,
  notificarAsignados,
  notificarVarios,
  obtenerDatosSolicitud,
  formatearFecha,
  formatearHora
};
