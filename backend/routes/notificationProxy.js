const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // o usa undici nativo si tienes Node 18+

router.post('/notifications/send', async (req, res) => {
  try {
    // Reenvía el body tal cual al backend 10.11.11.5
    const response = await fetch('http://10.11.11.5:8083/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    // Reenvía respuesta para mantener transparencia
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    console.error('Error proxy notifications:', error);
    res.status(500).json({ error: 'Error en proxy de notificaciones' });
  }
});

module.exports = router;
