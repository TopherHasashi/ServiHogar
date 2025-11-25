import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { apiGetAuth, apiPostAuth } from "../../lib/api"
import {
  Search,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  RefreshCw,
  Eye,
  Clock,
  Info
} from "lucide-react"

interface CanceledRequest {
  id_solicitud_servicio: string
  titulo: string
  fecha_programada: string
  cancelado_en: string
  razon_cancelacion: string
  cliente_nombre: string
  cliente_email: string
  profesional_nombre: string
  profesional_email: string
  servicio_nombre: string
  monto: number
  monto_reembolso: number
  estado_pago: string
  metodo_pago: string
  reembolsado_en: string | null
  cancelado_por: string
}

export default function RefundsManagement() {
  const [canceledRequests, setCanceledRequests] = useState<CanceledRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CanceledRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CanceledRequest | null>(null)
  const [processingRefund, setProcessingRefund] = useState(false)

  // Estadísticas
  const [stats, setStats] = useState({
    total_canceladas: 0,
    pendiente_reembolso: 0,
    reembolsadas: 0,
    monto_total_reembolsar: 0,
    monto_total_reembolsado: 0
  })

  useEffect(() => {
    fetchCanceledRequests()
  }, [currentPage])

  useEffect(() => {
    // Filtrar resultados localmente
    if (searchTerm.trim() === "") {
      setFilteredRequests(canceledRequests)
    } else {
      const filtered = canceledRequests.filter(req =>
        req.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.profesional_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.servicio_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id_solicitud_servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.razon_cancelacion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRequests(filtered)
    }
  }, [searchTerm, canceledRequests])

  const fetchCanceledRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiGetAuth(`/api/admin/refunds/?page=${currentPage}&page_size=${itemsPerPage}`)
      
      setCanceledRequests(data.solicitudes || [])
      setFilteredRequests(data.solicitudes || [])
      setTotalCount(data.total || 0)
      setStats(data.estadisticas || stats)
    } catch (err: any) {
      console.error("Error cargando solicitudes canceladas:", err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateHoursDifference = (cancelDate: string, serviceDate: string) => {
    if (!cancelDate || !serviceDate) return "N/A"
    
    const cancel = new Date(cancelDate)
    const service = new Date(serviceDate)
    const diffMs = service.getTime() - cancel.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours > 24) {
      return "+24h"
    }
    
    return `${Math.max(0, Math.round(diffHours))}h`
  }

  const handleOpenDialog = (request: CanceledRequest) => {
    setSelectedRequest(request)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedRequest(null)
  }

  const handleProcessRefund = async (percentage: number) => {
    if (!selectedRequest || !selectedRequest.id_solicitud_servicio) return

    try {
      setProcessingRefund(true)
      
      const response = await apiPostAuth('/api/admin/process-refund/', {
        solicitud_id: selectedRequest.id_solicitud_servicio,
        porcentaje_reembolso: percentage
      })

      if (response.success) {
        // Refrescar los datos
        await fetchCanceledRequests()
        handleCloseDialog()
        alert(`Reembolso del ${percentage}% procesado exitosamente`)
      }
    } catch (err: any) {
      console.error("Error procesando reembolso:", err)
      alert(err.message || "Error al procesar el reembolso")
    } finally {
      setProcessingRefund(false)
    }
  }

  const getPaymentStatusBadge = (estado: string, reembolsado: string | null) => {
    if (reembolsado) {
      return <Badge className="bg-green-100 text-green-700">Reembolsado</Badge>
    }
    if (estado === 'en_revision') {
      return <Badge className="bg-blue-100 text-blue-700">En Revisión</Badge>
    }
    if (estado === 'aprobado') {
      return <Badge className="bg-yellow-100 text-yellow-700">Pendiente Reembolso</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-700">{estado}</Badge>
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_canceladas}</div>
            <p className="text-xs text-gray-500">Solicitudes canceladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pendiente Reembolso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendiente_reembolso}</div>
            <p className="text-xs text-gray-500">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reembolsadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reembolsadas}</div>
            <p className="text-xs text-gray-500">Procesadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monto a Reembolsar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{formatCurrency(stats.monto_total_reembolsar)}</div>
            <p className="text-xs text-gray-500">Pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monto Reembolsado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(stats.monto_total_reembolsado)}</div>
            <p className="text-xs text-gray-500">Total procesado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Solicitudes Canceladas</CardTitle>
              <CardDescription>
                Gestión de reembolsos de servicios cancelados
              </CardDescription>
            </div>
            <Button onClick={fetchCanceledRequests} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, profesional, servicio, ID o razón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando solicitudes canceladas...</span>
            </div>
          )}

          {error && !loading && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && filteredRequests.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No se encontraron solicitudes canceladas.
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && filteredRequests.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Profesional</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado Pago</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id_solicitud_servicio}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{req.servicio_nombre}</span>
                            <span className="text-xs text-gray-500">{req.titulo}</span>
                            <span className="text-xs text-gray-400">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDate(req.fecha_programada)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{req.cliente_nombre}</span>
                            <span className="text-xs text-gray-500">{req.cliente_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{req.profesional_nombre}</span>
                            <span className="text-xs text-gray-500">{req.profesional_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{formatCurrency(req.monto)}</span>
                            {req.reembolsado_en && req.monto_reembolso > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                Reembolsado: {formatCurrency(req.monto_reembolso)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{req.metodo_pago}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(req.estado_pago, req.reembolsado_en)}
                          {req.reembolsado_en && (
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(req.reembolsado_en)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(req)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {filteredRequests.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} -{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} solicitudes
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center px-3 text-sm">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle y acciones de reembolso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-blue-600" />
              Detalle de Solicitud Cancelada
            </DialogTitle>
            <DialogDescription className="text-xs">
              Información completa y opciones de reembolso
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-3">
              {/* Información General - Header Compacto */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-blue-900">{selectedRequest.servicio_nombre}</h3>
                    <p className="text-xs text-blue-700">{selectedRequest.titulo}</p>
                    <p className="text-xs text-blue-600 mt-0.5 font-mono">ID: {selectedRequest.id_solicitud_servicio}</p>
                  </div>
                  {getPaymentStatusBadge(selectedRequest.estado_pago, selectedRequest.reembolsado_en)}
                </div>
              </div>

              {/* Grid de información principal en 3 columnas */}
              <div className="grid grid-cols-3 gap-3">
                {/* Cliente */}
                <div className="border rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <User className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Cliente</span>
                  </div>
                  <p className="font-medium text-sm">{selectedRequest.cliente_nombre}</p>
                  <p className="text-xs text-gray-600">{selectedRequest.cliente_email}</p>
                </div>

                {/* Profesional */}
                <div className="border rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Briefcase className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">Profesional</span>
                  </div>
                  <p className="font-medium text-sm">{selectedRequest.profesional_nombre}</p>
                  <p className="text-xs text-gray-600">{selectedRequest.profesional_email}</p>
                </div>

                {/* Tiempo de anticipación */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-yellow-700" />
                    <span className="text-xs font-medium text-yellow-700">Anticipación</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {calculateHoursDifference(selectedRequest.cancelado_en, selectedRequest.fecha_programada)}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {calculateHoursDifference(selectedRequest.cancelado_en, selectedRequest.fecha_programada) === "+24h" 
                      ? "Más de 24h" 
                      : "Menos de 24h"}
                  </p>
                </div>
              </div>

              {/* Fechas y Monto en 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fechas */}
                <div className="border rounded-lg p-2">
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-gray-600">Servicio Programado</span>
                      </div>
                      <p className="text-sm font-medium">{formatDate(selectedRequest.fecha_programada)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-gray-600">Cancelado</span>
                      </div>
                      <p className="text-sm font-medium">{formatDate(selectedRequest.cancelado_en)}</p>
                      <Badge variant="outline" className="text-xs mt-1">{selectedRequest.cancelado_por}</Badge>
                    </div>
                  </div>
                </div>

                {/* Información de Pago */}
                <div className="border rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-2">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">Información de Pago</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Monto Total:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(selectedRequest.monto)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Método:</span>
                      <Badge variant="outline" className="text-xs">{selectedRequest.metodo_pago}</Badge>
                    </div>
                    {selectedRequest.reembolsado_en && selectedRequest.monto_reembolso > 0 && (
                      <>
                        <div className="flex justify-between items-center pt-1 border-t">
                          <span className="text-xs text-gray-600">Reembolsado:</span>
                          <span className="text-base font-bold text-green-600">{formatCurrency(selectedRequest.monto_reembolso)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Fecha:</span>
                          <span className="text-xs text-green-600">{formatDate(selectedRequest.reembolsado_en)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Razón de cancelación */}
              <div className="border rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-gray-600">Razón de Cancelación</span>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {selectedRequest.razon_cancelacion || "Sin razón especificada"}
                </p>
              </div>

              {/* Acciones de reembolso */}
              {!selectedRequest.reembolsado_en && (
                <div className="border-t pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-3 h-3" />
                    <span className="text-sm font-semibold">Opciones de Reembolso</span>
                  </div>
                  <Alert className="mb-2 bg-blue-50 border-blue-200 p-2">
                    <AlertDescription className="text-xs text-blue-800">
                      Selecciona el porcentaje según la política de cancelación y tiempo de anticipación.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-700 hover:bg-green-50 flex-col h-auto py-2"
                      onClick={() => handleProcessRefund(100)}
                      disabled={processingRefund}
                    >
                      {processingRefund ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-bold">100%</span>
                          </div>
                          <div className="text-xs mt-1">{formatCurrency(selectedRequest.monto)}</div>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 flex-col h-auto py-2"
                      onClick={() => handleProcessRefund(50)}
                      disabled={processingRefund}
                    >
                      {processingRefund ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-bold">50%</span>
                          </div>
                          <div className="text-xs mt-1">{formatCurrency(selectedRequest.monto * 0.5)}</div>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-700 hover:bg-red-50 flex-col h-auto py-2"
                      onClick={() => handleProcessRefund(0)}
                      disabled={processingRefund}
                    >
                      {processingRefund ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs font-bold mt-1">No Reembolsar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
