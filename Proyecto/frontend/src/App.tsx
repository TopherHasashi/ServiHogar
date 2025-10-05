import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from './lib/api'
import Hero from './components/Hero.tsx'
import Services from './components/Services'
import Benefits from './components/Benefits'
import HowItWorks from './components/HowItWorks'
import CustomerReviews from './components/CustomerReviews'
import Contact from './components/Contact'
import './App.css'

function App() {
  // const [count, setCount] = useState(0)
  const [apiStatus, setApiStatus] = useState<string>('...')
  const navigate = useNavigate()

  useEffect(() => {
    apiGet('/api/ping')
      .then((data) => setApiStatus(data?.status ?? 'unknown'))
      .catch((e) => setApiStatus(`error: ${e.message}`))
  }, [])

  return (
    <div>
      <Hero onAllServicesClick={() => navigate('/servicios')} onUserClick={() => navigate('/servicios')} />
  <Services onServiceClick={() => navigate('/servicios')} />
  <Benefits onUserClick={() => navigate('/servicios')} />
  <HowItWorks />
  <CustomerReviews />
      <Contact />
      <div className="max-w-7xl mx-auto px-4"><div className="py-6 text-sm text-gray-600">API status: {apiStatus}</div></div>
    </div>
  )
}

export default App
