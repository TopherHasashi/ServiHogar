import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Alert, AlertDescription } from "../ui/alert"
import { Badge } from "../ui/badge"
import { apiGetAuth, apiPost, apiPutAuth, apiDeleteAuth } from "../../lib/api"
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

interface ServihogarBankAccount {
  id: string
  nombreIdentificador: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  rutTitular: string
  nombreTitular: string
  emailContacto?: string
  prioridad: number
  estado: string
  creadoEn?: string
  actualizadoEn?: string
}

export default function ServihogarBankAccountManager() {
  const [accounts, setAccounts] = useState<ServihogarBankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<ServihogarBankAccount>>({
    nombreIdentificador: "",
    banco: "",
    tipoCuenta: "",
    numeroCuenta: "",
    rutTitular: "",
    nombreTitular: "",
    emailContacto: "",
    prioridad: 2
  })

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

  const accountTypes = [
    { value: "Corriente", label: "Cuenta Corriente" },
    { value: "Vista", label: "Cuenta Vista" },
    { value: "Ahorro", label: "Cuenta de Ahorro" },
    { value: "RUT", label: "Cuenta RUT" }
  ]

  // Utilidad: formato de RUT chileno
  const formatRut = (value: string) => {
    // Limpia y aplica formato 12.345.678-9
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
    if (!clean) return ''
    if (clean.length === 1) return clean
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1)
    const reversed = body.split('').reverse().join('')
    const withDots = reversed.replace(/(\d{3})(?=\d)/g, '$1.')
    const bodyFormatted = withDots.split('').reverse().join('')
    return `${bodyFormatted}-${dv}`
  }

  const validateRut = (rut: string) => {
    // Calcula dígito verificador
    const clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()
    if (clean.length < 2) return false
    const body = clean.slice(0, -1)
    let dv = clean.slice(-1)
    let sum = 0
    let mul = 2
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul
      mul = mul === 7 ? 2 : mul + 1
    }
    const res = 11 - (sum % 11)
    let dvCalc = ''
    if (res === 11) dvCalc = '0'
    else if (res === 10) dvCalc = 'K'
    else dvCalc = String(res)
    return dv === dvCalc
  }

  // Cargar cuentas bancarias
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await apiGetAuth('/api/admin/bank-accounts/')
      setAccounts(data.accounts || [])
      setError(null)
    } catch (err: any) {
      console.error('Error cargando cuentas bancarias:', err)
      setError(err.message || 'Error cargando cuentas bancarias')
    } finally {
      setLoading(false)
    }
  }

  const handleStartAdd = () => {
    if (accounts.length >= 3) {
      setError("Máximo 3 cuentas bancarias permitidas")
      return
    }
    
    // La prioridad se asigna automáticamente según cuántas cuentas hay
    // 0 cuentas → prioridad 1 (principal)
    // 1 cuenta → prioridad 2 (respaldo 1)
    // 2 cuentas → prioridad 3 (respaldo 2)
    const nextPriority = accounts.length + 1
    
    setFormData({
      nombreIdentificador: "",
      banco: "",
      tipoCuenta: "",
      numeroCuenta: "",
      rutTitular: "",
      nombreTitular: "",
      emailContacto: "",
      prioridad: nextPriority
    })
    setIsAdding(true)
    setEditingId(null)
    setError(null)
  }

  const handleStartEdit = (account: ServihogarBankAccount) => {
    setFormData(account)
    setEditingId(account.id)
    setIsAdding(false)
    setError(null)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      nombreIdentificador: "",
      banco: "",
      tipoCuenta: "",
      numeroCuenta: "",
      rutTitular: "",
      nombreTitular: "",
      emailContacto: "",
      prioridad: 2
    })
    setError(null)
  }

  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.nombreIdentificador || !formData.banco || !formData.tipoCuenta || 
          !formData.numeroCuenta || !formData.rutTitular || !formData.nombreTitular) {
        setError("Todos los campos son requeridos excepto el email")
        return
      }

      setSaving(true)
      setError(null)

      if (editingId) {
        // Actualizar cuenta existente
        await apiPutAuth(`/api/admin/bank-accounts/${editingId}/`, formData)
      } else {
        // Crear nueva cuenta
        await apiPost('/api/admin/bank-accounts/create/', formData, { auth: true })
      }

      await loadAccounts()
      handleCancel()
    } catch (err: any) {
      console.error('Error guardando cuenta:', err)
      setError(err.message || 'Error guardando cuenta bancaria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm("¿Estás seguro de desactivar esta cuenta bancaria?")) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      await apiDeleteAuth(`/api/admin/bank-accounts/${accountId}/delete/`)
      await loadAccounts()
    } catch (err: any) {
      console.error('Error eliminando cuenta:', err)
      setError(err.message || 'Error eliminando cuenta bancaria')
    } finally {
      setSaving(false)
    }
  }

  const handleSetPrimary = async (accountId: string) => {
    try {
      setSaving(true)
      setError(null)
      
      // Encontrar la cuenta que será principal
      const newPrimaryAccount = accounts.find(acc => acc.id === accountId)
      if (!newPrimaryAccount) return
      
      // Reorganizar prioridades:
      // 1. La cuenta seleccionada pasa a prioridad 1
      // 2. La antigua principal pasa a prioridad 2
      // 3. La antigua prioridad 2 pasa a prioridad 3 (si existe)
      
      const updates = []
      
      // Actualizar cada cuenta según su nueva prioridad
      for (const account of accounts) {
        let newPriority = account.prioridad
        
        if (account.id === accountId) {
          // Esta será la nueva principal
          newPriority = 1
        } else if (account.prioridad === 1) {
          // La antigua principal baja a respaldo 1
          newPriority = 2
        } else if (account.prioridad === 2 && newPrimaryAccount.prioridad === 2) {
          // Si la nueva principal era respaldo 1, la antigua respaldo 1 baja a respaldo 2
          newPriority = 3
        } else if (account.prioridad === 3 && newPrimaryAccount.prioridad === 3) {
          // Si la nueva principal era respaldo 2, la antigua respaldo 2 sube a respaldo 1
          newPriority = 2
        }
        
        if (newPriority !== account.prioridad) {
          updates.push(
            apiPutAuth(`/api/admin/bank-accounts/${account.id}/`, { prioridad: newPriority })
          )
        }
      }
      
      // Ejecutar todas las actualizaciones
      await Promise.all(updates)
      await loadAccounts()
    } catch (err: any) {
      console.error('Error estableciendo cuenta principal:', err)
      setError(err.message || 'Error reorganizando prioridades de cuentas')
    } finally {
      setSaving(false)
    }
  }

  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber
    return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando cuentas bancarias...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Cuentas */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <Card key={account.id} className={account.prioridad === 1 ? "border-blue-500 border-2" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-lg">{account.nombreIdentificador}</h3>
                    {account.prioridad === 1 && (
                      <Badge className="bg-blue-600">
                        <Star className="w-3 h-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                    {account.prioridad === 2 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Respaldo 1
                      </Badge>
                    )}
                    {account.prioridad === 3 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Respaldo 2
                      </Badge>
                    )}
                    {account.estado === 'activa' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activa
                      </Badge>
                    )}
                    {account.estado === 'inactiva' && (
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Banco:</span>
                      <span className="ml-2 font-medium">{account.banco}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <span className="ml-2 font-medium">{account.tipoCuenta}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Número:</span>
                      <span className="ml-2 font-mono">{maskAccountNumber(account.numeroCuenta)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Titular:</span>
                      <span className="ml-2 font-medium">{account.nombreTitular}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">RUT:</span>
                      <span className="ml-2 font-mono">{account.rutTitular}</span>
                    </div>
                    {account.emailContacto && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2">{account.emailContacto}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {account.prioridad !== 1 && account.estado === 'activa' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPrimary(account.id)}
                      disabled={saving}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Hacer Principal
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEdit(account)}
                    disabled={saving || editingId !== null}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {account.prioridad !== 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(account.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && !isAdding && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No hay cuentas bancarias registradas</p>
                <p className="text-sm mt-1">Agrega la primera cuenta para comenzar</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulario de Agregar/Editar */}
      {(isAdding || editingId) && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}</CardTitle>
            <CardDescription>
              {editingId ? "Actualiza los datos de la cuenta" : "Completa la información de la nueva cuenta"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreIdentificador">Nombre Identificador *</Label>
                <Input
                  id="nombreIdentificador"
                  value={formData.nombreIdentificador}
                  onChange={(e) => setFormData({ ...formData, nombreIdentificador: e.target.value })}
                  placeholder="Ej: Cuenta Principal ServiHogar"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banco">Banco *</Label>
                <Select 
                  value={formData.banco} 
                  onValueChange={(value) => setFormData({ ...formData, banco: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {chileanBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCuenta">Tipo de Cuenta *</Label>
                <Select 
                  value={formData.tipoCuenta} 
                  onValueChange={(value) => setFormData({ ...formData, tipoCuenta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroCuenta">Número de Cuenta *</Label>
                <Input
                  id="numeroCuenta"
                  value={formData.numeroCuenta}
                  onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                  placeholder="Número de cuenta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rutTitular">RUT Titular *</Label>
                <Input
                  id="rutTitular"
                  value={formData.rutTitular}
                  onChange={(e) => setFormData({ ...formData, rutTitular: formatRut(e.target.value) })}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  className={
                    formData.rutTitular && formData.rutTitular.length >= 11
                      ? validateRut(formData.rutTitular)
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-red-500 focus:border-red-500'
                      : ''
                  }
                />
                {formData.rutTitular && formData.rutTitular.length >= 11 && !validateRut(formData.rutTitular) && (
                  <p className="text-sm text-red-600">RUT inválido</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreTitular">Nombre Titular *</Label>
                <Input
                  id="nombreTitular"
                  value={formData.nombreTitular}
                  onChange={(e) => setFormData({ ...formData, nombreTitular: e.target.value })}
                  placeholder="Nombre completo del titular"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailContacto">Email Contacto</Label>
                <Input
                  id="emailContacto"
                  type="email"
                  value={formData.emailContacto}
                  onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })}
                  placeholder="finanzas@servihogar.cl"
                />
              </div>
            </div>

            {/* Información de prioridad asignada automáticamente */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Prioridad:</strong> Esta cuenta será{' '}
                {formData.prioridad === 1 && <strong className="text-blue-900">Principal (1)</strong>}
                {formData.prioridad === 2 && <strong className="text-blue-900">Respaldo 1 (2)</strong>}
                {formData.prioridad === 3 && <strong className="text-blue-900">Respaldo 2 (3)</strong>}
                . Asignación automática según orden de creación. Puedes cambiarla después con el botón "Hacer Principal".
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingId ? "Actualizar" : "Guardar"}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón Agregar Nueva Cuenta */}
      {!isAdding && !editingId && accounts.length < 3 && (
        <Button onClick={handleStartAdd} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Nueva Cuenta
        </Button>
      )}

      {accounts.length >= 3 && !isAdding && !editingId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Has alcanzado el límite máximo de 3 cuentas bancarias. Elimina una cuenta existente para agregar una nueva.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
