const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // o usa undici nativo si tienes Node 18+
const XLSX = require('xlsx');
const path = require('path');

const EXCEL_TEMP_PATH = 'X:\\REGISTROS\\SOPORTE\\2025\\A-Requerimientos\\NOV\\2508000003\\tmp3otksued.xlsx';
const NOTIFICATIONS_API = 'http://10.11.11.5:8083/api/notifications/send';

// Funcionalidad antigua comentada intencionalmente
// router.post('/notifications/send', async (req, res) => {
//   try {
//     const response = await fetch(NOTIFICATIONS_API, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(req.body),
//     });
//     const data = await response.text();
//     res.status(response.status).send(data);
//   } catch (error) {
//     console.error('Error proxy notifications:', error);
//     res.status(500).json({ error: 'Error en proxy de notificaciones' });
//   }
// });

// Nuevo endpoint que lee Excel y envía notificaciones
router.post('/notifications/send', async (req, res) => {
  try {
    // Leer archivo Excel
    const workbook = XLSX.readFile(EXCEL_TEMP_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Leer datos desde fila 2 (range: 1) saltando encabezados
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 0, defval: '' });

    // Procesar todas las filas y enviar notificaciones en paralelo
    const sendResults = await Promise.all(jsonData.map(async (row) => {
      // Obtener destinatario y correos copia desde columnas
      const recipient = row['Correo electronico'] || row['Correo Electrónico'] || '';
      const ccStr = row['Correos copia'] || '';
      const cc = ccStr ? ccStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (!recipient) {
        return { success: false, error: 'Falta correo destinatario', row };
      }

      // Construir payload con asunto y mensaje estáticos
      const payload = {
        channels: ['email'],
        recipient: recipient,
        cc: cc,
        subject: 'Asunto estático de prueba',
        message: 'Mensaje estático de prueba',
      };

      // Ejecutar fetch a API externa
      const response = await fetch(NOTIFICATIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      return {
        success: response.ok,
        status: response.status,
        response: text,
        recipient,
      };
    }));

    // Retornar resultados al cliente
    res.json({ results: sendResults });
  } catch (error) {
    console.error('Error enviando notificaciones desde Excel:', error);
    res.status(500).json({ error: 'Error interno del servidor', detail: error.message });
  }
});

module.exports = router;