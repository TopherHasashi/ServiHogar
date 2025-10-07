import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { 
  Users, 
  User,
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Star,
  Settings,
  BarChart3,
  UserCog,
  FileText,
  Bell,
  Shield,
  LogOut,
  Edit,
  Plus,
  Download,
  Upload,
  Eye,
  Filter,
  Search
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AdminDashboardEnhancedProps {
  onLogout: () => void
}

export default function AdminDashboardEnhanced({ onLogout }: AdminDashboardEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState("")
  // Removed unused selected filter state

  // Datos de ejemplo para gráficos
  const revenueData = [
    { month: 'Ene', revenue: 3200000, services: 180 },
    { month: 'Feb', revenue: 3800000, services: 220 },
    { month: 'Mar', revenue: 4100000, services: 240 },
    { month: 'Abr', revenue: 3900000, services: 210 },
    { month: 'May', revenue: 4350000, services: 260 },
    { month: 'Jun', revenue: 4800000, services: 290 }
  ]

  const serviceTypeData = [
    { name: 'Gasfitería', value: 45, color: '#3B82F6' },
    { name: 'Limpieza', value: 35, color: '#10B981' },
    { name: 'Jardinería', value: 20, color: '#F59E0B' }
  ]

  const regionData = [
    { region: 'Santiago', services: 120, revenue: 1800000 },
    { region: 'Valparaíso', services: 85, revenue: 1200000 },
    { region: 'Concepción', services: 65, revenue: 950000 },
    { region: 'La Serena', services: 45, revenue: 650000 },
    { region: 'Temuco', services: 35, revenue: 500000 }
  ]

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

  const professionals = [
    {
      id: 1,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@email.com",
      service: "Gasfitería",
      rating: 4.9,
      completed: 127,
      status: "active",
      revenue: 850000
    },
    {
      id: 2,
      name: "María Fernández",
      email: "maria.fernandez@email.com",
      service: "Limpieza",
      rating: 4.8,
      completed: 93,
      status: "active",
      revenue: 620000
    },
    {
      id: 3,
      name: "Roberto Silva",
      email: "roberto.silva@email.com",
      service: "Jardinería",
      rating: 4.7,
      completed: 65,
      status: "inactive",
      revenue: 480000
    }
  ]

  const platformSettings = [
    { id: "maintenance", label: "Modo Mantenimiento", description: "Activar cuando se requieran actualizaciones", enabled: false },
    { id: "notifications", label: "Notificaciones Push", description: "Enviar notificaciones a usuarios", enabled: true },
    { id: "autoAssign", label: "Asignación Automática", description: "Asignar servicios automáticamente", enabled: true },
    { id: "geoLocation", label: "Geolocalización", description: "Usar ubicación para matching", enabled: true },
    { id: "reviews", label: "Sistema de Reseñas", description: "Permitir calificaciones y comentarios", enabled: true }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl text-gray-900 mb-2">Panel de Administración</h1>
              <p className="text-gray-600 text-sm sm:text-base">Control total de la plataforma ServiHogar</p>
            </div>
            <Button onClick={onLogout} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Panel</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <UserCog className="w-4 h-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span>Contenido</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificaciones</span>
              <span className="sm:hidden">Notif</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">{stat.title}</CardTitle>
                    <div className={stat.color}>{stat.icon}</div>
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos Mensuales</CardTitle>
                  <CardDescription>Evolución de ingresos y servicios</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : value,
                        name === 'revenue' ? 'Ingresos' : 'Servicios'
                      ]} />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Service Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Servicios</CardTitle>
                  <CardDescription>Porcentaje por tipo de servicio</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center space-x-4 mt-4">
                    {serviceTypeData.map((entry, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regional Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Región</CardTitle>
                <CardDescription>Servicios e ingresos por ubicación</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="services" fill="#3B82F6" name="Servicios" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl">Gestión de Usuarios</h3>
                <p className="text-gray-600 text-sm sm:text-base">Administra clientes y profesionales</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar usuarios por nombre, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Professionals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Profesionales Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {professionals.map((pro) => (
                    <div key={pro.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{pro.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{pro.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{pro.service}</Badge>
                            <span className="text-xs text-gray-500">
                              ⭐ {pro.rating} • {pro.completed} servicios
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Badge variant={pro.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                            {pro.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <span className="text-sm text-green-600 font-medium">${pro.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 w-full sm:w-auto">
                          <Button size="sm" variant="ghost" className="flex-1 sm:flex-initial">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="flex-1 sm:flex-initial">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h3 className="text-xl mb-2">Analytics Avanzados</h3>
              <p className="text-gray-600">Métricas detalladas de rendimiento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-green-600 mb-2">68%</div>
                  <p className="text-sm text-gray-600">Tasa de conversión de visitas a servicios</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Retención</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-blue-600 mb-2">85%</div>
                  <p className="text-sm text-gray-600">Clientes que repiten servicios</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiempo Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl text-purple-600 mb-2">2.3h</div>
                  <p className="text-sm text-gray-600">Duración promedio de servicios</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl">Gestión de Contenido</h3>
                <p className="text-gray-600 text-sm sm:text-base">Edita textos, imágenes y configuraciones de la web</p>
              </div>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contenido
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Página Principal</CardTitle>
                  <CardDescription>Editar textos del landing page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Editar Título Principal</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Modificar Descripción</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Cambiar Imágenes</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Servicios</CardTitle>
                  <CardDescription>Gestionar catálogo de servicios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Agregar Servicio</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Editar Precios</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm sm:text-base">
                    <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Configurar Categorías</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h3 className="text-xl mb-2">Centro de Notificaciones</h3>
              <p className="text-gray-600">Envía comunicaciones a usuarios y profesionales</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Notificación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notification-title">Título</Label>
                    <Input id="notification-title" placeholder="Título de la notificación" />
                  </div>
                  <div>
                    <Label htmlFor="notification-message">Mensaje</Label>
                    <Input id="notification-message" placeholder="Contenido del mensaje" />
                  </div>
                  <Button className="w-full text-sm sm:text-base">Enviar a Todos los Usuarios</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de Notificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">Nueva actualización disponible</h4>
                          <p className="text-xs text-gray-500">Enviado hace 2 horas</p>
                        </div>
                        <Badge variant="outline">Enviado</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium">Mantenimiento programado</h4>
                          <p className="text-xs text-gray-500">Enviado ayer</p>
                        </div>
                        <Badge variant="outline">Enviado</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h3 className="text-xl mb-2">Configuración de la Plataforma</h3>
              <p className="text-gray-600">Ajustes generales y parámetros del sistema</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuraciones del Sistema</CardTitle>
                <CardDescription>Activa o desactiva funcionalidades de la plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {platformSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{setting.label}</h4>
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    </div>
                    <Switch checked={setting.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Respaldo de Datos</CardTitle>
                  <CardDescription>Gestiona copias de seguridad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Descargar Respaldo</span>
                  </Button>
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Restaurar desde Respaldo</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seguridad</CardTitle>
                  <CardDescription>Configuraciones de seguridad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Cambiar Contraseña Admin</span>
                  </Button>
                  <Button variant="outline" className="w-full text-sm sm:text-base">
                    <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Ver Logs de Acceso</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}