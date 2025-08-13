const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Rutas normales usan el pool global de db.js
const loginRouter = require('./routes/Login');
app.use('/api', loginRouter);

const usrModulesRouter = require('./routes/usrModules');
app.use('/api/usr-modules', usrModulesRouter);

const consultaDocumentosRouter = require('./routes/consultadocumentos');
app.use('/api', consultaDocumentosRouter);

// Importar y conectar la nueva ruta
const comunicadoRouter = require('./routes/Comunicado');
app.use('/api', comunicadoRouter);

// Endpoint para ejecutar queries con configuración dinámica (pool temporal)

const pool = require('./db');

app.post('/api/execute-query', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Consulta SQL vacía o inválida.' });
  }

  try {
    const result = await pool.query(query);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, '0.0.0.0', () => {
  console.log(`Backend corriendo en http://0.0.0.0:${port}`);
});
