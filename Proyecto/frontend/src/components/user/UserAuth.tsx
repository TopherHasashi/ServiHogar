import { useState } from "react"
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
}

export default function UserAuth({ onLogin, onAdminLogin, onVerifierLogin, onBack }: UserAuthProps) {
  const [activeTab, setActiveTab] = useState("login")
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

  // Regiones y comunas de Chile
  const regionsAndCommunes = {
    "Región de Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
    "Región de Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"],
    "Región de Antofagasta": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"],
    "Región de Atacama": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"],
    "Región de Coquimbo": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"],
    "Región de Valparaíso": ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Limache", "Olmué", "Villa Alemana"],
    "Región Metropolitana": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Miguel", "San Joaquín", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"],
    "Región del Libertador General Bernardo O'Higgins": ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"],
    "Región del Maule": ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"],
    "Región del Ñuble": ["Chillán", "Bulnes", "Cobquecura", "Coelemu", "Coihueco", "Chillán Viejo", "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás", "Treguaco", "Yungay"],
    "Región del Biobío": ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"],
    "Región de La Araucanía": ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"],
    "Región de Los Ríos": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"],
    "Región de Los Lagos": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"],
    "Región Aysén del General Carlos Ibáñez del Campo": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"],
    "Región de Magallanes y de la Antártica Chilena": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!loginForm.email || !loginForm.password) {
      alert('Por favor, completa todos los campos requeridos')
      return
    }
    
    // Verificar si es login de administrador
    if (loginForm.email === "admin@servihogar.cl" && loginForm.password === "Admin2025!ServiHogar") {
      if (onAdminLogin) {
        onAdminLogin()
        return
      }
    }
    
    // Verificar si es login de verificador
    if (loginForm.email === "verificador@servihogar.cl" && loginForm.password === "Verifier2025!ServiHogar") {
      if (onVerifierLogin) {
        onVerifierLogin()
        return
      }
    }
    
    // Simulación de login exitoso - diferentes usuarios según el email
    let user
    
    if (loginForm.email === "profesional@test.com") {
      // Usuario que ya es profesional
      user = {
        id: "USER-PROF",
        name: "Carlos Rodríguez",
        email: loginForm.email,
        phone: "+56 9 1234 5678",
        region: "Región Metropolitana",
        commune: "Providencia",
        address: "Av. Providencia 1234",
        memberSince: "Enero 2024",
        isProfessional: true,
        professionalProfile: {
          specialty: "Gasfitería",
          experience: "3",
          verified: true,
          rating: 4.5,
          completedJobs: 45
        }
      }
    } else {
      // Usuario normal
      user = {
        id: "USER-001",
        name: "María González",
        email: loginForm.email,
        phone: "+56 9 8888 7777",
        region: "Región Metropolitana",
        commune: "Santiago",
        address: "Av. Libertador Bernardo O'Higgins 1234",
        memberSince: "Marzo 2024",
        isProfessional: false,
        professionalProfile: null
      }
    }
    
    onLogin(user)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.rut || 
        !registerForm.gender || !registerForm.birthDate || !registerForm.email || 
        !registerForm.password || !registerForm.region || !registerForm.district || 
        !registerForm.address) {
      alert('Por favor, completa todos los campos requeridos')
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
    
    // Simulación de registro exitoso
    const user = {
      id: "USER-NEW",
      name: `${registerForm.firstName} ${registerForm.lastName}`,
      rut: registerForm.rut,
      gender: registerForm.gender,
      birthDate: registerForm.birthDate,
      email: registerForm.email,
      phone: registerForm.phone,
      region: registerForm.region,
      commune: registerForm.district,
      address: registerForm.address,
      memberSince: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }),
      isProfessional: false,
      professionalProfile: null
    }
    
    onLogin(user)
  }

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                          onChange={(e) => setRegisterForm({...registerForm, rut: e.target.value})}
                          required
                        />
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
                            <SelectItem value="otro" className="hover:bg-gray-100 focus:bg-gray-100">Otro</SelectItem>
                            <SelectItem value="prefiero-no-decir" className="hover:bg-gray-100 focus:bg-gray-100">Prefiero no decir</SelectItem>
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
                            placeholder="+56 9 8888 7777"
                            className="pl-10"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                            required
                          />
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
                        <Label htmlFor="region">Región</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Select 
                            value={registerForm.region} 
                            onValueChange={(value) => setRegisterForm({...registerForm, region: value, district: ""})}
                          >
                            <SelectTrigger className="pl-10 bg-white">
                              <SelectValue placeholder="Selecciona tu región" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                              {Object.keys(regionsAndCommunes).map((region) => (
                                <SelectItem key={region} value={region} className="hover:bg-gray-100 focus:bg-gray-100">
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">Comuna</Label>
                        <Select 
                          value={registerForm.district} 
                          onValueChange={(value) => setRegisterForm({...registerForm, district: value})}
                          disabled={!registerForm.region}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder={registerForm.region ? "Selecciona tu comuna" : "Primero selecciona una región"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                            {registerForm.region && regionsAndCommunes[registerForm.region as keyof typeof regionsAndCommunes]?.map((district) => (
                              <SelectItem key={district} value={district} className="hover:bg-gray-100 focus:bg-gray-100">
                                {district}
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
                    disabled={!registerForm.acceptTerms}
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