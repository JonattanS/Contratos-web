import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, ExternalLink, Zap, Database } from "lucide-react";

export const ExtensibilityGuide = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Guía de Extensibilidad</h1>
        <p className="text-lg text-muted-foreground">
          Cómo agregar nuevas funcionalidades y integrar servicios externos
        </p>
      </div>

      {/* Arquitectura del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Arquitectura del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El sistema está diseñado con una arquitectura modular que facilita la integración de nuevas funcionalidades:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Componentes Principales</h4>
                <ul className="text-sm space-y-1">
                  <li>• <code>ServiceCard</code> - Tarjetas de servicios principales</li>
                  <li>• <code>Forms/*</code> - Formularios modulares por funcionalidad</li>
                  <li>• <code>Dashboard</code> - Vista principal con navegación</li>
                  <li>• <code>Header</code> - Barra de navegación principal</li>
                </ul>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Puntos de Extensión</h4>
                <ul className="text-sm space-y-1">
                  <li>• Array <code>services</code> en Dashboard</li>
                  <li>• Enum <code>ActiveView</code> para nuevas vistas</li>
                  <li>• Switch en <code>renderActiveView()</code></li>
                  <li>• Ruteo adicional en <code>App.tsx</code></li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integración de APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>Integración con APIs Externas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-card border rounded-lg p-4">
              <h4 className="font-medium mb-2">Patrón para Nuevas Integraciones</h4>
              <div className="bg-muted/30 p-3 rounded font-mono text-xs">
                {`// src/services/apiClient.ts
const callExternalAPI = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};`}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="secondary" className="mb-2">Amazon QA</Badge>
                <p className="text-xs text-muted-foreground">
                  Ya integrado via API REST para notificaciones automatizadas
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="outline" className="mb-2">Python Scripts</Badge>
                <p className="text-xs text-muted-foreground">
                  Ejecutar via endpoint API o proceso independiente
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="outline" className="mb-2">AWS Services</Badge>
                <p className="text-xs text-muted-foreground">
                  Integrar servicios adicionales según necesidad
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agregar Nueva Funcionalidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Pasos para Agregar Nueva Funcionalidad</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h4 className="font-medium">Crear Formulario</h4>
                  <p className="text-sm text-muted-foreground">
                    Agregar nuevo componente en <code>src/components/Forms/</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h4 className="font-medium">Actualizar Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Agregar nueva entrada al array <code>services</code> y nueva vista al enum
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h4 className="font-medium">Implementar Lógica</h4>
                  <p className="text-sm text-muted-foreground">
                    Crear servicios para comunicación con APIs externas
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <h4 className="font-medium">Configurar Routing</h4>
                  <p className="text-sm text-muted-foreground">
                    Si requiere rutas adicionales, actualizar <code>App.tsx</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Ejemplo: Agregar "Generador de Reportes"</h4>
              <div className="bg-muted/30 p-3 rounded font-mono text-xs space-y-2">
                <div>{`// 1. Crear src/components/Forms/ReportForm.tsx`}</div>
                <div>{`// 2. Agregar a Dashboard.tsx:`}</div>
                <div>{`//    - "reports" al enum ActiveView`}</div>
                <div>{`//    - Nuevo objeto al array services`}</div>
                <div>{`//    - Case "reports" en renderActiveView()`}</div>
                <div>{`// 3. Implementar lógica de generación`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consideraciones Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Consideraciones Técnicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Mejores Prácticas</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>Usar el sistema de diseño establecido (colores semánticos)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>Implementar manejo de errores y estados de carga</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>Mantener componentes modulares y reutilizables</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>Documentar nuevas APIs y configuraciones</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-3">Tecnologías Utilizadas</h4>
              <div className="space-y-2">
                <Badge variant="outline">React + TypeScript</Badge>
                <Badge variant="outline">Tailwind CSS</Badge>
                <Badge variant="outline">shadcn/ui</Badge>
                <Badge variant="outline">Lucide Icons</Badge>
              </div>
              
              <h4 className="font-medium mb-3 mt-4">APIs Recomendadas</h4>
              <div className="space-y-2">
                <Badge variant="secondary">REST APIs</Badge>
                <Badge variant="secondary">GraphQL</Badge>
                <Badge variant="secondary">Webhooks</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};