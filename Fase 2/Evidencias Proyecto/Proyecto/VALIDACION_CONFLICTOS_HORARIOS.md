# Validación de Conflictos de Horarios Entre Servicios

**Fecha:** 15 de Noviembre, 2025  
**Estado:** ✅ IMPLEMENTADO

---

## Resumen

El sistema ya cuenta con validación completa de conflictos de horarios cuando un profesional crea o modifica horarios para sus servicios. Esta validación previene que un profesional tenga horarios solapados entre diferentes servicios (por ejemplo, Gasfitería y Jardinería al mismo tiempo).

---

## Funcionamiento

### 1. Validación en Backend

**Ubicación:** `api/views.py` - función `schedule_detail()` (línea 1501)

#### Funciones de Validación Implementadas:

##### A) `_check_intra_service_overlap(day_slots)`
Valida que las franjas horarias del **mismo día** NO se solapen entre sí dentro del mismo servicio.

**Ejemplo de conflicto detectado:**
```
Lunes:
  09:00 - 12:00  ❌
  11:00 - 14:00  ❌  <- Solapa con la anterior

Error: "Las franjas horarias del Lunes se solapan: 09:00-12:00 con 11:00-14:00"
```

##### B) `_check_cross_service_overlap(cur, rut_usuario, service_id, day_slots)`
Valida que los horarios NO solapen con **otros servicios del mismo profesional**.

**Ejemplo de conflicto detectado:**
```
Profesional tiene:
  Servicio Gasfitería: Lunes 09:00-12:00
  
Intenta crear:
  Servicio Jardinería: Lunes 10:00-13:00  ❌

Error: "Conflicto de horario: El Lunes de 10:00 a 13:00 solapa con tu servicio de 
        Gasfitería (09:00-12:00). No puedes trabajar en dos servicios al mismo tiempo."
```

**Consulta SQL utilizada:**
```sql
SELECT hp.dia_semana, to_char(hp.hora_inicio, 'HH24:MI'), to_char(hp.hora_fin, 'HH24:MI'),
       cs.nombre AS categoria
FROM horario_profesional hp
JOIN servicio_profesional sp ON hp.id_servicio_profesional = sp.id_servicio_profesional
JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
WHERE sp.rut_usuario = %s
  AND sp.id_servicio_profesional != %s
ORDER BY hp.dia_semana, hp.hora_inicio
```

##### C) `_validate_slot_duration(start, end)`
Valida que la duración de cada franja horaria sea razonable:
- **Mínimo:** 30 minutos
- **Máximo:** 12 horas

**Ejemplos:**
```
09:00 - 09:15  ❌  "La franja horaria debe tener al menos 30 minutos de duración"
08:00 - 21:00  ❌  "La franja horaria no puede exceder 12 horas"
09:00 - 12:00  ✅  OK (3 horas)
```

---

### 2. Tipos de Horarios Validados

#### A) Horarios Semanales (Template Base)
Se validan al crear/actualizar el horario semanal estándar del servicio.

**Validaciones aplicadas:**
1. ✅ Duración de cada franja (30min - 12hr)
2. ✅ Solapamiento intra-servicio (mismo día, mismo servicio)
3. ✅ Solapamiento cross-service (mismo día, otros servicios del profesional)

**Respuesta HTTP:**
- `400 BAD_REQUEST` - Error de validación intra-servicio
- `409 CONFLICT` - Conflicto con otro servicio del profesional

#### B) Períodos Personalizados
Se validan al crear períodos con horarios especiales (vacaciones, fechas específicas, etc.).

**Validaciones aplicadas:**
1. ✅ Todas las validaciones de horarios semanales
2. ✅ Validación día por día durante todo el período
3. ✅ Validación contra horarios base de otros servicios

**Proceso de validación:**
```python
# Para cada día del período personalizado
temp_day = start_date
while temp_day <= end_date:
    # Obtener día de la semana (0=Lunes, 6=Domingo)
    day_idx = temp_day.weekday()
    
    # Consultar horarios de otros servicios para ese día de la semana
    # Validar cada slot del período contra otros servicios
    # Si hay conflicto -> HTTP 409 CONFLICT
    
    temp_day += 1 día
```

---

### 3. Manejo de Errores en Frontend

**Ubicación:** `frontend/src/components/user/ProfessionalScheduleManagerAdvanced.tsx` (línea 970)

#### Mejoras Implementadas:

##### A) Detección de Conflictos entre Servicios (HTTP 409)
```typescript
if (e?.response?.status === 409 || errorMsg.toLowerCase().includes('conflicto')) {
  alert(
    `❌ Conflicto de Horarios\n\n${errorMsg}\n\n` +
    `💡 Consejo: Revisa los horarios de tus otros servicios para evitar solapamientos.`
  )
}
```

**Mensaje mostrado al usuario:**
```
❌ Conflicto de Horarios

Conflicto de horario: El Lunes de 10:00 a 13:00 solapa con tu servicio de 
Gasfitería (09:00-12:00). No puedes trabajar en dos servicios al mismo tiempo.

💡 Consejo: Revisa los horarios de tus otros servicios para evitar solapamientos.
```

##### B) Errores de Validación (HTTP 400)
```typescript
else if (e?.response?.status === 400) {
  alert(
    `❌ Error de Validación\n\n${errorMsg}\n\n` +
    `Verifica que:\n` +
    `• Los horarios no se solapen en el mismo día\n` +
    `• Cada franja tenga al menos 30 minutos\n` +
    `• Las horas sean válidas (HH:MM)`
  )
}
```

**Mensaje mostrado al usuario:**
```
❌ Error de Validación

Las franjas horarias del Lunes se solapan: 09:00-12:00 con 11:00-14:00

Verifica que:
• Los horarios no se solapen en el mismo día
• Cada franja tenga al menos 30 minutos
• Las horas sean válidas (HH:MM)
```

##### C) Errores Genéricos
```typescript
else {
  alert(`❌ Error al guardar los horarios\n\n${errorMsg}`)
}
```

---

## Escenarios de Prueba

### ✅ Escenario 1: Crear Horario sin Conflictos

**Setup:**
- Profesional con 1 servicio (Gasfitería)
- Gasfitería: Lunes 09:00-12:00

**Acción:**
- Crear servicio Jardinería: Lunes 14:00-17:00

**Resultado Esperado:**
- ✅ Se guarda exitosamente
- ✅ No hay conflictos

---

### ✅ Escenario 2: Detectar Conflicto Cross-Service

**Setup:**
- Profesional con 1 servicio (Gasfitería)
- Gasfitería: Lunes 09:00-12:00

**Acción:**
- Crear servicio Jardinería: Lunes 10:00-13:00

**Resultado Esperado:**
- ❌ HTTP 409 CONFLICT
- ❌ Mensaje: "Conflicto de horario: El Lunes de 10:00 a 13:00 solapa con tu servicio de Gasfitería (09:00-12:00)"
- ✅ Frontend muestra alert con consejo
- ✅ Horario NO se guarda

---

### ✅ Escenario 3: Detectar Conflicto Intra-Service

**Setup:**
- Profesional creando nuevo servicio (Gasfitería)

**Acción:**
- Agregar horario: Lunes 09:00-12:00
- Agregar horario: Lunes 11:00-14:00

**Resultado Esperado:**
- ❌ HTTP 400 BAD_REQUEST
- ❌ Mensaje: "Las franjas horarias del Lunes se solapan: 09:00-12:00 con 11:00-14:00"
- ✅ Frontend muestra alert con checklist de validación
- ✅ Horario NO se guarda

---

### ✅ Escenario 4: Validar Duración Mínima

**Setup:**
- Profesional creando nuevo servicio

**Acción:**
- Agregar horario: Lunes 09:00-09:15 (15 minutos)

**Resultado Esperado:**
- ❌ HTTP 400 BAD_REQUEST
- ❌ Mensaje: "La franja horaria debe tener al menos 30 minutos de duración"
- ✅ Frontend muestra alert con checklist
- ✅ Horario NO se guarda

---

### ✅ Escenario 5: Validar Duración Máxima

**Setup:**
- Profesional creando nuevo servicio

**Acción:**
- Agregar horario: Lunes 08:00-21:00 (13 horas)

**Resultado Esperado:**
- ❌ HTTP 400 BAD_REQUEST
- ❌ Mensaje: "La franja horaria no puede exceder 12 horas"
- ✅ Frontend muestra alert con checklist
- ✅ Horario NO se guarda

---

### ✅ Escenario 6: Período Personalizado con Conflicto

**Setup:**
- Profesional con servicio Gasfitería
- Gasfitería: Martes 10:00-12:00

**Acción:**
- Crear período personalizado "Vacaciones" para Jardinería
- Fecha: 20/11/2025 - 25/11/2025 (incluye un Martes)
- Horario: Martes 11:00-13:00

**Resultado Esperado:**
- ❌ HTTP 409 CONFLICT
- ❌ Mensaje: "Conflicto en período 'Vacaciones': El Martes 2025-11-25 de 11:00 a 13:00 solapa con tu servicio de Gasfitería (10:00-12:00)"
- ✅ Frontend muestra alert específico
- ✅ Período NO se guarda

---

### ✅ Escenario 7: Múltiples Servicios sin Conflictos

**Setup:**
- Profesional con 2 servicios

**Acción:**
- Gasfitería: Lunes 09:00-12:00, Miércoles 14:00-17:00
- Jardinería: Martes 10:00-13:00, Jueves 15:00-18:00

**Resultado Esperado:**
- ✅ Ambos servicios se guardan exitosamente
- ✅ No hay conflictos (días diferentes)

---

### ✅ Escenario 8: Horarios Contiguos (Válido)

**Setup:**
- Profesional con 1 servicio (Gasfitería)
- Gasfitería: Lunes 09:00-12:00

**Acción:**
- Crear Jardinería: Lunes 12:00-15:00

**Resultado Esperado:**
- ✅ Se guarda exitosamente
- ✅ No hay solapamiento (12:00 es fin de uno e inicio del otro)

---

## Códigos de Respuesta HTTP

| Código | Significado | Cuándo se Retorna |
|--------|-------------|-------------------|
| `200 OK` | Éxito | Horarios guardados sin conflictos |
| `400 BAD_REQUEST` | Error de validación | Duración inválida, solapamiento intra-servicio, formato incorrecto |
| `409 CONFLICT` | Conflicto entre servicios | Solapamiento cross-service (con otro servicio del profesional) |
| `403 FORBIDDEN` | No autorizado | Usuario no es dueño del servicio |
| `404 NOT_FOUND` | No encontrado | Servicio no existe |

---

## Estructura de Mensajes de Error

### Backend (JSON Response)

#### HTTP 400 - Validación Intra-Service
```json
{
  "message": "Las franjas horarias del Lunes se solapan: 09:00-12:00 con 11:00-14:00"
}
```

#### HTTP 409 - Conflicto Cross-Service
```json
{
  "message": "Conflicto de horario: El Lunes de 10:00 a 13:00 solapa con tu servicio de Gasfitería (09:00-12:00). No puedes trabajar en dos servicios al mismo tiempo."
}
```

#### HTTP 409 - Conflicto en Período Personalizado
```json
{
  "message": "Conflicto en período 'Vacaciones': El Martes 2025-11-25 de 11:00 a 13:00 solapa con tu servicio de Gasfitería (10:00-12:00). No puedes trabajar en dos servicios al mismo tiempo."
}
```

---

## Flujo de Validación Completo

```
┌─────────────────────────────────────┐
│  Usuario guarda horarios en UI     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend: apiPutAuth()             │
│  PUT /api/schedule/{service_id}/    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend: schedule_detail()         │
│  1. Verificar ownership             │
│  2. Validar formato de tiempos      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Validación Duración                │
│  _validate_slot_duration()          │
│  • Mínimo 30 min                    │
│  • Máximo 12 horas                  │
└──────────────┬──────────────────────┘
               │
               ▼ ✅ OK
┌─────────────────────────────────────┐
│  Validación Intra-Service           │
│  _check_intra_service_overlap()     │
│  • Comparar slots del mismo día     │
│  • Detectar solapamientos           │
└──────────────┬──────────────────────┘
               │
               ▼ ✅ OK
┌─────────────────────────────────────┐
│  Validación Cross-Service           │
│  _check_cross_service_overlap()     │
│  • Query otros servicios del prof.  │
│  • Comparar día por día             │
│  • Detectar solapamientos           │
└──────────────┬──────────────────────┘
               │
               ▼ ✅ OK
┌─────────────────────────────────────┐
│  Guardar en Base de Datos           │
│  • DELETE horarios anteriores       │
│  • INSERT nuevos horarios           │
│  • COMMIT transaction               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend: Mostrar éxito            │
│  ✅ "Horarios guardados"            │
└─────────────────────────────────────┘

                ❌ En cualquier error
               │
               ▼
┌─────────────────────────────────────┐
│  Backend: Return error HTTP         │
│  400 / 409 con mensaje descriptivo  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend: Catch error              │
│  • Detectar tipo (409 vs 400)       │
│  • Mostrar alert con mensaje claro  │
│  • Incluir consejos útiles          │
└─────────────────────────────────────┘
```

---

## Archivos Modificados

### Frontend (1 archivo):
- `frontend/src/components/user/ProfessionalScheduleManagerAdvanced.tsx`
  - Línea 970-1040: Mejorado manejo de errores con alertas específicas

---

## Conclusión

✅ **El sistema YA cuenta con validación completa de conflictos de horarios.**

Las mejoras implementadas en esta sesión:
1. ✅ Mensajes de error más claros y descriptivos en frontend
2. ✅ Alertas específicas según tipo de error (409 vs 400)
3. ✅ Consejos útiles para el usuario al encontrar conflictos

**No se requieren cambios adicionales en backend** - La lógica de validación ya estaba completamente implementada y funcionando correctamente.

---

**Implementado por:** Sistema existente + mejoras de UX  
**Última actualización:** 15 de Noviembre, 2025  
**Versión:** 1.0.0
