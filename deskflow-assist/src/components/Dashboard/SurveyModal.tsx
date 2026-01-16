"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SurveyModalProps {
  open: boolean
  onClose: () => void
  onSend: (
    excelData: any[],
    defaultSubject: string,
    defaultBody: string,
    provider: string,
    defaultCC: string,
    attachmentPath: string,
  ) => Promise<void>
  loading: boolean
}

export const SurveyModal = ({ open, onClose, onSend, loading }: SurveyModalProps) => {
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [excelData, setExcelData] = useState<any[] | null>(null)
  const [provider, setProvider] = useState("Office365KOS")
  const [defaultCC, setDefaultCC] = useState("")
  const [attachmentPath, setAttachmentPath] = useState("")
  const [defaultSubject, setDefaultSubject] = useState("Encuesta de Satisfacción - {clientName}")
  const [defaultBody, setDefaultBody] = useState(
    `Estimado/a {contactName},\n\nEsperamos que se encuentre bien. En {clientName} nos esforzamos por brindar el mejor servicio posible.\n\nPor favor, tómese un momento para completar nuestra breve encuesta de satisfacción.\n\nAgradecemos su tiempo y colaboración.\n\nCordialmente,\nEquipo Nova Corp SAS`,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea un archivo Excel
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ]

    if (
      !validTypes.includes(file.type) &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast({
        title: "Archivo no válido",
        description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV.",
        variant: "destructive",
      })
      return
    }

    setExcelFile(file)

    // Leer el archivo Excel
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" })

        // Remover la primera fila (encabezados) y procesar datos
        const dataRows = jsonData.slice(1) as any[][]

        if (dataRows.length === 0) {
          toast({
            title: "Archivo vacío",
            description: "El archivo Excel no contiene datos.",
            variant: "destructive",
          })
          setExcelFile(null)
          return
        }

        const validRows = dataRows.filter((row) => {
          const email = (row[5] || "").toString().trim()
          return email.length > 0
        })

        if (validRows.length === 0) {
          toast({
            title: "Sin datos válidos",
            description: "El archivo no contiene registros con correo electrónico válido en la columna F.",
            variant: "destructive",
          })
          setExcelFile(null)
          return
        }

        setExcelData(validRows)
        toast({
          title: "Archivo cargado",
          description: `Se encontraron ${validRows.length} registros válidos para procesar.`,
        })
      } catch (error) {
        console.error("Error al leer Excel:", error)
        toast({
          title: "Error al procesar archivo",
          description: "No se pudo leer el archivo Excel. Verifica el formato.",
          variant: "destructive",
        })
        setExcelFile(null)
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleRemoveFile = () => {
    setExcelFile(null)
    setExcelData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if (!excelData || excelData.length === 0) {
      toast({
        title: "Archivo requerido",
        description: "Por favor carga un archivo Excel antes de enviar.",
        variant: "destructive",
      })
      return
    }

    if (!defaultSubject.trim() || !defaultBody.trim()) {
      toast({
        title: "Campos requeridos",
        description: "El asunto y cuerpo por defecto son obligatorios.",
        variant: "destructive",
      })
      return
    }

    await onSend(excelData, defaultSubject, defaultBody, provider, defaultCC, attachmentPath)
  }

  const handleClose = () => {
    if (!loading) {
      handleRemoveFile()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Encuesta de Satisfacción</CardTitle>
          <p className="text-sm text-muted-foreground">
            Carga un archivo Excel y configura el asunto y cuerpo por defecto para las encuestas.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carga de archivo Excel */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Archivo Excel</Label>
            <div className="flex items-center gap-2">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={loading}
                className="flex-1"
              />
              {excelFile && (
                <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={loading}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {excelFile && (
              <p className="text-sm text-green-600">
                ✓ {excelFile.name} ({excelData?.length || 0} registros)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              El Excel debe contener columnas: C=Nombre, D=Contacto, F=Email, H=Asunto (opcional), I=Cuerpo (opcional),
              J=CC (opcional)
            </p>
          </div>

          {/* Proveedor de Correo */}
          <div className="space-y-2">
            <Label htmlFor="provider">Proveedor de Correo</Label>
            <Select value={provider} onValueChange={setProvider} disabled={loading}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Selecciona el proveedor de correo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office365Cal">Calidad</SelectItem>
                <SelectItem value="office365Con">Servicio al cliente</SelectItem>
                <SelectItem value="Office365">Desarrollo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona el proveedor de correo que se utilizará para enviar las encuestas.
            </p>
          </div>

          {/* Correos en Copia (CC) - Por Defecto */}
          <div className="space-y-2">
            <Label htmlFor="default-cc">Correos en Copia (CC) - Por Defecto</Label>
            <Input
              id="default-cc"
              value={defaultCC}
              onChange={(e) => setDefaultCC(e.target.value)}
              placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Correos separados por coma. Se combinarán con los CC de la columna J del Excel si existen.
            </p>
          </div>

          {/* Asunto por defecto */}
          <div className="space-y-2">
            <Label htmlFor="default-subject">Asunto por Defecto</Label>
            <Input
              id="default-subject"
              value={defaultSubject}
              onChange={(e) => setDefaultSubject(e.target.value)}
              placeholder="Asunto del correo"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar variables: {"{clientName}"}, {"{contactName}"}
            </p>
          </div>

          {/* Cuerpo por defecto */}
          <div className="space-y-2">
            <Label htmlFor="default-body">Cuerpo por Defecto</Label>
            <Textarea
              id="default-body"
              value={defaultBody}
              onChange={(e) => setDefaultBody(e.target.value)}
              placeholder="Cuerpo del correo"
              rows={8}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Puedes usar variables: {"{clientName}"}, {"{contactName}"}
            </p>
          </div>

          {/* Ruta del Archivo Adjunto */}
          <div className="space-y-2">
            <Label htmlFor="attachment-path">Ruta del Archivo Adjunto (Opcional)</Label>
            <Input
              id="attachment-path"
              value={attachmentPath}
              onChange={(e) => setAttachmentPath(e.target.value)}
              placeholder="C:\tmp\documento.pdf"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Ingresa la ruta completa del archivo en el servidor. Ejemplo: C:\tmp\test.pdf
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSend} disabled={!excelData || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Encuestas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
