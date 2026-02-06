const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_TEMP_PATH = path.join(__dirname, '..', 'Temp', 'excel_clientes_temp.xlsx');
const NOTIFICATIONS_API = 'http://10.11.11.5:8083/api/notifications/send';
const LOG_TEMP_PATH = path.join(__dirname, "..", "Temp")

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
function getEmailContent(type, clientName, linkComunicado, linkCotizacion) {
  if (type === "comunicado") {
    return {
      subject: 'CONTINUIDAD DE SERVICIOS 2026: Información Importante',
      message: `Apreciado Cliente ${clientName} buen día, 
      
En el siguiente enlace encuentra información de alto impacto, nuestro interés seguir construyendo lazos.

${linkComunicado}

Estaremos atentos a sus comentarios.

Cordialmente,
Dora Rodríguez Romero
Asistente Comercial
Nova Corp SAS
servicioalcliente@novacorp-plus.com
PBX (57) 601 7568230 | 3164352921
Calle 25F No. 85B-26 P.5
Bogotá, Colombia 
www.novacorp-plus.com`
    };
  } else if (type === 'cotizacion') {
    return {
      subject: 'Continuidad Servicios 2026',
      message: `Estimado Cliente ${clientName} buen día, 

Atendiendo el asunto citado, en los siguientes enlaces encuentra los documentos:

  • Propuesta Renovación Servicios:
      ${linkCotizacion}

  • Paquete Documentos Legales.
      https://novacorp20-my.sharepoint.com/:f:/g/personal/contabilidad_novacorp-plus_com/IgApsGWWqGZkTrI7YMCbH2RXAUn1FiPxv7zHX-6w73hfQjM
 

A la espera de su confirmación del recibido.

Cordialmente,
Dora Rodríguez Romero
Asistente Comercial
Nova Corp SAS
servicioalcliente@novacorp-plus.com
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
      const clientName = row["Razón social"] || "Cliente"
        const linkComunicado = row["Link_PDF_Comunicado"] || row["Link_Comunicado"] || "#"
        const linkCotizacion = row["Link_PDF_Renovacion"] || row["Link_Renovacion"] || "#"

        // Generar contenido según tipo
        const emailContent = getEmailContent(type, clientName, linkComunicado, linkCotizacion)

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
    }),
    )

    // Retornar resultados al cliente
    res.json({ results: sendResults })
  } catch (error) {
    console.error("Error enviando notificaciones desde Excel:", error)
    res.status(500).json({ error: "Error interno del servidor", detail: error.message })
  }
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

router.post("/notifications/send-survey", async (req, res) => {
  try {
    const { excelData, defaultSubject, defaultBody, provider, defaultCC, attachmentPath } = req.body

    if (!excelData || !Array.isArray(excelData)) {
      return res.status(400).json({ error: "Datos de Excel requeridos en formato array" })
    }

    if (!defaultSubject || !defaultBody) {
      return res.status(400).json({ error: "Asunto y cuerpo por defecto son requeridos" })
    }

    if (!provider) {
      return res.status(400).json({ error: "Proveedor de correo requerido" })
    }

    const defaultCCArray = (defaultCC || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    let attachmentConfig = null
    if (attachmentPath && attachmentPath.trim()) {
      // Convert single backslashes to double backslashes for JSON
      const normalizedPath = attachmentPath.replace(/\\/g, "\\\\")

      // Extract filename from path (handles both / and \\ separators)
      const pathParts = attachmentPath.split(/[/\\]/)
      const filename = pathParts[pathParts.length - 1] || "archivo.pdf"

      attachmentConfig = {
        filename,
        filePath: normalizedPath,
      }
    }

    // Inicializar resultados y log
    const sendResults = []
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const logFilename = `survey_log_${timestamp}.txt`
    const logPath = path.join(LOG_TEMP_PATH, logFilename)

    let logContent = "=".repeat(80) + "\n"
    logContent += "LOG DE ENVÍO DE ENCUESTAS DE SATISFACCIÓN\n"
    logContent += `Fecha: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}\n`
    logContent += `Total de correos a enviar: ${excelData.length}\n`
    logContent += `Proveedor: ${provider}\n`
    logContent += `CC por defecto: ${defaultCCArray.length > 0 ? defaultCCArray.join(", ") : "N/A"}\n`
    logContent += `Adjunto: ${attachmentConfig ? attachmentConfig.filename : "N/A"}\n`
    logContent += "=".repeat(80) + "\n\n"
    
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i]

      // Columna C (índice 2): Nombre/Razón social
      const clientName = row[2] || "Cliente"

      // Columna D (índice 3): Nombre de contacto
      const contactName = row[3] || ""

      // Columna F (índice 5): Correo electrónico
      const recipient = (row[5] || "").trim() || "servicioalcliente@novacorp-plus.com"

      // Columna H (índice 7): Asunto personalizado
      const customSubject = (row[7] || "").trim()

      // Columna I (índice 8): Cuerpo personalizado
      const customBody = (row[8] || "").trim()

      // Columna J (índice 9): CC del Excel
      const excelCCStr = (row[9] || "").trim()
      const excelCCArray = excelCCStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const combinedCC = [...defaultCCArray, ...excelCCArray]

      let finalSubject = customSubject || defaultSubject
      if (!customSubject) {
        finalSubject = finalSubject.replace(/\{clientName\}/g, clientName).replace(/\{contactName\}/g, contactName)
      }

      let finalBody = customBody || defaultBody
      if (!customBody) {
        finalBody = finalBody.replace(/\{clientName\}/g, clientName).replace(/\{contactName\}/g, contactName)
      }

      // Construir payload para el servicio externo
      const payload = {
          channels: ["email"],
          provider,
          recipient,
          subject: finalSubject,
          message: finalBody,
          ...(combinedCC.length > 0 && { cc: combinedCC }),
          ...(attachmentConfig && { attachments: [attachmentConfig] }),
      }

      console.log(
        `[v0] Enviando encuesta ${i + 1}/${excelData.length} a:`,
        recipient,
        "con asunto:",
        finalSubject,
        "provider:",
        provider,
        "cc:",
        combinedCC.length > 0 ? combinedCC : "sin CC",
        "attachments:",
        attachmentConfig ? `${attachmentConfig.filename}` : "sin adjunto",
      )

      // Agregar entrada al log
      logContent += `\n${"─".repeat(80)}\n`
      logContent += `ENVÍO #${i + 1} de ${excelData.length}\n`
      logContent += `Hora: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}\n`
      logContent += `Cliente: ${clientName}\n`
      logContent += `Contacto: ${contactName}\n`
      logContent += `Destinatario: ${recipient}\n`
      logContent += `CC: ${combinedCC.length > 0 ? combinedCC.join(", ") : "N/A"}\n`
      logContent += `Asunto: ${finalSubject}\n`
      logContent += `Adjunto: ${attachmentConfig ? attachmentConfig.filename : "N/A"}\n`

      // Llamar al servicio externo de notificaciones
      try {
        const response = await fetch(NOTIFICATIONS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const text = await response.text()

        sendResults.push({
          success: response.ok,
          status: response.status,
          response: text,
          recipient,
          clientName,
          contactName,
        })

        logContent += `Estado: ${response.ok ? "EXITOSO" : "FALLIDO"}\n`
        logContent += `Código HTTP: ${response.status}\n`
        logContent += `Respuesta: ${text.substring(0, 300)}${text.length > 300 ? "..." : ""}\n`
      } catch (fetchError) {
        sendResults.push({
          success: false,
          status: 500,
          response: fetchError.message,
          recipient,
          clientName,
          contactName,
        })

        logContent += `Estado: ERROR\n`
        logContent += `Error: ${fetchError.message}\n`
      }

      // Delay de 2 segundos entre envíos para evitar límite SMTP
      if (i < excelData.length - 1) {
        await delay(2000)
      }
    }

    // Resumen final del log
    const successCount = sendResults.filter((r) => r.success).length
    const failCount = sendResults.length - successCount

    logContent += "\n" + "=".repeat(80) + "\n"
    logContent += "RESUMEN FINAL\n"
    logContent += "=".repeat(80) + "\n"
    logContent += `Total enviados: ${sendResults.length}\n`
    logContent += `Exitosos: ${successCount}\n`
    logContent += `Fallidos: ${failCount}\n`
    logContent += `Porcentaje de éxito: ${((successCount / sendResults.length) * 100).toFixed(2)}%\n`
    logContent += `Finalizado: ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}\n`
    logContent += "=".repeat(80) + "\n"

    // Guardar archivo de log
    fs.writeFileSync(logPath, logContent, "utf8")
    console.log(`[v0] Log guardado en: ${logPath}`)

    // Retornar resultados al cliente con nombre del archivo de log
    res.json({ 
      results: sendResults,
      logFilename: logFilename
    });
  } catch (error) {
    console.error("Error enviando encuestas de satisfacción:", error);
    res.status(500).json({ error: "Error interno del servidor", detail: error.message });
  }
});

// Endpoint para descargar el archivo de log
router.get("/notifications/download-log/:filename", (req, res) => {
  try {
    const { filename } = req.params
    const logPath = path.join(LOG_TEMP_PATH, filename)

    // Validar que el nombre del archivo sea válido
    if (!filename.startsWith("survey_log_") || !filename.endsWith(".txt")) {
      return res.status(400).json({ error: "Nombre de archivo inválido" })
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: "Archivo de log no encontrado" })
    }

    // Enviar archivo para descarga
    res.download(logPath, filename, (err) => {
      if (err) {
        console.error("Error descargando log:", err)
        if (!res.headersSent) {
          res.status(500).json({ error: "Error descargando archivo" })
        }
      }
    })
  } catch (error) {
    console.error("Error en descarga de log:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

module.exports = router;
