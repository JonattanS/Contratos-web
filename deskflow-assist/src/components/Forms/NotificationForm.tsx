import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface NotificationFormProps {
  onBack: () => void;
}

export const NotificationForm = ({ onBack }: NotificationFormProps) => {
  const [chatIdsInput, setChatIdsInput] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendNotification = async () => {
    if (!chatIdsInput.trim() || !message.trim()) {
      toast({
        title: "Faltan datos",
        description: "Por favor ingrese al menos un Chat ID y un mensaje.",
        variant: "destructive",
      });
      return;
    }

    const chatIds = chatIdsInput
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (chatIds.length === 0) {
      toast({
        title: "Chat ID inválido",
        description: "Por favor ingrese IDs válidos separados por coma.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      channels: ["telegram"],
      chatId: chatIds,
      message: message,
    };

    setLoading(true);
    try {
      const response = await fetch("http://10.11.11.5:8083/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: "El mensaje ha sido enviado a los usuarios especificados.",
        });
        setChatIdsInput("");
        setMessage("");
      } else {
        const errorText = await response.text();
        toast({
          title: "Error al enviar",
          description: `Servidor respondió con error: ${errorText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error en la red",
        description: `No se pudo enviar la notificación: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack}>
        Volver
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Enviar Notificación Telegram</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa los IDs de usuario de Telegram separados por coma y el mensaje a enviar.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chatIds">IDs de Usuarios Telegram</Label>
            <Input
              id="chatIds"
              placeholder="Ejemplo: 123456789, 987654321"
              value={chatIdsInput}
              onChange={(e) => setChatIdsInput(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Input
              id="message"
              placeholder="Escribe el mensaje aquí"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSendNotification} disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
