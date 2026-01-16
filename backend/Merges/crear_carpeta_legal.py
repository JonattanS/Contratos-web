import os
from dotenv import load_dotenv
import msal
import requests

load_dotenv()

def get_access_token():
    client_id = os.environ.get('AZURE_CLIENT_ID')
    client_secret = os.environ.get('AZURE_CLIENT_SECRET')
    tenant_id = os.environ.get('AZURE_TENANT_ID')
    
    app = msal.ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret
    )
    
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    return result.get("access_token")

def crear_carpeta_y_link_publico():
    access_token = get_access_token()
    if not access_token:
        print("❌ No se pudo obtener token")
        return
    
    user_email = "contabilidad@novacorp-plus.com"
    folder_name = "Documentos_Legales"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    # Crear carpeta
    folder_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/root/children"
    folder_data = {
        "name": folder_name,
        "folder": {},
        "@microsoft.graph.conflictBehavior": "rename"
    }
    
    print(f"📁 Creando carpeta {folder_name}...")
    response = requests.post(folder_url, headers=headers, json=folder_data)
    
    if response.status_code not in [200, 201]:
        print(f"❌ Error creando carpeta: {response.text}")
        return
    
    folder_info = response.json()
    folder_id = folder_info.get('id')
    print(f"✅ Carpeta creada: {folder_name}")
    
    # Crear link público
    share_url = f"https://graph.microsoft.com/v1.0/users/{user_email}/drive/items/{folder_id}/createLink"
    share_data = {
        "type": "view",
        "scope": "anonymous"
    }
    
    print("🔗 Creando link público...")
    share_response = requests.post(share_url, headers=headers, json=share_data)
    
    if share_response.status_code == 201:
        share_info = share_response.json()
        public_link = share_info.get('link', {}).get('webUrl', '')
        print(f"✅ Link público creado:")
        print(f"🌐 {public_link}")
    else:
        print(f"❌ Error creando link: {share_response.text}")

if __name__ == "__main__":
    crear_carpeta_y_link_publico()
