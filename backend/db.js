const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'gestion_comunicacion_social'
});

conexion.connect((error) => {
  if (error) {
    console.error('Error al conectar con MySQL:', error.message);
    return;
  }

  console.log('MySQL conectado correctamente');
});

module.exports = conexion;