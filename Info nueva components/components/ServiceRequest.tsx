import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Wrench,
  Sparkles,
  Scissors,
  Home,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  AlertCircle
} from "lucide-react"

interface ServiceRequestProps {
  onBack: () => void
  preSelectedService?: string
}

export default function ServiceRequest({ onBack, preSelectedService }: ServiceRequestProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [requestForm, setRequestForm] = useState({
    // Información del cliente
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Ubicación
    region: "",
    district: "",
    address: "",
    addressDetails: "",
    
    // Servicio
    serviceType: preSelectedService || "",
    serviceDescription: "",
    urgency: "",
    preferredDate: "",
    preferredTime: "",
    
    // Opciones adicionales
    hasAnimals: false,
    needsMaterials: false,
    additionalNotes: "",
    
    // Presupuesto
    estimatedBudget: "",
    paymentMethod: ""
  })

  // Regiones y comunas de Chile (mismas que en ProfessionalAuth)
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

  const services = [
    { id: "gasfiteria", name: "Gasfitería", icon: <Wrench className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
    { id: "limpieza", name: "Limpieza del Hogar", icon: <Sparkles className="w-5 h-5" />, color: "bg-green-100 text-green-600" },
    { id: "jardineria", name: "Jardinería", icon: <Scissors className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
    { id: "electricidad", name: "Electricidad", icon: <Home className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-600" },
    { id: "pintura", name: "Pintura", icon: <Home className="w-5 h-5" />, color: "bg-red-100 text-red-600" },
    { id: "carpinteria", name: "Carpintería", icon: <Home className="w-5 h-5" />, color: "bg-orange-100 text-orange-600" }
  ]

  const urgencyOptions = [
    { value: "normal", label: "Normal (2-3 días)", price: "Precio estándar" },
    { value: "urgente", label: "Urgente (24 horas)", price: "+20%" },
    { value: "emergencia", label: "Emergencia (2-4 horas)", price: "+50%" }
  ]

  const timeSlots = [
    "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", 
    "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí se procesaría la solicitud
    alert("¡Solicitud enviada exitosamente! Te contactaremos pronto.")
    onBack()
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Información Personal"
      case 2: return "Ubicación del Servicio"
      case 3: return "Detalles del Servicio"
      case 4: return "Confirmación"
      default: return "Solicitar Servicio"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl mb-2">Solicitar Servicio</h1>
            <p className="text-gray-600">
              Completa los datos para encontrar el profesional perfecto para ti
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step <= currentStep 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 ${
                      step < currentStep ? "bg-primary" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            <CardDescription>
              Paso {currentStep} de 4
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Paso 1: Información Personal */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombres</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="firstName"
                          placeholder="Juan Carlos"
                          className="pl-10"
                          value={requestForm.firstName}
                          onChange={(e) => setRequestForm({...requestForm, firstName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        placeholder="González Morales"
                        value={requestForm.lastName}
                        onChange={(e) => setRequestForm({...requestForm, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan.gonzalez@email.com"
                        className="pl-10"
                        value={requestForm.email}
                        onChange={(e) => setRequestForm({...requestForm, email: e.target.value})}
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
                        value={requestForm.phone}
                        onChange={(e) => setRequestForm({...requestForm, phone: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Ubicación */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Región</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                        <Select 
                          value={requestForm.region} 
                          onValueChange={(value) => setRequestForm({...requestForm, region: value, district: ""})}
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
                      <Label htmlFor="district">Comuna</Label>
                      <Select 
                        value={requestForm.district} 
                        onValueChange={(value) => setRequestForm({...requestForm, district: value})}
                        disabled={!requestForm.region}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={requestForm.region ? "Selecciona tu comuna" : "Primero selecciona una región"} />
                        </SelectTrigger>
                        <SelectContent>
                          {requestForm.region && regionsAndCommunes[requestForm.region as keyof typeof regionsAndCommunes]?.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Av. Providencia 1234"
                      value={requestForm.address}
                      onChange={(e) => setRequestForm({...requestForm, address: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressDetails">Detalles adicionales (opcional)</Label>
                    <Input
                      id="addressDetails"
                      placeholder="Departamento 503, Torre B, timbre 15"
                      value={requestForm.addressDetails}
                      onChange={(e) => setRequestForm({...requestForm, addressDetails: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Paso 3: Detalles del Servicio */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tipo de Servicio</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            requestForm.serviceType === service.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setRequestForm({...requestForm, serviceType: service.id})}
                        >
                          <div className={`w-8 h-8 rounded-lg ${service.color} flex items-center justify-center mb-2`}>
                            {service.icon}
                          </div>
                          <div className="text-sm">{service.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceDescription">Descripción del trabajo</Label>
                    <Textarea
                      id="serviceDescription"
                      placeholder="Describe detalladamente qué necesitas..."
                      rows={4}
                      value={requestForm.serviceDescription}
                      onChange={(e) => setRequestForm({...requestForm, serviceDescription: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Urgencia</Label>
                    <div className="space-y-2">
                      {urgencyOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            requestForm.urgency === option.value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setRequestForm({...requestForm, urgency: option.value})}
                        >
                          <div className="flex justify-between items-center">
                            <span>{option.label}</span>
                            <Badge variant="outline">{option.price}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Fecha preferida</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="preferredDate"
                          type="date"
                          className="pl-10"
                          value={requestForm.preferredDate}
                          onChange={(e) => setRequestForm({...requestForm, preferredDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">Horario preferido</Label>
                      <Select 
                        value={requestForm.preferredTime} 
                        onValueChange={(value) => setRequestForm({...requestForm, preferredTime: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un horario" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {slot}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasAnimals"
                        checked={requestForm.hasAnimals}
                        onCheckedChange={(checked) => setRequestForm({...requestForm, hasAnimals: !!checked})}
                      />
                      <Label htmlFor="hasAnimals" className="text-sm">
                        Hay mascotas en el domicilio
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="needsMaterials"
                        checked={requestForm.needsMaterials}
                        onCheckedChange={(checked) => setRequestForm({...requestForm, needsMaterials: !!checked})}
                      />
                      <Label htmlFor="needsMaterials" className="text-sm">
                        Necesito que el profesional traiga los materiales
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Notas adicionales (opcional)</Label>
                    <Textarea
                      id="additionalNotes"
                      placeholder="Cualquier información adicional que consideres importante..."
                      rows={3}
                      value={requestForm.additionalNotes}
                      onChange={(e) => setRequestForm({...requestForm, additionalNotes: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Paso 4: Confirmación */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg text-blue-900">Resumen de tu solicitud</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Cliente:</strong> {requestForm.firstName} {requestForm.lastName}</p>
                      <p><strong>Ubicación:</strong> {requestForm.address}, {requestForm.district}, {requestForm.region}</p>
                      <p><strong>Servicio:</strong> {services.find(s => s.id === requestForm.serviceType)?.name}</p>
                      <p><strong>Fecha:</strong> {requestForm.preferredDate} - {requestForm.preferredTime}</p>
                      <p><strong>Urgencia:</strong> {urgencyOptions.find(u => u.value === requestForm.urgency)?.label}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedBudget">Presupuesto estimado (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <Input
                        id="estimatedBudget"
                        placeholder="50.000"
                        className="pl-8"
                        value={requestForm.estimatedBudget}
                        onChange={(e) => setRequestForm({...requestForm, estimatedBudget: e.target.value})}
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      El precio final se acordará con el profesional según la evaluación del trabajo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de pago preferido</Label>
                    <Select 
                      value={requestForm.paymentMethod} 
                      onValueChange={(value) => setRequestForm({...requestForm, paymentMethod: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Efectivo
                          </div>
                        </SelectItem>
                        <SelectItem value="transferencia">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Transferencia bancaria
                          </div>
                        </SelectItem>
                        <SelectItem value="tarjeta">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Tarjeta de crédito/débito
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-green-900 mb-2">¿Qué sigue?</h4>
                    <ol className="text-sm text-green-800 space-y-1">
                      <li>1. Enviaremos tu solicitud a profesionales cercanos</li>
                      <li>2. Recibirás cotizaciones en las próximas 2 horas</li>
                      <li>3. Podrás elegir al profesional que prefieras</li>
                      <li>4. Te contactaremos para coordinar el servicio</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Anterior
                </Button>
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 1 && (!requestForm.firstName || !requestForm.lastName || !requestForm.email || !requestForm.phone)) ||
                      (currentStep === 2 && (!requestForm.region || !requestForm.district || !requestForm.address)) ||
                      (currentStep === 3 && (!requestForm.serviceType || !requestForm.serviceDescription || !requestForm.urgency || !requestForm.preferredDate || !requestForm.preferredTime))
                    }
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enviar Solicitud
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}