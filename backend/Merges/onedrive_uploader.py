import requests
import os
from io import BytesIO

class OneDriveUploader:
    def __init__(self, access_token, user_upn=None):
        self.access_token = access_token
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.user_upn = user_upn  # correo del usuario destino
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    def _base_drive_url(self):
        if self.user_upn:
            return f"{self.base_url}/users/{self.user_upn}/drive"
        else:
            return f"{self.base_url}/me/drive"

    def upload_file(self, local_file_path, onedrive_folder_path, filename):
        try:
            with open(local_file_path, 'rb') as f:
                file_content = f.read()
            
            upload_url = f"{self._base_drive_url()}/root:/{onedrive_folder_path}/{filename}:/content"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/octet-stream'
            }
            r = requests.put(upload_url, headers=headers, data=file_content)
            
            if r.status_code in [200, 201]:
                print(f" Archivo subido exitosamente a {self.user_upn or 'mi OneDrive'}: {filename}")
                return True
            else:
                print(f" Error al subir archivo: {r.status_code} - {r.text}")
                return False
        except Exception as e:
            print(f" Error: {str(e)}")
            return False

    def create_folder(self, folder_path):
        try:
            folder_data = {"name": os.path.basename(folder_path), "folder": {}}
            parent_path = os.path.dirname(folder_path) or ""
            create_url = f"{self._base_drive_url()}/root:/{parent_path}:/children"
            r = requests.post(create_url, headers=self.headers, json=folder_data)
            if r.status_code in [200, 201]:
                print(f" Carpeta creada: {folder_path}")
                return True
            elif r.status_code == 409:
                print(f"ℹ Carpeta ya existe: {folder_path}")
                return True
            else:
                print(f" Error al crear carpeta: {r.status_code} - {r.text}")
                return False
        except Exception as e:
            print(f" Error: {str(e)}")
            return False