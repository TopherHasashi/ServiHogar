import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
import { Calendar } from "../ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Settings,
  User,
  Briefcase,
  X,
  Edit
} from "lucide-react"

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
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

interface CustomAvailability {
  id: string
  type: 'available' | 'unavailable'
  startDate: Date
  endDate: Date
  reason?: string
  timeSlots?: TimeSlot[]
}

interface CustomSchedulePeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
  weeklySchedule: WeeklySchedule
}

interface ServiceSchedule {
  serviceId: string
  serviceName: string
  weeklyTemplate: WeeklySchedule
  customAvailability: CustomAvailability[]
  customSchedulePeriods: CustomSchedulePeriod[]
}

interface ProfessionalScheduleManagerAdvancedProps {
  professionalServices?: Array<{
    id: string
    categoryId: string
    categoryName: string
    experience: string
    description: string
    durationType: 'fixed' | 'range'
    fixedDuration?: number
    minDuration?: number
    maxDuration?: number
    priceFixed: number
    isActive: boolean
    isAvailable: boolean
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
    rating: number
    completedJobs: number
    totalEarnings: number
  }>
}

export default function ProfessionalScheduleManagerAdvanced({ 
  professionalServices = [] 
}: ProfessionalScheduleManagerAdvancedProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [availabilityType, setAvailabilityType] = useState<'available' | 'unavailable'>('unavailable')
  const [customReason, setCustomReason] = useState("")
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly' | 'custom-periods'>('calendar')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Estados para horarios personalizados por período
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<string | null>(null)
  const [periodForm, setPeriodForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    weeklySchedule: {} as WeeklySchedule
  })

  // Estado para programaciones por servicio
  const [serviceSchedules, setServiceSchedules] = useState<Record<string, ServiceSchedule>>(() => {
    const defaultWeeklySchedule: WeeklySchedule = {
      monday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
      tuesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
      wednesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
      thursday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
      friday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
      saturday: { enabled: false, timeSlots: [] },
      sunday: { enabled: false, timeSlots: [] }
    }

    const schedules: Record<string, ServiceSchedule> = {}
    professionalServices.forEach(service => {
      if (service.isActive && service.isAvailable) {
        schedules[service.id] = {
          serviceId: service.id,
          serviceName: service.categoryName,
          weeklyTemplate: { ...defaultWeeklySchedule },
          customAvailability: [],
          customSchedulePeriods: []
        }
      }
    })
    return schedules
  })

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  // Servicios habilitados
  const enabledServices = professionalServices.filter(service => service.isActive && service.isAvailable)

  // Funciones para navegación de meses
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  // Obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Días del mes anterior (grises)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    // Días del siguiente mes (grises) para completar la grilla
    const remainingCells = 42 - days.length
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }
    
    return days
  }

  const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth])

  // Función para verificar si una fecha está seleccionada
  const isDateSelected = (date: Date) => {
    return selectedDates.some(selected => 
      selected.toDateString() === date.toDateString()
    )
  }

  // Función para verificar disponibilidad personalizada en una fecha
  const getCustomAvailabilityForDate = (date: Date, serviceId: string) => {
    if (!serviceSchedules[serviceId]) return null
    
    return serviceSchedules[serviceId].customAvailability.find(availability => {
      const dateTime = date.getTime()
      return dateTime >= availability.startDate.getTime() && 
             dateTime <= availability.endDate.getTime()
    })
  }

  // Manejar selección de fechas
  const handleDateSelect = (date: Date) => {
    setSelectedDates(prev => {
      const isSelected = prev.some(selected => 
        selected.toDateString() === date.toDateString()
      )
      
      if (isSelected) {
        return prev.filter(selected => 
          selected.toDateString() !== date.toDateString()
        )
      } else {
        return [...prev, date]
      }
    })
  }

  // Seleccionar semana completa
  const selectWeek = (startDate: Date) => {
    const weekDates = []
    const start = new Date(startDate)
    // Ir al lunes de esa semana
    start.setDate(start.getDate() - start.getDay() + 1)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      
      // Solo agregar fechas del mes actual que sean visibles
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                            date.getFullYear() === currentMonth.getFullYear()
      if (isCurrentMonth) {
        weekDates.push(date)
      }
    }
    
    setSelectedDates(prev => {
      // Verificar si toda la semana ya está seleccionada
      const weekAlreadySelected = weekDates.every(date =>
        prev.some(selected => selected.toDateString() === date.toDateString())
      )
      
      if (weekAlreadySelected) {
        // Deseleccionar la semana
        return prev.filter(selected =>
          !weekDates.some(weekDate => weekDate.toDateString() === selected.toDateString())
        )
      } else {
        // Seleccionar la semana (agregar fechas que no estén ya seleccionadas)
        const newDates = weekDates.filter(date =>
          !prev.some(selected => selected.toDateString() === date.toDateString())
        )
        return [...prev, ...newDates]
      }
    })
  }

  // Seleccionar mes completo
  const selectCurrentMonth = () => {
    const monthDates = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      monthDates.push(new Date(year, month, day))
    }
    
    setSelectedDates(prev => {
      // Verificar si todo el mes ya está seleccionado
      const monthAlreadySelected = monthDates.every(date =>
        prev.some(selected => selected.toDateString() === date.toDateString())
      )
      
      if (monthAlreadySelected) {
        // Deseleccionar el mes
        return prev.filter(selected =>
          !monthDates.some(monthDate => monthDate.toDateString() === selected.toDateString())
        )
      } else {
        // Seleccionar el mes completo
        return monthDates
      }
    })
  }

  // Limpiar selección
  const clearSelection = () => {
    setSelectedDates([])
  }

  // Verificar si una semana está completamente seleccionada
  const isWeekSelected = (startDate: Date) => {
    const weekDates = []
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay() + 1)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth() && 
                            date.getFullYear() === currentMonth.getFullYear()
      if (isCurrentMonth) {
        weekDates.push(date)
      }
    }
    
    return weekDates.length > 0 && weekDates.every(date =>
      selectedDates.some(selected => selected.toDateString() === date.toDateString())
    )
  }

  // Verificar si el mes está completamente seleccionado
  const isCurrentMonthSelected = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (!selectedDates.some(selected => selected.toDateString() === date.toDateString())) {
        return false
      }
    }
    return daysInMonth > 0
  }

  // Aplicar disponibilidad personalizada
  const applyCustomAvailability = () => {
    if (!selectedService || selectedDates.length === 0) return

    const newAvailability: CustomAvailability = {
      id: Date.now().toString(),
      type: availabilityType,
      startDate: new Date(Math.min(...selectedDates.map(d => d.getTime()))),
      endDate: new Date(Math.max(...selectedDates.map(d => d.getTime()))),
      reason: customReason || undefined,
      timeSlots: undefined // Solo marcamos cuando NO están disponibles
    }

    setServiceSchedules(prev => ({
      ...prev,
      [selectedService]: {
        ...prev[selectedService],
        customAvailability: [...prev[selectedService].customAvailability, newAvailability]
      }
    }))

    setSelectedDates([])
    setCustomReason("")
  }

  // Eliminar disponibilidad personalizada
  const removeCustomAvailability = (serviceId: string, availabilityId: string) => {
    setServiceSchedules(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        customAvailability: prev[serviceId].customAvailability.filter(
          availability => availability.id !== availabilityId
        )
      }
    }))
  }

  // Funciones para horario semanal
  const toggleDay = (serviceId: string, day: keyof WeeklySchedule) => {
    setServiceSchedules(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        weeklyTemplate: {
          ...prev[serviceId].weeklyTemplate,
          [day]: {
            ...prev[serviceId].weeklyTemplate[day],
            enabled: !prev[serviceId].weeklyTemplate[day].enabled,
            timeSlots: !prev[serviceId].weeklyTemplate[day].enabled ? 
              [{ start: "09:00", end: "18:00" }] : []
          }
        }
      }
    }))
  }

  const addTimeSlot = (serviceId: string, day: keyof WeeklySchedule) => {
    setServiceSchedules(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        weeklyTemplate: {
          ...prev[serviceId].weeklyTemplate,
          [day]: {
            ...prev[serviceId].weeklyTemplate[day],
            timeSlots: [...prev[serviceId].weeklyTemplate[day].timeSlots, { start: "09:00", end: "18:00" }]
          }
        }
      }
    }))
  }

  const removeTimeSlot = (serviceId: string, day: keyof WeeklySchedule, index: number) => {
    setServiceSchedules(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        weeklyTemplate: {
          ...prev[serviceId].weeklyTemplate,
          [day]: {
            ...prev[serviceId].weeklyTemplate[day],
            timeSlots: prev[serviceId].weeklyTemplate[day].timeSlots.filter((_, i) => i !== index)
          }
        }
      }
    }))
  }

  const updateTimeSlot = (serviceId: string, day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
    setServiceSchedules(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        weeklyTemplate: {
          ...prev[serviceId].weeklyTemplate,
          [day]: {
            ...prev[serviceId].weeklyTemplate[day],
            timeSlots: prev[serviceId].weeklyTemplate[day].timeSlots.map((slot, i) => 
              i === index ? { ...slot, [field]: value } : slot
            )
          }
        }
      }
    }))
  }

  // Copiar horario entre servicios
  const copyScheduleFromService = (fromServiceId: string, toServiceId: string) => {
    if (!serviceSchedules[fromServiceId] || !serviceSchedules[toServiceId]) return

    setServiceSchedules(prev => ({
      ...prev,
      [toServiceId]: {
        ...prev[toServiceId],
        weeklyTemplate: { ...prev[fromServiceId].weeklyTemplate }
      }
    }))
  }

  // Funciones para períodos personalizados
  const getDefaultWeeklySchedule = (): WeeklySchedule => ({
    monday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    tuesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    wednesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    thursday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    friday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] }
  })

  const handleStartNewPeriod = () => {
    setPeriodForm({
      name: '',
      startDate: '',
      endDate: '',
      weeklySchedule: getDefaultWeeklySchedule()
    })
    setEditingPeriod(null)
    setShowPeriodForm(true)
  }

  const handleEditPeriod = (periodId: string) => {
    const period = serviceSchedules[selectedService]?.customSchedulePeriods.find(p => p.id === periodId)
    if (!period) return

    setPeriodForm({
      name: period.name,
      startDate: period.startDate.toISOString().split('T')[0],
      endDate: period.endDate.toISOString().split('T')[0],
      weeklySchedule: { ...period.weeklySchedule }
    })
    setEditingPeriod(periodId)
    setShowPeriodForm(true)
  }

  const handleSavePeriod = () => {
    if (!selectedService || !periodForm.name || !periodForm.startDate || !periodForm.endDate) return

    const newPeriod: CustomSchedulePeriod = {
      id: editingPeriod || Date.now().toString(),
      name: periodForm.name,
      startDate: new Date(periodForm.startDate),
      endDate: new Date(periodForm.endDate),
      weeklySchedule: periodForm.weeklySchedule
    }

    setServiceSchedules(prev => ({
      ...prev,
      [selectedService]: {
        ...prev[selectedService],
        customSchedulePeriods: editingPeriod
          ? prev[selectedService].customSchedulePeriods.map(p => p.id === editingPeriod ? newPeriod : p)
          : [...prev[selectedService].customSchedulePeriods, newPeriod]
      }
    }))

    setShowPeriodForm(false)
    setPeriodForm({ name: '', startDate: '', endDate: '', weeklySchedule: getDefaultWeeklySchedule() })
    setEditingPeriod(null)
  }

  const handleCancelPeriod = () => {
    setShowPeriodForm(false)
    setPeriodForm({ name: '', startDate: '', endDate: '', weeklySchedule: getDefaultWeeklySchedule() })
    setEditingPeriod(null)
  }

  const handleRemovePeriod = (periodId: string) => {
    setServiceSchedules(prev => ({
      ...prev,
      [selectedService]: {
        ...prev[selectedService],
        customSchedulePeriods: prev[selectedService].customSchedulePeriods.filter(p => p.id !== periodId)
      }
    }))
  }

  const copyGeneralScheduleToPeriod = () => {
    if (!selectedService) return
    setPeriodForm(prev => ({
      ...prev,
      weeklySchedule: { ...serviceSchedules[selectedService].weeklyTemplate }
    }))
  }

  // Funciones para modificar el horario del período
  const togglePeriodDay = (day: keyof WeeklySchedule) => {
    setPeriodForm(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          enabled: !prev.weeklySchedule[day].enabled,
          timeSlots: !prev.weeklySchedule[day].enabled ? [{ start: "09:00", end: "18:00" }] : []
        }
      }
    }))
  }

  const addPeriodTimeSlot = (day: keyof WeeklySchedule) => {
    setPeriodForm(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: [...prev.weeklySchedule[day].timeSlots, { start: "09:00", end: "18:00" }]
        }
      }
    }))
  }

  const removePeriodTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    setPeriodForm(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.filter((_, i) => i !== index)
        }
      }
    }))
  }

  const updatePeriodTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
    setPeriodForm(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          timeSlots: prev.weeklySchedule[day].timeSlots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  if (enabledServices.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes servicios habilitados. Primero debes configurar y habilitar al menos un servicio en la pestaña de Servicios.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Gestión de Agenda por Servicio
          </CardTitle>
          <CardDescription>
            Configura tu disponibilidad de manera independiente para cada servicio que ofreces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Seleccionar Servicio</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un servicio para configurar" />
                </SelectTrigger>
                <SelectContent>
                  {enabledServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {service.categoryName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setViewMode(viewMode === 'calendar' ? 'weekly' : 'calendar')}
              >
                <Settings className="w-4 h-4 mr-2" />
                {viewMode === 'calendar' ? 'Vista Semanal' : 'Vista Calendario'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedService ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecciona un servicio para comenzar a configurar tu agenda.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'weekly' | 'custom-periods')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Horario General</TabsTrigger>
            <TabsTrigger value="custom-periods">Horarios Personalizados</TabsTrigger>
            <TabsTrigger value="calendar">Días No Disponibles</TabsTrigger>
          </TabsList>

          {/* Vista Calendario */}
          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    {serviceSchedules[selectedService]?.serviceName} - Días No Disponibles
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
                      {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Marca fechas específicas cuando NO puedas trabajar (vacaciones, enfermedad, eventos, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Explicación del sistema */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">¿Cómo funciona tu agenda?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Por defecto estás disponible</strong> según tu plantilla semanal</li>
                    <li>• <strong>Aquí solo marcas excepciones</strong> cuando NO puedes trabajar</li>
                    <li>• Selecciona fechas específicas y marca la razón de no disponibilidad</li>
                  </ul>
                </div>

                {/* Controles de no disponibilidad */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Razón de no disponibilidad (opcional)</Label>
                      <Input 
                        placeholder="Ej: Vacaciones, enfermedad, evento familiar..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={applyCustomAvailability}
                        disabled={selectedDates.length === 0}
                        className="w-full"
                        variant="destructive"
                      >
                        Marcar {selectedDates.length} día{selectedDates.length !== 1 ? 's' : ''} como NO disponible
                      </Button>
                    </div>
                  </div>

                  {/* Botones de selección rápida */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-medium mb-3 block">Selección Rápida</Label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectCurrentMonth}
                          className={isCurrentMonthSelected() ? "bg-red-100 border-red-300" : ""}
                        >
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {isCurrentMonthSelected() ? 'Quitar' : 'No trabajar'} Todo el Mes
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearSelection}
                          disabled={selectedDates.length === 0}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Limpiar Selección
                        </Button>

                        {selectedDates.length > 0 && (
                          <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {selectedDates.length} día{selectedDates.length !== 1 ? 's' : ''} seleccionado{selectedDates.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                        <strong>💡 Consejos:</strong> Usa el botón "S" para marcar semanas completas como no disponibles. 
                        Perfecto para vacaciones, viajes o períodos de inactividad. También puedes seleccionar días individuales.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendario */}
                <div className="border rounded-lg p-4 pl-16 relative">
                  {/* Etiqueta de semanas */}
                  <div className="absolute left-2 top-16 text-xs text-gray-500 transform -rotate-90 origin-center">
                    Semanas
                  </div>
                  
                  {/* Encabezados de días */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes con selección de semana */}
                  <div className="relative">
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map((day, index) => {
                        const isSelected = isDateSelected(day.date)
                        const customAvailability = getCustomAvailabilityForDate(day.date, selectedService)
                        const isToday = day.date.toDateString() === new Date().toDateString()
                        const isStartOfWeek = day.date.getDay() === 1 // Lunes
                        const currentWeekSelected = isStartOfWeek && isWeekSelected(day.date)
                        
                        return (
                          <div key={index} className="relative min-h-[40px]">
                            {/* Botón de selección de semana (solo los lunes) */}
                            {isStartOfWeek && day.isCurrentMonth && (
                              <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 z-20">
                                <Button
                                  variant={currentWeekSelected ? "destructive" : "outline"}
                                  size="sm"
                                  onClick={() => selectWeek(day.date)}
                                  className="w-8 h-8 p-0 text-xs"
                                  title={`${currentWeekSelected ? 'Quitar' : 'Marcar'} esta semana como no disponible`}
                                >
                                  {currentWeekSelected ? '✓' : 'S'}
                                </Button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => day.isCurrentMonth && handleDateSelect(day.date)}
                              disabled={!day.isCurrentMonth}
                              className={`
                                w-full h-10 text-sm rounded-md border transition-colors relative
                                ${!day.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                                ${isSelected ? 'bg-blue-500 text-white border-blue-500' : ''}
                                ${isToday && !isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                ${customAvailability?.type === 'unavailable' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                ${currentWeekSelected && !isSelected ? 'ring-1 ring-red-200' : ''}
                              `}
                            >
                              {day.date.getDate()}
                              {customAvailability && (
                                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Lista de períodos no disponibles */}
                {serviceSchedules[selectedService]?.customAvailability.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Períodos No Disponibles</h4>
                    <div className="space-y-2">
                      {serviceSchedules[selectedService].customAvailability.map(availability => (
                        <div key={availability.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive">
                              No disponible
                            </Badge>
                            <span className="text-sm">
                              {availability.startDate.toLocaleDateString()} - {availability.endDate.toLocaleDateString()}
                            </span>
                            {availability.reason && (
                              <span className="text-sm text-gray-600">({availability.reason})</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomAvailability(selectedService, availability.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar período no disponible"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista Semanal */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {serviceSchedules[selectedService]?.serviceName} - Horario General
                    </CardTitle>
                    <CardDescription>
                      Este es tu horario base que se aplica por defecto. Puedes crear excepciones en "Horarios Personalizados"
                    </CardDescription>
                  </div>
                  {enabledServices.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Copiar horario desde:</Label>
                      <Select onValueChange={(fromServiceId) => copyScheduleFromService(fromServiceId, selectedService)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Seleccionar servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {enabledServices
                            .filter(service => service.id !== selectedService)
                            .map(service => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.categoryName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {daysOfWeek.map(({ key, label }) => {
                  const daySchedule = serviceSchedules[selectedService]?.weeklyTemplate[key as keyof WeeklySchedule]
                  
                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={daySchedule?.enabled || false}
                            onCheckedChange={() => toggleDay(selectedService, key as keyof WeeklySchedule)}
                          />
                          <Label className="text-base">{label}</Label>
                          {daySchedule?.enabled && (
                            <Badge variant="outline" className="text-xs">
                              {daySchedule.timeSlots.length} horario{daySchedule.timeSlots.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        {daySchedule?.enabled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(selectedService, key as keyof WeeklySchedule)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Horario
                          </Button>
                        )}
                      </div>

                      {daySchedule?.enabled && (
                        <div className="space-y-3">
                          {daySchedule.timeSlots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateTimeSlot(selectedService, key as keyof WeeklySchedule, index, 'start', e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-gray-500">a</span>
                                <Input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateTimeSlot(selectedService, key as keyof WeeklySchedule, index, 'end', e.target.value)}
                                  className="w-32"
                                />
                              </div>
                              
                              {daySchedule.timeSlots.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(selectedService, key as keyof WeeklySchedule, index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vista Horarios Personalizados */}
          <TabsContent value="custom-periods" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      {serviceSchedules[selectedService]?.serviceName} - Horarios Personalizados
                    </CardTitle>
                    <CardDescription>
                      Crea horarios especiales para períodos específicos que reemplazarán tu horario general
                    </CardDescription>
                  </div>
                  <Button onClick={handleStartNewPeriod} disabled={showPeriodForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Período
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Explicación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">¿Cómo funcionan los horarios personalizados?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Horario General:</strong> Tu horario base configurado en la pestaña anterior</li>
                    <li>• <strong>Horarios Personalizados:</strong> Sobrescriben el horario general en fechas específicas</li>
                    <li>• <strong>Ejemplo:</strong> "Enero: 9-14h" mientras el resto del año trabajas 9-19h</li>
                  </ul>
                </div>

                {/* Formulario de nuevo/editar período */}
                {showPeriodForm && (
                  <Card className="mb-6 border-2 border-blue-300">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingPeriod ? 'Editar Período Personalizado' : 'Nuevo Período Personalizado'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Información del período */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Nombre del período</Label>
                          <Input
                            placeholder="Ej: Horario de Enero, Verano 2025..."
                            value={periodForm.name}
                            onChange={(e) => setPeriodForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Fecha inicio</Label>
                          <Input
                            type="date"
                            value={periodForm.startDate}
                            onChange={(e) => setPeriodForm(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Fecha fin</Label>
                          <Input
                            type="date"
                            value={periodForm.endDate}
                            onChange={(e) => setPeriodForm(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Botón para copiar horario general */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyGeneralScheduleToPeriod}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar desde Horario General
                        </Button>
                        <span className="text-sm text-gray-500">
                          Útil para hacer ajustes pequeños sobre tu horario base
                        </span>
                      </div>

                      <Separator />

                      {/* Horario semanal del período */}
                      <div>
                        <h4 className="font-medium mb-3">Horario de este período</h4>
                        <div className="space-y-4">
                          {daysOfWeek.map(({ key, label }) => {
                            const daySchedule = periodForm.weeklySchedule[key as keyof WeeklySchedule]
                            
                            return (
                              <div key={key} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={daySchedule?.enabled || false}
                                      onCheckedChange={() => togglePeriodDay(key as keyof WeeklySchedule)}
                                    />
                                    <Label className="text-base">{label}</Label>
                                    {daySchedule?.enabled && (
                                      <Badge variant="outline" className="text-xs">
                                        {daySchedule.timeSlots.length} horario{daySchedule.timeSlots.length !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {daySchedule?.enabled && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addPeriodTimeSlot(key as keyof WeeklySchedule)}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Agregar Horario
                                    </Button>
                                  )}
                                </div>

                                {daySchedule?.enabled && (
                                  <div className="space-y-3">
                                    {daySchedule.timeSlots.map((slot, index) => (
                                      <div key={index} className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="time"
                                            value={slot.start}
                                            onChange={(e) => updatePeriodTimeSlot(key as keyof WeeklySchedule, index, 'start', e.target.value)}
                                            className="w-32"
                                          />
                                          <span className="text-gray-500">a</span>
                                          <Input
                                            type="time"
                                            value={slot.end}
                                            onChange={(e) => updatePeriodTimeSlot(key as keyof WeeklySchedule, index, 'end', e.target.value)}
                                            className="w-32"
                                          />
                                        </div>
                                        
                                        {daySchedule.timeSlots.length > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePeriodTimeSlot(key as keyof WeeklySchedule, index)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={handleCancelPeriod}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSavePeriod}
                          disabled={!periodForm.name || !periodForm.startDate || !periodForm.endDate}
                        >
                          {editingPeriod ? 'Guardar Cambios' : 'Crear Período'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de períodos personalizados */}
                {!showPeriodForm && serviceSchedules[selectedService]?.customSchedulePeriods.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Períodos Configurados</h4>
                    {serviceSchedules[selectedService].customSchedulePeriods.map(period => (
                      <Card key={period.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h5 className="font-medium">{period.name}</h5>
                                <Badge variant="secondary">
                                  {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-7 gap-1 text-xs">
                                {daysOfWeek.map(({ key, label }) => {
                                  const day = period.weeklySchedule[key as keyof WeeklySchedule]
                                  return (
                                    <div key={key} className={`p-2 rounded ${day.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                                      <div className="font-medium text-center">{label.substring(0, 3)}</div>
                                      {day.enabled && day.timeSlots.length > 0 && (
                                        <div className="text-center mt-1">
                                          {day.timeSlots[0].start}-{day.timeSlots[0].end}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPeriod(period.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemovePeriod(period.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Mensaje cuando no hay períodos */}
                {!showPeriodForm && serviceSchedules[selectedService]?.customSchedulePeriods.length === 0 && (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-600 mb-2">No hay períodos personalizados</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Crea períodos con horarios especiales para fechas específicas
                    </p>
                    <Button onClick={handleStartNewPeriod}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Período
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Alertas */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Agenda guardada exitosamente. Tu disponibilidad está actualizada para todas las reservas futuras.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !selectedService} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Agenda'}
        </Button>
      </div>
    </div>
  )
}