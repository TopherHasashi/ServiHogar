import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Star, Quote, MessageCircle } from "lucide-react"

interface TestimonialsProps {
  onReviewsClick?: () => void
}

const testimonials = [
  {
    id: 1,
    name: "María González",
    role: "Ama de casa",
    rating: 5,
    text: "Excelente servicio de limpieza. Las chicas llegaron puntuales y dejaron mi casa impecable. Definitivamente los recomiendo y los contrataré de nuevo.",
    avatar: "MG",
    service: "Limpieza del Hogar"
  },
  {
    id: 2,
    name: "Carlos Ramírez",
    role: "Empresario",
    rating: 5,
    text: "Tuve una emergencia con una tubería rota y llegaron en menos de una hora. El gasfitero era muy profesional y solucionó el problema rápidamente.",
    avatar: "CR",
    service: "Gasfitería"
  },
  {
    id: 3,
    name: "Ana Flores",
    role: "Profesora",
    rating: 5,
    text: "Mi jardín quedó hermoso después del servicio de paisajismo. Muy atentos a los detalles y con precios justos. Súper recomendados.",
    avatar: "AF",
    service: "Jardinería"
  },
  {
    id: 4,
    name: "Roberto Silva",
    role: "Ingeniero",
    rating: 5,
    text: "He usado varios servicios y todos han sido excelentes. La plataforma es fácil de usar y los profesionales son de primera calidad.",
    avatar: "RS",
    service: "Múltiples servicios"
  },
  {
    id: 5,
    name: "Patricia Mendoza",
    role: "Doctora",
    rating: 5,
    text: "Como tengo poco tiempo, necesitaba un servicio confiable de limpieza. ServiHogar superó mis expectativas. Muy profesionales.",
    avatar: "PM",
    service: "Limpieza del Hogar"
  },
  {
    id: 6,
    name: "Miguel Torres",
    role: "Contador",
    rating: 5,
    text: "El servicio de gasfitería fue excelente. Solucionaron un problema complejo en mi baño y me dieron garantía por el trabajo realizado.",
    avatar: "MT",
    service: "Gasfitería"
  }
]

export default function Testimonials({ onReviewsClick }: TestimonialsProps) {
  return (
    <section id="testimonios" className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl text-gray-900 mb-3 sm:mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">
            Miles de familias confían en nosotros para mantener sus hogares en perfectas condiciones
          </p>
          <Button variant="outline" onClick={onReviewsClick} size="sm" className="sm:size-default">
            <MessageCircle className="w-4 h-4 mr-2" />
            Ver Todas las Reseñas
          </Button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md relative overflow-hidden">
              {/* Quote Icon */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-200">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              
              <CardContent className="p-4 sm:p-6">
                {/* Stars */}
                <div className="flex items-center space-x-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Service Tag */}
                <div className="mb-3 sm:mb-4">
                  <span className="inline-block bg-primary/10 text-primary px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm">
                    {testimonial.service}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                    <AvatarImage src="" alt={testimonial.name} />
                    <AvatarFallback className="bg-primary text-white text-xs sm:text-sm">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm sm:text-base text-gray-900">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">500+</div>
              <div className="text-xs sm:text-sm opacity-90">Servicios completados</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">4.9★</div>
              <div className="text-xs sm:text-sm opacity-90">Calificación promedio</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">98%</div>
              <div className="text-xs sm:text-sm opacity-90">Clientes satisfechos</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">24h</div>
              <div className="text-xs sm:text-sm opacity-90">Tiempo de respuesta</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}