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
import ProfessionalScheduleManager from "../ProfessionalScheduleManager"
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
  
} from "lucide-react"

interface ProfessionalTabProps {
  user: any
  userProfessionalData: any
  onUpdateProfessionalData: (data: any) => void
  onBecomeProfessional: (formData: any) => void
}

export default function ProfessionalTab({ 
  user, 
  userProfessionalData, 
  onUpdateProfessionalData,
  onBecomeProfessional 
}: ProfessionalTabProps) {
  const [professionalTab, setProfessionalTab] = useState("profile")
  const [showProfessionalForm, setShowProfessionalForm] = useState(false)
  const [editingServiceProfile, setEditingServiceProfile] = useState(false)
  const [tempServiceData, setTempServiceData] = useState<any>({})

  // Estado para el formulario de profesional
  const [professionalForm, setProfessionalForm] = useState({
    specialty: "",
    experience: "",
    description: "",
    priceRange: "",
    durationType: "fixed",
    fixedDuration: 60,
    minDuration: 60,
    maxDuration: 240,
    pricePerHour: 15000,
    certifications: [],
    documents: []
  })

  const specialties = [
    "Gasfitería",
    "Limpieza del Hogar", 
    "Jardinería"
  ]

  // Función para iniciar edición de perfil de servicio
  const handleStartEditServiceProfile = () => {
    setTempServiceData({
      specialty: userProfessionalData?.specialty || "",
      experience: userProfessionalData?.experience || "",
      description: userProfessionalData?.description || "",
      durationType: userProfessionalData?.durationType || "fixed",
      fixedDuration: userProfessionalData?.fixedDuration || 60,
      minDuration: userProfessionalData?.minDuration || 60,
      maxDuration: userProfessionalData?.maxDuration || 240,
      pricePerHour: userProfessionalData?.pricePerHour || 15000
    })
    setEditingServiceProfile(true)
  }

  // Función para actualizar datos profesionales
  const handleUpdateProfessionalData = () => {
    onUpdateProfessionalData({
      ...userProfessionalData,
      ...tempServiceData
    })
    setEditingServiceProfile(false)
    setTempServiceData({})
  }

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingServiceProfile(false)
    setTempServiceData({})
  }

  const handleSubmitProfessionalForm = () => {
    onBecomeProfessional(professionalForm)
    setShowProfessionalForm(false)
  }

  if (!user.isProfessional && !showProfessionalForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Únete como Profesional
          </CardTitle>
          <CardDescription>
            Comienza a ofrecer tus servicios y genera ingresos adicionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¿Eres un profesional?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Únete a nuestra plataforma y conecta con clientes que necesitan tus servicios. 
              Gestiona tu agenda, recibe pagos seguros y haz crecer tu negocio.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium">Verificación 24-48hrs</h4>
                <p className="text-sm text-gray-600">Proceso rápido y confiable</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium">Pagos Protegidos</h4>
                <p className="text-sm text-gray-600">MercadoPago seguro</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium">Gestión Simple</h4>
                <p className="text-sm text-gray-600">Agenda y clientes</p>
              </div>
            </div>

            <Button 
              onClick={() => setShowProfessionalForm(true)}
              size="lg"
              className="px-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aplicar como Profesional
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showProfessionalForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aplicación como Profesional</CardTitle>
          <CardDescription>
            Completa tu perfil profesional para comenzar a ofrecer servicios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Especialidad *</Label>
              <Select 
                value={professionalForm.specialty} 
                onValueChange={(value) => setProfessionalForm((prev: any) => ({...prev, specialty: value}))}
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
              <Label>Años de experiencia *</Label>
              <Select 
                value={professionalForm.experience} 
                onValueChange={(value) => setProfessionalForm((prev: any) => ({...prev, experience: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
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

          <div className="space-y-2">
            <Label>Descripción de servicios *</Label>
            <Textarea
              placeholder="Describe los servicios que ofreces y tu experiencia..."
              value={professionalForm.description}
              onChange={(e) => setProfessionalForm((prev: any) => ({...prev, description: e.target.value}))}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Configuración de duración y precios *</Label>
            
            <div className="space-y-2">
              <Label>Tipo de duración</Label>
              <Select 
                value={professionalForm.durationType} 
                onValueChange={(value) => setProfessionalForm((prev: any) => ({...prev, durationType: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Duración fija</SelectItem>
                  <SelectItem value="range">Rango de duración</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {professionalForm.durationType === "fixed" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración fija (minutos)</Label>
                  <Input
                    type="number"
                    value={professionalForm.fixedDuration}
                    onChange={(e) => setProfessionalForm((prev: any) => ({...prev, fixedDuration: parseInt(e.target.value)}))}
                    min="30"
                    max="480"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio total (CLP)</Label>
                  <Input
                    type="number"
                    value={professionalForm.pricePerHour}
                    onChange={(e) => setProfessionalForm((prev: any) => ({...prev, pricePerHour: parseInt(e.target.value)}))}
                    min="10000"
                    step="1000"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duración mínima (min)</Label>
                  <Input
                    type="number"
                    value={professionalForm.minDuration}
                    onChange={(e) => setProfessionalForm((prev: any) => ({...prev, minDuration: parseInt(e.target.value)}))}
                    min="30"
                    max="240"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duración máxima (min)</Label>
                  <Input
                    type="number"
                    value={professionalForm.maxDuration}
                    onChange={(e) => setProfessionalForm((prev: any) => ({...prev, maxDuration: parseInt(e.target.value)}))}
                    min="60"
                    max="480"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio fijo del servicio (CLP)</Label>
                  <Input
                    type="number"
                    value={professionalForm.pricePerHour}
                    onChange={(e) => setProfessionalForm((prev: any) => ({...prev, pricePerHour: parseInt(e.target.value)}))}
                    min="10000"
                    step="1000"
                  />
                  <p className="text-xs text-gray-500">
                    Precio fijo que cobrarás por el servicio, independiente del tiempo exacto
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Documentación Requerida</Label>
            
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Para tu primera solicitud debes presentar:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Certificado de Antecedentes (obligatorio, solo se solicita una vez)</li>
                    <li>Documentación que respalde tu experiencia en {professionalForm.specialty || 'el servicio seleccionado'}</li>
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

          <div className="flex gap-2">
            <Button onClick={handleSubmitProfessionalForm}>
              Enviar Aplicación
            </Button>
            <Button variant="outline" onClick={() => setShowProfessionalForm(false)}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Panel profesional para usuarios ya verificados
  return (
    <div className="space-y-6">
      <Tabs value={professionalTab} onValueChange={setProfessionalTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil de Servicio</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        {/* Tab Perfil de Servicio */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Perfil Profesional
              </CardTitle>
              <CardDescription>
                Gestiona la información de tu servicio profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estado de verificación */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Perfil Verificado</p>
                  <p className="text-sm text-green-600">Tu cuenta profesional está activa y verificada</p>
                </div>
              </div>

              {editingServiceProfile ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Especialidad</Label>
                      <Select 
                        value={tempServiceData.specialty} 
                        onValueChange={(value) => setTempServiceData((prev: any) => ({...prev, specialty: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                      <Label>Años de experiencia</Label>
                      <Select 
                        value={tempServiceData.experience} 
                        onValueChange={(value) => setTempServiceData((prev: any) => ({...prev, experience: value}))}
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
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={tempServiceData.description}
                      onChange={(e) => setTempServiceData((prev: any) => ({...prev, description: e.target.value}))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de duración</Label>
                      <Select 
                        value={tempServiceData.durationType} 
                        onValueChange={(value) => setTempServiceData((prev: any) => ({...prev, durationType: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Duración fija</SelectItem>
                          <SelectItem value="range">Rango de duración</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {tempServiceData.durationType === "fixed" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Duración (minutos)</Label>
                          <Input
                            type="number"
                            value={tempServiceData.fixedDuration}
                            onChange={(e) => setTempServiceData((prev: any) => ({...prev, fixedDuration: parseInt(e.target.value)}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio total (CLP)</Label>
                          <Input
                            type="number"
                            value={tempServiceData.pricePerHour}
                            onChange={(e) => setTempServiceData((prev: any) => ({...prev, pricePerHour: parseInt(e.target.value)}))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Min (min)</Label>
                          <Input
                            type="number"
                            value={tempServiceData.minDuration}
                            onChange={(e) => setTempServiceData((prev: any) => ({...prev, minDuration: parseInt(e.target.value)}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max (min)</Label>
                          <Input
                            type="number"
                            value={tempServiceData.maxDuration}
                            onChange={(e) => setTempServiceData((prev: any) => ({...prev, maxDuration: parseInt(e.target.value)}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio total (CLP)</Label>
                          <Input
                            type="number"
                            value={tempServiceData.pricePerHour}
                            onChange={(e) => setTempServiceData((prev: any) => ({...prev, pricePerHour: parseInt(e.target.value)}))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfessionalData} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} className="flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Modo visualización */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Información del Servicio</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Especialidad:</span>
                          <div className="mt-1">
                            <Badge variant="secondary">{userProfessionalData.specialty}</Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Experiencia:</span>
                          <p>{userProfessionalData.experience} años</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Descripción:</span>
                          <p className="text-sm">{userProfessionalData.description}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Precios y Duración</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Precio fijo:</span>
                          <p className="text-lg font-semibold text-green-600">${userProfessionalData.pricePerHour?.toLocaleString()}</p>
                        </div>
                        {userProfessionalData.durationType === "fixed" ? (
                          <div>
                            <span className="text-sm text-gray-500">Duración:</span>
                            <p>{userProfessionalData.fixedDuration} minutos (fijo)</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm text-gray-500">Duración:</span>
                            <p>{userProfessionalData.minDuration}-{userProfessionalData.maxDuration} min (flexible)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{userProfessionalData.rating}</span>
                      </div>
                      <p className="text-sm text-gray-600">Calificación</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold">{userProfessionalData.completedJobs}</p>
                      <p className="text-sm text-gray-600">Trabajos completados</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">Verificado</span>
                      </div>
                      <p className="text-sm text-gray-600">Estado</p>
                    </div>
                  </div>

                  <Button onClick={handleStartEditServiceProfile} className="flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editar Perfil de Servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Horarios */}
        <TabsContent value="schedule">
          <ProfessionalScheduleManager />
        </TabsContent>

        {/* Tab Estadísticas */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Negocio</CardTitle>
              <CardDescription>
                Análisis de tu rendimiento y ganancias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-2xl font-bold text-green-600">$245.000</h3>
                    <p className="text-sm text-gray-600">Ganancias este mes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-2xl font-bold">12</h3>
                    <p className="text-sm text-gray-600">Servicios este mes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-2xl font-bold">4.8</h3>
                    <p className="text-sm text-gray-600">Calificación promedio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-2xl font-bold">95%</h3>
                    <p className="text-sm text-gray-600">Tasa de completado</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}