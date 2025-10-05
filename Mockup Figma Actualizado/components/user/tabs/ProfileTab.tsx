import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { 
  User,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

interface ProfileTabProps {
  user: any
  onUpdateUser: (userData: any) => void
}

export default function ProfileTab({ user, onUpdateUser }: ProfileTabProps) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [tempUserData, setTempUserData] = useState<any>({})

  // Regiones de Chile
  const regions = [
    "Región Metropolitana",
    "Región de Valparaíso", 
    "Región del Biobío",
    "Región de la Araucanía",
    "Región de Los Lagos",
    "Región de Antofagasta",
    "Región de Atacama",
    "Región de Coquimbo",
    "Región del Libertador",
    "Región del Maule",
    "Región de Aysén",
    "Región de Magallanes",
    "Región de Arica y Parinacota",
    "Región de Tarapacá",
    "Región de Ñuble"
  ]

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

  const getAvailableCommunes = () => {
    if (!tempUserData.region) return []
    return regionsAndCommunes[tempUserData.region as keyof typeof regionsAndCommunes] || []
  }

  const handleStartEditUserProfile = () => {
    setTempUserData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      region: user.region || "",
      commune: user.commune || ""
    })
    setEditingProfile(true)
  }

  const handleUpdateUserData = () => {
    onUpdateUser(tempUserData)
    setEditingProfile(false)
    setTempUserData({})
  }

  const handleCancelUserEdit = () => {
    setEditingProfile(false)
    setTempUserData({})
  }

  const handleRegionChange = (value: string) => {
    setTempUserData(prev => ({
      ...prev,
      region: value,
      commune: "" // Limpiar comuna cuando cambia región
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Mi Perfil
        </CardTitle>
        <CardDescription>
          Gestiona tu información personal y preferencias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar y información básica */}
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xl">
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              {user.isProfessional ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Profesional Verificado
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Cliente
                </span>
              )}
            </div>
          </div>
        </div>

        {editingProfile ? (
          /* Modo edición */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={tempUserData.name}
                  onChange={(e) => setTempUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={tempUserData.email}
                  onChange={(e) => setTempUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={tempUserData.phone}
                  onChange={(e) => setTempUserData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: +56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={tempUserData.address}
                  onChange={(e) => setTempUserData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Ej: Av. Principal 123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Región</Label>
                <Select value={tempUserData.region} onValueChange={handleRegionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una región" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comuna</Label>
                <Select 
                  value={tempUserData.commune} 
                  onValueChange={(value) => setTempUserData(prev => ({ ...prev, commune: value }))}
                  disabled={!tempUserData.region}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una comuna" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableCommunes().map((commune) => (
                      <SelectItem key={commune} value={commune}>
                        {commune}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateUserData} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={handleCancelUserEdit} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          /* Modo visualización */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Correo electrónico</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Teléfono</p>
                      <p>{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dirección</p>
                      <p>{user.address}</p>
                      {user.commune && user.region && (
                        <p className="text-sm text-gray-500">{user.commune}, {user.region}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleStartEditUserProfile} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Perfil
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="border-t pt-6">
          <h4 className="font-medium mb-3">Información de la cuenta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fecha de registro:</span>
              <span className="ml-2">Enero 2024</span>
            </div>
            <div>
              <span className="text-gray-500">Último acceso:</span>
              <span className="ml-2">Hace 2 horas</span>
            </div>
            <div>
              <span className="text-gray-500">Estado de verificación:</span>
              <span className="ml-2 text-green-600">Verificado</span>
            </div>
            <div>
              <span className="text-gray-500">Tipo de cuenta:</span>
              <span className="ml-2">{user.isProfessional ? "Profesional" : "Cliente"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}