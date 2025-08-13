import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentFormProps {
  onBack: () => void;
}

export const DocumentForm = ({ onBack }: DocumentFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tipo: "",
    destinatario: "",
    asunto: "",
    contenido: "",
    fechaVencimiento: "",
    prioridad: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulación de generación de documento
    toast({
      title: "Documento generado exitosamente",
      description: "El comunicado ha sido creado y está listo para descargar.",
    });

    // Aquí se integraría con la API externa
    console.log("Datos del documento:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Generar Comunicado</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Comunicado</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memo">Memorándum</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="notificacion">Notificación</SelectItem>
                    <SelectItem value="comunicado-oficial">Comunicado Oficial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={formData.prioridad} onValueChange={(value) => handleInputChange("prioridad", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinatario">Destinatario</Label>
                <Input
                  id="destinatario"
                  value={formData.destinatario}
                  onChange={(e) => handleInputChange("destinatario", e.target.value)}
                  placeholder="Nombre del destinatario o área"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha Límite</Label>
                <Input
                  id="fechaVencimiento"
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => handleInputChange("fechaVencimiento", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                value={formData.asunto}
                onChange={(e) => handleInputChange("asunto", e.target.value)}
                placeholder="Resumen del asunto a tratar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenido">Contenido del Comunicado</Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => handleInputChange("contenido", e.target.value)}
                placeholder="Descripción detallada del comunicado..."
                className="min-h-32"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit">
                <Download className="h-4 w-4 mr-2" />
                Generar Documento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};