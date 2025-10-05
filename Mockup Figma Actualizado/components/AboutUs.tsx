import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Heart,
  Users,
  Shield,
  Award,
  Target,
  Lightbulb,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  Wrench,
  Sparkles,
  Scissors,
} from "lucide-react";

interface AboutUsProps {
  onBack: () => void;
}

export default function AboutUs({ onBack }: AboutUsProps) {
  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      value: "10,000+",
      label: "Familias atendidas",
    },
    {
      icon: <Award className="w-8 h-8" />,
      value: "500+",
      label: "Profesionales certificados",
    },
    {
      icon: <Star className="w-8 h-8" />,
      value: "4.9",
      label: "Calificación promedio",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      value: "15",
      label: "Regiones cubiertas",
    },
  ];

  const values = [
    {
      icon: <Heart className="w-12 h-12 text-red-500" />,
      title: "Compromiso con la calidad",
      description:
        "Cada servicio es ejecutado con los más altos estándares de calidad y profesionalismo.",
    },
    {
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      title: "Confianza y seguridad",
      description:
        "Todos nuestros profesionales están verificados y cuentan con seguro de responsabilidad civil.",
    },
    {
      icon: <Users className="w-12 h-12 text-green-500" />,
      title: "Enfoque humano",
      description:
        "Creemos en el trato personalizado y en construir relaciones duraderas con nuestros clientes.",
    },
    {
      icon: <Lightbulb className="w-12 h-12 text-yellow-500" />,
      title: "Innovación constante",
      description:
        "Utilizamos tecnología de punta para mejorar continuamente la experiencia de nuestros usuarios.",
    },
  ];

  const team = [
    {
      name: "María Rodriguez",
      role: "CEO & Fundadora",
      description:
        "Ingeniera comercial con 15 años de experiencia en servicios para el hogar.",
      avatar: "MR",
    },
    {
      name: "Carlos Mendoza",
      role: "CTO",
      description:
        "Ingeniero en sistemas especializado en plataformas digitales y experiencia de usuario.",
      avatar: "CM",
    },
    {
      name: "Ana Silva",
      role: "Directora de Operaciones",
      description:
        "Experta en gestión de servicios con enfoque en calidad y satisfacción del cliente.",
      avatar: "AS",
    },
    {
      name: "Roberto Paz",
      role: "Director de Profesionales",
      description:
        "Especialista en capacitación y desarrollo de equipos de trabajo.",
      avatar: "RP",
    },
  ];

  const timeline = [
    {
      year: "2020",
      title: "Fundación de ServiHogar",
      description:
        "Nace la idea de conectar profesionales confiables con familias que necesitan servicios para el hogar.",
    },
    {
      year: "2021",
      title: "Primeras 1,000 familias",
      description:
        "Alcanzamos nuestro primer hito importante atendiendo a más de 1,000 hogares en Santiago.",
    },
    {
      year: "2022",
      title: "Expansión nacional",
      description:
        "Extendemos nuestros servicios a 10 regiones del país, incorporando más de 200 profesionales.",
    },
    {
      year: "2023",
      title: "Reconocimiento de calidad",
      description:
        "Recibimos el premio 'Mejor Plataforma de Servicios' por parte de la Cámara de Comercio.",
    },
    {
      year: "2024",
      title: "Líder del mercado",
      description:
        "Superamos las 10,000 familias atendidas y 500 profesionales certificados en toda Chile.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>

          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl mb-4">
              Sobre ServiHogar
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos la plataforma líder en Chile que conecta
              familias con profesionales confiables para el
              cuidado y mantenimiento del hogar
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Stats Section */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4 text-primary">
                    {stat.icon}
                  </div>
                  <div className="text-3xl mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="text-center">
          <h2 className="text-3xl lg:text-5xl mb-8">
            Nuestra Misión
          </h2>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white">
            <p className="text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto">
              Facilitar el acceso a servicios profesionales de
              calidad para el hogar, creando una comunidad de
              confianza donde las familias encuentren soluciones
              rápidas y seguras para sus necesidades domésticas,
              mientras empoderamos a profesionales
              independientes a crecer en sus carreras.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section>
          <h2 className="text-3xl lg:text-5xl text-center mb-12">
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {value.icon}
                    </div>
                    <div>
                      <h3 className="text-xl mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section>
          <h2 className="text-3xl lg:text-5xl text-center mb-12">
            Nuestra Historia
          </h2>
          <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-sm">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                ServiHogar nació en 2020 cuando María Rodriguez,
                una ingeniera comercial y madre de dos hijos, se
                enfrentaba constantemente al desafío de
                encontrar profesionales confiables para el
                mantenimiento de su hogar. Después de varias
                experiencias negativas con servicios no
                verificados, decidió crear una solución que
                combinara tecnología con un riguroso proceso de
                selección de profesionales.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Lo que comenzó como una idea para resolver un
                problema personal, se convirtió rápidamente en
                una necesidad compartida por miles de familias
                chilenas. Con el apoyo de un equipo
                multidisciplinario de tecnología, operaciones y
                atención al cliente, ServiHogar ha crecido hasta
                convertirse en la plataforma de servicios para
                el hogar más confiable del país.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Hoy, orgullosamente conectamos a más de 10,000
                familias con 500+ profesionales certificados,
                manteniendo siempre nuestro compromiso original:
                facilitar el acceso a servicios de calidad con
                la confianza y seguridad que cada hogar merece.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-3xl lg:text-5xl text-center mb-12">
            Nuestro Crecimiento
          </h2>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-0.5 h-full w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="space-y-8">
              {timeline.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div
                    className={`flex-1 ${index % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <Badge
                          variant="secondary"
                          className="mb-3"
                        >
                          {event.year}
                        </Badge>
                        <h3 className="text-xl mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600">
                          {event.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-md md:ml-0 ml-8">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <h2 className="text-3xl lg:text-5xl text-center mb-12">
            Nuestro Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl mx-auto mb-4">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary mb-3">
                    {member.role}
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-8 lg:p-12 text-white">
            <h2 className="text-3xl lg:text-4xl mb-4">
              ¿Te gustaría ser parte de nuestra historia?
            </h2>
            <p className="text-lg lg:text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Ya sea como cliente o como profesional, en
              ServiHogar hay un lugar para ti. Únete a nuestra
              comunidad y ayúdanos a seguir transformando la
              manera en que las familias cuidan sus hogares.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={onBack}
              >
                <Heart className="w-5 h-5 mr-2" />
                Solicitar Servicio
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Users className="w-5 h-5 mr-2" />
                Únete como Profesional
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}