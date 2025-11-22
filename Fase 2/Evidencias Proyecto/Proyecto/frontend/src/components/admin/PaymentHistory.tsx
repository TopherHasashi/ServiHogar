import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Search, DollarSign, Calendar, User, Briefcase, ChevronLeft, ChevronRight } from "lucide-react"
import { apiGetAuth } from "../../lib/api"

interface Payment {
  id_pago: string
  nombre_cliente: string
  nombre_profesional: string
  servicio: string
  monto: number
  estado: string
  metodo_pago: string
  fecha_pago: string
  id_solicitud: string
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalAprobados, setTotalAprobados] = useState(0)
  const [montoTotal, setMontoTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    loadPayments(1)
  }, [])

  const loadPayments = async (page: number = 1) => {
    try {
      setLoading(true)
      const data = await apiGetAuth(`/api/admin/payments/?page=${page}&page_size=${pageSize}`)
      setPayments(data.pagos || [])
      setTotalCount(data.total || 0)
      setTotalPages(data.total_pages || 1)
      setCurrentPage(page)
      setTotalAprobados(data.estadisticas?.total_aprobados || 0)
      setMontoTotal(data.estadisticas?.monto_total || 0)
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => 
    payment.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.nombre_profesional.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.id_solicitud.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (estado: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      'aprobado': { label: 'Aprobado', variant: 'default' },
      'pendiente': { label: 'Pendiente', variant: 'secondary' },
      'rechazado': { label: 'Rechazado', variant: 'destructive' },
      'cancelado': { label: 'Cancelado', variant: 'outline' },
    }
    const status = statusMap[estado.toLowerCase()] || { label: estado, variant: 'outline' as const }
    return <Badge variant={status.variant}>{status.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>
            Registro completo de todas las transacciones realizadas en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Buscador */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, profesional, servicio o ID de solicitud..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabla de pagos */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando pagos...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron pagos
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Solicitud</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id_pago}>
                      <TableCell className="font-mono text-xs">
                        {payment.id_solicitud.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{payment.nombre_cliente}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{payment.nombre_profesional}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.servicio}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(payment.monto)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.estado)}</TableCell>
                      <TableCell className="capitalize">{payment.metodo_pago}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(payment.fecha_pago)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Resumen */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total de Pagos</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagos Aprobados</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAprobados}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(montoTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Paginación */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {totalCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} de {totalCount} pagos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPayments(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPayments(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0 || loading}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
