import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Progress } from "../ui/progress"
import { Alert, AlertDescription } from "../ui/alert"
import { Input } from "../ui/input"
import { 
  Star, 
  Calendar, 
  DollarSign, 
  Clock, 
  MapPin, 
  Phone,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
  Eye,
  MessageCircle,
  Loader2,
  Edit,
  X,
  Save
} from "lucide-react"
import { useState, useEffect } from "react"
import { apiGetAuth, apiPutAuth } from "../../lib/api"
import ProfessionalBankAccounts from "./ProfessionalBankAccounts"

interface ProfessionalDashboardProps {
  professional: any
  onLogout: () => void
}

interface ServiceInfo {
  id: string
  category: string
  experience: number
  description: string
  duration_type: 'fija' | 'rango'
  duration_display: string
  price: number
  status: string
  enabled: boolean
  available: boolean
}

interface ProfessionalStats {
  services: ServiceInfo[]
  weekly_stats: {
    completed_jobs: number
    earnings: number
    rating: number
  }
  overall_stats: {
    total_jobs: number
    total_completed: number
    success_rate: number
  }
}

export default function ProfessionalDashboard({ professional, onLogout }: ProfessionalDashboardProps) {
  const [stats, setStats] = useState<ProfessionalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<string>("")
  const [savingPrice, setSavingPrice] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiGetAuth('/api/professional/stats/')
        setStats(response)
      } catch (error) {
        console.error('Error loading professional stats:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const handleEditPrice = (serviceId: string, currentPrice: number) => {
    setEditingPrice(serviceId)
    setNewPrice(currentPrice.toString())
    setPriceError(null)
  }

  const handleCancelEdit = () => {
    setEditingPrice(null)
    setNewPrice("")
    setPriceError(null)
  }

  const handleSavePrice = async (serviceId: string) => {
    const priceValue = parseInt(newPrice)
    
    if (isNaN(priceValue) || priceValue <= 0) {
      setPriceError("El precio debe ser mayor a cero. No puedes establecer un servicio gratuito.")
      return
    }

    setSavingPrice(true)
    setPriceError(null)

    try {
      await apiPutAuth(`/api/services/${serviceId}/price/`, { precio: priceValue })
      
      // Actualizar el estado local
      if (stats) {
        setStats({
          ...stats,
          services: stats.services.map(s => 
            s.id === serviceId ? { ...s, price: priceValue } : s
          )
        })
      }
      
      setEditingPrice(null)
      setNewPrice("")
    } catch (error: any) {
      const errorMsg = error?.message || error?.response?.data?.message || "Error al actualizar el precio"
      setPriceError(errorMsg)
    } finally {
      setSavingPrice(false)
    }
  }
  
  const todayJobs = [
    {
      id: "JOB-001",
      client: "María González",
      service: "Reparación de tubería",
      time: "10:30 AM",
      address: "Av. Providencia 1234, Providencia",
      status: "pending",
      payment: "$35.000",
      priority: "normal"
    },
    {
      id: "JOB-002",
      client: "Carlos Ramírez", 
      service: "Instalación de ducha",
      time: "2:00 PM",
      address: "Las Condes 567, Las Condes",
      status: "confirmed",
      payment: "$55.000",
      priority: "urgent"
    },
    {
      id: "JOB-003",
      client: "Ana Flores",
      service: "Mantenimiento general",
      time: "4:30 PM",
      address: "Av. Ñuñoa 890, Ñuñoa",
      status: "in-progress",
      payment: "$42.000",
      priority: "normal"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "confirmed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmado</Badge>
      case "in-progress":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">En Progreso</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    return priority === "urgent" ? (
      <Badge variant="destructive" className="text-xs">Urgente</Badge>
    ) : (
      <Badge variant="outline" className="text-xs">Normal</Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" alt={professional.name} />
                <AvatarFallback>
                  {professional.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl">¡Hola, {professional.name}!</h1>
                <p className="text-sm text-gray-600">{professional.specialty}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="earnings">Ganancias</TabsTrigger>
            <TabsTrigger value="bankAccounts">Cuentas</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trabajos Hoy</p>
                      <p className="text-2xl">3</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos Hoy</p>
                      <p className="text-2xl text-green-600">$132.000</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Calificación</p>
                      <p className="text-2xl">4.8★</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="text-lg text-green-600">Disponible</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Trabajos de Hoy</CardTitle>
                <CardDescription>
                  Gestiona tus servicios programados para hoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{job.client}</h3>
                            {getPriorityBadge(job.priority)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{job.service}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-3">
                            <div className="font-medium text-green-600">{job.payment}</div>
                            {getStatusBadge(job.status)}
                          </div>
                          <Button size="sm" variant="ghost">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {job.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aceptar Trabajo
                          </Button>
                          <Button size="sm" variant="outline">
                            Rechazar
                          </Button>
                        </div>
                      )}
                      
                      {job.status === "confirmed" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1">
                            Iniciar Trabajo
                          </Button>
                          <Button size="sm" variant="outline">
                            Reprogramar
                          </Button>
                        </div>
                      )}
                      
                      {job.status === "in-progress" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1">
                            Marcar como Completado
                          </Button>
                          <Button size="sm" variant="outline">
                            Reportar Problema
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    Cambiar Estado a No Disponible
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Actualizar Comuna de Trabajo
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Reportar Emergencia
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Trabajos Completados</span>
                        <span className="font-medium">{stats.weekly_stats.completed_jobs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ganancias</span>
                        <span className="font-medium text-green-600">
                          ${stats.weekly_stats.earnings.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Calificación Promedio</span>
                        <span className="font-medium flex items-center gap-1">
                          {stats.weekly_stats.rating > 0 ? (
                            <>
                              {stats.weekly_stats.rating.toFixed(1)}
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </>
                          ) : (
                            'Sin calificaciones'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Servicios Activos</span>
                        <span className="font-medium">{stats.services.filter(s => s.enabled && s.available).length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No se pudieron cargar las estadísticas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Mis Servicios Profesionales</CardTitle>
                <CardDescription>
                  Servicios que ofreces con información de duración y calificación
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && stats.services.length > 0 ? (
                  <div className="space-y-4">
                    {stats.services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{service.category}</h3>
                              {service.enabled && service.available ? (
                                <Badge className="bg-green-100 text-green-800">Activo</Badge>
                              ) : (
                                <Badge variant="secondary">Inactivo</Badge>
                              )}
                              <Badge variant="outline">{service.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{service.description || 'Sin descripción'}</p>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Duración</p>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium">{service.duration_display}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Experiencia</p>
                                <span className="text-sm font-medium">{service.experience} años</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Precio</p>
                                {editingPrice === service.id ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="w-32 h-8"
                                        placeholder="Precio"
                                        disabled={savingPrice}
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleSavePrice(service.id)}
                                        disabled={savingPrice}
                                        className="h-8 px-2"
                                      >
                                        {savingPrice ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Save className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={savingPrice}
                                        className="h-8 px-2"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    {priceError && (
                                      <p className="text-xs text-red-600">{priceError}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-green-600">
                                      ${service.price.toLocaleString('es-CL')}
                                    </span>
                                    {service.status === 'aprobado' && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditPrice(service.id, service.price)}
                                        className="h-6 px-2"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No tienes servicios registrados aún. Aplica para ofrecer servicios profesionales.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Mi Agenda</CardTitle>
                <CardDescription>
                  Visualiza y gestiona tu calendario de trabajo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg mb-2">Calendario en Desarrollo</h3>
                  <p className="text-gray-600">
                    Esta funcionalidad estará disponible próximamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Esta Semana</p>
                        <p className="text-2xl">$520.000</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Este Mes</p>
                        <p className="text-2xl">$1.820.000</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Ganado</p>
                        <p className="text-2xl">$8.200.000</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg mb-2">Historial de Ganancias</h3>
                    <p className="text-gray-600">
                      Aquí podrás ver el detalle de todos tus pagos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bankAccounts">
            <div className="p-8 bg-yellow-100 border-4 border-yellow-500 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">🏦 COMPONENTE DE PRUEBA - CUENTAS BANCARIAS</h2>
              <p className="text-lg">Si ves esto, el tab funciona correctamente.</p>
            </div>
            <ProfessionalBankAccounts />
          </TabsContent>

          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mi Perfil Profesional</CardTitle>
                  <CardDescription>
                    Gestiona tu información y configuración de cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src="" alt={professional.name} />
                          <AvatarFallback className="text-lg">
                            {professional.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl">{professional.name}</h3>
                          <p className="text-gray-600">{professional.specialty}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>
                              {stats && stats.weekly_stats.rating > 0 
                                ? stats.weekly_stats.rating.toFixed(1) 
                                : 'Sin calificaciones'}
                            </span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Verificado
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Información de Contacto</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4" />
                            {professional.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            {professional.district}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Progreso del Perfil</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Completitud del perfil</span>
                            <span>85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Estadísticas</h4>
                        {stats ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 border rounded">
                              <div className="text-lg font-semibold">{stats.overall_stats.total_completed}</div>
                              <div className="text-xs text-gray-500">Trabajos Completados</div>
                            </div>
                            <div className="text-center p-3 border rounded">
                              <div className="text-lg font-semibold">{stats.overall_stats.success_rate}%</div>
                              <div className="text-xs text-gray-500">Tasa de Éxito</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-3 border rounded text-gray-500">
                            <p className="text-sm">Cargando...</p>
                          </div>
                        )}
                      </div>

                      <Button className="w-full">
                        Editar Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}