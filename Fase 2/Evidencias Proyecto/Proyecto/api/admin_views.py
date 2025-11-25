"""
Endpoints administrativos para el panel de administrador.
Business Intelligence y métricas de la plataforma.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging
import uuid

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_dashboard_summary(request):
	"""
	Resumen ejecutivo del panel de administrador.
	Retorna KPIs principales de la plataforma.
	"""
	# Verificar que el usuario sea administrador
	try:
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rol FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				return Response(
					{"message": "Acceso denegado. Solo administradores."},
					status=status.HTTP_403_FORBIDDEN
				)
	except Exception as e:
		logger.error(f"Error verificando rol de administrador: {e}")
		return Response(
			{"message": "Error verificando permisos"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	
	try:
		# Fechas para comparación
		now = timezone.now()
		first_day_current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
		first_day_last_month = (first_day_current_month - timedelta(days=1)).replace(day=1)
		
		with connection.cursor() as cur:
			# 1. INGRESOS DEL MES (comisión de la plataforma)
			# Solo pagos con estado 'aprobado', excluyendo cualquier otro estado
			cur.execute(
				"""
				SELECT COALESCE(SUM(comision_plataforma), 0) as total_comision
				FROM pago
				WHERE estado = 'aprobado'
				  AND creado_en >= %s
				  AND creado_en < %s
				""",
				[first_day_current_month, now]
			)
			total_revenue = float(cur.fetchone()[0] or 0)
			
			# Ingresos del mes anterior para calcular crecimiento
			cur.execute(
				"""
				SELECT COALESCE(SUM(comision_plataforma), 0) as total_comision
				FROM pago
				WHERE estado = 'aprobado'
				  AND creado_en >= %s
				  AND creado_en < %s
				""",
				[first_day_last_month, first_day_current_month]
			)
			last_month_revenue = float(cur.fetchone()[0] or 0)
			
			monthly_growth = 0
			if last_month_revenue > 0:
				monthly_growth = round(((total_revenue - last_month_revenue) / last_month_revenue) * 100, 1)
			
			# 2. USUARIOS ACTIVOS (usuarios que han iniciado sesión en los últimos 30 días)
			thirty_days_ago = now - timedelta(days=30)
			cur.execute(
				"""
				SELECT COUNT(DISTINCT rut) as active_users
				FROM usuario
				WHERE ultima_actividad >= %s
				  AND rol IN ('cliente', 'profesional')
				""",
				[thirty_days_ago]
			)
			active_users = cur.fetchone()[0] or 0
			
			# Usuarios activos hace 30-60 días para calcular crecimiento
			sixty_days_ago = now - timedelta(days=60)
			cur.execute(
				"""
				SELECT COUNT(DISTINCT rut) as active_users
				FROM usuario
				WHERE ultima_actividad >= %s
				  AND ultima_actividad < %s
				  AND rol IN ('cliente', 'profesional')
				""",
				[sixty_days_ago, thirty_days_ago]
			)
			last_period_users = cur.fetchone()[0] or 0
			
			user_growth = 0
			if last_period_users > 0:
				user_growth = round(((active_users - last_period_users) / last_period_users) * 100, 1)
			
			# 3. PROFESIONALES ACTIVOS (profesionales que han confirmado al menos 1 solicitud en 30 días)
			cur.execute(
				"""
				SELECT COUNT(DISTINCT rut_profesional) as active_professionals
				FROM solicitud_servicio
				WHERE estado IN ('confirmado', 'completado')
				  AND actualizado_en >= %s
				""",
				[thirty_days_ago]
			)
			active_professionals = cur.fetchone()[0] or 0
			
			# Profesionales activos del periodo anterior
			cur.execute(
				"""
				SELECT COUNT(DISTINCT rut_profesional) as active_professionals
				FROM solicitud_servicio
				WHERE estado IN ('confirmado', 'completado')
				  AND actualizado_en >= %s
				  AND actualizado_en < %s
				""",
				[sixty_days_ago, thirty_days_ago]
			)
			last_period_professionals = cur.fetchone()[0] or 0
			
			professional_growth = 0
			if last_period_professionals > 0:
				professional_growth = round(((active_professionals - last_period_professionals) / last_period_professionals) * 100, 1)
			
			# 4. CALIFICACIÓN PROMEDIO (de todas las reseñas)
			cur.execute(
				"""
				SELECT 
					AVG((calificacion_calidad + calificacion_puntualidad + calificacion_comunicacion) / 3.0) as avg_rating,
					COUNT(*) as total_reviews
				FROM resena
				WHERE creado_en >= %s
				""",
				[thirty_days_ago]
			)
			rating_row = cur.fetchone()
			avg_rating = round(float(rating_row[0] or 0), 2)
			total_reviews = rating_row[1] or 0
			
			# Calificación del periodo anterior
			cur.execute(
				"""
				SELECT AVG((calificacion_calidad + calificacion_puntualidad + calificacion_comunicacion) / 3.0) as avg_rating
				FROM resena
				WHERE creado_en >= %s
				  AND creado_en < %s
				""",
				[sixty_days_ago, thirty_days_ago]
			)
			last_period_rating = float(cur.fetchone()[0] or 0)
			rating_change = round(avg_rating - last_period_rating, 2) if last_period_rating > 0 else 0
			
			# 5. TASA DE COMPLETACIÓN (% de solicitudes que se completan exitosamente)
			cur.execute(
				"""
				SELECT 
					COUNT(*) FILTER (WHERE estado = 'completado') as completed,
					COUNT(*) as total
				FROM solicitud_servicio
				WHERE creado_en >= %s
				  AND estado NOT IN ('cancelado')
				""",
				[thirty_days_ago]
			)
			completion_row = cur.fetchone()
			completed_count = completion_row[0] or 0
			total_count = completion_row[1] or 0
			completion_rate = round((completed_count / total_count * 100), 1) if total_count > 0 else 0
			
			# 6. TIEMPO PROMEDIO DE RESPUESTA (tiempo desde pendiente hasta confirmado)
			cur.execute(
				"""
				SELECT AVG(EXTRACT(EPOCH FROM (actualizado_en - creado_en)) / 3600) as avg_hours
				FROM solicitud_servicio
				WHERE estado IN ('confirmado', 'completado')
				  AND creado_en >= %s
				  AND actualizado_en IS NOT NULL
				""",
				[thirty_days_ago]
			)
			avg_response_time = round(float(cur.fetchone()[0] or 0), 1)
			
			# 7. DISTRIBUCIÓN DE SERVICIOS
			cur.execute(
				"""
				SELECT 
					c.nombre as categoria,
					COUNT(s.id_solicitud_servicio) as total_servicios,
					COALESCE(SUM(p.monto), 0) as total_revenue,
					COALESCE(AVG(p.monto), 0) as avg_price
				FROM solicitud_servicio s
				INNER JOIN servicio_profesional sp ON s.id_servicio_profesional = sp.id_servicio_profesional
				INNER JOIN categoria_servicio c ON sp.id_categoria_servicio = c.id_categoria_servicio
				LEFT JOIN pago p ON s.id_solicitud_servicio = p.id_solicitud_servicio 
					AND p.estado = 'aprobado'
				WHERE s.creado_en >= %s
				GROUP BY c.nombre
				ORDER BY total_servicios DESC
				LIMIT 10
				""",
				[thirty_days_ago]
			)
			service_distribution = []
			for row in cur.fetchall():
				service_distribution.append({
					"name": row[0],
					"value": row[1],
					"revenue": float(row[2]),
					"avgPrice": float(row[3])
				})
			
			# 8. TOTAL DE PROFESIONALES
			cur.execute(
				"""
				SELECT COUNT(*) as total_professionals
				FROM usuario
				WHERE rol = 'profesional'
				"""
			)
			total_professionals = cur.fetchone()[0] or 0
			
			# 9. TOP PERFORMERS (profesionales con calificación >= 4.8)
			cur.execute(
				"""
				SELECT COUNT(DISTINCT r.rut_evaluado) as top_performers
				FROM resena r
				WHERE (r.calificacion_calidad + r.calificacion_puntualidad + r.calificacion_comunicacion) / 3.0 >= 4.8
				  AND r.creado_en >= %s
				""",
				[thirty_days_ago]
			)
			top_performers = cur.fetchone()[0] or 0
			
			# 10. SERVICIOS PROMEDIO POR PROFESIONAL
			cur.execute(
				"""
				WITH professional_counts AS (
					SELECT 
						rut_profesional,
						COUNT(*) as service_count
					FROM solicitud_servicio
					WHERE creado_en >= %s
					  AND estado IN ('confirmado', 'completado')
					GROUP BY rut_profesional
				)
				SELECT AVG(service_count) as avg_services
				FROM professional_counts
				""",
				[thirty_days_ago]
			)
			avg_services_per_professional = round(float(cur.fetchone()[0] or 0), 1)
			
		# Construir respuesta
		data = {
			"kpis": {
				"totalRevenue": total_revenue,
				"monthlyGrowth": monthly_growth,
				"activeUsers": active_users,
				"userGrowth": user_growth,
				"activeProfessionals": active_professionals,
				"professionalGrowth": professional_growth,
				"avgRating": avg_rating,
				"ratingChange": rating_change,
				"completionRate": completion_rate,
				"avgResponseTime": avg_response_time
			},
			"professionalMetrics": {
				"total": total_professionals,
				"active": active_professionals,
				"topPerformers": top_performers,
				"avgServicesPerMonth": avg_services_per_professional
			},
			"serviceDistribution": service_distribution,
			"metadata": {
				"periodStart": first_day_current_month.isoformat(),
				"periodEnd": now.isoformat(),
				"totalReviews": total_reviews
			}
		}
		
		return Response(data)
		
	except Exception as e:
		logger.exception("Error obteniendo resumen ejecutivo")
		return Response(
			{"message": "Error obteniendo datos del dashboard", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def payment_metrics(request):
	"""
	Métricas del sistema de escrow de pagos.
	Retorna ganancias, retenciones, pagos procesados, etc.
	"""
	# Verificar que el usuario sea administrador
	if not request.user.is_staff:
		return Response(
			{"message": "Acceso denegado. Solo administradores."},
			status=status.HTTP_403_FORBIDDEN
		)
	
	try:
		now = timezone.now()
		first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
		
		with connection.cursor() as cur:
			# 1. Comisiones totales acumuladas (solo pagos aprobados)
			cur.execute("""
				SELECT 
					COALESCE(SUM(comision_plataforma), 0) AS comisiones_totales,
					COUNT(*) AS total_pagos
				FROM pago
				WHERE estado = 'aprobado'
			""")
			row = cur.fetchone()
			comisiones_totales, total_pagos = row
			
			# 2. Comisiones del mes actual (solo pagos aprobados)
			cur.execute("""
				SELECT 
					COALESCE(SUM(comision_plataforma), 0) AS comisiones_mes,
					COUNT(*) AS pagos_mes
				FROM pago
				WHERE estado = 'aprobado'
				  AND creado_en >= %s
			""", [first_day_month])
			row = cur.fetchone()
			comisiones_mes, pagos_mes = row
			
			# 3. Dinero retenido actualmente (aprobados no liberados ni reembolsados)
			cur.execute("""
				SELECT 
					COALESCE(SUM(monto), 0) AS dinero_retenido,
					COUNT(*) AS pagos_retenidos
				FROM pago
				WHERE estado = 'aprobado'
				  AND liberado_al_profesional_en IS NULL
				  AND reembolsado_en IS NULL
			""")
			row = cur.fetchone()
			dinero_retenido, pagos_retenidos = row
			
			# 4. Pagos liberados (solo aprobados y liberados)
			cur.execute("""
				SELECT 
					COALESCE(SUM(monto_profesional), 0) AS total_liberado,
					COUNT(*) AS pagos_liberados
				FROM pago
				WHERE estado = 'aprobado'
				  AND liberado_al_profesional_en IS NOT NULL
			""")
			row = cur.fetchone()
			total_liberado, pagos_liberados = row
			
			# 5. Reembolsos procesados
			cur.execute("""
				SELECT 
					COALESCE(SUM(monto_reembolso), 0) AS total_reembolsado,
					COUNT(*) AS reembolsos_procesados
				FROM pago
				WHERE estado = 'reembolsado'
			""")
			row = cur.fetchone()
			total_reembolsado, reembolsos_procesados = row
			
			# 6. Pagos a profesionales procesados
			cur.execute("""
				SELECT 
					COALESCE(SUM(monto_a_pagar), 0) AS total_pagado_profesionales,
					COUNT(*) AS pagos_completados
				FROM pago_profesional
				WHERE estado = 'pagado'
			""")
			row = cur.fetchone()
			total_pagado_prof, pagos_completados = row
			
			# 7. Tasa de completitud vs cancelación
			cur.execute("""
				SELECT 
					COUNT(CASE WHEN estado = 'completado' THEN 1 END) AS servicios_completados,
					COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) AS servicios_cancelados,
					COUNT(*) AS total_servicios
				FROM solicitud_servicio
				WHERE creado_en >= %s
			""", [first_day_month])
			row = cur.fetchone()
			completados, cancelados, total_servicios = row
			
			tasa_completitud = (completados / total_servicios * 100) if total_servicios > 0 else 0
			tasa_cancelacion = (cancelados / total_servicios * 100) if total_servicios > 0 else 0
			
			# 8. Top 5 profesionales con más ganancias este mes
			cur.execute("""
				SELECT 
					u.nombres || ' ' || u.apellidos AS profesional,
					u.rut,
					COALESCE(SUM(pp.monto_a_pagar), 0) AS ganancias,
					COUNT(*) AS servicios
				FROM pago_profesional pp
				INNER JOIN usuario u ON u.rut = pp.rut_profesional
				WHERE pp.estado = 'pagado'
				  AND pp.fecha_pagado >= %s
				GROUP BY u.rut, u.nombres, u.apellidos
				ORDER BY ganancias DESC
				LIMIT 5
			""", [first_day_month])
			top_profesionales = []
			for row in cur.fetchall():
				top_profesionales.append({
					"profesional": row[0],
					"rut": row[1],
					"ganancias": int(row[2]) if row[2] else 0,
					"servicios": row[3]
				})
		
		data = {
			"comisiones": {
				"totales": int(comisiones_totales) if comisiones_totales else 0,
				"mes_actual": int(comisiones_mes) if comisiones_mes else 0,
				"total_pagos": total_pagos
			},
			"escrow": {
				"dinero_retenido": int(dinero_retenido) if dinero_retenido else 0,
				"pagos_retenidos": pagos_retenidos,
				"total_liberado": int(total_liberado) if total_liberado else 0,
				"pagos_liberados": pagos_liberados
			},
			"reembolsos": {
				"total": int(total_reembolsado) if total_reembolsado else 0,
				"cantidad": reembolsos_procesados
			},
			"pagos_profesionales": {
				"total_pagado": int(total_pagado_prof) if total_pagado_prof else 0,
				"cantidad": pagos_completados
			},
			"tasas": {
				"completitud": round(tasa_completitud, 2),
				"cancelacion": round(tasa_cancelacion, 2),
				"servicios_completados": completados,
				"servicios_cancelados": cancelados,
				"total_servicios": total_servicios
			},
			"top_profesionales": top_profesionales,
			"periodo": {
				"inicio": first_day_month.isoformat(),
				"fin": now.isoformat()
			}
		}
		
		return Response(data)
		
	except Exception as e:
		logger.exception("Error obteniendo métricas de pagos")
		return Response(
			{"message": "Error obteniendo métricas", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_payment_history(request):
	"""
	Obtiene el historial completo de pagos de la plataforma.
	Incluye información del cliente, profesional, servicio y detalles del pago.
	"""
	# Verificar que el usuario sea administrador
	try:
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rol FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				return Response(
					{"message": "Acceso denegado. Solo administradores."},
					status=status.HTTP_403_FORBIDDEN
				)
	except Exception as e:
		logger.exception("Error verificando rol de administrador")
		return Response(
			{"message": "Error verificando permisos"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	
	try:
		with connection.cursor() as cur:
			# Obtener parámetros de paginación
			page = int(request.GET.get('page', 1))
			page_size = int(request.GET.get('page_size', 10))
			offset = (page - 1) * page_size
			
			# Contar total de pagos
			cur.execute("SELECT COUNT(*) FROM pago")
			total_count = cur.fetchone()[0]
			
			# Obtener estadísticas globales (solo pagos aprobados)
			cur.execute("""
				SELECT 
					COUNT(*) as total_aprobados,
					COALESCE(SUM(monto), 0) as monto_total
				FROM pago 
				WHERE estado = 'aprobado'
			""")
			stats_row = cur.fetchone()
			total_aprobados = stats_row[0] if stats_row else 0
			monto_total = int(stats_row[1]) if stats_row and stats_row[1] else 0
			
			logger.info("🔍 Ejecutando consulta de pagos con LEFT JOINs...")
			cur.execute(
				"""
				SELECT 
					p.id_pago_mercadopago,
					p.id_solicitud_servicio,
					p.monto,
					p.estado,
					p.metodo_pago,
					p.creado_en,
					p.actualizado_en,
					-- Información del cliente
					COALESCE(uc.nombres || ' ' || uc.apellidos, 'Cliente Desconocido') AS nombre_cliente,
					-- Información del profesional
					COALESCE(up.nombres || ' ' || up.apellidos, 'Profesional Desconocido') AS nombre_profesional,
					-- Información del servicio
					COALESCE(cs.nombre, 'Servicio Desconocido') AS nombre_servicio,
					COALESCE(ss.titulo, 'Sin título') AS titulo_solicitud,
					ss.fecha_programada
				FROM pago p
				LEFT JOIN solicitud_servicio ss ON ss.id_solicitud_servicio = p.id_solicitud_servicio
				LEFT JOIN usuario uc ON uc.rut = ss.rut_cliente
				LEFT JOIN usuario up ON up.rut = ss.rut_profesional
				LEFT JOIN servicio_profesional sp ON sp.id_servicio_profesional = ss.id_servicio_profesional
				LEFT JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
				ORDER BY p.creado_en DESC
				LIMIT %s OFFSET %s
				""",
				[page_size, offset]
			)
			rows = cur.fetchall()
			logger.info(f"✅ Consulta ejecutada. Filas encontradas: {len(rows)}")
			
			pagos = []
			for row in rows:
				pagos.append({
					"id_pago": str(row[0]),
					"id_solicitud": str(row[1]) if row[1] else "N/A",
					"monto": int(row[2]) if row[2] else 0,
					"estado": row[3] or 'pendiente',
					"metodo_pago": row[4] or 'mercadopago',
					"fecha_pago": row[5].isoformat() if row[5] else None,
					"actualizado_en": row[6].isoformat() if row[6] else None,
					"nombre_cliente": row[7],
					"nombre_profesional": row[8],
					"servicio": row[9],
					"titulo_solicitud": row[10],
					"fecha_programada": row[11].isoformat() if row[11] else None
				})
			
			logger.info(f"📦 Devolviendo {len(pagos)} pagos al frontend")
			total_pages = (total_count + page_size - 1) // page_size
			return Response({
				"pagos": pagos,
				"total": total_count,
				"page": page,
				"page_size": page_size,
				"total_pages": total_pages,
				"estadisticas": {
					"total_aprobados": total_aprobados,
					"monto_total": monto_total
				}
			})
			
	except Exception as e:
		logger.exception("Error obteniendo historial de pagos")
		return Response(
			{"message": "Error obteniendo historial", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_refunds_list(request):
	"""
	Obtiene lista de solicitudes canceladas con información de reembolsos.
	Incluye razón de cancelación y estado del reembolso.
	"""
	# Verificar que el usuario sea administrador
	try:
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rol FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				return Response(
					{"message": "Acceso denegado. Solo administradores."},
					status=status.HTTP_403_FORBIDDEN
				)
	except Exception as e:
		logger.error(f"Error verificando rol de administrador: {e}")
		return Response(
			{"message": "Error verificando permisos"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	
	try:
		page = int(request.GET.get('page', 1))
		page_size = int(request.GET.get('page_size', 10))
		offset = (page - 1) * page_size
		
		with connection.cursor() as cur:
			# Contar total de solicitudes canceladas
			cur.execute("SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'cancelado'")
			total_count = cur.fetchone()[0]
			
			# Obtener estadísticas
			cur.execute("""
				SELECT 
					COUNT(*) as total_canceladas,
					COUNT(CASE WHEN p.estado IN ('aprobado', 'en_revision') AND p.reembolsado_en IS NULL THEN 1 END) as pendiente_reembolso,
					COUNT(CASE WHEN p.reembolsado_en IS NOT NULL THEN 1 END) as reembolsadas,
					COALESCE(SUM(CASE WHEN p.estado IN ('aprobado', 'en_revision') AND p.reembolsado_en IS NULL THEN p.monto ELSE 0 END), 0) as monto_pendiente,
					COALESCE(SUM(CASE WHEN p.reembolsado_en IS NOT NULL THEN p.monto_reembolso ELSE 0 END), 0) as monto_reembolsado
				FROM solicitud_servicio ss
				LEFT JOIN pago p ON p.id_solicitud_servicio = ss.id_solicitud_servicio
				WHERE ss.estado = 'cancelado'
			""")
			stats_row = cur.fetchone()
			
			estadisticas = {
				"total_canceladas": stats_row[0] if stats_row else 0,
				"pendiente_reembolso": stats_row[1] if stats_row else 0,
				"reembolsadas": stats_row[2] if stats_row else 0,
				"monto_total_reembolsar": int(stats_row[3]) if stats_row and stats_row[3] else 0,
				"monto_total_reembolsado": int(stats_row[4]) if stats_row and stats_row[4] else 0
			}
			
			# Obtener lista paginada de solicitudes canceladas
			cur.execute("""
				SELECT 
					ss.id_solicitud_servicio,
					ss.titulo,
					ss.fecha_programada,
					ss.cancelado_en,
					ss.razon_cancelacion,
					-- Cliente
					COALESCE(uc.nombres || ' ' || uc.apellidos, 'Cliente Desconocido') AS cliente_nombre,
					uc.email AS cliente_email,
					-- Profesional
					COALESCE(up.nombres || ' ' || up.apellidos, 'Profesional Desconocido') AS profesional_nombre,
					up.email AS profesional_email,
					-- Servicio
					COALESCE(cs.nombre, 'Servicio Desconocido') AS servicio_nombre,
					-- Pago
					COALESCE(p.monto, 0) AS monto,
					COALESCE(p.monto_reembolso, 0) AS monto_reembolso,
					COALESCE(p.estado, 'sin_pago') AS estado_pago,
					COALESCE(p.metodo_pago, 'N/A') AS metodo_pago,
					p.reembolsado_en,
					ss.rut_cliente,
					ss.rut_profesional
				FROM solicitud_servicio ss
				LEFT JOIN usuario uc ON uc.rut = ss.rut_cliente
				LEFT JOIN usuario up ON up.rut = ss.rut_profesional
				LEFT JOIN servicio_profesional sp ON sp.id_servicio_profesional = ss.id_servicio_profesional
				LEFT JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
				LEFT JOIN pago p ON p.id_solicitud_servicio = ss.id_solicitud_servicio
				WHERE ss.estado = 'cancelado'
				ORDER BY ss.cancelado_en DESC
				LIMIT %s OFFSET %s
			""", [page_size, offset])
			
			rows = cur.fetchall()
			
			solicitudes = []
			for row in rows:
				# Determinar quién canceló basado en la razón de cancelación
				cancelado_por = "Sistema"
				if row[4]:  # razon_cancelacion
					razon_lower = row[4].lower()
					if "cliente" in razon_lower or "client" in razon_lower:
						cancelado_por = "Cliente"
					elif "profesional" in razon_lower or "professional" in razon_lower:
						cancelado_por = "Profesional"
				
				monto_original = int(row[10]) if row[10] else 0
				monto_reembolso = int(row[11]) if row[11] else 0
				
				solicitudes.append({
					"id_solicitud_servicio": str(row[0]),
					"titulo": row[1] or "Sin título",
					"fecha_programada": row[2].isoformat() if row[2] else None,
					"cancelado_en": row[3].isoformat() if row[3] else None,
					"razon_cancelacion": row[4] or "Sin razón especificada",
					"cliente_nombre": row[5],
					"cliente_email": row[6] or "N/A",
					"profesional_nombre": row[7],
					"profesional_email": row[8] or "N/A",
					"servicio_nombre": row[9],
					"monto": monto_original,
					"monto_reembolso": monto_reembolso,
					"estado_pago": row[12],
					"metodo_pago": row[13],
					"reembolsado_en": row[14].isoformat() if row[14] else None,
					"cancelado_por": cancelado_por
				})
			
			total_pages = (total_count + page_size - 1) // page_size
			
			return Response({
				"solicitudes": solicitudes,
				"total": total_count,
				"page": page,
				"total_pages": total_pages,
				"estadisticas": estadisticas
			})
			
	except Exception as e:
		logger.exception("Error obteniendo lista de reembolsos")
		return Response(
			{"message": "Error obteniendo datos de reembolsos", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_refund(request):
	"""
	Procesa un reembolso para una solicitud cancelada.
	Actualiza el estado del pago según el porcentaje de reembolso.
	"""
	try:
		# Verificar si el usuario es admin
		with connection.cursor() as cursor:
			cursor.execute("""
				SELECT rol FROM usuario WHERE email = %s
			""", [request.user.email])
			user = cursor.fetchone()
			
			if not user or user[0] != 'administrador':
				return Response(
					{"message": "No tienes permisos para realizar esta acción"},
					status=status.HTTP_403_FORBIDDEN
				)
		
		# Obtener datos de la petición
		solicitud_id = request.data.get('solicitud_id')
		porcentaje_reembolso = request.data.get('porcentaje_reembolso')
		
		if not solicitud_id:
			return Response(
				{"message": "ID de solicitud es requerido"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		if porcentaje_reembolso is None:
			return Response(
				{"message": "Porcentaje de reembolso es requerido"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# Validar porcentaje
		if porcentaje_reembolso not in [0, 50, 100]:
			return Response(
				{"message": "Porcentaje de reembolso debe ser 0, 50 o 100"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		with connection.cursor() as cursor:
			# Verificar que la solicitud existe y está cancelada
			cursor.execute("""
				SELECT ss.id_solicitud_servicio, ss.estado, p.id_pago_mercadopago, p.monto, p.reembolsado_en
				FROM solicitud_servicio ss
				LEFT JOIN pago p ON ss.id_solicitud_servicio = p.id_solicitud_servicio
				WHERE ss.id_solicitud_servicio = %s
			""", [solicitud_id])
			
			solicitud = cursor.fetchone()
			
			if not solicitud:
				return Response(
					{"message": "Solicitud no encontrada"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			if solicitud[1] != 'cancelado':
				return Response(
					{"message": "Solo se pueden procesar reembolsos para solicitudes canceladas"},
					status=status.HTTP_400_BAD_REQUEST
				)
			
			if solicitud[4]:  # Ya fue reembolsado
				return Response(
					{"message": "Esta solicitud ya fue reembolsada anteriormente"},
					status=status.HTTP_400_BAD_REQUEST
				)
			
			pago_id = solicitud[2]
			monto_original = solicitud[3]
			
			if not pago_id:
				return Response(
					{"message": "No se encontró un pago asociado a esta solicitud"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			# Calcular monto a reembolsar
			monto_reembolso = int((monto_original * porcentaje_reembolso) / 100)
			
			# Actualizar el pago
			if porcentaje_reembolso > 0:
				# Marcar como reembolsado
				cursor.execute("""
					UPDATE pago 
					SET estado = 'reembolsado',
						reembolsado_en = CURRENT_TIMESTAMP,
						monto_reembolso = %s
					WHERE id_pago_mercadopago = %s
				""", [monto_reembolso, pago_id])
				
				message = f"Reembolso del {porcentaje_reembolso}% procesado exitosamente. Monto: ${monto_reembolso:,.0f}"
			else:
				# No se reembolsa, actualizar estado
				cursor.execute("""
					UPDATE pago 
					SET estado = 'cancelado',
						reembolsado_en = CURRENT_TIMESTAMP,
						monto_reembolso = 0
					WHERE id_pago_mercadopago = %s
				""", [pago_id])
				
				message = "Solicitud marcada como no reembolsable"
			
			connection.commit()
			
			return Response({
				"success": True,
				"message": message,
				"monto_reembolsado": monto_reembolso,
				"porcentaje": porcentaje_reembolso
			})
			
	except Exception as e:
		connection.rollback()
		return Response(
			{"message": "Error procesando el reembolso", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
