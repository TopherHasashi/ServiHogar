import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
// import { Input } from "../ui/input"
// import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
// import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
// import { Textarea } from "../ui/textarea"
// import ProfessionalScheduleManager from "./ProfessionalScheduleManager"
import ServiceBooking from "./ServiceBooking"
import ReviewModal from "./ReviewModal"
import { User, LogOut, Search, MapPin, Star, Phone, Calendar, Clock, CheckCircle, Briefcase, AlertCircle } from "lucide-react"

interface UserDashboardProps {
  user: any
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState("search")
  // const [searchQuery, setSearchQuery] = useState("")
  // const [selectedService, setSelectedService] = useState("")
  // const [selectedRegion, setSelectedRegion] = useState("")
  // const [selectedCommune, setSelectedCommune] = useState("")
  // const [priceRange, setPriceRange] = useState("")
  // const [rating, setRating] = useState("")
  // const [selectedGender, setSelectedGender] = useState("")
  // const [selectedAgeRange, setSelectedAgeRange] = useState("")
  // const [showProfessionalForm, setShowProfessionalForm] = useState(false)
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  // const [editingProfile, setEditingProfile] = useState(false)
  const [requestsTab, setRequestsTab] = useState("client")
  // const [editingServiceProfile, setEditingServiceProfile] = useState(false)
  // const [professionalTab, setProfessionalTab] = useState("profile")
  // const [tempServiceData, setTempServiceData] = useState<any>({})
  // const [tempUserData, setTempUserData] = useState<any>({})
  
  // Estado para modal de reseñas
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<any>(null)

  // Datos simulados de solicitudes de servicios como CLIENTE
  const [serviceRequests, setServiceRequests] = useState([
    {
      id: "REQ-001",
      professional: "Juan Carlos Pérez",
      service: "Gasfitería", 
      date: "2024-01-15",
      time: "14:00",
      status: "Completado",
      price: 35000,
      rating: 5,
      review: "Excelente trabajo, muy profesional y puntual."
    },
    {
      id: "REQ-002", 
      professional: "María Elena González",
      service: "Limpieza del Hogar",
      date: "2024-01-20",
      time: "09:00", 
      status: "Confirmado",
      price: 45000,
      rating: null,
      review: null
    },
    {
      id: "REQ-003",
      professional: "Carlos Rodríguez", 
      service: "Jardinería",
      date: "2024-01-18",
      time: "08:00",
      status: "Pendiente",
      price: 60000,
      rating: null,
      review: null
    }
  ])

  // Datos simulados de solicitudes COMO PROFESIONAL (servicios que le han reservado)
  const professionalBookings = [
    {
      id: "BOOK-001",
      client: "Ana María López",
      service: "Gasfitería",
      date: "2024-01-22",
      time: "10:00",
      status: "Pendiente",
      price: 25000,
      address: "Av. Providencia 1234, Providencia",
      phone: "+56 9 8765 4321",
      description: "Reparación de llave de cocina y revisión de cañerías."
    },
    {
      id: "BOOK-002",
      client: "Roberto Silva",
      service: "Gasfitería", 
      date: "2024-01-25",
      time: "15:00",
      status: "Confirmado",
      price: 28000,
      address: "Los Aromos 567, Ñuñoa",
      phone: "+56 9 1234 5678",
      description: "Instalación de calefont nuevo y conexión de gas."
    },
    {
      id: "BOOK-003",
      client: "Patricia Morales",
      service: "Gasfitería",
      date: "2024-01-19",
      time: "09:00",
      status: "Completado",
      price: 30000,
      address: "San Martín 890, Santiago Centro",
      phone: "+56 9 9876 5432",
      description: "Mantención general de sistema de agua caliente."
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado":
        return "bg-green-100 text-green-600"
      case "Confirmado":
        return "bg-blue-100 text-blue-600"
      case "Pendiente":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const handleMarkAsCompleted = (requestId: string) => {
    setServiceRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "Completado" }
          : req
      )
    )
  }

  // Funciones para manejo de reseñas
  const handleOpenReviewModal = (serviceRequest: any) => {
    setSelectedServiceForReview(serviceRequest)
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedServiceForReview(null)
  }

  const handleSubmitReview = (reviewData: any) => {
    // Actualizar la solicitud de servicio con la reseña
    setServiceRequests(prev => 
      prev.map(req => 
        req.id === reviewData.serviceRequestId 
          ? { 
              ...req, 
              rating: reviewData.averageRating,
              review: reviewData.comment,
              detailedRatings: reviewData.ratings
            }
          : req
      )
    )
  }

  if (showServiceBooking && selectedProfessional) {
    return (
      <ServiceBooking
        professional={selectedProfessional}
        onBack={() => {
          setShowServiceBooking(false)
          setSelectedProfessional(null)
        }}
        onBookingComplete={() => {
          setShowServiceBooking(false)
          setSelectedProfessional(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
  <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Bienvenido, {user.name}
                </h1>
                <p className="text-sm text-gray-500">Panel de Usuario</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
  <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar Servicios
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mis Solicitudes
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Mi Perfil
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {user.isProfessional ? "Panel Profesional" : "Ser Profesional"}
            </TabsTrigger>
          </TabsList>

          {/* Mis Solicitudes Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Mis Solicitudes
                </CardTitle>
                <CardDescription>
                  Gestiona tus servicios solicitados y trabajos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={requestsTab} onValueChange={setRequestsTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="client">Como Cliente</TabsTrigger>
                    <TabsTrigger value="professional">Como Profesional</TabsTrigger>
                  </TabsList>
                  
                  {/* Tab Como Cliente */}
                  <TabsContent value="client" className="space-y-4">
                    {serviceRequests.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No tienes solicitudes de servicios aún. ¡Busca un profesional para comenzar!
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {serviceRequests.map((request) => (
                          <Card key={request.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">{request.service}</CardTitle>
                                  <CardDescription>
                                    Profesional: {request.professional}
                                  </CardDescription>
                                </div>
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">{request.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">{request.time}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold">
                                  ${request.price.toLocaleString()}
                                </span>
                                
                                <div className="flex gap-2">
                                  {request.status === "Confirmado" && (
                                    <Button
                                      onClick={() => handleMarkAsCompleted(request.id)}
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Marcar Completado
                                    </Button>
                                  )}
                                  
                                  {/* Botón Calificar siempre visible pero condicionalmente habilitado */}
                                  <Button
                                    onClick={() => handleOpenReviewModal(request)}
                                    variant={request.status === "Completado" && !request.rating ? "default" : "secondary"}
                                    size="sm"
                                    className="flex items-center gap-1"
                                    disabled={request.status !== "Completado" || !!request.rating}
                                    title={
                                      request.status !== "Completado" 
                                        ? "Marca el servicio como completado para poder calificar"
                                        : request.rating 
                                        ? "Ya has calificado este servicio"
                                        : "Calificar servicio"
                                    }
                                  >
                                    <Star className={`w-4 h-4 ${
                                      request.rating 
                                        ? "fill-yellow-400 text-yellow-400" 
                                        : request.status === "Completado" && !request.rating
                                        ? "text-white"
                                        : "text-gray-400"
                                    }`} />
                                    {request.rating ? `${request.rating}` : "Calificar"}
                                  </Button>
                                </div>
                              </div>
                              
                              {request.review && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{request.review}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab Como Profesional */}
                  <TabsContent value="professional" className="space-y-4">
                    {professionalBookings.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No tienes reservas de servicios como profesional aún.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-4">
                        {professionalBookings.map((booking) => (
                          <Card key={booking.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">{booking.service}</CardTitle>
                                  <CardDescription>
                                    Cliente: {booking.client}
                                  </CardDescription>
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{booking.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{booking.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{booking.address}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{booking.phone}</span>
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-700">{booking.description}</p>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">
                                    ${booking.price.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would go here */}
          <TabsContent value="search">
            <div className="text-center py-8">
              <p>Sección de búsqueda de servicios</p>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="text-center py-8">
              <p>Sección de perfil de usuario</p>
            </div>
          </TabsContent>

          <TabsContent value="professional">
            <div className="text-center py-8">
              <p>Sección de panel profesional</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Reseñas */}
      {showReviewModal && selectedServiceForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview}
          serviceRequest={selectedServiceForReview}
        />
      )}
    </div>
  )
}