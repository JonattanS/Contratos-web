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
TEMPLATE_PATH1 = os.path.join(os.path.dirname(__file__), "PROPUESTA FE Y NE RENOVACION 202X -CLIENTE1.docx")
TEMPLATE_PATH2 = os.path.join(os.path.dirname(__file__), "PROPUESTA FE RENOVACION 202X -CLIENTE2.docx")
OUTPUT_DIR = os.path.join(ONEDRIVE_PATH, "Documentos_Generados", "Renovaciones")

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
    
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp-plus.com')
    
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

def get_onedrive_link(file_path, access_token):
    """Obtener link compartible de OneDrive para un archivo"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Obtener información del archivo
    file_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/{file_path}"
    response = requests.get(file_url, headers=headers)
    
    if response.status_code == 200:
        file_info = response.json()
        return file_info.get('webUrl', '')
    return ''

def update_excel_with_link(nit, document_link):
    """Actualizar Excel con el link del documento generado"""
    global df, temp_excel_path, access_token
    
    # Buscar la fila correspondiente al NIT
    nit_column = df.columns[0]  # Primera columna es NIT
    mask = df[nit_column].astype(str) == str(nit)
    
    if mask.any():
        # Agregar columna de link si no existe
        if 'Link_Renovacion' not in df.columns:
            df['Link_Renovacion'] = ''
        
        # Actualizar el link
        df.loc[mask, 'Link_Renovacion'] = document_link
        
        # Guardar Excel actualizado
        df.to_excel(temp_excel_path, index=False, engine='openpyxl')
        
        # Subir Excel actualizado a OneDrive
        upload_excel_to_onedrive()

def upload_excel_to_onedrive():
    """Subir Excel actualizado de vuelta a OneDrive"""
    global access_token, temp_excel_path
    
    if not access_token or not temp_excel_path:
        return
    
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp-plus.com')
    
    # Obtener nombre del archivo Excel original
    search_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge:/children"
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(search_url, headers=headers)
    
    if response.status_code == 200:
        files = response.json().get('value', [])
        excel_files = [f for f in files if f['name'].endswith(('.xlsx', '.xls'))]
        
        if excel_files:
            excel_name = excel_files[0]['name']
            
            # Subir archivo actualizado
            with open(temp_excel_path, 'rb') as file_content:
                upload_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge/{excel_name}:/content"
                upload_response = requests.put(upload_url, headers=headers, data=file_content)
                
                if upload_response.status_code in [200, 201]:
                    print(f"[INFO] Excel actualizado en OneDrive: {excel_name}")
                else:
                    print(f"[WARNING] Error actualizando Excel: {upload_response.text}")

# Cargar Excel
df = get_excel_data()

# Función para reemplazar etiquetas en párrafos y tablas
def reemplazar_etiquetas(doc, datos):
    fecha_actual = datetime.now()
    meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    datos_fecha = {
        'día': str(fecha_actual.day),
        'Mes': meses[fecha_actual.month - 1],
        'AÑO': str(fecha_actual.year),  # AÑO en mayúscula porque en la plantilla lo está así
        'MES': meses[fecha_actual.month - 1].upper(),  # para el <MES> del pie de página si se escribe en mayúscula
        'año': str(fecha_actual.year),
        'mes': meses[fecha_actual.month - 1]
    }

    if 'Nombres y Apellidos' in datos:
        datos['Nombre'] = str(datos['Nombres y Apellidos']).split()[0]
    
    todos_datos = {**datos_fecha, **datos}

    def reemplazar_en_parrafos(parrafos):
         for p in parrafos:
            for key, value in todos_datos.items():
                patrones = [
                    f"<{key}>",        # <Valor por Documento>
                    f"« {key}»",       # « Valor por Documento»
                    f"$<{key}>",       # $<Valor por Documento>
                    f"${{key}}",       # ${Valor por Documento}, por si acaso
                ]
                for run in p.runs:
                    for etiqueta in patrones:
                        if etiqueta in run.text:
                            run.text = run.text.replace(etiqueta, str(value))

    def reemplazar_en_tablas(tablas):
        for table in tablas:
            for row in table.rows:
                for cell in row.cells:
                    reemplazar_en_parrafos(cell.paragraphs)

    reemplazar_en_parrafos(doc.paragraphs)
    reemplazar_en_tablas(doc.tables)

    #  Encabezado y pie de página
    for section in doc.sections:
        reemplazar_en_parrafos(section.footer.paragraphs)
        reemplazar_en_parrafos(section.header.paragraphs)


# Generar documentos
for idx, row in df.iterrows():
    nit = str(row.iloc[0])
    indicador = row.get('Indicador Tarifa', '')

    # Elegir plantilla según el valor numérico del indicador
    if pd.isna(indicador):
        print(f" Indicador vacío para NIT {nit}. Se usará plantilla 1 por defecto.")
        plantilla = TEMPLATE_PATH1
    elif str(indicador).strip() == "1":
        plantilla = TEMPLATE_PATH1
    elif str(indicador).strip() == "2":
        plantilla = TEMPLATE_PATH2
    else:
        print(f" Indicador no reconocido ('{indicador}') para NIT {nit}. Se usará plantilla 1 por defecto.")
        plantilla = TEMPLATE_PATH1

    # Cargar plantilla seleccionada
    doc = Document(plantilla)

    # Crear carpeta para cliente
    cliente_dir = os.path.join(OUTPUT_DIR, nit)
    os.makedirs(cliente_dir, exist_ok=True)

    # Agregar mapeo específico para RAZÓN SOCIAL
    datos_cliente = row.to_dict()
    if 'RAZÓN SOCIAL' in datos_cliente or 'Razón Social' in datos_cliente:
        # Usar el campo tal como está en el Excel
        pass
    elif 'Razon Social' in datos_cliente:
        datos_cliente['RAZÓN SOCIAL'] = datos_cliente['Razon Social']
    
    # Reemplazar etiquetas
    reemplazar_etiquetas(doc, datos_cliente)

    # Guardar documento
    nombre_archivo = f"Renovacion_{datetime.now().year}_{nit}.docx"
    
    if os.environ.get('UPLOAD_TO_EXTERNAL', 'false').lower() == 'true':
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            doc.save(temp_file.name)

            # Obtener token y subir
            access_token = get_access_token()
            if access_token:
                uploader = OneDriveUploader(access_token, user_upn="servicioalcliente@novacorp-plus.com")

                folder_path = f"Documentos_Generados/Renovaciones/{nit}"
                uploader.create_folder(folder_path)
                uploader.upload_file(temp_file.name, folder_path, nombre_archivo)
                
                # Obtener link del documento y actualizar Excel
                document_path = f"{folder_path}/{nombre_archivo}"
                document_link = get_onedrive_link(document_path, access_token)
                if document_link:
                    update_excel_with_link(nit, document_link)
                    print(f"[INFO] Link guardado en Excel para NIT {nit}")

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
