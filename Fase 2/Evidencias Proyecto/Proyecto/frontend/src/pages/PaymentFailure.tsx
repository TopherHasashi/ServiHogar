import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { XCircle } from "lucide-react"

export default function PaymentFailurePage() {
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
            <XCircle className="w-6 h-6 text-red-600" />
            <span>Pago Rechazado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            No se pudo procesar tu pago. Esto puede deberse a fondos insuficientes,
            datos incorrectos o problemas con el método de pago.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Qué puedes hacer?</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Verifica que tu tarjeta tenga fondos disponibles</li>
              <li>Revisa que los datos ingresados sean correctos</li>
              <li>Intenta con otro método de pago</li>
              <li>Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={goToRequests} className="flex-1">
              Volver a Intentar
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
