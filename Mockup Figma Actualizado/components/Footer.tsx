import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react"

interface FooterProps {
  onAboutClick?: () => void
  onHowItWorksClick?: () => void
  onJoinProfessionalClick?: () => void
  onTermsClick?: () => void
  onPrivacyClick?: () => void
}

export default function Footer({ 
  onAboutClick, 
  onHowItWorksClick, 
  onJoinProfessionalClick, 
  onTermsClick, 
  onPrivacyClick 
}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl mb-3 sm:mb-4">ServiHogar</h3>
            <p className="text-gray-400 mb-4 leading-relaxed text-sm sm:text-base">
              Conectamos tu hogar con los mejores profesionales en servicios domésticos. 
              Calidad garantizada y servicio confiable.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Servicios</h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li><a href="#" className="hover:text-white transition-colors">Gasfitería</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Limpieza del Hogar</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Jardinería</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Empresa</h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li><button onClick={onAboutClick} className="hover:text-white transition-colors text-left">Sobre Nosotros</button></li>
              <li><button onClick={onHowItWorksClick} className="hover:text-white transition-colors text-left">Cómo Funciona</button></li>
              <li><button onClick={onJoinProfessionalClick} className="hover:text-white transition-colors text-left">Únete como Profesional</button></li>
              <li><button onClick={onTermsClick} className="hover:text-white transition-colors text-left">Términos y Condiciones</button></li>
              <li><button onClick={onPrivacyClick} className="hover:text-white transition-colors text-left">Política de Privacidad</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base sm:text-lg mb-3 sm:mb-4">Contacto</h4>
            <div className="space-y-3 text-gray-400 text-sm sm:text-base">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>+51 999 888 777</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">contacto@servihogar.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Concepcion, Chile</span>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6">
              <h5 className="text-white mb-2 text-sm sm:text-base">Horarios de Atención</h5>
              <div className="text-xs sm:text-sm text-gray-400">
                <p>Lun - Dom: 8:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2025 ServiHogar. Todos los derechos reservados.
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-6">
              <button onClick={onTermsClick} className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Términos de Servicio
              </button>
              <button onClick={onPrivacyClick} className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Política de Privacidad
              </button>
              <a href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}