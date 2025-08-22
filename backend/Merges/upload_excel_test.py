import os
from dotenv import load_dotenv
import msal
from onedrive_uploader import OneDriveUploader
from sharepoint_downloader import SharePointDownloader

# Cargar variables de entorno
load_dotenv()

def get_access_token():
    """Obtener token de acceso usando MSAL"""
    try:
        client_id = os.environ.get('AZURE_CLIENT_ID')
        client_secret = os.environ.get('AZURE_CLIENT_SECRET')
        tenant_id = os.environ.get('AZURE_TENANT_ID')
        
        if not all([client_id, client_secret, tenant_id]):
            print("❌ Faltan credenciales de Azure en .env")
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
            print(f"❌ Error obteniendo token: {result.get('error_description')}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def upload_excel_to_onedrive():
    """Descargar Excel de SharePoint y subirlo al OneDrive de salfonso"""
    
    print("📥 Descargando Excel desde SharePoint...")
    
    # Obtener token
    access_token = get_access_token()
    if not access_token:
        return False
    
    # Descargar Excel desde SharePoint
    sharepoint_url = os.environ.get('SHAREPOINT_EXCEL_URL')
    if not sharepoint_url:
        print("❌ SHAREPOINT_EXCEL_URL no configurado")
        return False
    
    downloader = SharePointDownloader(access_token)
    temp_excel_path = downloader.download_excel_from_sharepoint(sharepoint_url)
    
    if not temp_excel_path:
        print("❌ No se pudo descargar Excel desde SharePoint")
        return False
    
    print("✅ Excel descargado exitosamente")
    
    # Subir al OneDrive de salfonso
    print("📤 Subiendo Excel al OneDrive de salfonso...")
    
    uploader = OneDriveUploader(access_token, user_upn="salfonso@novacorp20.onmicrosoft.com")
    
    # Crear carpeta
    folder_path = "Documentos_Merges"
    uploader.create_folder(folder_path)
    
    # Subir archivo
    filename = "clientes.xlsx"
    success = uploader.upload_file(temp_excel_path, folder_path, filename)
    
    # Limpiar archivo temporal
    downloader.cleanup_temp_file(temp_excel_path)
    
    if success:
        print(f"✅ Excel subido exitosamente: {folder_path}/{filename}")
        return True
    else:
        print("❌ Error subiendo Excel")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando subida de Excel de prueba...")
    success = upload_excel_to_onedrive()
    
    if success:
        print("\n🎉 ¡Proceso completado exitosamente!")
        print("📁 Ubicación: salfonso@novacorp20.onmicrosoft.com/Documentos_Merges/clientes.xlsx")
    else:
        print("\n❌ El proceso falló")