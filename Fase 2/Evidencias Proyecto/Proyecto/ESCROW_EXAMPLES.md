# Ejemplos de Uso - Sistema de Escrow

## 🧪 Casos de Uso Completos con Ejemplos

### 📌 Caso 1: Flujo Exitoso (Cliente paga → Servicio completa → Profesional recibe pago)

#### Paso 1: Cliente reserva y paga el servicio
```bash
POST /api/payments/book/550e8400-e29b-41d4-a716-446655440000/
Authorization: Bearer <token_cliente>
Content-Type: application/json

{
  "date": "2024-01-15",
  "start": "10:00",
  "duration": 120,
  "title": "Instalación de lavadora",
  "description": "Necesito instalar lavadora nueva en el baño",
  "address": "Av. Providencia 1234, Depto 501",
  "region_name": "Metropolitana",
  "comuna_name": "Providencia"
}
```

**Respuesta**:
```json
{
  "ok": true,
  "request_id": "abc-123-def-456",
  "preference_id": "123456789-abc-def",
  "init_point": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "amount": 25000
}
```

**¿Qué pasa?**
- Se crea `solicitud_servicio` con estado `pendiente`
- Cliente es redirigido a Mercado Pago para pagar
- Pago entra en estado `pendiente` (esperando confirmación)

---

#### Paso 2: Cliente paga en Mercado Pago
*(El cliente completa el pago en el checkout de Mercado Pago)*

**Mercado Pago envía webhook**:
```bash
POST /api/payments/webhook/
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "987654321"
  }
}
```

**¿Qué pasa internamente?**
```sql
-- 1. Actualizar pago
UPDATE pago
SET estado = 'aprobado',
    comision_plataforma = 1250,  -- 5% de 25,000
    monto_profesional = 23750     -- 95% de 25,000
WHERE id_solicitud_servicio = 'abc-123-def-456';

-- 2. Crear retención
INSERT INTO retencion_plataforma (
  id_pago_mercadopago,
  id_solicitud_servicio,
  monto_total_pago,
  monto_retenido,
  monto_profesional
) VALUES (
  '987654321',
  'abc-123-def-456',
  25000,
  1250,  -- Comisión para ServiHogar
  23750  -- Dinero que se liberará al profesional
);
```

**Estado actual**:
- ✅ Cliente pagó $25,000
- 🏦 ServiHogar retiene $25,000 (escrow)
- 📊 $1,250 marcado como comisión
- 📊 $23,750 marcado para el profesional (aún NO liberado)
- 🔒 `liberado_al_profesional_en = NULL`

---

#### Paso 3: Profesional realiza el servicio
*(El profesional va a la dirección y completa la instalación)*

---

#### Paso 4: Cliente confirma que el servicio se completó
```bash
POST /api/bookings/abc-123-def-456/complete/
Authorization: Bearer <token_cliente>
Content-Type: application/json

{}
```

**Respuesta**:
```json
{
  "ok": true,
  "id_solicitud_servicio": "abc-123-def-456",
  "estado": "completado",
  "payment_released": true
}
```

**¿Qué pasa internamente?**
```sql
-- 1. Marcar servicio como completado
UPDATE solicitud_servicio
SET estado = 'completado',
    completado_en = '2024-01-15 12:30:00'
WHERE id_solicitud_servicio = 'abc-123-def-456';

-- 2. LIBERAR el pago al profesional
UPDATE pago
SET liberado_al_profesional_en = '2024-01-15 12:30:00'
WHERE id_solicitud_servicio = 'abc-123-def-456'
  AND estado = 'aprobado';

-- 3. Crear registro de pago pendiente
INSERT INTO pago_profesional (
  id_retencion,
  id_pago_mercadopago,
  id_solicitud_servicio,
  rut_profesional,
  monto_a_pagar,
  estado,
  fecha_programada
) VALUES (
  <id_retencion>,
  '987654321',
  'abc-123-def-456',
  '12345678-9',
  23750,
  'pendiente',
  '2024-01-16'  -- Programado para mañana
);
```

**Estado actual**:
- ✅ Servicio completado
- ✅ Pago LIBERADO al profesional
- 📝 Registro creado en `pago_profesional` (pendiente de transferencia real)
- 🏦 ServiHogar aún tiene el dinero físico, pero está comprometido

---

#### Paso 5: Admin procesa el pago al profesional (batch manual/automático)
```bash
POST /api/payments/payout/abc-123-def-456/
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "payment_method": "transferencia_bancaria",
  "reference": "TRANSFER-20240116-001"
}
```

**Respuesta**:
```json
{
  "ok": true,
  "payout_id": "uuid-pago-prof-123",
  "amount": 23750,
  "professional_rut": "12345678-9",
  "payment_method": "transferencia_bancaria",
  "message": "Pago al profesional procesado exitosamente"
}
```

**¿Qué pasa internamente?**
```sql
UPDATE pago_profesional
SET estado = 'pagado',
    fecha_pagado = '2024-01-16 09:00:00',
    metodo_pago = 'transferencia_bancaria',
    referencia_transaccion = 'TRANSFER-20240116-001',
    procesado_por = '11111111-1'  -- RUT del admin
WHERE id_pago_profesional = 'uuid-pago-prof-123';
```

**Estado FINAL**:
- ✅ Profesional recibió $23,750 en su cuenta bancaria
- ✅ ServiHogar retuvo $1,250 como comisión
- ✅ Cliente satisfecho con el servicio
- ✅ Ciclo completo cerrado

---

### 📌 Caso 2: Flujo de Cancelación (Cliente paga → Servicio se cancela → Reembolso)

#### Paso 1-2: Cliente reserva y paga
*(Igual que Caso 1, pasos 1-2)*

**Estado después del pago**:
- ✅ Cliente pagó $25,000
- 🏦 Dinero retenido por ServiHogar
- 🔒 `liberado_al_profesional_en = NULL`

---

#### Paso 3: Cliente decide cancelar el servicio
```bash
POST /api/bookings/abc-123-def-456/cancel/
Authorization: Bearer <token_cliente>
Content-Type: application/json

{
  "razon": "Surgió un imprevisto, no podré estar en casa"
}
```

**Respuesta**:
```json
{
  "ok": true,
  "id_solicitud_servicio": "abc-123-def-456",
  "estado": "cancelado",
  "refund_processed": true
}
```

**¿Qué pasa internamente?**
```sql
-- 1. Cancelar servicio
UPDATE solicitud_servicio
SET estado = 'cancelado',
    cancelado_en = '2024-01-14 18:00:00',
    razon_cancelacion = 'Surgió un imprevisto, no podré estar en casa'
WHERE id_solicitud_servicio = 'abc-123-def-456';

-- 2. Marcar pago para reembolso
UPDATE pago
SET estado = 'reembolsado',
    reembolsado_en = '2024-01-14 18:00:00',
    monto_reembolso = 25000
WHERE id_solicitud_servicio = 'abc-123-def-456'
  AND estado = 'aprobado'
  AND liberado_al_profesional_en IS NULL;
```

**Estado actual**:
- ✅ Servicio cancelado
- 📝 Pago marcado como `reembolsado` en DB
- ⚠️ Reembolso REAL aún no procesado vía Mercado Pago

---

#### Paso 4: Admin procesa el reembolso real
```bash
POST /api/payments/refund/abc-123-def-456/
Authorization: Bearer <token_admin>
Content-Type: application/json

{}
```

**Respuesta**:
```json
{
  "ok": true,
  "refund_id": "1234567890",
  "amount": 25000,
  "status": "approved",
  "message": "Reembolso procesado exitosamente"
}
```

**¿Qué pasa internamente?**
```javascript
// Llamada a Mercado Pago Refunds API
sdk.refund().create(payment_id, {
  amount: 25000
});

// La API de MP devuelve dinero a la tarjeta del cliente
```

**Estado FINAL**:
- ✅ Cliente recibió $25,000 de vuelta
- ✅ Profesional NO recibe nada (servicio no realizado)
- ✅ ServiHogar NO cobra comisión (servicio cancelado)
- ✅ Ciclo completo cerrado

---

### 📌 Caso 3: Consulta de Estado del Pago

#### Cliente/Profesional consulta el estado
```bash
GET /api/payments/status/abc-123-def-456/
Authorization: Bearer <token_cliente_o_profesional>
```

**Respuesta (Pago aprobado, no liberado)**:
```json
{
  "has_payment": true,
  "payment_status": "aprobado",
  "payment_id": "987654321",
  "payment_method": "mercadopago",
  "amount": 25000,
  "created_at": "2024-01-14T14:30:00Z"
}
```

**Respuesta (Pago reembolsado)**:
```json
{
  "has_payment": true,
  "payment_status": "reembolsado",
  "payment_id": "987654321",
  "payment_method": "mercadopago",
  "amount": 25000,
  "created_at": "2024-01-14T14:30:00Z"
}
```

---

## 🔍 Consultas SQL de Auditoría

### Ver todos los pagos retenidos actualmente
```sql
SELECT 
    s.id_solicitud_servicio,
    s.titulo,
    s.fecha_programada,
    u_cli.nombres || ' ' || u_cli.apellidos AS cliente,
    u_prof.nombres || ' ' || u_prof.apellidos AS profesional,
    p.monto AS monto_total,
    p.comision_plataforma,
    p.monto_profesional,
    p.estado AS estado_pago,
    s.estado AS estado_servicio,
    p.creado_en,
    CASE 
        WHEN p.liberado_al_profesional_en IS NOT NULL THEN 'LIBERADO'
        WHEN p.reembolsado_en IS NOT NULL THEN 'REEMBOLSADO'
        ELSE 'RETENIDO'
    END AS estado_escrow
FROM pago p
INNER JOIN solicitud_servicio s ON s.id_solicitud_servicio = p.id_solicitud_servicio
INNER JOIN usuario u_cli ON u_cli.rut = s.rut_cliente
INNER JOIN usuario u_prof ON u_prof.rut = s.rut_profesional
WHERE p.estado = 'aprobado'
ORDER BY p.creado_en DESC;
```

### Ver pagos pendientes de pago al profesional
```sql
SELECT 
    pp.id_pago_profesional,
    pp.rut_profesional,
    u.nombres || ' ' || u.apellidos AS profesional,
    u.email AS email_profesional,
    pp.monto_a_pagar,
    pp.estado,
    pp.fecha_programada,
    pp.fecha_pagado,
    s.titulo AS servicio,
    s.completado_en
FROM pago_profesional pp
INNER JOIN usuario u ON u.rut = pp.rut_profesional
INNER JOIN solicitud_servicio s ON s.id_solicitud_servicio = pp.id_solicitud_servicio
WHERE pp.estado = 'pendiente'
ORDER BY pp.fecha_programada ASC;
```

### Calcular comisiones del mes
```sql
SELECT 
    DATE_TRUNC('day', r.retenido_en) AS fecha,
    COUNT(*) AS cantidad_retenciones,
    SUM(r.monto_total_pago) AS total_pagado,
    SUM(r.monto_retenido) AS total_comisiones,
    SUM(r.monto_profesional) AS total_profesionales
FROM retencion_plataforma r
WHERE r.retenido_en >= DATE_TRUNC('month', CURRENT_DATE)
  AND r.retenido_en < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY DATE_TRUNC('day', r.retenido_en)
ORDER BY fecha DESC;
```

---

## 🧪 Tests de Integración Sugeridos

### Test 1: Flujo completo exitoso
```python
def test_complete_payment_flow():
    # 1. Cliente reserva y paga
    response = client.post('/api/payments/book/service-id/', data={...})
    assert response.json()['ok'] == True
    request_id = response.json()['request_id']
    
    # 2. Simular webhook de MP (pago aprobado)
    webhook_response = client.post('/api/payments/webhook/', data={
        'type': 'payment',
        'data': {'id': 'payment-123'}
    })
    
    # 3. Verificar que se creó retención
    payment = Payment.objects.get(id_solicitud_servicio=request_id)
    assert payment.estado == 'aprobado'
    assert payment.comision_plataforma == payment.monto * 0.05
    
    retention = RetencionPlataforma.objects.get(id_pago_mercadopago=payment.id_pago_mercadopago)
    assert retention.monto_retenido == payment.comision_plataforma
    
    # 4. Cliente completa servicio
    complete_response = client.post(f'/api/bookings/{request_id}/complete/')
    assert complete_response.json()['payment_released'] == True
    
    # 5. Verificar que se liberó el pago
    payment.refresh_from_db()
    assert payment.liberado_al_profesional_en is not None
    
    # 6. Verificar que se creó pago_profesional
    payout = PagoProfesional.objects.get(id_solicitud_servicio=request_id)
    assert payout.estado == 'pendiente'
    assert payout.monto_a_pagar == payment.monto_profesional
```

### Test 2: Flujo de cancelación
```python
def test_cancellation_flow():
    # 1-2. Cliente reserva y paga (igual que test 1)
    
    # 3. Cliente cancela
    cancel_response = client.post(f'/api/bookings/{request_id}/cancel/', data={
        'razon': 'Cambio de planes'
    })
    assert cancel_response.json()['refund_processed'] == True
    
    # 4. Verificar estado del pago
    payment = Payment.objects.get(id_solicitud_servicio=request_id)
    assert payment.estado == 'reembolsado'
    assert payment.reembolsado_en is not None
    assert payment.monto_reembolso == payment.monto
    
    # 5. Verificar que NO se creó pago_profesional
    assert not PagoProfesional.objects.filter(id_solicitud_servicio=request_id).exists()
```

---

## 📊 Métricas Importantes

### KPIs del Sistema de Escrow
- **Tasa de retención**: % de pagos que quedan retenidos más de X días
- **Tiempo promedio de liberación**: Días entre pago y liberación
- **Tasa de reembolsos**: % de pagos que terminan en reembolso
- **Comisiones acumuladas**: Total retenido por ServiHogar
- **Pagos pendientes**: Dinero comprometido pero no transferido a profesionales

### Queries para Métricas
```sql
-- Tiempo promedio entre pago y liberación
SELECT AVG(
  EXTRACT(EPOCH FROM (liberado_al_profesional_en - creado_en)) / 86400
) AS dias_promedio
FROM pago
WHERE liberado_al_profesional_en IS NOT NULL;

-- Tasa de reembolsos
SELECT 
  COUNT(CASE WHEN estado = 'reembolsado' THEN 1 END)::FLOAT / COUNT(*) * 100 AS tasa_reembolso
FROM pago
WHERE estado IN ('aprobado', 'reembolsado');

-- Comisiones del mes
SELECT SUM(comision_plataforma) AS comisiones_mes
FROM pago
WHERE estado = 'aprobado'
  AND creado_en >= DATE_TRUNC('month', CURRENT_DATE);
```
