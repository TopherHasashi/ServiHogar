from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework import status, permissions, serializers as drf_serializers
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
	Profile,
	UsuarioDominio,
	PerfilProfesional,
	ServicioProfesional,
	DocumentoProfesional,
	ServiceSchedule,
	ServiceUnavailability,
	ServiceCustomPeriod,
    ServiceVisibility,
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
from datetime import datetime


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
		return Response({"detail": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	rut = dom.rut
	# Obtener estado general del perfil si existe
	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT estado_verificacion_general
			FROM perfil_profesional
			WHERE rut_usuario = %s
			LIMIT 1
			""",
			[rut],
		)
		row = cur.fetchone()
		estado_general = row[0] if row else None

	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT sp.id_servicio_profesional, cs.nombre AS categoria, sp.anos_experiencia,
				   sp.descripcion, sp.tipo_duracion, sp.duracion_fija_minutos, sp.duracion_minima_minutos,
		     sp.duracion_maxima_minutos, sp.precio_fijo, sp.estado_verificacion, sp.es_primer_servicio,
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
	sids: list[str] = []
	for r in rows:
		sid = str(r[0])
		sids.append(sid)
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
			"es_primer_servicio": bool(r[10]),
			"creado_en": r[11].isoformat() if r[11] else None,
			"razon_rechazo": r[12],
			"visible": True,  # default visible unless toggled off
		})

	# Overlay visibility from managed table
	try:
		if sids:
			vis = ServiceVisibility.objects.filter(service_id__in=sids)
			vis_map = {str(v.service_id): bool(v.is_active) for v in vis}
			for it in items:
				sid = it.get("id_servicio_profesional")
				if sid in vis_map:
					it["visible"] = vis_map[sid]
	except Exception:
		pass

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
		return Response({"detail": "Archivo requerido (file)"}, status=status.HTTP_400_BAD_REQUEST)
	# Tamaño máximo 3MB
	if file.size and file.size > 3 * 1024 * 1024:
		return Response({"detail": "El archivo supera 3MB"}, status=status.HTTP_400_BAD_REQUEST)
	# Extensiones básicas
	name = (file.name or 'avatar').lower()
	if not any(name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']):
		return Response({"detail": "Formato no soportado (jpg, jpeg, png, webp)"}, status=status.HTTP_400_BAD_REQUEST)

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
			return Response({"detail": "El RUT no se puede cambiar"}, status=status.HTTP_400_BAD_REQUEST)

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
			return Response({"detail": "birth_date inválido"}, status=status.HTTP_400_BAD_REQUEST)

	# Cargar/sincronizar Profile
	prof, _ = Profile.objects.get_or_create(user=u)

	# Cambiar email si viene y es distinto
	if email and email != u.email:
		# Chequear unicidad en Django
		if User.objects.filter(email=email).exclude(id=u.id).exists():
			return Response({"detail": "Email ya en uso"}, status=status.HTTP_400_BAD_REQUEST)
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
		return Response({"detail": "Perfil actualizado en Django, pero no se pudo sincronizar con 'usuario' (dominio). Verifique RUT y comuna."}, status=status.HTTP_202_ACCEPTED)

	# Responder con el mismo formato que /api/auth/me/
	return me(request)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def apply_professional(request):
	"""Cliente solicita crear perfil profesional inicial con primer servicio.
	Crea registros en perfil_profesional y servicio_profesional con estado 'pendiente'.
	Requiere que el usuario exista en dominio.usuario con RUT y comuna.
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
		return Response({"detail": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

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
		return Response({"detail": "Faltan campos requeridos"}, status=status.HTTP_400_BAD_REQUEST)
	if duration_type not in {"fixed", "range"}:
		return Response({"detail": "duration_type inválido"}, status=status.HTTP_400_BAD_REQUEST)
	# Validación de duración según tipo
	if duration_type == 'fixed':
		if fixed_duration is None or fixed_duration <= 0:
			return Response({"detail": "Duración fija inválida"}, status=status.HTTP_400_BAD_REQUEST)
	else:
		if (min_duration is None or max_duration is None or min_duration <= 0 or max_duration <= 0 or min_duration > max_duration):
			return Response({"detail": "Rango de duración inválido"}, status=status.HTTP_400_BAD_REQUEST)

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
		return Response({"detail": "Categoría no encontrada"}, status=status.HTTP_400_BAD_REQUEST)
	id_cat = row[0]

	now = timezone.now()
	with transaction.atomic():
		id_perfil = uuid.uuid4()
		id_serv = uuid.uuid4()
		# Determinar si es el primer servicio del usuario
		with connection.cursor() as cur:
			cur.execute("SELECT COUNT(*) FROM servicio_profesional WHERE rut_usuario=%s", [dom.rut])
			cnt_row = cur.fetchone()
		es_primer = (cnt_row[0] == 0) if cnt_row else True
		# Insert perfil_profesional si no existe para el rut
		try:
			PerfilProfesional.objects.get(rut_usuario=dom.rut)
			# Ya tiene perfil -> solo agregar servicio adicional en pendiente
			perfil_id = None
			with connection.cursor() as cur:
				cur.execute("SELECT id_perfil_profesional FROM perfil_profesional WHERE rut_usuario=%s LIMIT 1", [dom.rut])
				r = cur.fetchone()
				perfil_id = r[0] if r else None
		except PerfilProfesional.DoesNotExist:
			try:
				with connection.cursor() as cur:
					cur.execute(
						"""
						INSERT INTO perfil_profesional (
							id_perfil_profesional, rut_usuario, descripcion_general,
							estado_verificacion_general, creado_en, actualizado_en
						) VALUES (%s,%s,%s,'pendiente',%s,%s)
						""",
						[str(id_perfil), dom.rut, general_desc, now, now],
					)
			except IntegrityError as ie:
				transaction.set_rollback(True)
				return Response({"detail": "No se pudo crear el perfil profesional (integridad)", "error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)
			perfil_id = id_perfil

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
						estado_verificacion, es_primer_servicio, creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s,%s)
					""",
					[
						str(id_serv), dom.rut, str(id_cat), str(int(exp_int)), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						es_primer, now, now,
					],
				)
		except IntegrityError as ie:
			transaction.set_rollback(True)
			return Response({"detail": "No se pudo crear el servicio (integridad)", "error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)

		# Manejo de archivos (multipart)
		# Certificado de antecedentes (obligatorio en primer servicio)
		cert_file = request.FILES.get('certificate')
		exp_files = request.FILES.getlist('experience_docs') if hasattr(request, 'FILES') else []

		# Validaciones simples de archivos
		max_bytes = 5 * 1024 * 1024
		if cert_file and cert_file.size > max_bytes:
			return Response({"detail": "Certificado supera 5MB"}, status=status.HTTP_400_BAD_REQUEST)
		for ef in exp_files:
			if ef.size > max_bytes:
				return Response({"detail": "Un archivo de experiencia supera 5MB"}, status=status.HTTP_400_BAD_REQUEST)
		# Requerir al menos un documento de experiencia para el envío
		if not exp_files or len(exp_files) == 0:
			return Response({"detail": "Debes adjuntar al menos un documento de experiencia"}, status=status.HTTP_400_BAD_REQUEST)

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

		# Lee la lista de valores permitidos para tipo_documento desde el check constraint
		def _get_tipo_documento_allowed() -> List[str]:
			try:
				with connection.cursor() as cur:
					cur.execute(
						"""
						SELECT pg_get_constraintdef(c.oid)
						FROM pg_constraint c
						JOIN pg_class t ON c.conrelid = t.oid
						JOIN pg_namespace n ON n.oid = t.relnamespace
						WHERE t.relname='documento_profesional' AND c.contype='c' AND c.conname ILIKE '%tipo_documento%'
						"""
					)
					row = cur.fetchone()
			except Exception:
				row = None
			if not row or not row[0]:
				# Fallback conservador: permitir varios alias comunes
				return [
					'certificado_antecedentes', 'certificado', 'antecedentes',
					'experiencia_laboral', 'experiencia', 'documentacion_experiencia', 'documento_experiencia', 'anexo_experiencia'
				]
			# Ejemplo de def: CHECK ((tipo_documento = ANY (ARRAY['a'::text, 'b'::text]))) o IN ('a','b')
			text = row[0]
			vals = re.findall(r"'([^']+)'", text)
			return [v for v in vals if v]

		# Elige un valor permitido apropiado según la clave ('cert' o 'exp')
		def _pick_tipo_documento_permitido(tipo_key: str, allowed: List[str]) -> Optional[str]:
			lk = tipo_key.lower()
			if not allowed:
				return None
			cand_cert = ['certificado_antecedentes', 'certificado', 'antecedentes']
			cand_exp = ['experiencia_laboral', 'experiencia', 'documentacion_experiencia', 'documento_experiencia', 'anexo_experiencia']
			cands = cand_cert if lk.startswith('cert') else cand_exp
			# 1) Intersección con candidatos conocidos
			for c in cands:
				if c in allowed:
					return c
			# 2) Heurística por substring
			keys = ['cert', 'anteced'] if lk.startswith('cert') else ['exper', 'doc', 'anexo', 'evid']
			for a in allowed:
				al = a.lower()
				if any(k in al for k in keys):
					return a
			# 3) Fallback: primer permitido
			return allowed[0]

		# Inserta documento usando un valor permitido según constraint; devuelve intentos/allowed para depurar
		def _insert_documento(tipo_key: str, nombre_doc: str, url_doc: str) -> Tuple[bool, List[str]]:
			allowed = _get_tipo_documento_allowed()
			tdoc = _pick_tipo_documento_permitido(tipo_key, allowed)
			if not tdoc:
				return False, allowed
			sp = transaction.savepoint()
			try:
				with connection.cursor() as cur:
					cur.execute(
						"""
						INSERT INTO documento_profesional (
							id_documento_profesional, id_perfil_profesional, id_servicio_profesional,
							tipo_documento, nombre_documento, url_archivo, estado_verificacion,
							subido_en, actualizado_en
						) VALUES (%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
						""",
						[
							str(uuid.uuid4()), str(perfil_id), str(id_serv), tdoc, nombre_doc, url_doc, now, now
						],
					)
				transaction.savepoint_commit(sp)
				return True, allowed
			except IntegrityError:
				transaction.savepoint_rollback(sp)
				return False, allowed

		# Guardar certificado (obligatorio solo en primer servicio)
		# Asegurar tener id de perfil para vincular documentos
		if not perfil_id:
			with connection.cursor() as cur:
				cur.execute("SELECT id_perfil_profesional FROM perfil_profesional WHERE rut_usuario=%s LIMIT 1", [dom.rut])
				r = cur.fetchone()
				perfil_id = r[0] if r else None
		if not perfil_id:
			transaction.set_rollback(True)
			return Response({"detail": "No se encontró el perfil profesional para adjuntar documentos"}, status=status.HTTP_400_BAD_REQUEST)

		# Guardar certificado (obligatorio solo en primer servicio)
		if es_primer:
			if cert_file:
				url = _save_uploaded(cert_file, 'certificados')
				ok, cand = _insert_documento('cert', cert_file.name, url)
				if not ok:
					transaction.set_rollback(True)
					return Response({"detail": "No se pudo registrar el certificado (tipo_documento no permitido)", "intentos": cand}, status=status.HTTP_400_BAD_REQUEST)
				saved_docs.append(url)
			else:
				return Response({"detail": "Certificado de antecedentes es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

		# Guardar documentos de experiencia
		for ef in exp_files:
			url = _save_uploaded(ef, 'experiencia')
			ok, cand = _insert_documento('exp', ef.name, url)
			if not ok:
				transaction.set_rollback(True)
				return Response({"detail": "No se pudo registrar un documento de experiencia (tipo_documento no permitido)", "intentos": cand}, status=status.HTTP_400_BAD_REQUEST)
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
		return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	# 1) Traer servicios pendientes con info de usuario, comuna y región
	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT sp.id_servicio_profesional, sp.rut_usuario, cs.nombre AS categoria,
				   sp.descripcion, sp.anos_experiencia, sp.es_primer_servicio, sp.creado_en,
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
				SELECT id_documento_profesional, id_servicio_profesional, tipo_documento, nombre_documento,
					   url_archivo, subido_en
				FROM documento_profesional
				WHERE id_servicio_profesional IN ({placeholders})
				ORDER BY subido_en DESC
				""",
				params,
			)
			for d in cur.fetchall():
				# Normalizar URL absoluta para previsualización en el frontend
				raw_url = d[4] or ""
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
					"nombre_documento": d[3],
					"url_archivo": abs_url,
					"subido_en": d[5].isoformat() if d[5] else None,
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
		return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	action = (request.data.get('action') or '').strip().lower()
	reason = (request.data.get('reason') or '').strip()
	if action not in {"approve", "reject"}:
		return Response({"detail": "Acción inválida"}, status=status.HTTP_400_BAD_REQUEST)

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
					"SELECT rut_usuario, es_primer_servicio FROM servicio_profesional WHERE id_servicio_profesional=%s",
					[servicio_id],
				)
				rut_u, es_primero = cur.fetchone()
				# Actualizar rol si no es ya profesional/administrador/verificador
				cur.execute("SELECT rol FROM usuario WHERE rut=%s", [rut_u])
				rol_row = cur.fetchone()
				if rol_row:
					rol_actual = (rol_row[0] or '').lower()
					if rol_actual not in ('profesional', 'administrador', 'verificador'):
						cur.execute("UPDATE usuario SET rol='profesional', actualizado_en=%s WHERE rut=%s", [now, rut_u])
				# Si es primer servicio, aprobar el estado general del perfil
				if es_primero:
					cur.execute("UPDATE perfil_profesional SET estado_verificacion_general='aprobado', verificado_en=%s WHERE rut_usuario=%s", [now, rut_u])
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
		return Response({"detail": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT rut_usuario FROM servicio_profesional WHERE id_servicio_profesional=%s
			""",
			[service_id],
		)
		row = cur.fetchone()
	if not row:
		return Response({"detail": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
	if str(row[0]) != dom.rut:
		return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	# Get or create schedule container
	schedule, _ = ServiceSchedule.objects.get_or_create(service_id=service_id, defaults={
		'weekly_template': {}
	})

	if request.method == 'GET':
		unav = [
			{
				'id': u.id,
				'start_date': u.start_date.isoformat(),
				'end_date': u.end_date.isoformat(),
				'reason': u.reason,
			}
			for u in schedule.unavailabilities.all().order_by('start_date', 'end_date', 'id')
		]
		periods = [
			{
				'id': p.id,
				'name': p.name,
				'start_date': p.start_date.isoformat(),
				'end_date': p.end_date.isoformat(),
				'weekly_template': p.weekly_template or {},
			}
			for p in schedule.custom_periods.all().order_by('start_date', 'end_date', 'id')
		]
		return Response({
			'weekly_template': schedule.weekly_template or {},
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
				return Response({"detail": f"weekly_template[{day}] inválido"}, status=status.HTTP_400_BAD_REQUEST)
			enabled = conf.get('enabled')
			slots = conf.get('timeSlots', [])
			if enabled and slots:
				for i, sl in enumerate(slots):
					st = (sl or {}).get('start')
					en = (sl or {}).get('end')
					if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
						return Response({"detail": f"Horario inválido en {day} índice {i}"}, status=status.HTTP_400_BAD_REQUEST)

	# Persist in a transaction (replace-all semantics for subcollections)
	with transaction.atomic():
		schedule.weekly_template = weekly_template or {}
		schedule.save(update_fields=['weekly_template', 'updated_at'])

		# Replace unavailabilities
		schedule.unavailabilities.all().delete()
		to_create_u = []
		for item in unavailabilities:
			try:
				sd = datetime.fromisoformat(item.get('start_date', '')).date()
				ed = datetime.fromisoformat(item.get('end_date', '')).date()
			except Exception:
				return Response({"detail": "Fecha inválida en unavailabilities"}, status=status.HTTP_400_BAD_REQUEST)
			if ed < sd:
				return Response({"detail": "Rango de fechas inválido en unavailability"}, status=status.HTTP_400_BAD_REQUEST)
			to_create_u.append(ServiceUnavailability(schedule=schedule, start_date=sd, end_date=ed, reason=(item.get('reason') or '')[:255]))
		if to_create_u:
			ServiceUnavailability.objects.bulk_create(to_create_u)

		# Replace custom periods
		schedule.custom_periods.all().delete()
		to_create_p = []
		for item in custom_periods:
			try:
				sd = datetime.fromisoformat(item.get('start_date', '')).date()
				ed = datetime.fromisoformat(item.get('end_date', '')).date()
			except Exception:
				return Response({"detail": "Fecha inválida en custom_periods"}, status=status.HTTP_400_BAD_REQUEST)
			if ed < sd:
				return Response({"detail": "Rango de fechas inválido en custom_periods"}, status=status.HTTP_400_BAD_REQUEST)
			wt = item.get('weekly_template') or {}
			# quick validate times
			for day, conf in (wt.items() if isinstance(wt, dict) else []):
				enabled = (conf or {}).get('enabled')
				if enabled:
					for i, sl in enumerate((conf or {}).get('timeSlots', []) or []):
						st = (sl or {}).get('start')
						en = (sl or {}).get('end')
						if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
							return Response({"detail": f"Horario inválido en período personalizado {day} índice {i}"}, status=status.HTTP_400_BAD_REQUEST)
			to_create_p.append(ServiceCustomPeriod(
				schedule=schedule,
				name=(item.get('name') or '')[:100],
				start_date=sd,
				end_date=ed,
				weekly_template=wt,
			))
		if to_create_p:
			ServiceCustomPeriod.objects.bulk_create(to_create_p)

	return Response({"ok": True})


@api_view(["POST"])
def reset_admin(request):
	"""DEBUG-only endpoint to ensure the admin exists with known credentials."""
	if not settings.DEBUG:
		return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
	email = (request.data.get("email") or "admin@servihogar.cl").strip().lower()
	password = request.data.get("password") or "Admin2025!ServiHogar"
	if not email:
		return Response({"detail": "email requerido"}, status=status.HTTP_400_BAD_REQUEST)
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
		return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
	email = (request.data.get("email") or "verificador@servihogar.cl").strip().lower()
	password = request.data.get("password") or "Verifier2025!ServiHogar"
	if not email:
		return Response({"detail": "email requerido"}, status=status.HTTP_400_BAD_REQUEST)

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

		# Filtrar por visibilidad (ServiceVisibility.is_active)
		try:
			vis = ServiceVisibility.objects.filter(service_id=str(sid)).first()
			if vis and not vis.is_active:
				continue
		except Exception:
			pass

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
		return Response({"detail": "Usuario sin registro principal en 'usuario'"}, status=status.HTTP_400_BAD_REQUEST)

	# Coerce to str for comparisons and model PK
	service_id_str = str(service_id)
	try:
		with connection.cursor() as cur:
			cur.execute("SELECT rut_usuario FROM servicio_profesional WHERE id_servicio_profesional = %s::uuid", [service_id_str])
			row = cur.fetchone()
	except Exception as e:
		return Response({"detail": "Error consultando el servicio", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	if not row:
		return Response({"detail": "Servicio no encontrado"}, status=status.HTTP_404_NOT_FOUND)
	if str(row[0]) != dom.rut:
		return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

	try:
		raw = request.data.get('is_active')
		if isinstance(raw, bool):
			is_active = raw
		else:
			val = str(raw).strip().lower()
			is_active = val in {"1", "true", "t", "yes", "y", "on"}
		obj, _ = ServiceVisibility.objects.get_or_create(service_id=service_id_str)
		obj.is_active = is_active
		obj.save(update_fields=['is_active', 'updated_at'])
	except Exception as e:
		# Intento de autocorrección: crear la tabla si no existe y reintentar una vez
		msg = str(e)
		if 'relation' in msg and 'api_service_visibility' in msg and 'does not exist' in msg:
			try:
				with connection.cursor() as cur:
					cur.execute(
						"""
						CREATE TABLE IF NOT EXISTS api_service_visibility (
							service_id uuid PRIMARY KEY,
							is_active boolean NOT NULL DEFAULT TRUE,
							updated_at timestamp with time zone NOT NULL DEFAULT NOW()
						)
						"""
					)
				# reintentar guardado
				obj, _ = ServiceVisibility.objects.get_or_create(service_id=service_id_str)
				raw2 = request.data.get('is_active')
				if isinstance(raw2, bool):
					is_active2 = raw2
				else:
					val2 = str(raw2).strip().lower()
					is_active2 = val2 in {"1", "true", "t", "yes", "y", "on"}
				obj.is_active = is_active2
				obj.save(update_fields=['is_active', 'updated_at'])
			except Exception as e2:
				return Response({"detail": "Error guardando visibilidad (post-create)", "error": str(e2)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
		else:
			return Response({"detail": "Error guardando visibilidad", "error": msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	return Response({"ok": True, "service_id": service_id, "is_active": obj.is_active})
