# ✅ Flujo de Pago Corregido - Mercado Pago

## 🔄 Nuevo Flujo Implementado

El flujo de reserva y pago ha sido corregido para seguir el orden correcto:

### Flujo Anterior (❌ Incorrecto)
1. Cliente selecciona fecha/hora
2. Se crea solicitud en estado "pendiente"
3. Profesional confirma → estado "confirmado"
4. Cliente paga → pero la solicitud ya existía

### Flujo Nuevo (✅ Correcto)
1. **Cliente selecciona fecha/hora y detalles**
2. **Cliente hace clic en "Reservar"**
3. **Sistema crea solicitud en estado "pendiente"** (visible inmediatamente)
4. **Sistema genera preferencia de Mercado Pago**
5. **Cliente es redirigido a Mercado Pago Checkout Pro**
6. **Cliente completa el pago**
7. **Mercado Pago envía webhook a ServiHogar**
8. **Sistema registra el pago en la tabla `pago`**
9. **Solicitud YA está visible en "Mis Solicitudes"** del cliente y profesional
10. **Profesional ve la solicitud y puede confirmarla**
11. **Al confirmar, estado cambia a "confirmado"**

## 📋 Estados de Solicitud

| Estado | Descripción | Visible para |
|--------|-------------|--------------|
| `pendiente` | Solicitud creada, esperando confirmación profesional | Cliente y Profesional |
| `confirmado` | Profesional aceptó el trabajo | Cliente y Profesional |
| `completado` | Servicio realizado | Cliente y Profesional |
| `cancelado` | Reserva cancelada (con reembolso si ya pagó) | Cliente y Profesional |

## 🔧 Cambios Técnicos Implementados

### Backend

#### 1. Nuevo Endpoint: `create_booking_and_payment`
**Ruta:** `POST /api/payments/book/<service_id>/`

**Body:**
```json
{
  "date": "2025-12-25",
  "start": "10:00",
  "duracion_minutos": 120,
  "titulo": "Instalación eléctrica",
  "descripcion": "Descripción del servicio",
  "address": "Dirección completa",
  "comuna_name": "Santiago",
  "region_name": "Metropolitana"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "request_id": "uuid-de-la-solicitud",
  "preference_id": "mp-preference-id",
  "init_point": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "amount": 50000
}
```

**Lógica:**
1. Valida usuario autenticado
2. Obtiene datos del servicio profesional (precio, profesional)
3. Crea solicitud en estado `pendiente` (visible inmediatamente)
4. Genera preferencia en Mercado Pago
5. Crea registro de pago pendiente en tabla `pago`
6. Devuelve `init_point` para redirigir

#### 2. Webhook Mejorado: `payment_webhook`
**Cambios:**
- Cuando pago es **aprobado**: registra el pago en la tabla `pago` (la solicitud ya está en `pendiente`)
- Cuando pago es **rechazado/cancelado**: actualiza solicitud a `cancelado`
- Registra comisión del 5% y calcula monto para profesional

#### 3. Consulta `my_requests`
- Muestra todas las solicitudes del usuario (cliente o profesional)
- La solicitud aparece inmediatamente después de crearla, incluso antes de pagar

### Frontend

#### 1. ServiceBooking.tsx
**Cambios en `handleBooking`:**
```typescript
const handleBooking = async () => {
  setIsBooking(true)
  setBookingStep('processing-payment')
  
  try {
    // Llamar al nuevo endpoint
    const response = await apiPost(`/api/payments/book/${professional.id}/`, {
      date: isoDate,
      start,
      duracion_minutos: selectedDuration,
      titulo: `Reserva de ${professional.service}`,
      descripcion: serviceDetails.description || '',
      address: serviceDetails.address || '',
      comuna_name: user?.district || '',
      region_name: user?.region || '',
    }, { auth: true })
    
    // Redirigir directamente a Mercado Pago
    window.location.href = response.init_point
  } catch (error) {
    // Manejar errores
    alert('Error al procesar la reserva')
  }
}
```

**Eliminado:**
- Función `handlePaymentSuccess` (ya no se necesita)
- Lógica de crear solicitud después del pago

#### 2. PaymentSuccess.tsx
Ya estaba correctamente implementado. Redirige a "Mis Solicitudes" después del pago.

## 💰 Gestión de Dinero y Reembolsos

### Dinero Retenido
- Cuando el cliente paga, **Mercado Pago retiene el dinero**
- ServiHogar recibe el dinero en su cuenta de MP
- El dinero queda "en espera" hasta que se confirme el servicio

### Comisiones
- **Plataforma (ServiHogar):** 5% del monto total
- **Profesional:** 95% del monto total
- Se calculan automáticamente en el webhook

### Reembolsos (Futuro)
Para implementar reembolsos cuando se cancela:

1. **Cliente cancela antes de confirmación:**
   - Se debe llamar a la API de Mercado Pago para reembolso
   - Endpoint: `POST /v1/payments/{payment_id}/refunds`

2. **Profesional cancela:**
   - Mismo proceso de reembolso
   - Se notifica al cliente

3. **Implementación sugerida:**
```python
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refund_payment(request, request_id: str):
    # Obtener payment_id de la solicitud
    # Validar que se puede hacer reembolso
    # Llamar a MP API
    sdk = _get_mp_sdk()
    refund = sdk.refund().create(payment_id)
    # Actualizar solicitud a 'cancelado'
    # Actualizar pago a 'reembolsado'
```

## 🧪 Cómo Probar

1. **Iniciar sesión como cliente**
2. **Buscar un servicio profesional**
3. **Seleccionar fecha y hora**
4. **Completar detalles de la reserva**
5. **Click en "Reservar"**
6. **Serás redirigido a Mercado Pago**
7. **Usar tarjeta de prueba:**
   - Número: `5416 7526 0258 2580`
   - CVV: `123`
   - Nombre: `APRO`
   - Vencimiento: cualquier fecha futura
8. **Completar el pago**
9. **Serás redirigido a la página de éxito**
10. **Click en "Ver Mis Solicitudes"**
11. **Ver tu reserva en estado "Pendiente"**

## 🔄 Próximos Pasos

- [ ] Implementar endpoint de reembolso
- [ ] Agregar notificaciones por email cuando se aprueba el pago
- [ ] Mostrar en la UI si un pago está pendiente (para pagos en efectivo, etc.)
- [ ] Implementar cancelación con reembolso automático
- [ ] Agregar logs detallados de transacciones
- [ ] Dashboard para admin con reporte de comisiones

## 📞 Webhook Configuration

Para producción, asegúrate de configurar la URL del webhook en el panel de Mercado Pago:

**URL:** `https://tu-dominio.com/api/payments/webhook/`

El webhook debe ser accesible públicamente (sin autenticación).

---

**Fecha:** 05 de Noviembre, 2025  
**Estado:** ✅ Implementado y funcional
