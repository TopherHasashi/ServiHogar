import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"
import { Badge } from "./ui/badge"
import { 
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Save,
  X
} from "lucide-react"

interface BankAccount {
  id: string
  bankName: string
  accountType: string
  accountNumber: string
  accountHolderName: string
  accountHolderRut: string
  isPrimary: boolean
}

interface BankAccountManagerProps {
  title?: string
  description?: string
  maxAccounts?: number
  onAccountsChange?: (accounts: BankAccount[]) => void
}

export default function BankAccountManager({ 
  title = "Cuentas Bancarias",
  description = "Gestiona las cuentas bancarias para recibir pagos",
  maxAccounts = 3,
  onAccountsChange
}: BankAccountManagerProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bankName: "",
    accountType: "",
    accountNumber: "",
    accountHolderName: "",
    accountHolderRut: "",
    isPrimary: false
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
    { value: "corriente", label: "Cuenta Corriente" },
    { value: "vista", label: "Cuenta Vista" },
    { value: "ahorro", label: "Cuenta de Ahorro" },
    { value: "rut", label: "Cuenta RUT" }
  ]

  const handleStartAdd = () => {
    if (accounts.length >= maxAccounts) {
      return
    }
    setFormData({
      bankName: "",
      accountType: "",
      accountNumber: "",
      accountHolderName: "",
      accountHolderRut: "",
      isPrimary: accounts.length === 0 // Primera cuenta es principal por defecto
    })
    setIsAdding(true)
    setEditingId(null)
  }

  const handleStartEdit = (account: BankAccount) => {
    setFormData(account)
    setEditingId(account.id)
    setIsAdding(false)
  }

  const handleSave = () => {
    // Validaciones
    if (!formData.bankName || !formData.accountType || !formData.accountNumber || 
        !formData.accountHolderName || !formData.accountHolderRut) {
      alert("Por favor completa todos los campos")
      return
    }

    let updatedAccounts: BankAccount[]

    if (editingId) {
      // Editar cuenta existente
      updatedAccounts = accounts.map(acc => 
        acc.id === editingId 
          ? { ...formData, id: editingId } as BankAccount
          : acc
      )
    } else {
      // Agregar nueva cuenta
      const newAccount: BankAccount = {
        id: `acc-${Date.now()}`,
        ...formData as Omit<BankAccount, 'id'>
      }
      updatedAccounts = [...accounts, newAccount]
    }

    // Si se marca como principal, desmarcar las demás
    if (formData.isPrimary) {
      updatedAccounts = updatedAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === editingId || acc.id === `acc-${Date.now()}`
      }))
    }

    setAccounts(updatedAccounts)
    onAccountsChange?.(updatedAccounts)
    handleCancel()
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      bankName: "",
      accountType: "",
      accountNumber: "",
      accountHolderName: "",
      accountHolderRut: "",
      isPrimary: false
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) {
      return
    }

    const accountToDelete = accounts.find(acc => acc.id === id)
    let updatedAccounts = accounts.filter(acc => acc.id !== id)

    // Si se elimina la cuenta principal y hay otras cuentas, hacer la primera como principal
    if (accountToDelete?.isPrimary && updatedAccounts.length > 0) {
      updatedAccounts[0].isPrimary = true
    }

    setAccounts(updatedAccounts)
    onAccountsChange?.(updatedAccounts)
  }

  const handleSetPrimary = (id: string) => {
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isPrimary: acc.id === id
    }))
    setAccounts(updatedAccounts)
    onAccountsChange?.(updatedAccounts)
  }

  const formatAccountNumber = (number: string) => {
    // Ocultar dígitos del medio para seguridad
    if (number.length <= 4) return number
    const lastFour = number.slice(-4)
    return `****${lastFour}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta informativa */}
        {accounts.length === 0 && !isAdding && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Agrega al menos una cuenta bancaria para recibir pagos. Puedes agregar hasta {maxAccounts} cuentas.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de cuentas */}
        {accounts.length > 0 && (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`p-4 border rounded-lg ${
                  account.isPrimary ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{account.bankName}</h4>
                      {account.isPrimary && (
                        <Badge variant="default" className="bg-green-600">
                          <Star className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Tipo:</span>{" "}
                        {accountTypes.find(t => t.value === account.accountType)?.label}
                      </p>
                      <p>
                        <span className="font-medium">Número:</span>{" "}
                        {formatAccountNumber(account.accountNumber)}
                      </p>
                      <p>
                        <span className="font-medium">Titular:</span>{" "}
                        {account.accountHolderName}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!account.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(account.id)}
                        title="Marcar como principal"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(account)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      disabled={accounts.length === 1}
                      title={accounts.length === 1 ? "Debes tener al menos una cuenta" : "Eliminar cuenta"}
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
                  value={formData.bankName}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
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
                  value={formData.accountType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
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
              <Label htmlFor="accountNumber">Número de Cuenta *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Ej: 12345678901234"
                maxLength={20}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Nombre del Titular *</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Ej: Juan Pérez Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountHolderRut">RUT del Titular *</Label>
                <Input
                  id="accountHolderRut"
                  value={formData.accountHolderRut}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolderRut: e.target.value }))}
                  placeholder="Ej: 12.345.678-9"
                />
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-white rounded border">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPrimary" className="cursor-pointer">
                  Marcar como cuenta principal
                </Label>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingId ? "Guardar Cambios" : "Agregar Cuenta"}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Botón para agregar nueva cuenta */}
        {!isAdding && !editingId && accounts.length < maxAccounts && (
          <Button
            variant="outline"
            onClick={handleStartAdd}
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar {accounts.length === 0 ? "Cuenta Bancaria" : "Otra Cuenta"} 
            {accounts.length > 0 && ` (${accounts.length}/${maxAccounts})`}
          </Button>
        )}

        {/* Alerta de límite alcanzado */}
        {accounts.length >= maxAccounts && !isAdding && !editingId && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Has alcanzado el límite de {maxAccounts} cuentas bancarias. Puedes editar o eliminar cuentas existentes.
            </AlertDescription>
          </Alert>
        )}

        {/* Información sobre cuenta principal */}
        {accounts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Cuenta Principal</p>
                <p className="text-blue-700">
                  Los pagos se procesarán automáticamente a tu cuenta principal. 
                  Las cuentas adicionales sirven como respaldo en caso de error o cupo lleno.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
