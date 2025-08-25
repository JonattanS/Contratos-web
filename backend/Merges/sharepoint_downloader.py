import requests
import os
import tempfile
from urllib.parse import unquote

class SharePointDownloader:
    def __init__(self, access_token):
        self.access_token = access_token
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    def download_excel_from_sharepoint(self, sharepoint_url):
        """
        Descarga archivo Excel desde SharePoint usando la URL compartida
        """
        try:
            # Extraer información de la URL de SharePoint
            # URL: https://novacorp20-my.sharepoint.com/:x:/g/personal/mcanas_novacorp20_onmicrosoft_com/ESZ9DWLdd2ZCpFLdZhAABUUBAKixElkwTw9F89-F_kLavA?e=2xkFX1
            
            # Obtener el archivo usando Graph API con la URL compartida
            encoded_url = requests.utils.quote(sharepoint_url, safe='')
            graph_url = f"https://graph.microsoft.com/v1.0/shares/u!{encoded_url}/driveItem"
            
            # Obtener información del archivo
            response = requests.get(graph_url, headers=self.headers)
            
            if response.status_code == 200:
                file_info = response.json()
                download_url = file_info.get('@microsoft.graph.downloadUrl')
                
                if download_url:
                    # Descargar el archivo
                    file_response = requests.get(download_url)
                    
                    if file_response.status_code == 200:
                        # Crear archivo temporal
                        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
                        temp_file.write(file_response.content)
                        temp_file.close()
                        
                        print(f"✅ Excel descargado desde SharePoint: {temp_file.name}")
                        return temp_file.name
                    else:
                        print(f"❌ Error descargando archivo: {file_response.status_code}")
                        return None
                else:
                    print("❌ No se pudo obtener URL de descarga")
                    return None
            else:
                print(f"❌ Error accediendo a SharePoint: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return None
    
    def cleanup_temp_file(self, temp_file_path):
        """Eliminar archivo temporal"""
        try:
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print(f"🗑️ Archivo temporal eliminado: {temp_file_path}")
        except Exception as e:
            print(f"⚠️ Error eliminando archivo temporal: {str(e)}")