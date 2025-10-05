import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle,
  AlertCircle
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



export default function ProfessionalScheduleManager() {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    tuesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    wednesday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    thursday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    friday: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] }
  })



  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  const toggleDay = (day: keyof WeeklySchedule) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        timeSlots: !prev[day].enabled ? [{ start: "09:00", end: "18:00" }] : []
      }
    }))
  }

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { start: "09:00", end: "18:00" }]
      }
    }))
  }

  const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index)
      }
    }))
  }

  const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
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



  return (
    <div className="space-y-6">
      {/* Horario Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Horario de Disponibilidad
          </CardTitle>
          <CardDescription>
            Configura tus días y horarios de trabajo semanales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const daySchedule = weeklySchedule[key as keyof WeeklySchedule]
            
            return (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={() => toggleDay(key as keyof WeeklySchedule)}
                    />
                    <Label className="text-base">{label}</Label>
                    {daySchedule.enabled && (
                      <Badge variant="outline" className="text-xs">
                        {daySchedule.timeSlots.length} horario{daySchedule.timeSlots.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  {daySchedule.enabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimeSlot(key as keyof WeeklySchedule)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Horario
                    </Button>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="space-y-3">
                    {daySchedule.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(key as keyof WeeklySchedule, index, 'start', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">a</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(key as keyof WeeklySchedule, index, 'end', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        
                        {daySchedule.timeSlots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(key as keyof WeeklySchedule, index)}
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

      {/* Alertas */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Horarios guardados exitosamente. Tu disponibilidad ya está actualizada para nuevas reservas.
          </AlertDescription>
        </Alert>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Horarios'}
        </Button>
      </div>
    </div>
  )
}