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
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="cliente")
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"Perfil de {self.user.username}"


class UsuarioDominio(models.Model):
	"""Modelo mapeado a la tabla existente `usuario` del dominio (no gestionada por Django)."""
	# En la BD parece ser UUID (según logs), mapeamos como UUIDField para evitar discrepancias
	id_usuario = models.UUIDField(primary_key=True, editable=False)
	nombres = models.CharField(max_length=255)
	apellidos = models.CharField(max_length=255)
	rut = models.CharField(max_length=20, unique=True)
	email = models.EmailField(unique=True)
	hash_contrasena = models.CharField(max_length=255)
	telefono = models.CharField(max_length=50, blank=True)
	direccion = models.CharField(max_length=255, blank=True)
	genero = models.CharField(max_length=32, null=True, blank=True)
	fecha_nacimiento = models.DateField(null=True, blank=True)
	id_region = models.IntegerField(null=True, blank=True)
	id_comuna = models.IntegerField(null=True, blank=True)
	rol = models.CharField(max_length=20, default="cliente")
	email_verificado = models.BooleanField(default=False)
	perfil_publico = models.BooleanField(default=True)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "usuario"

	def __str__(self) -> str:
		return f"UsuarioDominio<{self.email}>"
