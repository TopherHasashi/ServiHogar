import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Badge } from "../../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import ServiceBooking from "../ServiceBooking"
import { 
  Search, 
  MapPin, 
  Star,
  Filter,
  CheckCircle,
  Wrench,
  Home,
  Scissors
} from "lucide-react"

interface SearchTabProps {
  professionals: any[]
  user?: any
  onServiceSelect?: (professional: any) => void
}

export default function SearchTab({ professionals, user, onServiceSelect }: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAgeRange, setSelectedAgeRange] = useState("")
  const [showServiceBooking, setShowServiceBooking] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)

  // Función para convertir minutos a formato de horas
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (mins === 0) {
      return `${hours}h`
    } else {
      return `${hours}h${mins}min`
    }
  }

  // Servicios disponibles
  const services = [
    { id: "gasfiteria", name: "Gasfitería", icon: Wrench },
    { id: "limpieza", name: "Limpieza del Hogar", icon: Home },
    { id: "jardineria", name: "Jardinería", icon: Scissors }
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

  const handleBookService = (professional: any) => {
    setSelectedProfessional(professional)
    setShowServiceBooking(true)
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
          console.log('Reserva completada:', booking)
          setShowServiceBooking(false)
          setSelectedProfessional(null)
          // Aquí podrías actualizar el estado global o redirigir
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Layout responsivo */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar de filtros */}
        <div className="w-full lg:w-80 lg:flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 lg:space-y-4">
              {/* Filtro por Servicio */}
              <div className="space-y-2">
                <Label>Servicio</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los servicios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    <SelectItem value="Gasfitería">Gasfitería</SelectItem>
                    <SelectItem value="Limpieza del Hogar">Limpieza del Hogar</SelectItem>
                    <SelectItem value="Jardinería">Jardinería</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Región */}
              <div className="space-y-2">
                <Label>Región</Label>
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

              {/* Filtro por Comuna */}
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Select 
                  value={selectedCommune} 
                  onValueChange={setSelectedCommune}
                  disabled={!selectedRegion || selectedRegion === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las comunas" />
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

              {/* Filtro por Calificación */}
              <div className="space-y-2">
                <Label>Calificación mínima</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier calificación</SelectItem>
                    <SelectItem value="5">5 estrellas (4.8+)</SelectItem>
                    <SelectItem value="4">4+ estrellas</SelectItem>
                    <SelectItem value="3">3+ estrellas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Rango de Precio */}
              <div className="space-y-2">
                <Label>Rango de precio</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cualquier precio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier precio</SelectItem>
                    <SelectItem value="low">$10.000 - $20.000</SelectItem>
                    <SelectItem value="medium">$20.001 - $30.000</SelectItem>
                    <SelectItem value="high">$30.001+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Género */}
              <div className="space-y-2">
                <Label>Género</Label>
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

              {/* Filtro por Rango de Edad */}
              <div className="space-y-2">
                <Label>Rango de edad</Label>
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
            </CardContent>
          </Card>
        </div>

        {/* Área principal - Lista de profesionales */}
        <div className="flex-1">
          {filteredProfessionals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  No se encontraron profesionales
                </h3>
                <p className="text-sm sm:text-base text-gray-500 text-center">
                  Intenta ajustar los filtros de búsqueda para obtener más resultados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm sm:text-base text-gray-600">
                  {filteredProfessionals.length} profesional{filteredProfessionals.length !== 1 ? 'es' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid gap-3 sm:gap-4">
                {filteredProfessionals.map((professional) => (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Avatar y verificación */}
                        <div className="flex-shrink-0 self-center sm:self-start">
                          <div className="relative">
                            <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                              <AvatarImage src={professional.avatar} alt={professional.name} />
                              <AvatarFallback>
                                {professional.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {professional.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
                            <div className="mb-2 sm:mb-0">
                              <h3 className="text-base sm:text-lg font-semibold">{professional.name}</h3>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{professional.location}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="self-start text-xs">{professional.service}</Badge>
                          </div>

                          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                            {professional.description}
                          </p>

                          {/* Calificación y reseñas */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-sm">{professional.rating}</span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                ({professional.reviews} reseñas)
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              {professional.experience} de experiencia
                            </div>
                          </div>

                          {/* Precio y botón de acción */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <span className="text-lg sm:text-2xl font-bold text-green-600">
                                ${professional.basePrice.toLocaleString()}
                              </span>
                              {professional.durationType === "range" && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.minDuration)}-{formatDuration(professional.maxDuration)}
                                </p>
                              )}
                              {professional.durationType === "fixed" && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.fixedDuration)}
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleBookService(professional)}
                              className="px-4 sm:px-6 w-full sm:w-auto"
                              size="sm"
                            >
                              <span className="sm:hidden">Reservar</span>
                              <span className="hidden sm:inline">Reservar Servicio</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}