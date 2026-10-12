const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloAdmin } = require('../middleware/roles');

router.use(verificarToken);
router.use(soloAdmin);

// GET - Estadisticas generales para dashboard
router.get('/dashboard/estadisticas', (req, res) => {
  const sqlEstados = `
    SELECT 
      ea.nombre_estado,
      COUNT(sa.id_solicitud) AS total
    FROM estado_actividad ea
    LEFT JOIN solicitud_actividad sa ON ea.id_estado_actividad = sa.id_estado_actividad
    GROUP BY ea.id_estado_actividad, ea.nombre_estado
    ORDER BY ea.orden_kanban
  `;

  const sqlPrioridades = `
    SELECT 
      pa.nombre_prioridad,
      COUNT(sa.id_solicitud) AS total
    FROM prioridad_actividad pa
    LEFT JOIN solicitud_actividad sa ON pa.id_prioridad = sa.id_prioridad
    GROUP BY pa.id_prioridad, pa.nombre_prioridad
    ORDER BY pa.nivel_prioridad
  `;

  const sqlTotal = 'SELECT COUNT(*) AS total FROM solicitud_actividad';

  const sqlNoLeidas = 'SELECT COUNT(*) AS total FROM notificacion_usuario WHERE leida = FALSE AND id_usuario = ?';

  conexion.query(sqlEstados, (error, estados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener estadisticas por estado' });
    }

    conexion.query(sqlPrioridades, (error, prioridades) => {
      if (error) {
        console.error('ERROR MYSQL:', error);
        return res.status(500).json({ mensaje: 'Error al obtener estadisticas por prioridad' });
      }

      conexion.query(sqlTotal, (error, total) => {
        if (error) {
          console.error('ERROR MYSQL:', error);
          return res.status(500).json({ mensaje: 'Error al obtener total de solicitudes' });
        }

        conexion.query(sqlNoLeidas, [req.usuario.id_usuario], (error, noLeidas) => {
          if (error) {
            console.error('ERROR MYSQL:', error);
            return res.status(500).json({ mensaje: 'Error al obtener notificaciones no leidas' });
          }

          res.json({
            totalSolicitudes: total[0].total,
            porEstado: estados,
            porPrioridad: prioridades,
            notificacionesNoLeidas: noLeidas[0].total
          });
        });
      });
    });
  });
});

// GET - Solicitudes agrupadas por estado
router.get('/reportes/solicitudes-por-estado', (req, res) => {
  const sql = `
    SELECT 
      ea.nombre_estado,
      COUNT(sa.id_solicitud) AS total,
      ea.orden_kanban
    FROM estado_actividad ea
    LEFT JOIN solicitud_actividad sa ON ea.id_estado_actividad = sa.id_estado_actividad
    GROUP BY ea.id_estado_actividad, ea.nombre_estado, ea.orden_kanban
    ORDER BY ea.orden_kanban
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener reporte por estado' });
    }
    res.json(resultados);
  });
});

// GET - Solicitudes agrupadas por prioridad
router.get('/reportes/solicitudes-por-prioridad', (req, res) => {
  const sql = `
    SELECT 
      pa.nombre_prioridad,
      COUNT(sa.id_solicitud) AS total,
      pa.nivel_prioridad
    FROM prioridad_actividad pa
    LEFT JOIN solicitud_actividad sa ON pa.id_prioridad = sa.id_prioridad
    GROUP BY pa.id_prioridad, pa.nombre_prioridad, pa.nivel_prioridad
    ORDER BY pa.nivel_prioridad
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener reporte por prioridad' });
    }
    res.json(resultados);
  });
});

// GET - Solicitudes por rango de fechas
router.get('/reportes/solicitudes-por-fecha', (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  let sql = `
    SELECT 
      sa.id_solicitud,
      sa.nombre_actividad,
      sa.fecha_actividad,
      COALESCE(sa.fecha_fin_actividad, sa.fecha_actividad) AS fecha_fin_actividad,
      sa.hora_inicio,
      sa.hora_fin,
      sa.lugar_actividad,
      ea.nombre_estado,
      pa.nombre_prioridad,
      CONCAT(s.primer_nombre, ' ', s.primer_apellido) AS solicitante
    FROM solicitud_actividad sa
    INNER JOIN estado_actividad ea ON sa.id_estado_actividad = ea.id_estado_actividad
    INNER JOIN prioridad_actividad pa ON sa.id_prioridad = pa.id_prioridad
    INNER JOIN solicitante s ON sa.id_solicitante = s.id_solicitante
  `;

  const params = [];

  if (fechaInicio && fechaFin) {
    sql += ' WHERE sa.fecha_actividad <= ? AND COALESCE(sa.fecha_fin_actividad, sa.fecha_actividad) >= ?';
    params.push(fechaFin, fechaInicio);
  }

  sql += ' ORDER BY sa.fecha_actividad DESC';

  conexion.query(sql, params, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener reporte por fecha' });
    }
    res.json(resultados);
  });
});

// GET - Solicitudes agrupadas por institucion
router.get('/reportes/solicitudes-por-institucion', (req, res) => {
  const sql = `
    SELECT 
      i.nombre_institucion,
      COUNT(sa.id_solicitud) AS total
    FROM institucion i
    INNER JOIN solicitante s ON i.id_institucion = s.id_institucion
    INNER JOIN solicitud_actividad sa ON s.id_solicitante = sa.id_solicitante
    GROUP BY i.id_institucion, i.nombre_institucion
    ORDER BY total DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener reporte por institucion' });
    }
    res.json(resultados);
  });
});

// GET - Carga de trabajo por usuario asignado
router.get('/reportes/carga-por-usuario', (req, res) => {
  const sql = `
    SELECT 
      du.id_usuario,
      CONCAT(du.primer_nombre, ' ', du.primer_apellido) AS nombre_usuario,
      ca.nombre_cargo,
      COUNT(au.id_solicitud) AS total_asignaciones
    FROM datos_usuario du
    INNER JOIN cargo_usuario ca ON du.id_cargo = ca.id_cargo
    LEFT JOIN asignacion_usuario au ON du.id_usuario = au.id_usuario
    GROUP BY du.id_usuario, nombre_usuario, ca.nombre_cargo
    ORDER BY total_asignaciones DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener carga por usuario' });
    }
    res.json(resultados);
  });
});

// GET - Actividades detalladas por usuario
router.get('/reportes/actividades-por-usuario', (req, res) => {
  const sql = `
    SELECT 
      du.id_usuario,
      CONCAT(du.primer_nombre, ' ', du.primer_apellido) AS nombre_usuario,
      ca.nombre_cargo,
      sa.id_solicitud,
      sa.nombre_actividad,
      sa.fecha_actividad,
      COALESCE(sa.fecha_fin_actividad, sa.fecha_actividad) AS fecha_fin_actividad,
      sa.lugar_actividad,
      ea.nombre_estado,
      pa.nombre_prioridad,
      CONCAT(s.primer_nombre, ' ', s.primer_apellido) AS solicitante
    FROM datos_usuario du
    INNER JOIN cargo_usuario ca ON du.id_cargo = ca.id_cargo
    INNER JOIN asignacion_usuario au ON du.id_usuario = au.id_usuario
    INNER JOIN solicitud_actividad sa ON au.id_solicitud = sa.id_solicitud
    INNER JOIN estado_actividad ea ON sa.id_estado_actividad = ea.id_estado_actividad
    INNER JOIN prioridad_actividad pa ON sa.id_prioridad = pa.id_prioridad
    INNER JOIN solicitante s ON sa.id_solicitante = s.id_solicitante
    ORDER BY du.primer_nombre, sa.fecha_actividad DESC
  `;
  conexion.query(sql, (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener actividades por usuario' });
    }
    res.json(resultados);
  });
});

module.exports = router;
