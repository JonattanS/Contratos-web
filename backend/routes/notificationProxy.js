const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const XLSX = require('xlsx');
const path = require('path');

const EXCEL_TEMP_PATH = path.join(__dirname, '..', 'Temp', 'excel_clientes_temp.xlsx');
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

// Función para generar el contenido según el tipo
function getEmailContent(type, clientName, link) {
  if (type === 'comunicado') {
    return {
      subject: 'CIERRE DE AÑO: Información Importante',
      message: `Apreciado Cliente ${clientName} buen día, 
      
En el siguiente enlace encuentra información de alto impacto, nuestro interés seguir construyendo lazos.

${link}

Estaremos atentos a sus comentarios.

Cordialmente,
Dora Rodríguez Romero
servicioalcliente@novacorp-plus.com
Asistente Comercial
Nova Corp SAS
PBX (57) 601 7568230 | 3164352921
Calle 25F No. 85B-26 P.5
Bogotá, Colombia 
www.novacorp-plus.com`
    };
  } else if (type === 'cotizacion') {
    return {
      subject: 'Continuidad Servicios 2026',
      message: `Estimado Cliente ${clientName} buen día, 

Atendiendo el asunto citado, en el siguiente enlace encuentra los documentos:

  • Propuesta Renovación Servicios.
 	• Paquete Documentos Legales.

${link}

A la espera de su confirmación del recibido.

Cordialmente,
Dora Rodríguez Romero
servicioalcliente@novacorp-plus.com
Asistente Comercial
Nova Corp SAS
PBX (57) 601 7568230 | 3164352921
Calle 25F No. 85B-26 P.5
Bogotá, Colombia 
www.novacorp-plus.com`
    };
  }
  
  // Fallback por si no se especifica tipo
  return {
    subject: 'Información Importante',
    message: 'Mensaje genérico'
  };
}

// Nuevo endpoint que lee Excel y envía notificaciones
router.post('/notifications/send', async (req, res) => {
  try {
    // Obtener el tipo desde el body
    const { type } = req.body;
    
    if (!type || !['comunicado', 'cotizacion'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de notificación requerido: comunicado o cotizacion' });
    }

    // Leer archivo Excel
    const workbook = XLSX.readFile(EXCEL_TEMP_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Leer datos desde fila 1 (range: 0) incluyendo encabezados
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 0, defval: '' });

    // Procesar todas las filas y enviar notificaciones en paralelo
    const sendResults = await Promise.all(jsonData.map(async (row) => {
      // Obtener destinatario y correos copia desde columnas
      const rawRecipient = row['Correo electronico'] || row['Correo Electrónico'] || '';
      const recipient = rawRecipient.trim() || 'servicioalcliente@novacorp-plus.com';
      const ccStr = row['Correos copia'] || '';
      const cc = ccStr.split(',').map(s => s.trim()).filter(Boolean);
      
      // Obtener datos específicos para el contenido
      const clientName = row['Razón social'] || 'Cliente';
      const link = type === 'comunicado' 
        ? (row['Link_PDF_Comunicado'] || row['Link_Comunicado'] || '#')
        : (row['Link_PDF_Renovacion'] || row['Link_Renovacion'] || '#');

      // Generar contenido según tipo
      const emailContent = getEmailContent(type, clientName, link);

      // Construir payload con contenido personalizado
      const payload = {
        channels: ['email'],
        recipient,
        cc,
        subject: emailContent.subject,
        message: emailContent.message,
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
        clientName,
        type,
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
