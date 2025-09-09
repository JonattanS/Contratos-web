const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Ruta POST para ejecutar el script Comunicado.py
router.post('/ejecutar-comunicado', (req, res) => {
  const mergesPath = path.join(__dirname, '..', 'Merges');
  const scriptPath = path.join(mergesPath, 'Comunicado.py');
  const pythonCmd = 'python3';

  let output = '';
  let errorOutput = '';

  const proceso = spawn(pythonCmd, [scriptPath], { cwd: mergesPath });

  proceso.stdout.on('data', (data) => {
    output += data.toString();
  });

  proceso.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  proceso.on('error', (err) => {
    // Error al lanzar python3
    return res.status(500).json({ success: false, error: err.message });
  });

  proceso.on('close', (code) => {
    res.json({
      success: code === 0,
      output,
      error: errorOutput,
      exitCode: code
    });
  });
});

module.exports = router;
