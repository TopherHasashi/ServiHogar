import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { Badge } from "../../ui/badge"
import { Alert, AlertDescription } from "../../ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog"
import ReviewModal from "../ReviewModal"
// import { apiPost } from "../../../lib/api"
import { 
  Calendar,
  Clock,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  AlertCircle
} from "lucide-react"

interface RequestsTabProps {
  serviceRequests: any[]
  professionalBookings: any[]
  onMarkAsCompleted: (requestId: string) => void
  onSubmitReview: (reviewData: any) => void
  onConfirmBooking?: (id: string) => void
  onCancelBooking?: (id: string) => void
  onCancelClient?: (id: string) => void
}

export default function RequestsTab({ 
  serviceRequests, 
  professionalBookings, 
  onMarkAsCompleted,
  onSubmitReview,
  onConfirmBooking,
  onCancelBooking,
  onCancelClient,
}: RequestsTabProps) {
  const [requestsTab, setRequestsTab] = useState("client")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<any>(null)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completado":
        return "bg-green-100 text-green-600"
      case "Confirmado":
        return "bg-blue-100 text-blue-600"
      case "Pendiente":
        return "bg-yellow-100 text-yellow-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const handleOpenReviewModal = (serviceRequest: any) => {
    setSelectedServiceForReview(serviceRequest)
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedServiceForReview(null)
  }

  const handleSubmitReview = (reviewData: any) => {
    onSubmitReview(reviewData)
    handleCloseReviewModal()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Mis Solicitudes
          </CardTitle>
          <CardDescription>
            Gestiona tus servicios solicitados y trabajos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={requestsTab} onValueChange={setRequestsTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client">Como Cliente</TabsTrigger>
              <TabsTrigger value="professional">Como Profesional</TabsTrigger>
            </TabsList>
            
            {/* Tab Como Cliente */}
            <TabsContent value="client" className="space-y-4">
              {serviceRequests.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tienes solicitudes de servicios aún. ¡Busca un profesional para comenzar!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {serviceRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{request.service}</CardTitle>
                            <CardDescription>
                              Profesional: {request.professional}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{request.time}</span>
                          </div>
                          {(request.comuna || request.region) && (
                            <div className="flex items-center gap-2 col-span-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{request.comuna}{request.region ? `, ${request.region}` : ''}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">
                            ${request.price.toLocaleString()}
                          </span>
                          
                          <div className="flex flex-wrap gap-2">
                            {(request.status === "Pendiente" || request.status === "Confirmado") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">Cancelar</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                                    <AlertDialogDesc>
                                      Esta acción liberará el cupo y no podrás revertirla.
                                    </AlertDialogDesc>
                                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                                      <div><span className="font-medium text-gray-800">Servicio:</span> {request.service}</div>
                                      <div><span className="font-medium text-gray-800">Profesional:</span> {request.professional}</div>
                                      <div><span className="font-medium text-gray-800">Fecha:</span> {request.date}</div>
                                      <div><span className="font-medium text-gray-800">Hora:</span> {request.time}</div>
                                      {(request.comuna || request.region) && (
                                        <div><span className="font-medium text-gray-800">Ubicación:</span> {request.comuna}{request.region ? `, ${request.region}` : ''}</div>
                                      )}
                                    </div>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Volver</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onCancelClient?.(request.id)} className="bg-red-600 hover:bg-red-700">
                                      Sí, cancelar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            
                            {request.status === "Confirmado" && (
                              <Button
                                onClick={() => onMarkAsCompleted(request.id)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar Completado
                              </Button>
                            )}
                            
                            {/* Botón Calificar siempre visible pero condicionalmente habilitado */}
                            <Button
                              onClick={() => handleOpenReviewModal(request)}
                              variant={request.status === "Completado" && !request.rating ? "default" : "secondary"}
                              size="sm"
                              className="flex items-center gap-1"
                              disabled={request.status !== "Completado" || !!request.rating}
                              title={
                                request.status !== "Completado" 
                                  ? "Marca el servicio como completado para poder calificar"
                                  : request.rating 
                                  ? "Ya has calificado este servicio"
                                  : "Calificar servicio"
                              }
                            >
                              <Star className={`w-4 h-4 ${
                                request.rating 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : request.status === "Completado" && !request.rating
                                  ? "text-white"
                                  : "text-gray-400"
                              }`} />
                              {request.rating ? `${request.rating}` : "Calificar"}
                            </Button>
                          </div>
                        </div>
                        
                        {request.review && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{request.review}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Como Profesional */}
            <TabsContent value="professional" className="space-y-4">
              {professionalBookings.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tienes reservas de servicios como profesional aún.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {professionalBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{booking.service}</CardTitle>
                            <CardDescription>
                              Cliente: {booking.client}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{booking.phone}</span>
                            </div>
                            {(booking.comuna || booking.region) && (
                              <div className="flex items-center gap-2 col-span-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{booking.comuna}{booking.region ? `, ${booking.region}` : ''}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{booking.description}</p>
                          </div>
                          
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-lg font-semibold">
                              ${booking.price.toLocaleString()}
                            </span>
                            <div className="flex gap-2">
                              {booking.status === "Pendiente" && (
                                <>
                                  <Button size="sm" onClick={() => onConfirmBooking?.(booking.id)} className="bg-green-600 hover:bg-green-700">
                                    Aceptar
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">Cancelar</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                                        <AlertDialogDesc>
                                          El cliente será notificado y el cupo quedará libre.
                                        </AlertDialogDesc>
                                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                                          <div><span className="font-medium text-gray-800">Servicio:</span> {booking.service}</div>
                                          <div><span className="font-medium text-gray-800">Cliente:</span> {booking.client}</div>
                                          <div><span className="font-medium text-gray-800">Fecha:</span> {booking.date}</div>
                                          <div><span className="font-medium text-gray-800">Hora:</span> {booking.time}</div>
                                          {booking.address && (
                                            <div><span className="font-medium text-gray-800">Dirección:</span> {booking.address}</div>
                                          )}
                                          {(booking.comuna || booking.region) && (
                                            <div><span className="font-medium text-gray-800">Ubicación:</span> {booking.comuna}{booking.region ? `, ${booking.region}` : ''}</div>
                                          )}
                                        </div>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Volver</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onCancelBooking?.(booking.id)} className="bg-red-600 hover:bg-red-700">
                                          Sí, cancelar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                              {booking.status === "Confirmado" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">Cancelar</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Cancelar esta solicitud?</AlertDialogTitle>
                                      <AlertDialogDesc>
                                        El cliente será notificado y el cupo quedará libre.
                                      </AlertDialogDesc>
                                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                                        <div><span className="font-medium text-gray-800">Servicio:</span> {booking.service}</div>
                                        <div><span className="font-medium text-gray-800">Cliente:</span> {booking.client}</div>
                                        <div><span className="font-medium text-gray-800">Fecha:</span> {booking.date}</div>
                                        <div><span className="font-medium text-gray-800">Hora:</span> {booking.time}</div>
                                        {booking.address && (
                                          <div><span className="font-medium text-gray-800">Dirección:</span> {booking.address}</div>
                                        )}
                                        {(booking.comuna || booking.region) && (
                                          <div><span className="font-medium text-gray-800">Ubicación:</span> {booking.comuna}{booking.region ? `, ${booking.region}` : ''}</div>
                                        )}
                                      </div>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Volver</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => onCancelBooking?.(booking.id)} className="bg-red-600 hover:bg-red-700">
                                        Sí, cancelar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Reseñas */}
      {showReviewModal && selectedServiceForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={handleCloseReviewModal}
          onSubmit={handleSubmitReview}
          serviceRequest={selectedServiceForReview}
        />
      )}
    </>
  )
}