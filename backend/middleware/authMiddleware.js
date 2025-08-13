const jwt = require('jsonwebtoken');
const JWT_SECRET = 'clave_secreta_super_segura'; // ⚠ Usa .env en producción

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autorización faltante' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Aquí se inyecta { id, usrcod, adm_ciaid, etc. }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
}

module.exports = verifyToken;
