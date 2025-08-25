import pandas as pd
from docx import Document
import os
from datetime import datetime
from dotenv import load_dotenv
import tempfile
from onedrive_uploader import OneDriveUploader
import msal
import requests
import time

# Cargar variables de entorno
load_dotenv()

# Rutas
ONEDRIVE_PATH = r"C:\Users\MCAÑAS\OneDrive - Nova Corp SAS"
SHAREPOINT_EXCEL_URL = os.environ.get('SHAREPOINT_EXCEL_URL')
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "RENOVACION_202X_CLIENTE.docx")

# Configuración OneDrive externo (cambiar por la ruta compartida)
EXTERNAL_ONEDRIVE = os.environ.get('EXTERNAL_ONEDRIVE_PATH', ONEDRIVE_PATH)
OUTPUT_DIR = os.path.join(EXTERNAL_ONEDRIVE, "Documentos_Generados", "Comunicados")

# Crear carpeta de salida si no existe
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Obtener token para descargar Excel desde SharePoint
access_token = None
temp_excel_path = None

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

def download_excel_from_onedrive():
    """Descargar Excel desde OneDrive carpeta Documentos_Merge"""
    global access_token
    
    if not access_token:
        access_token = get_access_token()
    
    if not access_token:
        raise ValueError("No se pudo obtener token de acceso de Azure")
    
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp20.onmicrosoft.com')
    
    # Buscar archivos Excel en la carpeta Documentos_Merge
    search_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge:/children"
    
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(search_url, headers=headers)
    
    if response.status_code != 200:
        raise FileNotFoundError(f"No se pudo acceder a la carpeta Documentos_Merge: {response.text}")
    
    files = response.json().get('value', [])
    excel_files = [f for f in files if f['name'].endswith(('.xlsx', '.xls'))]
    
    if not excel_files:
        raise FileNotFoundError("No se encontraron archivos Excel en Documentos_Merge")
    
    # Usar el primer archivo Excel encontrado
    excel_file = excel_files[0]
    download_url = excel_file['@microsoft.graph.downloadUrl']
    
    print(f"[INFO] Descargando Excel desde OneDrive: {excel_file['name']}")
    
    # Descargar archivo
    file_response = requests.get(download_url)
    if file_response.status_code != 200:
        raise FileNotFoundError("No se pudo descargar el archivo Excel")
    
    # Guardar en archivo temporal
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_file.write(file_response.content)
    temp_file.close()
    
    return temp_file.name

def get_excel_data():
    global access_token, temp_excel_path
    
    # Usar OneDrive como única fuente
    print("[INFO] Descargando Excel desde OneDrive...")
    temp_excel_path = download_excel_from_onedrive()
    
    if not temp_excel_path:
        raise FileNotFoundError("No se pudo descargar el Excel desde OneDrive")
    
    return pd.read_excel(temp_excel_path, engine='openpyxl')

# Cargar Excel
df = get_excel_data()

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
                uploader = OneDriveUploader(access_token, user_upn="servicioalcliente@novacorp20.onmicrosoft.com")
                folder_path = f"Documentos_Generados/Comunicados/{nit}"
                uploader.create_folder(folder_path)
                uploader.upload_file(temp_file.name, folder_path, nombre_archivo)

            # Intentar eliminar archivo temporal con reintentos
            for attempt in range(3):
                try:
                    time.sleep(0.1)  # Pequeño delay
                    os.unlink(temp_file.name)
                    break
                except PermissionError:
                    if attempt == 2:  # Último intento
                        print(f"[WARNING] No se pudo eliminar archivo temporal: {temp_file.name}")
                    else:
                        time.sleep(0.5)  # Esperar más tiempo
    else:
        local_path = os.path.join(cliente_dir, nombre_archivo)
        doc.save(local_path)
        print(f" Documento generado: {local_path}")

# Limpiar archivo temporal si se usó
if temp_excel_path:
    try:
        os.unlink(temp_excel_path)
        print(f"[INFO] Archivo temporal eliminado: {temp_excel_path}")
    except Exception as e:
        print(f"[WARNING] No se pudo eliminar archivo temporal: {e}")
