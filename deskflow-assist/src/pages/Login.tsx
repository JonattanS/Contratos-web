import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Lock, AlertCircle } from "lucide-react"
import { BACKEND_URL } from "../config"

const Login: React.FC<{ onLogin: (token: string) => void }> = ({ onLogin }) => {
  const [usrcod, setUsrcod] = useState("")
  const [usrpsw, setUsrpsw] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
    <div className="min-h-screen bg-gradient-to-br from-[#00264D] via-[#003366] to-[#001a33] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-800/20 via-slate-700/20 to-blue-900/20"></div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Iniciar sesión</CardTitle>
          <CardDescription className="text-gray-300">Accede a Nova Financial</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario Field */}
            <div className="space-y-2">
              <Label htmlFor="usrcod" className="text-white font-medium">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="usrcod"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={usrcod}
                  onChange={(e) => setUsrcod(e.target.value)}
                  required
                  autoFocus
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0"
                />
              </div>
            </div>

            {/* Contraseña Field */}
            <div className="space-y-2">
              <Label htmlFor="usrpsw" className="text-white font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="usrpsw"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={usrpsw}
                  onChange={(e) => setUsrpsw(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 focus:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Ingresando...
                </div>
              ) : (
                "Ingresar"
              )}
            </Button>

            {/* Footer Links */}
            <div className="space-y-3 pt-4">
              <div className="text-center">
                <button type="button" className="text-gray-300 hover:text-white text-sm underline transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div className="text-center text-sm text-gray-400">
                ¿Nuevo en Nova Financial?{" "}
                <button type="button" className="text-orange-400 hover:text-orange-300 underline transition-colors">
                  Solicita acceso
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating elements for decoration */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-slate-400/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-blue-300/10 rounded-full blur-xl"></div>
    </div>
  )
}

export default Login
