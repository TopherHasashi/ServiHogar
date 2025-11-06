# Integración con Mercado Pago - ServiHogar

## Configuración

### 1. Obtener credenciales de Mercado Pago

1. Accede al [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.cl/developers/panel/app)
2. Crea una aplicación o selecciona una existente
3. Ve a la sección "Credenciales"
4. Copia tu **Access Token de Prueba** (TEST) o **Producción** según tu entorno

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto backend basado en `.env.example`:

```bash
# Credenciales de Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-XXXXXX-XXXXXXXXXXXXXXXXXXXXXX

# URL del frontend para redirecciones
FRONTEND_URL=http://localhost:5173
```

### 3. Instalar dependencias

```bash
# Backend
cd Proyecto
pip install -r requirements.txt

# O si usas Docker
docker-compose build web
```

## Flujo de Pago

### 1. Cliente solicita un servicio
- El cliente encuentra un profesional y hace una reserva
- El profesional **confirma** la solicitud
- La solicitud pasa a estado "Confirmado"

### 2. Cliente paga el servicio
- En "Mis Solicitudes", el cliente ve el botón "Pagar" en servicios confirmados
- Al hacer clic, se crea una preferencia de pago en Mercado Pago
- El cliente es redirigido al Checkout Pro de Mercado Pago
- Completa el pago usando tarjetas de prueba (ver abajo)

### 3. Procesamiento del pago
- Mercado Pago notifica a ServiHogar mediante webhook
- El estado del pago se actualiza en la base de datos
- Se calcula automáticamente la comisión (5%) y el monto para el profesional

### 4. Confirmación
- El cliente es redirigido a una página de éxito/error/pendiente
- Puede ver el estado del pago en "Mis Solicitudes"
- El profesional puede proceder a realizar el servicio

## Endpoints API

### Crear preferencia de pago
```http
POST /api/payments/create/{request_id}/
Authorization: Bearer {access_token}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "preference_id": "123456789-abc123-def456",
  "init_point": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=..."
}
```

### Consultar estado de pago
```http
GET /api/payments/status/{request_id}/
Authorization: Bearer {access_token}
```

**Respuesta:**
```json
{
  "has_payment": true,
  "payment_status": "aprobado",
  "payment_id": "1234567890",
  "payment_method": "visa",
  "amount": 25000,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Webhook (IPN)
```http
POST /api/payments/webhook/
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

Este endpoint es llamado automáticamente por Mercado Pago cuando hay cambios en el pago.

## Usuarios y Tarjetas de Prueba

### Usuarios de prueba en Chile

Para probar pagos, usa estas tarjetas de prueba de Mercado Pago:

| Tarjeta | Número | CVV | Fecha Exp |
|---------|--------|-----|-----------|
| Mastercard | 5416 7526 0258 2580 | 123 | 11/25 |
| Visa | 4509 9535 6623 3704 | 123 | 11/25 |
| American Express | 3711 803032 57522 | 1234 | 11/25 |

**Datos del titular:**
- Nombre: APRO (para aprobar) o OTRWALLET (para rechazar)
- DNI/RUT: 12345678-9
- Email: test_user_12345678@testuser.com

### Estados de pago simulados

Puedes simular diferentes estados según el nombre en la tarjeta:

- **APRO** → Pago aprobado
- **OTRWALLET** → Pago rechazado (fondos insuficientes)
- **CONT** → Pago pendiente (requiere contingencia)
- **CALL** → Pago rechazado (llamar para autorizar)
- **FUND** → Pago rechazado (fondos insuficientes)
- **SECU** → Pago rechazado (código de seguridad inválido)
- **EXPI** → Pago rechazado (tarjeta expirada)
- **FORM** → Pago rechazado (error de formulario)

## Comisiones y Distribución

El sistema calcula automáticamente:

- **Cliente paga:** $25.000
- **Comisión ServiHogar (5%):** $1.250
- **Profesional recibe:** $23.750

Esto se guarda en la tabla `pago`:
- `monto`: 25000
- `comision_plataforma`: 1250
- `monto_profesional`: 23750

## Testing Local

### 1. Iniciar servicios

```bash
# Iniciar Docker
docker-compose up -d

# O desarrollo local
python manage.py runserver
```

### 2. Probar flujo completo

1. Registra un usuario cliente
2. Registra un usuario profesional y espera aprobación
3. Como cliente, busca el servicio y haz una reserva
4. Como profesional, confirma la reserva
5. Como cliente, ve a "Mis Solicitudes" y haz clic en "Pagar"
6. Usa una tarjeta de prueba con nombre "APRO"
7. Completa el pago en Mercado Pago
8. Serás redirigido a la página de éxito
9. Verifica que el estado del pago se actualizó

### 3. Verificar webhooks localmente

Para recibir webhooks en desarrollo local, usa [ngrok](https://ngrok.com/):

```bash
ngrok http 8000
```

Luego actualiza la URL de notificación en tu aplicación de Mercado Pago con:
```
https://tu-dominio-ngrok.ngrok.io/api/payments/webhook/
```

## Producción

### Configuración

1. Obtén tu **Access Token de Producción** desde el panel de Mercado Pago
2. Actualiza `.env` con el token de producción
3. Configura `FRONTEND_URL` con tu dominio real
4. Asegúrate de que tu servidor esté accesible públicamente para recibir webhooks
5. Actualiza la URL de webhook en tu aplicación de Mercado Pago

### URLs de webhook

Configura en tu aplicación de Mercado Pago:
```
https://tu-dominio.com/api/payments/webhook/
```

### Consideraciones de seguridad

- ✅ El webhook valida que las notificaciones vengan de Mercado Pago
- ✅ Los pagos se verifican consultando la API de MP antes de actualizar
- ✅ Solo el cliente dueño puede crear preferencias de pago
- ✅ Los estados se sincronizan automáticamente vía webhook

## Troubleshooting

### Error: "MERCADOPAGO_ACCESS_TOKEN no configurado"
- Verifica que `.env` exista y tenga la variable configurada
- Reinicia el servidor Django después de agregar la variable

### Webhook no se recibe
- En desarrollo, usa ngrok para exponer tu servidor local
- Verifica que la URL del webhook esté configurada en Mercado Pago
- Revisa los logs del servidor Django para ver si llegó la notificación

### Pago queda en "pendiente"
- Algunos métodos de pago (ej. Khipu, transferencia) toman tiempo
- El webhook actualizará el estado cuando MP lo confirme
- El cliente puede refrescar el estado con el botón "Actualizar"

### Error al crear preferencia
- Verifica que el token de acceso sea válido
- Revisa que la solicitud esté en estado "confirmado"
- Comprueba los logs del backend para más detalles

## Recursos

- [Documentación Mercado Pago](https://www.mercadopago.cl/developers)
- [Checkout Pro](https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing)
- [Webhooks/IPN](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications)
- [Tarjetas de prueba](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/test-cards)
