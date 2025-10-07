from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions, serializers as drf_serializers
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile, UsuarioDominio
from django.conf import settings
from django.db import connection, transaction, IntegrityError
from django.utils import timezone


def _normalize_genero(value: str | None) -> str | None:
	if not value:
		return None
	v = value.strip().lower()
	allowed = {"masculino", "femenino", "otro", "prefiero-no-decir"}
	return v if v in allowed else None


def _resolve_region_comuna(cur, region_name: str | None, comuna_name: str | None):
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


def _upsert_usuario_dominio(*, first_name: str, last_name: str, rut: str | None, email: str, password_hash: str,
							phone: str | None, address: str | None, gender: str | None, birth_date, role: str | None,
							region_name: str | None, comuna_name: str | None):
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

	# Si no hay RUT válido, falla para que el registro no continúe (usuario quiere persistencia principal en `usuario`)
	if not rut:
		return False

	# Intentar UPSERT vía ORM sobre el modelo no gestionado
	with transaction.atomic():
		# Best-effort: resolver region/comuna IDs usando SQL directo (ORM no conoce esas tablas)
		with connection.cursor() as cur:
			id_region, id_comuna = _resolve_region_comuna(cur, region_name, comuna_name)

		try:
			obj, created = UsuarioDominio.objects.get_or_create(
				email=email,
				defaults={
					"nombres": nombres,
					"apellidos": apellidos,
					"rut": rut,
					"hash_contrasena": password_hash,
					"telefono": telefono,
					"direccion": direccion,
					"genero": genero,
					"fecha_nacimiento": birth_date,
					"id_region": id_region,
					"id_comuna": id_comuna,
					"rol": rol,
					"email_verificado": False,
					"perfil_publico": True,
					"creado_en": timezone.now(),
					"actualizado_en": timezone.now(),
				},
			)
			if not created:
				# Update minimal fields; don't overwrite password hash unless explicitly desired
				obj.nombres = nombres or obj.nombres
				obj.apellidos = apellidos or obj.apellidos
				obj.rut = rut or obj.rut
				obj.telefono = telefono or obj.telefono
				obj.direccion = direccion or obj.direccion
				obj.genero = genero or obj.genero
				obj.fecha_nacimiento = birth_date or obj.fecha_nacimiento
				obj.id_region = id_region or obj.id_region
				obj.id_comuna = id_comuna or obj.id_comuna
				obj.rol = rol or obj.rol
				obj.actualizado_en = timezone.now()
				obj.save(update_fields=[
					"nombres", "apellidos", "rut", "telefono", "direccion",
					"genero", "fecha_nacimiento", "id_region", "id_comuna",
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
				obj.id_region = id_region or obj.id_region
				obj.id_comuna = id_comuna or obj.id_comuna
				obj.rol = rol or obj.rol
				obj.actualizado_en = timezone.now()
				obj.save(update_fields=[
					"email", "nombres", "apellidos", "telefono", "direccion",
					"genero", "fecha_nacimiento", "id_region", "id_comuna",
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


@api_view(["POST"])
def register(request):
	serializer = RegisterSerializer(data=request.data)
	if serializer.is_valid():
		with transaction.atomic():
			user = serializer.save()
			# Insertar/actualizar en la tabla dominio `usuario` (obligatorio)
			profile = getattr(user, 'profile', None)
			ok = _upsert_usuario_dominio(
				first_name=user.first_name,
				last_name=user.last_name,
				rut=getattr(profile, 'rut', None),
				email=user.email,
				password_hash=user.password,  # hash Django (pbkdf2_sha256)
				phone=getattr(profile, 'phone', None),
				address=getattr(profile, 'address', None),
				gender=getattr(profile, 'gender', None),
				birth_date=getattr(profile, 'birth_date', None),
				role=getattr(profile, 'role', 'cliente'),
				region_name=getattr(profile, 'region', None),
				comuna_name=getattr(profile, 'district', None),
			)
			if not ok:
				# Revertir creación del usuario Django si no se pudo persistir en dominio
				raise drf_serializers.ValidationError({"usuario": ["No se pudo guardar en la tabla principal 'usuario'. Verifique RUT y datos de región/comuna."]})
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
		dom = UsuarioDominio.objects.get(email=request.user.email)
		data["dominio"] = {
			"nombres": dom.nombres,
			"apellidos": dom.apellidos,
			"rut": dom.rut,
			"email": dom.email,
			"telefono": dom.telefono,
			"direccion": dom.direccion,
			"genero": dom.genero,
			"fecha_nacimiento": dom.fecha_nacimiento.isoformat() if dom.fecha_nacimiento else None,
			"id_region": dom.id_region,
			"id_comuna": dom.id_comuna,
			"rol": dom.rol,
			"email_verificado": dom.email_verificado,
			"perfil_publico": dom.perfil_publico,
		}
	except UsuarioDominio.DoesNotExist:
		data["dominio"] = None
	return Response(data)


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
