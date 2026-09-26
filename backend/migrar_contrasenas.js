require('dotenv').config();
const bcrypt = require('bcrypt');
const conexion = require('./db');

async function migrarContrasenas() {
  console.log('Iniciando migracion de contrasenas...');

  const sql = 'SELECT id_cuenta, contrasena FROM cuenta_usuario';

  conexion.query(sql, async (error, resultados) => {
    if (error) {
      console.error('Error al consultar:', error);
      process.exit(1);
    }

    console.log(`Se encontraron ${resultados.length} usuarios`);

    let migrados = 0;

    for (const usuario of resultados) {
      if (usuario.contrasena.startsWith('$2b$')) {
        console.log(`Usuario ${usuario.id_cuenta}: ya tiene hash, saltando`);
        continue;
      }

      const hash = await bcrypt.hash(usuario.contrasena, 10);

      const sqlUpdate = 'UPDATE cuenta_usuario SET contrasena = ? WHERE id_cuenta = ?';

      await new Promise((resolve, reject) => {
        conexion.query(sqlUpdate, [hash, usuario.id_cuenta], (error) => {
          if (error) {
            console.error(`Error al actualizar usuario ${usuario.id_cuenta}:`, error);
            reject(error);
          } else {
            console.log(`Usuario ${usuario.id_cuenta}: contrasena hasheada correctamente`);
            migrados++;
            resolve();
          }
        });
      });
    }

    console.log(`\nMigracion completada: ${migrados} contrasenas hasheadas`);
    process.exit(0);
  });
}

migrarContrasenas();
