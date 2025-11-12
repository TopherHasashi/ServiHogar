import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failure">("loading")

  // Parámetros que envía Mercado Pago
  // const _collection_id = searchParams.get("collection_id")
  const collection_status = searchParams.get("collection_status")
  const payment_id = searchParams.get("payment_id")
  const status_param = searchParams.get("status")
  // const _external_reference = searchParams.get("external_reference")
  // const _payment_type = searchParams.get("payment_type")
  // const _merchant_order_id = searchParams.get("merchant_order_id")
  // const _preference_id = searchParams.get("preference_id")

  useEffect(() => {
    // Determinar el estado basado en los parámetros
    const actualStatus = collection_status || status_param || ""
    if (actualStatus === "approved") {
      setStatus("success")
    } else if (actualStatus === "pending" || actualStatus === "in_process") {
      setStatus("pending")
    } else if (actualStatus === "rejected" || actualStatus === "cancelled") {
      setStatus("failure")
    }
  }, [collection_status, status_param])

  const goToRequests = () => {
    navigate("/cliente?tab=requests")
  }

  const goToHome = () => {
    navigate("/")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando estado del pago...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "success" && (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>¡Pago Exitoso!</span>
              </>
            )}
            {status === "pending" && (
              <>
                <Clock className="w-6 h-6 text-yellow-600" />
                <span>Pago Pendiente</span>
              </>
            )}
            {status === "failure" && (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <span>Pago Rechazado</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-gray-700">
                Tu pago ha sido procesado exitosamente. El profesional será notificado
                y podrás ver los detalles en "Mis Solicitudes".
              </p>
              {payment_id && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="text-gray-600">ID de pago: <span className="font-mono">{payment_id}</span></p>
                </div>
              )}
            </>
          )}

          {status === "pending" && (
            <>
              <p className="text-gray-700">
                Tu pago está siendo procesado. Recibirás una notificación cuando se
                complete. Esto puede tomar unos minutos.
              </p>
              {payment_id && (
                <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                  <p className="text-yellow-800">ID de pago: <span className="font-mono">{payment_id}</span></p>
                </div>
              )}
            </>
          )}

          {status === "failure" && (
            <>
              <p className="text-gray-700">
                No se pudo procesar tu pago. Por favor verifica tus datos e intenta
                nuevamente.
              </p>
              {payment_id && (
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <p className="text-red-800">ID de referencia: <span className="font-mono">{payment_id}</span></p>
                </div>
              )}
            </>
          )}

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
