import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Separator } from "../ui/separator"
import { 
  User, 
  LogOut, 
  Search, 
  MapPin, 
  Star,
  Phone,
  Mail,
  Calendar,
  Heart,
  MessageSquare,
  CheckCircle,
  Wrench,
  Home,
  Scissors,
  Zap,
  Paintbrush,
  Car
} from "lucide-react"

interface ClientDashboardProps {
  client: any
  onLogout: () => void
}

export default function ClientDashboard({ client, onLogout }: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")

  // Servicios disponibles
  const services = [
    { id: "gasfiteria", name: "Gasfitería", icon: Wrench },
    { id: "limpieza", name: "Limpieza del Hogar", icon: Home },
    { id: "jardineria", name: "Jardinería", icon: Scissors },
    { id: "electricidad", name: "Electricidad", icon: Zap },
    { id: "pintura", name: "Pintura", icon: Paintbrush },
    { id: "carpinteria", name: "Carpintería", icon: Car }
  ]

  // Datos simulados de profesionales
  const professionals = [
    {
      id: "PROF-001",
      name: "Juan Carlos Pérez",
      service: "Gasfitería",
      rating: 4.8,
      reviews: 124,
      location: "Santiago, RM",
      price: "$15.000 - $25.000",
      experience: "5 años",
      phone: "+56 9 8888 1111",
      email: "juan.perez@email.com",
      description: "Gasfiter profesional especializado en instalaciones y reparaciones de cañerías, grifería y calefont.",
      verified: true,
      avatar: "/api/placeholder/150/150"
    },
    {
      id: "PROF-002", 
      name: "María Elena González",
      service: "Limpieza del Hogar",
      rating: 4.9,
      reviews: 98,
      location: "Las Condes, RM",
      price: "$12.000 - $18.000",
      experience: "8 años",
      phone: "+56 9 7777 2222",
      email: "maria.gonzalez@email.com",
      description: "Especialista en limpieza profunda, mantenimiento de hogar y organización de espacios.",
      verified: true,
      avatar: "/api/placeholder/150/150"
    },
    {
      id: "PROF-003",
      name: "Carlos Rodríguez",
      service: "Jardinería",
      rating: 4.7,
      reviews: 156,
      location: "Providencia, RM",
      price: "$20.000 - $35.000",
      experience: "6 años",
      phone: "+56 9 6666 3333",
      email: "carlos.rodriguez@email.com",
      description: "Jardinero profesional con experiencia en diseño, mantención y podas de jardines.",
      verified: true,
      avatar: "/api/placeholder/150/150"
    },
    {
      id: "PROF-004",
      name: "Ana Sofía Martínez",
      service: "Electricidad",
      rating: 4.6,
      reviews: 87,
      location: "Ñuñoa, RM",
      price: "$18.000 - $30.000",
      experience: "4 años",
      phone: "+56 9 5555 4444",
      email: "ana.martinez@email.com",
      description: "Técnico electricista certificado en instalaciones eléctricas residenciales y comerciales.",
      verified: true,
      avatar: "/api/placeholder/150/150"
    },
    {
      id: "PROF-005",
      name: "Diego Herrera",
      service: "Pintura",
      rating: 4.8,
      reviews: 203,
      location: "Maipú, RM",
      price: "$16.000 - $28.000",
      experience: "7 años",
      phone: "+56 9 4444 5555",
      email: "diego.herrera@email.com",
      description: "Pintor profesional especializado en interiores, exteriores y trabajos decorativos.",
      verified: true,
      avatar: "/api/placeholder/150/150"
    }
  ]

  // Solicitudes de servicio del cliente
  const serviceRequests = [
    {
      id: "REQ-001",
      service: "Gasfitería",
      professional: "Juan Carlos Pérez",
      date: "2024-01-15",
      time: "14:00",
      status: "Completado",
      price: "$18.000",
      rating: 5
    },
    {
      id: "REQ-002",
      service: "Limpieza del Hogar",
      professional: "María Elena González",
      date: "2024-01-20",
      time: "10:00",
      status: "Confirmado",
      price: "$15.000",
      rating: null
    },
    {
      id: "REQ-003",
      service: "Jardinería",
      professional: "Carlos Rodríguez",
      date: "2024-01-10",
      time: "09:00",
      status: "Completado",
      price: "$25.000",
      rating: 4
    }
  ]

  // Filtrar profesionales
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prof.service.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesService = !selectedService || selectedService === "all" || prof.service === selectedService
    return matchesSearch && matchesService
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado": return "bg-green-100 text-green-800"
      case "Confirmado": return "bg-blue-100 text-blue-800"
      case "Pendiente": return "bg-yellow-100 text-yellow-800"
      case "Cancelado": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl">Portal de Cliente</h1>
              <Badge variant="outline">ServiHogar</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/32/32" />
                  <AvatarFallback>{client.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm">{client.name}</p>
                  <p className="text-xs text-gray-500">{client.district}</p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Buscar Profesionales</TabsTrigger>
            <TabsTrigger value="requests">Mis Solicitudes</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
          </TabsList>

          {/* Buscar Profesionales */}
          <TabsContent value="search" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Buscar Profesionales
                </CardTitle>
                <CardDescription>
                  Encuentra el profesional perfecto para tu hogar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Nombre o servicio..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service">Servicio</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los servicios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los servicios</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rating">Calificación</Label>
                    <Select value={rating} onValueChange={setRating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier rating</SelectItem>
                        <SelectItem value="5">5 estrellas</SelectItem>
                        <SelectItem value="4">4+ estrellas</SelectItem>
                        <SelectItem value="3">3+ estrellas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Cualquier precio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier precio</SelectItem>
                        <SelectItem value="low">$10.000 - $20.000</SelectItem>
                        <SelectItem value="medium">$20.000 - $30.000</SelectItem>
                        <SelectItem value="high">$30.000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Profesionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map((professional) => {
                const ServiceIcon = services.find(s => s.name === professional.service)?.icon || Wrench
                
                return (
                  <Card key={professional.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={professional.avatar} />
                          <AvatarFallback>{professional.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg">{professional.name}</h3>
                            {professional.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <ServiceIcon className="w-4 h-4" />
                            <span>{professional.service}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(professional.rating)}
                            <span className="text-sm text-gray-600 ml-1">
                              {professional.rating} ({professional.reviews} reseñas)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{professional.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{professional.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Precio estimado</p>
                          <p className="text-lg">{professional.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Experiencia</p>
                          <p className="text-lg">{professional.experience}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => {
                            // Aquí se podría redirigir al formulario de solicitud de servicio
                            // con el profesional pre-seleccionado
                            alert(`Contactando a ${professional.name} para ${professional.service}`)
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Contratar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => alert('Agregado a favoritos')}
                          title="Agregar a favoritos"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => alert(`Enviando mensaje a ${professional.name}`)}
                          title="Enviar mensaje"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Mis Solicitudes */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Mis Solicitudes de Servicio
                </CardTitle>
                <CardDescription>
                  Historial y estado de tus servicios contratados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg">{request.service}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <span className="text-lg">{request.price}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Profesional</p>
                          <p className="text-base">{request.professional}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fecha y Hora</p>
                          <p className="text-base">{request.date} - {request.time}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Calificación</p>
                          {request.rating ? (
                            <div className="flex items-center gap-1">
                              {renderStars(request.rating)}
                            </div>
                          ) : (
                            <span className="text-gray-400">Pendiente</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        {request.status === "Confirmado" && (
                          <>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>
                            <Button variant="outline" size="sm">
                              Reagendar
                            </Button>
                          </>
                        )}
                        {request.status === "Completado" && !request.rating && (
                          <Button size="sm">
                            <Star className="w-4 h-4 mr-2" />
                            Calificar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favoritos */}
          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Profesionales Favoritos
                </CardTitle>
                <CardDescription>
                  Guarda tus profesionales preferidos para contrataciones futuras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg mb-2">No tienes favoritos aún</h3>
                  <p className="text-gray-600 mb-4">
                    Marca como favoritos a los profesionales que más te gusten
                  </p>
                  <Button onClick={() => setActiveTab("search")}>
                    Buscar Profesionales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mi Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Mi Perfil
                </CardTitle>
                <CardDescription>
                  Información personal y configuración de cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/api/placeholder/80/80" />
                    <AvatarFallback className="text-lg">{client.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl">{client.name}</h3>
                    <p className="text-gray-600">{client.email}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Cambiar foto
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg">Información Personal</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p>{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p>{client.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Ubicación</p>
                          <p>{client.district}, {client.region}</p>
                        </div>
                      </div>
                      
                      {client.address && (
                        <div className="flex items-center gap-3">
                          <Home className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Dirección</p>
                            <p>{client.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg">Estadísticas</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600">Servicios Contratados</p>
                            <p className="text-2xl text-blue-800">3</p>
                          </div>
                          <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600">Servicios Completados</p>
                            <p className="text-2xl text-green-800">2</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600">Calificación Promedio</p>
                            <p className="text-2xl text-purple-800">4.5/5</p>
                          </div>
                          <Star className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button>Editar Perfil</Button>
                  <Button variant="outline">Cambiar Contraseña</Button>
                  <Button variant="outline">Configuración</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}