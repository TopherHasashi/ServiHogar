import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Badge } from "../ui/badge"
import { 
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Loader2
} from "lucide-react"
import { apiGetAuth, apiPostAuth, apiPutAuth, apiDeleteAuth } from "../../lib/api"

interface BankAccount {
  id: string
  banco: string
  tipo_cuenta: "Corriente" | "Vista" | "Ahorro" | "RUT"
  numero_cuenta: string
  rut_titular: string
  nombre_titular: string
  email_contacto?: string
  prioridad: 1 | 2 | 3
  estado: "activa" | "inactiva" | "bloqueada"
  creado_en: string
  actualizado_en: string
}

interface FormData {
  banco: string
  tipo_cuenta: "Corriente" | "Vista" | "Ahorro" | "RUT" | ""
  numero_cuenta: string
  rut_titular: string
  nombre_titular: string
  email_contacto: string
  prioridad: 1 | 2 | 3
}

export default function ProfessionalBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    banco: "",
    tipo_cuenta: "",
    numero_cuenta: "",
    rut_titular: "",
    nombre_titular: "",
    email_contacto: "",
    prioridad: 1
  })

  console.log('ProfessionalBankAccounts rendered', { accounts, loading, error })

  // Bancos de Chile
  const chileanBanks = [
    "Banco de Chile",
    "Banco Estado",
    "Banco Santander",
    "Banco BCI",
    "Banco Scotiabank",
    "Banco Itaú",
    "Banco Security",
    "Banco Falabella",
    "Banco Ripley",
    "Banco Consorcio",
    "Banco Internacional",
    "Banco BICE",
    "Coopeuch",
    "Banco BBVA"
  ]

  const accountTypes: { value: "Corriente" | "Vista" | "Ahorro" | "RUT", label: string }[] = [
    { value: "Corriente", label: "Cuenta Corriente" },
    { value: "Vista", label: "Cuenta Vista" },
    { value: "Ahorro", label: "Cuenta de Ahorro" },
    { value: "RUT", label: "Cuenta RUT" }
  ]

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    console.log('Loading bank accounts...')
    try {
      setLoading(true)
      setError(null)
      const response = await apiGetAuth('/api/professional/bank-accounts/')
      console.log('Bank accounts response:', response)
      setAccounts(response.accounts || [])
    } catch (err: any) {
      console.error('Error loading bank accounts:', err)
      setError(err.message || 'Error al cargar las cuentas bancarias')
    } finally {
      setLoading(false)
    }
  }

  const handleStartAdd = () => {
    if (accounts.length >= 3) {
      return
    }
    
    // Determinar la prioridad disponible
    const usedPriorities = accounts.map(acc => acc.prioridad)
    let availablePriority: 1 | 2 | 3 = 1
    if (!usedPriorities.includes(1)) availablePriority = 1
    else if (!usedPriorities.includes(2)) availablePriority = 2
    else if (!usedPriorities.includes(3)) availablePriority = 3
    
    setFormData({
      banco: "",
      tipo_cuenta: "",
      numero_cuenta: "",
      rut_titular: "",
      nombre_titular: "",
      email_contacto: "",
      prioridad: availablePriority
    })
    setIsAdding(true)
    setEditingId(null)
    setError(null)
  }

  const handleStartEdit = (account: BankAccount) => {
    setFormData({
      banco: account.banco,
      tipo_cuenta: account.tipo_cuenta,
      numero_cuenta: account.numero_cuenta,
      rut_titular: account.rut_titular,
      nombre_titular: account.nombre_titular,
      email_contacto: account.email_contacto || "",
      prioridad: account.prioridad
    })
    setEditingId(account.id)
    setIsAdding(false)
    setError(null)
  }

  const handleSave = async () => {
    // Validaciones
    if (!formData.banco || !formData.tipo_cuenta || !formData.numero_cuenta || 
        !formData.rut_titular || !formData.nombre_titular) {
      setError("Por favor completa todos los campos obligatorios")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (editingId) {
        // Editar cuenta existente
        await apiPutAuth(`/api/professional/bank-accounts/${editingId}/`, formData)
      } else {
        // Agregar nueva cuenta
        await apiPostAuth('/api/professional/bank-accounts/create/', formData)
      }
      
      await loadAccounts()
      handleCancel()
    } catch (err: any) {
      console.error('Error saving bank account:', err)
      setError(err.message || 'Error al guardar la cuenta bancaria')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      banco: "",
      tipo_cuenta: "",
      numero_cuenta: "",
      rut_titular: "",
      nombre_titular: "",
      email_contacto: "",
      prioridad: 1
    })
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await apiDeleteAuth(`/api/professional/bank-accounts/${id}/delete/`)
      await loadAccounts()
    } catch (err: any) {
      console.error('Error deleting bank account:', err)
      setError(err.message || 'Error al eliminar la cuenta bancaria')
    } finally {
      setSaving(false)
    }
  }

  const formatAccountNumber = (number: string) => {
    // Ocultar dígitos del medio para seguridad
    if (number.length <= 4) return number
    const lastFour = number.slice(-4)
    return `****${lastFour}`
  }

  const getPriorityLabel = (prioridad: number) => {
    switch (prioridad) {
      case 1: return "Principal"
      case 2: return "Secundaria"
      case 3: return "Terciaria"
      default: return `Prioridad ${prioridad}`
    }
  }

  const getPriorityColor = (prioridad: number) => {
    switch (prioridad) {
      case 1: return "bg-green-600"
      case 2: return "bg-blue-600"
      case 3: return "bg-purple-600"
      default: return "bg-gray-600"
    }
  }

  // DEBUG: Renderizar siempre algo visible
  if (loading) {
    console.log('Rendering loading state')
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Mis Cuentas Bancarias
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Cargando cuentas bancarias...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('Rendering main component state')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Mis Cuentas Bancarias
        </CardTitle>
        <CardDescription>
          Gestiona las cuentas bancarias para recibir tus pagos (máximo 3 cuentas)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensajes de error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Alerta informativa */}
        {accounts.length === 0 && !isAdding && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Agrega al menos una cuenta bancaria para recibir pagos. Puedes agregar hasta 3 cuentas con diferentes prioridades.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de cuentas */}
        {accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.sort((a, b) => a.prioridad - b.prioridad).map((account) => (
              <div
                key={account.id}
                className={`p-4 border rounded-lg ${
                  account.prioridad === 1 ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{account.banco}</h4>
                      <Badge variant="default" className={getPriorityColor(account.prioridad)}>
                        {account.prioridad === 1 && <Star className="w-3 h-3 mr-1" />}
                        {getPriorityLabel(account.prioridad)}
                      </Badge>
                      <Badge variant={account.estado === "activa" ? "default" : "secondary"}>
                        {account.estado}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Tipo:</span>{" "}
                        {accountTypes.find(t => t.value === account.tipo_cuenta)?.label}
                      </p>
                      <p>
                        <span className="font-medium">Número:</span>{" "}
                        {formatAccountNumber(account.numero_cuenta)}
                      </p>
                      <p>
                        <span className="font-medium">Titular:</span>{" "}
                        {account.nombre_titular}
                      </p>
                      <p>
                        <span className="font-medium">RUT:</span>{" "}
                        {account.rut_titular}
                      </p>
                      {account.email_contacto && (
                        <p>
                          <span className="font-medium">Email:</span>{" "}
                          {account.email_contacto}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(account)}
                      disabled={saving}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar/editar */}
        {(isAdding || editingId) && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="font-medium">
              {editingId ? "Editar Cuenta Bancaria" : "Agregar Nueva Cuenta"}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select
                  value={formData.banco}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, banco: value }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {chileanBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Cuenta *</Label>
                <Select
                  value={formData.tipo_cuenta}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo_cuenta: value }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_cuenta">Número de Cuenta *</Label>
              <Input
                id="numero_cuenta"
                value={formData.numero_cuenta}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_cuenta: e.target.value }))}
                placeholder="Ej: 12345678901234"
                maxLength={50}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_titular">Nombre del Titular *</Label>
                <Input
                  id="nombre_titular"
                  value={formData.nombre_titular}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_titular: e.target.value }))}
                  placeholder="Ej: Juan Pérez Silva"
                  maxLength={200}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut_titular">RUT del Titular *</Label>
                <Input
                  id="rut_titular"
                  value={formData.rut_titular}
                  onChange={(e) => setFormData(prev => ({ ...prev, rut_titular: e.target.value }))}
                  placeholder="Ej: 12.345.678-9"
                  maxLength={12}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email de Contacto (opcional)</Label>
              <Input
                id="email_contacto"
                type="email"
                value={formData.email_contacto}
                onChange={(e) => setFormData(prev => ({ ...prev, email_contacto: e.target.value }))}
                placeholder="Ej: correo@example.com"
                maxLength={255}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridad *</Label>
              <Select
                value={formData.prioridad.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, prioridad: parseInt(value) as 1 | 2 | 3 }))}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Principal</SelectItem>
                  <SelectItem value="2">2 - Secundaria</SelectItem>
                  <SelectItem value="3">3 - Terciaria</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                La cuenta principal recibirá los pagos. Las secundarias son respaldo.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? "Guardar Cambios" : "Agregar Cuenta"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Botón para agregar nueva cuenta */}
        {!isAdding && !editingId && accounts.length < 3 && (
          <Button
            variant="outline"
            onClick={handleStartAdd}
            disabled={saving}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar {accounts.length === 0 ? "Cuenta Bancaria" : "Otra Cuenta"} 
            {accounts.length > 0 && ` (${accounts.length}/3)`}
          </Button>
        )}

        {/* Alerta de límite alcanzado */}
        {accounts.length >= 3 && !isAdding && !editingId && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite de 3 cuentas bancarias. Puedes editar o eliminar cuentas existentes.
            </AlertDescription>
          </Alert>
        )}

        {/* Información sobre cuenta principal */}
        {accounts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Sobre las Prioridades</p>
                <p className="text-blue-700">
                  Los pagos se procesan a tu cuenta principal (prioridad 1). Las cuentas secundaria y terciaria 
                  sirven como respaldo en caso de error o problemas con la cuenta principal.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
