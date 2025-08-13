import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Play, History, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface NotificationFormProps {
  onBack: () => void;
}

export const NotificationForm = ({ onBack }: NotificationFormProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"execute" | "history" | "config">("execute");
  const [queryData, setQueryData] = useState({
    queryType: "",
    parameters: "",
    schedule: "immediate"
  });

  // Simulación de historial de notificaciones
  const notificationHistory = [
    {
      id: "1",
      type: "Recordatorio de Pago",
      status: "Enviado",
      date: "2024-01-15",
      recipients: 25
    },
    {
      id: "2", 
      type: "Alerta de Vencimiento",
      status: "Programado",
      date: "2024-01-20",
      recipients: 12
    },
    {
      id: "3",
      type: "Notificación de Estado",
      status: "Error",
      date: "2024-01-14",
      recipients: 0
    }
  ];

  const handleExecuteQuery = () => {
    // Aquí se integraría con la funcionalidad existente de Amazon QA
    toast({
      title: "Consulta enviada a Amazon QA",
      description: "Las notificaciones se procesarán según la configuración.",
    });

    // Simulación de llamada a API externa
    console.log("Ejecutando query Amazon QA:", queryData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Enviado":
        return <Badge variant="secondary">Enviado</Badge>;
      case "Programado":
        return <Badge variant="outline">Programado</Badge>;
      case "Error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-accent-foreground" />
          <h2 className="text-2xl font-semibold">Sistema de Notificaciones</h2>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "execute" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("execute")}
        >
          <Play className="h-4 w-4 mr-2" />
          Ejecutar
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("history")}
        >
          <History className="h-4 w-4 mr-2" />
          Historial
        </Button>
        <Button
          variant={activeTab === "config" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("config")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configuración
        </Button>
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === "execute" && (
        <Card>
          <CardHeader>
            <CardTitle>Ejecutar Notificaciones Automatizadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conectado con Amazon QA - Sistema de notificaciones existente
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="queryType">Tipo de Consulta</Label>
                <Select 
                  value={queryData.queryType} 
                  onValueChange={(value) => setQueryData(prev => ({ ...prev, queryType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de consulta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment-reminders">Recordatorios de Pago</SelectItem>
                    <SelectItem value="expiration-alerts">Alertas de Vencimiento</SelectItem>
                    <SelectItem value="status-notifications">Notificaciones de Estado</SelectItem>
                    <SelectItem value="custom-query">Consulta Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Programación</Label>
                <Select 
                  value={queryData.schedule} 
                  onValueChange={(value) => setQueryData(prev => ({ ...prev, schedule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Inmediato</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameters">Parámetros de Consulta</Label>
              <Input
                id="parameters"
                value={queryData.parameters}
                onChange={(e) => setQueryData(prev => ({ ...prev, parameters: e.target.value }))}
                placeholder="Ej: fechas, criterios específicos, filtros..."
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Estado del Sistema Amazon QA</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-muted-foreground">Conectado y operativo</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleExecuteQuery} disabled={!queryData.queryType}>
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Consulta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notificationHistory.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{notification.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {notification.date} • {notification.recipients} destinatarios
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(notification.status)}
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-accent/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Integración Amazon QA</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Este módulo utiliza la funcionalidad existente desarrollada en Visual Studio.
                  No se requiere configuración adicional.
                </p>
                <div className="text-xs font-mono bg-background p-2 rounded border">
                  Endpoint: /api/amazon-qa/notifications<br/>
                  Estado: Activo<br/>
                  Última sincronización: Hace 5 minutos
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Notificaciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email de Administrador</Label>
                    <Input placeholder="admin@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia de Reportes</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button variant="outline">
                Guardar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};