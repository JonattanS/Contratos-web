import os
from dotenv import load_dotenv
from onedrive_uploader import OneDriveUploader
import msal

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
            print("✅ Token de acceso obtenido exitosamente")
            return result["access_token"]
        else:
            print(f"❌ Error obteniendo token: {result.get('error_description')}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    print("🚀 Configurando OneDrive para Documentos_Merge...")
    
    # Obtener token
    access_token = get_access_token()
    if not access_token:
        return
    
    # Configurar uploader
    user_email = 'mcanas@novacorp20.onmicrosoft.com'
    uploader = OneDriveUploader(access_token, user_upn=user_email)
    
    print(f"📧 Usando cuenta: {user_email}")
    
    # Crear carpeta Documentos_Merge
    print("📁 Creando carpeta Documentos_Merge...")
    if uploader.create_folder("Documentos_Merge"):
        print("✅ Carpeta Documentos_Merge creada/verificada")
    else:
        print("❌ Error creando carpeta Documentos_Merge")
        return
    
    # Verificar que existe el archivo clientes.xlsx
    excel_path = "clientes.xlsx"
    if not os.path.exists(excel_path):
        print(f"❌ No se encontró el archivo {excel_path}")
        return
    
    # Subir archivo Excel
    print("📤 Subiendo clientes.xlsx a Documentos_Merge...")
    if uploader.upload_file(excel_path, "Documentos_Merge", "clientes.xlsx"):
        print("✅ Archivo clientes.xlsx subido exitosamente")
    else:
        print("❌ Error subiendo archivo clientes.xlsx")
        return
    
    print("🎉 Configuración completada exitosamente!")
    print("📋 Resumen:")
    print(f"   - Cuenta OneDrive: {user_email}")
    print("   - Carpeta creada: Documentos_Merge")
    print("   - Archivo subido: clientes.xlsx")

if __name__ == "__main__":
    main()