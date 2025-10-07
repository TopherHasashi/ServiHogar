from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "rut",
            "gender",
            "birth_date",
            "phone",
            "region",
            "district",
            "address",
            "role",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    effective_role = serializers.SerializerMethodField()

    def get_effective_role(self, obj: User):
        # Map Django flags to admin; otherwise use profile.role; default to cliente
        if obj.is_superuser or obj.is_staff:
            return 'administrador'
        role = getattr(getattr(obj, 'profile', None), 'role', None)
        return role or 'cliente'

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile",
            "is_staff",
            "is_superuser",
            "effective_role",
        ]


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    # Profile fields (required to satisfy domain table constraints)
    phone = serializers.CharField(required=True, allow_blank=False, max_length=32)
    rut = serializers.CharField(required=True, allow_blank=False, max_length=20)
    gender = serializers.CharField(required=True, allow_blank=False, max_length=32)
    birth_date = serializers.DateField(required=True)
    region = serializers.CharField(required=True, allow_blank=False, max_length=100)
    district = serializers.CharField(required=True, allow_blank=False, max_length=100)
    address = serializers.CharField(required=True, allow_blank=False, max_length=255)
    role = serializers.ChoiceField(choices=[("cliente", "Cliente"), ("profesional", "Profesional")], required=False)

    def validate_email(self, value):
        if User.objects.filter(username=value).exists() or User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email")
        return value

    def validate_rut(self, value):
        v = (value or '').strip()
        if not v:
            raise serializers.ValidationError("RUT es requerido")
        # Validación simple de formato chileno con guión verificador (no calculamos dígito aquí)
        # Acepta con o sin puntos: 12.345.678-9 o 12345678-9
        import re
        pattern = re.compile(r"^(\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk])$")
        if not pattern.match(v):
            raise serializers.ValidationError("Formato de RUT inválido (ej: 12.345.678-9)")
        return v

    def create(self, validated_data):
        # Pop profile fields
        phone = validated_data.pop("phone", "")
        rut = validated_data.pop("rut", "")
        gender = validated_data.pop("gender", "")
        birth_date = validated_data.pop("birth_date", None)
        region = validated_data.pop("region", "")
        district = validated_data.pop("district", "")
        address = validated_data.pop("address", "")
        role = validated_data.pop("role", "cliente")

        email = validated_data["email"].lower().strip()
        password = validated_data["password"]
        first_name = validated_data.get("first_name", "").strip()
        last_name = validated_data.get("last_name", "").strip()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        # Use get_or_create to avoid duplicate profile when post_save signal already created one
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.rut = rut
        profile.gender = gender
        profile.birth_date = birth_date
        profile.region = region
        profile.district = district
        profile.address = address
        profile.role = role or "cliente"
        profile.save()
        return user
