import os
import requests
import msal
from dotenv import load_dotenv
import tempfile

# Cargar variables de entorno
load_dotenv()

def get_access_token():
    """Obtener token de acceso usando MSAL"""
    try:
        client_id = os.environ.get('AZURE_CLIENT_ID')
        client_secret = os.environ.get('AZURE_CLIENT_SECRET')
        tenant_id = os.environ.get('AZURE_TENANT_ID')
        
        if not all([client_id, client_secret, tenant_id]):
            print("[ERROR] Faltan credenciales de Azure en .env")
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
            print(f"[ERROR] Error obteniendo token: {result.get('error_description')}")
            return None
            
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        return None

def get_files_from_source(access_token, source_email):
    """Obtener archivos de la carpeta Documentos_Merge del usuario origen"""
    headers = {'Authorization': f'Bearer {access_token}'}
    
    search_url = f"https://graph.microsoft.com/v1.0/users/{source_email}/drive/root:/Documentos_Merge:/children"
    response = requests.get(search_url, headers=headers)
    
    if response.status_code != 200:
        print(f"[ERROR] No se pudo acceder a Documentos_Merge de {source_email}: {response.text}")
        return []
    
    files = response.json().get('value', [])
    print(f"[INFO] Encontrados {len(files)} archivos en Documentos_Merge de {source_email}")
    
    return files

def download_file(access_token, source_email, file_info):
    """Descargar archivo desde OneDrive origen"""
    download_url = file_info.get('@microsoft.graph.downloadUrl')
    
    if not download_url:
        print(f"[WARNING] No se pudo obtener URL de descarga para {file_info['name']}")
        return None
    
    response = requests.get(download_url)
    if response.status_code == 200:
        return response.content
    else:
        print(f"[ERROR] Error descargando {file_info['name']}: {response.text}")
        return None

def upload_file_to_destination(access_token, dest_email, file_name, file_content):
    """Subir archivo a OneDrive destino"""
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Crear carpeta Documentos_Merge si no existe
    folder_url = f"https://graph.microsoft.com/v1.0/users/{dest_email}/drive/root:/Documentos_Merge"
    folder_response = requests.get(folder_url, headers=headers)
    
    if folder_response.status_code == 404:
        # Crear carpeta
        create_folder_url = f"https://graph.microsoft.com/v1.0/users/{dest_email}/drive/root/children"
        folder_data = {
            "name": "Documentos_Merge",
            "folder": {}
        }
        create_response = requests.post(create_folder_url, headers={**headers, 'Content-Type': 'application/json'}, json=folder_data)
        if create_response.status_code not in [200, 201]:
            print(f"[ERROR] No se pudo crear carpeta Documentos_Merge: {create_response.text}")
            return False
        print("[INFO] Carpeta Documentos_Merge creada")
    
    # Subir archivo
    upload_url = f"https://graph.microsoft.com/v1.0/users/{dest_email}/drive/root:/Documentos_Merge/{file_name}:/content"
    upload_response = requests.put(upload_url, headers=headers, data=file_content)
    
    if upload_response.status_code in [200, 201]:
        print(f"[INFO] Archivo copiado: {file_name}")
        return True
    else:
        print(f"[ERROR] Error subiendo {file_name}: {upload_response.text}")
        return False

def copy_documents_merge():
    """Función principal para copiar archivos"""
    print("[INFO] Iniciando copia de archivos de Documentos_Merge...")
    
    access_token = get_access_token()
    if not access_token:
        print("[ERROR] No se pudo obtener token de acceso")
        return
    
    source_email = "mcanas@novacorp-plus.com"
    dest_email = "mcanas@novacorp-plus.com"
    
    # Obtener archivos del origen
    files = get_files_from_source(access_token, source_email)
    
    if not files:
        print("[INFO] No se encontraron archivos para copiar")
        return
    
    copied_count = 0
    
    for file_info in files:
        file_name = file_info['name']
        print(f"[INFO] Procesando: {file_name}")
        
        # Descargar archivo
        file_content = download_file(access_token, source_email, file_info)
        
        if file_content:
            # Subir a destino
            if upload_file_to_destination(access_token, dest_email, file_name, file_content):
                copied_count += 1
    
    print(f"[INFO] Copia completada: {copied_count} archivos copiados de {len(files)} encontrados")

if __name__ == "__main__":
    copy_documents_merge()