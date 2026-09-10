require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const conexion = require('./db');
const verificarToken = require('./middleware/auth');
const catalogosRoutes = require('./routes/catalogos');
const solicitantesRoutes = require('./routes/solicitantes');
const recursosRoutes = require('./routes/recursos');
const solicitudesRoutes = require('./routes/solicitudes');
const asignacionesRoutes = require('./routes/asignaciones');
const historialRoutes = require('./routes/historial');
const notificacionesRoutes = require('./routes/notificaciones');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {

  const { usuario, contrasena } = req.body;

  const sql = `
    SELECT 
      cu.id_cuenta,
      cu.id_usuario,
      cu.id_rol,
      cu.nombre_usuario,
      cu.id_estado_usuario,
      du.primer_nombre,
      du.primer_apellido
    FROM cuenta_usuario cu
    INNER JOIN datos_usuario du ON cu.id_usuario = du.id_usuario
    WHERE cu.nombre_usuario = ? 
      AND cu.contrasena = ?
  `;

  conexion.query(sql, [usuario, contrasena], (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error en el servidor'
      });
    }

    if (resultados.length === 0) {

      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      });

    }

    const usuarioData = resultados[0];

    const token = jwt.sign(
      {
        id_cuenta: usuarioData.id_cuenta,
        id_usuario: usuarioData.id_usuario,
        id_rol: usuarioData.id_rol,
        nombre_usuario: usuarioData.nombre_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      mensaje: 'Login exitoso',
      token: token,
      usuario: {
        id_cuenta: usuarioData.id_cuenta,
        nombre_usuario: usuarioData.nombre_usuario,
        id_rol: usuarioData.id_rol,
        primer_nombre: usuarioData.primer_nombre,
        primer_apellido: usuarioData.primer_apellido
      }
    });

  });

});

app.use('/api', catalogosRoutes);
app.use('/api', solicitantesRoutes);
app.use('/api', recursosRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', asignacionesRoutes);
app.use('/api', historialRoutes);
app.use('/api', notificacionesRoutes);

app.post('/api/usuarios', verificarToken, (req, res) => {

  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    dpi,
    telefono,
    correoElectronico,
    idCargo,
    nombreUsuario,
    contrasena,
    idRol,
    idEstadoUsuario
  } = req.body;

  const sqlPersona = `
    INSERT INTO datos_usuario (
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      dpi,
      telefono,
      correo_electronico,
      id_cargo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  conexion.beginTransaction((error) => {

    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({
        mensaje: 'Error al iniciar la transacción'
      });
    }

    conexion.query(
      sqlPersona,
      [
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        dpi,
        telefono,
        correoElectronico,
        idCargo
      ],
      (error, resultadoPersona) => {

        if (error) {
          return conexion.rollback(() => {
            console.error('ERROR MYSQL:', error);
            res.status(500).json({
              mensaje: 'Error al registrar los datos de la persona'
            });
          });
        }

        //const idUsuario = resultadoPersona.insertId;
        const idUsuario = resultadoPersona.insertId;

console.log('ID PERSONA INSERTADA:', idUsuario);

        const sqlCuenta = `
          INSERT INTO cuenta_usuario (
            id_usuario,
            id_rol,
            nombre_usuario,
            contrasena,
            id_estado_usuario
          )
          VALUES (?, ?, ?, ?, ?)
        `;

        conexion.query(
          sqlCuenta,
          [
            idUsuario,
            idRol,
            nombreUsuario,
            contrasena,
            idEstadoUsuario
          ],
          (error) => {

            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({
                  mensaje: 'Error al crear la cuenta de usuario'
                });
              });
            }

            conexion.commit((error) => {

              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({
                    mensaje: 'Error al guardar el usuario'
                  });
                });
              }

              res.status(201).json({
                mensaje: 'Usuario registrado correctamente'
              });

            });

          }
        );

      }
    );

  });

});
app.get('/api/usuarios', verificarToken, (req, res) => {

  const sql = `
    SELECT 
      c.id_cuenta,
      c.nombre_usuario,
      r.nombre_rol,
      e.nombre_estado
    FROM cuenta_usuario c
    INNER JOIN rol_usuario r 
      ON c.id_rol = r.id_rol
    INNER JOIN estado_usuario e 
      ON c.id_estado_usuario = e.id_estado_usuario
  `;

  conexion.query(sql, (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener usuarios'
      });
    }

    res.json(resultados);

  });

});

app.get('/api/usuarios/:id', verificarToken, (req, res) => {

  const { id } = req.params;

  const sql = `
    SELECT
      c.id_cuenta,
      c.id_usuario,
      c.id_rol,
      c.nombre_usuario,
      c.contrasena,
      c.id_estado_usuario,
      d.primer_nombre,
      d.segundo_nombre,
      d.primer_apellido,
      d.segundo_apellido,
      d.dpi,
      d.telefono,
      d.correo_electronico,
      d.id_cargo,
      ca.id_tipo_empleado
    FROM cuenta_usuario c
    INNER JOIN datos_usuario d
      ON c.id_usuario = d.id_usuario
    INNER JOIN cargo_usuario ca
      ON d.id_cargo = ca.id_cargo
    WHERE c.id_cuenta = ?
  `;

  conexion.query(sql, [id], (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener el usuario'
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json(resultados[0]);

  });

});

app.put('/api/usuarios/:id', verificarToken, (req, res) => {

  const { id } = req.params;

  const {
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    dpi,
    telefono,
    correoElectronico,
    idCargo,
    nombreUsuario,
    contrasena,
    idRol,
    idEstadoUsuario
  } = req.body;

  const sqlBuscar = `
    SELECT id_usuario
    FROM cuenta_usuario
    WHERE id_cuenta = ?
  `;

  conexion.query(sqlBuscar, [id], (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al buscar el usuario'
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    const idUsuario = resultados[0].id_usuario;

    const sqlPersona = `
      UPDATE datos_usuario
      SET
        primer_nombre = ?,
        segundo_nombre = ?,
        primer_apellido = ?,
        segundo_apellido = ?,
        dpi = ?,
        telefono = ?,
        correo_electronico = ?,
        id_cargo = ?
      WHERE id_usuario = ?
    `;

    conexion.query(
      sqlPersona,
      [
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        dpi,
        telefono,
        correoElectronico,
        idCargo,
        idUsuario
      ],
      (error) => {

        if (error) {
          console.error('ERROR MYSQL:', error);

          return res.status(500).json({
            mensaje: 'Error al actualizar los datos personales'
          });
        }

        const sqlCuenta = `
          UPDATE cuenta_usuario
          SET
            nombre_usuario = ?,
            contrasena = ?,
            id_rol = ?,
            id_estado_usuario = ?
          WHERE id_cuenta = ?
        `;

        conexion.query(
          sqlCuenta,
          [
            nombreUsuario,
            contrasena,
            idRol,
            idEstadoUsuario,
            id
          ],
          (error) => {

            if (error) {
              console.error('ERROR MYSQL:', error);

              return res.status(500).json({
                mensaje: 'Error al actualizar la cuenta'
              });
            }

            res.json({
              mensaje: 'Usuario actualizado correctamente'
            });

          }
        );

      }
    );

  });

});

app.get('/', (req, res) => {

  res.json({
    mensaje: 'API funcionando correctamente'
  });

});

app.delete('/api/usuarios/:id', verificarToken, (req, res) => {

  const idCuenta = req.params.id;

  const sqlUsuario = `
    SELECT id_usuario
    FROM cuenta_usuario
    WHERE id_cuenta = ?
  `;

  conexion.query(sqlUsuario, [idCuenta], (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al buscar el usuario'
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    const idUsuario = resultados[0].id_usuario;

    conexion.beginTransaction((error) => {

      if (error) {
        console.error('ERROR MYSQL:', error);

        return res.status(500).json({
          mensaje: 'Error al iniciar la transacción'
        });
      }

      const sqlCuenta = `
        DELETE FROM cuenta_usuario
        WHERE id_cuenta = ?
      `;

      conexion.query(sqlCuenta, [idCuenta], (error) => {

        if (error) {
          return conexion.rollback(() => {

            console.error('ERROR MYSQL:', error);

            res.status(500).json({
              mensaje: 'Error al eliminar la cuenta'
            });

          });
        }

        const sqlPersona = `
          DELETE FROM datos_usuario
          WHERE id_usuario = ?
        `;

        conexion.query(sqlPersona, [idUsuario], (error) => {

          if (error) {
            return conexion.rollback(() => {

              console.error('ERROR MYSQL:', error);

              res.status(500).json({
                mensaje: 'Error al eliminar los datos del usuario'
              });

            });
          }

          conexion.commit((error) => {

            if (error) {
              return conexion.rollback(() => {

                console.error('ERROR MYSQL:', error);

                res.status(500).json({
                  mensaje: 'Error al confirmar la eliminación'
                });

              });
            }

            res.json({
              mensaje: 'Usuario eliminado correctamente'
            });

          });

        });

      });

    });

  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Servidor ejecutandose en http://localhost:${PORT}`
  );

});