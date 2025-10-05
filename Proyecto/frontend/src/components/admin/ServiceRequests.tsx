import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Search, Phone, Clock, User, Eye, CheckCircle, MapPin } from "lucide-react"

const serviceRequests = [
  {
    id: "REQ-001",
    client: "María González",
    phone: "+56 9 8888 1234",
    service: "Limpieza del Hogar",
    description: "Limpieza profunda de apartamento de 3 habitaciones",
    address: "Av. Providencia 1234, Providencia",
    date: "2024-01-15",
    time: "10:30 AM",
    status: "pending",
    priority: "normal",
    price: "$42.000"
  },
  {
    id: "REQ-002",
    client: "Carlos Ramírez",
    phone: "+56 9 7777 2345",
    service: "Gasfitería",
    description: "Reparación urgente de tubería rota en cocina",
    address: "Las Condes 567, Las Condes",
    date: "2024-01-15",
    time: "11:15 AM",
    status: "assigned",
    priority: "urgent",
    price: "$55.000",
    professional: "Juan Pérez"
  },
  {
    id: "REQ-003",
    client: "Ana Flores",
    phone: "+56 9 6666 3456",
    service: "Jardinería",
    description: "Poda de árboles y mantenimiento de jardín",
    address: "Av. Ñuñoa 890, Ñuñoa",
    date: "2024-01-15",
    time: "2:00 PM",
    status: "in-progress",
    priority: "normal",
    price: "$50.000",
    professional: "Luis García"
  },
  {
    id: "REQ-004",
    client: "Roberto Silva",
    phone: "+56 9 5555 4567",
    service: "Gasfitería",
    description: "Instalación de nueva ducha eléctrica",
    address: "Calle Las Flores 345, La Florida",
    date: "2024-01-14",
    time: "9:45 AM",
    status: "completed",
    priority: "normal",
    price: "$70.000",
    professional: "Miguel Torres"
  },
  {
    id: "REQ-005",
    client: "Carmen López",
    phone: "+56 9 4444 5678",
    service: "Limpieza del Hogar",
    description: "Limpieza post-construcción de oficina",
    address: "Av. Vitacura 1200, Vitacura",
    date: "2024-01-15",
    time: "8:00 AM",
    status: "pending",
    priority: "normal",
    price: "$85.000"
  }
]

const professionals = [
  { id: "1", name: "Juan Pérez", specialty: "Gasfitería", status: "available" },
  { id: "2", name: "Luis García", specialty: "Jardinería", status: "busy" },
  { id: "3", name: "Miguel Torres", specialty: "Gasfitería", status: "available" },
  { id: "4", name: "Carmen Ruiz", specialty: "Limpieza", status: "available" }
]

export default function ServiceRequests() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "assigned":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Asignado</Badge>
      case "in-progress":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">En Progreso</Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completado</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    return priority === "urgent" ? (
      <Badge variant="destructive" className="text-xs">Urgente</Badge>
    ) : (
      <Badge variant="outline" className="text-xs">Normal</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Solicitudes</CardTitle>
          <CardDescription>
            Administra todas las solicitudes de servicio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar por cliente, servicio o dirección..."
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
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="assigned">Asignado</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                <SelectItem value="gasfiteria">Gasfitería</SelectItem>
                <SelectItem value="limpieza">Limpieza</SelectItem>
                <SelectItem value="jardineria">Jardinería</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">{request.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.client}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {request.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.service}</div>
                      {request.professional && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.professional}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.date}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {request.time}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                  <TableCell className="font-medium">{request.price}</TableCell>
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
                            <DialogTitle>Detalles de Solicitud - {request.id}</DialogTitle>
                            <DialogDescription>
                              Información completa de la solicitud de servicio
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label>Cliente</Label>
                                <div className="font-medium">{request.client}</div>
                                <div className="text-sm text-gray-500">{request.phone}</div>
                              </div>
                              <div>
                                <Label>Servicio</Label>
                                <div className="font-medium">{request.service}</div>
                              </div>
                              <div>
                                <Label>Fecha y Hora</Label>
                                <div className="font-medium">{request.date} - {request.time}</div>
                              </div>
                              <div>
                                <Label>Estado</Label>
                                <div className="mt-1">{getStatusBadge(request.status)}</div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label>Dirección</Label>
                                <div className="font-medium flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-1" />
                                  {request.address}
                                </div>
                              </div>
                              <div>
                                <Label>Descripción</Label>
                                <div className="text-sm">{request.description}</div>
                              </div>
                              <div>
                                <Label>Precio</Label>
                                <div className="font-medium text-lg text-green-600">{request.price}</div>
                              </div>
                              {request.professional && (
                                <div>
                                  <Label>Profesional Asignado</Label>
                                  <div className="font-medium">{request.professional}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {request.status === "pending" && (
                            <div className="mt-6 space-y-4">
                              <Label>Asignar Profesional</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar profesional disponible" />
                                </SelectTrigger>
                                <SelectContent>
                                  {professionals
                                    .filter(p => p.status === "available")
                                    .map((professional) => (
                                      <SelectItem key={professional.id} value={professional.id}>
                                        {professional.name} - {professional.specialty}
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                              <div className="flex gap-2">
                                <Button className="flex-1">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Asignar Profesional
                                </Button>
                                <Button variant="outline">
                                  <Phone className="w-4 h-4 mr-2" />
                                  Llamar Cliente
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {request.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-green-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      
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