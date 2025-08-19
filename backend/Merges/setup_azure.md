# Configuración Azure AD para Microsoft Graph API

## Pasos para configurar:

1. **Ir a Azure Portal**: https://portal.azure.com
2. **Azure Active Directory** > **App registrations** > **New registration**
3. **Configurar aplicación**:
   - Name: "Deskflow Document Generator"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: http://localhost:8080/auth/callback

4. **Obtener credenciales**:
   - Application (client) ID
   - Directory (tenant) ID
   - Client Secret (Certificates & secrets > New client secret)

5. **Configurar permisos API**:
   - API permissions > Add a permission > Microsoft Graph
   - Application permissions:
     - Files.ReadWrite.All
     - Sites.ReadWrite.All
   - Grant admin consent

6. **Copiar valores al archivo .env**