import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Wrench, Sparkles, Scissors, Plus, Edit, Trash2, TrendingUp, DollarSign } from "lucide-react"

const services = [
  {
    id: "SRV-001",
    name: "Reparación de tuberías",
    category: "Gasfitería",
    basePrice: 25000,
    description: "Reparación de tuberías rotas, fugas y conexiones defectuosas",
    duration: "1-2 horas",
    isActive: true,
    popularity: 85,
    totalBookings: 156,
    avgRating: 4.8,
    materials: ["Tubos PVC", "Soldadura", "Accesorios"]
  },
  {
    id: "SRV-002",
    name: "Limpieza profunda",
    category: "Limpieza",
    basePrice: 35000,
    description: "Limpieza completa de hogar incluyendo cocina, baños y habitaciones",
    duration: "3-4 horas",
    isActive: true,
    popularity: 92,
    totalBookings: 203,
    avgRating: 4.9,
    materials: ["Productos de limpieza", "Aspiradora", "Trapos especializados"]
  },
  {
    id: "SRV-003",
    name: "Poda de jardín",
    category: "Jardinería",
    basePrice: 30000,
    description: "Poda de plantas, árboles y mantenimiento general de jardín",
    duration: "2-3 horas",
    isActive: true,
    popularity: 78,
    totalBookings: 134,
    avgRating: 4.7,
    materials: ["Tijeras de podar", "Fertilizantes", "Herramientas de jardín"]
  },
  {
    id: "SRV-004",
    name: "Instalación de ducha",
    category: "Gasfitería",
    basePrice: 45000,
    description: "Instalación completa de ducha eléctrica incluyendo conexiones",
    duration: "2-3 horas",
    isActive: true,
    popularity: 65,
    totalBookings: 89,
    avgRating: 4.6,
    materials: ["Ducha eléctrica", "Cables", "Accesorios de instalación"]
  },
  {
    id: "SRV-005",
    name: "Limpieza post-construcción",
    category: "Limpieza",
    basePrice: 60000,
    description: "Limpieza especializada después de trabajos de construcción o remodelación",
    duration: "4-6 horas",
    isActive: false,
    popularity: 45,
    totalBookings: 23,
    avgRating: 4.4,
    materials: ["Productos industriales", "Equipos especializados", "Mascarillas"]
  }
]

const serviceCategories = [
  {
    name: "Gasfitería",
    icon: <Wrench className="w-6 h-6" />,
    color: "bg-blue-100 text-blue-800",
    totalServices: 12,
    avgPrice: "$35.000"
  },
  {
    name: "Limpieza",
    icon: <Sparkles className="w-6 h-6" />,
    color: "bg-purple-100 text-purple-800",
    totalServices: 8,
    avgPrice: "$28.000"
  },
  {
    name: "Jardinería",
    icon: <Scissors className="w-6 h-6" />,
    color: "bg-green-100 text-green-800",
    totalServices: 6,
    avgPrice: "S/. 110"
  }
]

export default function ServiceManagement() {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Gasfitería":
        return "bg-blue-100 text-blue-800"
      case "Limpieza":
        return "bg-purple-100 text-purple-800"
      case "Jardinería":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 80) return "text-green-600"
    if (popularity >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestión de Servicios</CardTitle>
              <CardDescription>
                Administra el catálogo de servicios, precios y disponibilidad
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo servicio para el catálogo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del Servicio</Label>
                      <Input placeholder="Ej: Instalación de lavatorio" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                          <SelectItem value="limpieza">Limpieza</SelectItem>
                          <SelectItem value="jardineria">Jardinería</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio Base (S/.)</Label>
                      <Input type="number" placeholder="150" />
                    </div>
                    <div className="space-y-2">
                      <Label>Duración Estimada</Label>
                      <Input placeholder="2-3 horas" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea 
                      placeholder="Describe detalladamente el servicio..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Materiales Necesarios</Label>
                    <Textarea 
                      placeholder="Lista los materiales principales (uno por línea)"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="active" />
                    <Label htmlFor="active">Servicio activo</Label>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">Crear Servicio</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Service Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {serviceCategories.map((category, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  {category.icon}
                </div>
                <Badge variant="secondary" className={category.color}>
                  {category.totalServices} servicios
                </Badge>
              </div>
              <h3 className="text-lg mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600 mb-2">Precio promedio: {category.avgPrice}</p>
              <Button variant="outline" size="sm" className="w-full">
                Ver Servicios
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Servicios</p>
                <p className="text-2xl">26</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Servicios Activos</p>
                <p className="text-2xl text-green-600">23</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl">S/. 115</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Más Popular</p>
                <p className="text-lg">Limpieza</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Servicios</CardTitle>
          <CardDescription>
            Gestiona precios, disponibilidad y detalles de todos los servicios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio Base</TableHead>
                <TableHead>Popularidad</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.duration}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">S/. {service.basePrice}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${service.popularity}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm ${getPopularityColor(service.popularity)}`}>
                        {service.popularity}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{service.avgRating}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                  </TableCell>
                  <TableCell>{service.totalBookings}</TableCell>
                  <TableCell>
                    {service.isActive ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Servicio - {service.name}</DialogTitle>
                            <DialogDescription>
                              Modifica los detalles del servicio
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nombre del Servicio</Label>
                                <Input defaultValue={service.name} />
                              </div>
                              <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select defaultValue={service.category.toLowerCase()}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                                    <SelectItem value="limpieza">Limpieza</SelectItem>
                                    <SelectItem value="jardineria">Jardinería</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Precio Base (S/.)</Label>
                                <Input type="number" defaultValue={service.basePrice} />
                              </div>
                              <div className="space-y-2">
                                <Label>Duración Estimada</Label>
                                <Input defaultValue={service.duration} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Descripción</Label>
                              <Textarea 
                                defaultValue={service.description}
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Materiales Necesarios</Label>
                              <Textarea 
                                defaultValue={service.materials.join('\n')}
                                rows={3}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="active" defaultChecked={service.isActive} />
                              <Label htmlFor="active">Servicio activo</Label>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                              <Label>Estadísticas del Servicio</Label>
                              <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="text-center">
                                  <div className="text-lg">{service.totalBookings}</div>
                                  <div className="text-xs text-gray-500">Total reservas</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg">{service.avgRating}★</div>
                                  <div className="text-xs text-gray-500">Calificación</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg">{service.popularity}%</div>
                                  <div className="text-xs text-gray-500">Popularidad</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-6">
                            <Button className="flex-1">Guardar Cambios</Button>
                            <Button variant="outline">Cancelar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}