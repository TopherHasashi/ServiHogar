import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Alert, AlertDescription } from "../ui/alert"
import { Separator } from "../ui/separator"
import { Calendar } from "../ui/calendar"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Star,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  MessageSquare,
  
} from "lucide-react"

interface Professional {
  id: string
  name: string
  service: string
  rating: number
  reviews: number
  location: string
  basePrice: number
  pricePerHour?: number
  experience: string
  phone: string
  email: string
  description: string
  verified: boolean
  avatar: string
  durationType: 'fixed' | 'range'
  fixedDuration?: number
  minDuration?: number
  maxDuration?: number
  weeklySchedule?: WeeklySchedule
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
  price: number
}

interface DaySchedule {
  enabled: boolean
  timeSlots: { start: string; end: string }[]
}

interface WeeklySchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface Review {
  id: string
  customerName: string
  customerAvatar: string
  rating: number
  comment: string
  date: string
  serviceType: string
}

interface ServiceBookingProps {
  professional: Professional
  user?: any
  onBack: () => void
  onBookingComplete: (booking: any) => void
}

export default function ServiceBooking({ professional, user, onBack, onBookingComplete }: ServiceBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [selectedDuration] = useState<number>(professional.fixedDuration || professional.minDuration || 60)
  const [bookingStep, setBookingStep] = useState<'datetime' | 'details' | 'payment' | 'processing-payment' | 'confirmation'>('datetime')
  const [serviceDetails, setServiceDetails] = useState({
    address: '',
    description: '',
    phone: '',
    specialRequests: ''
  })

  // Pre-rellenar datos del usuario cuando esté disponible
  useEffect(() => {
    if (user) {
      setServiceDetails(prev => ({
        ...prev,
        address: prev.address || user.address || '',
        phone: prev.phone || user.phone || ''
      }))
    }
  }, [user])
  const [isBooking, setIsBooking] = useState(false)
  const [, setPaymentUrl] = useState<string | null>(null) // kept for potential future use

  // Horario por defecto si no está definido
  const getDefaultWeeklySchedule = (): WeeklySchedule => ({
    monday: { enabled: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
    tuesday: { enabled: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
    wednesday: { enabled: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
    thursday: { enabled: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
    friday: { enabled: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
    saturday: { enabled: true, timeSlots: [{ start: '09:00', end: '14:00' }] },
    sunday: { enabled: false, timeSlots: [] }
  })

  // Simulación de disponibilidad - en producción vendría del backend
  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay()
    const dayNames: (keyof WeeklySchedule)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    
    // Usar horario del profesional o uno por defecto
    const schedule = professional.weeklySchedule || getDefaultWeeklySchedule()
    
    if (!schedule[dayName]?.enabled) {
      return []
    }
    
    const daySchedule = schedule[dayName]
    const slots: TimeSlot[] = []
    
    // Generar slots basados en los horarios configurados
    daySchedule.timeSlots.forEach(timeSlot => {
      const startHour = parseInt(timeSlot.start.split(':')[0])
      const startMinute = parseInt(timeSlot.start.split(':')[1])
      const endHour = parseInt(timeSlot.end.split(':')[0])
      const endMinute = parseInt(timeSlot.end.split(':')[1])
      
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      
      // Crear slots de 1 hora dentro del rango horario
      for (let time = startMinutes; time < endMinutes; time += 60) {
        const slotHour = Math.floor(time / 60)
        const slotMinute = time % 60
        const nextHour = Math.floor((time + 60) / 60)
        const nextMinute = (time + 60) % 60
        
        const slotStart = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`
        const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`
        
        // Generar disponibilidad consistente basada en profesional, fecha y hora
        const seed = `${professional.id}-${date.toDateString()}-${slotStart}`
        let hash = 0
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convert to 32bit integer
        }
        // Usar el hash para determinar disponibilidad (aproximadamente 70% disponible)
        const available = Math.abs(hash) % 10 < 7
        
        slots.push({
          start: slotStart,
          end: slotEnd,
          available,
          price: calculatePrice(selectedDuration)
        })
      }
    })
    
    return slots
  }

  const calculatePrice = (_duration: number): number => {
    // Ahora los precios son siempre fijos, independiente de la duración
    return professional.basePrice
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`
    } else if (hours > 0) {
      return `${hours}h`
    } else {
      return `${mins}min`
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

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Hace 1 día"
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Función para crear la preferencia de pago en MercadoPago
  const createMercadoPagoPreference = async () => {
    // Simular llamada a la API para crear preferencia de MercadoPago
    // preferenceData simulado omitido por no uso en desarrollo

    try {
      // En producción, esto sería una llamada real a tu backend
      // const response = await fetch('/api/create-payment-preference', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferenceData)
      // })
      // const data = await response.json()
      
      // Simulación para desarrollo
      const mockResponse = {
        init_point: `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=123456789-${Date.now()}`,
        id: `PREF-${Date.now()}`
      }
      
      return mockResponse
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error)
      throw error
    }
  }

  const handleBooking = async () => {
    setIsBooking(true)
    setBookingStep('processing-payment')
    
    try {
      // Crear preferencia de pago en MercadoPago
      const preference = await createMercadoPagoPreference()
      
      // Redirigir a MercadoPago
      setPaymentUrl(preference.init_point)
      
      // Simular redirección para desarrollo
      setTimeout(() => {
        // En producción, aquí se haría window.location.href = preference.init_point
        console.log('Redirigiendo a MercadoPago:', preference.init_point)
        
        // Simular pago exitoso después de 3 segundos
        setTimeout(() => {
          handlePaymentSuccess()
        }, 3000)
      }, 1000)
      
    } catch (error) {
      console.error('Error en el proceso de pago:', error)
      setIsBooking(false)
      // Aquí podrías mostrar un mensaje de error
    }
  }

  const handlePaymentSuccess = () => {
    const booking = {
      id: `BOOK-${Date.now()}`,
      professional: professional.name,
      service: professional.service,
      date: selectedDate?.toISOString().split('T')[0],
      time: selectedTimeSlot?.start,
      duration: selectedDuration,
      price: currentPrice,
      status: 'Pagado',
      serviceDetails,
      paymentDate: new Date().toISOString()
    }
    
    setIsBooking(false)
    setBookingStep('confirmation')
    
    // Redirigir a "Mis Solicitudes" después de 3 segundos
    setTimeout(() => {
      onBookingComplete(booking)
    }, 3000)
  }

  // Usar useMemo para evitar re-generación innecesaria de slots
  const availableSlots = useMemo(() => {
    return selectedDate ? getAvailableSlots(selectedDate) : []
  }, [selectedDate, selectedDuration, professional.id])
  const currentPrice = calculatePrice(selectedDuration)

  // Simulación de reseñas del profesional - en producción vendría del backend
  const professionalReviews: Review[] = [
    {
      id: "1",
      customerName: "María González",
      customerAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b586?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      comment: "Excelente trabajo, muy profesional y puntual. El servicio superó mis expectativas completamente.",
      date: "2024-12-15",
      serviceType: professional.service
    },
    {
      id: "2", 
      customerName: "Carlos Martínez",
      customerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      comment: "Muy recomendado, trabajo de alta calidad y precios justos. Definitivamente lo contrataré de nuevo.",
      date: "2024-12-10",
      serviceType: professional.service
    },
    {
      id: "3",
      customerName: "Ana López",
      customerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4,
      comment: "Buen servicio en general, llegó a tiempo y hizo un trabajo limpio. Solo pequeños detalles por mejorar.",
      date: "2024-12-05",
      serviceType: professional.service
    },
    {
      id: "4",
      customerName: "Roberto Silva",
      customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      comment: "Increíble atención al detalle y muy profesional. El resultado final fue perfecto.",
      date: "2024-11-28",
      serviceType: professional.service
    },
    {
      id: "5",
      customerName: "Fernanda Torres",
      customerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      comment: "Súper recomendado! Muy eficiente y el precio muy competitivo para la calidad del trabajo.",
      date: "2024-11-20",
      serviceType: professional.service
    }
  ]

  // Pantalla de procesamiento de pago
  if (bookingStep === 'processing-payment') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-lg">
          <CardContent className="text-center py-12 px-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Procesando Pago</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Te estamos redirigiendo a MercadoPago para completar tu pago de manera segura.
            </p>
            
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen del Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Servicio</p>
                    <p className="font-medium">{professional.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Profesional</p>
                    <p className="font-medium">{professional.name}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedDate?.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                      <p className="text-gray-600">{selectedTimeSlot?.start}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total a Pagar</p>
                    <p className="font-bold text-blue-600 text-xl">${currentPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium">
                  Conectando con MercadoPago...
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800">Información de Seguridad</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Tu pago será procesado de forma segura por MercadoPago. No guardaremos tu información de pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bookingStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-lg">
          <CardContent className="text-center py-12 px-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3">¡Pago Exitoso!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Tu pago ha sido procesado correctamente y tu servicio está confirmado. El profesional te contactará pronto para coordinar los detalles.
            </p>
            
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Detalles de tu Reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Profesional</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback className="text-xs">{professional.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{professional.name}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Servicio</p>
                    <p className="font-medium">{professional.service}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedDate?.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                      <p className="text-gray-600">{selectedTimeSlot?.start}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="font-bold text-green-600 text-lg">${currentPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-800">Pago Confirmado</p>
                    <p className="text-xs text-green-700 mt-1">
                      Tu transacción fue procesada exitosamente por MercadoPago
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium">
                  Redirigiendo a tus solicitudes de servicio...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={professional.avatar} />
                <AvatarFallback className="text-lg">{professional.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-semibold">{professional.name}</h1>
                  {professional.verified && (
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      Verificado
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">{professional.service}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(professional.rating)}
                    <span className="ml-1 font-medium">({professional.reviews} reseñas)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{professional.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-medium">${professional.basePrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Indicador de progreso */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {(() => {
            const steps: Array<'datetime' | 'details' | 'payment'> = ['datetime', 'details', 'payment']
            const stepIndex = steps.indexOf(bookingStep as 'datetime' | 'details' | 'payment')
            const passed = (index: number) => stepIndex > index
            const active = (index: number) => stepIndex === index
            const step3Active = active(2)
            return (
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className={`flex items-center gap-3 ${active(0) ? 'text-blue-600' : passed(0) ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    active(0) ? 'border-blue-600 bg-blue-50' : passed(0) ? 'border-green-600 bg-green-50' : 'border-gray-300'
                  }`}>
                    {passed(0) ? <CheckCircle className="w-5 h-5 text-green-600" /> : '1'}
                  </div>
                  <span className="font-medium">Fecha y Hora</span>
                </div>

                <div className={`w-12 h-0.5 ${passed(0) ? 'bg-green-600' : 'bg-gray-200'}`}></div>

                {/* Step 2 */}
                <div className={`flex items-center gap-3 ${active(1) ? 'text-blue-600' : passed(1) ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    active(1) ? 'border-blue-600 bg-blue-50' : passed(1) ? 'border-green-600 bg-green-50' : 'border-gray-300'
                  }`}>
                    {passed(1) ? <CheckCircle className="w-5 h-5 text-green-600" /> : '2'}
                  </div>
                  <span className="font-medium">Detalles</span>
                </div>

                <div className={`w-12 h-0.5 ${passed(1) ? 'bg-green-600' : 'bg-gray-200'}`}></div>

                {/* Step 3 */}
                <div className={`flex items-center gap-3 ${step3Active ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    step3Active ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}>
                    3
                  </div>
                  <span className="font-medium">Confirmación</span>
                </div>
              </div>
            )
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Principal */}
          <div className="lg:col-span-2 space-y-6">
          {bookingStep === 'datetime' && (
            <div className="space-y-6">
              {/* Información de duración del servicio */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Información del Servicio
                  </CardTitle>
                  <CardDescription>
                    Detalles del tiempo estimado y precio fijo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Duración Estimada</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {professional.durationType === 'fixed' 
                            ? formatDuration(professional.fixedDuration || 60)
                            : `${formatDuration(professional.minDuration || 60)} - ${formatDuration(professional.maxDuration || 240)}`
                          }
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Tiempo aproximado de trabajo
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-2">Precio Fijo</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${professional.basePrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Precio total del servicio
                        </div>
                      </div>
                    </div>
                  </div>
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      El precio es fijo independiente del tiempo exacto que tome el servicio. 
                      La duración mostrada es solo una estimación para tu planificación.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Selección de fecha y hora */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Fecha y Hora
                  </CardTitle>
                  <CardDescription>
                    Elige cuándo necesitas el servicio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendario */}
                    <div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return date < today
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Horarios disponibles */}
                    <div>
                      <h4 className="font-medium mb-4">
                        {selectedDate ? (
                          <>Horarios disponibles para {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</>
                        ) : (
                          'Selecciona una fecha para ver horarios disponibles'
                        )}
                      </h4>
                      
                      {selectedDate && availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={`${slot.start}-${slot.end}`}
                              onClick={() => slot.available && setSelectedTimeSlot(slot)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg border-2 text-sm transition-all ${
                                selectedTimeSlot?.start === slot.start
                                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                                  : slot.available
                                  ? 'border-gray-200 hover:border-gray-300 bg-white'
                                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <div className="font-medium">{slot.start}</div>
                              <div className="text-xs mt-1">
                                {slot.available ? '✅ Disponible' : '❌ Ocupado'}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : selectedDate && availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No hay horarios disponibles para esta fecha</p>
                          <p className="text-sm">El profesional no trabaja este día</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Selecciona una fecha en el calendario</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón continuar */}
                  <div className="mt-8 pt-6 border-t">
                    <Button 
                      onClick={() => setBookingStep('details')}
                      disabled={!selectedDate || !selectedTimeSlot}
                      className="w-full"
                      size="lg"
                    >
                      Continuar con los Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reseñas del Profesional */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Reseñas de Clientes</CardTitle>
                  <CardDescription>
                    Opiniones de clientes que han contratado este profesional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {professionalReviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.customerAvatar} />
                          <AvatarFallback className="text-sm">{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-medium">{review.customerName}</h5>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">{formatReviewDate(review.date)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {review.serviceType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4 border-t">
                    <Button variant="outline" size="sm">
                      Ver todas las reseñas ({professional.reviews})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {bookingStep === 'details' && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Detalles del Servicio
                </CardTitle>
                <CardDescription>
                  Proporciona información adicional para el profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="address">Dirección donde se realizará el servicio *</Label>
                  <Input
                    id="address"
                    placeholder="Ej: Av. Providencia 1234, Depto 505, Providencia"
                    value={serviceDetails.address}
                    onChange={(e) => setServiceDetails({...serviceDetails, address: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Teléfono de contacto *</Label>
                  <Input
                    id="phone"
                    placeholder="+56 9 8888 0000"
                    value={serviceDetails.phone}
                    onChange={(e) => setServiceDetails({...serviceDetails, phone: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción del trabajo a realizar *</Label>
                  <Input
                    id="description"
                    placeholder="Describe brevemente el trabajo que necesitas"
                    value={serviceDetails.description}
                    onChange={(e) => setServiceDetails({...serviceDetails, description: e.target.value})}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="special-requests">Solicitudes especiales (opcional)</Label>
                  <Input
                    id="special-requests"
                    placeholder="Ej: Preferencia de materiales, herramientas específicas, etc."
                    value={serviceDetails.specialRequests}
                    onChange={(e) => setServiceDetails({...serviceDetails, specialRequests: e.target.value})}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setBookingStep('datetime')}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button 
                    onClick={() => setBookingStep('payment')}
                    disabled={!serviceDetails.address || !serviceDetails.phone || !serviceDetails.description}
                    className="flex-1"
                  >
                    Continuar al Pago
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bookingStep === 'payment' && (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Confirmación y Pago
                </CardTitle>
                <CardDescription>
                  Revisa los detalles y procede al pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resumen de la reserva */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Resumen de tu Reserva</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">
                        {selectedDate?.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-medium">{selectedTimeSlot?.start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duración estimada:</span>
                      <span className="font-medium">
                        {professional.durationType === 'fixed' 
                          ? formatDuration(professional.fixedDuration || 60)
                          : `${formatDuration(professional.minDuration || 60)} - ${formatDuration(professional.maxDuration || 240)}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dirección:</span>
                      <span className="font-medium">{serviceDetails.address}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-green-600">${currentPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Información del pago */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Serás redirigido a MercadoPago para completar el pago de forma segura. 
                    El profesional será notificado una vez confirmado el pago.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setBookingStep('details')}
                    className="flex-1"
                  >
                    Volver
                  </Button>
                  <Button 
                    onClick={handleBooking}
                    disabled={isBooking}
                    className="flex-1"
                    size="lg"
                  >
                    {isBooking ? 'Procesando...' : 'Pagar con MercadoPago'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Información del profesional */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información del Profesional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-3">
                    <AvatarImage src={professional.avatar} />
                    <AvatarFallback className="text-lg">{professional.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{professional.name}</h3>
                  <p className="text-sm text-gray-600">{professional.service}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {renderStars(professional.rating)}
                    <span className="text-sm text-gray-600 ml-1">({professional.reviews})</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{professional.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Verificado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{professional.experience} de experiencia</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600">{professional.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información de Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${professional.basePrice.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Precio fijo del servicio</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700 text-center">
                    <strong>Duración estimada:</strong>
                    <br />
                    {professional.durationType === 'fixed' 
                      ? formatDuration(professional.fixedDuration || 60)
                      : `${formatDuration(professional.minDuration || 60)} - ${formatDuration(professional.maxDuration || 240)}`
                    }
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  El precio no varía según el tiempo exacto del trabajo
                </div>
              </CardContent>
            </Card>

            {/* Horario Semanal */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Horarios de Trabajo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const schedule = professional.weeklySchedule || getDefaultWeeklySchedule()
                    const dayLabels = {
                      monday: 'Lunes',
                      tuesday: 'Martes', 
                      wednesday: 'Miércoles',
                      thursday: 'Jueves',
                      friday: 'Viernes',
                      saturday: 'Sábado',
                      sunday: 'Domingo'
                    }
                    
                    return Object.entries(dayLabels).map(([day, label]) => {
                      const daySchedule = schedule[day as keyof WeeklySchedule]
                      return (
                        <div key={day} className="flex justify-between py-1">
                          <span className="font-medium">{label}:</span>
                          <span className="text-gray-600">
                            {daySchedule.enabled && daySchedule.timeSlots.length > 0 
                              ? daySchedule.timeSlots.map(slot => `${slot.start} - ${slot.end}`).join(', ')
                              : 'No disponible'
                            }
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}