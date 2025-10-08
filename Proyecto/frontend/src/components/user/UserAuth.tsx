import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { Separator } from "../ui/separator"
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Home,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Star,
  Shield
} from "lucide-react"

interface UserAuthProps {
  onLogin: (user: any) => void
  onAdminLogin?: () => void
  onVerifierLogin?: () => void
  onBack: () => void
  initialTab?: 'login' | 'register'
}

import { apiGet, apiPost, saveTokens } from "../../lib/api"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../lib/auth"

export default function UserAuth({ onLogin, onBack, initialTab }: UserAuthProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab ?? 'login')
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  })
  
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    region: "",
    district: "",
    address: "",
    acceptTerms: false
  })
  const [registerError, setRegisterError] = useState<string>("")
  const { refreshUser } = useAuth()

  // Sincronizar pestaña activa con initialTab cuando cambie (por ejemplo, en /register)
  useEffect(() => {
    if (initialTab && (initialTab === 'login' || initialTab === 'register')) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Carga dinámica de regiones/comunas
  const [regions, setRegions] = useState<{ id: string; nombre: string; codigo: string }[]>([])
  const [communes, setCommunes] = useState<{ id: string; nombre: string; codigo: string }[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<string>("")
  const [selectedComunaId, setSelectedComunaId] = useState<string>("")

  useEffect(() => {
    ;(async () => {
      try {
        const r = await apiGet('/api/geo/regiones/')
        setRegions(r)
      } catch (e) {
        console.warn('No se pudieron cargar regiones', e)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!selectedRegionId) {
        setCommunes([])
        setSelectedComunaId("")
        return
      }
      try {
        const c = await apiGet(`/api/geo/comunas/?region_id=${selectedRegionId}`)
        setCommunes(c)
      } catch (e) {
        console.warn('No se pudieron cargar comunas', e)
      }
    })()
  }, [selectedRegionId])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginForm.email || !loginForm.password) {
      alert('Por favor, completa todos los campos requeridos')
      return
    }
    try {
      const tokens = await apiPost('/api/auth/login/', { username: loginForm.email, password: loginForm.password })
      saveTokens(tokens)
      const u = await refreshUser()
      onLogin?.(tokens)
      const role = u?.effective_role
      if (role === 'administrador') {
        navigate('/admin')
        return
      }
      if (role === 'verificador') {
        navigate('/verificador')
        return
      }
      if (role === 'profesional') {
        navigate('/profesional')
        return
      }
  navigate('/cliente')
    } catch (err: any) {
      alert('Credenciales inválidas')
    }
  }

  // Utilidades: formato y validación de RUT y teléfono CL
  const formatRut = (value: string) => {
    // Limpia y aplica formato 12.345.678-9
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (!clean) return ''
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    const reversed = body.split('').reverse().join('')
    const withDots = reversed.replace(/(\d{3})(?=\d)/g, '$1.')
    const bodyFormatted = withDots.split('').reverse().join('')
    return `${bodyFormatted}-${dv}`
  }

  const validateRut = (rut: string) => {
    // Calcula dígito verificador
    const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
    if (clean.length < 2) return false
    const body = clean.slice(0, -1)
    let dv = clean.slice(-1)
    let sum = 0
    let mul = 2
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul
      mul = mul === 7 ? 2 : mul + 1
    }
    const res = 11 - (sum % 11)
    let dvCalc = ''
    if (res === 11) dvCalc = '0'
    else if (res === 10) dvCalc = 'K'
    else dvCalc = String(res)
    return dv === dvCalc
  }

  const formatPhoneCl = (value: string) => {
    // Formato sugerido: +56 9 1234 5678
    let v = value.replace(/[^\d+]/g, '')
    if (!v.startsWith('+')) {
      v = '+56' + v.replace(/^0+/, '')
    }
    // Insertar espacios: +56 9 1234 5678
    const digits = v.replace(/\D/g, '')
    if (digits.startsWith('56')) {
      const rest = digits.slice(2)
      if (rest.length <= 1) return `+56 ${rest}`.trim()
      const p1 = rest.slice(0, 1) // 9
      const p2 = rest.slice(1, 5) // 1234
      const p3 = rest.slice(5, 9) // 5678
      return `+56 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trim()
    }
    return v
  }

  const isRutValid = useMemo(() => registerForm.rut ? validateRut(registerForm.rut) : false, [registerForm.rut])
  const isPhoneValid = useMemo(() => {
    const digits = registerForm.phone.replace(/\D/g, '')
    // +56 9 + 8 dígitos => 11 o 12 dígitos con país
    return digits.length >= 11 && digits.startsWith('56')
  }, [registerForm.phone])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError("")
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.rut ||
        !registerForm.gender || !registerForm.birthDate || !registerForm.email ||
        !registerForm.password || !selectedComunaId || !registerForm.address) {
      alert('Por favor, completa todos los campos requeridos')
      return
    }
    if (!isRutValid) {
      alert('El RUT ingresado no es válido')
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }
    if (!registerForm.acceptTerms) {
      alert('Debes aceptar los términos y condiciones')
      return
    }
    try {
      const payload: any = {
        first_name: registerForm.firstName,
        last_name: registerForm.lastName,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        rut: registerForm.rut,
        gender: registerForm.gender,
        birth_date: registerForm.birthDate,
        comuna_id: selectedComunaId,
        address: registerForm.address,
        role: 'cliente',
      }
      // 1) Crear usuario
      const data = await apiPost('/api/auth/register/', payload)
      // 2) Guardar tokens y refrescar usuario (si falla, no bloquear el flujo)
      saveTokens({ access: data.access, refresh: data.refresh })
      let u = null as any
      try {
        u = await refreshUser()
      } catch (_err) {
        // Silenciar errores de /me si la creación fue exitosa (puede ser un tema temporal de CORS/token)
        console.warn('Registro exitoso, pero falló la actualización de sesión (/api/auth/me).')
      }
      onLogin?.(data.user)
      const role = u?.effective_role
      if (role === 'administrador') { navigate('/admin'); return }
      if (role === 'verificador') { navigate('/verificador'); return }
      if (role === 'profesional') { navigate('/profesional'); return }
      navigate('/cliente')
    } catch (err: any) {
      // Intentar extraer mensajes del backend
      const msg = (err?.data && (err.data.usuario || err.data.detail)) || err?.message || 'Intenta nuevamente.'
      setRegisterError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  // Dev creation buttons removed per request: users will log in with seeded credentials.

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Portal de Usuarios</h1>
          <p className="text-gray-600">
            Únete a ServiHogar para solicitar servicios y también ofrecer tus habilidades
          </p>
        </div>

  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  Iniciar Sesión
                </CardTitle>
                <CardDescription>
                  Accede a tu cuenta de ServiHogar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Iniciar Sesión
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Button variant="link" className="text-sm">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>

                {/* Dev creation buttons removed. Admin and Verifier credentials are pre-seeded in the backend. */}

                {/* Demo accounts info */}
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Cuentas de prueba:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• <strong>Usuario normal:</strong> cualquier email</div>
                      <div>• <strong>Usuario profesional:</strong> profesional@test.com</div>
                      <div className="text-xs text-gray-500 mt-2">Cualquier contraseña funciona para el demo</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-slate-600" />
                      <h4 className="text-sm font-medium text-slate-700">Acceso Administrativo:</h4>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Email:</strong> admin@servihogar.cl</div>
                      <div><strong>Contraseña:</strong> Admin2025!ServiHogar</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-medium text-amber-700">Acceso Verificador:</h4>
                    </div>
                    <div className="text-xs text-amber-600 space-y-1">
                      <div><strong>Email:</strong> verificador@servihogar.cl</div>
                      <div><strong>Contraseña:</strong> Verifier2025!ServiHogar</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Home className="w-5 h-5" />
                  Registro de Usuario
                </CardTitle>
                <CardDescription>
                  Crea tu cuenta para solicitar servicios y también ofrecer tus habilidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-6">
                  {registerError ? (
                    <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
                      {registerError}
                    </div>
                  ) : null}
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nombres</Label>
                        <Input
                          id="firstName"
                          placeholder="María José"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input
                          id="lastName"
                          placeholder="González Silva"
                          value={registerForm.lastName}
                          onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rut">RUT *</Label>
                        <Input
                          id="rut"
                          placeholder="12.345.678-9"
                          value={registerForm.rut}
                          onChange={(e) => setRegisterForm({...registerForm, rut: formatRut(e.target.value)})}
                          required
                        />
                        {registerForm.rut && !isRutValid && (
                          <p className="text-xs text-red-600">RUT inválido</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Género *</Label>
                        <Select 
                          value={registerForm.gender} 
                          onValueChange={(value) => setRegisterForm({...registerForm, gender: value})}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Selecciona tu género" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg">
                            <SelectItem value="masculino" className="hover:bg-gray-100 focus:bg-gray-100">Masculino</SelectItem>
                            <SelectItem value="femenino" className="hover:bg-gray-100 focus:bg-gray-100">Femenino</SelectItem>
                            <SelectItem value="no_binario" className="hover:bg-gray-100 focus:bg-gray-100">No binario</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="birthDate"
                            type="date"
                            className="pl-10"
                            value={registerForm.birthDate}
                            onChange={(e) => setRegisterForm({...registerForm, birthDate: e.target.value})}
                            max={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="phone"
                            placeholder="+56 9 1234 5678"
                            className="pl-10"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({...registerForm, phone: formatPhoneCl(e.target.value)})}
                            required
                          />
                          {registerForm.phone && !isPhoneValid && (
                            <p className="text-xs text-red-600 mt-1">Teléfono chileno inválido</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="maria.gonzalez@email.com"
                          className="pl-10"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información de Ubicación */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Región</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Select 
                            value={selectedRegionId}
                            onValueChange={(value) => { setSelectedRegionId(value); setSelectedComunaId("") }}
                          >
                            <SelectTrigger className="pl-10 bg-white">
                              <SelectValue placeholder="Selecciona tu región" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                              {regions.map(r => (
                                <SelectItem key={r.id} value={r.id} className="hover:bg-gray-100 focus:bg-gray-100">
                                  {r.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Comuna</Label>
                        <Select 
                          value={selectedComunaId}
                          onValueChange={(value) => setSelectedComunaId(value)}
                          disabled={!selectedRegionId}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={selectedRegionId ? "Selecciona tu comuna" : "Primero selecciona una región"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                            {communes.map(c => (
                              <SelectItem key={c.id} value={c.id} className="hover:bg-gray-100 focus:bg-gray-100">
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección *</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="address"
                          placeholder="Av. Providencia 1234, Piso 5"
                          className="pl-10"
                          value={registerForm.address}
                          onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contraseña */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Seguridad
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registerPassword">Contraseña</Label>
                        <Input
                          id="registerPassword"
                          type="password"
                          placeholder="••••••••"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Términos y Condiciones */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={registerForm.acceptTerms}
                      onCheckedChange={(checked) => setRegisterForm({...registerForm, acceptTerms: !!checked})}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Acepto los{" "}
                      <Button variant="link" className="h-auto p-0 text-sm">
                        términos y condiciones
                      </Button>{" "}
                      y la{" "}
                      <Button variant="link" className="h-auto p-0 text-sm">
                        política de privacidad
                      </Button>
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!registerForm.acceptTerms || !isRutValid || !isPhoneValid}
                  >
                    Crear Cuenta de Usuario
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg mb-2">Solicita Servicios</h3>
              <p className="text-sm text-gray-600">
                Encuentra profesionales verificados para cualquier trabajo en tu hogar
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg mb-2">Ofrece tus Servicios</h3>
              <p className="text-sm text-gray-600">
                Crea un perfil profesional y genera ingresos con tus habilidades
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg mb-2">Una Sola Cuenta</h3>
              <p className="text-sm text-gray-600">
                Maneja todo desde un solo lugar: contrata y ofrece servicios
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}