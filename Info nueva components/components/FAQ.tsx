import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"

interface FAQProps {
  onContactClick?: () => void
}

const faqs = [
  {
    question: "¿Cómo funciona la plataforma?",
    answer: "Muy simple: busca el profesional que necesitas, agenda tu cita según su disponibilidad, paga de forma segura directamente en la plataforma y recibe el servicio. Todo es 100% digital y sin manejar efectivo."
  },
  {
    question: "¿Cómo es el proceso de verificación de profesionales?",
    answer: "Todos nuestros profesionales pasan por un proceso riguroso de verificación en 24-48 horas: validamos su cédula de identidad, certificados profesionales, antecedentes y referencias. Solo trabajamos con profesionales completamente verificados."
  },
  {
    question: "¿Cómo funcionan los pagos en la plataforma?",
    answer: "Todo el proceso de pago es digital y seguro. Utilizamos MercadoPago para procesar los pagos con tarjetas de crédito, débito y transferencias. Tu dinero queda protegido hasta que confirmes que el servicio fue completado satisfactoriamente."
  },
  {
    question: "¿Puedo ver reseñas de los profesionales antes de contratar?",
    answer: "Sí, cada profesional tiene un perfil completo con reseñas reales de clientes anteriores, calificaciones, fotos de trabajos realizados y certificaciones. Esto te ayuda a tomar la mejor decisión."
  },
  {
    question: "¿Qué pasa si no estoy satisfecho con el servicio?",
    answer: "Tu dinero está protegido hasta que confirmes la satisfacción del servicio. Si hay algún problema, no confirmes el pago y contacta nuestro soporte. El profesional deberá corregir el trabajo o podremos asignar otro."
  },
  {
    question: "¿Cómo se manejan los precios?",
    answer: "Todos los precios están en pesos chilenos (CLP) y son transparentes desde el inicio. Cada profesional muestra precios 'desde' según la duración del servicio. No hay costos ocultos ni sorpresas."
  },
  {
    question: "¿Tienen servicios de emergencia 24/7?",
    answer: "No ofrecemos servicios de emergencia 24/7. Nuestros profesionales trabajan en horarios normales que puedes ver en su disponibilidad al momento de agendar tu cita."
  },
  {
    question: "¿Cómo puedo convertirme en profesional verificado?",
    answer: "Regístrate en la plataforma, sube tu cédula de identidad y certificados profesionales. Nuestro equipo verificará tu información en 24-48 horas. Una vez aprobado, podrás empezar a recibir solicitudes y gestionar todo desde tu dispositivo."
  },
  {
    question: "¿Qué servicios están disponibles?",
    answer: "Ofrecemos 3 categorías categorías de servicios: Gasfitería (reparaciones, instalaciones), Limpieza (hogar, oficinas), Jardinería (mantención, paisajismo) y próximamente se incluirán otras categorías."
  },
  {
    question: "¿Puedo filtrar profesionales por ubicación?",
    answer: "Sí, tenemos filtros por región y comuna para toda Chile. También puedes filtrar por calificación, precio, disponibilidad y tipo de servicio para encontrar exactamente lo que necesitas."
  }
]

export default function FAQ({ onContactClick }: FAQProps) {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index)
  }

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-primary text-white rounded-full p-2.5 sm:p-3">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Encuentra respuestas a las dudas más comunes sobre nuestros servicios
          </p>
        </div>

        {/* Important Info */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">Verificación Rigurosa</h4>
              <p className="text-xs sm:text-sm text-gray-600">Todos los profesionales son verificados en 24-48 horas</p>
            </div>
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">Pagos Protegidos</h4>
              <p className="text-xs sm:text-sm text-gray-600">Tu dinero está seguro hasta confirmar el servicio</p>
            </div>
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h4 className="text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">100% Digital</h4>
              <p className="text-xs sm:text-sm text-gray-600">Sin efectivo, todo se maneja desde la plataforma</p>
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-4 sm:p-6 text-left flex items-start justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base sm:text-lg text-gray-900 pr-3 sm:pr-4 leading-relaxed">
                    {faq.question}
                  </h3>
                  {openItem === index ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                </button>
                
                {openItem === index && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <h3 className="text-xl sm:text-2xl text-gray-900 mb-3 sm:mb-4">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Nuestro equipo de soporte está disponible para ayudarte con cualquier consulta
            </p>
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-700 text-left sm:text-center">
                <strong>Horarios de atención:</strong><br />
                Lunes a Viernes: 9:00 - 18:00<br />
                Sábados: 9:00 - 14:00<br />
                Domingos: Cerrado
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
              <Button size="lg" onClick={onContactClick} className="w-full sm:w-auto">
                Contactar Soporte
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
                WhatsApp: +56 9 1234 5678
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}