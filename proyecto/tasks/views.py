from django.shortcuts import render

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from firebase_admin import credentials, auth
import firebase_admin


cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred)

def home_view(request):
    return render(request, 'home.html')

def registro_view(request):
    return render(request, 'signup.html')

@csrf_exempt  #
def crear_usuario(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        id_token = request.headers.get('Authorization', '').split('Bearer ')[-1]

        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']

        nombre = data.get('nombre')
        correo = data.get('correo')
        tipo = data.get('tipo')

        # guardado en el modelo Django (User, Cliente, Trabajador, etc.)
        print(f'✅ Usuario verificado con UID: {uid}, correo: {correo}, tipo: {tipo}')

        return JsonResponse({'mensaje': 'Usuario creado correctamente'})
    except Exception as e:
        print(f'❌ Error: {e}')
        return JsonResponse({'error': str(e)}, status=400)

def limpieza_view(request):
    return render(request, 'limpieza.html')

def categorias_view(request):
    return render(request, 'categorias.html')

def maestros_view(request):
    return render(request, 'maestros.html')

def login_view(request):
    return render(request, 'login.html')