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
        // Intentar con python primero, luego con ruta completa
        let pythonCmd = 'python';
        
        // Si falla python, intentar con la ruta completa
        try {
            const proceso = spawn(pythonCmd, [scriptPath], { cwd: mergesPath });
            
            // Si spawn falla inmediatamente, intentar con ruta completa
            proceso.on('error', (err) => {
                if (err.code === 'ENOENT') {
                    // Intentar con ruta completa de Python
                    const pythonFullPath = 'C:\\Program Files\\Python313\\python.exe';
                    const procesoFallback = spawn(pythonFullPath, [scriptPath], { cwd: mergesPath });
                    
                    procesoFallback.stdout.on('data', (data) => {
                        output += data.toString();
                    });
            
                    procesoFallback.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });
            
                    procesoFallback.on('close', (code) => {
                        res.json({
                            success: code === 0,
                            output,
                            error: errorOutput,
                            exitCode: code
                        });
                    });
                    
                    return;
                }
            });

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
        } catch (spawnErr) {
            // Si spawn falla, intentar con ruta completa
            const pythonFullPath = 'C:\\Program Files\\Python313\\python.exe';
            const procesoFallback = spawn(pythonFullPath, [scriptPath], { cwd: mergesPath });
            
            let output = '';
            let errorOutput = '';
            
            procesoFallback.stdout.on('data', (data) => {
                output += data.toString();
            });
    
            procesoFallback.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
    
            procesoFallback.on('close', (code) => {
                res.json({
                    success: code === 0,
                    output,
                    error: errorOutput,
                    exitCode: code
                });
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
