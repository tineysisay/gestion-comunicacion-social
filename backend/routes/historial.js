const express = require('express');
const router = express.Router();
const conexion = require('../db');
const verificarToken = require('../middleware/auth');
const { soloAdmin, soloAdminOAsignado } = require('../middleware/roles');
const { notificarAsignados, obtenerDatosSolicitud } = require('../helpers/notificar');

router.use(verificarToken);

// GET - Historial de estados de una solicitud (bitacora: solo administradores)
router.get('/solicitudes/:id/historial', soloAdmin, (req, res) => {
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

// POST - Registrar cambio de estado (admin o usuario asignado a la solicitud)
router.post('/solicitudes/:id/historial', soloAdminOAsignado, (req, res) => {
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

            // Notificar a los asignados el cambio de estado (fire and forget)
            // Tipo: 2 = AUTORIZADO, 3 = CANCELADO, 4 = CAMBIO DE ESTADO
            const estadoNum = parseInt(idEstadoNuevo, 10);
            let tipoNotificacion = 4;
            if (estadoNum === 2) tipoNotificacion = 2;
            else if (estadoNum === 5) tipoNotificacion = 3;

            obtenerDatosSolicitud(id, (datos) => {
              const nombre = datos ? datos.nombre_actividad : '';
              conexion.query('SELECT nombre_estado FROM estado_actividad WHERE id_estado_actividad = ?', [idEstadoNuevo], (errEstado, resEstado) => {
                const estadoNombre = (!errEstado && resEstado.length > 0) ? resEstado[0].nombre_estado : 'nuevo estado';
                const mensaje = `La actividad "${nombre}" cambio de estado a ${estadoNombre}.`;
                notificarAsignados(id, tipoNotificacion, mensaje, idUsuario);
              });
            });

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

module.exports = router;
