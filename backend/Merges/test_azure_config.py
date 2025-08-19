import os
from dotenv import load_dotenv
import msal
import requests

# Cargar variables de entorno
load_dotenv()

def test_azure_configuration():
    """Verificar configuración de Azure AD"""
    
    print("[INFO] Verificando configuración de Azure AD...")
    
    # Obtener credenciales
    client_id = os.environ.get('AZURE_CLIENT_ID')
    client_secret = os.environ.get('AZURE_CLIENT_SECRET')
    tenant_id = os.environ.get('AZURE_TENANT_ID')
    
    print(f"Client ID: {client_id}")
    print(f"Tenant ID: {tenant_id}")
    print(f"Client Secret: {'*' * len(client_secret) if client_secret else 'NO CONFIGURADO'}")
    
    # Verificar que todas las credenciales estén presentes
    if not all([client_id, client_secret, tenant_id]):
        print("[ERROR] Faltan credenciales en el archivo .env")
        return False
    
    # Verificar formato del Tenant ID
    if tenant_id.endswith('e'):
        print("[WARNING] Tenant ID parece tener un carácter extra al final")
        tenant_id = tenant_id.rstrip('e')
        print(f"Tenant ID corregido: {tenant_id}")
    
    try:
        print("\n[INFO] Intentando obtener token de acceso...")
        
        # Crear aplicación MSAL
        app = msal.ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            client_credential=client_secret
        )
        
        # Intentar obtener token
        result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        
        if "access_token" in result:
            print("[SUCCESS] Token obtenido exitosamente")
            
            # Probar acceso a Microsoft Graph
            print("\n[INFO] Probando acceso a Microsoft Graph...")
            
            headers = {
                'Authorization': f'Bearer {result["access_token"]}',
                'Content-Type': 'application/json'
            }
            
            # Probar acceso a Microsoft Graph con Application permissions
            # Usar el email configurado para acceder a su OneDrive
            email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp20.onmicrosoft.com')
            response = requests.get(
                f"https://graph.microsoft.com/v1.0/users/{email}/drive",
                headers=headers
            )
            
            if response.status_code == 200:
                print("[SUCCESS] Acceso a OneDrive confirmado")
                drive_info = response.json()
                print(f"OneDrive: {drive_info.get('name', 'N/A')}")
                return True
            else:
                print(f"[ERROR] Error accediendo a OneDrive: {response.status_code}")
                print(f"Respuesta: {response.text}")
                return False
                
        else:
            print("[ERROR] Error obteniendo token:")
            print(f"Error: {result.get('error')}")
            print(f"Descripción: {result.get('error_description')}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error de conexión: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_azure_configuration()
    
    if not success:
        print("\n[HELP] Pasos para corregir:")
        print("1. Verificar que el Client Secret sea válido (no un GUID)")
        print("2. Confirmar permisos en Azure AD: Files.ReadWrite.All")
        print("3. Verificar que el Tenant ID sea correcto")
        print("4. Asegurar que la aplicación tenga 'Grant admin consent'")