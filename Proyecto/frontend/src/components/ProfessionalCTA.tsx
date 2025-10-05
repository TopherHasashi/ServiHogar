import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { Shield, CreditCard, Smartphone, CheckCircle } from "lucide-react"

interface ProfessionalCTAProps {
  onJoinClick?: () => void
}

const features = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Verificación Simple",
    description: "Proceso de verificación en 24-48 horas con documentos y certificaciones"
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Pagos Automáticos",
    description: "Recibe tus pagos directamente en tu cuenta, sin gestionar efectivo"
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Gestión Digital",
    description: "Maneja tu agenda, clientes y servicios desde cualquier dispositivo"
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Respaldo Legal",
    description: "Contratos digitales y protección legal en cada servicio realizado"
  }
]

export default function ProfessionalCTA({ onJoinClick }: ProfessionalCTAProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Content */}
          <div>
            <div className="mb-4 sm:mb-6">
              <span className="bg-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base">
                ¿Eres Profesional?
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-4 sm:mb-6">
              Convierte tus habilidades en{" "}
              <span className="text-primary">ingresos digitales</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              Únete a la nueva era de servicios profesionales. Verifica tu identidad una sola vez, 
              trabaja de forma segura y recibe pagos automáticos sin complicaciones.
            </p>

            {/* Verification Process */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
                🔍 Proceso de Verificación Rápido
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">1</div>
                  <span className="text-sm text-gray-700">Sube tu cédula de identidad y certificados</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">2</div>
                  <span className="text-sm text-gray-700">Verificamos tu identidad y experiencia en 24-48 horas</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</div>
                  <span className="text-sm text-gray-700">¡Listo! Comienza a recibir solicitudes de trabajo</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none">
                  <div className="bg-primary text-white rounded-lg p-2 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <Button size="lg" className="w-full sm:w-auto sm:px-8" onClick={onJoinClick}>
                Registrarse como Profesional
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto sm:px-8">
                Conocer Más
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <h4 className="text-sm text-gray-900 mb-3">¿Por qué elegir nuestra plataforma digital?</h4>
              <div className="grid grid-cols-1 gap-2 sm:gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span>Sin manejar efectivo - Todo digital</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>Historial de servicios respaldado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span>Clientes pre-verificados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span>Contratos automáticos por servicio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-first lg:order-last">
            <Card className="overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b3JrZXIlMjBob21lJTIwc2VydmljZXN8ZW58MXx8fHwxNzU3NTQyOTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Profesional trabajando"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                
                {/* Floating Stats */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white rounded-lg shadow-lg p-3 sm:p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                      <span className="text-sm sm:text-lg text-primary">Verificado</span>
                    </div>
                    <div className="text-xs text-gray-600">Perfil completo</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white rounded-lg shadow-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-900">Juan Pablo Mellado</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Certificado verificado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}