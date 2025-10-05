import { useState } from "react"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import SearchTab from "./tabs/SearchTab"
import RequestsTab from "./tabs/RequestsTab"
import ProfileTab from "./tabs/ProfileTab"
import ProfessionalTabMultiService from "./tabs/ProfessionalTabMultiService"
import { 
  User, 
  LogOut, 
  Search, 
  Calendar,
  Briefcase
} from "lucide-react"

interface UserDashboardProps {
  user: any
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState("search")

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
  // Solo existen si el usuario ya es profesional
  const professionalBookings = user.isProfessional ? [
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
  ] : []

  // Simular datos del perfil profesional multiservicio si ya es profesional
  const [userProfessionalProfile, setUserProfessionalProfile] = useState(
    user.isProfessional ? {
      id: "profile-001",
      userId: user.id,
      generalDescription: "Profesional experimentado en servicios del hogar con múltiples especialidades.",
      generalVerificationStatus: "approved" as const,
      averageRating: 4.6,
      totalJobs: 78,
      totalEarnings: 1560000,
      isActive: true,
      acceptsNewJobs: true,
      services: [
        {
          id: "service-001",
          categoryId: "gasfiteria",
          categoryName: "Gasfitería",
          experience: "4",
          description: "Especialista en instalaciones y reparaciones de cañerías, grifería y calefont.",
          durationType: "range" as const,
          minDuration: 60,
          maxDuration: 240,
          priceFixed: 28000,
          isActive: true,
          isAvailable: true,
          verificationStatus: "approved" as const,
          rating: 4.7,
          completedJobs: 45,
          totalEarnings: 1260000
        },
        {
          id: "service-002",
          categoryId: "limpieza",
          categoryName: "Limpieza del Hogar",
          experience: "2",
          description: "Limpieza profunda y mantención regular de hogares y oficinas.",
          durationType: "fixed" as const,
          fixedDuration: 180,
          priceFixed: 22000,
          isActive: true,
          isAvailable: true,
          verificationStatus: "pending" as const,
          rating: 4.5,
          completedJobs: 33,
          totalEarnings: 726000
        }
      ]
    } : null
  )

  // Datos simulados de profesionales para la búsqueda
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

  const handleMarkAsCompleted = (requestId: string) => {
    setServiceRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "Completado" }
          : req
      )
    )
  }

  const handleSubmitReview = (reviewData: any) => {
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

  const handleUpdateUser = (userData: any) => {
    // En una app real esto se enviaría al backend
    console.log("Actualizando datos de usuario:", userData)
  }

  const handleUpdateProfessionalProfile = (profile: any) => {
    setUserProfessionalProfile(profile)
  }

  const handleBecomeProfessional = (profileData: any) => {
    console.log("Creando perfil profesional:", profileData)
    // Aquí se enviaría la aplicación al backend
    // Por ahora simulamos que el usuario se convierte en profesional
    user.isProfessional = true
    setUserProfessionalProfile(profileData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Bienvenido, {user.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Panel de Usuario</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 flex-shrink-0"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="search" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar Servicios</span>
              <span className="sm:hidden">Buscar</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Solicitudes</span>
              <span className="sm:hidden">Solicitudes</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{user.isProfessional ? "Panel Profesional" : "Ser Profesional"}</span>
              <span className="sm:hidden">{user.isProfessional ? "Profesional" : "Unirse"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Search Services Tab */}
          <TabsContent value="search">
            <SearchTab 
              professionals={professionals}
              user={user}
            />
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <RequestsTab 
              serviceRequests={serviceRequests}
              professionalBookings={professionalBookings}
              onMarkAsCompleted={handleMarkAsCompleted}
              onSubmitReview={handleSubmitReview}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileTab 
              user={user}
              onUpdateUser={handleUpdateUser}
            />
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional">
            <ProfessionalTabMultiService 
              user={user}
              userProfessionalProfile={userProfessionalProfile}
              onUpdateProfessionalProfile={handleUpdateProfessionalProfile}
              onBecomeProfessional={handleBecomeProfessional}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}