import os
from dotenv import load_dotenv
import msal
import requests
import tempfile
from datetime import datetime
from onedrive_uploader import OneDriveUploader

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
            
            # Primero listar usuarios disponibles
            print("\n[INFO] Verificando usuarios disponibles...")
            users_response = requests.get(
                "https://graph.microsoft.com/v1.0/users?$select=userPrincipalName,displayName&$top=10",
                headers=headers
            )
            
            if users_response.status_code == 200:
                users = users_response.json().get('value', [])
                print(f"[INFO] Usuarios encontrados ({len(users)}):")
                for user in users:
                    print(f"  - {user.get('userPrincipalName')} ({user.get('displayName')})")
                
                # Usar el email configurado para acceder a su OneDrive
                email = os.environ.get('EXTERNAL_ONEDRIVE_EMAIL', 'servicioalcliente@novacorp-plus.com')
                print(f"\n[INFO] Intentando acceder a OneDrive de: {email}")
                
                response = requests.get(
                    f"https://graph.microsoft.com/v1.0/users/{email}/drive",
                    headers=headers
                )
                
                if response.status_code == 200:
                    print("[SUCCESS] Acceso a OneDrive confirmado")
                    drive_info = response.json()
                    print(f"OneDrive: {drive_info.get('name', 'N/A')}")
                    
                    # Crear documento de prueba
                    print("\n[INFO] Creando documento de prueba...")
                    success_test = create_test_document(result["access_token"], email)
                    
                    return success_test
                else:
                    print(f"[ERROR] Error accediendo a OneDrive: {response.status_code}")
                    print(f"Respuesta: {response.text}")
                    
                    # Si el usuario configurado no funciona, probar con el primer usuario disponible
                    if users and users[0].get('userPrincipalName'):
                        test_email = users[0]['userPrincipalName']
                        print(f"\n[INFO] Probando con primer usuario disponible: {test_email}")
                        
                        test_response = requests.get(
                            f"https://graph.microsoft.com/v1.0/users/{test_email}/drive",
                            headers=headers
                        )
                        
                        if test_response.status_code == 200:
                            print("[SUCCESS] Acceso a OneDrive confirmado con usuario alternativo")
                            print(f"[SUGERENCIA] Cambiar EXTERNAL_ONEDRIVE_EMAIL a: {test_email}")
                            return True
                    
                    return False
            else:
                print(f"[ERROR] Error listando usuarios: {users_response.status_code}")
                print(f"Respuesta: {users_response.text}")
                return False
                
        else:
            print("[ERROR] Error obteniendo token:")
            print(f"Error: {result.get('error')}")
            print(f"Descripción: {result.get('error_description')}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error de conexión: {str(e)}")
        return False

def create_test_document(access_token, email):
    """Crear documento de prueba en OneDrive"""
    try:
        # Crear contenido del documento
        test_content = f"""PRUEBA DE CONFIGURACIÓN AZURE AD

Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Usuario: {email}
Estado: ÉXITO

La configuración de Azure AD y Microsoft Graph API está funcionando correctamente.
Este documento fue creado automáticamente para verificar la conectividad.

¡Configuración exitosa!"""
        
        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as temp_file:
            temp_file.write(test_content)
            temp_file_path = temp_file.name
        
        # Subir usando OneDriveUploader
        uploader = OneDriveUploader(access_token, user_upn=email)
        
        # Crear carpeta de prueba
        folder_path = "Documentos_Prueba"
        uploader.create_folder(folder_path)
        
        # Subir archivo
        filename = f"exito_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        success = uploader.upload_file(temp_file_path, folder_path, filename)
        
        # Limpiar archivo temporal
        os.unlink(temp_file_path)
        
        if success:
            print(f"[SUCCESS] Documento de prueba creado: {folder_path}/{filename}")
            return True
        else:
            print("[ERROR] No se pudo crear el documento de prueba")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error creando documento de prueba: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_azure_configuration()
    
    if not success:
        print("\n[HELP] Pasos para corregir:")
        print("1. Verificar que el Client Secret sea válido (no un GUID)")
        print("2. Confirmar permisos en Azure AD: Files.ReadWrite.All")
        print("3. Verificar que el Tenant ID sea correcto")
        print("4. Asegurar que la aplicación tenga 'Grant admin consent'")