from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status, permissions, serializers as drf_serializers
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
	Profile,
	UsuarioDominio,
	ServicioProfesional,
	DocumentoProfesional,
	HorarioProfesional,
	PeriodoPersonalizado,
	DiaBloqueado,
)
from django.conf import settings
from django.db import connection, transaction, IntegrityError
from django.utils import timezone
import uuid
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.parsers import MultiPartParser, FormParser
from typing import Tuple, List, Optional
import re
from datetime import datetime, timedelta


def _normalize_genero(value: Optional[str]) -> Optional[str]:
	if not value:
		return None
	v = value.strip().lower()
	# v3.0: masculino, femenino, no_binario
	if v in {"masculino", "femenino", "no_binario"}:
		return v
	if v in {"otro", "prefiero-no-decir", "no binario", "nobinario", "no-binario"}:
		return "no_binario"
	return None


def _resolve_region_comuna(cur, region_name: Optional[str], comuna_name: Optional[str]):
	"""Best-effort lookup for region/comuna IDs using accent-insensitive matching and relaxed contains logic."""
	region_id = None
	comuna_id = None
	if region_name:
		rn = region_name.strip()
		# Try accent-insensitive first, fallback to plain lower() if unaccent is missing
		try:
			cur.execute(
				"""
				SELECT id_region FROM region 
				WHERE unaccent(lower(nombre)) = unaccent(lower(%s))
				   OR unaccent(lower(nombre)) LIKE '%%' || unaccent(lower(%s)) || '%%'
				   OR unaccent(lower(%s)) LIKE '%%' || unaccent(lower(nombre)) || '%%'
				LIMIT 1
				""",
				[rn, rn, rn],
			)
		except Exception:
			cur.execute(
				"""
				SELECT id_region FROM region 
				WHERE lower(nombre) = lower(%s)
				   OR lower(nombre) LIKE '%%' || lower(%s) || '%%'
				   OR lower(%s) LIKE '%%' || lower(nombre) || '%%'
				LIMIT 1
				""",
				[rn, rn, rn],
			)
		row = cur.fetchone()
		if row:
			region_id = row[0]

	if comuna_name:
		cn = comuna_name.strip()
		if region_id:
			try:
				cur.execute(
					"""
					SELECT id_comuna FROM comuna
					WHERE id_region = %s AND (
						unaccent(lower(nombre)) = unaccent(lower(%s))
						OR unaccent(lower(nombre)) LIKE '%%' || unaccent(lower(%s)) || '%%'
						OR unaccent(lower(%s)) LIKE '%%' || unaccent(lower(nombre)) || '%%'
					)
					LIMIT 1
					""",
					[region_id, cn, cn, cn],
				)
			except Exception:
				cur.execute(
					"""
					SELECT id_comuna FROM comuna
					WHERE id_region = %s AND (
						lower(nombre) = lower(%s)
						OR lower(nombre) LIKE '%%' || lower(%s) || '%%'
						OR lower(%s) LIKE '%%' || lower(nombre) || '%%'
					)
					LIMIT 1
					""",
					[region_id, cn, cn, cn],
				)
			row = cur.fetchone()
			if row:
				comuna_id = row[0]
		else:
			try:
				cur.execute(
					"""
					SELECT id_comuna FROM comuna
					WHERE unaccent(lower(nombre)) = unaccent(lower(%s))
					   OR unaccent(lower(nombre)) LIKE '%%' || unaccent(lower(%s)) || '%%'
					   OR unaccent(lower(%s)) LIKE '%%' || unaccent(lower(nombre)) || '%%'
					LIMIT 1
					""",
					[cn, cn, cn],
				)
			except Exception:
				cur.execute(
					"""
					SELECT id_comuna FROM comuna
					WHERE lower(nombre) = lower(%s)
					   OR lower(nombre) LIKE '%%' || lower(%s) || '%%'
					   OR lower(%s) LIKE '%%' || lower(nombre) || '%%'
					LIMIT 1
					""",
					[cn, cn, cn],
				)
			row = cur.fetchone()
			if row:
				comuna_id = row[0]

	return region_id, comuna_id


def _upsert_usuario_dominio(*, first_name: str, last_name: str, rut: Optional[str], email: str, password_hash: str,
							phone: Optional[str], address: Optional[str], gender: Optional[str], birth_date, role: Optional[str],
							region_name: Optional[str], comuna_name: Optional[str], comuna_id_override: Optional[str] = None):
	"""Inserta o actualiza en la tabla externa `usuario` del dominio (no gestionada por Django).
	Solo usa columnas esenciales y deja el resto con defaults/NULL para no romper el esquema.
	"""
	# Normalizar
	genero = _normalize_genero(gender)
	rol = (role or 'cliente').strip().lower()
	if rol not in {"cliente", "profesional", "administrador", "verificador"}:
		rol = "cliente"

	# Campos requeridos por la tabla dominio
	nombres = first_name or ""
	apellidos = last_name or ""
	rut = (rut or "").strip() or None
	# NOT NULL en dominio: usar string vacío si viene vacío
	telefono = (phone or "").strip()
	direccion = (address or "").strip()
	if not telefono:
		telefono = ""
	if not direccion:
		direccion = ""

	# Si no hay RUT válido, falla para que el registro no continúe (persistencia principal en `usuario`)
	if not rut:
		return False

	# Intentar UPSERT vía ORM sobre el modelo no gestionado
	with transaction.atomic():
		# Resolver comuna: usar override si viene, si no, resolver por nombres
		id_comuna = None
		if comuna_id_override:
			id_comuna = comuna_id_override
		else:
			with connection.cursor() as cur:
				_id_region, id_comuna = _resolve_region_comuna(cur, region_name, comuna_name)
		# v3.0: id_comuna es obligatorio
		if not id_comuna:
			return False

		try:
			# Verificar conflictos previos por email asignado a otro RUT
			existing_by_email = UsuarioDominio.objects.filter(email=email).exclude(rut=rut).first()
			if existing_by_email:
				# email único en dominio; no podemos reasignarlo silenciosamente
				return False

			try:
				obj = UsuarioDominio.objects.get(rut=rut)
				created = False
			except UsuarioDominio.DoesNotExist:
				obj = None
				created = True

			if created:
				obj = UsuarioDominio(
					rut=rut,
					nombres=nombres,
					apellidos=apellidos,
					hash_contrasena=password_hash,
					telefono=telefono,
					direccion=direccion,
					genero=genero,
					fecha_nacimiento=birth_date,
					id_comuna=id_comuna,
					rol=rol,
					email=email,
					email_verificado=False,
					perfil_publico=True,
					creado_en=timezone.now(),
					actualizado_en=timezone.now(),
				)
				obj.save()
			else:
				# Update minimal fields
				obj.nombres = nombres or obj.nombres
				obj.apellidos = apellidos or obj.apellidos
				obj.email = email or obj.email
				obj.telefono = telefono or obj.telefono
				obj.direccion = direccion or obj.direccion
				obj.genero = genero or obj.genero
				obj.fecha_nacimiento = birth_date or obj.fecha_nacimiento
				obj.id_comuna = id_comuna or obj.id_comuna
				obj.rol = rol or obj.rol
				obj.actualizado_en = timezone.now()
				obj.save(update_fields=[
					"nombres", "apellidos", "email", "telefono", "direccion",
					"genero", "fecha_nacimiento", "id_comuna",
					"rol", "actualizado_en"
				])
			return True
		except IntegrityError:
			# Si conflicto por RUT, intenta buscar por RUT y actualizar por ahí
			try:
				obj = UsuarioDominio.objects.get(rut=rut)
				obj.email = email or obj.email
				obj.nombres = nombres or obj.nombres
				obj.apellidos = apellidos or obj.apellidos
				obj.telefono = telefono or obj.telefono
				obj.direccion = direccion or obj.direccion
				obj.genero = genero or obj.genero
				obj.fecha_nacimiento = birth_date or obj.fecha_nacimiento
				obj.id_comuna = id_comuna or obj.id_comuna
				obj.rol = rol or obj.rol
				obj.actualizado_en = timezone.now()
				obj.save(update_fields=[
					"email", "nombres", "apellidos", "telefono", "direccion",
					"genero", "fecha_nacimiento", "id_comuna",
					"rol", "actualizado_en"
				])
				return True
			except UsuarioDominio.DoesNotExist:
				# Si también falla, no romper el flujo
				return False
		except Exception:
			return False

@api_view(["GET"])
def ping(request):
	return Response({"status": "ok"})


@api_view(["GET"])
def regiones(request):
	with connection.cursor() as cur:
		cur.execute("SELECT id_region, nombre, codigo FROM region ORDER BY nombre")
		rows = cur.fetchall()
	return Response([{"id": str(r[0]), "nombre": r[1], "codigo": r[2]} for r in rows])


@api_view(["GET"])
def comunas(request):
	region_id = request.query_params.get("region_id")
	comuna_id = request.query_params.get("comuna_id")
	with connection.cursor() as cur:
		if comuna_id:
			cur.execute(
				"SELECT id_comuna, nombre, codigo, id_region FROM comuna WHERE id_comuna=%s",
				[comuna_id],
			)
			rows = cur.fetchall()
			return Response([
				{"id": str(r[0]), "nombre": r[1], "codigo": r[2], "region_id": str(r[3])} for r in rows
			])
		elif region_id:
			cur.execute(
				"SELECT id_comuna, nombre, codigo, id_region FROM comuna WHERE id_region=%s ORDER BY nombre",
				[region_id],
			)
		else:
			cur.execute("SELECT id_comuna, nombre, codigo, id_region FROM comuna ORDER BY nombre")
		rows = cur.fetchall()
	return Response([{"id": str(r[0]), "nombre": r[1], "codigo": r[2], "region_id": str(r[3])} for r in rows])


@api_view(["GET"])
def categories(request):
	"""Lista de categorías de servicio (id UUID, nombre, slug)."""
	with connection.cursor() as cur:
		cur.execute("SELECT id_categoria_servicio, nombre, slug FROM categoria_servicio ORDER BY nombre")
		rows = cur.fetchall()
		if not rows:
			# Seed fallback if table is empty (idempotente por slug/nombre)
			defaults = [("Gasfitería", "gasfiteria"), ("Limpieza del Hogar", "limpieza"), ("Jardinería", "jardineria")]
			for nombre, slug in defaults:
				try:
					cur.execute(
						"SELECT 1 FROM categoria_servicio WHERE slug=%s OR lower(nombre)=lower(%s) LIMIT 1",
						[slug, nombre],
					)
					exists = cur.fetchone() is not None
					if not exists:
						cur.execute(
							"INSERT INTO categoria_servicio (id_categoria_servicio, nombre, slug) VALUES (%s, %s, %s)",
							[str(uuid.uuid4()), nombre, slug],
						)
				except Exception:
					pass
			# Reconsultar tras seed
			cur.execute("SELECT id_categoria_servicio, nombre, slug FROM categoria_servicio ORDER BY nombre")
			rows = cur.fetchall()
	return Response([
		{"id": str(r[0]), "nombre": r[1], "slug": r[2]} for r in rows
	])


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_services(request):
	"""Servicios del usuario autenticado, con estado de verificación y datos base."""
	u = request.user
	try:
		dom = UsuarioDominio.objects.get(email=u.email)
	except UsuarioDominio.DoesNotExist:
		return Response({"message": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	rut = dom.rut
	estado_general = None

	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT sp.id_servicio_profesional, cs.nombre AS categoria, sp.anos_experiencia,
				   sp.descripcion, sp.tipo_duracion, sp.duracion_fija_minutos, sp.duracion_minima_minutos,
				   sp.duracion_maxima_minutos, sp.precio_fijo, sp.estado_verificacion,
				   sp.creado_en, sp.razon_rechazo
			FROM servicio_profesional sp
			JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
			WHERE sp.rut_usuario = %s
			ORDER BY sp.creado_en DESC
			""",
			[rut],
		)
		rows = cur.fetchall()

	items = []
	estados = []
	for r in rows:
		sid = str(r[0])
		estado = (r[9] or '').lower()
		estados.append(estado)
		items.append({
			"id_servicio_profesional": str(r[0]),
			"categoria": r[1],
			"anos_experiencia": r[2],
			"descripcion": r[3],
			"tipo_duracion": r[4],
			"duracion_fija_minutos": r[5],
			"duracion_minima_minutos": r[6],
			"duracion_maxima_minutos": r[7],
			"precio_fijo": r[8],
			"estado_verificacion": r[9],
			"creado_en": r[10].isoformat() if r[10] else None,
			"razon_rechazo": r[11],
			"visible": estado != 'suspendido',
		})

	# Derivar estado_general: aprobado si tiene >=1 aprobado; pendiente si hay algún pendiente/en_revision pero ninguno aprobado; rechazos si todos rechazados; None si vacío
	if estados:
		if any(e == 'aprobado' for e in estados):
			estado_general = 'aprobado'
		elif any(e in ('pendiente', 'en_revision') for e in estados):
			estado_general = 'pendiente'
		elif all(e == 'rechazado' for e in estados):
			estado_general = 'rechazado'

	return Response({
		"rut": rut,
		"estado_general": estado_general,
		"servicios": items,
	})


@api_view(["POST"])
def register(request):
	serializer = RegisterSerializer(data=request.data)
	if serializer.is_valid():
		with transaction.atomic():
			user = serializer.save()
			# Insertar/actualizar en la tabla dominio `usuario` (obligatorio)
			# Evitar caché de relación: re-cargar el profile desde DB
			try:
				profile = Profile.objects.get(user=user)
			except Profile.DoesNotExist:
				profile = getattr(user, 'profile', None)
			# Resolver comuna_id directo si viene desde el serializer
			comuna_id = getattr(serializer, '_saved_comuna_id', None)
			if not comuna_id:
				# Fallback: resolver por texto
				with connection.cursor() as cur:
					_id_region, resolved = _resolve_region_comuna(cur, getattr(profile, 'region', None), getattr(profile, 'district', None))
					comuna_id = str(resolved) if resolved else None
			# Seguridad adicional: si el RUT ya existe en `usuario`, no permitir crear segunda cuenta
			try:
				existing_rut = UsuarioDominio.objects.filter(rut=getattr(serializer, '_saved_rut', None) or getattr(profile, 'rut', None)).exists()
			except Exception:
				existing_rut = False
			if existing_rut:
				# Revertir creación del usuario Django
				user.delete()
				msg = "El RUT ya está registrado en el sistema principal. Por favor, inicia sesión o recupera tu contraseña."
				return Response(msg, status=status.HTTP_400_BAD_REQUEST, content_type="text/plain")
			ok = _upsert_usuario_dominio(
				first_name=user.first_name,
				last_name=user.last_name,
				rut=getattr(serializer, '_saved_rut', None) or getattr(profile, 'rut', None),
				email=user.email,
				password_hash=user.password,  # hash Django (pbkdf2_sha256)
				phone=getattr(profile, 'phone', None),
				address=getattr(profile, 'address', None),
				gender=getattr(profile, 'gender', None),
				birth_date=getattr(profile, 'birth_date', None),
				role=getattr(profile, 'role', 'cliente'),
				region_name=getattr(profile, 'region', None),
				comuna_name=getattr(profile, 'district', None),
				comuna_id_override=comuna_id,
			)
			if not ok:
				# Revertir creación del usuario Django si no se pudo persistir en dominio
				# Eliminar el usuario Django creado en esta transacción
				user.delete()
				raise drf_serializers.ValidationError({
					"usuario": "No se pudo guardar en la tabla principal 'usuario'. Verifique: RUT, email único, y comuna válida.",
					"rut": getattr(profile, 'rut', None),
					"comuna_id": comuna_id,
				})
			# Emitir tokens tras registro
			refresh = RefreshToken.for_user(user)
			data = {
				"user": UserSerializer(user).data,
				"refresh": str(refresh),
				"access": str(refresh.access_token),
			}
			return Response(data, status=status.HTTP_201_CREATED)
	# Simplificar errores comunes para UX: devolver solo el texto como text/plain
	try:
		errs = serializer.errors
		if isinstance(errs, dict):
			# Priorizar mensajes de email o rut si existen
			for key in ("email", "rut"):
				if key in errs and errs[key]:
					first = errs[key][0] if isinstance(errs[key], list) else errs[key]
					return Response(str(first), status=status.HTTP_400_BAD_REQUEST, content_type="text/plain")
			# Si viene un mensaje top-level
			if 'message' in errs and errs['message']:
				m = errs['message'][0] if isinstance(errs['message'], list) else errs['message']
				return Response(str(m), status=status.HTTP_400_BAD_REQUEST, content_type="text/plain")
	except Exception:
		pass
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
	# Ensure profile exists for the user
	Profile.objects.get_or_create(user=request.user)
	data = UserSerializer(request.user).data
	# Adjuntar snapshot desde la tabla dominio `usuario` para verificar persistencia principal
	try:
		# Buscar por email; si no, intentar por RUT del profile
		try:
			dom = UsuarioDominio.objects.get(email=request.user.email)
		except UsuarioDominio.DoesNotExist:
			dom = UsuarioDominio.objects.get(rut=getattr(getattr(request.user, 'profile', None), 'rut', ''))
		data["dominio"] = {
			"nombres": dom.nombres,
			"apellidos": dom.apellidos,
			"rut": dom.rut,
			"email": dom.email,
			"telefono": dom.telefono,
			"direccion": dom.direccion,
			"genero": dom.genero,
			"fecha_nacimiento": dom.fecha_nacimiento.isoformat() if dom.fecha_nacimiento else None,
			"id_comuna": dom.id_comuna,
			"rol": dom.rol,
			"email_verificado": dom.email_verificado,
			"perfil_publico": dom.perfil_publico,
			"foto_perfil_url": getattr(dom, 'foto_perfil_url', None),
		}
		# Calcular avatar efectivo (preferir dominio, luego profile)
		avatar = getattr(dom, 'foto_perfil_url', None)
		if not avatar:
			avatar = getattr(getattr(request.user, 'profile', None), 'avatar_url', None)
		# Normalizar a URL absoluta si es relativa
		try:
			if avatar and isinstance(avatar, str) and avatar.startswith('/'):
				avatar = request.build_absolute_uri(avatar)
		except Exception:
			pass
		data["avatar"] = avatar
	except UsuarioDominio.DoesNotExist:
		data["dominio"] = None
		# Fallback de avatar solo desde profile si existe
		avatar = getattr(getattr(request.user, 'profile', None), 'avatar_url', None)
		try:
			if avatar and isinstance(avatar, str) and avatar.startswith('/'):
				avatar = request.build_absolute_uri(avatar)
		except Exception:
			pass
		data["avatar"] = avatar
	return Response(data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
	"""Sube un avatar de usuario y guarda la URL en Profile.avatar_url. Body: { file: <image> }"""
	user = request.user
	file = request.FILES.get('file')
	if not file:
		return Response({"message": "Archivo requerido (file)"}, status=status.HTTP_400_BAD_REQUEST)
	# Tamaño máximo 3MB
	if file.size and file.size > 3 * 1024 * 1024:
		return Response({"message": "El archivo supera 3MB"}, status=status.HTTP_400_BAD_REQUEST)
	# Extensiones básicas
	name = (file.name or 'avatar').lower()
	if not any(name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
		return Response({"message": "Formato no soportado (jpg, jpeg, png, webp)"}, status=status.HTTP_400_BAD_REQUEST)

	# Guardar en almacenamiento por defecto
	subdir = os.path.join('uploads', 'avatars', str(user.id))
	try:
		os.makedirs(os.path.join(getattr(settings, 'MEDIA_ROOT', ''), subdir), exist_ok=True)
	except Exception:
		pass
	safe_name = f"avatar_{int(timezone.now().timestamp())}_{name}"
	rel_path = os.path.join(subdir, safe_name)
	path = default_storage.save(rel_path, ContentFile(file.read()))
	# Obtener URL pública
	if hasattr(default_storage, 'url'):
		url = default_storage.url(path)
	else:
		base = getattr(settings, 'MEDIA_URL', '/') or '/'
		url = base + path
	# Normalizar a absoluta
	try:
		url_abs = request.build_absolute_uri(url) if url and url.startswith('/') else url
	except Exception:
		url_abs = url

	prof, _ = Profile.objects.get_or_create(user=user)
	prof.avatar_url = url_abs
	prof.save(update_fields=["avatar_url"])

	# Guardar también en dominio.usuario
	try:
		try:
			dom = UsuarioDominio.objects.get(email=user.email)
		except UsuarioDominio.DoesNotExist:
			# fallback por RUT del profile
			dom = UsuarioDominio.objects.get(rut=getattr(prof, 'rut', ''))
		setattr(dom, 'foto_perfil_url', url_abs)
		dom.actualizado_en = timezone.now()
		# save() en modelo unmanaged funciona si la tabla tiene columnas correspondientes
		dom.save()
	except Exception:
		pass

	return Response({"url": url_abs})


@api_view(["PUT", "PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_me(request):
	"""Actualiza datos básicos del usuario autenticado (Django User + Profile) y sincroniza con dominio.usuario.
	Body (cualquiera opcional): {
	  name?: string ("Nombre Apellido"), first_name?: string, last_name?: string,
	  email?: string, phone?: string, address?: string,
	  gender?: 'masculino'|'femenino'|'no_binario', birth_date?: 'YYYY-MM-DD',
	  region_id?: string, comuna_id?: string, region_name?: string, comuna_name?: string
	}
	Respuesta: igual a GET /api/auth/me/
	"""
	u = request.user
	data = request.data or {}

	# Proteger el RUT: nunca permitir cambios de RUT por este endpoint
	rut_in = (data.get('rut') or '').strip()
	if rut_in:
		current_rut = getattr(getattr(u, 'profile', None), 'rut', '') or ''
		if rut_in != current_rut:
			return Response({"message": "El RUT no se puede cambiar"}, status=status.HTTP_400_BAD_REQUEST)

	first_name = (data.get('first_name') or '').strip()
	last_name = (data.get('last_name') or '').strip()
	name = (data.get('name') or '').strip()
	email = (data.get('email') or '').strip().lower()
	phone = (data.get('phone') or '').strip()
	address = (data.get('address') or '').strip()
	gender = data.get('gender')
	birth_date_raw = (data.get('birth_date') or '').strip()
	region_id = data.get('region_id')
	comuna_id = data.get('comuna_id')
	region_name = data.get('region_name')
	comuna_name = data.get('comuna_name') or data.get('commune_name')

	# Derivar first/last desde name si viene
	if name and (not first_name and not last_name):
		parts = [p for p in name.split(' ') if p]
		if parts:
			first_name = parts[0]
			last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''

	# Validar fechas (simple)
	bd = None
	if birth_date_raw:
		try:
			bd = datetime.fromisoformat(birth_date_raw).date()
		except Exception:
			return Response({"message": "birth_date inválido"}, status=status.HTTP_400_BAD_REQUEST)

	# Cargar/sincronizar Profile
	prof, _ = Profile.objects.get_or_create(user=u)

	# Cambiar email si viene y es distinto
	if email and email != u.email:
		# Chequear unicidad en Django
		if User.objects.filter(email=email).exclude(id=u.id).exists():
			return Response({"message": "Email ya en uso"}, status=status.HTTP_400_BAD_REQUEST)
		u.email = email
		u.username = email  # mantener username=email si usamos este patrón

	if first_name:
		u.first_name = first_name
	if last_name is not None:
		u.last_name = last_name
	u.save()

	if phone is not None:
		prof.phone = phone
	if address is not None:
		prof.address = address
	if gender is not None:
		prof.gender = _normalize_genero(gender)
	if bd is not None:
		prof.birth_date = bd
	# Guardar nombres de región/comuna si vienen; los IDs no existen en Profile (guardamos nombres)
	if region_name is not None and region_name != '':
		prof.region = region_name
	if comuna_name is not None and comuna_name != '':
		prof.district = comuna_name
	prof.save()

	# Sincronizar con dominio.usuario (obligatorio que exista RUT en dominio para actualización)
	# Resolver comuna_id final: prioridad al ID recibido; si no, resolver por nombres actuales
	final_comuna_id = None
	if comuna_id:
		final_comuna_id = comuna_id
	else:
		rn = region_name or getattr(prof, 'region', None)
		cn = comuna_name or getattr(prof, 'district', None)
		if rn or cn:
			with connection.cursor() as cur:
				_rid, _cid = _resolve_region_comuna(cur, rn, cn)
				final_comuna_id = str(_cid) if _cid else None

	# Determinar RUT del usuario en dominio; si no existe, _upsert hará insert si hay RUT en Profile
	rut = getattr(prof, 'rut', None)
	ok = _upsert_usuario_dominio(
		first_name=u.first_name,
		last_name=u.last_name,
		rut=rut,
		email=u.email,
		password_hash=u.password,
		phone=getattr(prof, 'phone', None),
		address=getattr(prof, 'address', None),
		gender=getattr(prof, 'gender', None),
		birth_date=getattr(prof, 'birth_date', None),
		role=getattr(prof, 'role', 'cliente'),
		region_name=getattr(prof, 'region', None),
		comuna_name=getattr(prof, 'district', None),
		comuna_id_override=final_comuna_id,
	)
	if not ok:
		# No abortamos cambios en Django, pero avisamos
		return Response({"message": "Perfil actualizado en Django, pero no se pudo sincronizar con 'usuario' (dominio). Verifique RUT y comuna."}, status=status.HTTP_202_ACCEPTED)

	# Responder con el mismo formato que /api/auth/me/
	return me(request)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def apply_professional(request):
	"""Cliente solicita crear su primer o nuevo servicio profesional.
	Se crea un registro en servicio_profesional con estado 'pendiente'.
	Requiere que el usuario exista en dominio.usuario con RUT y comuna (id_comuna válido).
	Body esperado: {
		general_description, category_slug, experience, description,
		duration_type ('fixed'|'range'), fixed_duration|min_duration|max_duration, price_fixed
	}
	"""
	user = request.user
	# Obtener RUT del dominio
	try:
		dom = UsuarioDominio.objects.get(email=user.email)
	except UsuarioDominio.DoesNotExist:
		return Response({"message": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	data = request.data or {}
	general_desc = (data.get('general_description') or '').strip()
	category_slug = (data.get('category_slug') or '').strip()
	exp_raw = (data.get('experience') or '').strip()
	description = (data.get('description') or '').strip()
	duration_type = (data.get('duration_type') or 'fixed').strip()
	# Coerción a int cuando corresponda
	def _to_int(v):
		try:
			return int(v) if v not in (None, "",) else None
		except Exception:
			return None
	fixed_duration = _to_int(data.get('fixed_duration'))
	min_duration = _to_int(data.get('min_duration'))
	max_duration = _to_int(data.get('max_duration'))
	price_fixed = _to_int(data.get('price_fixed'))

	# Parse experience (support values like '5+')
	exp_int = None
	if exp_raw:
		try:
			if isinstance(exp_raw, str) and exp_raw.endswith('+'):
				exp_int = int(exp_raw[:-1])
			else:
				exp_int = int(exp_raw)
		except Exception:
			exp_int = None

	if not general_desc or not category_slug or exp_int is None or not description or not price_fixed:
		return Response({"message": "Faltan campos requeridos"}, status=status.HTTP_400_BAD_REQUEST)
	if duration_type not in {"fixed", "range"}:
		return Response({"message": "duration_type inválido"}, status=status.HTTP_400_BAD_REQUEST)
	# Validación de duración según tipo
	if duration_type == 'fixed':
		if fixed_duration is None or fixed_duration <= 0:
			return Response({"message": "Duración fija inválida"}, status=status.HTTP_400_BAD_REQUEST)
	else:
		if (min_duration is None or max_duration is None or min_duration <= 0 or max_duration <= 0 or min_duration > max_duration):
			return Response({"message": "Rango de duración inválido"}, status=status.HTTP_400_BAD_REQUEST)

	# Resolver categoría por slug o nombre (robusto: intenta unaccent/like)
	with connection.cursor() as cur:
		try:
			cur.execute(
				"""
				SELECT id_categoria_servicio FROM categoria_servicio
				WHERE slug = %s OR unaccent(lower(nombre)) = unaccent(lower(%s))
				   OR unaccent(lower(nombre)) LIKE '%%' || unaccent(lower(%s)) || '%%'
				LIMIT 1
				""",
				[category_slug, category_slug, category_slug],
			)
		except Exception:
			cur.execute(
				"""
				SELECT id_categoria_servicio FROM categoria_servicio
				WHERE slug = %s OR lower(nombre) = lower(%s)
				   OR lower(nombre) LIKE '%%' || lower(%s) || '%%'
				LIMIT 1
				""",
				[category_slug, category_slug, category_slug],
			)
		row = cur.fetchone()
	if not row:
		return Response({"message": "Categoría no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
	id_cat = row[0]

	now = timezone.now()
	with transaction.atomic():
		id_serv = uuid.uuid4()
		# Determinar si es el primer servicio del usuario (para requerir certificado)
		with connection.cursor() as cur:
			cur.execute("SELECT COUNT(*) FROM servicio_profesional WHERE rut_usuario=%s", [dom.rut])
			cnt_row = cur.fetchone()
		es_primer = (cnt_row[0] == 0) if cnt_row else True

		# Insert servicio_profesional en pendiente
		# Para evitar violar NOT NULL, rellenamos los 3 campos de duración con valores coherentes.
		if duration_type == 'fixed':
			dur_fija = fixed_duration
			dur_min = fixed_duration
			dur_max = fixed_duration
		else:
			dur_fija = min_duration  # fallback para NOT NULL
			dur_min = min_duration
			dur_max = max_duration
		# Mapear a valores esperados por la BD para el check constraint
		db_duration = 'fija' if duration_type == 'fixed' else 'rango'
		try:
			with connection.cursor() as cur:
				cur.execute(
					"""
					INSERT INTO servicio_profesional (
						id_servicio_profesional, rut_usuario, id_categoria_servicio,
						anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						estado_verificacion, creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
					""",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)
		except IntegrityError as ie:
			transaction.set_rollback(True)
			return Response({"message": "No se pudo crear el servicio (integridad)", "error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)

		# Manejo de archivos (multipart)
		# Certificado de antecedentes (obligatorio en primer servicio)
		cert_file = request.FILES.get('certificate')
		exp_files = request.FILES.getlist('experience_docs') if hasattr(request, 'FILES') else []

		# Validaciones simples de archivos
		max_bytes = 5 * 1024 * 1024
		if cert_file and cert_file.size > max_bytes:
			return Response({"message": "Certificado supera 5MB"}, status=status.HTTP_400_BAD_REQUEST)
		for ef in exp_files:
			if ef.size > max_bytes:
				return Response({"message": "Un archivo de experiencia supera 5MB"}, status=status.HTTP_400_BAD_REQUEST)
		# Requerir al menos un documento de experiencia para el envío
		if not exp_files or len(exp_files) == 0:
			return Response({"message": "Debes adjuntar al menos un documento de experiencia"}, status=status.HTTP_400_BAD_REQUEST)

		saved_docs = []
		media_base = getattr(settings, 'MEDIA_ROOT', None)
		if not media_base:
			# Si no hay MEDIA_ROOT, usar almacenamiento por defecto en memoria/FS
			media_base = ''

		def _save_uploaded(file_obj, subdir: str):
			filename = file_obj.name
			rel_path = os.path.join('uploads', 'profesionales', dom.rut, subdir, filename)
			# Asegurar directorio y guardar
			path = default_storage.save(rel_path, ContentFile(file_obj.read()))
			return default_storage.url(path) if hasattr(default_storage, 'url') else (settings.MEDIA_URL + path if getattr(settings, 'MEDIA_URL', None) else path)

		# Helper: Inserta documento en documento_profesional acorde al esquema actual
		def _insert_documento(tipo_key: str, url_doc: str, mime: Optional[str]) -> bool:
			tdoc = 'certificado_antecedentes' if tipo_key.lower().startswith('cert') else 'certificado_experiencia'
			sp = transaction.savepoint()
			try:
				with connection.cursor() as cur:
					cur.execute(
						"""
						INSERT INTO documento_profesional (
							id_documento_profesional, rut_usuario, id_servicio_profesional,
							tipo_documento, url_archivo, tipo_mime, estado_verificacion, subido_en
						) VALUES (%s,%s,%s,%s,%s,%s,'pendiente',%s)
						""",
						[
							str(uuid.uuid4()), dom.rut, str(id_serv), tdoc, url_doc, (mime or None), now
						],
					)
				transaction.savepoint_commit(sp)
				return True
			except IntegrityError:
				transaction.savepoint_rollback(sp)
				return False

		# Guardar certificado (obligatorio solo en primer servicio)
		# Guardar certificado (obligatorio solo en primer servicio)
		if es_primer:
			if cert_file:
				url = _save_uploaded(cert_file, 'certificados')
				ok = _insert_documento('cert', url, getattr(cert_file, 'content_type', None))
				if not ok:
					transaction.set_rollback(True)
					return Response({"message": "No se pudo registrar el certificado"}, status=status.HTTP_400_BAD_REQUEST)
				saved_docs.append(url)
			else:
				return Response({"message": "Certificado de antecedentes es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

		# Guardar documentos de experiencia
		for ef in exp_files:
			url = _save_uploaded(ef, 'experiencia')
			ok = _insert_documento('exp', url, getattr(ef, 'content_type', None))
			if not ok:
				transaction.set_rollback(True)
				return Response({"message": "No se pudo registrar un documento de experiencia"}, status=status.HTTP_400_BAD_REQUEST)
			saved_docs.append(url)

	return Response({"ok": True, "rut": dom.rut, "id_servicio_profesional": str(id_serv)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def verifications_pending(request):
	"""Listado básico de servicios en estado pendiente para verificación.
	Solo visible para verificadores/administradores.
	"""
	# Chequear rol efectivo
	u = request.user
	role = 'administrador' if (u.is_staff or u.is_superuser) else getattr(getattr(u, 'profile', None), 'role', 'cliente')
	if role not in {"verificador", "administrador"}:
		return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	# 1) Traer servicios pendientes con info de usuario, comuna y región
	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT sp.id_servicio_profesional, sp.rut_usuario, cs.nombre AS categoria,
			   sp.descripcion, sp.anos_experiencia,
			   CASE WHEN EXISTS (
			       SELECT 1 FROM servicio_profesional s2
			       WHERE s2.rut_usuario = sp.rut_usuario AND s2.id_servicio_profesional <> sp.id_servicio_profesional
			   ) THEN FALSE ELSE TRUE END AS es_primer_servicio,
			   sp.creado_en,
				   u.nombres, u.apellidos, u.email, u.telefono,
				   c.nombre AS comuna_nombre, r.nombre AS region_nombre
			FROM servicio_profesional sp
			JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
			JOIN usuario u ON u.rut = sp.rut_usuario
			JOIN comuna c ON c.id_comuna = u.id_comuna
			JOIN region r ON r.id_region = c.id_region
			WHERE sp.estado_verificacion = 'pendiente'
			ORDER BY sp.creado_en DESC
			"""
		)
		rows = cur.fetchall()

	# 2) Agrupar documentos por servicio
	service_ids = [str(r[0]) for r in rows]
	docs_by_service: dict[str, list] = {}
	if service_ids:
		with connection.cursor() as cur:
			# Evitar SQL injection con tuple params; usar ANY con array si DB lo soporta, pero aquí hacemos IN con params
			params = service_ids
			placeholders = ",".join(["%s"] * len(params))
			cur.execute(
				f"""
				SELECT id_documento_profesional, id_servicio_profesional, tipo_documento,
					   url_archivo, subido_en
				FROM documento_profesional
				WHERE id_servicio_profesional IN ({placeholders})
				ORDER BY subido_en DESC
				""",
				params,
			)
			for d in cur.fetchall():
				# Normalizar URL absoluta para previsualización en el frontend
				raw_url = d[3] or ""
				if raw_url and raw_url.startswith('/'):
					try:
						abs_url = request.build_absolute_uri(raw_url)
					except Exception:
						abs_url = raw_url
				else:
					abs_url = raw_url
				doc = {
					"id_documento_profesional": str(d[0]),
					"id_servicio_profesional": str(d[1]),
					"tipo_documento": d[2],
					"url_archivo": abs_url,
					"subido_en": d[4].isoformat() if d[4] else None,
				}
				sid = str(d[1])
				docs_by_service.setdefault(sid, []).append(doc)

	items = []
	for r in rows:
		sid = str(r[0])
		items.append({
			"id_servicio_profesional": sid,
			"rut_usuario": r[1],
			"categoria": r[2],
			"descripcion": r[3],
			"anos_experiencia": r[4],
			"es_primer_servicio": bool(r[5]),
			"creado_en": r[6].isoformat() if r[6] else None,
			"nombres": r[7],
			"apellidos": r[8],
			"email": r[9],
			"telefono": r[10],
			"comuna": r[11],
			"region": r[12],
			"documentos": docs_by_service.get(sid, []),
		})
	return Response(items)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def verify_service(request, servicio_id: str):
	"""Aprobar o rechazar un servicio pendiente.
	Body: { action: 'approve'|'reject', reason?: string }
	Solo verificadores/administradores.
	"""
	u = request.user
	role = 'administrador' if (u.is_staff or u.is_superuser) else getattr(getattr(u, 'profile', None), 'role', 'cliente')
	if role not in {"verificador", "administrador"}:
		return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	action = (request.data.get('action') or '').strip().lower()
	reason = (request.data.get('reason') or '').strip()
	if action not in {"approve", "reject"}:
		return Response({"message": "Acción inválida"}, status=status.HTTP_400_BAD_REQUEST)

	# Resolver rut del verificador desde dominio (si existe), si no, dejar NULL
	try:
		dom_ver = UsuarioDominio.objects.get(email=u.email)
		rut_ver = dom_ver.rut
	except UsuarioDominio.DoesNotExist:
		rut_ver = None

	now = timezone.now()
	with connection.cursor() as cur:
		if action == 'approve':
			cur.execute(
				"""
				UPDATE servicio_profesional
				SET estado_verificacion = 'aprobado', rut_verificador = %s, verificado_en = %s
				WHERE id_servicio_profesional = %s AND estado_verificacion = 'pendiente'
				""",
				[rut_ver, now, servicio_id],
			)
			# Si fue aprobado, promover rol a profesional en dominio.usuario y aprobar estado general si es primer servicio
			try:
				cur.execute(
					"SELECT rut_usuario FROM servicio_profesional WHERE id_servicio_profesional=%s",
					[servicio_id],
				)
				rut_u = cur.fetchone()[0]
				# Actualizar rol si no es ya profesional/administrador/verificador
				cur.execute("SELECT rol FROM usuario WHERE rut=%s", [rut_u])
				rol_row = cur.fetchone()
				if rol_row:
					rol_actual = (rol_row[0] or '').lower()
					if rol_actual not in ('profesional', 'administrador', 'verificador'):
						cur.execute("UPDATE usuario SET rol='profesional', actualizado_en=%s WHERE rut=%s", [now, rut_u])
			except Exception:
				pass
		else:
			cur.execute(
				"""
				UPDATE servicio_profesional
				SET estado_verificacion = 'rechazado', rut_verificador = %s, verificado_en = %s, razon_rechazo = %s
				WHERE id_servicio_profesional = %s AND estado_verificacion = 'pendiente'
				""",
				[rut_ver, now, reason or None, servicio_id],
			)

	return Response({"ok": True})


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
def schedule_detail(request, service_id: str):
	"""Get or update schedule for a given servicio_profesional UUID (owned by current user).
	GET returns: {
	  weekly_template: WeeklyTemplate,
	  unavailabilities: [{id,start_date,end_date,reason}],
	  custom_periods: [{id,name,start_date,end_date,weekly_template}]
	}
	PUT expects the same shape. Ownership is verified via dominio.usuario email mapping.
	"""
	# Verify the service belongs to the authenticated user
	try:
		dom = UsuarioDominio.objects.get(email=request.user.email)
	except UsuarioDominio.DoesNotExist:
		return Response({"message": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT rut_usuario FROM servicio_profesional WHERE id_servicio_profesional=%s
			""",
			[service_id],
		)
		row = cur.fetchone()
	if not row:
		return Response({"message": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
	if str(row[0]) != dom.rut:
		return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	# Helpers para mapear días
	day_names = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
	def weekday_name_from_index(idx: int) -> str:
		try:
			return day_names[idx]
		except Exception:
			return 'monday'

	def index_from_weekday_name(name: str) -> Optional[int]:
		if not isinstance(name, str):
			return None
		name = name.strip().lower()
		try:
			return day_names.index(name)
		except ValueError:
			return None

	if request.method == 'GET':
		# Base semanal desde horario_profesional
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT dia_semana, to_char(hora_inicio, 'HH24:MI'), to_char(hora_fin, 'HH24:MI')
				FROM horario_profesional
				WHERE id_servicio_profesional = %s
				ORDER BY dia_semana, hora_inicio
				""",
				[service_id],
			)
			rows = cur.fetchall()
		weekly_template = {name: {"enabled": False, "timeSlots": []} for name in day_names}
		for d, h1, h2 in rows:
			dn = weekday_name_from_index(int(d))
			weekly_template[dn]["enabled"] = True
			weekly_template[dn]["timeSlots"].append({"start": h1, "end": h2})

		# Días bloqueados como unavailabilities (rango = mismo día)
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT id_dia_bloqueado, fecha, COALESCE(motivo,'')
				FROM dia_bloqueado
				WHERE id_servicio_profesional = %s
				ORDER BY fecha
				""",
				[service_id],
			)
			urows = cur.fetchall()
		unav = [{
			'id': str(r[0]),
			'start_date': r[1].isoformat(),
			'end_date': r[1].isoformat(),
			'reason': r[2],
		} for r in urows]

		# Períodos personalizados
		with connection.cursor() as cur:
			cur.execute(
				"""
				SELECT id_periodo_personalizado, fecha_inicio, fecha_fin,
					   to_char(hora_inicio,'HH24:MI'), to_char(hora_fin,'HH24:MI'),
					   COALESCE(descripcion,'')
				FROM periodo_personalizado
				WHERE id_servicio_profesional = %s
				ORDER BY fecha_inicio, fecha_fin, hora_inicio
				""",
				[service_id],
			)
			prows = cur.fetchall()
		periods = []
		for pid, fi, ff, hi, hf, desc in prows:
			# Construir weekly_template simple: aplicar el mismo slot a todos los días del rango
			wt = {name: {"enabled": False, "timeSlots": []} for name in day_names}
			current = fi
			while current <= ff:
				dn = weekday_name_from_index(current.weekday())
				wt[dn]["enabled"] = True
				wt[dn]["timeSlots"].append({"start": hi, "end": hf})
				current = current + timedelta(days=1)
			periods.append({
				'id': str(pid),
				'name': desc,
				'start_date': fi.isoformat(),
				'end_date': ff.isoformat(),
				'weekly_template': wt,
			})

		return Response({
			'weekly_template': weekly_template,
			'unavailabilities': unav,
			'custom_periods': periods,
		})

	# PUT
	payload = request.data or {}
	weekly_template = payload.get('weekly_template') or {}
	unavailabilities = payload.get('unavailabilities') or []
	custom_periods = payload.get('custom_periods') or []

	# Basic validation: ensure weekly_template keys are strings and times in HH:MM
	def _valid_time(s: str) -> bool:
		try:
			datetime.strptime(s, '%H:%M')
			return True
		except Exception:
			return False

	if weekly_template and isinstance(weekly_template, dict):
		for day, conf in weekly_template.items():
			if not isinstance(conf, dict):
				return Response({"message": f"weekly_template[{day}] inválido"}, status=status.HTTP_400_BAD_REQUEST)
			enabled = conf.get('enabled')
			slots = conf.get('timeSlots', [])
			if enabled and slots:
				for i, sl in enumerate(slots):
					st = (sl or {}).get('start')
					en = (sl or {}).get('end')
					if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
						return Response({"message": f"Horario inválido en {day} índice {i}"}, status=status.HTTP_400_BAD_REQUEST)

	# Persistir en tablas de dominio (replace-all semantics)
	with transaction.atomic():
		# Reemplazar horario_profesional
		with connection.cursor() as cur:
			cur.execute("DELETE FROM horario_profesional WHERE id_servicio_profesional = %s", [service_id])
			if isinstance(weekly_template, dict):
				for day, conf in weekly_template.items():
					idx = index_from_weekday_name(day)
					if idx is None:
						continue
					enabled = (conf or {}).get('enabled')
					slots = (conf or {}).get('timeSlots') or []
					if enabled and slots:
						for sl in slots:
							st = (sl or {}).get('start')
							en = (sl or {}).get('end')
							if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
								return Response({"message": f"Horario inválido en {day}"}, status=status.HTTP_400_BAD_REQUEST)
							cur.execute(
								"""
								INSERT INTO horario_profesional (
									id_horario_profesional, id_servicio_profesional, dia_semana, hora_inicio, hora_fin
								) VALUES (%s,%s,%s,%s::time,%s::time)
								""",
								[str(uuid.uuid4()), service_id, int(idx), st, en],
							)

		# Reemplazar días bloqueados
		with connection.cursor() as cur:
			cur.execute("DELETE FROM dia_bloqueado WHERE id_servicio_profesional = %s", [service_id])
			for item in unavailabilities:
				try:
					sd = datetime.fromisoformat((item or {}).get('start_date', '')).date()
					ed = datetime.fromisoformat((item or {}).get('end_date', '')).date()
				except Exception:
					return Response({"message": "Fecha inválida en unavailabilities"}, status=status.HTTP_400_BAD_REQUEST)
				if ed < sd:
					return Response({"message": "Rango de fechas inválido en unavailability"}, status=status.HTTP_400_BAD_REQUEST)
				cur_date = sd
				reason = ((item or {}).get('reason') or '')[:255]
				while cur_date <= ed:
					cur.execute(
						"""
						INSERT INTO dia_bloqueado (
							id_dia_bloqueado, id_servicio_profesional, fecha, motivo
						) VALUES (%s,%s,%s,%s)
						ON CONFLICT (id_servicio_profesional, fecha) DO UPDATE SET motivo=EXCLUDED.motivo
						""",
						[str(uuid.uuid4()), service_id, cur_date, reason],
					)
					cur_date = cur_date + timedelta(days=1)

		# Reemplazar períodos personalizados
		with connection.cursor() as cur:
			cur.execute("DELETE FROM periodo_personalizado WHERE id_servicio_profesional = %s", [service_id])
			for item in custom_periods:
				try:
					sd = datetime.fromisoformat((item or {}).get('start_date', '')).date()
					ed = datetime.fromisoformat((item or {}).get('end_date', '')).date()
				except Exception:
					return Response({"message": "Fecha inválida en custom_periods"}, status=status.HTTP_400_BAD_REQUEST)
				if ed < sd:
					return Response({"message": "Rango de fechas inválido en custom_periods"}, status=status.HTTP_400_BAD_REQUEST)
				wt = (item or {}).get('weekly_template') or {}
				name = ((item or {}).get('name') or '')[:200]
				if isinstance(wt, dict) and wt:
					# expandir por día
					cur_day = sd
					while cur_day <= ed:
						dn = weekday_name_from_index(cur_day.weekday())
						conf = wt.get(dn) or {}
						if conf.get('enabled') and conf.get('timeSlots'):
							for sl in (conf.get('timeSlots') or []):
								st = (sl or {}).get('start')
								en = (sl or {}).get('end')
								if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
									return Response({"message": f"Horario inválido en período personalizado {dn}"}, status=status.HTTP_400_BAD_REQUEST)
								cur.execute(
									"""
									INSERT INTO periodo_personalizado (
										id_periodo_personalizado, id_servicio_profesional, fecha_inicio, fecha_fin, hora_inicio, hora_fin, descripcion
									) VALUES (%s,%s,%s,%s,%s::time,%s::time,%s)
									""",
									[str(uuid.uuid4()), service_id, cur_day, cur_day, st, en, name],
								)
						cur_day = cur_day + timedelta(days=1)
				else:
					# Sin weekly_template, ignoramos item (o podríamos crear un default)
					continue

	return Response({"ok": True})


@api_view(["POST"])
def reset_admin(request):
	"""DEBUG-only endpoint to ensure the admin exists with known credentials."""
	if not settings.DEBUG:
		return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)
	email = (request.data.get("email") or "admin@servihogar.cl").strip().lower()
	password = request.data.get("password") or "Admin2025!ServiHogar"
	if not email:
		return Response({"message": "email requerido"}, status=status.HTTP_400_BAD_REQUEST)
	user, created = User.objects.get_or_create(
		username=email,
		defaults={
			"email": email,
			"first_name": "Admin",
			"last_name": "ServiHogar",
		},
	)
	user.is_staff = True
	user.is_superuser = True
	user.set_password(password)
	user.save()
	Profile.objects.get_or_create(user=user)
	return Response({"ok": True, "created": created})


@api_view(["POST"])
def reset_verifier(request):
	"""DEBUG-only endpoint to create or reset a Verificador user with known credentials."""
	if not settings.DEBUG:
		return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)
	email = (request.data.get("email") or "verificador@servihogar.cl").strip().lower()
	password = request.data.get("password") or "Verifier2025!ServiHogar"
	if not email:
		return Response({"message": "email requerido"}, status=status.HTTP_400_BAD_REQUEST)

	user, created = User.objects.get_or_create(
		username=email,
		defaults={
			"email": email,
			"first_name": "Verificador",
			"last_name": "ServiHogar",
		},
	)
	# Asegurar que NO es admin
	user.is_staff = False
	user.is_superuser = False
	user.set_password(password)
	user.save()

	profile, _ = Profile.objects.get_or_create(user=user)
	if profile.role != "verificador":
		profile.role = "verificador"
		profile.save(update_fields=["role"])

	return Response({"ok": True, "created": created})


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def sync_usuario(request):
	"""Sincroniza todos los usuarios Django hacia la tabla dominio `usuario`.
	Solo staff/superuser. Útil para migrar cuentas ya existentes.
	"""
	created = 0
	updated = 0
	failed = 0
	for user in User.objects.all().iterator():
		try:
			exists = UsuarioDominio.objects.filter(email=user.email).exists()
			profile = getattr(user, 'profile', None)
			_upsert_usuario_dominio(
				first_name=user.first_name,
				last_name=user.last_name,
				rut=getattr(profile, 'rut', None),
				email=user.email,
				password_hash=user.password,
				phone=getattr(profile, 'phone', None),
				address=getattr(profile, 'address', None),
				gender=getattr(profile, 'gender', None),
				birth_date=getattr(profile, 'birth_date', None),
				role=getattr(profile, 'role', 'cliente'),
				region_name=getattr(profile, 'region', None),
				comuna_name=getattr(profile, 'district', None),
			)
			if exists:
				updated += 1
			else:
				# After upsert, verify existence
				if UsuarioDominio.objects.filter(email=user.email).exists():
					created += 1
				else:
					failed += 1
		except Exception:
			failed += 1
	return Response({"created": created, "updated": updated, "failed": failed})


@api_view(["GET"])
def services_search(request):
	"""Lista de servicios disponibles (aprobados) para el buscador público.
	Filtros opcionales por query params:
	  - q: texto (en nombre profesional, apellido, categoría, descripción)
	  - category_slug: slug de la categoría
	  - region_id / region_name
	  - comuna_id / comuna_name
	  - min_price / max_price (enteros)
	Respuesta: lista de objetos normalizados para la UI.
	"""
	q = (request.query_params.get('q') or '').strip()
	category_slug = (request.query_params.get('category_slug') or '').strip()
	region_id = request.query_params.get('region_id')
	region_name = (request.query_params.get('region_name') or '').strip()
	comuna_id = request.query_params.get('comuna_id')
	comuna_name = (request.query_params.get('comuna_name') or '').strip()
	def _to_int(v):
		try:
			return int(v) if v not in (None, '',) else None
		except Exception:
			return None
	min_price = _to_int(request.query_params.get('min_price'))
	max_price = _to_int(request.query_params.get('max_price'))

	# Construir SQL dinámico de forma segura
	sql = [
		"""
		SELECT sp.id_servicio_profesional, cs.nombre AS categoria, cs.slug, sp.descripcion,
			   sp.anos_experiencia, sp.tipo_duracion, sp.duracion_fija_minutos,
			   sp.duracion_minima_minutos, sp.duracion_maxima_minutos, sp.precio_fijo,
		   u.nombres, u.apellidos, u.email, u.telefono, u.genero,
		   u.foto_perfil_url,
			   c.nombre AS comuna_nombre, r.nombre AS region_nombre
		FROM servicio_profesional sp
		JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
		JOIN usuario u ON u.rut = sp.rut_usuario
		JOIN comuna c ON c.id_comuna = u.id_comuna
		JOIN region r ON r.id_region = c.id_region
		WHERE sp.estado_verificacion = 'aprobado'
		"""
	]
	params: list = []

	if category_slug:
	  	# igualar por slug o por nombre aproximado
		try:
			sql.append("AND (cs.slug = %s OR unaccent(lower(cs.nombre)) = unaccent(lower(%s)))")
			params.extend([category_slug, category_slug])
		except Exception:
			sql.append("AND (cs.slug = %s OR lower(cs.nombre) = lower(%s))")
			params.extend([category_slug, category_slug])

	if region_id:
		sql.append("AND r.id_region = %s")
		params.append(region_id)
	elif region_name:
		try:
			sql.append("AND unaccent(lower(r.nombre)) = unaccent(lower(%s))")
		except Exception:
			sql.append("AND lower(r.nombre) = lower(%s)")
		params.append(region_name)

	if comuna_id:
		sql.append("AND c.id_comuna = %s")
		params.append(comuna_id)
	elif comuna_name:
		try:
			sql.append("AND unaccent(lower(c.nombre)) = unaccent(lower(%s))")
		except Exception:
			sql.append("AND lower(c.nombre) = lower(%s)")
		params.append(comuna_name)

	if min_price is not None:
		sql.append("AND sp.precio_fijo >= %s")
		params.append(min_price)
	if max_price is not None:
		sql.append("AND sp.precio_fijo <= %s")
		params.append(max_price)

	if q:
		# Buscar en nombre/apellido profesional, categoría y descripción del servicio
		try:
			sql.append(
				"AND (unaccent(lower(u.nombres)) LIKE '%%' || unaccent(lower(%s)) || '%%'"
				" OR unaccent(lower(u.apellidos)) LIKE '%%' || unaccent(lower(%s)) || '%%'"
				" OR unaccent(lower(cs.nombre)) LIKE '%%' || unaccent(lower(%s)) || '%%'"
				" OR unaccent(lower(sp.descripcion)) LIKE '%%' || unaccent(lower(%s)) || '%%')"
			)
		except Exception:
			sql.append(
				"AND (lower(u.nombres) LIKE '%%' || lower(%s) || '%%'"
				" OR lower(u.apellidos) LIKE '%%' || lower(%s) || '%%'"
				" OR lower(cs.nombre) LIKE '%%' || lower(%s) || '%%'"
				" OR lower(sp.descripcion) LIKE '%%' || lower(%s) || '%%')"
			)
		params.extend([q, q, q, q])

	sql.append("ORDER BY sp.actualizado_en DESC NULLS LAST, sp.creado_en DESC")
	query = "\n".join(sql)

	with connection.cursor() as cur:
		cur.execute(query, params)
		rows = cur.fetchall()

	items = []
	for r in rows:
		(
			sid, categoria, slug, descripcion,
			anos_experiencia, tipo_duracion, dur_fija,
			dur_min, dur_max, precio,
			nombres, apellidos, email, telefono, genero,
			dom_avatar,
			comuna_nombre, region_nombre,
		) = r

		# Mapear a estructura de la UI (AllServices)
		duration_type = 'fixed' if (tipo_duracion or '').lower() in ('fija', 'fixed') else 'range'
		# Avatar del profesional: preferir columna de dominio, luego Profile.avatar_url
		avatar_url = dom_avatar or None
		if avatar_url:
			try:
				if isinstance(avatar_url, str) and avatar_url.startswith('/'):
					avatar_url = request.build_absolute_uri(avatar_url)
			except Exception:
				pass
		if not avatar_url:
			try:
				dj_user = User.objects.filter(email=email).first()
				if dj_user and getattr(dj_user, 'profile', None):
					avatar_url = dj_user.profile.avatar_url or None
			except Exception:
				avatar_url = None

		# La visibilidad ahora se maneja mediante estado_verificacion (suspendido no aparece en esta lista de aprobados)

		item = {
			'id': str(sid),
			'name': f"{nombres} {apellidos}".strip(),
			'service': categoria,
			'rating': 0.0,  # placeholder hasta implementar reseñas
			'reviews': 0,
			'region': region_nombre,
			'commune': comuna_nombre,
			'location': f"{comuna_nombre}, {region_nombre.split(' ')[-1] if region_nombre else ''}",
			'basePrice': int(precio) if precio is not None else 0,
			'priceDisplay': f"Desde ${int(precio):,}".replace(',', '.'),
			'experience': f"{anos_experiencia} años" if anos_experiencia else '',
			'phone': telefono,
			'email': email,
			'description': descripcion,
			'verified': True,  # servicios aprobados
			'avatar': avatar_url or '/api/placeholder/150/150',
			'gender': (genero or '').lower() if genero else None,
			'age': None,
			'durationType': duration_type,
		}
		if duration_type == 'fixed':
			item['fixedDuration'] = int(dur_fija) if dur_fija is not None else 60
		else:
			item['minDuration'] = int(dur_min) if dur_min is not None else 60
			item['maxDuration'] = int(dur_max) if dur_max is not None else 180

		items.append(item)

	return Response(items)


@api_view(["PUT"])
@permission_classes([permissions.IsAuthenticated])
def toggle_service_visibility(request, service_id: str):
	"""Enable/disable a service in search results for its owner.
	Body: { is_active: boolean }
	"""
	# Verify the service belongs to the authenticated user via dominio.usuario
	try:
		dom = UsuarioDominio.objects.get(email=request.user.email)
	except UsuarioDominio.DoesNotExist:
		return Response({"message": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	# Coerce to str for comparisons and model PK
	service_id_str = str(service_id)
	try:
		with connection.cursor() as cur:
			cur.execute("SELECT rut_usuario FROM servicio_profesional WHERE id_servicio_profesional = %s::uuid", [service_id_str])
			row = cur.fetchone()
	except Exception as e:
		return Response({"message": "Error consultando el servicio", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	if not row:
		return Response({"message": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
	if str(row[0]) != dom.rut:
		return Response({"message": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	raw = request.data.get('is_active')
	if isinstance(raw, bool):
		is_active = raw
	else:
		val = str(raw).strip().lower()
		is_active = val in {"1", "true", "t", "yes", "y", "on"}

	# Mapear a estado_verificacion: si is_active False y estaba aprobado -> pasar a suspendido. Si True y estaba suspendido -> pasar a aprobado
	with connection.cursor() as cur:
		cur.execute("SELECT estado_verificacion FROM servicio_profesional WHERE id_servicio_profesional=%s", [service_id_str])
		row2 = cur.fetchone()
		if not row2:
			return Response({"message": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
		current_state = (row2[0] or '').lower()
		new_state = current_state
		if is_active is False and current_state == 'aprobado':
			new_state = 'suspendido'
		elif is_active is True and current_state == 'suspendido':
			new_state = 'aprobado'
		# Otros estados: mantener
		if new_state != current_state:
			cur.execute(
				"UPDATE servicio_profesional SET estado_verificacion=%s, actualizado_en=%s WHERE id_servicio_profesional=%s",
				[new_state, timezone.now(), service_id_str],
			)

	return Response({"ok": True, "service_id": service_id, "is_active": is_active})
