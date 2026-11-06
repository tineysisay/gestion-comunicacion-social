require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const conexion = require('./db');
const verificarToken = require('./middleware/auth');
const { soloAdmin } = require('./middleware/roles');
const catalogosRoutes = require('./routes/catalogos');
const solicitantesRoutes = require('./routes/solicitantes');
const recursosRoutes = require('./routes/recursos');
const solicitudesRoutes = require('./routes/solicitudes');
const asignacionesRoutes = require('./routes/asignaciones');
const historialRoutes = require('./routes/historial');
const notificacionesRoutes = require('./routes/notificaciones');
const reportesRoutes = require('./routes/reportes');
const backupRoutes = require('./routes/backup');
const { generarContrasena } = require('./helpers/generarContrasena');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {

  const { usuario, contrasena } = req.body;

  const sql = `
    SELECT 
      cu.id_cuenta,
      cu.id_usuario,
      cu.id_rol,
      cu.nombre_usuario,
      cu.contrasena,
      cu.id_estado_usuario,
      cu.debe_cambiar_contrasena,
      cu.intentos_fallidos,
      du.primer_nombre,
      du.primer_apellido,
      ru.nombre_rol
    FROM cuenta_usuario cu
    INNER JOIN datos_usuario du ON cu.id_usuario = du.id_usuario
    INNER JOIN rol_usuario ru ON cu.id_rol = ru.id_rol
    WHERE cu.nombre_usuario = ?
  `;
  conexion.query(sql, [usuario], async (error, resultados) => {

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

    const contrasenaValida = await bcrypt.compare(contrasena, usuarioData.contrasena);

    if (!contrasenaValida) {

      // Contrasena incorrecta: se cuenta el intento. A las 5 fallidas
      // la cuenta pasa de ACTIVO a INACTIVO (id_estado_usuario = 2).
      const intentos = Number(usuarioData.intentos_fallidos || 0) + 1;

      if (intentos >= 5) {

        await new Promise((resolve, reject) => {
          conexion.query(
            'UPDATE cuenta_usuario SET intentos_fallidos = ?, id_estado_usuario = 2 WHERE id_cuenta = ?',
            [intentos, usuarioData.id_cuenta],
            (err) => err ? reject(err) : resolve()
          );
        });

        return res.status(403).json({
          mensaje: 'Ha excedido el maximo de intentos permitidos. Su cuenta ha sido desactivada. Contacte al administrador.'
        });

      }

      await new Promise((resolve, reject) => {
        conexion.query(
          'UPDATE cuenta_usuario SET intentos_fallidos = ? WHERE id_cuenta = ?',
          [intentos, usuarioData.id_cuenta],
          (err) => err ? reject(err) : resolve()
        );
      });

      return res.status(401).json({
        mensaje: `Usuario o contrasena incorrectos. Intentos restantes: ${5 - intentos}`
      });

    }

    // Contrasena correcta: se reinicia el contador de intentos
    await new Promise((resolve, reject) => {
      conexion.query(
        'UPDATE cuenta_usuario SET intentos_fallidos = 0 WHERE id_cuenta = ?',
        [usuarioData.id_cuenta],
        (err) => err ? reject(err) : resolve()
      );
    });

    const estadoResult = await new Promise((resolve, reject) => {
      conexion.query(
        'SELECT nombre_estado FROM estado_usuario WHERE id_estado_usuario = ?',
        [usuarioData.id_estado_usuario],
        (err, results) => err ? reject(err) : resolve(results[0])
      );
    });

    if (estadoResult.nombre_estado !== 'ACTIVO') {
      return res.status(403).json({
        mensaje: 'Su cuenta no está activa. Contacte al administrador.'
      });
    }

    const token = jwt.sign(
      {
        id_cuenta: usuarioData.id_cuenta,
        id_usuario: usuarioData.id_usuario,
        id_rol: usuarioData.id_rol,
        nombre_rol: usuarioData.nombre_rol,
        nombre_usuario: usuarioData.nombre_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      mensaje: 'Login exitoso',
      token: token,
      debe_cambiar_contrasena: usuarioData.debe_cambiar_contrasena === 1,
      usuario: {
        id_cuenta: usuarioData.id_cuenta,
        nombre_usuario: usuarioData.nombre_usuario,
        id_rol: usuarioData.id_rol,
        nombre_rol: usuarioData.nombre_rol,
        primer_nombre: usuarioData.primer_nombre,
        primer_apellido: usuarioData.primer_apellido
      }
    });

  });

});

// GET - Obtener perfil del usuario logueado
app.get('/api/usuarios/perfil', verificarToken, (req, res) => {
  const sql = `
    SELECT 
      cu.id_cuenta,
      cu.nombre_usuario,
      du.primer_nombre,
      du.segundo_nombre,
      du.primer_apellido,
      du.segundo_apellido,
      du.correo_electronico,
      du.telefono,
      cu.id_usuario,
      cu.id_rol,
      r.nombre_rol,
      cu.id_estado_usuario,
      eu.nombre_estado,
      ca.nombre_cargo
    FROM cuenta_usuario cu
    INNER JOIN datos_usuario du ON cu.id_usuario = du.id_usuario
    INNER JOIN rol_usuario r ON cu.id_rol = r.id_rol
    INNER JOIN estado_usuario eu ON cu.id_estado_usuario = eu.id_estado_usuario
    INNER JOIN cargo_usuario ca ON du.id_cargo = ca.id_cargo
    WHERE cu.id_cuenta = ?
  `;

  conexion.query(sql, [req.usuario.id_cuenta], (error, resultados) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al obtener perfil' });
    }
    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(resultados[0]);
  });
});

// PUT - Actualizar perfil del usuario logueado
app.put('/api/usuarios/perfil', verificarToken, (req, res) => {
  const { primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo_electronico, nombre_usuario } = req.body;

  const sqlActualizar = `
    UPDATE datos_usuario SET
      primer_nombre = ?,
      segundo_nombre = ?,
      primer_apellido = ?,
      segundo_apellido = ?,
      correo_electronico = ?
    WHERE id_usuario = ?
  `;

  const sqlCuenta = `
    UPDATE cuenta_usuario SET
      nombre_usuario = ?
    WHERE id_cuenta = ?
  `;

  conexion.beginTransaction((error) => {
    if (error) {
      console.error('ERROR MYSQL:', error);
      return res.status(500).json({ mensaje: 'Error al iniciar transaccion' });
    }

    conexion.query(
      sqlActualizar,
      [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo_electronico, req.usuario.id_usuario],
      (error) => {
        if (error) {
          return conexion.rollback(() => {
            console.error('ERROR MYSQL:', error);
            res.status(500).json({ mensaje: 'Error al actualizar perfil' });
          });
        }

        conexion.query(
          sqlCuenta,
          [nombre_usuario, req.usuario.id_cuenta],
          (error) => {
            if (error) {
              return conexion.rollback(() => {
                console.error('ERROR MYSQL:', error);
                res.status(500).json({ mensaje: 'Error al actualizar usuario' });
              });
            }

            conexion.commit((error) => {
              if (error) {
                return conexion.rollback(() => {
                  console.error('ERROR MYSQL:', error);
                  res.status(500).json({ mensaje: 'Error al guardar' });
                });
              }
              res.json({ mensaje: 'Perfil actualizado correctamente' });
            });
          }
        );
      }
    );
  });
});

// Politica de contrasena: minimo 8 caracteres, 1 mayuscula y 1 numero
function validarPoliticaContrasena(contrasena) {
  if (!contrasena || contrasena.length < 8) {
    return 'La contraseña debe tener mínimo 8 caracteres';
  }
  if (!/[A-Z]/.test(contrasena)) {
    return 'La contraseña debe incluir al menos una mayúscula';
  }
  if (!/[0-9]/.test(contrasena)) {
    return 'La contraseña debe incluir al menos un número';
  }
  return null;
}

// PUT - Cambiar la contrasena del usuario logueado (primer cambio obligatorio o voluntario)
app.put('/api/usuarios/cambiar-contrasena', verificarToken, async (req, res) => {

  const { contrasenaActual, contrasenaNueva } = req.body;

  const errorPolitica = validarPoliticaContrasena(contrasenaNueva);
  if (errorPolitica) {
    return res.status(400).json({ mensaje: errorPolitica });
  }

  try {
    const resultados = await new Promise((resolve, reject) => {
      conexion.query(
        'SELECT contrasena, debe_cambiar_contrasena FROM cuenta_usuario WHERE id_cuenta = ?',
        [req.usuario.id_cuenta],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Primer acceso (contraseña temporal): no se pide la contraseña actual,
    // el token ya demuestra que inicio sesion con la temporal.
    const esPrimerAcceso = Number(resultados[0].debe_cambiar_contrasena) === 1;

    if (!esPrimerAcceso) {
      const actualValida = await bcrypt.compare(contrasenaActual || '', resultados[0].contrasena);
      if (!actualValida) {
        return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
      }
    }

    const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);

    await new Promise((resolve, reject) => {
      conexion.query(
        'UPDATE cuenta_usuario SET contrasena = ?, debe_cambiar_contrasena = 0 WHERE id_cuenta = ?',
        [nuevoHash, req.usuario.id_cuenta],
        (err) => err ? reject(err) : resolve()
      );
    });

    res.json({ mensaje: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('ERROR CAMBIAR CONTRASENA:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }

});

// POST - Restablecer contrasena de un usuario: genera una contraseña temporal
app.post('/api/usuarios/:id/restablecer', verificarToken, soloAdmin, async (req, res) => {

  const { id } = req.params;

  try {
    const resultados = await new Promise((resolve, reject) => {
      conexion.query(
        'SELECT id_rol FROM cuenta_usuario WHERE id_cuenta = ?',
        [id],
        (err, rows) => err ? reject(err) : resolve(rows)
      );
    });

    if (resultados.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (resultados[0].id_rol === 7 && req.usuario.id_rol !== 7) {
      return res.status(403).json({
        mensaje: 'Solo un desarrollador puede restablecer la contraseña del desarrollador'
      });
    }

    const contrasenaTemporal = generarContrasena();
    const hash = await bcrypt.hash(contrasenaTemporal, 10);

    await new Promise((resolve, reject) => {
      conexion.query(
        'UPDATE cuenta_usuario SET contrasena = ?, debe_cambiar_contrasena = 1, intentos_fallidos = 0 WHERE id_cuenta = ?',
        [hash, id],
        (err) => err ? reject(err) : resolve()
      );
    });

    res.json({
      mensaje: 'Contraseña restablecida. El usuario deberá crear una nueva contraseña en su primer inicio de sesión.',
      contrasenaTemporal
    });

  } catch (error) {
    console.error('ERROR RESTABLECER CONTRASENA:', error);
    res.status(500).json({ mensaje: 'Error al restablecer la contraseña' });
  }

});

// Health check de la API (antes de los routers para no caer en verificarToken)
app.get('/api', (req, res) => {
  res.json({ mensaje: 'API funcionando correctamente' });
});

app.use('/api', catalogosRoutes);
app.use('/api', solicitantesRoutes);
app.use('/api', recursosRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', asignacionesRoutes);
app.use('/api', historialRoutes);
app.use('/api', notificacionesRoutes);
app.use('/api', reportesRoutes);
app.use('/api', backupRoutes);

app.post('/api/usuarios', verificarToken, soloAdmin, async (req, res) => {

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
    idRol,
    idEstadoUsuario
  } = req.body;

  // La contraseña ya no la escribe el administrador: se genera una temporal
  // que el usuario usara una sola vez para crear su propia contraseña.
  const contrasenaTemporal = generarContrasena();
  const contrasenaHash = await bcrypt.hash(contrasenaTemporal, 10);

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

        const idUsuario = resultadoPersona.insertId;

        const sqlCuenta = `
          INSERT INTO cuenta_usuario (
            id_usuario,
            id_rol,
            nombre_usuario,
            contrasena,
            id_estado_usuario,
            debe_cambiar_contrasena
          )
          VALUES (?, ?, ?, ?, ?, 1)
        `;

        conexion.query(
          sqlCuenta,
          [
            idUsuario,
            idRol,
            nombreUsuario,
            contrasenaHash,
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
                mensaje: 'Usuario registrado correctamente',
                contrasenaTemporal
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
      c.id_usuario,
      c.nombre_usuario,
      d.primer_nombre,
      d.segundo_nombre,
      d.primer_apellido,
      d.segundo_apellido,
      r.nombre_rol,
      e.nombre_estado,
      ca.nombre_cargo
    FROM cuenta_usuario c
    INNER JOIN rol_usuario r 
      ON c.id_rol = r.id_rol
    INNER JOIN estado_usuario e 
      ON c.id_estado_usuario = e.id_estado_usuario
    INNER JOIN datos_usuario d
      ON c.id_usuario = d.id_usuario
    INNER JOIN cargo_usuario ca
      ON d.id_cargo = ca.id_cargo
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

app.put('/api/usuarios/:id', verificarToken, soloAdmin, async (req, res) => {

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

  // Si no viene contraseña nueva (o viene el hash actual), se conserva la existente
  let contrasenaHash = null;
  if (contrasena && typeof contrasena === 'string' && !contrasena.startsWith('$2b$')) {
    contrasenaHash = await bcrypt.hash(contrasena, 10);
  }

  const sqlBuscar = `
    SELECT id_usuario, id_rol
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

    // Proteccion: solo un desarrollador puede modificar la cuenta del desarrollador
    if (resultados[0].id_rol === 7 && req.usuario.id_rol !== 7) {
      return res.status(403).json({
        mensaje: 'Solo un desarrollador puede modificar la cuenta del desarrollador'
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
            contrasena = COALESCE(?, contrasena),
            id_rol = ?,
            id_estado_usuario = ?,
            intentos_fallidos = IF(? = 1, 0, intentos_fallidos)
          WHERE id_cuenta = ?
        `;

        conexion.query(
          sqlCuenta,
          [
            nombreUsuario,
            contrasenaHash,
            idRol,
            idEstadoUsuario,
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

// Sirve el frontend compilado (Angular 17 → frontend/dist/proyectotkv1/browser)
const distPath = path.join(__dirname, '..', 'frontend', 'dist', 'proyectotkv1', 'browser');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback SPA: cualquier GET que no sea /api responde index.html
// (Angular maneja sus propias rutas: /login, /inicio/kanban, etc.)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ mensaje: 'Endpoint no encontrado' });
  }
  const indexHtml = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    return res.status(404).send('Frontend no compilado. Ejecuta: npm run build');
  }
  res.sendFile(indexHtml);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Servidor ejecutandose en http://localhost:${PORT}`
  );

});