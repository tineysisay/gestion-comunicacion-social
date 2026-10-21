const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const verificarToken = require('../middleware/auth');
const { soloAdmin } = require('../middleware/roles');

require('dotenv').config();

router.use(verificarToken);
router.use(soloAdmin);

// Carpeta donde quedan las copias en el servidor
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ruta de mysqldump (configurable en .env con MYSQLDUMP_PATH)
const MYSQLDUMP = process.env.MYSQLDUMP_PATH
  || 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';

// POST - Generar backup de la base de datos (solo administrador)
// Guarda copia en backend/backups/ y la devuelve como descarga
router.post('/backup', (req, res) => {
  if (!fs.existsSync(MYSQLDUMP)) {
    return res.status(500).json({
      mensaje: 'No se encontro mysqldump en el servidor. Configure MYSQLDUMP_PATH en .env'
    });
  }

  const db = process.env.DB_NAME || 'gestion_comunicacion_social';
  const fecha = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const marca = `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}_${pad(fecha.getHours())}${pad(fecha.getMinutes())}${pad(fecha.getSeconds())}`;
  const nombreArchivo = `backup_${db}_${marca}.sql`;

  const args = [
    `--user=${process.env.DB_USER}`,
    `--host=${process.env.DB_HOST || 'localhost'}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    db
  ];

  const opciones = {
    maxBuffer: 100 * 1024 * 1024, // 100 MB
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD }
  };

  execFile(MYSQLDUMP, args, opciones, (error, stdout, stderr) => {
    if (error) {
      console.error('ERROR MYSQLDUMP:', stderr || error.message);
      return res.status(500).json({ mensaje: 'Error al generar el backup de la base de datos' });
    }

    try {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      fs.writeFileSync(path.join(BACKUP_DIR, nombreArchivo), stdout, 'utf8');
    } catch (e) {
      console.error('ERROR AL GUARDAR BACKUP:', e.message);
      return res.status(500).json({ mensaje: 'Backup generado pero no se pudo guardar en el servidor' });
    }

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(stdout);
  });
});

module.exports = router;
