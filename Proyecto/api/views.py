from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(["GET"])
def ping(request):
	return Response({"status": "ok"})


@api_view(["POST"])
def register(request):
	serializer = RegisterSerializer(data=request.data)
	if serializer.is_valid():
		user = serializer.save()
		# Issue tokens on register for convenience
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
	return Response(UserSerializer(request.user).data)
