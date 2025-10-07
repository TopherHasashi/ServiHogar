import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Progress } from "../ui/progress"
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
  MessageCircle
} from "lucide-react"

interface ProfessionalDashboardProps {
  professional: any
  onLogout: () => void
}

export default function ProfessionalDashboard({ professional, onLogout }: ProfessionalDashboardProps) {
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

  const weeklyStats = {
    completedJobs: 12,
    earnings: 520000,
    rating: 4.8,
    responseTime: "8 min"
  }

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
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="earnings">Ganancias</TabsTrigger>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trabajos Completados</span>
                      <span className="font-medium">{weeklyStats.completedJobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ganancias</span>
                      <span className="font-medium text-green-600">${weeklyStats.earnings.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Calificación Promedio</span>
                      <span className="font-medium">{weeklyStats.rating}★</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tiempo de Respuesta</span>
                      <span className="font-medium">{weeklyStats.responseTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{professional.rating}</span>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded">
                            <div className="text-lg">156</div>
                            <div className="text-xs text-gray-500">Trabajos</div>
                          </div>
                          <div className="text-center p-3 border rounded">
                            <div className="text-lg">98%</div>
                            <div className="text-xs text-gray-500">Éxito</div>
                          </div>
                        </div>
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