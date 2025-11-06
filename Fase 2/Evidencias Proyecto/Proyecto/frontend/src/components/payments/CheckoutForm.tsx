import { useState } from 'react'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { AlertCircle, Loader2, CreditCard } from 'lucide-react'
import { apiPost } from '../../lib/api'

// Inicializar MercadoPago con tu Public Key
initMercadoPago('APP_USR-2537a285-75de-476b-9ab6-54bda0b86ae5', {
  locale: 'es-CL'
})

interface CheckoutFormProps {
  amount: number
  description: string
  requestId: string
  onSuccess: (data: any) => void
  onError: (error: any) => void
  onBack: () => void
}

export default function CheckoutForm({ 
  amount, 
  description, 
  requestId,
  onSuccess, 
  onError, 
  onBack 
}: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const initialization = {
    amount: amount,
  }

  const customization = {
    paymentMethods: {
      maxInstallments: 1,
    },
    visual: {
      style: {
        theme: 'default',
      },
    },
  }

  const onSubmit = async (formData: any) => {
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Enviar los datos del pago al backend
      const response = await apiPost('/api/payments/process/', {
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        transaction_amount: amount,
        description: description,
        payer: {
          email: formData.payer?.email,
          identification: {
            type: formData.payer?.identification?.type,
            number: formData.payer?.identification?.number,
          },
        },
        request_id: requestId,
      }, { auth: true })

      if (response.status === 'approved') {
        onSuccess(response)
      } else if (response.status === 'pending') {
        setErrorMessage(`Pago pendiente: ${response.status_detail || 'El pago está siendo procesado'}`)
      } else {
        setErrorMessage(`Pago rechazado: ${response.status_detail || 'El pago fue rechazado'}`)
        onError(new Error(response.status_detail || 'Pago rechazado'))
      }
    } catch (err: any) {
      console.error('Error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Error procesando el pago'
      setErrorMessage(errorMsg)
      onError(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const onReady = () => {
    console.log('Checkout listo')
  }

  const onErrorCallback = (error: any) => {
    console.error('Error en checkout:', error)
    setErrorMessage('Error cargando el formulario de pago')
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de error */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Loading indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center py-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Procesando pago...</span>
        </div>
      )}

      {/* Formulario de pago */}
      <div className={`border rounded-lg p-4 bg-white ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardPayment
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onReady={onReady}
          onError={onErrorCallback}
        />
      </div>

      {/* Información de tarjetas de prueba */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-2">💳 Tarjetas de prueba</p>
            <div className="space-y-1 text-blue-800">
              <p>• <strong>Número:</strong> 5416 7526 0258 2580</p>
              <p>• <strong>CVV:</strong> 123</p>
              <p>• <strong>Vencimiento:</strong> 11/25</p>
              <p>• <strong>Nombre:</strong> APRO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón volver */}
      <div className="pt-4 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full"
        >
          Volver
        </Button>
      </div>
    </div>
  )
}
