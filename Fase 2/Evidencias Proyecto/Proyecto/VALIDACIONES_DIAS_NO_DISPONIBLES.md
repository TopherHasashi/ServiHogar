# Análisis: Días No Disponibles - Problemas y Soluciones

**Fecha:** 2025-11-12  
**Estado:** ✅ Validaciones implementadas

---

## 🔍 Problemas Identificados

### 1. ❌ **Frontend permitía seleccionar fechas pasadas**

**Problema:**  
El calendario permitía seleccionar días anteriores al actual como "no disponibles", lo cual no tiene sentido lógico.

**Impacto:**  
- Usuario podía marcar ayer como "no disponible"
- Backend rechazaba con error, pero solo al guardar
- Mala experiencia de usuario

**Solución implementada:**  
✅ Validación en `handleDateSelect()` que previene seleccionar fechas pasadas  
✅ Validación en `selectWeek()` que excluye semanas pasadas  
✅ Días pasados se muestran deshabilitados visualmente en el calendario  
✅ Alert informativo si el usuario intenta seleccionar fecha pasada

**Código:**
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
const dateToCheck = new Date(date)
dateToCheck.setHours(0, 0, 0, 0)

if (dateToCheck < today) {
  alert('No puedes marcar días pasados como no disponibles.')
  return
}
```

---

### 2. ✅ **Backend ya validaba fechas pasadas**

**Código existente (línea 1781):**
```python
if sd_dt.date() < today:
    return Response({"message": "No puedes bloquear días en el pasado"}, status=400)
```

**Estado:** Ya estaba implementado correctamente en backend.

---

### 3. ⚠️ **Días bloqueados cargados del backend podían estar en el pasado**

**Problema:**  
Si un profesional bloqueó días en noviembre y ahora estamos en diciembre, esos días aún aparecían en la UI como bloqueados.

**Solución implementada:**  
✅ Filtro automático al cargar desde backend que:
- Elimina bloques completamente en el pasado
- Ajusta bloques que empiezan en el pasado pero terminan en el futuro (inicia desde hoy)
- Solo muestra días bloqueados relevantes (presentes/futuros)

**Código:**
```typescript
const unavailabilities = (data.unavailabilities || [])
  .map(...)
  .filter((u: any) => {
    const endDate = new Date(u.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate >= today  // Solo mantener si termina hoy o después
  })
  .map((u: any) => {
    const startDate = new Date(u.startDate)
    startDate.setHours(0, 0, 0, 0)
    if (startDate < today) {
      return { ...u, startDate: new Date(today) }  // Ajustar inicio a hoy
    }
    return u
  })
```

---

### 4. 🤔 **PROBLEMA CONCEPTUAL: Días bloqueados por servicio vs por profesional**

**Situación actual:**  
Los días bloqueados están separados por `id_servicio_profesional`:

```
Profesional Juan (RUT: 11.570.564-4)
├─ Servicio: Jardinería
│  └─ Bloqueado: 15-dic-2025 (motivo: "Vacaciones")
└─ Servicio: Gasfitería
   └─ Bloqueado: (ninguno)
```

**Problema lógico:**  
Si Juan bloquea el 15 de diciembre en Jardinería porque está de vacaciones, **¿no debería estar bloqueado también en Gasfitería?**

**Escenario problemático:**
```
15-dic-2025:
✅ Cliente A intenta reservar Jardinería → RECHAZADO (día bloqueado)
❌ Cliente B intenta reservar Gasfitería → ACEPTADO (día NO bloqueado)
→ Juan recibe reserva de Gasfitería en un día que está de vacaciones
```

---

## 🎯 Opciones de Diseño

### Opción A: **Bloqueo independiente por servicio** (actual)

**Ventajas:**
- Permite flexibilidad: el profesional puede estar disponible para un servicio pero no otro
- Ejemplo: "Hoy no hago jardinería (llueve) pero sí gasfitería"

**Desventajas:**
- Inconsistencia lógica para ausencias globales (vacaciones, enfermedad)
- Usuario debe marcar el mismo día en TODOS sus servicios
- Propenso a errores: olvidar bloquear en un servicio

### Opción B: **Bloqueo global a nivel profesional** (nueva propuesta)

**Ventajas:**
- Consistencia lógica para ausencias globales
- Un solo click bloquea todos los servicios
- Imposible recibir reservas en días de ausencia

**Desventajas:**
- Pierde flexibilidad para bloqueos específicos por servicio
- Cambio de modelo de datos (necesita nueva tabla `dia_bloqueado_profesional`)

### Opción C: **Híbrido: Bloqueo con alcance seleccionable** (recomendada)

**Propuesta:**
```typescript
interface DiaBloqueado {
  fecha_inicio: Date
  fecha_fin: Date
  motivo: string
  alcance: 'servicio' | 'todos'  // NUEVO CAMPO
  id_servicio_profesional?: UUID  // NULL si alcance='todos'
  rut_usuario: string  // Identifica al profesional
}
```

**UI propuesta:**
```
┌─────────────────────────────────────┐
│ Marcar días como no disponibles    │
├─────────────────────────────────────┤
│ Alcance:                            │
│ ◉ Solo este servicio (Jardinería)  │
│ ○ Todos mis servicios               │
│                                     │
│ Motivo: [Vacaciones          ]     │
│                                     │
│ [Fechas seleccionadas: 5 días]     │
│                                     │
│         [Cancelar]  [Guardar]      │
└─────────────────────────────────────┘
```

**Ventajas:**
- Flexibilidad máxima
- Usuario decide el alcance según el motivo
- Vacaciones/enfermedad → "Todos mis servicios"
- Clima/equipo → "Solo este servicio"

---

## ✅ Implementación Actual

### Frontend (ProfessionalScheduleManagerAdvanced.tsx)

**1. Validación en selección de fecha:**
```typescript
// Línea ~315
const handleDateSelect = (date: Date) => {
  // Prevenir seleccionar fechas en el pasado
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateToCheck = new Date(date)
  dateToCheck.setHours(0, 0, 0, 0)
  
  if (dateToCheck < today) {
    alert('No puedes marcar días pasados como no disponibles.')
    return
  }
  // ... resto del código
}
```

**2. Validación en selección de semana:**
```typescript
// Línea ~338
const selectWeek = (startDate: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // ... genera weekDates solo con fechas futuras
  
  // Si no hay fechas válidas (todas son pasadas), mostrar alerta
  if (weekDates.length === 0) {
    alert('No puedes marcar semanas pasadas como no disponibles.')
    return
  }
  // ... resto del código
}
```

**3. Deshabilitación visual en calendario:**
```typescript
// Línea ~1163
const today = new Date()
today.setHours(0, 0, 0, 0)
const dateToCheck = new Date(day.date)
dateToCheck.setHours(0, 0, 0, 0)
const isPast = dateToCheck < today

const disabled = !day.isCurrentMonth || isPast
```

**4. Filtrado de días bloqueados al cargar:**
```typescript
// Línea ~182
const unavailabilities = (data.unavailabilities || [])
  .map(...)
  .filter((u: any) => {
    const endDate = new Date(u.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate >= today  // Solo bloques que terminan hoy o después
  })
  .map((u: any) => {
    // Ajustar inicio si empieza en el pasado
    const startDate = new Date(u.startDate)
    startDate.setHours(0, 0, 0, 0)
    if (startDate < today) {
      return { ...u, startDate: new Date(today) }
    }
    return u
  })
```

**5. Validación antes de guardar:**
```typescript
// Línea ~930 (ya existía)
const today = new Date(); today.setHours(0,0,0,0)
for (const a of sched.customAvailability) {
  const sd = new Date(a.startDate); sd.setHours(0,0,0,0)
  if (sd < today) {
    setIsSaving(false)
    alert('Hay días no disponibles en el pasado. Ajusta las fechas antes de guardar.')
    return
  }
}
```

### Backend (api/views.py)

**Validación existente (línea ~1781):**
```python
if sd_dt.date() < today:
    return Response({
        "message": "No puedes bloquear días en el pasado"
    }, status=status.HTTP_400_BAD_REQUEST)
```

---

## 🧪 Casos de Prueba

### Test 1: ✅ Prevenir selección de fecha pasada
```
Acción: Usuario hace click en día de ayer
Resultado: Alert "No puedes marcar días pasados como no disponibles."
Estado: ✅ PASS
```

### Test 2: ✅ Prevenir selección de semana pasada
```
Acción: Usuario hace click en botón "S" de semana pasada
Resultado: Alert "No puedes marcar semanas pasadas como no disponibles."
Estado: ✅ PASS
```

### Test 3: ✅ Días pasados visualmente deshabilitados
```
Acción: Usuario ve calendario
Resultado: Días pasados con cursor-not-allowed y color gris
Estado: ✅ PASS
```

### Test 4: ✅ Filtrado al cargar días bloqueados
```
Setup: Profesional tiene bloqueado 1-nov a 10-nov
Acción: Cargar horarios el 12-nov
Resultado: Bloque no aparece en UI (completamente en pasado)
Estado: ✅ PASS
```

### Test 5: ✅ Ajuste de bloque parcialmente pasado
```
Setup: Profesional tiene bloqueado 5-nov a 15-nov
Acción: Cargar horarios el 12-nov
Resultado: Bloque aparece como 12-nov a 15-nov (inicio ajustado)
Estado: ✅ PASS
```

### Test 6: ✅ Backend rechaza fechas pasadas
```
Acción: POST /api/schedule/{id}/ con fecha pasada (via API directa)
Resultado: 400 "No puedes bloquear días en el pasado"
Estado: ✅ PASS
```

---

## 📊 Análisis de Impacto

### Antes de la implementación:
- ❌ Frontend permitía seleccionar fechas pasadas
- ❌ Días bloqueados pasados permanecían en UI indefinidamente
- ⚠️ Backend validaba, pero solo al guardar (mala UX)

### Después de la implementación:
- ✅ Frontend previene selección de fechas pasadas (proactivo)
- ✅ Días bloqueados pasados se filtran automáticamente
- ✅ UI coherente: solo muestra días relevantes (presente/futuro)
- ✅ Mensajes claros para el usuario

---

## 🚨 Problema Pendiente: Bloqueo Cross-Service

**Estado:** NO IMPLEMENTADO (decisión de diseño pendiente)

**Recomendación:** Implementar Opción C (Híbrido con alcance seleccionable)

**Pasos sugeridos:**
1. Agregar campo `alcance` a tabla `dia_bloqueado`
2. Modificar UI para mostrar selector de alcance
3. Backend validar alcance y aplicar a múltiples servicios si `alcance='todos'`
4. Query de disponibilidad debe considerar bloques globales y por servicio

**Ejemplo de query modificado:**
```sql
-- Verificar si día está bloqueado (considerar ambos alcances)
SELECT 1 FROM dia_bloqueado
WHERE (
    -- Bloqueo específico del servicio
    (id_servicio_profesional = %s AND alcance = 'servicio')
    OR
    -- Bloqueo global del profesional
    (rut_usuario = %s AND alcance = 'todos')
)
AND %s BETWEEN fecha_inicio AND fecha_fin
```

---

## 📝 Resumen

### Validaciones Implementadas (4):

1. ✅ **Frontend: Prevenir selección de fecha pasada** (handleDateSelect)
2. ✅ **Frontend: Prevenir selección de semana pasada** (selectWeek)
3. ✅ **Frontend: Deshabilitar visualmente días pasados** (disabled prop)
4. ✅ **Frontend: Filtrar días bloqueados pasados al cargar** (useEffect)

### Validaciones Existentes (2):

5. ✅ **Frontend: Validar antes de guardar** (handleSave - ya existía)
6. ✅ **Backend: Rechazar fechas pasadas** (schedule_detail - ya existía)

### Pendiente de Decisión (1):

7. ⚠️ **Bloqueo cross-service** (requiere decisión de diseño de producto)

---

**Total de validaciones funcionando:** 6/6 ✅  
**Problema pendiente de diseño:** Alcance de bloqueo (por servicio vs global)  
**Estado general:** PRODUCCIÓN READY (con nota sobre alcance de bloqueo)
