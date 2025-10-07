import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Separator } from "./ui/separator"
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Star,
  Filter,
  CheckCircle,
  Wrench,
  Home,
  Scissors
} from "lucide-react"

interface AllServicesProps {
  onBack: () => void
  onServiceSelect: (professional: any) => void
}

export default function AllServices({ onBack, onServiceSelect }: AllServicesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [selectedCommune, setSelectedCommune] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [rating, setRating] = useState("")
  const [selectedGender, setSelectedGender] = useState("")
  const [selectedAgeRange, setSelectedAgeRange] = useState("")

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base p-2 sm:p-3">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver al inicio</span>
                <span className="sm:hidden">Volver</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-xl truncate">Buscar Profesionales</h1>
              <Badge variant="outline" className="hidden sm:inline-flex">ServiHogar</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda arriba */}
        <Card className="mb-6">
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
              <CardContent className="space-y-4">
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

          {/* Contenido principal - Lista de profesionales */}
          <div className="flex-1">
            {/* Contador de resultados */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredProfessionals.length} profesional{filteredProfessionals.length !== 1 ? 'es' : ''} encontrado{filteredProfessionals.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Lista de profesionales */}
            <div className="grid gap-4">
              {filteredProfessionals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No se encontraron profesionales
                    </h3>
                    <p className="text-gray-500 text-center">
                      Intenta ajustar los filtros de búsqueda para obtener más resultados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredProfessionals.map((professional) => (
                  <Card key={professional.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        {/* Avatar y verificación */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <Avatar className="w-20 h-20">
                              <AvatarImage src={professional.avatar} alt={professional.name} />
                              <AvatarFallback>
                                {professional.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {professional.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{professional.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span>{professional.location}</span>
                              </div>
                            </div>
                            <Badge variant="secondary">{professional.service}</Badge>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {professional.description}
                          </p>

                          {/* Calificación y reseñas */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{professional.rating}</span>
                              <span className="text-sm text-gray-500">
                                ({professional.reviews} reseñas)
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {professional.experience} de experiencia
                            </div>
                          </div>

                          {/* Precio y botón de acción */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-2xl font-bold text-green-600">
                                ${professional.basePrice.toLocaleString()}
                              </span>
                              {professional.durationType === "range" && (
                                <p className="text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.minDuration)}-{formatDuration(professional.maxDuration)}
                                </p>
                              )}
                              {professional.durationType === "fixed" && (
                                <p className="text-sm text-gray-500">
                                  Duración estimada: {formatDuration(professional.fixedDuration)}
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => onServiceSelect(professional)}
                              className="px-6"
                            >
                              Ver Servicio
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
      </div>
    </div>
  )
}