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
  const [activeTab, setActiveTab] = useState<"telegram" | "email">("telegram");
  // Telegram form states
  const [chatIdsInput, setChatIdsInput] = useState("");
  const [telegramMessage, setTelegramMessage] = useState("");
  // Email form states
  const [recipient, setRecipient] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [subject, setSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSendNotification = async () => {
    setLoading(true);

    if (activeTab === "telegram") {
      if (!chatIdsInput.trim() || !telegramMessage.trim()) {
        toast({
          title: "Faltan datos",
          description: "Ingrese al menos un Chat ID y un mensaje para Telegram.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const chatIds = chatIdsInput
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      if (chatIds.length === 0) {
        toast({
          title: "Chat ID inválido",
          description: "Ingrese IDs válidos separados por coma.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const payload = {
        channels: ["telegram"],
        chatId: chatIds[0],
        message: telegramMessage,
      };
      await sendPayload(payload);
    } else if (activeTab === "email") {
      if (!recipient.trim() || !subject.trim() || !emailMessage.trim()) {
        toast({
          title: "Faltan datos",
          description: "Ingrese destinatario, asunto y mensaje para Email.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const ccList = ccInput
        .split(",")
        .map((mail) => mail.trim())
        .filter((mail) => mail.length > 0);
      const payload = {
        channels: ["email"],
        recipient: recipient.trim(),
        cc: ccList,
        subject: subject.trim(),
        message: emailMessage,
      };
      await sendPayload(payload);
    }
  };

  const sendPayload = async (payload: any) => {
    try {
      const response = await fetch('http://10.11.11.131:3002/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: "El mensaje ha sido enviado con éxito.",
        });
        // Reset forms
        setChatIdsInput("");
        setTelegramMessage("");
        setRecipient("");
        setCcInput("");
        setSubject("");
        setEmailMessage("");
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
      {/* Tab headers */}
      <div className="flex space-x-4 border-b">
        <button
          className={`py-2 px-4 ${activeTab === "telegram" ? "border-b-2 border-blue-500 font-semibold" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("telegram")}
        >
          Telegram
        </button>
        <button
          className={`py-2 px-4 ${activeTab === "email" ? "border-b-2 border-blue-500 font-semibold" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("email")}
        >
          Email
        </button>
      </div>

      {activeTab === "telegram" && (
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
              <Label htmlFor="telegramMessage">Mensaje</Label>
              <Input
                id="telegramMessage"
                placeholder="Escribe el mensaje aquí"
                value={telegramMessage}
                onChange={(e) => setTelegramMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSendNotification} disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "email" && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Notificación Email</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ingresa los correos electrónico, asunto y mensaje a enviar.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipient">Destinatario</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="destinatario@ejemplo.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cc">CC (Correos separados por coma)</Label>
              <Input
                id="cc"
                type="text"
                placeholder="copia1@ejemplo.com, copia2@ejemplo.com"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Asunto del correo"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emailMessage">Mensaje</Label>
              <Input
                id="emailMessage"
                placeholder="Tu mensaje con copia"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSendNotification} disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
