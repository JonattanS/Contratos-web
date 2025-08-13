import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator, Plus, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuoteFormProps {
  onBack: () => void;
}

interface QuoteItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

export const QuoteForm = ({ onBack }: QuoteFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    cliente: "",
    email: "",
    telefono: "",
    proyecto: "",
    moneda: "USD",
    validezDias: "30",
    observaciones: ""
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", descripcion: "", cantidad: 1, precio: 0 }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    
    toast({
      title: "Cotización generada exitosamente",
      description: `Total: ${formData.moneda} ${total.toFixed(2)}`,
    });

    // Aquí se integraría con la API externa
    console.log("Datos de cotización:", { formData, items, total });
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      descripcion: "",
      cantidad: 1,
      precio: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-secondary" />
          <h2 className="text-2xl font-semibold">Generar Cotización</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nombre/Empresa</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                  placeholder="Nombre del cliente o empresa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@empresa.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proyecto">Proyecto</Label>
                <Input
                  id="proyecto"
                  value={formData.proyecto}
                  onChange={(e) => setFormData(prev => ({ ...prev, proyecto: e.target.value }))}
                  placeholder="Nombre del proyecto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select value={formData.moneda} onValueChange={(value) => setFormData(prev => ({ ...prev, moneda: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validez">Validez (días)</Label>
                <Select value={formData.validezDias} onValueChange={(value) => setFormData(prev => ({ ...prev, validezDias: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items de la Cotización */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Items de la Cotización</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <div className="md:col-span-3 space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={item.descripcion}
                      onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                      placeholder="Descripción del servicio/producto"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.id, "cantidad", parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Unitario</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precio}
                      onChange={(e) => updateItem(item.id, "precio", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Total: {formData.moneda} {calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Observaciones y Términos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones Adicionales</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Términos y condiciones, observaciones especiales..."
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button type="submit" variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Generar Cotización
          </Button>
        </div>
      </form>
    </div>
  );
};