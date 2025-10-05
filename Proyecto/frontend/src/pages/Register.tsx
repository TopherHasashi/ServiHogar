import { useState } from 'react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { apiPost, saveTokens } from '../lib/api'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('')
  const [phone, setPhone] = useState('')
  const [password2, setPassword2] = useState('')
  const [accept, setAccept] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (password !== password2) throw new Error('Las contraseñas no coinciden')
      if (!accept) throw new Error('Debes aceptar los términos y la privacidad')
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
        phone,
      }
      const data = await apiPost('/api/auth/register/', payload)
      saveTokens({ access: data.access, refresh: data.refresh })
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar. Revisa los datos ingresados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Crear cuenta</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Apellido</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contraseña</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmar contraseña</label>
          <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Teléfono (opcional)</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Rol</label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="profesional">Profesional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Checkbox checked={accept} onCheckedChange={(v) => setAccept(Boolean(v))} />
          <span>
            Acepto los <a href="/terminos" className="text-primary underline">Términos y Condiciones</a> y la <a href="/privacidad" className="text-primary underline">Política de Privacidad</a>
          </span>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={loading || !accept}>{loading ? 'Creando...' : 'Crear cuenta'}</Button>
      </form>
      <p className="text-sm text-gray-600 mt-4">¿Ya tienes una cuenta? <a href="/login" className="text-primary underline">Inicia sesión</a></p>
    </div>
  )
}
