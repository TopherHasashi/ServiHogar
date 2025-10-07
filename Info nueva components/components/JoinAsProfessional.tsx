import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Users, 
  Star,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  Award,
  MapPin,
  Phone,
  Briefcase,
  Target,
  Heart,
  Wrench,
  Sparkles,
  Scissors,
  PaintBucket,
  Zap,
  Home
} from "lucide-react"

interface JoinAsProfessionalProps {
  onBack: () => void
  onJoinClick: () => void
}

export default function JoinAsProfessional({ onBack, onJoinClick }: JoinAsProfessionalProps) {
  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8 text-green-500" />,
      title: "Ingresos adicionales",
      description: "Genera entre $200.000 y $800.000 adicionales por mes trabajando en tus tiempos libres.",
      stats: "Promedio $450.000/mes"
    },
    {
      icon: <Calendar className="w-8 h-8 text-blue-500" />,
      title: "Horarios flexibles",
      description: "Tú decides cuándo y dónde trabajar. Configura tu disponibilidad según tus necesidades.",
      stats: "100% flexible"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Clientes garantizados",
      description: "Accede a una base de más de 10,000 familias que buscan servicios profesionales.",
      stats: "10,000+ familias"
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-500" />,
      title: "Pagos garantizados",
      description: "Recibe tus pagos de forma automática y segura. Sin complicaciones ni demoras.",
      stats: "Pago inmediato"
    }
  ]

  const services = [
    { icon: <Wrench className="w-6 h-6" />, name: "Gasfitería", demand: "Alta", earning: "$25.000-45.000" },
    { icon: <Sparkles className="w-6 h-6" />, name: "Limpieza", demand: "Muy Alta", earning: "$18.000-35.000" },
    { icon: <Scissors className="w-6 h-6" />, name: "Jardinería", demand: "Alta", earning: "$20.000-40.000" },
    { icon: <PaintBucket className="w-6 h-6" />, name: "Pintura", demand: "Media", earning: "$30.000-55.000" },
    { icon: <Zap className="w-6 h-6" />, name: "Electricidad", demand: "Alta", earning: "$35.000-60.000" },
    { icon: <Home className="w-6 h-6" />, name: "Reparaciones", demand: "Media", earning: "$22.000-42.000" }
  ]

  const requirements = [
    {
      category: "Documentación",
      items: [
        "Cédula de identidad vigente",
        "Certificado de antecedentes (Registro Civil)",
        "Comprobante de domicilio",
        "RUT o inicio de actividades (opcional)"
      ]
    },
    {
      category: "Experiencia",
      items: [
        "Mínimo 1 año de experiencia comprobable",
        "Certificaciones técnicas (deseable)",
        "Referencias de trabajos anteriores",
        "Portfolio de trabajos realizados"
      ]
    },
    {
      category: "Herramientas",
      items: [
        "Kit básico de herramientas propias",
        "Vehículo para movilización (deseable)",
        "Teléfono móvil con WhatsApp",
        "Disponibilidad mínima 15 horas semanales"
      ]
    }
  ]

  const testimonials = [
    {
      name: "Carlos Mendoza",
      profession: "Gasfitero",
      rating: 5,
      text: "En 6 meses he ganado más de $2.500.000 trabajando los fines de semana. La plataforma es muy fácil de usar y los clientes son excelentes.",
      avatar: "CM",
      earnings: "$420.000/mes promedio"
    },
    {
      name: "Ana Rodriguez",
      profession: "Limpieza del Hogar",
      rating: 5,
      text: "Como madre soltera, ServiHogar me ha permitido tener ingresos adicionales sin descuidar a mi familia. Los horarios son súper flexibles.",
      avatar: "AR",
      earnings: "$380.000/mes promedio"
    },
    {
      name: "Roberto Silva",
      profession: "Jardinero",
      rating: 5,
      text: "La calidad de los clientes es excelente. Son personas que valoran el trabajo bien hecho y no regatean precios justos.",
      avatar: "RS",
      earnings: "$450.000/mes promedio"
    }
  ]

  const process = [
    {
      step: 1,
      title: "Registro en línea",
      description: "Completa tu perfil con información personal y profesional",
      time: "10 minutos"
    },
    {
      step: 2,
      title: "Verificación",
      description: "Revisamos tu documentación y validamos tu experiencia",
      time: "2-3 días hábiles"
    },
    {
      step: 3,
      title: "Capacitación virtual",
      description: "Sesión de orientación sobre la plataforma y mejores prácticas",
      time: "1 hora"
    },
    {
      step: 4,
      title: "¡Listo para trabajar!",
      description: "Activa tu perfil y comienza a recibir solicitudes de trabajo",
      time: "Inmediato"
    }
  ]

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Muy Alta": return "bg-red-100 text-red-800"
      case "Alta": return "bg-orange-100 text-orange-800"  
      case "Media": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl mb-4">Únete como Profesional</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Forma parte de la red de profesionales más confiable de Chile y 
              genera ingresos adicionales con total flexibilidad
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Hero Stats */}
        <section className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">500+</div>
              <div className="text-sm text-gray-600">Profesionales activos</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">$450K</div>
              <div className="text-sm text-gray-600">Ingreso promedio mensual</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">4.9★</div>
              <div className="text-sm text-gray-600">Calificación promedio</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">98%</div>
              <div className="text-sm text-gray-600">Satisfacción de clientes</div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section>
          <h2 className="text-3xl lg:text-4xl text-center mb-12">¿Por qué elegir ServiHogar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 mb-3 leading-relaxed">{benefit.description}</p>
                      <Badge variant="secondary">{benefit.stats}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Services and Earnings */}
        <section>
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Servicios más Demandados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-primary">
                      {service.icon}
                    </div>
                    <h3 className="text-lg">{service.name}</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Demanda:</span>
                      <Badge className={getDemandColor(service.demand)}>
                        {service.demand}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ganancia por servicio:</span>
                      <span className="text-sm">{service.earning}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Requisitos para Unirse</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {requirements.map((req, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl mb-4 text-center">{req.category}</h3>
                  <ul className="space-y-3">
                    {req.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="bg-white rounded-2xl p-8 lg:p-12">
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Proceso de Registro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{step.description}</p>
                <Badge variant="outline">{step.time}</Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section>
          <h2 className="text-3xl lg:text-4xl text-center mb-12">Lo que dicen nuestros profesionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary text-white">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{testimonial.name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.profession}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    "{testimonial.text}"
                  </p>
                  
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    {testimonial.earnings}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl lg:text-4xl mb-4">¿Listo para empezar a generar ingresos?</h2>
            <p className="text-lg lg:text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Únete a más de 500 profesionales que ya están generando ingresos adicionales 
              con ServiHogar. El registro es gratis y puedes empezar a trabajar en menos de una semana.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="secondary" onClick={onJoinClick}>
                <Award className="w-5 h-5 mr-2" />
                Registrarme Ahora
              </Button>
              <div className="text-sm opacity-75">
                ✓ Registro gratuito ✓ Sin compromisos ✓ Inicia en 5 días
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="bg-gray-100 rounded-2xl p-8 text-center">
          <h3 className="text-2xl mb-4">¿Tienes preguntas?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Nuestro equipo de soporte está aquí para ayudarte en cada paso del proceso de registro 
            y durante toda tu experiencia como profesional ServiHogar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline">
              <Phone className="w-4 h-4 mr-2" />
              +56 9 1234 5678
            </Button>
            <Button variant="outline">
              <MapPin className="w-4 h-4 mr-2" />
              soporte@servihogar.cl
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}