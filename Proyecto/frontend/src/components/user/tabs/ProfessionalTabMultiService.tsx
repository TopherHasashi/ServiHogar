import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Textarea } from "../../ui/textarea"
import { Badge } from "../../ui/badge"
import { Alert, AlertDescription } from "../../ui/alert"
import { Switch } from "../../ui/switch"
import ProfessionalScheduleManagerAdvanced from "../ProfessionalScheduleManagerAdvanced"
import { Separator } from "../../ui/separator"
import { 
  Briefcase,
  Star,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  Upload,
  FileText,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"

interface ProfessionalService {
  id: string
  categoryId: string
  categoryName: string
  experience: string
  description: string
  durationType: 'fixed' | 'range'
  fixedDuration?: number
  minDuration?: number
  maxDuration?: number
  priceFixed: number
  isActive: boolean
  isAvailable: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
  rating: number
  completedJobs: number
  totalEarnings: number
}

interface ProfessionalProfile {
  id: string
  userId: string
  generalDescription: string
  professionalPhone?: string // Opcional, no se usa
  generalVerificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
  averageRating: number
  totalJobs: number
  totalEarnings: number
  isActive: boolean
  acceptsNewJobs: boolean
  services: ProfessionalService[]
}

interface ProfessionalTabMultiServiceProps {
  user: any
  userProfessionalProfile: ProfessionalProfile | null
  onUpdateProfessionalProfile: (profile: ProfessionalProfile) => void
  onBecomeProfessional: (formData: any) => void
}

export default function ProfessionalTabMultiService({ 
  user, 
  userProfessionalProfile, 
  onUpdateProfessionalProfile,
  onBecomeProfessional 
}: ProfessionalTabMultiServiceProps) {
  const [professionalTab, setProfessionalTab] = useState("overview")
  const [showProfessionalForm, setShowProfessionalForm] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [showAddServiceForm, setShowAddServiceForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editServiceForm, setEditServiceForm] = useState<any>({})

  // Categorías de servicios disponibles
  const serviceCategories = [
    { id: "gasfiteria", name: "Gasfitería" },
    { id: "limpieza", name: "Limpieza del Hogar" },
    { id: "jardineria", name: "Jardinería" }
  ]

  // Estado para formulario de nuevo servicio
  const [newServiceForm, setNewServiceForm] = useState({
    categoryId: "",
    experience: "",
    description: "",
    durationType: "fixed" as 'fixed' | 'range',
    fixedDuration: 60,
    minDuration: 60,
    maxDuration: 240,
    priceFixed: 25000
  })

  // Estado para editar perfil general
  const [profileForm, setProfileForm] = useState({
    generalDescription: userProfessionalProfile?.generalDescription || "",
    acceptsNewJobs: userProfessionalProfile?.acceptsNewJobs ?? true
  })

  // Estado para formulario inicial de profesional
  const [initialProfessionalForm, setInitialProfessionalForm] = useState({
    generalDescription: "",
    firstServiceCategory: "",
    firstServiceExperience: "",
    firstServiceDescription: "",
    firstServiceDurationType: "fixed" as 'fixed' | 'range',
    firstServiceFixedDuration: 60,
    firstServiceMinDuration: 60,
    firstServiceMaxDuration: 240,
    firstServicePrice: 25000
  })

  // Función para convertir minutos a formato de horas
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (mins === 0) {
      return `${hours}h`
    } else {
      return `${hours}h${mins}min`
    }
  }

  // Función para convertir formato de horas a minutos
  // Nota: función de parseo no utilizada eliminada para evitar advertencias de TypeScript

  const handleAddService = () => {
    if (!userProfessionalProfile) return

    const newService: ProfessionalService = {
      id: `service-${Date.now()}`,
      categoryId: newServiceForm.categoryId,
      categoryName: serviceCategories.find(c => c.id === newServiceForm.categoryId)?.name || "",
      experience: newServiceForm.experience,
      description: newServiceForm.description,
      durationType: newServiceForm.durationType,
      fixedDuration: newServiceForm.durationType === 'fixed' ? newServiceForm.fixedDuration : undefined,
      minDuration: newServiceForm.durationType === 'range' ? newServiceForm.minDuration : undefined,
      maxDuration: newServiceForm.durationType === 'range' ? newServiceForm.maxDuration : undefined,
      priceFixed: newServiceForm.priceFixed,
      isActive: true,
      isAvailable: true,
      verificationStatus: 'pending',
      rating: 0,
      completedJobs: 0,
      totalEarnings: 0
    }

    const updatedProfile = {
      ...userProfessionalProfile,
      services: [...userProfessionalProfile.services, newService]
    }

    onUpdateProfessionalProfile(updatedProfile)
    setShowAddServiceForm(false)
    setNewServiceForm({
      categoryId: "",
      experience: "",
      description: "",
      durationType: "fixed",
      fixedDuration: 60,
      minDuration: 60,
      maxDuration: 240,
      priceFixed: 25000
    })
  }

  const handleToggleServiceActive = (serviceId: string) => {
    if (!userProfessionalProfile) return

    const updatedProfile = {
      ...userProfessionalProfile,
      services: userProfessionalProfile.services.map(service =>
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      )
    }

    onUpdateProfessionalProfile(updatedProfile)
  }

  // Nota: Si se necesita eliminar servicios en el futuro, agregar lógica aquí

  const handleBecomeProfessional = () => {
    // Crear perfil profesional inicial con primer servicio
    const initialProfile: ProfessionalProfile = {
      id: `profile-${Date.now()}`,
      userId: user.id,
      generalDescription: initialProfessionalForm.generalDescription,
      professionalPhone: "", // Sin teléfono profesional
      generalVerificationStatus: 'pending',
      averageRating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      isActive: true,
      acceptsNewJobs: true,
      services: [{
        id: `service-${Date.now()}`,
        categoryId: initialProfessionalForm.firstServiceCategory,
        categoryName: serviceCategories.find(c => c.id === initialProfessionalForm.firstServiceCategory)?.name || "",
        experience: initialProfessionalForm.firstServiceExperience,
        description: initialProfessionalForm.firstServiceDescription,
        durationType: initialProfessionalForm.firstServiceDurationType,
        fixedDuration: initialProfessionalForm.firstServiceDurationType === 'fixed' ? initialProfessionalForm.firstServiceFixedDuration : undefined,
        minDuration: initialProfessionalForm.firstServiceDurationType === 'range' ? initialProfessionalForm.firstServiceMinDuration : undefined,
        maxDuration: initialProfessionalForm.firstServiceDurationType === 'range' ? initialProfessionalForm.firstServiceMaxDuration : undefined,
        priceFixed: initialProfessionalForm.firstServicePrice,
        isActive: true,
        isAvailable: true,
        verificationStatus: 'pending',
        rating: 0,
        completedJobs: 0,
        totalEarnings: 0
      }]
    }

    onBecomeProfessional(initialProfile)
    setShowProfessionalForm(false)
  }

  const handleStartEditService = (service: ProfessionalService) => {
    setEditServiceForm({
      id: service.id,
      experience: service.experience,
      description: service.description,
      durationType: service.durationType,
      fixedDuration: service.fixedDuration || 60,
      minDuration: service.minDuration || 60,
      maxDuration: service.maxDuration || 240,
      priceFixed: service.priceFixed
    })
    setEditingService(service.id)
  }

  const handleSaveEditService = () => {
    if (!userProfessionalProfile || !editingService) return

    const updatedProfile = {
      ...userProfessionalProfile,
      services: userProfessionalProfile.services.map(service =>
        service.id === editingService
          ? {
              ...service,
              experience: editServiceForm.experience,
              description: editServiceForm.description,
              durationType: editServiceForm.durationType,
              fixedDuration: editServiceForm.durationType === 'fixed' ? editServiceForm.fixedDuration : undefined,
              minDuration: editServiceForm.durationType === 'range' ? editServiceForm.minDuration : undefined,
              maxDuration: editServiceForm.durationType === 'range' ? editServiceForm.maxDuration : undefined,
              priceFixed: editServiceForm.priceFixed
            }
          : service
      )
    }

    onUpdateProfessionalProfile(updatedProfile)
    setEditingService(null)
    setEditServiceForm({})
  }

  const handleCancelEditService = () => {
    setEditingService(null)
    setEditServiceForm({})
  }

  const handleUpdateProfile = () => {
    if (!userProfessionalProfile) return

    const updatedProfile = {
      ...userProfessionalProfile,
      ...profileForm
    }

    onUpdateProfessionalProfile(updatedProfile)
    setEditingProfile(false)
  }

  const getAvailableCategories = () => {
    if (!userProfessionalProfile) return serviceCategories

    const usedCategoryIds = userProfessionalProfile.services.map(s => s.categoryId)
    return serviceCategories.filter(cat => !usedCategoryIds.includes(cat.id))
  }

  const getVerificationStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "outline" as const, color: "text-yellow-600", text: "Pendiente" },
      approved: { variant: "outline" as const, color: "text-green-600", text: "Aprobado" },
      rejected: { variant: "outline" as const, color: "text-red-600", text: "Rechazado" },
      suspended: { variant: "outline" as const, color: "text-red-600", text: "Suspendido" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Si no es profesional, mostrar formulario para convertirse en uno
  if (!userProfessionalProfile && !showProfessionalForm) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Únete como Profesional
            </CardTitle>
            <CardDescription>
              Ofrece tus servicios en ServiHogar y comienza a generar ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Como profesional en ServiHogar podrás:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Ofrecer múltiples servicios (Gasfitería, Limpieza, Jardinería)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Habilitar/deshabilitar servicios según tu disponibilidad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Configurar precios independientes para cada servicio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Gestionar tu horario y disponibilidad
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Recibir calificaciones y comentarios de clientes
                </li>
              </ul>
              <Button onClick={() => setShowProfessionalForm(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Comenzar como Profesional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Formulario inicial para convertirse en profesional
  if (showProfessionalForm && !userProfessionalProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Perfil Profesional</CardTitle>
            <CardDescription>
              Completa tu información para comenzar a ofrecer servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h4 className="font-medium">Información General</h4>
              <div className="space-y-4">
                <div>
                  <Label>Descripción General</Label>
                  <Textarea
                    placeholder="Describe tu experiencia y enfoque profesional general..."
                    value={initialProfessionalForm.generalDescription}
                    onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      generalDescription: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Primer Servicio */}
            <div className="space-y-4">
              <h4 className="font-medium">Tu Primer Servicio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoría de Servicio</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceCategory}
                    onValueChange={(value) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceCategory: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Años de Experiencia</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceExperience}
                    onValueChange={(value) => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceExperience: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona experiencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 año</SelectItem>
                      <SelectItem value="2">2 años</SelectItem>
                      <SelectItem value="3">3 años</SelectItem>
                      <SelectItem value="4">4 años</SelectItem>
                      <SelectItem value="5+">5+ años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descripción del Servicio</Label>
                <Textarea
                  placeholder="Describe tu experiencia específica en este servicio..."
                  value={initialProfessionalForm.firstServiceDescription}
                    onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                    ...prev,
                    firstServiceDescription: e.target.value
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Duración</Label>
                  <Select
                    value={initialProfessionalForm.firstServiceDurationType}
                    onValueChange={(value: 'fixed' | 'range') => setInitialProfessionalForm((prev: any) => ({
                      ...prev,
                      firstServiceDurationType: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Duración Fija</SelectItem>
                      <SelectItem value="range">Rango de Duración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {initialProfessionalForm.firstServiceDurationType === 'fixed' ? (
                  <div>
                    <Label>Duración (minutos)</Label>
                    <Input
                      type="number"
                      value={initialProfessionalForm.firstServiceFixedDuration}
                      onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                        ...prev,
                        firstServiceFixedDuration: parseInt(e.target.value)
                      }))}
                      min="30"
                      max="480"
                      step="30"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Min (min)</Label>
                      <Input
                        type="number"
                        value={initialProfessionalForm.firstServiceMinDuration}
                        onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                          ...prev,
                          firstServiceMinDuration: parseInt(e.target.value)
                        }))}
                        min="30"
                        max="240"
                        step="30"
                      />
                    </div>
                    <div>
                      <Label>Max (min)</Label>
                      <Input
                        type="number"
                        value={initialProfessionalForm.firstServiceMaxDuration}
                        onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                          ...prev,
                          firstServiceMaxDuration: parseInt(e.target.value)
                        }))}
                        min="60"
                        max="480"
                        step="30"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Precio Fijo del Servicio (CLP)</Label>
                <Input
                  type="number"
                  value={initialProfessionalForm.firstServicePrice}
                  onChange={(e) => setInitialProfessionalForm((prev: any) => ({
                    ...prev,
                    firstServicePrice: parseInt(e.target.value)
                  }))}
                  min="10000"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio fijo que cobrarás por este servicio, independiente del tiempo exacto
                </p>
              </div>
            </div>

            <Separator />

            {/* Documentación Requerida - Primera Solicitud */}
            <div className="space-y-4">
              <h4 className="font-medium">Documentación Requerida</h4>
              
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Para tu primera solicitud debes presentar:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Certificado de Antecedentes (obligatorio, solo se solicita una vez)</li>
                      <li>Documentación que respalde tu experiencia en {initialProfessionalForm.firstServiceCategory ? serviceCategories.find(c => c.id === initialProfessionalForm.firstServiceCategory)?.name : 'el servicio seleccionado'}</li>
                    </ul>
                    <p className="text-xs text-gray-600 mt-2">
                      El certificado de antecedentes puedes solicitarlo en chileatiende.gob.cl
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label>Certificado de Antecedentes (Obligatorio) *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Arrastra tu certificado aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 5MB)
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Documentación de Experiencia *</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sube certificados, cartas de recomendación, facturas, boletas u otros documentos que respalden tu experiencia
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG (máx. 5MB cada uno) - Puedes subir varios archivos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBecomeProfessional} 
                className="flex-1"
                disabled={!initialProfessionalForm.firstServiceCategory || !initialProfessionalForm.generalDescription}
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Perfil Profesional
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowProfessionalForm(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Panel principal para profesionales existentes
  if (!userProfessionalProfile) return null

  return (
    <div className="space-y-6">
      <Tabs value={professionalTab} onValueChange={setProfessionalTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Perfil General */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Perfil Profesional
                  </CardTitle>
                  <CardDescription>
                    Información general de tu perfil como profesional
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <Label>Descripción General</Label>
                    <Textarea
                      value={profileForm.generalDescription}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        generalDescription: e.target.value
                      }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={profileForm.acceptsNewJobs}
                      onCheckedChange={(checked) => setProfileForm(prev => ({
                        ...prev,
                        acceptsNewJobs: checked
                      }))}
                    />
                    <Label>Acepto nuevos trabajos</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Estado General:</span>
                      <div className="mt-1">
                        {getVerificationStatusBadge(userProfessionalProfile.generalVerificationStatus)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Descripción:</span>
                      <p className="text-sm">{userProfessionalProfile.generalDescription}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Acepta Nuevos Trabajos:</span>
                      <p className="text-sm">{userProfessionalProfile.acceptsNewJobs ? "Sí" : "No"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Calificación Promedio:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{userProfessionalProfile.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Trabajos Completados:</span>
                      <p className="font-semibold">{userProfessionalProfile.totalJobs}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Ganancias Totales:</span>
                      <p className="font-semibold text-green-600">${userProfessionalProfile.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumen de Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Servicios</CardTitle>
              <CardDescription>
                Vista rápida de todos tus servicios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {userProfessionalProfile.services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{service.categoryName}</Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${service.priceFixed.toLocaleString()}</span>
                          {service.isActive ? (
                            <Badge variant="outline" className="text-green-600">
                              <Eye className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {service.rating.toFixed(1)}
                          </span>
                          <span>{service.completedJobs} trabajos</span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={service.isActive}
                      onCheckedChange={() => handleToggleServiceActive(service.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Header con botón agregar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Mis Servicios</h3>
              <p className="text-sm text-gray-600">Gestiona los servicios que ofreces</p>
            </div>
            <Button
              onClick={() => setShowAddServiceForm(true)}
              disabled={getAvailableCategories().length === 0}
              title={getAvailableCategories().length === 0 ? "Ya ofreces todos los servicios disponibles" : "Agregar nuevo servicio"}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>

          {/* Formulario para agregar servicio */}
          {showAddServiceForm && (
            <Card>
              <CardHeader>
                <CardTitle>Agregar Nuevo Servicio</CardTitle>
                <CardDescription>
                  Configura un nuevo servicio para ofrecer a tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoría de Servicio</Label>
                    <Select
                      value={newServiceForm.categoryId}
                      onValueChange={(value) => setNewServiceForm((prev: any) => ({
                        ...prev,
                        categoryId: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableCategories().map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Años de Experiencia</Label>
                    <Select
                      value={newServiceForm.experience}
                      onValueChange={(value) => setNewServiceForm((prev: any) => ({
                        ...prev,
                        experience: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona experiencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 año</SelectItem>
                        <SelectItem value="2">2 años</SelectItem>
                        <SelectItem value="3">3 años</SelectItem>
                        <SelectItem value="4">4 años</SelectItem>
                        <SelectItem value="5+">5+ años</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Descripción del Servicio</Label>
                  <Textarea
                    placeholder="Describe tu experiencia específica en este servicio..."
                    value={newServiceForm.description}
                    onChange={(e) => setNewServiceForm((prev: any) => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Duración</Label>
                    <Select
                      value={newServiceForm.durationType}
                      onValueChange={(value: 'fixed' | 'range') => setNewServiceForm((prev: any) => ({
                        ...prev,
                        durationType: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Duración Fija</SelectItem>
                        <SelectItem value="range">Rango de Duración</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newServiceForm.durationType === 'fixed' ? (
                    <div>
                      <Label>Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={newServiceForm.fixedDuration}
                        onChange={(e) => setNewServiceForm((prev: any) => ({
                          ...prev,
                          fixedDuration: parseInt(e.target.value)
                        }))}
                        min="30"
                        max="480"
                        step="30"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Min (min)</Label>
                        <Input
                          type="number"
                          value={newServiceForm.minDuration}
                          onChange={(e) => setNewServiceForm((prev: any) => ({
                            ...prev,
                            minDuration: parseInt(e.target.value)
                          }))}
                          min="30"
                          max="240"
                          step="30"
                        />
                      </div>
                      <div>
                        <Label>Max (min)</Label>
                        <Input
                          type="number"
                          value={newServiceForm.maxDuration}
                          onChange={(e) => setNewServiceForm((prev: any) => ({
                            ...prev,
                            maxDuration: parseInt(e.target.value)
                          }))}
                          min="60"
                          max="480"
                          step="30"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Precio Fijo del Servicio (CLP)</Label>
                  <Input
                    type="number"
                    value={newServiceForm.priceFixed}
                    onChange={(e) => setNewServiceForm((prev: any) => ({
                      ...prev,
                      priceFixed: parseInt(e.target.value)
                    }))}
                    min="10000"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio fijo que cobrarás por este servicio, independiente del tiempo exacto
                  </p>
                </div>

                <Separator />

                {/* Documentación para servicio adicional */}
                <div className="space-y-3">
                  <h4 className="font-medium">Documentación de Experiencia</h4>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="text-sm">
                          Para agregar este nuevo servicio, debes presentar documentación que respalde tu experiencia en {newServiceForm.categoryId ? serviceCategories.find(c => c.id === newServiceForm.categoryId)?.name : 'la categoría seleccionada'}.
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ No necesitas volver a subir el certificado de antecedentes (ya verificado)
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label>Documentación de Experiencia para este Servicio *</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Sube certificados, cartas de recomendación, facturas, boletas u otros documentos que respalden tu experiencia en esta área
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG (máx. 5MB cada uno) - Puedes subir varios archivos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleAddService}
                    disabled={!newServiceForm.categoryId || !newServiceForm.description}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enviar para Verificación
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddServiceForm(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de servicios */}
          <div className="grid gap-4">
            {userProfessionalProfile.services.map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{service.categoryName}</Badge>
                      {getVerificationStatusBadge(service.verificationStatus)}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => handleToggleServiceActive(service.id)}
                        />
                        <span className="text-sm text-gray-600">
                          {service.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editingService === service.id ? handleCancelEditService() : handleStartEditService(service)}
                    >
                      {editingService === service.id ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Edit className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingService === service.id ? (
                    /* Modo edición */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Años de Experiencia</Label>
                          <Select
                            value={editServiceForm.experience}
                            onValueChange={(value) => setEditServiceForm((prev: any) => ({
                              ...prev,
                              experience: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 año</SelectItem>
                              <SelectItem value="2">2 años</SelectItem>
                              <SelectItem value="3">3 años</SelectItem>
                              <SelectItem value="4">4 años</SelectItem>
                              <SelectItem value="5+">5+ años</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Precio Fijo (CLP)</Label>
                          <Input
                            type="number"
                            value={editServiceForm.priceFixed}
                            onChange={(e) => setEditServiceForm((prev: any) => ({
                              ...prev,
                              priceFixed: parseInt(e.target.value)
                            }))}
                            min="10000"
                            step="1000"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Descripción</Label>
                        <Textarea
                          value={editServiceForm.description}
                          onChange={(e) => setEditServiceForm((prev: any) => ({
                            ...prev,
                            description: e.target.value
                          }))}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Tipo de Duración</Label>
                          <Select
                            value={editServiceForm.durationType}
                            onValueChange={(value: 'fixed' | 'range') => setEditServiceForm((prev: any) => ({
                              ...prev,
                              durationType: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Duración Fija</SelectItem>
                              <SelectItem value="range">Rango de Duración</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {editServiceForm.durationType === 'fixed' ? (
                          <div>
                            <Label>Duración</Label>
                            <Input
                              type="number"
                              value={editServiceForm.fixedDuration}
                              onChange={(e) => setEditServiceForm((prev: any) => ({
                                ...prev,
                                fixedDuration: parseInt(e.target.value)
                              }))}
                              min="30"
                              max="480"
                              step="30"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              En minutos. Ejemplo: 60 = 1h, 90 = 1h30min
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Duración Mínima</Label>
                              <Input
                                type="number"
                                value={editServiceForm.minDuration}
                                onChange={(e) => setEditServiceForm((prev: any) => ({
                                  ...prev,
                                  minDuration: parseInt(e.target.value)
                                }))}
                                min="30"
                                max="240"
                                step="30"
                              />
                              <p className="text-xs text-gray-500 mt-1">En minutos</p>
                            </div>
                            <div>
                              <Label>Duración Máxima</Label>
                              <Input
                                type="number"
                                value={editServiceForm.maxDuration}
                                onChange={(e) => setEditServiceForm((prev: any) => ({
                                  ...prev,
                                  maxDuration: parseInt(e.target.value)
                                }))}
                                min="60"
                                max="480"
                                step="30"
                              />
                              <p className="text-xs text-gray-500 mt-1">En minutos</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveEditService}>
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Cambios
                        </Button>
                        <Button variant="outline" onClick={handleCancelEditService}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualización */
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Experiencia:</span>
                          <p className="font-medium">{service.experience} años</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Precio Fijo:</span>
                          <p className="font-semibold text-green-600">${service.priceFixed.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Duración:</span>
                          <p className="font-medium">
                            {service.durationType === 'fixed' 
                              ? `${formatDuration(service.fixedDuration || 0)} (fijo)`
                              : `${formatDuration(service.minDuration || 0)}-${formatDuration(service.maxDuration || 0)}`
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Calificación:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{service.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({service.completedJobs} trabajos)</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">Descripción:</span>
                        <p className="text-sm mt-1">{service.description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {userProfessionalProfile.services.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-600 mb-2">No tienes servicios activos</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Agrega tu primer servicio para comenzar a recibir solicitudes
                </p>
                <Button onClick={() => setShowAddServiceForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Servicio
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <ProfessionalScheduleManagerAdvanced 
            professionalServices={userProfessionalProfile.services}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}