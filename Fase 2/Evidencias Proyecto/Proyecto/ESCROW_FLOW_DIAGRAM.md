# Diagrama de Flujo del Sistema de Escrow

## 📊 Flujo Visual del Proceso de Pago

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INICIO: Cliente Solicita Servicio                  │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /api/payments/book/<service_id>/                                      │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ 1. Crear solicitud_servicio (estado: 'pendiente')                  │     │
│  │ 2. Generar preferencia de pago en Mercado Pago                     │     │
│  │ 3. Cliente paga en checkout de Mercado Pago                        │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /api/payments/webhook/ (Notificación de Mercado Pago)                │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │ Si pago APROBADO:                                                  │     │
│  │   ✅ UPDATE pago SET estado='aprobado'                             │     │
│  │   ✅ Calcular comisión: $10,000 → $500 (5%) + $9,500 (profesional)│     │
│  │   ✅ INSERT INTO retencion_plataforma (...)                        │     │
│  │                                                                     │     │
│  │ Si pago RECHAZADO/CANCELADO:                                       │     │
│  │   ❌ UPDATE solicitud_servicio SET estado='cancelado'              │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
                ▼                                 ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│   OPCIÓN A: Servicio Completo │   │   OPCIÓN B: Servicio Cancelado│
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                ▼                                   ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│ POST /api/bookings/<id>/complete/   │   │ POST /api/bookings/<id>/cancel/     │
│ (Solo CLIENTE puede hacer esto)     │   │ (Cliente O Profesional)             │
│ ┌─────────────────────────────────┐ │   │ ┌─────────────────────────────────┐ │
│ │ 1. UPDATE solicitud_servicio    │ │   │ │ 1. UPDATE solicitud_servicio    │ │
│ │    SET estado='completado'      │ │   │ │    SET estado='cancelado'       │ │
│ │                                 │ │   │ │                                 │ │
│ │ 2. UPDATE pago                  │ │   │ │ 2. UPDATE pago                  │ │
│ │    SET liberado_al_profesional  │ │   │ │    SET estado='reembolsado'     │ │
│ │        _en = NOW()              │ │   │ │        monto_reembolso = monto  │ │
│ │                                 │ │   │ │        reembolsado_en = NOW()   │ │
│ │ 3. INSERT INTO pago_profesional │ │   │ │                                 │ │
│ │    (estado: 'pendiente')        │ │   │ │ 3. TODO: Llamar a MP Refunds API│ │
│ └─────────────────────────────────┘ │   │ └─────────────────────────────────┘ │
└────────────────┬────────────────────┘   └────────────────┬────────────────────┘
                 │                                         │
                 ▼                                         ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│ POST /api/payments/payout/<id>/     │   │ POST /api/payments/refund/<id>/     │
│ (Solo ADMIN - Manual)                │   │ (Solo ADMIN - Manual)               │
│ ┌─────────────────────────────────┐ │   │ ┌─────────────────────────────────┐ │
│ │ UPDATE pago_profesional         │ │   │ │ sdk.refund().create(...)        │ │
│ │ SET estado='pagado'             │ │   │ │ (Mercado Pago Refunds API)      │ │
│ │     fecha_pagado = NOW()        │ │   │ │                                 │ │
│ │     referencia_transaccion='...'│ │   │ │ Devuelve dinero real al cliente │ │
│ └─────────────────────────────────┘ │   │ └─────────────────────────────────┘ │
└────────────────┬────────────────────┘   └────────────────┬────────────────────┘
                 │                                         │
                 ▼                                         ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│ ✅ Profesional recibe su dinero     │   │ ✅ Cliente recupera su dinero       │
│    ($9,500 en este ejemplo)         │   │    ($10,000 en este ejemplo)        │
└─────────────────────────────────────┘   └─────────────────────────────────────┘
```

---

## 🗄️ Diagrama de Base de Datos

```
┌─────────────────────────┐
│  solicitud_servicio     │
│─────────────────────────│
│ id_solicitud_servicio PK│◄─────────┐
│ rut_cliente             │          │
│ rut_profesional         │          │
│ titulo                  │          │
│ precio_total            │          │
│ estado ──────────────►  │          │ (pendiente → completado/cancelado)
│ completado_en           │          │
│ cancelado_en            │          │
└─────────────────────────┘          │
                                     │
                                     │
┌─────────────────────────┐          │
│  pago                   │          │
│─────────────────────────│          │
│ id_pago_mercadopago PK  │◄─────────┤
│ id_solicitud_servicio FK├──────────┘
│ monto                   │
│ estado ──────────────►  │  (pendiente → aprobado → reembolsado)
│ comision_plataforma     │  ($500)
│ monto_profesional       │  ($9,500)
│ liberado_al_profesional │
│   _en                   │  (NULL → [timestamp] cuando se completa)
│ reembolsado_en          │  (NULL → [timestamp] cuando se cancela)
│ monto_reembolso         │
└────────┬────────────────┘
         │
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ retencion_plataforma    │   │  pago_profesional       │
│─────────────────────────│   │─────────────────────────│
│ id_retencion PK         │   │ id_pago_profesional PK  │
│ id_pago_mercadopago FK  ├──►│ id_retencion FK         │
│ id_solicitud_servicio FK│   │ id_pago_mercadopago FK  │
│ monto_total_pago        │   │ id_solicitud_servicio FK│
│ porcentaje_retencion    │   │ rut_profesional         │
│ monto_retenido ($500)   │   │ monto_a_pagar ($9,500)  │
│ monto_profesional       │   │ estado ───────────────► │ (pendiente → pagado)
│ retenido_en             │   │ fecha_pagado            │
└─────────────────────────┘   │ referencia_transaccion  │
                              │ procesado_por           │
    SE CREA AUTOMÁTICAMENTE   └─────────────────────────┘
    cuando pago es APROBADO       
                                  SE CREA AUTOMÁTICAMENTE
                                  cuando servicio COMPLETA
```

---

## 💰 Flujo de Dinero

```
Cliente paga $10,000
       │
       ▼
┌─────────────────────────────────────┐
│   Cuenta de ServiHogar              │
│   (Escrow / Custodia)               │
│                                     │
│   Total retenido: $10,000           │
│   ├─ Comisión (5%): $500            │
│   └─ Para profesional: $9,500       │
└─────────────────┬───────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│ SERVICIO        │   │ SERVICIO        │
│ COMPLETADO ✅   │   │ CANCELADO ❌    │
└────────┬────────┘   └────────┬────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ Profesional     │   │ Cliente         │
│ recibe $9,500   │   │ recibe $10,000  │
│                 │   │ (reembolso)     │
└─────────────────┘   └─────────────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ ServiHogar      │   │ ServiHogar      │
│ retiene $500    │   │ retiene $0      │
└─────────────────┘   └─────────────────┘
```

---

## 🔐 Control de Permisos

```
┌──────────────────────────────────────────────────────┐
│               ENDPOINT                │   PERMISO    │
├──────────────────────────────────────────────────────┤
│ POST /payments/book/<id>/             │ Cliente      │
│ POST /bookings/<id>/complete/         │ Cliente (*1) │
│ POST /bookings/<id>/cancel/           │ Cliente/Prof │
│ POST /payments/refund/<id>/           │ Admin Only   │
│ POST /payments/payout/<id>/           │ Admin Only   │
│ POST /payments/webhook/               │ MP Webhook   │
│ GET  /payments/status/<id>/           │ Cliente/Prof │
└──────────────────────────────────────────────────────┘

(*1) Solo el cliente DUEÑO de la solicitud puede completar
```

---

## 📝 Logs Típicos

### Pago Aprobado (Webhook):
```
INFO: Pago aprobado para solicitud abc-123-def
INFO: Retención creada: $500 retenido, $9,500 para profesional
INFO: Pago 123456789 actualizado a estado aprobado para solicitud abc-123-def
```

### Servicio Completado:
```
INFO: Completar servicio - User: cliente@example.com, RUT: 12345678-9
INFO: 💰 Pago liberado al profesional: $9,500 (Solicitud abc-123-def, Pago 123456789)
INFO: 📝 Registro de pago al profesional creado (pendiente de procesamiento)
```

### Servicio Cancelado:
```
INFO: 💸 Reembolso procesado: $10,000 al cliente (Solicitud abc-123-def, Pago 123456789)
```

### Pago al Profesional:
```
INFO: 💰 Pago al profesional procesado: $9,500 para RUT 98765432-1 
      (Solicitud abc-123-def, Método: transferencia_bancaria)
```
