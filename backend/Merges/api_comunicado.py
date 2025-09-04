from flask import Flask, jsonify
import subprocess
import sys
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/generar-comunicados', methods=['POST'])
def generar_comunicados():
    try:
        # Obtener la ruta del script
        script_path = os.path.join(os.path.dirname(__file__), 'Comunicado.py')
        
        # Ejecutar el script
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, 
                              text=True, 
                              cwd=os.path.dirname(__file__))
        
        if result.returncode == 0:
            return jsonify({
                'status': 'success',
                'message': 'Comunicados generados exitosamente',
                'output': result.stdout,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Error al generar comunicados',
                'error': result.stderr,
                'timestamp': datetime.now().isoformat()
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error interno: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'Generador de Comunicados',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)