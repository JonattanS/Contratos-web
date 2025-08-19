import pandas as pd
from docx import Document
import os
from datetime import datetime
from dotenv import load_dotenv
import tempfile
from onedrive_uploader import OneDriveUploader
import msal
import requests

# Cargar variables de entorno
load_dotenv()

# Rutas
ONEDRIVE_PATH = r"C:\Users\MCAÑAS\OneDrive - Nova Corp SAS"
EXCEL_PATH = os.path.join(ONEDRIVE_PATH, "Documentos", "clientes.xlsx")
TEMPLATE_PATH1 = "PROPUESTA FE Y NE RENOVACION 202X -CLIENTE1.docx"
TEMPLATE_PATH2 = "PROPUESTA FE RENOVACION 202X -CLIENTE2.docx"
OUTPUT_DIR = os.path.join(ONEDRIVE_PATH, "Documentos_Generados", "Renovaciones")

# Crear carpeta de salida si no existe
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Cargar Excel
df = pd.read_excel(EXCEL_PATH)

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
                # 👉 aquí indicas el usuario destino
                uploader = OneDriveUploader(access_token, user_upn="mcanas@novacorp20.onmicrosoft.com")

                folder_path = f"Documentos_Generados/Renovaciones/{nit}"
                uploader.create_folder(folder_path)
                uploader.upload_file(temp_file.name, folder_path, nombre_archivo)

            os.unlink(temp_file.name)
    else:
        local_path = os.path.join(cliente_dir, nombre_archivo)
        doc.save(local_path)
        print(f" Documento generado: {local_path}")
