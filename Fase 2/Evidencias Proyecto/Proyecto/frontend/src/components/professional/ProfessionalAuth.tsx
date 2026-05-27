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
  Briefcase, 
  Star,
  Upload,
  FileText,
  CheckCircle,
  ArrowLeft
} from "lucide-react"

interface ProfessionalAuthProps {
  onLogin: (professional: any) => void
  onBack: () => void
}

export default function ProfessionalAuth({ onLogin, onBack }: ProfessionalAuthProps) {
  const [activeTab, setActiveTab] = useState("login")
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  })
  
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    experience: "",
    region: "",
    district: "",
    certifications: [] as string[],
    acceptTerms: false
  })

  const specialties = [
    "Gasfitería",
    "Limpieza del Hogar",
    "Jardinería",
    "Electricidad",
    "Pintura",
    "Carpintería"
  ]

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
    // Simulación de login exitoso
    const professional = {
      id: "PROF-001",
      name: "Juan Pérez",
      email: loginForm.email,
      specialty: "Gasfitería",
      rating: 4.8,
      phone: "+51 999 123 456",
      district: "Miraflores"
    }
    onLogin(professional)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulación de registro exitoso
    const professional = {
      id: "PROF-NEW",
      name: `${registerForm.firstName} ${registerForm.lastName}`,
      email: registerForm.email,
      specialty: registerForm.specialty,
      rating: 0,
      phone: registerForm.phone,
      district: registerForm.district
    }
    onLogin(professional)
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
          <h1 className="text-3xl mb-2">Portal de Profesionales</h1>
          <p className="text-gray-600">
            Únete a ServiHogar y comienza a ganar dinero ofreciendo tus servicios
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
                  Accede a tu cuenta de profesional
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Registro de Profesional
                </CardTitle>
                <CardDescription>
                  Completa tu perfil y comienza a trabajar con nosotros
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
                          placeholder="Juan Carlos"
                          value={registerForm.firstName}
                          onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Apellidos</Label>
                        <Input
                          id="lastName"
                          placeholder="González Morales"
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
                          placeholder="juan.gonzalez@email.com"
                          className="pl-10"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información Profesional */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Información Profesional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad Principal</Label>
                        <Select 
                          value={registerForm.specialty} 
                          onValueChange={(value) => setRegisterForm({...registerForm, specialty: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu especialidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem key={specialty} value={specialty}>
                                {specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Años de Experiencia</Label>
                        <Input
                          id="experience"
                          type="number"
                          placeholder="5"
                          min="0"
                          value={registerForm.experience}
                          onChange={(e) => setRegisterForm({...registerForm, experience: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Región de Trabajo</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Select 
                            value={registerForm.region} 
                            onValueChange={(value) => setRegisterForm({...registerForm, region: value, district: ""})}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Selecciona tu región" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(regionsAndCommunes).map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">Comuna de Trabajo Principal</Label>
                        <Select 
                          value={registerForm.district} 
                          onValueChange={(value) => setRegisterForm({...registerForm, district: value})}
                          disabled={!registerForm.region}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={registerForm.region ? "Selecciona tu comuna" : "Primero selecciona una región"} />
                          </SelectTrigger>
                          <SelectContent>
                            {registerForm.region && regionsAndCommunes[registerForm.region as keyof typeof regionsAndCommunes]?.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Documentación */}
                  <div>
                    <h3 className="text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentación (Opcional)
                    </h3>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">
                          Sube tus certificados y documentos
                        </p>
                        <Button variant="outline" size="sm">
                          Seleccionar Archivos
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Certificaciones Sugeridas</Label>
                          <div className="space-y-2">
                            {["INACAP", "DuocUC", "SENCE", "Curso de Prevención de Riesgos"].map((cert) => (
                              <div key={cert} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={cert}
                                  checked={registerForm.certifications.includes(cert)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setRegisterForm({
                                        ...registerForm, 
                                        certifications: [...registerForm.certifications, cert]
                                      })
                                    } else {
                                      setRegisterForm({
                                        ...registerForm, 
                                        certifications: registerForm.certifications.filter(c => c !== cert)
                                      })
                                    }
                                  }}
                                />
                                <Label htmlFor={cert} className="text-sm">{cert}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Beneficios del Registro</Label>
                          <div className="space-y-2">
                            {[
                              "Acceso a trabajos verificados",
                              "Pagos seguros garantizados",
                              "Soporte 24/7",
                              "Herramientas profesionales"
                            ].map((benefit, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
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
                    Crear Cuenta Profesional
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
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg mb-2">Trabaja con Confianza</h3>
              <p className="text-sm text-gray-600">
                Todos nuestros clientes están verificados y los pagos están garantizados
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg mb-2">Flexibilidad Total</h3>
              <p className="text-sm text-gray-600">
                Elige tus horarios, zonas de trabajo y tipos de servicios que ofreces
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg mb-2">Soporte Completo</h3>
              <p className="text-sm text-gray-600">
                Capacitación continua, herramientas profesionales y soporte 24/7
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}