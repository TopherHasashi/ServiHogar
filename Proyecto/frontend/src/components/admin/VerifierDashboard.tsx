import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Image, 
  Download,
  User,
  Calendar,
  MapPin,
  Star,
  ArrowLeft,
  AlertTriangle,
  AlertCircle
} from "lucide-react"

interface VerifierDashboardProps {
  onLogout: () => void
}

interface ProfessionalDocument {
  id: string
  professionalId: string
  professionalName: string
  professionalEmail: string
  specialty: string
  region: string
  commune: string
  submittedDate: string
  status: "pending" | "approved" | "rejected"
  isFirstService: boolean // Indica si es la primera solicitud del profesional
  documents: {
    id: string
    type: "cedula" | "certificado" | "experiencia" | "titulo" | "antecedentes"
    name: string
    url: string
    uploadDate: string
  }[]
  personalInfo: {
    phone: string
    experience: string
    description: string
  }
}

export default function VerifierDashboard({ onLogout }: VerifierDashboardProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)

  // Mock data - En producción vendría de la API
  const [pendingVerifications, setPendingVerifications] = useState<ProfessionalDocument[]>([
    {
      id: "VER-001",
      professionalId: "PROF-001",
      professionalName: "Carlos Rodríguez",
      professionalEmail: "carlos.rodriguez@email.com",
      specialty: "Gasfitería",
      region: "Región Metropolitana",
      commune: "Santiago",
      submittedDate: "2024-12-15",
      status: "pending",
      isFirstService: true, // Primera solicitud - incluye certificado de antecedentes
      documents: [
        {
          id: "DOC-003",
          type: "antecedentes",
          name: "Certificado de Antecedentes",
          url: "/docs/antecedentes-carlos.pdf",
          uploadDate: "2024-12-15"
        },
        {
          id: "DOC-002",
          type: "certificado",
          name: "Certificado de Competencias Gasfitería",
          url: "/docs/cert-gasfiteria-carlos.pdf",
          uploadDate: "2024-12-15"
        },
        {
          id: "DOC-004",
          type: "experiencia",
          name: "Carta de Recomendación - Empresa ABC",
          url: "/docs/recomendacion-carlos.pdf",
          uploadDate: "2024-12-15"
        }
      ],
      personalInfo: {
        phone: "+56 9 1234 5678",
        experience: "5 años",
        description: "Gasfiter con amplia experiencia en instalaciones residenciales y comerciales."
      }
    },
    {
      id: "VER-002",
      professionalId: "PROF-002",
      professionalName: "María López",
      professionalEmail: "maria.lopez@email.com",
      specialty: "Limpieza del Hogar",
      region: "Región Metropolitana",
      commune: "Providencia",
      submittedDate: "2024-12-14",
      status: "pending",
      isFirstService: true, // Primera solicitud - incluye certificado de antecedentes
      documents: [
        {
          id: "DOC-006",
          type: "antecedentes",
          name: "Certificado de Antecedentes",
          url: "/docs/antecedentes-maria.pdf",
          uploadDate: "2024-12-14"
        },
        {
          id: "DOC-005",
          type: "experiencia",
          name: "Cartas de Recomendación de Clientes",
          url: "/docs/recomendaciones-maria.pdf",
          uploadDate: "2024-12-14"
        }
      ],
      personalInfo: {
        phone: "+56 9 8765 4321",
        experience: "3 años",
        description: "Especialista en limpieza profunda y mantenimiento del hogar."
      }
    },
    {
      id: "VER-003",
      professionalId: "PROF-001",
      professionalName: "Carlos Rodríguez",
      professionalEmail: "carlos.rodriguez@email.com",
      specialty: "Limpieza del Hogar",
      region: "Región Metropolitana",
      commune: "Santiago",
      submittedDate: "2024-12-13",
      status: "pending",
      isFirstService: false, // Servicio adicional - NO incluye certificado de antecedentes
      documents: [
        {
          id: "DOC-007",
          type: "experiencia",
          name: "Certificado de Curso Limpieza Profesional",
          url: "/docs/cert-limpieza-carlos.pdf",
          uploadDate: "2024-12-13"
        },
        {
          id: "DOC-008",
          type: "experiencia",
          name: "Facturas de Trabajos de Limpieza Anteriores",
          url: "/docs/facturas-limpieza-carlos.pdf",
          uploadDate: "2024-12-13"
        }
      ],
      personalInfo: {
        phone: "+56 9 1234 5678",
        experience: "2 años",
        description: "Experiencia adicional en limpieza del hogar y oficinas."
      }
    },
    {
      id: "VER-004",
      professionalId: "PROF-003",
      professionalName: "Juan Pérez",
      professionalEmail: "juan.perez@email.com",
      specialty: "Jardinería",
      region: "Región de Valparaíso",
      commune: "Viña del Mar",
      submittedDate: "2024-12-12",
      status: "pending",
      isFirstService: true, // Primera solicitud - incluye certificado de antecedentes
      documents: [
        {
          id: "DOC-009",
          type: "antecedentes",
          name: "Certificado de Antecedentes",
          url: "/docs/antecedentes-juan.pdf",
          uploadDate: "2024-12-12"
        },
        {
          id: "DOC-010",
          type: "titulo",
          name: "Título Técnico en Paisajismo",
          url: "/docs/titulo-juan.pdf",
          uploadDate: "2024-12-12"
        },
        {
          id: "DOC-011",
          type: "experiencia",
          name: "Portfolio de Trabajos Realizados",
          url: "/docs/portfolio-juan.pdf",
          uploadDate: "2024-12-12"
        }
      ],
      personalInfo: {
        phone: "+56 9 5555 6666",
        experience: "7 años",
        description: "Jardinero profesional especializado en diseño y mantenimiento de jardines."
      }
    }
  ])

  const handleApprove = (professionalId: string) => {
    setPendingVerifications(prev => 
      prev.map(prof => 
        prof.id === professionalId 
          ? { ...prof, status: "approved" as const }
          : prof
      )
    )
    // Simular borrado de documentos
    setTimeout(() => {
      setPendingVerifications(prev => 
        prev.filter(prof => prof.id !== professionalId)
      )
    }, 2000)
    alert("Profesional verificado exitosamente. Los documentos se eliminarán en 2 segundos.")
  }

  const handleReject = (professionalId: string) => {
    const reason = prompt("Ingresa la razón del rechazo:")
    if (reason) {
      setPendingVerifications(prev => 
        prev.map(prof => 
          prof.id === professionalId 
            ? { ...prof, status: "rejected" as const }
            : prof
        )
      )
      alert(`Profesional rechazado. Motivo: ${reason}`)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "cedula": return <User className="w-4 h-4" />
      case "certificado": return <Star className="w-4 h-4" />
      case "titulo": return <Star className="w-4 h-4" />
      case "experiencia": return <FileText className="w-4 h-4" />
      case "antecedentes": return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "cedula": return "Cédula de Identidad"
      case "certificado": return "Certificado Profesional"
      case "titulo": return "Título/Diploma"
      case "experiencia": return "Experiencia Laboral"
      case "antecedentes": return "Antecedentes"
      default: return "Documento"
    }
  }

  const selectedProfData = selectedProfessional 
    ? pendingVerifications.find(p => p.id === selectedProfessional)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-medium">Panel de Verificación</h1>
                <p className="text-sm text-gray-600">Verificador de ServiHogar</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Lista de Verificaciones Pendientes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="truncate">Verificaciones Pendientes</span>
                  <Badge variant="secondary">{pendingVerifications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] lg:h-[600px]">
                  <div className="space-y-2 p-4">
                    {pendingVerifications.map((professional) => (
                      <Card 
                        key={professional.id}
                        className={`cursor-pointer transition-all ${
                          selectedProfessional === professional.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedProfessional(professional.id)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm sm:text-base truncate flex-1">{professional.professionalName}</h3>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {professional.specialty}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">
                                  {new Date(professional.submittedDate).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs sm:text-sm truncate">
                                  {professional.commune}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">
                                  {professional.documents.length} documentos
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Detalles */}
          <div className="lg:col-span-2">
            {selectedProfData ? (
              <div className="space-y-6">
                {/* Información del Profesional */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Información del Profesional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tipo de Solicitud */}
                    {selectedProfData.isFirstService ? (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <p className="font-medium text-blue-800">Primera Solicitud de Servicio</p>
                          <p className="text-sm text-blue-700">
                            Esta es la primera vez que este profesional solicita verificación. Debe incluir certificado de antecedentes + documentación de experiencia.
                          </p>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <p className="font-medium text-green-800">Servicio Adicional</p>
                          <p className="text-sm text-green-700">
                            Este profesional ya fue verificado anteriormente. Solo requiere documentación de experiencia para este nuevo servicio.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nombre Completo</label>
                        <p className="font-medium text-sm sm:text-base break-words">{selectedProfData.professionalName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium text-sm sm:text-base break-all">{selectedProfData.professionalEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Teléfono</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.personalInfo.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Servicio Solicitado</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.specialty}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-gray-600">Ubicación</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.commune}, {selectedProfData.region}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Experiencia en este Servicio</label>
                        <p className="font-medium text-sm sm:text-base">{selectedProfData.personalInfo.experience}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Descripción del Servicio</label>
                      <p className="font-medium text-sm sm:text-base leading-relaxed">{selectedProfData.personalInfo.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentos Subidos
                      <Badge variant="secondary">{selectedProfData.documents.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Indicador de tipo de documentación */}
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Documentación Requerida:</p>
                        <div className="space-y-1 text-sm text-gray-700">
                          {selectedProfData.isFirstService ? (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Certificado de Antecedentes (obligatorio)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Documentación de experiencia en {selectedProfData.specialty}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-500 line-through">Certificado de Antecedentes (ya verificado)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Documentación de experiencia en {selectedProfData.specialty}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lista de documentos */}
                      <div className="space-y-3">
                        {selectedProfData.documents.map((document) => (
                          <div key={document.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getDocumentIcon(document.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{document.name}</p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {getDocumentTypeName(document.type)} • 
                                  {new Date(document.uploadDate).toLocaleDateString('es-CL')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingDocument(document.id)}
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(document.url, '_blank')}
                                className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones de Verificación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Acciones de Verificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <Button
                        onClick={() => handleApprove(selectedProfData.id)}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar Verificación
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedProfData.id)}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar Verificación
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800">Importante:</p>
                            <p className="text-amber-700 leading-relaxed">
                              Al aprobar la verificación, todos los documentos se eliminarán automáticamente del sistema por seguridad. 
                              Al rechazar, el profesional recibirá una notificación con el motivo del rechazo.
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedProfData.isFirstService ? (
                        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800">Primera Verificación:</p>
                              <p className="text-blue-700 leading-relaxed">
                                Verifica que el certificado de antecedentes esté vigente y corresponda al profesional. También valida la documentación de experiencia para el servicio de {selectedProfData.specialty}.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-800">Servicio Adicional:</p>
                              <p className="text-green-700 leading-relaxed">
                                El certificado de antecedentes ya fue verificado. Solo valida la documentación de experiencia para {selectedProfData.specialty}.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center">
                <CardContent className="text-center p-6">
                  <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Selecciona un profesional para verificar
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                    Elige un profesional de la lista para revisar sus documentos y proceder con la verificación.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vista de Documento (simulado) */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h3 className="font-medium text-sm sm:text-base">Vista de Documento</h3>
              <Button variant="ghost" onClick={() => setViewingDocument(null)} size="sm">
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 sm:p-8 text-center">
              <Image className="w-20 h-20 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">
                Vista previa del documento (simulada)
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                En producción aquí se mostraría el documento real
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}