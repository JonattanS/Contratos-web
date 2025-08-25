import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { BACKEND_URL } from "../config"

const Login: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [usrcod, setUsrcod] = useState("")
  const [usrpsw, setUsrpsw] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("Nova Corp SAS")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usrcod, usrpsw }), // Solo envía estos dos campos
      })

      const data = await response.json()

      if (data.success) {
        onLogin(data.user) // Guarda el usuario
        navigate("/") // Redirige a la página principal
      } else {
        setError("Credenciales incorrectas")
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Login Card */}
      <Card className="w-full max-w-md bg-white shadow-lg border-0">
        <CardHeader className="text-center pb-6 pt-8">
          {/* Logo */}
          <div className="mx-auto mb-6">
            <img src="/assets/Logo-NovaCorp-oficial.png" alt="iNova Logo" className="h-16 mx-auto mb-2" />
            <div className="text-center text-sm text-gray-400">
                Bienvenido a NovaCont
            </div>
          </div>

          <h1 className="text-xl font-medium text-gray-800 mb-6">Iniciar sesión</h1>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Usuario Field */}
            <div className="space-y-2">
              <Input
                id="usrcod"
                type="text"
                placeholder="Usuario"
                value={usrcod}
                onChange={(e) => setUsrcod(e.target.value)}
                required
                autoFocus
                className="border-gray-300 focus:border-[#F57F2C] focus:ring-[#F57F2C]/20 placeholder:text-gray-400"
              />
            </div>

            {/* Contraseña Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  id="usrpsw"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={usrpsw}
                  onChange={(e) => setUsrpsw(e.target.value)}
                  required
                  className="pr-10 border-gray-300 focus:border-[#F57F2C] focus:ring-[#F57F2C]/20 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F57F2C] hover:bg-[#E56F1C] text-white font-medium py-3 mt-6 shadow-sm transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Ingresando...
                </div>
              ) : (
                "INGRESAR"
              )}
            </Button>
            {/* Footer Links */}
            <div className="space-y-3 pt-4">
              <div className="text-center">
                <button type="button" className="text-gray-400 ">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="text-center text-sm text-black">
                Solicita acceso a el area de desarrollo
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">© 2025 – Nova corp SAS</p>
      </div>
    </div>
  )
}

export default Login