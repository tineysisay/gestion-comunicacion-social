const express = require('express');
const cors = require('cors');
const conexion = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {

  const { usuario, contrasena } = req.body;

  const sql = `
    SELECT 
      id_cuenta,
      id_usuario,
      id_rol,
      nombre_usuario,
      id_estado_usuario
    FROM cuenta_usuario
    WHERE nombre_usuario = ? 
      AND contrasena = ?
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

    res.json({
      mensaje: 'Login exitoso',
      usuario: resultados[0]
    });

  });

});

app.post('/api/usuarios', (req, res) => {

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
app.get('/api/usuarios', (req, res) => {

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

app.get('/api/tipos-empleado', (req, res) => {

  const sql = `
    SELECT 
      id_tipo_empleado,
      nombre_tipo_empleado
    FROM tipo_empleado
  `;

  conexion.query(sql, (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener tipos de empleado'
      });
    }

    res.json(resultados);

  });

});

app.get('/api/usuarios/:id', (req, res) => {

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

app.put('/api/usuarios/:id', (req, res) => {

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
app.get('/api/cargos', (req, res) => {

  const sql = `
    SELECT 
      id_cargo,
      nombre_cargo
    FROM cargo_usuario
  `;

  conexion.query(sql, (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener cargos'
      });
    }

    res.json(resultados);

  });

});

app.get('/api/roles', (req, res) => {

  const sql = `
    SELECT 
      id_rol,
      nombre_rol
    FROM rol_usuario
  `;

  conexion.query(sql, (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener roles'
      });
    }

    res.json(resultados);

  });

});

app.get('/api/estados-usuario', (req, res) => {

  const sql = `
    SELECT 
      id_estado_usuario,
      nombre_estado
    FROM estado_usuario
  `;

  conexion.query(sql, (error, resultados) => {

    if (error) {
      console.error('ERROR MYSQL:', error);

      return res.status(500).json({
        mensaje: 'Error al obtener estados'
      });
    }

    res.json(resultados);

  });

});

app.get('/', (req, res) => {

  res.json({
    mensaje: 'API funcionando correctamente'
  });

});

const PORT = 3000;
app.get('/api/usuarios/:id', (req, res) => {

  const idCuenta = req.params.id;

  const sql = `
    SELECT
      cu.id_cuenta,
      du.id_usuario,
      du.primer_nombre,
      du.segundo_nombre,
      du.primer_apellido,
      du.segundo_apellido,
      du.dpi,
      du.telefono,
      du.correo_electronico,
      te.id_tipo_empleado,
      cu2.id_cargo,
      cu.id_rol,
      cu.nombre_usuario,
      cu.contrasena,
      cu.id_estado_usuario
    FROM cuenta_usuario cu
    INNER JOIN datos_usuario du
      ON cu.id_usuario = du.id_usuario
    INNER JOIN cargo_usuario cu2
      ON du.id_cargo = cu2.id_cargo
    INNER JOIN tipo_empleado te
      ON cu2.id_tipo_empleado = te.id_tipo_empleado
    WHERE cu.id_cuenta = ?
  `;

  conexion.query(sql, [idCuenta], (error, resultados) => {

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
app.delete('/api/usuarios/:id', (req, res) => {

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

app.listen(PORT, () => {

  console.log(
    `Servidor ejecutándose en http://localhost:${PORT}`
  );

});