"""
Endpoints para gestión de cuentas bancarias ServiHogar.
Solo accesible por administradores.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
import logging
import uuid
import re

logger = logging.getLogger(__name__)


def validate_chilean_rut(rut: str) -> bool:
	"""
	Valida un RUT chileno con su dígito verificador.
	Formato aceptado: 12.345.678-9 o 12345678-9 o 123456789
	"""
	try:
		# Limpiar el RUT (eliminar puntos y guiones)
		rut = rut.replace('.', '').replace('-', '').strip()
		
		if not rut or len(rut) < 2:
			return False
		
		# Separar número y dígito verificador
		rut_num = rut[:-1]
		dv = rut[-1].upper()
		
		# Validar que el número sea numérico
		if not rut_num.isdigit():
			return False
		
		# Calcular dígito verificador
		suma = 0
		multiplicador = 2
		
		for digit in reversed(rut_num):
			suma += int(digit) * multiplicador
			multiplicador += 1
			if multiplicador > 7:
				multiplicador = 2
		
		resto = suma % 11
		dv_calculado = 11 - resto
		
		if dv_calculado == 11:
			dv_esperado = '0'
		elif dv_calculado == 10:
			dv_esperado = 'K'
		else:
			dv_esperado = str(dv_calculado)
		
		return dv == dv_esperado
	except:
		return False


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_servihogar_bank_accounts(request):
	"""
	Obtiene todas las cuentas bancarias de ServiHogar.
	Solo accesible por administradores.
	
	Parámetros de query opcionales:
	- page: Número de página (default: 1)
	- page_size: Tamaño de página (default: 20, max: 100)
	"""
	try:
		# Obtener parámetros de paginación
		page = int(request.GET.get('page', 1))
		page_size = min(int(request.GET.get('page_size', 20)), 100)
		offset = (page - 1) * page_size
		
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
			
			# Contar total de cuentas
			cur.execute("SELECT COUNT(*) FROM cuenta_bancaria_servihogar")
			total_count = cur.fetchone()[0]
			
			# Obtener cuentas bancarias ServiHogar con paginación
			cur.execute(
				"""
				SELECT 
					id_cuenta_bancaria_servihogar,
					nombre_identificador,
					banco,
					tipo_cuenta,
					numero_cuenta,
					rut_titular,
					nombre_titular,
					email_contacto,
					prioridad,
					estado,
					creado_en,
					actualizado_en
				FROM cuenta_bancaria_servihogar
				ORDER BY prioridad ASC, creado_en DESC
				LIMIT %s OFFSET %s
				""",
				[page_size, offset]
			)
			
			accounts = []
			for row in cur.fetchall():
				accounts.append({
					"id": str(row[0]),
					"nombreIdentificador": row[1],
					"banco": row[2],
					"tipoCuenta": row[3],
					"numeroCuenta": row[4],
					"rutTitular": row[5],
					"nombreTitular": row[6],
					"emailContacto": row[7],
					"prioridad": row[8],
					"estado": row[9],
					"creadoEn": row[10].isoformat() if row[10] else None,
					"actualizadoEn": row[11].isoformat() if row[11] else None,
				})
			
			# Calcular información de paginación
			total_pages = (total_count + page_size - 1) // page_size
			
			return Response({
				"accounts": accounts,
				"total": total_count,
				"pagination": {
					"total": total_count,
					"page": page,
					"page_size": page_size,
					"total_pages": total_pages,
					"has_next": page < total_pages,
					"has_previous": page > 1
				}
			})
			
	except Exception as e:
		logger.exception("Error obteniendo cuentas bancarias ServiHogar")
		return Response(
			{"message": "Error obteniendo cuentas bancarias", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_servihogar_bank_account(request):
	"""
	Crea una nueva cuenta bancaria ServiHogar.
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
			
			# Validar datos requeridos
			data = request.data
			required_fields = ['nombreIdentificador', 'banco', 'tipoCuenta', 'numeroCuenta', 
			                  'rutTitular', 'nombreTitular', 'prioridad']
			
			for field in required_fields:
				if field not in data or not data[field]:
					return Response(
						{"message": f"El campo {field} es requerido"},
						status=status.HTTP_400_BAD_REQUEST
					)
			
			# Validar RUT chileno
			if not validate_chilean_rut(data['rutTitular']):
				return Response(
					{"message": "RUT inválido. Verifique el formato y dígito verificador"},
					status=status.HTTP_400_BAD_REQUEST
				)
			
			# Verificar que no exista otra cuenta con la misma prioridad si es principal
			if data['prioridad'] == 1:
				cur.execute(
					"SELECT COUNT(*) FROM cuenta_bancaria_servihogar WHERE prioridad = 1 AND estado = 'activa'"
				)
				if cur.fetchone()[0] > 0:
					return Response(
						{"message": "Ya existe una cuenta principal activa. Cambia la prioridad de la cuenta existente primero."},
						status=status.HTTP_400_BAD_REQUEST
					)
			
			# Verificar que el número de cuenta no esté duplicado
			cur.execute(
				"SELECT COUNT(*) FROM cuenta_bancaria_servihogar WHERE numero_cuenta = %s",
				[data['numeroCuenta']]
			)
			if cur.fetchone()[0] > 0:
				return Response(
					{"message": "Ya existe una cuenta con este número"},
					status=status.HTTP_400_BAD_REQUEST
				)
			
			# Crear la cuenta
			account_id = uuid.uuid4()
			now = timezone.now()
			
			cur.execute(
				"""
				INSERT INTO cuenta_bancaria_servihogar (
					id_cuenta_bancaria_servihogar,
					nombre_identificador,
					banco,
					tipo_cuenta,
					numero_cuenta,
					rut_titular,
					nombre_titular,
					email_contacto,
					prioridad,
					estado,
					creado_en,
					actualizado_en
				) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
				""",
				[
					account_id,
					data['nombreIdentificador'],
					data['banco'],
					data['tipoCuenta'],
					data['numeroCuenta'],
					data['rutTitular'],
					data['nombreTitular'],
					data.get('emailContacto', ''),
					data['prioridad'],
					'activa',
					now,
					now
				]
			)
			
			return Response({
				"message": "Cuenta bancaria creada exitosamente",
				"account": {
					"id": str(account_id),
					"nombreIdentificador": data['nombreIdentificador'],
					"banco": data['banco'],
					"tipoCuenta": data['tipoCuenta'],
					"numeroCuenta": data['numeroCuenta'],
					"rutTitular": data['rutTitular'],
					"nombreTitular": data['nombreTitular'],
					"emailContacto": data.get('emailContacto', ''),
					"prioridad": data['prioridad'],
					"estado": 'activa',
					"creadoEn": now.isoformat(),
					"actualizadoEn": now.isoformat()
				}
			}, status=status.HTTP_201_CREATED)
			
	except Exception as e:
		logger.exception("Error creando cuenta bancaria ServiHogar")
		return Response(
			{"message": "Error creando cuenta bancaria", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_servihogar_bank_account(request, account_id):
	"""
	Actualiza una cuenta bancaria ServiHogar existente.
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
			
			# Verificar que la cuenta existe
			cur.execute(
				"SELECT id_cuenta_bancaria_servihogar FROM cuenta_bancaria_servihogar WHERE id_cuenta_bancaria_servihogar = %s",
				[account_id]
			)
			if not cur.fetchone():
				return Response(
					{"message": "Cuenta bancaria no encontrada"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			data = request.data
			
			# Permitir cambios de prioridad sin validar duplicados
			# (el frontend se encarga de reorganizar todas las cuentas)
			
			# Construir query de actualización dinámicamente
			update_fields = []
			update_values = []
			
			field_mapping = {
				'nombreIdentificador': 'nombre_identificador',
				'banco': 'banco',
				'tipoCuenta': 'tipo_cuenta',
				'numeroCuenta': 'numero_cuenta',
				'rutTitular': 'rut_titular',
				'nombreTitular': 'nombre_titular',
				'emailContacto': 'email_contacto',
				'prioridad': 'prioridad',
				'estado': 'estado'
			}
			
			for field_key, db_column in field_mapping.items():
				if field_key in data:
					update_fields.append(f"{db_column} = %s")
					update_values.append(data[field_key])
			
			if not update_fields:
				return Response(
					{"message": "No hay campos para actualizar"},
					status=status.HTTP_400_BAD_REQUEST
				)
			
			# Siempre actualizar actualizado_en
			update_fields.append("actualizado_en = %s")
			update_values.append(timezone.now())
			update_values.append(account_id)
			
			cur.execute(
				f"""
				UPDATE cuenta_bancaria_servihogar
				SET {', '.join(update_fields)}
				WHERE id_cuenta_bancaria_servihogar = %s
				""",
				update_values
			)
			
			# Obtener la cuenta actualizada
			cur.execute(
				"""
				SELECT 
					id_cuenta_bancaria_servihogar,
					nombre_identificador,
					banco,
					tipo_cuenta,
					numero_cuenta,
					rut_titular,
					nombre_titular,
					email_contacto,
					prioridad,
					estado,
					creado_en,
					actualizado_en
				FROM cuenta_bancaria_servihogar
				WHERE id_cuenta_bancaria_servihogar = %s
				""",
				[account_id]
			)
			
			row = cur.fetchone()
			
			return Response({
				"message": "Cuenta bancaria actualizada exitosamente",
				"account": {
					"id": str(row[0]),
					"nombreIdentificador": row[1],
					"banco": row[2],
					"tipoCuenta": row[3],
					"numeroCuenta": row[4],
					"rutTitular": row[5],
					"nombreTitular": row[6],
					"emailContacto": row[7],
					"prioridad": row[8],
					"estado": row[9],
					"creadoEn": row[10].isoformat() if row[10] else None,
					"actualizadoEn": row[11].isoformat() if row[11] else None,
				}
			})
			
	except Exception as e:
		logger.exception("Error actualizando cuenta bancaria ServiHogar")
		return Response(
			{"message": "Error actualizando cuenta bancaria", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_servihogar_bank_account(request, account_id):
	"""
	Elimina (o desactiva) una cuenta bancaria ServiHogar.
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
			
			# Verificar que la cuenta existe
			cur.execute(
				"SELECT prioridad FROM cuenta_bancaria_servihogar WHERE id_cuenta_bancaria_servihogar = %s",
				[account_id]
			)
			account = cur.fetchone()
			if not account:
				return Response(
					{"message": "Cuenta bancaria no encontrada"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			# No permitir eliminar la cuenta principal si hay transacciones pendientes
			if account[0] == 1:  # prioridad = 1 (principal)
				cur.execute(
					"""
					SELECT COUNT(*) FROM pago 
					WHERE id_cuenta_origen_servihogar = %s 
					AND estado IN ('pendiente', 'en_proceso')
					""",
					[account_id]
				)
				if cur.fetchone()[0] > 0:
					return Response(
						{"message": "No se puede eliminar la cuenta principal con transacciones pendientes"},
						status=status.HTTP_400_BAD_REQUEST
					)
			
			# En lugar de eliminar, desactivar la cuenta
			cur.execute(
				"""
				UPDATE cuenta_bancaria_servihogar
				SET estado = 'inactiva', actualizado_en = %s
				WHERE id_cuenta_bancaria_servihogar = %s
				""",
				[timezone.now(), account_id]
			)
			
			return Response({
				"message": "Cuenta bancaria desactivada exitosamente"
			})
			
	except Exception as e:
		logger.exception("Error eliminando cuenta bancaria ServiHogar")
		return Response(
			{"message": "Error eliminando cuenta bancaria", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_bank_account_stats(request):
	"""
	Obtiene estadísticas de transacciones de las cuentas ServiHogar.
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
			
			# Total procesado últimos 30 días
			cur.execute(
				"""
				SELECT COALESCE(SUM(monto), 0)
				FROM pago
				WHERE estado = 'aprobado'
				AND creado_en >= NOW() - INTERVAL '30 days'
				"""
			)
			total_procesado = float(cur.fetchone()[0])
			
			# Transacciones exitosas
			cur.execute(
				"""
				SELECT COUNT(*)
				FROM pago
				WHERE estado = 'aprobado'
				AND creado_en >= NOW() - INTERVAL '30 days'
				"""
			)
			transacciones_exitosas = cur.fetchone()[0]
			
			# Comisión generada (5% del total)
			cur.execute(
				"""
				SELECT COALESCE(SUM(comision_plataforma), 0)
				FROM pago
				WHERE estado = 'aprobado'
				AND creado_en >= NOW() - INTERVAL '30 days'
				"""
			)
			comision_generada = float(cur.fetchone()[0])
			
			return Response({
				"totalProcesado": total_procesado,
				"transaccionesExitosas": transacciones_exitosas,
				"comisionGenerada": comision_generada
			})
			
	except Exception as e:
		logger.exception("Error obteniendo estadísticas de cuentas bancarias")
		return Response(
			{"message": "Error obteniendo estadísticas", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
