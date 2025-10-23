import { useNavigate } from 'react-router-dom'
import AllServices from '../components/AllServices'

export default function ServiciosPage() {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/')
  }

  const handleServiceSelect = (professional: any) => {
    // Navigate to service booking page or show service details
    console.log('Selected professional:', professional)
    // TODO: Implement navigation to booking page
  }

  return (
    <AllServices 
      onBack={handleBack}
      onServiceSelect={handleServiceSelect}
    />
  )
}
