# Resumen de Integración Mercado Pago - ServiHogar

## ✅ Completado

### Backend
1. **SDK instalado**: Agregado `mercadopago==2.2.3` a `requirements.txt`
2. **Configuración**: Variables de entorno en `.env.example` y `settings.py`
3. **Endpoints creados** en `api/payments.py`:
   - `POST /api/payments/create/{request_id}/` - Crear preferencia de pago
   - `POST /api/payments/webhook/` - Recibir notificaciones de MP (IPN)
   - `GET /api/payments/status/{request_id}/` - Consultar estado del pago
4. **Rutas registradas** en `api/urls.py`
5. **Base de datos**: La tabla `pago` ya existe en el DLL con todas las columnas necesarias

### Frontend
1. **Componente PaymentButton**: Botón reutilizable para iniciar pagos
2. **Páginas de resultado**:
   - `PaymentSuccess` - Pago exitoso
   - `PaymentFailure` - Pago rechazado
   - `PaymentPending` - Pago pendiente
3. **Integración**: Botón de pago agregado en `RequestsTab` para solicitudes confirmadas
4. **Rutas**: Agregadas rutas `/payment/success`, `/payment/failure`, `/payment/pending`

### Documentación
1. **MERCADOPAGO_README.md**: Guía completa con:
   - Configuración paso a paso
   - Flujo de pago explicado
   - Endpoints API documentados
   - Usuarios y tarjetas de prueba
   - Comisiones y distribución
   - Testing local y producción
   - Troubleshooting

2. **Scripts de setup**:
   - `setup_mercadopago.sh` (Linux/Mac)
   - `setup_mercadopago.ps1` (Windows)

## 🔧 Pasos para activar

### 1. Instalar dependencias
```bash
# Si usas Docker
docker-compose build web
docker-compose restart web

# O en desarrollo local
pip install -r requirements.txt
```

### 2. Configurar credenciales
1. Ve a https://www.mercadopago.cl/developers/panel/app
2. Copia tu **Access Token de Prueba**
3. Crea/edita el archivo `.env` en `Proyecto/`:
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
FRONTEND_URL=http://localhost:5173
```

### 3. Reiniciar servicios
```bash
docker-compose restart web
# Y el frontend si está corriendo
```

### 4. Probar flujo completo
1. Cliente hace una reserva
2. Profesional confirma la reserva (estado → "Confirmado")
3. Cliente ve botón "Pagar" en Mis Solicitudes
4. Click en "Pagar" → redirige a Mercado Pago
5. Usa tarjeta de prueba:
   - Número: `5416 7526 0258 2580`
   - CVV: `123`
   - Vencimiento: `11/25`
   - Nombre: `APRO`
6. Completa pago → regresa a página de éxito
7. El estado se actualiza automáticamente vía webhook

## 📊 Flujo técnico

```
Cliente                  Backend                 Mercado Pago
  |                        |                          |
  |-- POST /payments/create/{id} -->                  |
  |                        |                          |
  |                        |-- Create Preference ---->|
  |                        |                          |
  |                        |<-- init_point -----------|
  |<-- Redirect URL -------|                          |
  |                        |                          |
  |------------ Completes payment ------------------->|
  |                        |                          |
  |                        |<-- Webhook (IPN) --------|
  |                        |                          |
  |                        |-- Get Payment Info ----->|
  |                        |                          |
  |                        |<-- Payment Details ------|
  |                        |                          |
  |                        | (Update DB)              |
  |                        |                          |
  |<-- Redirect success ---|                          |
```

## 🗂️ Archivos creados/modificados

### Backend
- ✅ `requirements.txt` - Agregado mercadopago
- ✅ `.env.example` - Variables MP y FRONTEND_URL
- ✅ `servihogar/settings.py` - Config MP
- ✅ `api/payments.py` - Endpoints de pago (NUEVO)
- ✅ `api/urls.py` - Rutas de pago

### Frontend
- ✅ `components/payments/PaymentButton.tsx` (NUEVO)
- ✅ `pages/PaymentSuccess.tsx` (NUEVO)
- ✅ `pages/PaymentFailure.tsx` (NUEVO)
- ✅ `pages/PaymentPending.tsx` (NUEVO)
- ✅ `components/user/tabs/RequestsTab.tsx` - Integrado botón pago
- ✅ `main.tsx` - Rutas payment/*

### Documentación
- ✅ `MERCADOPAGO_README.md` (NUEVO)
- ✅ `setup_mercadopago.sh` (NUEVO)
- ✅ `setup_mercadopago.ps1` (NUEVO)

## 🎯 Características implementadas

- ✅ Checkout Pro (redirect flow)
- ✅ Webhooks/IPN para notificaciones
- ✅ Cálculo automático de comisiones (5%)
- ✅ Estados sincronizados con MP
- ✅ Páginas de resultado (success/failure/pending)
- ✅ Consulta de estado de pago
- ✅ Botón con estados visuales
- ✅ Validaciones de seguridad
- ✅ Soporte para testing con tarjetas de prueba
- ✅ Documentación completa

## 🔐 Seguridad implementada

- Solo el cliente dueño puede crear preferencias
- Webhooks validan origen desde MP
- Estados se verifican consultando API de MP
- Tokens de acceso en variables de entorno
- CSRF exempt solo en webhook (MP no envía token)

## 💰 Comisiones

- Cliente paga: $25,000
- Comisión ServiHogar (5%): $1,250
- Profesional recibe: $23,750

Guardado en tabla `pago`:
- `monto`: 25000
- `comision_plataforma`: 1250
- `monto_profesional`: 23750

## 🧪 Testing

### Tarjetas de prueba
| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Mastercard | 5416 7526 0258 2580 | Aprobado (nombre: APRO) |
| Visa | 4509 9535 6623 3704 | Aprobado (nombre: APRO) |

Ver MERCADOPAGO_README.md para más tarjetas y estados.

## 📝 Próximos pasos opcionales

- [ ] Notificaciones por email al cliente/profesional
- [ ] Panel admin para ver todos los pagos
- [ ] Reportes de pagos y comisiones
- [ ] Reembolsos desde admin
- [ ] Pagos en cuotas
- [ ] Otros métodos de pago (transferencia, etc.)

## 🐛 Troubleshooting

Ver sección completa en `MERCADOPAGO_README.md`

## 📞 Soporte

- [Documentación MP Chile](https://www.mercadopago.cl/developers)
- [Checkout Pro Docs](https://www.mercadopago.cl/developers/es/docs/checkout-pro/landing)
