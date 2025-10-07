import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Search, Calendar, CreditCard, CheckCircle } from "lucide-react"

interface ProcessProps {}

const steps = [
  {
    id: 1,
    title: "Busca el servicio",
    description: "Explora nuestro catálogo y selecciona el profesional que mejor se adapte a tus necesidades.",
    icon: <Search className="w-8 h-8" />,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Agenda tu cita",
    description: "Elige la fecha y hora que mejor te convenga según la disponibilidad del profesional.",
    icon: <Calendar className="w-8 h-8" />,
    color: "bg-green-500"
  },
  {
    id: 3,
    title: "Paga de forma segura",
    description: "Realiza el pago directamente en nuestra plataforma de manera segura y protegida.",
    icon: <CreditCard className="w-8 h-8" />,
    color: "bg-purple-500"
  },
  {
    id: 4,
    title: "Recibe y califica",
    description: "El profesional llegará puntual, realizará el trabajo y podrás calificar tu experiencia.",
    icon: <CheckCircle className="w-8 h-8" />,
    color: "bg-orange-500"
  }
]

export default function Process({}: ProcessProps) {
  return (
    <section id="proceso" className="py-12 sm:py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            ¿Cómo Funciona?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Reserva y paga tu servicio en línea de manera rápida, segura y sin complicaciones
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardContent className="p-6 sm:p-8">
                  {/* Step Number */}
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                      {step.id}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`${step.color} text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4 sm:mb-6 mt-3 sm:mt-4`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>

              {/* Arrow (except for last item on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gray-300 relative">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Benefits Section */}
        <div className="mt-12 sm:mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 lg:p-12 border border-blue-100">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-6">
                Pago Seguro y Protegido
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg text-gray-900 mb-2">100% Seguro</h4>
                  <p className="text-gray-600 text-sm">
                    Procesamos pagos con MercadoPago, garantizando la máxima seguridad
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg text-gray-900 mb-2">Sin Efectivo</h4>
                  <p className="text-gray-600 text-sm">
                    Olvídate de manejar dinero en efectivo, todo se gestiona digitalmente
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="text-base sm:text-lg text-gray-900 mb-2">Transparente</h4>
                  <p className="text-gray-600 text-sm">
                    Precios claros desde el inicio, sin sorpresas ni costos ocultos
                  </p>
                </div>
              </div>
              
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-blue-200">
                <p className="text-gray-600 text-sm max-w-2xl mx-auto mb-4 sm:mb-6">
                  Tu dinero está protegido hasta que confirmes que el servicio fue completado satisfactoriamente
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 w-full sm:w-auto"
                >
                  Ver Información Detallada
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}