import { useState } from "react";
import { FileText, Calculator, Bell } from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { ServiceCard } from "@/components/Dashboard/ServiceCard";
import { DocumentForm } from "@/components/Forms/DocumentForm";
import { QuoteForm } from "@/components/Forms/QuoteForm";
import { NotificationForm } from "@/components/Forms/NotificationForm";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ActiveView = "dashboard" | "documents" | "quotes" | "notifications";

export const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationType, setNotificationType] = useState<"comunicado" | "cotizacion" | "">("");

  const executePythonScript = async () => {
    try {
      const response = await fetch('http://10.11.11.246:3002/api/ejecutar-comunicado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.text();
        console.log('Comunicado.py ejecutado:', result);
        toast({
          title: "Ejecución Exitosa",
          description: "Documentos generados exitosamente.",
        });
      } else {
        throw new Error('Error al ejecutar el programa');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de Ejecución",
        description: "No se pudo ejecutar Comunicado.py. Verifica que el servidor esté activo.",
        variant: "destructive",
      });
    }
  };

  const executeRenovacionScript = async () => {
    try {
      const response = await fetch('http://10.11.11.246:3002/api/ejecutar-cotizacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.text();
        console.log('Renovacion1.py ejecutado:', result);
        toast({
          title: "Renovación Exitosa",
          description: "Documentos generados exitosamente.",
        });
      } else {
        throw new Error('Error al ejecutar el programa');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de Ejecución",
        description: "No se pudo ejecutar Renovacion1.py. Verifica que el servidor esté activo.",
        variant: "destructive",
      });
    }
  };

  const sendNotificationsFromExcel = async () => {
    if (!notificationType) {
      toast({
        title: "Selección requerida",
        description: "Por favor selecciona el tipo de notificación.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('http://10.11.11.246:3002/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: notificationType }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Resultados envío:', data);

        toast({
          title: 'Notificaciones enviadas',
          description: `Se enviaron ${data.results.filter((r: any) => r.success).length} notificaciones.`,
        });
        
        // Cerrar modal y limpiar selección
        setShowNotificationModal(false);
        setNotificationType("");
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err: any) {
      toast({
        title: 'Error al enviar notificaciones',
        description: err.message || 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = () => {
    setShowNotificationModal(true);
  };

  const services = [
    {
      title: "Generar Comunicados",
      description: "Ejecuta el programa Comunicado.py para generar documentos oficiales.",
      icon: FileText,
      variant: "primary" as const,
      onClick: executePythonScript
    },
    {
      title: "Generar Cotizaciones",
      description: "Ejecuta el programa Renovacion1.py para generar cotizaciones y renovaciones.",
      icon: Calculator,
      variant: "secondary" as const,
      onClick: executeRenovacionScript
    },
    {
      title: "Notificaciones Automatizadas",
      description: "Accede al sistema de notificaciones integrado con Amazon QA para automatizar alertas y recordatorios.",
      icon: Bell,
      variant: "accent" as const,
      onClick: handleNotificationClick
    }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case "documents":
        return <DocumentForm onBack={() => setActiveView("dashboard")} />;
      case "quotes":
        return <QuoteForm onBack={() => setActiveView("dashboard")} />;
      case "notifications":
        return <NotificationForm onBack={() => setActiveView("dashboard")} />;
      default:
        return (
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Bienvenido a Nova Cont!
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Herramienta para la generación de contratos, si tiene alguna duda por favor pongase en contacto con el area de desarrollo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <ServiceCard
                  key={index}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  variant={service.variant}
                  onClick={service.onClick}
                />
              ))}
            </div>
            <div className="mt-16 bg-card border rounded-lg p-8">
              <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-2">Funcionalidades Principales</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Generación automática de documentos empresariales</li>
                    <li>• Integración con sistema de notificaciones (NotiNova)</li>
                    <li>• Interfaz extensible para nuevas funcionalidades</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Integraciones Disponibles</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• NotiNova (Sistema de notificaciones)</li>
                    <li>• APIs REST para servicios, funcionalidades Python</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal de selección de tipo de notificación */}
            {showNotificationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="w-96">
                  <CardHeader>
                    <CardTitle>Seleccionar Tipo de Notificación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={notificationType} onValueChange={(value: "comunicado" | "cotizacion") => setNotificationType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de notificación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comunicado">Comunicado</SelectItem>
                        <SelectItem value="cotizacion">Cotización</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowNotificationModal(false);
                          setNotificationType("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={sendNotificationsFromExcel}
                        disabled={!notificationType}
                      >
                        Enviar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        {renderActiveView()}
      </main>
    </div>
  );
};
