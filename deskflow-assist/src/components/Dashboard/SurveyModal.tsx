"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, X, Settings } from "lucide-react"
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
  const [rawRows, setRawRows] = useState<any[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState(false)
  
  const [colMap, setColMap] = useState({
    name: 2,
    contact: 3,
    email: 5,
    subject: 7,
    body: 8,
    cc: 9
  })

  const validRows = rawRows.filter((row) => {
    const email = (row[colMap.email] || "").toString().trim()
    return email.length > 0
  })

  const [provider, setProvider] = useState("")
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

        // Fila de encabezados y resto de datos
        const headerRow = (jsonData[0] as string[]) || []
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

        setHeaders(headerRow.map(String))
        setRawRows(dataRows)

        const initialValidRows = dataRows.filter((row) => {
          const email = (row[colMap.email] || "").toString().trim()
          return email.length > 0
        })

        if (initialValidRows.length === 0) {
          toast({
            title: "Revisa la configuración",
            description: "No se encontraron correos en la columna configurada por defecto. Por favor ajusta el mapeo de columnas.",
            variant: "default",
          })
        } else {
          toast({
            title: "Archivo cargado",
            description: `Se encontraron ${initialValidRows.length} registros válidos para procesar.`,
          })
        }
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
    setRawRows([])
    setHeaders([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if (!provider) {
      toast({
        title: "Proveedor requerido",
        description: "Por favor selecciona un proveedor de correo en la configuración avanzada.",
        variant: "destructive",
      })
      setShowConfig(true)
      return
    }

    if (validRows.length === 0) {
      toast({
        title: "Sin datos válidos",
        description: "Por favor carga un archivo Excel y asegúrate de configurar correctamente la columna de Correo Electrónico.",
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

    // Adaptar los datos al formato original que el backend espera
    const mappedExcelData = validRows.map(row => {
      const newRow: any[] = []
      newRow[2] = row[colMap.name]
      newRow[3] = row[colMap.contact]
      newRow[5] = row[colMap.email]
      newRow[7] = row[colMap.subject]
      newRow[8] = row[colMap.body]
      newRow[9] = row[colMap.cc]
      return newRow
    })

    await onSend(mappedExcelData, defaultSubject, defaultBody, provider, defaultCC, attachmentPath)
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">
                  ✓ {excelFile.name} ({validRows.length} registros válidos)
                </p>
              </div>
            )}
            <div className="flex justify-between items-center bg-muted/30 p-2 rounded border mt-2">
              <p className="text-xs text-muted-foreground">
                Por defecto el sistema asume columnas específicas, pero puedes mapearlas ingresando a la configuración.
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)} disabled={loading}>
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>

          {showConfig && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4 border shadow-sm">
              <h3 className="text-sm font-semibold flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Configuración Avanzada
              </h3>
              
              {/* Proveedor de Correo */}
              <div className="space-y-2">
                <Label htmlFor="provider">Proveedor de Correo</Label>
                <Select value={provider} onValueChange={setProvider} disabled={loading}>
                  <SelectTrigger id="provider" className="bg-background">
                    <SelectValue placeholder="Selecciona el proveedor de correo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office365Cal">Calidad</SelectItem>
                    <SelectItem value="office365Con">Servicio al cliente</SelectItem>
                    <SelectItem value="office365Ser">Prestacion de servicio</SelectItem>
                    <SelectItem value="office365Cont">Cantabilidad Nova</SelectItem>
                    <SelectItem value="office365">Desarrollo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona el proveedor de correo que se utilizará para enviar las encuestas.
                </p>
              </div>

              {/* Columnas Mapping */}
              <div className="space-y-2">
                <Label>Mapeo de Columnas del Archivo Excel</Label>
                {headers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre/Razón Social</Label>
                      <Select value={colMap.name.toString()} onValueChange={(val) => setColMap(prev => ({...prev, name: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Contacto</Label>
                      <Select value={colMap.contact.toString()} onValueChange={(val) => setColMap(prev => ({...prev, contact: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Correo Electrónico *</Label>
                      <Select value={colMap.email.toString()} onValueChange={(val) => setColMap(prev => ({...prev, email: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Asunto (Opcional)</Label>
                      <Select value={colMap.subject.toString()} onValueChange={(val) => setColMap(prev => ({...prev, subject: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cuerpo (Opcional)</Label>
                      <Select value={colMap.body.toString()} onValueChange={(val) => setColMap(prev => ({...prev, body: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CC (Opcional)</Label>
                      <Select value={colMap.cc.toString()} onValueChange={(val) => setColMap(prev => ({...prev, cc: parseInt(val)}))}>
                        <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {headers.map((h, i) => <SelectItem key={i} value={i.toString()}>{h || `Columna ${i+1}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-center border rounded bg-background text-muted-foreground">
                    Carga un archivo Excel para poder configurar el mapeo de columnas.
                  </div>
                )}
              </div>
            </div>
          )}

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
            <Button className="flex-1" onClick={handleSend} disabled={validRows.length === 0 || loading}>
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
