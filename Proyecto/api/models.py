from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
	ROLE_CHOICES = (
		("cliente", "Cliente"),
		("profesional", "Profesional"),
		("verificador", "Verificador"),
	)

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	rut = models.CharField(max_length=20, blank=True)
	gender = models.CharField(max_length=32, blank=True)
	birth_date = models.DateField(null=True, blank=True)
	phone = models.CharField(max_length=32, blank=True)
	region = models.CharField(max_length=100, blank=True)
	district = models.CharField(max_length=100, blank=True)
	address = models.CharField(max_length=255, blank=True)
	# URL pública del avatar del usuario (guardada por endpoint de subida)
	avatar_url = models.TextField(blank=True)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="cliente")
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"Perfil de {self.user.username}"


class UsuarioDominio(models.Model):
	"""Modelo no gestionado que mapea la tabla `usuario` v3.0 (RUT como PK, id_comuna UUID)."""
	# PK v3.0
	rut = models.CharField(max_length=12, primary_key=True)
	# Campos obligatorios
	nombres = models.CharField(max_length=100)
	apellidos = models.CharField(max_length=100)
	email = models.EmailField(unique=True)
	hash_contrasena = models.CharField(max_length=255)
	telefono = models.CharField(max_length=20)
	genero = models.CharField(max_length=20)
	fecha_nacimiento = models.DateField()
	id_comuna = models.UUIDField()
	direccion = models.TextField()
	rol = models.CharField(max_length=20, default="cliente")
	# Foto de perfil (URL) almacenada en la tabla principal `usuario`
	foto_perfil_url = models.TextField(null=True)
	# Opcionales/flags básicos
	email_verificado = models.BooleanField(default=False)
	telefono_verificado = models.BooleanField(default=False)
	perfil_publico = models.BooleanField(default=True)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "usuario"

	def __str__(self) -> str:
		return f"UsuarioDominio<{self.rut} - {self.email}>"


class CategoriaServicio(models.Model):
	"""Unmanaged mapping for categoria_servicio table."""
	id_categoria_servicio = models.UUIDField(primary_key=True)
	nombre = models.CharField(max_length=50)
	slug = models.CharField(max_length=50)

	class Meta:
		managed = False
		db_table = "categoria_servicio"

	def __str__(self) -> str:
		return f"CategoriaServicio<{self.slug}>"


class PerfilProfesional(models.Model):
	"""Unmanaged mapping for perfil_profesional table."""
	id_perfil_profesional = models.UUIDField(primary_key=True)
	rut_usuario = models.CharField(max_length=12)
	descripcion_general = models.TextField()
	estado_verificacion_general = models.CharField(max_length=20)
	rut_verificador = models.CharField(max_length=12, null=True)
	verificado_en = models.DateTimeField(null=True)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "perfil_profesional"

	def __str__(self) -> str:
		return f"PerfilProfesional<{self.id_perfil_profesional} - {self.rut_usuario}>"


class ServicioProfesional(models.Model):
	"""Unmanaged mapping for servicio_profesional table."""
	id_servicio_profesional = models.UUIDField(primary_key=True)
	rut_usuario = models.CharField(max_length=12)
	id_categoria_servicio = models.UUIDField()
	anos_experiencia = models.CharField(max_length=10)
	descripcion = models.TextField()
	tipo_duracion = models.CharField(max_length=10)
	duracion_fija_minutos = models.IntegerField(null=True)
	duracion_minima_minutos = models.IntegerField(null=True)
	duracion_maxima_minutos = models.IntegerField(null=True)
	precio_fijo = models.IntegerField()
	estado_verificacion = models.CharField(max_length=20)
	es_primer_servicio = models.BooleanField(default=False)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "servicio_profesional"

	def __str__(self) -> str:
		return f"ServicioProfesional<{self.id_servicio_profesional} - {self.rut_usuario}>"


class DocumentoProfesional(models.Model):
	"""Unmanaged mapping for documento_profesional table."""
	id_documento_profesional = models.UUIDField(primary_key=True)
	id_perfil_profesional = models.UUIDField()
	id_servicio_profesional = models.UUIDField(null=True)
	tipo_documento = models.CharField(max_length=30)
	nombre_documento = models.CharField(max_length=200)
	url_archivo = models.TextField()
	estado_verificacion = models.CharField(max_length=20)
	rut_verificador = models.CharField(max_length=12, null=True)
	verificado_en = models.DateTimeField(null=True)
	subido_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "documento_profesional"

	def __str__(self) -> str:
		return f"DocumentoProfesional<{self.id_documento_profesional}>"


# Managed models for schedules (stored in our app schema)
from django.contrib.postgres.fields import ArrayField

try:
	from django.db.models import JSONField  # Django 3.1+
except Exception:  # pragma: no cover
	from django.contrib.postgres.fields import JSONField  # type: ignore


class ServiceSchedule(models.Model):
	"""One schedule per servicio_profesional (by UUID).
	weekly_template stores a dict with days: { monday: {enabled, timeSlots: [{start,end}]} ... }
	"""
	service_id = models.UUIDField(primary_key=True)
	weekly_template = JSONField(default=dict)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'api_service_schedule'


class ServiceUnavailability(models.Model):
	id = models.AutoField(primary_key=True)
	schedule = models.ForeignKey(ServiceSchedule, related_name='unavailabilities', on_delete=models.CASCADE)
	start_date = models.DateField()
	end_date = models.DateField()
	reason = models.CharField(max_length=255, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'api_service_unavailability'


class ServiceCustomPeriod(models.Model):
	id = models.AutoField(primary_key=True)
	schedule = models.ForeignKey(ServiceSchedule, related_name='custom_periods', on_delete=models.CASCADE)
	name = models.CharField(max_length=100)
	start_date = models.DateField()
	end_date = models.DateField()
	weekly_template = JSONField(default=dict)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'api_service_custom_period'


class ServiceVisibility(models.Model):
	"""Visibility toggle for servicio_profesional (by UUID) to hide from public search."""
	service_id = models.UUIDField(primary_key=True)
	is_active = models.BooleanField(default=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'api_service_visibility'

	def __str__(self) -> str:
		return f"ServiceVisibility<{self.service_id} active={self.is_active}>"
