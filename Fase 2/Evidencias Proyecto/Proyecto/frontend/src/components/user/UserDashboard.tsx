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
import { Alert, AlertDescription } from "../ui/alert"
import { Textarea } from "../ui/textarea"
import ProfessionalScheduleManager from "./ProfessionalScheduleManager"
import ServiceBooking from "./ServiceBooking"
import ReviewModal from "./ReviewModal"
import { 
  User, 
  LogOut, 
  Search, 
  MapPin, 
  Star,
  Phone,
  Mail,
  Calendar,
  Filter,
  MessageSquare,
  CheckCircle,
  Wrench,
  Home,
  Scissors,
  Briefcase,
  AlertCircle,
  Settings,
  Edit,
  X,
  Save
} from "lucide-react"

interface UserDashboardProps {
  user: any
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAgeRange, setSelectedAgeRange] = useState("")
  // const [showProfessionalForm, setShowProfessionalForm] = useState(false)
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [requestsTab, setRequestsTab] = useState("client")
  const [editingServiceProfile, setEditingServiceProfile] = useState(false)
  const [professionalTab, setProfessionalTab] = useState("profile")
  const [tempServiceData, setTempServiceData] = useState<any>({})
  const [tempUserData, setTempUserData] = useState<any>({})
  
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

  // Estado para el formulario de profesional
  // const [professionalForm, setProfessionalForm] = useState({
  //   specialty: "",
  //   experience: "",
  //   description: "",
  //   priceRange: "",
  //   durationType: "fixed",
  //   fixedDuration: 60,
  //   minDuration: 60,
  //   maxDuration: 240,
  //   pricePerHour: 15000,
  //   certifications: [],
  //   documents: []
  // })

  // Simular datos del usuario como profesional si ya es profesional
  const [userProfessionalData, setUserProfessionalData] = useState(
    user.isProfessional ? {
      specialty: "Gasfitería",
      experience: "3",
      description: "Profesional experimentado en instalaciones y reparaciones del hogar.",
      durationType: "range",
      fixedDuration: 60,
      minDuration: 120,
      maxDuration: 480,
      pricePerHour: 20000,
      priceDisplay: "Desde $20.000",
      verified: true,
      rating: 4.5,
      completedJobs: 45
    } : null
  )

  // Servicios disponibles
  const services = [
    { id: "gasfiteria", name: "Gasfitería", icon: Wrench },
    { id: "limpieza", name: "Limpieza del Hogar", icon: Home },
    { id: "jardineria", name: "Jardinería", icon: Scissors }
  ]

  const specialties = [
    "Gasfitería",
    "Limpieza del Hogar", 
    "Jardinería"
  ]

  // Regiones de Chile con comunas principales
  const regionsAndCommunes = {
    "Región Metropolitana": ["Santiago", "Las Condes", "Providencia", "Ñuñoa", "La Reina", "Vitacura", "San Miguel", "Maipú", "Puente Alto", "San Bernardo"],
    "Región de Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Concón", "San Antonio"],
    "Región del Biobío": ["Concepción", "Talcahuano", "Chillán", "Los Ángeles", "Coronel"],
    "Región de la Araucanía": ["Temuco", "Villarrica", "Pucón", "Angol"],
    "Región de Los Lagos": ["Puerto Montt", "Osorno", "Valdivia", "Castro"],
    "Región de Antofagasta": ["Antofagasta", "Calama", "Tocopilla"],
    "Región de Atacama": ["Copiapó", "Vallenar"],
    "Región de Coquimbo": ["La Serena", "Coquimbo", "Ovalle"],
    "Región del Libertador": ["Rancagua", "San Fernando", "Rengo"],
    "Región del Maule": ["Talca", "Curicó", "Linares"],
    "Región de Aysén": ["Coyhaique", "Puerto Aysén"],
    "Región de Magallanes": ["Punta Arenas", "Puerto Natales"],
    "Región de Arica y Parinacota": ["Arica", "Putre"],
    "Región de Tarapacá": ["Iquique", "Alto Hospicio"],
    "Región de Ñuble": ["Chillán", "San Carlos"]
  }

  // Obtener comunas basadas en la región seleccionada
  const getAvailableCommunes = () => {
    if (!selectedRegion || selectedRegion === "all") return []
    return regionsAndCommunes[selectedRegion as keyof typeof regionsAndCommunes] || []
  }

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
    setUserProfessionalData(prev => ({
      ...prev!,
      ...tempServiceData
    }))
    setEditingServiceProfile(false)
    setTempServiceData({})
  }

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingServiceProfile(false)
    setTempServiceData({})
  }

  // Funciones para editar perfil de usuario
  const handleStartEditUserProfile = () => {
    setTempUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      region: user.region || "",
      commune: user.commune || ""
    })
    setEditingProfile(true)
  }

  const handleUpdateUserData = () => {
    // En una app real esto se enviaría al backend y vendría actualizado por props/context
    // Aquí solo cerramos la edición.
    setEditingProfile(false)
    setTempUserData({})
  }

  const handleCancelUserEdit = () => {
    setEditingProfile(false)
    setTempUserData({})
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

  // Datos simulados de profesionales
  const professionals = [
    // GASFITERÍA
    {
      id: "PROF-001",
      name: "Juan Carlos Pérez",
      service: "Gasfitería",
      rating: 4.8,
      reviews: 124,
      region: "Región Metropolitana",
      commune: "Santiago",
      location: "Santiago, RM",
      basePrice: 25000,
      priceDisplay: "Desde $25.000",
      experience: "5 años",
      phone: "+56 9 8888 1111",
      email: "juan.perez@email.com",
      description: "Gasfiter profesional especializado en instalaciones y reparaciones de cañerías, grifería y calefont.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 34,
      durationType: "fixed" as const,
      fixedDuration: 60,
      pricePerHour: 25000
    },
    {
      id: "PROF-004",
      name: "Diego Morales",
      service: "Gasfitería",
      rating: 4.6,
      reviews: 87,
      region: "Región Metropolitana",
      commune: "Ñuñoa",
      location: "Ñuñoa, RM",
      basePrice: 28000,
      priceDisplay: "Desde $28.000",
      experience: "4 años",
      phone: "+56 9 5555 4444",
      email: "diego.morales@email.com",
      description: "Gasfiter especializado en instalaciones domiciliarias, tableros de gas y sistemas de calefacción.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 29,
      durationType: "fixed" as const,
      fixedDuration: 90,
      pricePerHour: 28000
    },
    {
      id: "PROF-007",
      name: "Ricardo Fuentes",
      service: "Gasfitería",
      rating: 4.9,
      reviews: 203,
      region: "Región de Valparaíso",
      commune: "Valparaíso",
      location: "Valparaíso, V",
      basePrice: 30000,
      priceDisplay: "Desde $30.000",
      experience: "8 años",
      phone: "+56 9 2222 7777",
      email: "ricardo.fuentes@email.com",
      description: "Maestro gasfiter con experiencia en obras complejas, instalaciones industriales y reparaciones de emergencia.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 41,
      durationType: "range" as const,
      minDuration: 60,
      maxDuration: 360,
      pricePerHour: 32000
    },
    {
      id: "PROF-010",
      name: "Andrés Soto",
      service: "Gasfitería",
      rating: 4.5,
      reviews: 156,
      region: "Región Metropolitana",
      commune: "Maipú",
      location: "Maipú, RM",
      basePrice: 22000,
      priceDisplay: "Desde $22.000",
      experience: "6 años",
      phone: "+56 9 1111 8888",
      email: "andres.soto@email.com",
      description: "Gasfiter especializado en reparaciones domiciliarias, cambio de llaves y mantención de calefont.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 35,
      durationType: "fixed" as const,
      fixedDuration: 120,
      pricePerHour: 22000
    },

    // LIMPIEZA DEL HOGAR
    {
      id: "PROF-002", 
      name: "María Elena González",
      service: "Limpieza del Hogar",
      rating: 4.9,
      reviews: 98,
      region: "Región Metropolitana",
      commune: "Las Condes",
      location: "Las Condes, RM",
      basePrice: 18000,
      priceDisplay: "Desde $18.000",
      experience: "8 años",
      phone: "+56 9 7777 2222",
      email: "maria.gonzalez@email.com",
      description: "Especialista en limpieza profunda, mantenimiento de hogar y organización de espacios.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 42,
      durationType: "range" as const,
      minDuration: 120,
      maxDuration: 480,
      pricePerHour: 12000
    },
    {
      id: "PROF-005",
      name: "Carmen Rivas",
      service: "Limpieza del Hogar",
      rating: 4.7,
      reviews: 73,
      region: "Región de Valparaíso",
      commune: "Viña del Mar",
      location: "Viña del Mar, V",
      basePrice: 16000,
      priceDisplay: "Desde $16.000",
      experience: "5 años",
      phone: "+56 9 4444 5555",
      email: "carmen.rivas@email.com",
      description: "Profesional en limpieza y desinfección, especializada en limpieza post construcción y eventos.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 38,
      durationType: "range" as const,
      minDuration: 180,
      maxDuration: 600,
      pricePerHour: 14000
    },
    {
      id: "PROF-008",
      name: "Isabel Torres",
      service: "Limpieza del Hogar",
      rating: 4.8,
      reviews: 145,
      region: "Región Metropolitana",
      commune: "Providencia",
      location: "Providencia, RM",
      basePrice: 20000,
      priceDisplay: "Desde $20.000",
      experience: "6 años",
      phone: "+56 9 3333 9999",
      email: "isabel.torres@email.com",
      description: "Experta en limpieza de oficinas y hogares, con certificación en manejo de productos ecológicos.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 33,
      durationType: "range" as const,
      minDuration: 120,
      maxDuration: 420,
      pricePerHour: 15000
    },
    {
      id: "PROF-011",
      name: "Rosa Moreno",
      service: "Limpieza del Hogar",
      rating: 4.6,
      reviews: 89,
      region: "Región del Biobío",
      commune: "Concepción",
      location: "Concepción, VIII",
      basePrice: 15000,
      priceDisplay: "Desde $15.000",
      experience: "4 años",
      phone: "+56 9 6666 4444",
      email: "rosa.moreno@email.com",
      description: "Especialista en limpieza de departamentos y casas, con experiencia en limpieza de mudanzas.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 45,
      durationType: "range" as const,
      minDuration: 150,
      maxDuration: 480,
      pricePerHour: 13000
    },
    {
      id: "PROF-014",
      name: "Lucia Vargas",
      service: "Limpieza del Hogar",
      rating: 4.9,
      reviews: 167,
      region: "Región Metropolitana",
      commune: "Vitacura",
      location: "Vitacura, RM",
      basePrice: 22000,
      priceDisplay: "Desde $22.000",
      experience: "9 años",
      phone: "+56 9 8888 3333",
      email: "lucia.vargas@email.com",
      description: "Profesional premium en limpieza y organización del hogar, especializada en casas de alto nivel.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 39,
      durationType: "range" as const,
      minDuration: 180,
      maxDuration: 540,
      pricePerHour: 18000
    },

    // JARDINERÍA
    {
      id: "PROF-003",
      name: "Carlos Rodríguez",
      service: "Jardinería",
      rating: 4.7,
      reviews: 156,
      region: "Región Metropolitana",
      commune: "Providencia",
      location: "Providencia, RM",
      basePrice: 30000,
      priceDisplay: "Desde $30.000",
      experience: "6 años",
      phone: "+56 9 6666 3333",
      email: "carlos.rodriguez@email.com",
      description: "Jardinero profesional con experiencia en diseño, mantención y podas de jardines.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 38,
      durationType: "range" as const,
      minDuration: 180,
      maxDuration: 480,
      pricePerHour: 15000
    },
    {
      id: "PROF-006",
      name: "Patricia Silva",
      service: "Jardinería",
      rating: 4.8,
      reviews: 112,
      region: "Región del Biobío",
      commune: "Concepción",
      location: "Concepción, VIII",
      basePrice: 25000,
      priceDisplay: "Desde $25.000",
      experience: "7 años",
      phone: "+56 9 3333 6666",
      email: "patricia.silva@email.com",
      description: "Paisajista especializada en diseño y mantención de jardines, poda de árboles y césped.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 37,
      durationType: "range" as const,
      minDuration: 180,
      maxDuration: 540,
      pricePerHour: 20000
    },
    {
      id: "PROF-009",
      name: "Fernando López",
      service: "Jardinería",
      rating: 4.5,
      reviews: 94,
      region: "Región de los Lagos",
      commune: "Puerto Montt",
      location: "Puerto Montt, X",
      basePrice: 28000,
      priceDisplay: "Desde $28.000",
      experience: "5 años",
      phone: "+56 9 7777 1111",
      email: "fernando.lopez@email.com",
      description: "Especialista en mantención de jardines, sistemas de riego y plantas ornamentales.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 43,
      durationType: "range" as const,
      minDuration: 240,
      maxDuration: 480,
      pricePerHour: 22000
    },
    {
      id: "PROF-012",
      name: "Miguel Herrera",
      service: "Jardinería",
      rating: 4.6,
      reviews: 128,
      region: "Región Metropolitana",
      commune: "La Reina",
      location: "La Reina, RM",
      basePrice: 32000,
      priceDisplay: "Desde $32.000",
      experience: "8 años",
      phone: "+56 9 5555 7777",
      email: "miguel.herrera@email.com",
      description: "Jardinero experto en diseño paisajístico, mantención de piscinas y áreas verdes residenciales.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "masculino",
      age: 40,
      durationType: "range" as const,
      minDuration: 120,
      maxDuration: 420,
      pricePerHour: 25000
    },
    {
      id: "PROF-013",
      name: "Alejandra Campos",
      service: "Jardinería",
      rating: 4.9,
      reviews: 185,
      region: "Región de Valparaíso",
      commune: "Quilpué",
      location: "Quilpué, V",
      basePrice: 26000,
      priceDisplay: "Desde $26.000",
      experience: "6 años",
      phone: "+56 9 9999 2222",
      email: "alejandra.campos@email.com",
      description: "Especialista en jardinería ecológica, huertos urbanos y diseño de espacios verdes sustentables.",
      verified: true,
      avatar: "/api/placeholder/150/150",
      gender: "femenino",
      age: 34,
      durationType: "range" as const,
      minDuration: 180,
      maxDuration: 360,
      pricePerHour: 24000
    }
  ]

  // Filtrar profesionales
  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prof.service.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesService = !selectedService || selectedService === "all" || prof.service === selectedService
    const matchesRegion = !selectedRegion || selectedRegion === "all" || prof.region === selectedRegion
    const matchesCommune = !selectedCommune || selectedCommune === "all" || prof.commune === selectedCommune
    const matchesRating = !rating || rating === "all" || 
                         (rating === "5" && prof.rating >= 4.8) ||
                         (rating === "4" && prof.rating >= 4.0) ||
                         (rating === "3" && prof.rating >= 3.0)
    const matchesPrice = !priceRange || priceRange === "all" ||
                        (priceRange === "low" && prof.basePrice >= 10000 && prof.basePrice <= 20000) ||
                        (priceRange === "medium" && prof.basePrice > 20000 && prof.basePrice <= 30000) ||
                        (priceRange === "high" && prof.basePrice > 30000)
    const matchesGender = !selectedGender || selectedGender === "all" || prof.gender === selectedGender
    const matchesAge = !selectedAgeRange || selectedAgeRange === "all" ||
                      (selectedAgeRange === "18-30" && prof.age >= 18 && prof.age <= 30) ||
                      (selectedAgeRange === "31-40" && prof.age >= 31 && prof.age <= 40) ||
                      (selectedAgeRange === "41-50" && prof.age >= 41 && prof.age <= 50) ||
                      (selectedAgeRange === "51+" && prof.age >= 51)
    
    return matchesSearch && matchesService && matchesRegion && matchesCommune && matchesRating && matchesPrice && matchesGender && matchesAge
  })

  // Limpiar comuna cuando cambia la región
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setSelectedCommune("") // Limpiar comuna seleccionada cuando cambia la región
  }

  if (showServiceBooking && selectedProfessional) {
    return (
      <ServiceBooking
        professional={selectedProfessional}
        user={user}
        onBack={() => {
          setShowServiceBooking(false)
          setSelectedProfessional(null)
        }}
        onBookingComplete={(booking: any) => {
          // En una app real, actualizaríamos backend/estado global
          console.log('Reserva completada:', booking)
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

          {/* Search Services Tab */}
          <TabsContent value="search" className="space-y-6">
            {/* Barra de búsqueda arriba */}
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
              </CardContent>
            </Card>

            {/* Layout con sidebar izquierdo y contenido principal */}
            <div className="flex gap-6">
              {/* Sidebar de filtros */}
              <div className="w-80 flex-shrink-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Ubicación</h4>
                      <div className="space-y-2">
                        <Label htmlFor="region">Región</Label>
                        <Select value={selectedRegion} onValueChange={handleRegionChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas las regiones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las regiones</SelectItem>
                            {Object.keys(regionsAndCommunes).map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commune">Comuna</Label>
                        <Select 
                          value={selectedCommune} 
                          onValueChange={setSelectedCommune}
                          disabled={!selectedRegion || selectedRegion === "all"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedRegion || selectedRegion === "all" ? "Selecciona región primero" : "Todas las comunas"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las comunas</SelectItem>
                            {getAvailableCommunes().map((commune) => (
                              <SelectItem key={commune} value={commune}>
                                {commune}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Calidad y Precio</h4>
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

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Profesional</h4>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Género</Label>
                        <Select value={selectedGender} onValueChange={setSelectedGender}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cualquier género" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Cualquier género</SelectItem>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Rango de Edad</Label>
                        <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cualquier edad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Cualquier edad</SelectItem>
                            <SelectItem value="18-30">18-30 años</SelectItem>
                            <SelectItem value="31-40">31-40 años</SelectItem>
                            <SelectItem value="41-50">41-50 años</SelectItem>
                            <SelectItem value="51+">51+ años</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contenido principal - Lista de profesionales */}
              <div className="flex-1">
                {/* Contador de resultados */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    {filteredProfessionals.length} profesional{filteredProfessionals.length !== 1 ? 'es' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Lista de profesionales */}
                <div className="space-y-4">
                  {filteredProfessionals.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No se encontraron profesionales con los filtros seleccionados</p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchQuery("")
                            setSelectedService("")
                            setSelectedRegion("")
                            setSelectedCommune("")
                            setPriceRange("")
                            setRating("")
                            setSelectedGender("")
                            setSelectedAgeRange("")
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredProfessionals.map((prof) => (
                      <Card key={prof.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            {/* Avatar */}
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={prof.avatar} />
                              <AvatarFallback>{prof.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>

                            {/* Información principal */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg">{prof.name}</h3>
                                    {prof.verified && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                        Verificado
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">{prof.service} • {prof.experience}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-green-600">${prof.basePrice.toLocaleString()}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= prof.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-gray-600 ml-1">
                                  {prof.rating} ({prof.reviews} reseñas)
                                </span>
                              </div>

                              <div className="flex items-center gap-1 mb-4">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{prof.location}</span>
                              </div>

                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {prof.description}
                              </p>

                              <div className="flex justify-end">
                                <Button
                                  onClick={() => {
                                    setSelectedProfessional(prof)
                                    setShowServiceBooking(true)
                                  }}
                                >
                                  Reservar Servicio
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* My Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Mis Solicitudes</h2>
              </div>

              {/* Tabs for Client/Professional View */}
              <Tabs value={requestsTab} onValueChange={setRequestsTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Como Cliente
                  </TabsTrigger>
                  <TabsTrigger value="professional" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Como Profesional
                  </TabsTrigger>
                </TabsList>

                {/* Client Requests */}
                <TabsContent value="client" className="space-y-4">
                  {serviceRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.service} - {request.professional}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.date} a las {request.time}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-green-600">
                            ${request.price.toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            {request.status === "Confirmado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsCompleted(request.id)}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar como Completado
                              </Button>
                            )}
                            {request.status === "Completado" && !request.rating && (
                              <Button size="sm" variant="outline">
                                <Star className="w-4 h-4 mr-1" />
                                Calificar
                              </Button>
                            )}
                          </div>
                        </div>

                        {request.rating && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < request.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-gray-600">{request.review}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {/* Professional Bookings */}
                <TabsContent value="professional" className="space-y-4">
                  {user.isProfessional ? (
                    professionalBookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {booking.service} - {booking.client}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {booking.date} a las {booking.time}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {booking.address}
                              </p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {booking.phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.description}
                            </p>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-green-600">
                              ${booking.price.toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                              {booking.status === "Pendiente" && (
                                <Button size="sm" variant="outline">
                                  Confirmar
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Contactar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No eres profesional
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Para ver las reservas como profesional, necesitas registrarte como uno.
                      </p>
                      <Button onClick={() => setActiveTab("professional")}>
                        Ser Profesional
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mi Perfil</CardTitle>
                    <CardDescription>
                      Gestiona tu información personal
                    </CardDescription>
                  </div>
                  {!editingProfile && (
                    <Button
                      variant="outline"
                      onClick={handleStartEditUserProfile}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {editingProfile ? (
                  <div className="space-y-4">
                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={tempUserData.name || ""}
                        onChange={(e) => setTempUserData({ ...tempUserData, name: e.target.value })}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={tempUserData.email || ""}
                        onChange={(e) => setTempUserData({ ...tempUserData, email: e.target.value })}
                        placeholder="tu@email.com"
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={tempUserData.phone || ""}
                        onChange={(e) => setTempUserData({ ...tempUserData, phone: e.target.value })}
                        placeholder="+56 9 xxxx xxxx"
                      />
                    </div>

                    {/* Región */}
                    <div className="space-y-2">
                      <Label htmlFor="userRegion">Región</Label>
                      <Select 
                        value={tempUserData.region || ""} 
                        onValueChange={(value) => {
                          setTempUserData({ ...tempUserData, region: value, commune: "" })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu región" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(regionsAndCommunes).map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Comuna */}
                    <div className="space-y-2">
                      <Label htmlFor="userCommune">Comuna</Label>
                      <Select 
                        value={tempUserData.commune || ""} 
                        onValueChange={(value) => setTempUserData({ ...tempUserData, commune: value })}
                        disabled={!tempUserData.region}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!tempUserData.region ? "Selecciona región primero" : "Selecciona tu comuna"} />
                        </SelectTrigger>
                        <SelectContent>
                          {tempUserData.region && regionsAndCommunes[tempUserData.region as keyof typeof regionsAndCommunes]?.map((commune) => (
                            <SelectItem key={commune} value={commune}>
                              {commune}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Textarea
                        id="address"
                        value={tempUserData.address || ""}
                        onChange={(e) => setTempUserData({ ...tempUserData, address: e.target.value })}
                        placeholder="Tu dirección completa"
                        rows={3}
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCancelUserEdit}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleUpdateUserData}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Avatar y información básica */}
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-lg">
                          {user.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                        <p className="text-gray-500">{user.email}</p>
                        {user.isProfessional && (
                          <Badge variant="secondary" className="mt-1">
                            <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            Profesional Verificado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Información de contacto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Correo Electrónico</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p>{user.email}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p>{user.phone || "No especificado"}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">Región</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p>{user.region || "No especificada"}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">Comuna</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p>{user.commune || "No especificada"}</p>
                        </div>
                      </div>
                    </div>

                    {user.address && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Dirección</Label>
                          <div className="flex items-start gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p>{user.address}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Información de cuenta */}
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Miembro desde</Label>
                      <p className="mt-1">{user.memberSince || "Enero 2024"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-6">
            {user.isProfessional ? (
              <Tabs value={professionalTab} onValueChange={setProfessionalTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Perfil de Servicio
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Horarios
                  </TabsTrigger>
                </TabsList>

                {/* Service Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Perfil de Servicio</CardTitle>
                          <CardDescription>
                            Gestiona la información de tu servicio profesional
                          </CardDescription>
                        </div>
                        {!editingServiceProfile && (
                          <Button
                            variant="outline"
                            onClick={handleStartEditServiceProfile}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {editingServiceProfile ? (
                        <div className="space-y-4">
                          {/* Especialidad */}
                          <div className="space-y-2">
                            <Label htmlFor="specialty">Especialidad</Label>
                            <Select 
                              value={tempServiceData.specialty} 
                              onValueChange={(value) => setTempServiceData({ ...tempServiceData, specialty: value })}
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

                          {/* Experiencia */}
                          <div className="space-y-2">
                            <Label htmlFor="experience">Años de Experiencia</Label>
                            <Input
                              id="experience"
                              type="number"
                              min="0"
                              max="50"
                              value={tempServiceData.experience}
                              onChange={(e) => setTempServiceData({ ...tempServiceData, experience: e.target.value })}
                              placeholder="Ej: 5"
                            />
                          </div>

                          {/* Descripción */}
                          <div className="space-y-2">
                            <Label htmlFor="description">Descripción del Servicio</Label>
                            <Textarea
                              id="description"
                              placeholder="Describe tu experiencia y especialidades..."
                              value={tempServiceData.description}
                              onChange={(e) => setTempServiceData({ ...tempServiceData, description: e.target.value })}
                              rows={4}
                            />
                          </div>

                          {/* Tipo de Duración */}
                          <div className="space-y-2">
                            <Label htmlFor="durationType">Tipo de Duración</Label>
                            <Select
                              value={tempServiceData.durationType}
                              onValueChange={(value) => setTempServiceData({ ...tempServiceData, durationType: value })}
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

                          {/* Configuración de Duración */}
                          {tempServiceData.durationType === "fixed" ? (
                            <div className="space-y-2">
                              <Label htmlFor="fixedDuration">Duración del Servicio (minutos)</Label>
                              <Input
                                id="fixedDuration"
                                type="number"
                                min="15"
                                max="480"
                                step="15"
                                value={tempServiceData.fixedDuration}
                                onChange={(e) => setTempServiceData({ ...tempServiceData, fixedDuration: parseInt(e.target.value) })}
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="minDuration">Duración Mínima (minutos)</Label>
                                <Input
                                  id="minDuration"
                                  type="number"
                                  min="15"
                                  max="480"
                                  step="15"
                                  value={tempServiceData.minDuration}
                                  onChange={(e) => setTempServiceData({ ...tempServiceData, minDuration: parseInt(e.target.value) })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="maxDuration">Duración Máxima (minutos)</Label>
                                <Input
                                  id="maxDuration"
                                  type="number"
                                  min="15"
                                  max="480"
                                  step="15"
                                  value={tempServiceData.maxDuration}
                                  onChange={(e) => setTempServiceData({ ...tempServiceData, maxDuration: parseInt(e.target.value) })}
                                />
                              </div>
                            </div>
                          )}

                          {/* Precio Fijo del Servicio */}
                          <div className="space-y-2">
                            <Label htmlFor="pricePerHour">Precio fijo del servicio (CLP)</Label>
                            <Input
                              id="pricePerHour"
                              type="number"
                              min="5000"
                              max="100000"
                              step="1000"
                              value={tempServiceData.pricePerHour}
                              onChange={(e) => setTempServiceData({ ...tempServiceData, pricePerHour: parseInt(e.target.value) })}
                              placeholder="Ej: 20000"
                            />
                            <p className="text-xs text-gray-500">
                              Precio fijo que cobrarás por el servicio, independiente del tiempo exacto
                            </p>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleUpdateProfessionalData}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Guardar Cambios
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Vista de información actual */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Especialidad</Label>
                              <p className="text-lg">{userProfessionalData?.specialty}</p>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-gray-500">Experiencia</Label>
                              <p className="text-lg">{userProfessionalData?.experience} años</p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-500">Precio Fijo</Label>
                              <p className="text-lg text-green-600">${userProfessionalData?.pricePerHour.toLocaleString()}</p>
                            </div>

                            <div>
                              <Label className="text-sm font-medium text-gray-500">Tipo de Duración</Label>
                              <p className="text-lg capitalize">{userProfessionalData?.durationType === "fixed" ? "Duración Fija" : "Rango de Duración"}</p>
                            </div>

                            {userProfessionalData?.durationType === "fixed" ? (
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Duración del Servicio</Label>
                                <p className="text-lg">{userProfessionalData?.fixedDuration} minutos</p>
                              </div>
                            ) : (
                              <div>
                                <Label className="text-sm font-medium text-gray-500">Rango de Duración</Label>
                                <p className="text-lg">{userProfessionalData?.minDuration} - {userProfessionalData?.maxDuration} minutos</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                            <p className="text-lg mt-1">{userProfessionalData?.description}</p>
                          </div>

                          {/* Estadísticas */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-lg font-semibold">{userProfessionalData?.rating}</span>
                              </div>
                              <p className="text-sm text-gray-500">Calificación</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-lg font-semibold">{userProfessionalData?.completedJobs}</span>
                              </div>
                              <p className="text-sm text-gray-500">Trabajos Completados</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {userProfessionalData?.verified ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                <span className="text-lg font-semibold">
                                  {userProfessionalData?.verified ? "Verificado" : "Pendiente"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Estado</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Horarios</CardTitle>
                      <CardDescription>
                        Configura tus horarios de disponibilidad
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProfessionalScheduleManager />
                    </CardContent>
                  </Card>
                </TabsContent>


              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ser Profesional</CardTitle>
                  <CardDescription>
                    Únete a nuestra plataforma como profesional de servicios para el hogar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Esta funcionalidad permite registrarse como profesional en la plataforma.
                    </AlertDescription>
                  </Alert>
                  <Button>
                    Comenzar Registro
                  </Button>
                </CardContent>
              </Card>
            )}
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