const express = require('express');
const router = express.Router();
const pool = require('../db'); // pool global con conexión a PostgreSQL
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'clave_secreta_super_segura';

router.post('/login', async (req, res) => {
  const { usrcod, usrpsw } = req.body;

  // Validación básica
  if (!usrcod || !usrpsw) {
    return res.status(400).json({ success: false, message: "Usuario y contraseña requeridos" });
  }

  try {
    // Consulta al usuario
    const { rows } = await pool.query('SELECT * FROM adm_usr WHERE usrcod = $1', [usrcod]);
    if (rows.length === 0) {
      return res.status(200).json({ success: false, message: "Usuario no existe" });
    }

    const user = rows[0];

    if (user.usrpsw !== usrpsw) {
      return res.status(200).json({ success: false, message: "Contraseña incorrecta" });
    }

    // Consulta la razón social de la cia
    const { rows: ciaRows } = await pool.query('SELECT ciaraz FROM adm_cia WHERE id = $1', [user.adm_ciaid]);
    const ciaraz = ciaRows.length > 0 ? ciaRows[0].ciaraz : null;

    // Consulta los portafolios habilitados para esta cia
    const { rows: portafolioRows } = await pool.query('SELECT porcod FROM nov_por WHERE adm_ciaid = $1',[user.adm_ciaid]);
    const portafolios = portafolioRows.map(row => row.porcod);

    // Consulta el rol del usuario
    const rolResult = await pool.query('SELECT rolcod, roldes FROM adm_rol WHERE id = $1', [user.adm_rolid]);
    const rol = rolResult.rows[0] || { rolcod: null, roldes: null };

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        adm_ciaid: user.adm_ciaid,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Devolver datos del usuario y token
    return res.status(200).json({
      success: true,
      token,
      user: {
        token,
        id: user.id,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        adm_ciaid: user.adm_ciaid,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes,
        portafolios // <- array de porcod habilitados
      }
    });
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;
