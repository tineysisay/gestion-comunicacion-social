require('dotenv').config();
const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4'
});

conexion.connect((error) => {
  if (error) {
    console.error('Error al conectar con MySQL:', error.message);
    return;
  }
  console.log('MySQL conectado correctamente');
});

module.exports = conexion;
