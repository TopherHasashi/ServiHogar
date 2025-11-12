# Problemas Detectados en Gestión de Horarios

## Estado Actual
- Hay **1 profesional con 2 servicios** (RUT: 11.570.564-4)
- Hay **1 servicio con 4 franjas horarias** configuradas
- Sistema permite crear hasta **3 servicios por profesional**

---

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **NO HAY VALIDACIÓN DE SOLAPAMIENTO ENTRE SERVICIOS DEL MISMO PROFESIONAL**

**Problema:** 
Un profesional con 2+ servicios puede crear horarios que se solapan entre sí.

**Ejemplo del problema:**
```
Servicio A (Jardinería): Lunes 09:00-13:00
Servicio B (Gasfitería): Lunes 10:00-14:00  ❌ SOLAPA 2 HORAS
```

**Código afectado:** `api/views.py` líneas 1580-1605 (PUT en `schedule_detail`)

**Código actual:**
```python
# Solo valida formato de tiempo, NO valida solapamiento
if not (isinstance(st, str) and isinstance(en, str) and _valid_time(st) and _valid_time(en) and st < en):
    return Response({"message": f"Horario inválido en {day} índice {i}"}, status=400)
```

**Lo que falta:**
- Query para obtener TODOS los horarios del profesional (no solo del servicio actual)
- Algoritmo de detección de intersección de rangos horarios
- Validación cross-service por día y hora

---

### 2. **NO HAY VALIDACIÓN DE SOLAPAMIENTO DENTRO DEL MISMO SERVICIO**

**Problema:** 
El mismo servicio puede tener múltiples franjas horarias que se solapan el mismo día.

**Ejemplo del problema:**
```
Servicio A (Jardinería):
  - Lunes 09:00-13:00
  - Lunes 11:00-15:00  ❌ SOLAPA 2 HORAS
```

**Código afectado:** `api/views.py` líneas 1580-1605

**Código actual:**
```python
for sl in slots:
    # Inserta directamente sin validar contra otros slots del mismo día
    cur.execute("INSERT INTO horario_profesional ...")
```

**Lo que falta:**
- Validación de intersección entre slots del mismo día en `weekly_template`
- Mensaje de error específico: "Ya tienes un horario configurado de {X} a {Y} el {día}"

---

### 3. **NO HAY VALIDACIÓN DE SOLAPAMIENTO EN PERÍODOS PERSONALIZADOS**

**Problema:** 
Los períodos personalizados se expanden día por día y NO validan contra:
- El horario semanal base (`horario_profesional`)
- Otros períodos personalizados
- Períodos personalizados de otros servicios del mismo profesional

**Ejemplo del problema:**
```
Horario Base Servicio A: Lunes 09:00-17:00
Período Personalizado "Vacaciones Cortas": Lunes 15-enero 08:00-12:00
  ❌ NO valida si 08:00-12:00 está dentro de 09:00-17:00
  ❌ NO valida si otro servicio del profesional trabaja ese día/hora
```

**Código afectado:** `api/views.py` líneas 1680-1730

**Código actual:**
```python
# Expande por día sin validar solapamiento
while cur_day <= ed:
    # ... (solo valida formato)
    cur.execute("INSERT INTO periodo_personalizado ...")
    cur_day = cur_day + timedelta(days=1)
```

**Lo que falta:**
- Validación contra horario base
- Validación contra otros períodos personalizados del mismo servicio
- Validación cross-service (otros servicios del profesional)

---

### 4. **CONSTRAINT ÚNICO INSUFICIENTE EN `horario_profesional`**

**Problema:** 
El constraint único permite múltiples franjas horarias solapadas en el mismo día.

**Constraint actual:**
```sql
UNIQUE CONSTRAINT (id_servicio_profesional, dia_semana, hora_inicio)
```

**Escenario que permite:**
```
✅ Permitido por constraint:
  - (servicio_A, lunes, 09:00, 13:00)
  - (servicio_A, lunes, 10:00, 14:00)  ← hora_inicio diferente, NO bloquea
```

**Solución necesaria:**
- Validación a nivel aplicación (no constraint DB)
- Función de detección de intersección de rangos

---

### 5. **NO HAY VALIDACIÓN DE HORARIOS LÓGICOS**

**Problemas adicionales no validados:**
- Horarios menores a 30 minutos (ej: 09:00-09:15)
- Horarios de 24+ horas (ej: 09:00 hasta 09:00 del día siguiente)
- Horarios fuera de rango razonable (ej: 02:00-04:00 AM para jardinería)
- Múltiples franjas muy cortas (ej: 8 franjas de 30 min cada una)

**Código actual:**
```python
# Solo valida que start < end
if st < en:
    # OK
```

---

## 🔍 ANÁLISIS TÉCNICO

### Tablas Involucradas

**`horario_profesional`** (horario semanal base):
```sql
- id_horario_profesional (UUID, PK)
- id_servicio_profesional (UUID, FK)  ← Identifica el servicio
- dia_semana (int, 0=Lunes...6=Domingo)
- hora_inicio (time)
- hora_fin (time)
```

**`periodo_personalizado`** (rangos de fechas específicos):
```sql
- id_periodo_personalizado (UUID, PK)
- id_servicio_profesional (UUID, FK)  ← Identifica el servicio
- fecha_inicio (timestamp)
- fecha_fin (timestamp)
- hora_inicio (time)
- hora_fin (time)
- descripcion (varchar)
```

**`servicio_profesional`** (servicios del profesional):
```sql
- id_servicio_profesional (UUID, PK)
- rut_usuario (varchar, FK)  ← Identifica al profesional
- id_categoria_servicio (UUID, FK)
- estado_verificacion (enum)
```

### Consulta Crítica Faltante

Para validar solapamiento cross-service, se necesita:

```sql
-- Obtener TODOS los horarios del profesional (no solo un servicio)
SELECT 
    hp.dia_semana, 
    hp.hora_inicio, 
    hp.hora_fin,
    sp.id_servicio_profesional,
    cs.nombre AS categoria
FROM horario_profesional hp
JOIN servicio_profesional sp ON hp.id_servicio_profesional = sp.id_servicio_profesional
JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
WHERE sp.rut_usuario = %s  -- RUT del profesional
  AND sp.id_servicio_profesional != %s  -- Excluir servicio actual
ORDER BY hp.dia_semana, hp.hora_inicio;
```

---

## 🎯 ESCENARIOS DE PRUEBA RECOMENDADOS

### Escenario 1: Profesional con 2 servicios
```
Usuario: 11.570.564-4 (ya tiene 2 servicios)
1. Crear horario Servicio A: Lunes 09:00-13:00
2. Intentar crear horario Servicio B: Lunes 10:00-14:00
   ❌ Debería RECHAZAR (solapa 2 horas)
```

### Escenario 2: Múltiples franjas mismo día
```
Servicio A:
1. Agregar franja: Martes 08:00-12:00
2. Agregar franja: Martes 13:00-17:00  ✅ OK (sin solape)
3. Agregar franja: Martes 11:00-14:00  ❌ Debería RECHAZAR
```

### Escenario 3: Período personalizado vs horario base
```
Horario base: Miércoles 09:00-18:00
Crear período "Navidad" (20-25 dic): Miércoles 08:00-12:00
  ❌ Debería ADVERTIR o validar consistencia
```

---

## 📊 IMPACTO

### Crítico
- ✅ **Aislamiento entre servicios:** Los horarios están correctamente separados por `id_servicio_profesional`
- ❌ **Detección de conflictos:** NO existe validación de solapamiento

### Alto
- Sin validación, un profesional puede:
  1. Aceptar 2 trabajos simultáneos (diferente servicio, misma hora)
  2. Crear horarios inconsistentes dentro del mismo servicio
  3. Generar confusión en clientes al ver disponibilidad incorrecta

### Riesgo Operacional
- Cliente reserva Gasfitería Lunes 10:00
- Cliente reserva Jardinería Lunes 10:00  
- Profesional recibe 2 trabajos simultáneos → **Conflicto garantizado**

---

## ✅ ASPECTOS CORRECTOS

1. **Aislamiento de datos:** Cada servicio tiene sus propios horarios (`id_servicio_profesional` como FK)
2. **Validación de propiedad:** `schedule_detail` verifica que el servicio pertenece al usuario
3. **Validación de fechas pasadas:** No permite bloquear días en el pasado
4. **Fusión de días bloqueados:** Agrupa rangos adyacentes por motivo
5. **Verificación de reservas:** Antes de bloquear días, verifica conflictos con `solicitud_servicio`

---

## 🔧 SOLUCIONES RECOMENDADAS

### Prioridad 1: Validación Cross-Service
```python
def _check_cross_service_overlap(cur, rut_usuario, service_id, day_index, start_time, end_time):
    """Valida si el horario propuesto solapa con otros servicios del profesional"""
    cur.execute("""
        SELECT cs.nombre, hp.hora_inicio, hp.hora_fin
        FROM horario_profesional hp
        JOIN servicio_profesional sp ON hp.id_servicio_profesional = sp.id_servicio_profesional
        JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
        WHERE sp.rut_usuario = %s
          AND sp.id_servicio_profesional != %s
          AND hp.dia_semana = %s
          AND NOT (hp.hora_fin <= %s OR hp.hora_inicio >= %s)
    """, [rut_usuario, service_id, day_index, start_time, end_time])
    
    conflicts = cur.fetchall()
    if conflicts:
        return conflicts  # Retorna lista de servicios en conflicto
    return None
```

### Prioridad 2: Validación Intra-Service
```python
def _check_same_day_overlap(slots: list[TimeSlot], day_name: str):
    """Valida que las franjas del mismo día no se solapen"""
    slots = sorted(slots, key=lambda x: x['start'])
    for i in range(len(slots) - 1):
        if slots[i]['end'] > slots[i+1]['start']:
            return f"Las franjas horarias del {day_name} se solapan"
    return None
```

### Prioridad 3: Validación de Períodos Personalizados
```python
def _check_custom_period_conflicts(cur, service_id, rut_usuario, start_date, end_date, weekly_template):
    """Valida períodos personalizados contra horario base y otros servicios"""
    # 1. Validar contra horario base del mismo servicio
    # 2. Validar contra otros períodos personalizados
    # 3. Validar cross-service (otros servicios del profesional)
    pass
```

---

## 📝 RECOMENDACIONES FINALES

1. **Implementar validación cross-service URGENTE** (Prioridad 1)
2. Agregar validación de solapamiento intra-service (Prioridad 2)
3. Validar períodos personalizados contra horarios base (Prioridad 3)
4. Agregar límites lógicos: duración mínima 30 min, máxima 12 horas
5. Crear endpoint de "preview" para mostrar todos los horarios del profesional
6. Agregar logs de auditoría para cambios de horario

---

**Documento generado:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Usuario reportante:** 11.570.564-4 (profesional con 2 servicios)
**Estado:** Problemas identificados, pendiente implementación de soluciones
