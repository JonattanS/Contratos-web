const express = require('express');
const router = express.Router();
const pool = require('../db');

// Función generadora de WHERE dinámico, según los filtros de la petición
function construirWhere(f) {
  const where = [];
  const values = [];
  let idx = 1;

  if (f.suc_cod) {
    where.push(`suc_cod = $${idx++}`);
    values.push(f.suc_cod);
  }
  if (f.clc_cod) {
    where.push(`clc_cod = $${idx++}`);
    values.push(f.clc_cod);
  }
  if (f.doc_num_ini) {
    where.push(`doc_num >= $${idx++}`);
    values.push(f.doc_num_ini);
  }
  if (f.doc_num_fin) {
    where.push(`doc_num <= $${idx++}`);
    values.push(f.doc_num_fin);
  }
  if (f.fecha_ini) {
    where.push(`doc_fec >= $${idx++}`);
    values.push(f.fecha_ini);
  }
  if (f.fecha_fin) {
    where.push(`doc_fec <= $${idx++}`);
    values.push(f.fecha_fin);
  }
  if (f.ter_nit_ini) {
    where.push(`ter_nit >= $${idx++}`);
    values.push(f.ter_nit_ini);
  }
  if (f.ter_nit_fin) {
    where.push(`ter_nit <= $${idx++}`);
    values.push(f.ter_nit_fin);
  }
  if (f.cta_cod_ini) {
    where.push(`cta_cod >= $${idx++}`);
    values.push(f.cta_cod_ini);
  }
  if (f.cta_cod_fin) {
    where.push(`cta_cod <= $${idx++}`);
    values.push(f.cta_cod_fin);
  }

  // Puedes añadir aquí otros campos siguiendo la misma lógica.

  return {
    sql: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
}

router.post('/consultadocumentos', async (req, res) => {
  const filtros = req.body;

  const { sql, values } = construirWhere(filtros);
  const baseQuery = `
    SELECT id,   suc_cod,
        clc_cod,
        doc_num,
        doc_fec,
        mov_cons,
        clc_cod_rel,
        doc_fec_rel,
        doc_num_rel,
        cta_cod,
        cta_nom,
        mov_val,
        mov_val_ext,
        mov_bas,
        mnd_cla,
        mnd_tas_act,
        doc_num_ref,
        doc_fec_ref,
        ter_nit,
        ter_raz,
        cto_cod,
        act_cod,
        anf_cod,
        clc_ord,
        doc_est
    FROM con_his
    ${sql}
    ORDER BY LOWER(clc_cod), doc_num, doc_fec, mov_cons
  `;

  try {
    const result = await pool.query(baseQuery, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error consultando documentos', detalle: err.message });
  }
});

module.exports = router;
