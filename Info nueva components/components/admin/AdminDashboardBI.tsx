import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Alert, AlertDescription } from "../ui/alert"
import BankAccountManager from "../BankAccountManager"
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle, 
  AlertCircle,
  Star,
  BarChart3,
  LogOut,
  Eye,
  Clock,
  UserCheck,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from "lucide-react"

interface AdminDashboardBIProps {
  onLogout: () => void
}

export default function AdminDashboardBI({ onLogout }: AdminDashboardBIProps) {
  const [dateRange, setDateRange] = useState("30")

  // KPIs Principales
  const kpiData = {
    totalRevenue: 15800000,
    monthlyGrowth: 18.5,
    activeUsers: 2847,
    userGrowth: 12.3,
    activeProfessionals: 328,
    professionalGrowth: 8.7,
    avgRating: 4.87,
    ratingChange: 0.15,
    conversionRate: 67.5,
    retentionRate: 82.3,
    avgResponseTime: 2.4,
    completionRate: 94.8
  }

  // Métricas de profesionales (solo para estadísticas)
  const professionalMetrics = {
    total: 328,
    active: 287,
    topPerformers: 45
  }

  // Distribución de servicios
  const serviceDistribution = [
    { name: 'Gasfitería', value: 1245, revenue: 6850000, avgPrice: 55000 },
    { name: 'Limpieza', value: 1680, revenue: 5880000, avgPrice: 35000 },
    { name: 'Jardinería', value: 985, revenue: 3070000, avgPrice: 31000 }
  ]

  // Solicitudes problemáticas
  const problematicRequests = [
    { id: 'S001', client: 'Ana Torres', professional: 'Juan Pérez', issue: 'Cancelación tardía', severity: 'high' },
    { id: 'S002', client: 'Roberto Silva', professional: 'Carmen Rojas', issue: 'Disputa de precio', severity: 'medium' },
    { id: 'S003', client: 'Laura Díaz', professional: 'Miguel Vargas', issue: 'Servicio incompleto', severity: 'high' }
  ]

  // Configuración del sistema
  const [systemConfig, setSystemConfig] = useState({
    platformCommission: 15,
    minServicePrice: 10000,
    maxServicePrice: 500000,
    autoApproveVerified: true,
    requireDocuments: true,
    maintenanceMode: false
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getChangeIcon = (value: number) => {
    return value >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />
  }

  const getChangeColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="font-bold text-xl">Panel de Administración</h1>
                <p className="text-sm text-gray-500">Business Intelligence Dashboard</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen Ejecutivo</TabsTrigger>
            <TabsTrigger value="operations">Centro de Operaciones</TabsTrigger>
            <TabsTrigger value="banking">Cuentas Bancarias</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          {/* TAB: RESUMEN EJECUTIVO */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Ingresos del Mes</CardTitle>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue)}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.monthlyGrowth)}`}>
                    {getChangeIcon(kpiData.monthlyGrowth)}
                    <span>{kpiData.monthlyGrowth}% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Usuarios Activos</CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.activeUsers.toLocaleString()}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.userGrowth)}`}>
                    {getChangeIcon(kpiData.userGrowth)}
                    <span>{kpiData.userGrowth}% crecimiento</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Profesionales Activos</CardTitle>
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.active}</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.professionalGrowth)}`}>
                    {getChangeIcon(kpiData.professionalGrowth)}
                    <span>{kpiData.professionalGrowth}% crecimiento</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">Calificación Promedio</CardTitle>
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avgRating} ⭐</div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getChangeColor(kpiData.ratingChange)}`}>
                    {getChangeIcon(kpiData.ratingChange)}
                    <span>+{kpiData.ratingChange} puntos</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Operacionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tasa de Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.conversionRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Visitantes que reservan</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Retención</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.retentionRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Usuarios recurrentes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tiempo de Respuesta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.avgResponseTime}h</div>
                  <p className="text-sm text-gray-500 mt-1">Promedio profesionales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Tasa de Completación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpiData.completionRate}%</div>
                  <p className="text-sm text-gray-500 mt-1">Servicios finalizados</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribución de Servicios */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Servicios</CardTitle>
                <CardDescription>Por tipo de servicio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceDistribution.map((service, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B']
                    const total = serviceDistribution.reduce((acc, s) => acc + s.value, 0)
                    const percentage = (service.value / total * 100).toFixed(1)
                    
                    return (
                      <div key={service.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">{service.value} servicios ({percentage}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{formatCurrency(service.revenue)}</span>
                          <span>Promedio: {formatCurrency(service.avgPrice)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: colors[index]
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance de Profesionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Profesionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.total}</div>
                  <p className="text-sm text-gray-500 mt-1">{professionalMetrics.active} activos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{professionalMetrics.topPerformers}</div>
                  <p className="text-sm text-gray-500 mt-1">Calificación 4.8+</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Servicios Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.3</div>
                  <p className="text-sm text-gray-500 mt-1">Por profesional/mes</p>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Insights Principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Crecimiento Sostenido</h4>
                    <p className="text-sm text-gray-600">Ingresos creciendo +18.5% mensual. La plataforma está en expansión acelerada.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Tiempo de Respuesta Óptimo</h4>
                    <p className="text-sm text-gray-600">2.4h promedio de respuesta. Los profesionales están siendo ágiles con las solicitudes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Alta Satisfacción de Clientes</h4>
                    <p className="text-sm text-gray-600">Calificación de 4.87/5.0 indica excelente calidad de servicio en toda la plataforma.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Red de Profesionales en Crecimiento</h4>
                    <p className="text-sm text-gray-600">{professionalMetrics.total} profesionales activos generando {formatCurrency(kpiData.totalRevenue)} mensuales.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* TAB: OPERACIONES */}
          <TabsContent value="operations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Centro de Operaciones</h2>
              <p className="text-gray-600">Monitoreo de solicitudes en tiempo real</p>
            </div>

            {/* Alertas */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  Solicitudes que Requieren Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {problematicRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={request.severity === 'high' ? 'destructive' : 'default'}>
                            {request.severity === 'high' ? 'Alta Prioridad' : 'Media Prioridad'}
                          </Badge>
                          <span className="font-medium">{request.issue}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Cliente: {request.client} | Profesional: {request.professional}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                        <Button size="sm">Resolver</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas Operacionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Solicitudes Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">127</div>
                  <p className="text-sm text-gray-600 mt-1">En proceso</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tiempo Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2.4h</div>
                  <p className="text-sm text-gray-600 mt-1">De respuesta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tasa de Éxito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">94.8%</div>
                  <p className="text-sm text-gray-600 mt-1">Completados</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: CUENTAS BANCARIAS */}
          <TabsContent value="banking" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Cuentas Bancarias de ServiHogar</h2>
              <p className="text-gray-600">Gestión de cuentas para retención de pagos</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Estas son las cuentas bancarias corporativas donde se retendrá el dinero de los clientes 
                antes de procesarse los pagos a los profesionales. La cuenta principal se usará por defecto 
                para todas las transacciones.
              </AlertDescription>
            </Alert>

            <BankAccountManager
              title="Cuentas Corporativas ServiHogar"
              description="Administra las cuentas bancarias para retención y procesamiento de pagos de la plataforma"
              maxAccounts={3}
              onAccountsChange={(accounts) => {
                console.log("Cuentas bancarias ServiHogar actualizadas:", accounts)
                // Aquí puedes guardar las cuentas en la base de datos
              }}
            />

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Información sobre Cuentas Corporativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Cuenta Principal:</strong> Todos los pagos de clientes se procesarán inicialmente a esta cuenta.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Cuentas de Respaldo:</strong> Se utilizarán automáticamente en caso de que la cuenta principal 
                    tenga problemas (cupo lleno, cuenta bloqueada, error de transacción).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Seguridad:</strong> Los números de cuenta se muestran parcialmente ocultos por seguridad. 
                    Solo personal autorizado puede ver la información completa.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Importante:</strong> Cualquier cambio en las cuentas bancarias debe ser reportado al 
                    equipo de finanzas y validado antes de procesar nuevas transacciones.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Transacciones</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Total Procesado</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(15800000)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Transacciones Exitosas</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">1,847</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600">Comisión Generada</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(2370000)}</p>
                    <p className="text-xs text-gray-500 mt-1">15% del total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: CONFIGURACIÓN */}
          <TabsContent value="config" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
              <p className="text-gray-600">Parámetros de la plataforma</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Parámetros Comerciales</CardTitle>
                <CardDescription>Comisiones y precios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Comisión de Plataforma (%)</Label>
                    <Input 
                      type="number" 
                      value={systemConfig.platformCommission}
                      onChange={(e) => setSystemConfig({...systemConfig, platformCommission: Number(e.target.value)})}
                    />
                    <p className="text-xs text-gray-500">Porcentaje por cada servicio</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Mínimo (CLP)</Label>
                    <Input 
                      type="number" 
                      value={systemConfig.minServicePrice}
                      onChange={(e) => setSystemConfig({...systemConfig, minServicePrice: Number(e.target.value)})}
                    />
                    <p className="text-xs text-gray-500">Precio mínimo permitido</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Precio Máximo (CLP)</Label>
                    <Input 
                      type="number" 
                      value={systemConfig.maxServicePrice}
                      onChange={(e) => setSystemConfig({...systemConfig, maxServicePrice: Number(e.target.value)})}
                    />
                    <p className="text-xs text-gray-500">Precio máximo permitido</p>
                  </div>
                </div>

                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verificación de Profesionales</CardTitle>
                <CardDescription>Parámetros de aprobación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Aprobación Automática</h4>
                    <p className="text-sm text-gray-600">Para profesionales previamente verificados</p>
                  </div>
                  <Switch 
                    checked={systemConfig.autoApproveVerified}
                    onCheckedChange={(checked) => setSystemConfig({...systemConfig, autoApproveVerified: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Documentación Obligatoria</h4>
                    <p className="text-sm text-gray-600">Certificado de antecedentes requerido</p>
                  </div>
                  <Switch 
                    checked={systemConfig.requireDocuments}
                    onCheckedChange={(checked) => setSystemConfig({...systemConfig, requireDocuments: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <AlertCircle className="w-5 h-5" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription>Acciones críticas del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Modo Mantenimiento</h4>
                    <p className="text-sm text-gray-600">Deshabilita acceso público temporalmente</p>
                  </div>
                  <Switch 
                    checked={systemConfig.maintenanceMode}
                    onCheckedChange={(checked) => setSystemConfig({...systemConfig, maintenanceMode: checked})}
                  />
                </div>

                {systemConfig.maintenanceMode && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Modo mantenimiento <strong>ACTIVADO</strong>. Usuarios no pueden acceder.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
