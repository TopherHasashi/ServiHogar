import { useNavigate } from 'react-router-dom'
import UserAuth from '../components/user/UserAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const handleLogin = () => navigate('/')
  const handleBack = () => navigate('/')
  return <UserAuth onLogin={handleLogin} onBack={handleBack} initialTab="register" />
}
