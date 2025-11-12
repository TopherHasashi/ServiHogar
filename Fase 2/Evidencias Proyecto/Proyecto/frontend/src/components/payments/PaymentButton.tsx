import { useState } from "react"
import { Button } from "../ui/button"
import { Alert, AlertDescription } from "../ui/alert"
import { apiPost, apiGetAuth } from "../../lib/api"
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react"

interface PaymentButtonProps {
  requestId: string
  amount: number
  serviceName: string
  professionalName: string
  onPaymentInitiated?: () => void
  onPaymentCompleted?: () => void
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export default function PaymentButton({
  requestId,
  amount,
  serviceName: _serviceName,
  professionalName: _professionalName,
  onPaymentInitiated,
  onPaymentCompleted,
  variant = "default",
  size = "default",
  className = "",
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      // Crear preferencia de pago
      const response = await apiPost(
        `/api/payments/create/${requestId}/`,
        {},
        { auth: true }
      )

      if (!response.ok || !response.init_point) {
        throw new Error("No se pudo crear la preferencia de pago")
      }

      // Notificar que se inició el pago
      onPaymentInitiated?.()

      // Redirigir a Mercado Pago Checkout Pro
      window.location.href = response.init_point
    } catch (err: any) {
      console.error("Error al iniciar pago:", err)
      setError(err?.message || "Error al procesar el pago. Intenta nuevamente.")
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true)
      const status = await apiGetAuth(`/api/payments/status/${requestId}/`)
      
      if (status.has_payment) {
        setPaymentStatus(status.payment_status)
        
        if (status.payment_status === "aprobado") {
          onPaymentCompleted?.()
        }
      }
    } catch (err) {
      console.error("Error consultando estado de pago:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const getStatusIcon = () => {
    if (paymentStatus === "aprobado") return <CheckCircle className="w-4 h-4 text-green-600" />
    if (paymentStatus === "rechazado") return <XCircle className="w-4 h-4 text-red-600" />
    if (paymentStatus === "pendiente") return <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
    return null
  }

  const getStatusText = () => {
    switch (paymentStatus) {
      case "aprobado":
        return "Pago aprobado"
      case "autorizado":
        return "Pago autorizado"
      case "en_proceso":
        return "Pago en proceso"
      case "pendiente":
        return "Pago pendiente"
      case "rechazado":
        return "Pago rechazado"
      case "cancelado":
        return "Pago cancelado"
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handlePayment}
        disabled={loading || paymentStatus === "aprobado"}
        variant={variant}
        size={size}
        className={`${className} ${paymentStatus === "aprobado" ? "bg-green-600" : ""}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : paymentStatus === "aprobado" ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Pagado
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pagar ${amount.toLocaleString()}
          </>
        )}
      </Button>

      {paymentStatus && paymentStatus !== "aprobado" && (
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">{getStatusText()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkPaymentStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : "Actualizar"}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentStatus === "aprobado" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Pago completado exitosamente! El profesional recibirá una notificación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
