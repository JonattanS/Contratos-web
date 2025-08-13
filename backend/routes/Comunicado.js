const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Ruta POST para ejecutar el script
router.post('/ejecutar-comunicado', (req, res) => {
    // Carpeta base donde está el script y los archivos .xlsx y .docx
    const mergesPath = path.join(__dirname, '..', 'Merges');
    const scriptPath = path.join(mergesPath, 'Comunicado.py');

    try {
        // Ejecutar el script usando Python y asegurar cwd en Merges
        const proceso = spawn('python', [scriptPath], { cwd: mergesPath });

        let output = '';
        let errorOutput = '';

        proceso.stdout.on('data', (data) => {
            output += data.toString();
        });

        proceso.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proceso.on('close', (code) => {
            res.json({
                success: code === 0,
                output,
                error: errorOutput,
                exitCode: code
            });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
