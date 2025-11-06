import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Clock } from "lucide-react"

export default function PaymentPendingPage() {
  const navigate = useNavigate()

  const goToRequests = () => {
    navigate("/cliente?tab=requests")
  }

  const goToHome = () => {
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span>Pago Pendiente</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            Tu pago está siendo procesado. Esto puede tomar algunos minutos u horas
            dependiendo del método de pago utilizado.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">¿Qué significa esto?</h3>
            <p className="text-sm text-yellow-800">
              Tu solicitud de pago fue recibida correctamente, pero aún está en proceso
              de verificación. Te notificaremos por email cuando se complete.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={goToRequests} className="flex-1">
              Ver Mis Solicitudes
            </Button>
            <Button onClick={goToHome} variant="outline" className="flex-1">
              Volver al Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
