import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import SearchTab from "./tabs/SearchTab"
import RequestsTab from "./tabs/RequestsTab"
import ProfileTab from "./tabs/ProfileTab"
import ProfessionalTabMultiService from "./tabs/ProfessionalTabMultiService"
import { apiGetAuth, apiPost, apiPostForm } from "../../lib/api"
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
  // Estado de solicitud profesional: none | pending | rejected | approved
  const [professionalStatus, setProfessionalStatus] = useState<'none' | 'pending' | 'rejected' | 'approved'>('none')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

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

  // Cargar estado real del perfil/servicios del usuario y decidir si habilitar panel profesional
  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const data = await apiGetAuth('/api/my/services/')
        if (ignore) return
        const normalizeStatus = (v: any): 'pending' | 'approved' | 'rejected' | 'suspended' => {
          const s = (typeof v === 'string' ? v : '').toLowerCase()
          if (s === 'aprobado' || s === 'approved') return 'approved'
          if (s === 'rechazado' || s === 'rejected') return 'rejected'
          if (s === 'suspendido' || s === 'suspended') return 'suspended'
          return 'pending'
        }
        // Construir perfil mínimo desde datos reales (solo si ya está aprobado)
        const mappedServices = (data.servicios || []).map((s: any) => ({
          id: s.id_servicio_profesional,
          categoryId: s.categoria, // solo nombre por ahora
          categoryName: s.categoria,
          experience: s.anos_experiencia,
          description: s.descripcion,
          durationType: s.tipo_duracion,
          fixedDuration: s.duracion_fija_minutos,
          minDuration: s.duracion_minima_minutos,
          maxDuration: s.duracion_maxima_minutos,
          priceFixed: s.precio_fijo,
          // Visibilidad en buscador controlada por backend; si no viene, fallback a aprobado
          isActive: (typeof s.visible === 'boolean') ? !!s.visible : (s.estado_verificacion === 'aprobado'),
          isAvailable: s.estado_verificacion === 'aprobado',
          verificationStatus: normalizeStatus(s.estado_verificacion),
          razon_rechazo: s.razon_rechazo,
          rating: 0,
          completedJobs: 0,
          totalEarnings: 0,
        }))
        const estadoRaw: string | null = data.estado_general || null
        const estado = (estadoRaw || '').toLowerCase()
        if (estado === 'aprobado' || estado === 'approved') {
          const profile = {
            id: 'profile-remote',
            userId: user.id,
            generalDescription: '',
            generalVerificationStatus: 'approved' as const,
            averageRating: 0,
            totalJobs: 0,
            totalEarnings: 0,
            isActive: true,
            acceptsNewJobs: true,
            services: mappedServices,
          }
          setUserProfessionalProfile(profile as any)
          setProfessionalStatus('approved')
          user.isProfessional = true
          setRejectionReason(null)
        } else if (estado === 'pendiente' || estado === 'pending') {
          setProfessionalStatus('pending')
          setUserProfessionalProfile(null)
          setRejectionReason(null)
        } else if (estado === 'rechazado' || estado === 'rejected') {
          setProfessionalStatus('rejected')
          setUserProfessionalProfile(null)
          // Tomar el motivo del último servicio rechazado si existe
          const rej = mappedServices.find((s: any) => s.verificationStatus === 'rechazado' && s.razon_rechazo)
          setRejectionReason(rej?.razon_rechazo || 'Solicitud rechazada por verificación')
        } else {
          setProfessionalStatus('none')
          setUserProfessionalProfile(null)
          setRejectionReason(null)
        }
      } catch {
        // Si 400 (no tiene usuario en dominio) o 401, ignorar
      }
    })()
    return () => { ignore = true }
  }, [])

  // La pestaña de búsqueda ahora consume el endpoint público /api/services/search/ directamente

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

  const handleBecomeProfessional = async (profileData: any) => {
    // Enviar solicitud real al backend para crear perfil y primer servicio en estado pendiente
    try {
      const firstService = profileData.services?.[0]
      if (!firstService) throw new Error('Falta el primer servicio')
      // Si vienen archivos adjuntos en profileData, enviar como multipart/form-data
      if (profileData.__files) {
        const fd = new FormData()
        fd.append('general_description', profileData.generalDescription || '')
        fd.append('category_slug', (firstService.categoryId || '').toString())
        fd.append('experience', firstService.experience || '')
        fd.append('description', firstService.description || '')
        fd.append('duration_type', firstService.durationType || 'fixed')
        if (firstService.fixedDuration != null) fd.append('fixed_duration', String(firstService.fixedDuration))
        if (firstService.minDuration != null) fd.append('min_duration', String(firstService.minDuration))
        if (firstService.maxDuration != null) fd.append('max_duration', String(firstService.maxDuration))
        fd.append('price_fixed', String(firstService.priceFixed))
        if (profileData.__files.certificate) {
          fd.append('certificate', profileData.__files.certificate)
        }
        if (Array.isArray(profileData.__files.experience)) {
          for (const f of profileData.__files.experience) {
            fd.append('experience_docs', f)
          }
        }
        await apiPostForm('/api/professional/apply/', fd, { auth: true })
      } else {
        await apiPost('/api/professional/apply/', {
          general_description: profileData.generalDescription,
          category_slug: (firstService.categoryId || '').toString(),
          experience: firstService.experience,
          description: firstService.description,
          duration_type: firstService.durationType,
          fixed_duration: firstService.fixedDuration,
          min_duration: firstService.minDuration,
          max_duration: firstService.maxDuration,
          price_fixed: firstService.priceFixed,
        }, { auth: true })
      }
      // No habilitar panel ni marcar como profesional hasta que verificador apruebe
      setProfessionalStatus('pending')
      setUserProfessionalProfile(null)
      if (activeTab !== 'professional') setActiveTab('professional')
      alert('Tu solicitud fue enviada al verificador. Te notificaremos al ser revisada.')
    } catch (e: any) {
      alert(e?.message || 'Error desconocido')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
  <div className="w-full px-4 sm:px-6 lg:px-8">
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
  <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
            {/* Estado de solicitud: pendiente o rechazada */}
            {professionalStatus === 'pending' && (
              <div className="mb-4 p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-800">
                Tu solicitud para crear el perfil profesional está en revisión. Te avisaremos cuando sea aprobada.
              </div>
            )}
            {professionalStatus === 'rejected' && (
              <div className="mb-4 p-3 border border-red-200 bg-red-50 rounded-md text-sm text-red-700">
                Tu última solicitud fue rechazada. Motivo: {rejectionReason}
              </div>
            )}
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