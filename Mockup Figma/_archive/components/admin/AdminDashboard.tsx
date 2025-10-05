import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { 
  Users, 
  Wrench, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  Phone
} from "lucide-react"
import ServiceRequests from "./ServiceRequests"
import ProfessionalManagement from "./ProfessionalManagement"
import ServiceManagement from "./ServiceManagement"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Servicios Hoy",
      value: "24",
      change: "+12%",
      icon: <Calendar className="w-4 h-4" />,
      color: "text-blue-600"
    },
    {
      title: "Ingresos del Mes",
      value: "$4.350.000",
      change: "+18%",
      icon: <DollarSign className="w-4 h-4" />,
      color: "text-green-600"
    },
    {
      title: "Profesionales Activos",
      value: "32",
      change: "+5%",
      icon: <Users className="w-4 h-4" />,
      color: "text-purple-600"
    },
    {
      title: "Calificación Promedio",
      value: "4.9",
      change: "+0.2",
      icon: <Star className="w-4 h-4" />,
      color: "text-yellow-600"
    }
  ]

  const recentRequests = [
    {
      id: "REQ-001",
      client: "María González",
      service: "Limpieza",
      status: "pending",
      time: "10:30 AM",
      address: "Providencia",
      priority: "normal"
    },
    {
      id: "REQ-002",
      client: "Carlos Ramírez",
      service: "Gasfitería",
      status: "assigned",
      time: "11:15 AM",
      address: "Las Condes",
      priority: "urgent"
    },
    {
      id: "REQ-003",
      client: "Ana Flores",
      service: "Jardinería",
      status: "in-progress",
      time: "2:00 PM",
      address: "Ñuñoa",
      priority: "normal"
    },
    {
      id: "REQ-004",
      client: "Roberto Silva",
      service: "Gasfitería",
      status: "completed",
      time: "9:45 AM",
      address: "La Florida",
      priority: "urgent"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "assigned":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Asignado</Badge>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona todos los aspectos de ServiHogar desde aquí</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="requests">Solicitudes</TabsTrigger>
            <TabsTrigger value="professionals">Profesionales</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">
                      {stat.title}
                    </CardTitle>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> vs mes anterior
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Solicitudes Recientes
                  </CardTitle>
                  <CardDescription>
                    Últimas solicitudes de servicio recibidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-900">{request.client}</span>
                            {getPriorityBadge(request.priority)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.service} • {request.address} • {request.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <Button size="sm" variant="ghost">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      Ver Todas las Solicitudes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Acciones Rápidas
                  </CardTitle>
                  <CardDescription>
                    Herramientas de gestión más utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Agregar Nuevo Profesional
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Programar Servicio de Emergencia
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver Reportes de Ingresos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Gestionar Quejas y Reclamos
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Pagos Pendientes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Daily Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Día</CardTitle>
                <CardDescription>
                  Vista general de las actividades de hoy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl text-blue-600 mb-2">8</div>
                    <div className="text-sm text-gray-600">Servicios Pendientes</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl text-green-600 mb-2">12</div>
                    <div className="text-sm text-gray-600">Servicios Completados</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl text-orange-600 mb-2">4</div>
                    <div className="text-sm text-gray-600">Servicios en Progreso</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <ServiceRequests />
          </TabsContent>

          <TabsContent value="professionals">
            <ProfessionalManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}