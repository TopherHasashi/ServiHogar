"""

Integración con Mercado Pago Checkout Pro para procesamiento de pagos.
"""
import mercadopago
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import UsuarioDominio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def _get_mp_sdk():
	"""Instancia del SDK de Mercado Pago con las credenciales configuradas."""
	if not settings.MERCADOPAGO_ACCESS_TOKEN:
		raise ValueError("MERCADOPAGO_ACCESS_TOKEN no configurado en settings")
	sdk = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)
	return sdk


@api_view(["GET"])
def test_mp_credentials(request):
	"""Endpoint de prueba para verificar credenciales de MP (solo DEBUG)"""
	if not settings.DEBUG:
		return Response({"message": "No disponible en producción"}, status=403)
	
	try:
		sdk = _get_mp_sdk()
		# Intentar obtener info de la cuenta
		response = sdk.user().get()
		
		return Response({
			"status": "ok",
			"mp_response_status": response.get("status"),
			"is_test": "test" in settings.MERCADOPAGO_ACCESS_TOKEN.lower() or "TEST" in settings.MERCADOPAGO_ACCESS_TOKEN,
			"token_prefix": settings.MERCADOPAGO_ACCESS_TOKEN[:30] + "...",
		})
	except Exception as e:
		return Response({
			"status": "error",
			"error": str(e)
		}, status=500)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_booking_and_payment(request, service_id: str):
	"""
	Crea una solicitud de servicio Y genera preferencia de pago en un solo paso.
	Flujo: Solicitud → Estado "pendiente_pago" → Preferencia MP → Usuario paga → Webhook actualiza a "pendiente"
	
	Body esperado:
	{
		"date": "2025-12-25",
		"start": "10:00",
		"duracion_minutos": 120,
		"titulo": "Instalación eléctrica",
		"descripcion": "Necesito...",
		"address": "Av. Principal 123",
		"comuna_name": "Santiago",
		"region_name": "Metropolitana"
	}
	
	Retorna:
	- init_point: URL para redirigir al usuario a Checkout Pro
	- request_id: ID de la solicitud creada
	- preference_id: ID de la preferencia MP
	"""
	try:
		# Resolver usuario autenticado
		try:
			dom = UsuarioDominio.objects.get(email=request.user.email)
		except UsuarioDominio.DoesNotExist:
			return Response({"message": "Usuario sin registro principal"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Extraer datos del body
		date_str = request.data.get('date')
		start_time = request.data.get('start')
		duracion_minutos = request.data.get('duracion_minutos', 60)
		titulo = request.data.get('titulo', 'Servicio profesional')
		descripcion = request.data.get('descripcion', '')
		address = request.data.get('address', '')
		comuna_name = request.data.get('comuna_name', '')
		region_name = request.data.get('region_name', '')
		
		if not date_str or not start_time:
			return Response({"message": "Fecha y hora son requeridos"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Construir fecha_programada completa
		try:
			fecha_dt = datetime.fromisoformat(date_str)
			hora_parts = start_time.split(':')
			fecha_programada = fecha_dt.replace(hour=int(hora_parts[0]), minute=int(hora_parts[1]))
		except Exception as e:
			return Response({"message": f"Formato de fecha/hora inválido: {e}"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Obtener datos del servicio profesional
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT sp.rut_usuario, sp.precio_fijo, cat.nombre,
				       up.nombres || ' ' || up.apellidos AS profesional_nombre
				FROM servicio_profesional sp
				LEFT JOIN categoria_servicio cat ON cat.id_categoria_servicio = sp.id_categoria_servicio
				LEFT JOIN usuario up ON up.rut = sp.rut_usuario
				WHERE sp.id_servicio_profesional = %s
				""",
				[service_id],
			)
			service_row = cur.fetchone()
		
		if not service_row:
			return Response({"message": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
		
		rut_prof, precio_fijo, categoria_nombre, profesional_nombre = service_row
		
		# Resolver comuna
		with connection.cursor() as cur:
			from api.views import _resolve_region_comuna
			_id_region, id_comuna = _resolve_region_comuna(cur, region_name, comuna_name)
		
		if not id_comuna:
			id_comuna = dom.id_comuna  # Fallback a comuna del usuario
		
		if not address:
			address = getattr(dom, 'direccion', 'Dirección no especificada')
		
		# Crear solicitud en estado "pendiente" (será visible inmediatamente)
		with connection.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO solicitud_servicio (
					rut_cliente, rut_profesional, id_servicio_profesional,
					titulo, descripcion, fecha_programada, duracion_minutos,
					direccion_servicio, id_comuna_servicio, precio_total,
					estado, creado_en, actualizado_en
				) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendiente', %s, %s)
				RETURNING id_solicitud_servicio
				""",
				[
					dom.rut, rut_prof, service_id, titulo, descripcion, 
					fecha_programada, duracion_minutos, address, str(id_comuna), 
					int(precio_fijo or 0), timezone.now(), timezone.now()
				],
			)
			new_request_id = cur.fetchone()[0]
		
		# Crear preferencia en Mercado Pago
		sdk = _get_mp_sdk()
		frontend_url = settings.FRONTEND_URL
		precio = int(precio_fijo or 0)
		nombre_cli = f"{dom.nombres} {dom.apellidos}"
		email_cli = dom.email
		
		# Validar que FRONTEND_URL esté configurado
		if not frontend_url or frontend_url == "":
			logger.error("FRONTEND_URL no está configurado en settings")
			with connection.cursor() as cur:
				cur.execute("DELETE FROM solicitud_servicio WHERE id_solicitud_servicio = %s", [new_request_id])
			return Response(
				{"message": "Error de configuración del servidor: FRONTEND_URL no definido"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		preference_data = {
			"items": [
				{
					"title": f"{titulo} - {profesional_nombre}",
					"quantity": 1,
					"currency_id": "CLP",
					"unit_price": float(precio),
				}
			],
			"payer": {
				"email": email_cli,
			},
			"external_reference": str(new_request_id),
			"statement_descriptor": "SERVIHOGAR",
		}
		
		# Log para debugging
		logger.info(f"Creando preferencia MP para solicitud {new_request_id}")
		logger.info(f"Precio: ${precio}, Título: {titulo}")
		
		try:
			preference_response = sdk.preference().create(preference_data)
			logger.info(f"Respuesta de MP status: {preference_response.get('status')}")
		except Exception as e:
			logger.error(f"Excepción al crear preferencia MP: {e}")
			with connection.cursor() as cur:
				cur.execute("DELETE FROM solicitud_servicio WHERE id_solicitud_servicio = %s", [new_request_id])
			return Response(
				{"message": f"Error al comunicarse con Mercado Pago: {str(e)}"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		preference = preference_response["response"]
		
		if preference_response["status"] not in (200, 201):
			logger.error(f"Error creando preferencia MP: {preference_response}")
			# Eliminar la solicitud creada si falla la preferencia
			with connection.cursor() as cur:
				cur.execute("DELETE FROM solicitud_servicio WHERE id_solicitud_servicio = %s", [new_request_id])
			return Response(
				{"message": "Error al crear preferencia de pago", "detail": preference},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		preference_id = preference.get("id")
		init_point = preference.get("init_point")
		sandbox_init_point = preference.get("sandbox_init_point")
		
		if not preference_id or not init_point:
			# Eliminar la solicitud si no hay init_point
			with connection.cursor() as cur:
				cur.execute("DELETE FROM solicitud_servicio WHERE id_solicitud_servicio = %s", [new_request_id])
			return Response(
				{"message": "Respuesta inválida de Mercado Pago"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		# Crear registro de pago pendiente en la DB
		with connection.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO pago (
					id_pago_mercadopago,
					id_solicitud_servicio,
					monto,
					estado,
					metodo_pago,
					creado_en,
					actualizado_en
				) VALUES (%s, %s, %s, 'pendiente', 'mercadopago', %s, %s)
				ON CONFLICT (id_pago_mercadopago) DO NOTHING
				""",
				[f"pref_{preference_id}", str(new_request_id), int(precio), timezone.now(), timezone.now()],
			)
		
		logger.info(f"Solicitud {new_request_id} creada y preferencia MP {preference_id} generada")
		
		return Response({
			"ok": True,
			"request_id": str(new_request_id),
			"preference_id": preference_id,
			"init_point": sandbox_init_point or init_point,  # Usar sandbox en desarrollo
			"amount": precio,
		})
	
	except Exception as e:
		logger.exception("Error en create_booking_and_payment")
		return Response(
			{"message": "Error interno al crear reserva y pago", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_preference(request, request_id: str):
	"""
	Crea una preferencia de pago en Mercado Pago para una solicitud de servicio.
	
	Body esperado: {} (vacío, toda la info viene de la solicitud)
	
	Retorna:
	- init_point: URL para redirigir al usuario al Checkout Pro
	- preference_id: ID de la preferencia creada
	"""
	try:
		# Resolver usuario autenticado
		try:
			dom = UsuarioDominio.objects.get(email=request.user.email)
		except UsuarioDominio.DoesNotExist:
			return Response({"message": "Usuario sin registro principal"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Cargar datos de la solicitud
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT 
					s.rut_cliente,
					s.rut_profesional,
					s.titulo,
					s.descripcion,
					s.precio_total,
					s.estado,
					uc.nombres || ' ' || uc.apellidos AS cliente_nombre,
					uc.email AS cliente_email,
					up.nombres || ' ' || up.apellidos AS profesional_nombre
				FROM solicitud_servicio s
				JOIN usuario uc ON uc.rut = s.rut_cliente
				JOIN usuario up ON up.rut = s.rut_profesional
				WHERE s.id_solicitud_servicio = %s
				""",
				[request_id],
			)
			row = cur.fetchone()
		
		if not row:
			return Response({"message": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
		
		(rut_cli, rut_prof, titulo, descripcion, precio_total, 
		 estado, cliente_nombre, cliente_email, profesional_nombre) = row
		
		# Validar que el usuario sea el cliente de la solicitud
		if str(rut_cli) != str(dom.rut):
			return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
		
		# Validar estado (debe estar confirmado para pagar)
		if (estado or '').lower() not in ('confirmado', 'pendiente'):
			return Response(
				{"message": f"No se puede crear pago para una solicitud en estado '{estado}'"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# Verificar si ya existe una preferencia/pago para esta solicitud
		with connection.cursor() as cur:
			cur.execute(
				"SELECT id_pago_mercadopago, estado FROM pago WHERE id_solicitud_servicio = %s ORDER BY creado_en DESC LIMIT 1",
				[request_id],
			)
			existing = cur.fetchone()
		
		if existing and existing[1] in ('aprobado', 'autorizado', 'en_proceso'):
			return Response(
				{"message": "Ya existe un pago aprobado para esta solicitud"},
				status=status.HTTP_409_CONFLICT
			)
		
		# Crear preferencia en Mercado Pago
		sdk = _get_mp_sdk()
		
		# URLs de retorno
		frontend_url = settings.FRONTEND_URL
		
		preference_data = {
			"items": [
				{
					"title": f"{titulo} - {profesional_nombre}",
					"description": descripcion[:250] if descripcion else "",
					"quantity": 1,
					"currency_id": "CLP",
					"unit_price": float(precio_total),
				}
			],
			"payer": {
				"name": cliente_nombre.split()[0] if cliente_nombre else "",
				"surname": " ".join(cliente_nombre.split()[1:]) if len(cliente_nombre.split()) > 1 else "",
				"email": cliente_email,
			},
			"back_urls": {
				"success": f"{frontend_url}/payment/success",
				"failure": f"{frontend_url}/payment/failure",
				"pending": f"{frontend_url}/payment/pending",
			},
			"auto_return": "approved",
			"external_reference": str(request_id),  # ID de la solicitud para vincular
			"notification_url": f"{request.build_absolute_uri('/api/payments/webhook/')}",
			"statement_descriptor": "SERVIHOGAR",
		}
		
		preference_response = sdk.preference().create(preference_data)
		preference = preference_response["response"]
		
		if preference_response["status"] not in (200, 201):
			logger.error(f"Error creando preferencia MP: {preference_response}")
			return Response(
				{"message": "Error al crear preferencia de pago", "detail": preference},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		preference_id = preference.get("id")
		init_point = preference.get("init_point")
		
		if not preference_id or not init_point:
			return Response(
				{"message": "Respuesta inválida de Mercado Pago"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		# Crear registro de pago pendiente en la DB
		# Nota: id_pago_mercadopago se actualizará con el payment_id cuando MP notifique
		# Por ahora usamos preference_id como placeholder temporal
		with connection.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO pago (
					id_pago_mercadopago,
					id_solicitud_servicio,
					monto,
					estado,
					metodo_pago,
					creado_en,
					actualizado_en
				) VALUES (%s, %s, %s, 'pendiente', 'mercadopago', %s, %s)
				ON CONFLICT (id_pago_mercadopago) DO NOTHING
				""",
				[f"pref_{preference_id}", str(request_id), int(precio_total), timezone.now(), timezone.now()],
			)
		
		return Response({
			"ok": True,
			"preference_id": preference_id,
			"init_point": init_point,
			"sandbox_init_point": preference.get("sandbox_init_point"),
		})
	
	except Exception as e:
		logger.exception("Error en create_payment_preference")
		return Response(
			{"message": "Error interno al crear preferencia", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def payment_webhook(request):
	"""
	Webhook para recibir notificaciones de Mercado Pago (IPN).
	MP envía notificaciones sobre cambios en el estado del pago.
	
	Tipos de notificación:
	- payment: actualización de un pago
	- merchant_order: orden creada o actualizada
	"""
	try:
		data = request.data or {}
		logger.info(f"Webhook MP recibido: {data}")
		
		notification_type = data.get("type")
		
		if notification_type == "payment":
			payment_id = data.get("data", {}).get("id")
			if not payment_id:
				return Response({"message": "payment_id no proporcionado"}, status=status.HTTP_400_BAD_REQUEST)
			
			# Consultar el pago en Mercado Pago
			sdk = _get_mp_sdk()
			payment_info = sdk.payment().get(payment_id)
			
			if payment_info["status"] != 200:
				logger.error(f"Error consultando pago MP {payment_id}: {payment_info}")
				return Response({"message": "Error consultando pago"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
			
			payment = payment_info["response"]
			
			# Extraer datos relevantes
			mp_status = payment.get("status")  # approved, rejected, pending, etc.
			mp_status_detail = payment.get("status_detail")
			external_reference = payment.get("external_reference")  # ID de solicitud_servicio
			transaction_amount = payment.get("transaction_amount")
			payment_method = payment.get("payment_method_id")
			
			if not external_reference:
				logger.warning(f"Pago {payment_id} sin external_reference")
				return Response({"message": "Sin external_reference"}, status=status.HTTP_200_OK)
			
			# Mapear estado de MP a nuestro esquema
			estado_map = {
				"approved": "aprobado",
				"authorized": "autorizado",
				"in_process": "en_proceso",
				"pending": "pendiente",
				"rejected": "rechazado",
				"cancelled": "cancelado",
				"refunded": "reembolsado",
			}
			estado_db = estado_map.get(mp_status, "pendiente")
			
			# Calcular comisión (5%) y monto para profesional
			monto = int(transaction_amount) if transaction_amount else 0
			comision = int(monto * 0.05)
			monto_profesional = monto - comision
			
			# Actualizar o insertar pago en DB
			with connection.cursor() as cur:
				# Primero intentar actualizar si existe por external_reference
				cur.execute(
					"""
					UPDATE pago
					SET id_pago_mercadopago = %s,
					    estado = %s,
					    metodo_pago = %s,
					    monto = %s,
					    comision_plataforma = %s,
					    monto_profesional = %s,
					    actualizado_en = %s
					WHERE id_solicitud_servicio = %s
					""",
					[
						str(payment_id), estado_db, payment_method or 'mercadopago',
						monto, comision, monto_profesional,
						timezone.now(), external_reference
					],
				)
				
				if cur.rowcount == 0:
					# No existía, insertar
					cur.execute(
						"""
						INSERT INTO pago (
							id_pago_mercadopago,
							id_solicitud_servicio,
							monto,
							metodo_pago,
							estado,
							comision_plataforma,
							monto_profesional,
							creado_en,
							actualizado_en
						) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
						ON CONFLICT (id_pago_mercadopago) DO UPDATE
						SET estado = EXCLUDED.estado,
						    metodo_pago = EXCLUDED.metodo_pago,
						    monto = EXCLUDED.monto,
						    comision_plataforma = EXCLUDED.comision_plataforma,
						    monto_profesional = EXCLUDED.monto_profesional,
						    actualizado_en = EXCLUDED.actualizado_en
						""",
						[
							str(payment_id), external_reference, monto,
							payment_method or 'mercadopago', estado_db,
							comision, monto_profesional,
							timezone.now(), timezone.now()
						],
					)
				
				# ACTUALIZAR ESTADO DE LA SOLICITUD según el estado del pago
				if estado_db == 'aprobado':
					# Pago aprobado → La solicitud ya está en "pendiente", no hacer nada
					logger.info(f"Pago aprobado para solicitud {external_reference}")
				elif estado_db in ('rechazado', 'cancelado'):
					# Pago rechazado/cancelado → Cancelar la solicitud
					cur.execute(
						"""
						UPDATE solicitud_servicio
						SET estado = 'cancelado', 
						    cancelado_en = %s,
						    razon_cancelacion = %s,
						    actualizado_en = %s
						WHERE id_solicitud_servicio = %s AND estado = 'pendiente'
						""",
						[timezone.now(), f"Pago {estado_db}: {mp_status_detail}", timezone.now(), external_reference]
					)
					logger.info(f"Solicitud {external_reference} cancelada por pago {estado_db}")
			
			logger.info(f"Pago {payment_id} actualizado a estado {estado_db} para solicitud {external_reference}")
			
			return Response({"ok": True, "payment_id": payment_id, "status": mp_status})
		
		# Otros tipos de notificación (merchant_order, etc.) se ignoran por ahora
		return Response({"ok": True, "message": "Notificación recibida"})
	
	except Exception as e:
		logger.exception("Error en payment_webhook")
		return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def payment_status(request, request_id: str):
	"""
	Consulta el estado del pago de una solicitud de servicio.
	
	Retorna:
	- has_payment: boolean
	- payment_status: estado del pago si existe
	- payment_id: ID del pago en Mercado Pago
	- amount: monto del pago
	"""
	try:
		# Resolver usuario autenticado
		try:
			dom = UsuarioDominio.objects.get(email=request.user.email)
		except UsuarioDominio.DoesNotExist:
			return Response({"message": "Usuario sin registro principal"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Verificar que el usuario tenga acceso a esta solicitud
		with connection.cursor() as cur:
			cur.execute(
				"SELECT rut_cliente, rut_profesional FROM solicitud_servicio WHERE id_solicitud_servicio = %s",
				[request_id],
			)
			row = cur.fetchone()
		
		if not row:
			return Response({"message": "Solicitud no encontrada"}, status=status.HTTP_404_NOT_FOUND)
		
		rut_cli, rut_prof = row
		if str(dom.rut) not in {str(rut_cli), str(rut_prof)}:
			return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)
		
		# Buscar pago
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT id_pago_mercadopago, monto, estado, metodo_pago, creado_en
				FROM pago
				WHERE id_solicitud_servicio = %s
				ORDER BY creado_en DESC
				LIMIT 1
				""",
				[request_id],
			)
			pago = cur.fetchone()
		
		if not pago:
			return Response({
				"has_payment": False,
				"payment_status": None,
				"payment_id": None,
				"amount": 0,
			})
		
		payment_id, monto, estado, metodo, creado_en = pago
		
		return Response({
			"has_payment": True,
			"payment_status": estado,
			"payment_id": payment_id,
			"payment_method": metodo,
			"amount": int(monto) if monto else 0,
			"created_at": creado_en.isoformat() if creado_en else None,
		})
	
	except Exception as e:
		logger.exception("Error en payment_status")
		return Response(
			{"message": "Error consultando estado de pago", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def process_checkout_api_payment(request):
	"""
	Procesa un pago usando Checkout API (Checkout Transparente).
	Recibe el token de la tarjeta y procesa el pago directamente.
	"""
	try:
		# Extraer datos del request
		token = request.data.get('token')
		payment_method_id = request.data.get('payment_method_id')
		transaction_amount = request.data.get('transaction_amount')
		description = request.data.get('description')
		payer = request.data.get('payer', {})
		request_id = request.data.get('request_id')
		
		if not all([token, payment_method_id, transaction_amount, request_id]):
			return Response(
				{"message": "Faltan datos requeridos"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# Verificar que la solicitud existe y tiene un pago pendiente
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT p.id_pago_mercadopago, p.monto, s.rut_profesional
				FROM pago p
				INNER JOIN solicitud_servicio s ON s.id_solicitud_servicio = p.id_solicitud_servicio
				WHERE p.id_solicitud_servicio = %s AND p.estado = 'pendiente'
				""",
				[request_id]
			)
			row = cur.fetchone()
		
		if not row:
			return Response(
				{"message": "No se encontró un pago pendiente para esta solicitud"},
				status=status.HTTP_404_NOT_FOUND
			)
		
		pago_id_mp, monto_db, rut_profesional = row
		
		# Crear el pago en Mercado Pago
		sdk = _get_mp_sdk()
		
		payment_data = {
			"token": token,
			"payment_method_id": payment_method_id,
			"transaction_amount": float(transaction_amount),
			"description": description,
			"installments": 1,
			"payer": {
				"email": payer.get('email', request.user.email),
			},
		}
		
		# Agregar identificación si está disponible
		if payer.get('identification') and payer['identification'].get('number'):
			payment_data["payer"]["identification"] = {
				"type": payer['identification'].get('type', 'DNI'),
				"number": payer['identification'].get('number')
			}
		
		logger.info(f"Procesando pago con Checkout API para solicitud {request_id}")
		logger.info(f"Payment data: token={token[:20]}..., payment_method={payment_method_id}, amount={transaction_amount}")
		
		# Configurar request options con idempotency key
		request_options = mercadopago.config.RequestOptions()
		request_options.custom_headers = {
			'x-idempotency-key': str(request_id)
		}
		
		try:
			payment_response = sdk.payment().create(payment_data, request_options)
		except Exception as e:
			logger.error(f"Exception al crear pago: {str(e)}")
			return Response(
				{"message": f"Error al conectar con Mercado Pago: {str(e)}"},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
		
		payment = payment_response["response"]
		
		logger.info(f"MP Response Status: {payment_response.get('status')}")
		logger.info(f"MP Response: {payment_response}")
		
		if payment_response["status"] not in (200, 201):
			logger.error(f"Error en MP: {payment_response}")
			error_detail = payment_response.get("response", {})
			error_msg = error_detail.get("message", "Error desconocido")
			
			# Log adicional para debug
			if "cause" in error_detail:
				logger.error(f"MP Cause: {error_detail['cause']}")
			
			# En modo DEBUG, si es el error de credenciales de test, aprobar el pago automáticamente
			if settings.DEBUG and "Unauthorized use of live credentials" in error_msg:
				logger.warning(f"⚠️ Modo DEBUG: Aprobando pago automáticamente debido a limitaciones de MP en localhost")
				
				# Calcular comisiones
				comision_plataforma = float(monto_db) * 0.05
				monto_profesional = float(monto_db) * 0.95
				
				# Generar un ID de pago simulado
				simulated_payment_id = f"sim_{request_id[:8]}_{int(timezone.now().timestamp())}"
				
				with connection.cursor() as cur:
					cur.execute(
						"""
						UPDATE pago
						SET id_pago_mercadopago = %s,
						    estado = 'aprobado',
						    metodo_pago = %s,
						    comision_plataforma = %s,
						    monto_profesional = %s,
						    actualizado_en = %s
						WHERE id_solicitud_servicio = %s
						""",
						[simulated_payment_id, payment_method_id, comision_plataforma, 
						 monto_profesional, timezone.now(), request_id]
					)
				
				logger.info(f"✅ Pago simulado aprobado: {simulated_payment_id}")
				
				return Response({
					"status": "approved",
					"payment_id": simulated_payment_id,
					"message": "Pago procesado exitosamente (modo desarrollo)",
					"simulated": True
				})
			
			return Response(
				{"message": f"Error procesando el pago: {error_msg}", "detail": error_detail},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		payment_id = payment.get("id")
		status_mp = payment.get("status")
		status_detail = payment.get("status_detail")
		
		logger.info(f"Pago MP creado: ID={payment_id}, Status={status_mp}")
		
		# Actualizar el registro de pago
		if status_mp == "approved":
			# Calcular comisiones
			comision_plataforma = float(monto_db) * 0.05
			monto_profesional = float(monto_db) * 0.95
			
			with connection.cursor() as cur:
				cur.execute(
					"""
					UPDATE pago
					SET id_pago_mercadopago = %s,
					    estado = 'aprobado',
					    metodo_pago = %s,
					    comision_plataforma = %s,
					    monto_profesional = %s,
					    actualizado_en = %s
					WHERE id_solicitud_servicio = %s
					""",
					[str(payment_id), payment_method_id, comision_plataforma, 
					 monto_profesional, timezone.now(), request_id]
				)
			
			return Response({
				"status": "approved",
				"payment_id": payment_id,
				"message": "Pago procesado exitosamente"
			})
		
		elif status_mp == "pending":
			with connection.cursor() as cur:
				cur.execute(
					"""
					UPDATE pago
					SET id_pago_mercadopago = %s,
					    estado = 'pendiente',
					    metodo_pago = %s,
					    actualizado_en = %s
					WHERE id_solicitud_servicio = %s
					""",
					[str(payment_id), payment_method_id, timezone.now(), request_id]
				)
			
			return Response({
				"status": "pending",
				"payment_id": payment_id,
				"message": "Pago pendiente de aprobación",
				"status_detail": status_detail
			})
		
		else:  # rejected, cancelled, etc.
			with connection.cursor() as cur:
				cur.execute(
					"""
					UPDATE pago
					SET id_pago_mercadopago = %s,
					    estado = 'rechazado',
					    metodo_pago = %s,
					    actualizado_en = %s
					WHERE id_solicitud_servicio = %s
					""",
					[str(payment_id), payment_method_id, timezone.now(), request_id]
				)
				
				# Cancelar la solicitud
				cur.execute(
					"""
					UPDATE solicitud_servicio
					SET estado = 'cancelado',
					    actualizado_en = %s
					WHERE id_solicitud_servicio = %s
					""",
					[timezone.now(), request_id]
				)
			
			return Response({
				"status": "rejected",
				"payment_id": payment_id,
				"message": "Pago rechazado",
				"status_detail": status_detail
			}, status=status.HTTP_400_BAD_REQUEST)
	
	except Exception as e:
		logger.exception("Error procesando pago con Checkout API")
		return Response(
			{"message": "Error procesando el pago", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
