import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Search, Phone, Mail, MapPin, Star, Calendar, Plus, Eye, Edit, UserCheck, UserX } from "lucide-react"

const professionals = [
  {
    id: "PROF-001",
    name: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "+56 9 8888 1111",
    specialty: "Gasfitería",
    experience: "5 años",
    rating: 4.8,
    totalJobs: 156,
    status: "available",
    district: "Las Condes",
    joinDate: "2023-03-15",
    certifications: ["Certificado INACAP", "Manejo de Gas Natural"],
    avatar: "JP"
  },
  {
    id: "PROF-002",
    name: "María García",
    email: "maria.garcia@email.com",
    phone: "+56 9 7777 2222",
    specialty: "Limpieza",
    experience: "3 años",
    rating: 4.9,
    totalJobs: 203,
    status: "busy",
    district: "Providencia",
    joinDate: "2023-06-20",
    certifications: ["Manejo de Químicos", "Limpieza Hospitalaria"],
    avatar: "MG"
  },
  {
    id: "PROF-003",
    name: "Luis Torres",
    email: "luis.torres@email.com",
    phone: "+56 9 6666 3333",
    specialty: "Jardinería",
    experience: "7 años",
    rating: 4.7,
    totalJobs: 189,
    status: "available",
    district: "Ñuñoa",
    joinDate: "2022-11-10",
    certifications: ["Paisajismo", "Manejo de Pesticidas"],
    avatar: "LT"
  },
  {
    id: "PROF-004",
    name: "Carmen Ruiz",
    email: "carmen.ruiz@email.com",
    phone: "+56 9 5555 4444",
    specialty: "Limpieza",
    experience: "4 años",
    rating: 4.6,
    totalJobs: 134,
    status: "available",
    district: "La Florida",
    joinDate: "2023-01-08",
    certifications: ["Limpieza Profunda", "Desinfección"],
    avatar: "CR"
  },
  {
    id: "PROF-005",
    name: "Roberto Silva",
    email: "roberto.silva@email.com",
    phone: "+56 9 4444 5555",
    specialty: "Gasfitería",
    experience: "6 años",
    rating: 4.5,
    totalJobs: 167,
    status: "inactive",
    district: "Vitacura",
    joinDate: "2022-08-25",
    certifications: ["Soldadura", "Sistemas de Presión"],
    avatar: "RS"
  }
]

export default function ProfessionalManagement() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Disponible</Badge>
      case "busy":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ocupado</Badge>
      case "inactive":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Inactivo</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getSpecialtyColor = (specialty: string) => {
    switch (specialty) {
      case "Gasfitería":
        return "bg-blue-100 text-blue-800"
      case "Limpieza":
        return "bg-purple-100 text-purple-800"
      case "Jardinería":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestión de Profesionales</CardTitle>
              <CardDescription>
                Administra el equipo de profesionales de ServiHogar
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Profesional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Profesional</DialogTitle>
                  <DialogDescription>
                    Completa la información del nuevo profesional
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input placeholder="Nombre y apellidos" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@ejemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+56 9 8888 7777" />
                  </div>
                  <div className="space-y-2">
                    <Label>Especialidad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                        <SelectItem value="limpieza">Limpieza</SelectItem>
                        <SelectItem value="jardineria">Jardinería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Años de Experiencia</Label>
                    <Input type="number" placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Comuna de Trabajo</Label>
                    <Input placeholder="Comuna principal" />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1">Agregar Profesional</Button>
                  <Button variant="outline">Cancelar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar por nombre, email o especialidad..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="busy">Ocupado</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                <SelectItem value="limpieza">Limpieza</SelectItem>
                <SelectItem value="jardineria">Jardinería</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profesionales</p>
                <p className="text-2xl">32</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl text-green-600">24</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupados</p>
                <p className="text-2xl text-yellow-600">6</p>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calificación Promedio</p>
                <p className="text-2xl">4.7★</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professionals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Trabajos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Distrito</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="" alt={professional.name} />
                        <AvatarFallback>{professional.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{professional.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {professional.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {professional.phone}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getSpecialtyColor(professional.specialty)}>
                      {professional.specialty}
                    </Badge>
                  </TableCell>
                  <TableCell>{professional.experience}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{professional.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{professional.totalJobs}</TableCell>
                  <TableCell>{getStatusBadge(professional.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {professional.district}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Perfil de {professional.name}</DialogTitle>
                            <DialogDescription>
                              Información detallada del profesional
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src="" alt={professional.name} />
                                  <AvatarFallback className="text-lg">{professional.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg">{professional.name}</h3>
                                  <p className="text-sm text-gray-500">{professional.id}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label>Información de Contacto</Label>
                                <div className="space-y-1 mt-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="w-4 h-4" />
                                    {professional.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4" />
                                    {professional.phone}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    {professional.district}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label>Estado Actual</Label>
                                <div className="mt-1">{getStatusBadge(professional.status)}</div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label>Especialidad y Experiencia</Label>
                                <div className="mt-1">
                                  <Badge variant="secondary" className={getSpecialtyColor(professional.specialty)}>
                                    {professional.specialty}
                                  </Badge>
                                  <p className="text-sm text-gray-600 mt-1">{professional.experience} de experiencia</p>
                                </div>
                              </div>

                              <div>
                                <Label>Estadísticas</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div className="text-center p-2 border rounded">
                                    <div className="text-lg">{professional.rating}★</div>
                                    <div className="text-xs text-gray-500">Calificación</div>
                                  </div>
                                  <div className="text-center p-2 border rounded">
                                    <div className="text-lg">{professional.totalJobs}</div>
                                    <div className="text-xs text-gray-500">Trabajos</div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label>Certificaciones</Label>
                                <div className="space-y-1 mt-1">
                                  {professional.certifications.map((cert, index) => (
                                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                                      {cert}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label>Fecha de Ingreso</Label>
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  <Calendar className="w-4 h-4" />
                                  {professional.joinDate}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-6">
                            <Button className="flex-1">
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Profesional
                            </Button>
                            <Button variant="outline">
                              <Phone className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>
                            {professional.status === "available" ? (
                              <Button variant="outline">
                                <UserX className="w-4 h-4 mr-2" />
                                Desactivar
                              </Button>
                            ) : (
                              <Button variant="outline">
                                <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                                Activar
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button size="sm" variant="ghost" className="text-blue-600">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}