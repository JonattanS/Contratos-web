import pandas as pd
from docx import Document
import os
from datetime import datetime
from dotenv import load_dotenv
import tempfile
from onedrive_uploader import OneDriveUploader
import msal
import requests

# Cargar variables de entorno
load_dotenv()

# Rutas
ONEDRIVE_PATH = r"C:\Users\MCAÑAS\OneDrive - Nova Corp SAS"
EXCEL_PATH = os.path.join(ONEDRIVE_PATH, "Documentos", "clientes.xlsx")
TEMPLATE_PATH = "RENOVACION_202X_CLIENTE.docx"

# Configuración OneDrive externo (cambiar por la ruta compartida)
EXTERNAL_ONEDRIVE = os.environ.get('EXTERNAL_ONEDRIVE_PATH', ONEDRIVE_PATH)
OUTPUT_DIR = os.path.join(EXTERNAL_ONEDRIVE, "Documentos_Generados", "Comunicados")

# Crear carpeta de salida si no existe
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Cargar Excel
df = pd.read_excel(EXCEL_PATH)

# Leer plantilla Word
with open(TEMPLATE_PATH, 'rb') as file:
    template_doc = Document(file)

# Función para reemplazar etiquetas preservando formato
def reemplazar_etiquetas(doc, datos):
    # Obtener fecha actual
    fecha_actual = datetime.now()
    meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    # Crear diccionario con datos de fecha
    datos_fecha = {
        'día': str(fecha_actual.day),
        'Mes': meses[fecha_actual.month - 1],
        'año': str(fecha_actual.year)
    }
    
    # Extraer solo el primer nombre si existe el campo "Nombres y Apellidos"
    if 'Nombres y Apellidos' in datos:
        primer_nombre = str(datos['Nombres y Apellidos']).split()[0]
        datos['Nombre'] = primer_nombre
    
    # Combinar datos de fecha con datos del Excel
    todos_datos = {**datos_fecha, **datos}
    
    # Función auxiliar para reemplazar en párrafos
    def reemplazar_en_parrafos(parrafos):
        for p in parrafos:
            texto_completo = p.text
            for key, value in todos_datos.items():
                etiqueta_angular = f"<{key}>"
                etiqueta_guillemet = f"« {key}»"
                
                if etiqueta_angular in texto_completo or etiqueta_guillemet in texto_completo:
                    # Reemplazar en el texto completo del párrafo
                    nuevo_texto = texto_completo.replace(etiqueta_angular, str(value))
                    nuevo_texto = nuevo_texto.replace(etiqueta_guillemet, str(value))
                    
                    # Si hubo cambios, limpiar el párrafo y agregar el nuevo texto
                    if nuevo_texto != texto_completo:
                        p.clear()
                        p.add_run(nuevo_texto)
                        texto_completo = nuevo_texto
    
    # Reemplazar en párrafos principales
    reemplazar_en_parrafos(doc.paragraphs)
    
    # Reemplazar en tablas
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                reemplazar_en_parrafos(cell.paragraphs)

def get_access_token():
    """Obtener token de acceso usando MSAL"""
    try:
        client_id = os.environ.get('AZURE_CLIENT_ID')
        client_secret = os.environ.get('AZURE_CLIENT_SECRET')
        tenant_id = os.environ.get('AZURE_TENANT_ID')
        
        if not all([client_id, client_secret, tenant_id]):
            print(" Faltan credenciales de Azure en .env")
            return None
            
        app = msal.ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            client_credential=client_secret
        )
        
        result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        
        if "access_token" in result:
            return result["access_token"]
        else:
            print(f" Error obteniendo token: {result.get('error_description')}")
            return None
            
    except Exception as e:
        print(f" Error: {str(e)}")
        return None

# Generar un documento por cada fila del Excel
for idx, row in df.iterrows():
    # Obtener NIT (primera columna)
    nit = str(row.iloc[0])  # Primera columna del Excel
    
    # Crear carpeta para el cliente usando el NIT
    cliente_dir = os.path.join(OUTPUT_DIR, nit)
    os.makedirs(cliente_dir, exist_ok=True)
    
    # Cargar nuevamente la plantilla para cada cliente
    doc = Document(TEMPLATE_PATH)
    reemplazar_etiquetas(doc, row.to_dict())

    # Guardar documento
    nombre_archivo = f"Comunicado_{datetime.now().year}_{nit}.docx"
    
    if os.environ.get('UPLOAD_TO_EXTERNAL', 'false').lower() == 'true':
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            doc.save(temp_file.name)

            # Obtener token y subir
            access_token = get_access_token()
            if access_token:
                uploader = OneDriveUploader(access_token, user_upn="mcanas@novacorp20.onmicrosoft.com")
                folder_path = f"Documentos_Generados/Comunicados/{nit}"
                uploader.create_folder(folder_path)
                uploader.upload_file(temp_file.name, folder_path, nombre_archivo)

            os.unlink(temp_file.name)
    else:
        local_path = os.path.join(cliente_dir, nombre_archivo)
        doc.save(local_path)
        print(f" Documento generado: {local_path}")
