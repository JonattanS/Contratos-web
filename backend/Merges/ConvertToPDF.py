import os
import requests
import msal
from dotenv import load_dotenv
import tempfile
import time
import pandas as pd

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

def get_all_word_documents(access_token, folder_path):
    """Obtener todos los documentos Word de una carpeta en OneDrive"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'mcanas@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Buscar en la carpeta especificada
    search_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/{folder_path}:/children"
    
    response = requests.get(search_url, headers=headers)
    
    if response.status_code != 200:
        print(f"[ERROR] No se pudo acceder a la carpeta {folder_path}: {response.text}")
        return []
    
    files = response.json().get('value', [])
    word_files = []
    
    for file in files:
        if file['name'].endswith('.docx'):
            word_files.append({
                'name': file['name'],
                'id': file['id'],
                'path': f"{folder_path}/{file['name']}"
            })
        elif 'folder' in file:
            # Si es una carpeta, buscar recursivamente
            subfolder_path = f"{folder_path}/{file['name']}"
            subfolder_files = get_all_word_documents(access_token, subfolder_path)
            word_files.extend(subfolder_files)
    
    return word_files

def convert_word_to_pdf(access_token, file_id, file_name, file_folder):
    """Convertir un documento Word a PDF y guardarlo en la misma carpeta"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'mcanas@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # URL para convertir a PDF
    convert_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/items/{file_id}/content?format=pdf"
    
    print(f"[INFO] Convirtiendo: {file_name}")
    
    response = requests.get(convert_url, headers=headers)
    
    if response.status_code == 200:
        # Crear nombre del archivo PDF
        pdf_name = file_name.replace('.docx', '.pdf')
        
        # Subir PDF a la misma carpeta que el Word
        upload_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/{file_folder}/{pdf_name}:/content"
        
        upload_response = requests.put(upload_url, headers=headers, data=response.content)
        
        if upload_response.status_code in [200, 201]:
            print(f"[INFO] PDF creado: {pdf_name}")
            # Obtener link del PDF
            pdf_link = get_onedrive_link(f"{file_folder}/{pdf_name}", access_token)
            return pdf_link
        else:
            print(f"[ERROR] Error subiendo PDF {pdf_name}: {upload_response.text}")
            return None
    else:
        print(f"[ERROR] Error convirtiendo {file_name}: {response.text}")
        return None

def get_onedrive_link(file_path, access_token):
    """Obtener link compartible de OneDrive para un archivo"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'mcanas@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    file_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/{file_path}"
    response = requests.get(file_url, headers=headers)
    
    if response.status_code == 200:
        file_info = response.json()
        return file_info.get('webUrl', '')
    return ''

def download_and_update_excel(access_token):
    """Descargar Excel desde OneDrive para actualizar"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'mcanas@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Buscar Excel en Documentos_Merge
    search_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge:/children"
    response = requests.get(search_url, headers=headers)
    
    if response.status_code != 200:
        print("[ERROR] No se pudo acceder a Documentos_Merge")
        return None, None
    
    files = response.json().get('value', [])
    excel_files = [f for f in files if f['name'].endswith(('.xlsx', '.xls'))]
    
    if not excel_files:
        print("[ERROR] No se encontró Excel en Documentos_Merge")
        return None, None
    
    excel_file = excel_files[0]
    download_url = excel_file['@microsoft.graph.downloadUrl']
    
    # Descargar Excel
    file_response = requests.get(download_url)
    if file_response.status_code != 200:
        return None, None
    
    # Guardar temporalmente
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_file.write(file_response.content)
    temp_file.close()
    
    df = pd.read_excel(temp_file.name, engine='openpyxl')
    return df, temp_file.name

def upload_excel_to_onedrive(access_token, temp_excel_path):
    """Subir Excel actualizado de vuelta a OneDrive"""
    user_email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'mcanas@novacorp-plus.com')
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Obtener nombre del Excel original
    search_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge:/children"
    response = requests.get(search_url, headers=headers)
    
    if response.status_code == 200:
        files = response.json().get('value', [])
        excel_files = [f for f in files if f['name'].endswith(('.xlsx', '.xls'))]
        
        if excel_files:
            excel_name = excel_files[0]['name']
            
            with open(temp_excel_path, 'rb') as file_content:
                upload_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root:/Documentos_Merge/{excel_name}:/content"
                upload_response = requests.put(upload_url, headers=headers, data=file_content)
                
                if upload_response.status_code in [200, 201]:
                    print("[INFO] Excel actualizado con links de PDFs")
                    return True
    return False

def extract_nit_from_filename(filename, folder_type):
    """Extraer NIT del nombre del archivo"""
    if folder_type == "Comunicados":
        # Comunicado_2024_123456789.docx -> 123456789
        parts = filename.replace('.docx', '').split('_')
        if len(parts) >= 3:
            return parts[2]
    elif folder_type == "Renovaciones":
        # Renovacion_2024_123456789.docx -> 123456789
        parts = filename.replace('.docx', '').split('_')
        if len(parts) >= 3:
            return parts[2]
    return None

def main():
    """Función principal para convertir documentos"""
    print("[INFO] Iniciando conversión de documentos Word a PDF...")
    
    access_token = get_access_token()
    if not access_token:
        print("[ERROR] No se pudo obtener token de acceso")
        return
    
    # Carpetas a procesar
    carpetas = [
        "Documentos_Generados/Comunicados",
        "Documentos_Generados/Renovaciones"
    ]
    
    total_convertidos = 0
    
    # Descargar Excel para actualizar
    print("\n[INFO] Descargando Excel para actualizar...")
    df, temp_excel_path = download_and_update_excel(access_token)
    
    if df is None:
        print("[ERROR] No se pudo descargar Excel")
        return
    
    for carpeta in carpetas:
        print(f"\n[INFO] Procesando carpeta: {carpeta}")
        
        # Obtener todos los documentos Word
        word_files = get_all_word_documents(access_token, carpeta)
        
        if not word_files:
            print(f"[INFO] No se encontraron documentos Word en {carpeta}")
            continue
        
        print(f"[INFO] Encontrados {len(word_files)} documentos Word")
        
        # Convertir cada documento
        for word_file in word_files:
            # Obtener carpeta del archivo (mantener en la misma ubicación)
            file_folder = "/".join(word_file['path'].split("/")[:-1])
            
            pdf_link = convert_word_to_pdf(
                access_token, 
                word_file['id'], 
                word_file['name'], 
                file_folder
            )
            
            if pdf_link:
                total_convertidos += 1
                
                # Extraer NIT del nombre del archivo
                folder_type = "Comunicados" if "Comunicados" in carpeta else "Renovaciones"
                nit = extract_nit_from_filename(word_file['name'], folder_type)
                
                if nit:
                    # Actualizar Excel con link del PDF
                    if df is not None:
                        nit_column = df.columns[0]
                        mask = df[nit_column].astype(str) == str(nit)
                        
                        if mask.any():
                            # Crear columna según el tipo
                            link_column = 'Link_PDF_Comunicado' if folder_type == "Comunicados" else 'Link_PDF_Renovacion'
                            
                            if link_column not in df.columns:
                                df[link_column] = ''
                            
                            df.loc[mask, link_column] = pdf_link
                            print(f"[INFO] Link PDF actualizado para NIT {nit}")
                        else:
                            print(f"[WARNING] NIT {nit} no encontrado en Excel")
            
            # Pequeña pausa para evitar límites de API
            time.sleep(0.5)
    
    print(f"\n[INFO] Conversión completada: {total_convertidos} documentos convertidos a PDF")
    
    # Guardar Excel actualizado
    if temp_excel_path:
        df.to_excel(temp_excel_path, index=False, engine='openpyxl')
        upload_excel_to_onedrive(access_token, temp_excel_path)
        
        # Limpiar archivo temporal
        try:
            os.unlink(temp_excel_path)
        except Exception as e:
            print(f"[WARNING] No se pudo eliminar archivo temporal: {e}")

if __name__ == "__main__":
    main()