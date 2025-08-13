const express = require('express');
const router = express.Router();
const pool = require('../db'); // tu pool de PostgreSQL
const verifyToken = require('../middleware/authMiddleware');

// Usar en todos los endpoints (excepto si alguno debe ser público)
router.use(verifyToken);

// Crear módulo
router.post('/', async (req, res) => {
  const user_id = req.user?.id; // Extraído directamente del token JWT
  const adm_ciaid = req.user?.adm_ciaid; // Del token también

  const {
    porcod,
    name,
    description,
    query,
    filters = [],
    dynamic_filters = [],
    dashboard_config = {},
    is_main_function = false,
    shared = false
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO usr_modules
        (user_id, adm_ciaid, porcod, name, description, query, filters, dynamic_filters, dashboard_config, is_main_function, shared)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [user_id, adm_ciaid, porcod, name, description, query, JSON.stringify(filters), JSON.stringify(dynamic_filters),
       JSON.stringify(dashboard_config), is_main_function, shared]
    );
    res.status(201).json({ success: true, module: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Listar módulos por usuario (y opcional portafolio)
router.get('/', async (req, res) => {
  const { user_id, adm_ciaid, porcod } = req.query; // pasar estos como query params

  let filters = [];
  let values = [];
  let count = 1;

  if (user_id) {
    filters.push(`user_id = $${count++}`);
    values.push(user_id);
  }
  if (adm_ciaid) {
    filters.push(`adm_ciaid = $${count++}`);
    values.push(adm_ciaid);
  }
  if (porcod) {
    filters.push(`porcod = $${count++}`);
    values.push(porcod);
  }
  filters.push(`deleted_at IS NULL`);
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT * FROM usr_modules ${whereClause} ORDER BY created_at DESC`
      , values);
    res.json({ success: true, modules: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Consultar un módulo por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM usr_modules WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Module not found' });
    res.json({ success: true, module: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Actualizar módulo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, description, query, filters, dynamic_filters, dashboard_config, is_main_function, shared
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE usr_modules SET
        name=$1, description=$2, query=$3, filters=$4, dynamic_filters=$5,
        dashboard_config=$6, is_main_function=$7, shared=$8,
        updated_at=NOW()
      WHERE id=$9 AND deleted_at IS NULL
      RETURNING *`,
      [name, description, query, JSON.stringify(filters), JSON.stringify(dynamic_filters),
        JSON.stringify(dashboard_config), is_main_function, shared, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Module not found' });
    res.json({ success: true, module: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar módulo (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE usr_modules SET deleted_at=NOW() WHERE id=$1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
