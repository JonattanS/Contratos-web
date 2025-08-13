import { useState } from "react";
import { FileText, Calculator, Bell } from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { ServiceCard } from "@/components/Dashboard/ServiceCard";
import { DocumentForm } from "@/components/Forms/DocumentForm";
import { QuoteForm } from "@/components/Forms/QuoteForm";
import { NotificationForm } from "@/components/Forms/NotificationForm";

type ActiveView = "dashboard" | "documents" | "quotes" | "notifications";

export const Dashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  // Función para ejecutar el script python vía backend
  const handleGenerarComunicado = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/ejecutar-comunicado', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        alert(`Comunicado generado:\n${data.output}`);
      } else {
        alert(`Error:\n${data.error || 'Ocurrió un problema'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Fallo la ejecución del comunicado');
    }
  };

  const services = [
    {
      title: "Generar Comunicados",
      description: "Crea documentos oficiales, memorándums, circulares y notificaciones empresariales con formato estándar.",
      icon: FileText,
      variant: "primary" as const,
      // Aquí se llama al handler que ejecuta el script, no cambia la vista
      onClick: handleGenerarComunicado
    },
    {
      title: "Generar Cotizaciones",
      description: "Elabora cotizaciones profesionales con cálculos automáticos, términos y condiciones personalizables.",
      icon: Calculator,
      variant: "secondary" as const,
      onClick: () => setActiveView("quotes")
    },
    {
      title: "Notificaciones Automatizadas",
      description: "Accede al sistema de notificaciones integrado con Amazon QA para automatizar alertas y recordatorios.",
      icon: Bell,
      variant: "accent" as const,
      onClick: () => setActiveView("notifications")
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
                    <li>• APIs REST para servicios externos</li>
                    <li>• Módulos Python independientes</li>
                  </ul>
                </div>
              </div>
            </div>
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
