import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Switch } from "../ui/switch"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  User,
  Shield,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign
} from "lucide-react"

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)

  // Datos de ejemplo de usuarios
  const users = [
    {
      id: 1,
      name: "María González",
      email: "maria.gonzalez@email.com",
      phone: "+56 9 8888 1111",
      type: "client",
      status: "active",
      location: "Santiago, Las Condes",
      joinDate: "2024-01-15",
      services: 12,
      totalSpent: 580000,
      rating: 4.8,
      verified: true
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      email: "carlos.mendoza@email.com",
      phone: "+56 9 8888 2222",
      type: "professional",
      status: "active",
      location: "Santiago, Providencia",
      joinDate: "2023-11-20",
      services: 127,
      totalEarned: 2840000,
      rating: 4.9,
      verified: true,
      specialty: "Gasfitería"
    },
    {
      id: 3,
      name: "Ana Silva",
      email: "ana.silva@email.com",
      phone: "+56 9 8888 3333",
      type: "client",
      status: "inactive",
      location: "Valparaíso, Viña del Mar",
      joinDate: "2024-02-28",
      services: 3,
      totalSpent: 120000,
      rating: 4.5,
      verified: false
    },
    {
      id: 4,
      name: "Roberto Fernández",
      email: "roberto.fernandez@email.com",
      phone: "+56 9 8888 4444",
      type: "professional",
      status: "pending",
      location: "Santiago, Ñuñoa",
      joinDate: "2024-03-10",
      services: 0,
      totalEarned: 0,
      rating: 0,
      verified: false,
      specialty: "Limpieza"
    }
  ]

  const getTypeColor = (type: string) => {
    return type === "professional" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || user.type === filterType
    const matchesStatus = filterStatus === "all" || user.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl">Gestión de Usuarios</h3>
          <p className="text-gray-600">Administra clientes y profesionales de la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea una nueva cuenta de cliente o profesional
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" placeholder="Nombre y apellido" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+56 9 8888 0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Usuario</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="professional">Profesional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" placeholder="Ciudad, Comuna" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsAddUserOpen(false)}>
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar usuarios por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="client">Clientes</SelectItem>
            <SelectItem value="professional">Profesionales</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl">{users.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="text-2xl">{users.filter(u => u.type === 'client').length}</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profesionales</p>
                <p className="text-2xl">{users.filter(u => u.type === 'professional').length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuarios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.type === 'professional' ? (
                      <Shield className="w-6 h-6 text-blue-500" />
                    ) : (
                      <User className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{user.name}</h4>
                      {user.verified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Desde {user.joinDate}
                        </span>
                        {user.type === 'professional' && user.specialty && (
                          <span>Especialidad: {user.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(user.type)}>
                        {user.type === 'professional' ? 'Profesional' : 'Cliente'}
                      </Badge>
                      <Badge variant="secondary" className={getStatusColor(user.status)}>
                        {user.status === 'active' ? 'Activo' : 
                         user.status === 'inactive' ? 'Inactivo' : 
                         user.status === 'pending' ? 'Pendiente' : 'Suspendido'}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {user.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {user.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {user.type === 'professional' ? 
                        `$${user.totalEarned?.toLocaleString()}` : 
                        `$${user.totalSpent?.toLocaleString()}`
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.services} servicios
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Eliminar" className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron usuarios que coincidan con los filtros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}