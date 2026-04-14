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
			# 1. INGRESOS DEL MES - no aplica (pagos presenciales)
			total_revenue = 0
			monthly_growth = 0
			
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
					0 as total_revenue,
					0 as avg_price
				FROM solicitud_servicio s
				INNER JOIN servicio_profesional sp ON s.id_servicio_profesional = sp.id_servicio_profesional
				INNER JOIN categoria_servicio c ON sp.id_categoria_servicio = c.id_categoria_servicio
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


