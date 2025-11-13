"""
Endpoints para gestión de configuración del sistema.
Solo accesible por administradores.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_system_config(request):
	"""
	Obtiene toda la configuración del sistema.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rol FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				return Response(
					{"message": "No tienes permisos para acceder a este recurso"},
					status=status.HTTP_403_FORBIDDEN
				)
			
			# Obtener toda la configuración
			cur.execute(
				"""
				SELECT clave, valor, tipo_dato, descripcion, actualizado_en, actualizado_por
				FROM configuracion_sistema
				ORDER BY clave
				"""
			)
			
			config = {}
			for row in cur.fetchall():
				clave = row[0]
				valor = row[1]
				tipo_dato = row[2]
				
				# Convertir el valor según el tipo de dato
				if tipo_dato == 'number':
					valor = float(valor) if '.' in valor else int(valor)
				elif tipo_dato == 'boolean':
					valor = valor.lower() in ('true', '1', 'yes')
				
				config[clave] = {
					'valor': valor,
					'tipo_dato': tipo_dato,
					'descripcion': row[3],
					'actualizado_en': row[4].isoformat() if row[4] else None,
					'actualizado_por': row[5]
				}
			
			return Response(config)
			
	except Exception as e:
		logger.exception("Error obteniendo configuración del sistema")
		return Response(
			{"message": "Error obteniendo configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_system_config(request):
	"""
	Actualiza la configuración del sistema.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			cur.execute(
				"SELECT email FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				# Verificar rol
				cur.execute(
					"SELECT rol FROM usuario WHERE email = %s",
					[request.user.email]
				)
				row = cur.fetchone()
				if not row or row[0] != 'administrador':
					return Response(
						{"message": "No tienes permisos para acceder a este recurso"},
						status=status.HTTP_403_FORBIDDEN
					)
			
			data = request.data
			updated_count = 0
			
			for clave, nuevo_valor in data.items():
				# Verificar que la clave existe
				cur.execute(
					"SELECT tipo_dato FROM configuracion_sistema WHERE clave = %s",
					[clave]
				)
				config_row = cur.fetchone()
				
				if not config_row:
					continue  # Ignorar claves que no existen
				
				tipo_dato = config_row[0]
				
				# Convertir el valor al formato string para almacenar
				if tipo_dato == 'boolean':
					valor_str = 'true' if nuevo_valor else 'false'
				else:
					valor_str = str(nuevo_valor)
				
				# Actualizar configuración
				cur.execute(
					"""
					UPDATE configuracion_sistema
					SET valor = %s, actualizado_en = %s, actualizado_por = %s
					WHERE clave = %s
					""",
					[valor_str, timezone.now(), request.user.email, clave]
				)
				updated_count += 1
			
			return Response({
				"message": f"Configuración actualizada exitosamente. {updated_count} valores modificados.",
				"updated_count": updated_count
			})
			
	except Exception as e:
		logger.exception("Error actualizando configuración del sistema")
		return Response(
			{"message": "Error actualizando configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_config_value(request, clave):
	"""
	Obtiene un valor específico de configuración.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rol FROM usuario WHERE email = %s",
				[request.user.email]
			)
			row = cur.fetchone()
			if not row or row[0] != 'administrador':
				return Response(
					{"message": "No tienes permisos para acceder a este recurso"},
					status=status.HTTP_403_FORBIDDEN
				)
			
			# Obtener el valor
			cur.execute(
				"SELECT valor, tipo_dato FROM configuracion_sistema WHERE clave = %s",
				[clave]
			)
			row = cur.fetchone()
			
			if not row:
				return Response(
					{"message": "Clave de configuración no encontrada"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			valor = row[0]
			tipo_dato = row[1]
			
			# Convertir según tipo
			if tipo_dato == 'number':
				valor = float(valor) if '.' in valor else int(valor)
			elif tipo_dato == 'boolean':
				valor = valor.lower() in ('true', '1', 'yes')
			
			return Response({
				'clave': clave,
				'valor': valor,
				'tipo_dato': tipo_dato
			})
			
	except Exception as e:
		logger.exception(f"Error obteniendo configuración {clave}")
		return Response(
			{"message": "Error obteniendo valor de configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
