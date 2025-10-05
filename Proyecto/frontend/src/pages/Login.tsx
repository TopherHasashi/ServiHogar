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

  const handleAdminLogin = () => {
    console.log('Acceso de administrador')
    // TODO: Redirigir al panel de administración
    navigate('/')
  }

  const handleVerifierLogin = () => {
    console.log('Acceso de verificador')
    // TODO: Redirigir al panel de verificación
    navigate('/')
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <UserAuth
      onLogin={handleLogin}
      onAdminLogin={handleAdminLogin}
      onVerifierLogin={handleVerifierLogin}
      onBack={handleBack}
    />
  )
}
