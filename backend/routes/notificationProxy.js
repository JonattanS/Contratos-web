const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // o usa undici nativo si tienes Node 18+
const XLSX = require('xlsx');
const path = require('path');
const EXCEL_TEMP_PATH = path.join(__dirname, '..', 'Temp', 'tmpe2wq3gzr.xlsx');

const NOTIFICATIONS_API = 'http://10.11.11.5:8083/api/notifications/send';

// Nuevo endpoint para leer Excel temporal y enviar notificaciones masivamente
router.post('/notifications/send-from-excel', async (req, res) => {
  try {
    const workbook = XLSX.readFile(EXCEL_TEMP_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Leer desde la fila 2 (range: 1) para saltar encabezados
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1, defval: '' });

    const sendResults = await Promise.all(jsonData.map(async (row) => {
      // Ajustar los nombres de columna según archivo Excel
      const recipient = row['Correo electronico'] || row['Correo Electrónico'] || '';
      const ccStr = row['Correos copia'] || '';
      const cc = ccStr ? ccStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (!recipient) {
        return { success: false, error: 'Falta correo destinatario', row };
      }

      // Payload estático para subject y message como requieres
      const payload = {
        channels: ['email'],
        recipient: recipient,
        cc: cc,
        subject: 'Asunto estático de prueba',
        message: 'Mensaje estático de prueba',
      };

      // Enviar la notificación al backend especificado
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

    res.json({ results: sendResults });
  } catch (error) {
    console.error('Error enviando notificaciones desde Excel:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
