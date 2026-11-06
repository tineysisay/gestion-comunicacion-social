require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2');

// SSL para bases de datos en la nube (Aiven, etc.)
// DB_SSL=true → activa TLS; DB_SSL_CA=ruta/a/ca.pem → valida con certificado de la nube
const sslOptions = process.env.DB_SSL === 'true'
  ? (process.env.DB_SSL_CA
      ? { ca: fs.readFileSync(process.env.DB_SSL_CA), rejectUnauthorized: true }
      : { rejectUnauthorized: false })
  : undefined;

const conexion = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  ...(sslOptions ? { ssl: sslOptions } : {})
});

conexion.connect((error) => {
  if (error) {
    console.error('Error al conectar con MySQL:', error.message);
    return;
  }
  console.log('MySQL conectado correctamente');
});

module.exports = conexion;
