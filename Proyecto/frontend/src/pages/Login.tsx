import { useNavigate } from 'react-router-dom'
import UserAuth from '../components/user/UserAuth'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleLogin = (user: any) => {
    console.log('Usuario logueado:', user)
    // TODO: Integrar con el sistema de autenticación global
    // Por ahora, simplemente redirigir al inicio
    navigate('/')
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <UserAuth onLogin={handleLogin} onBack={handleBack} />
  )
}
