# Problemas Críticos en la Deshabilitación de Servicios

## Resumen Ejecutivo
Análisis del sistema de deshabilitación manual de servicios por parte del trabajador. Se identificaron **5 problemas críticos** que pueden causar inconsistencias de datos, mala experiencia de usuario y conflictos con reservas activas.

---

## Problema 1: NO SE VALIDAN RESERVAS ACTIVAS AL DESHABILITAR ❌

### Descripción
Cuando un trabajador deshabilita un servicio, el endpoint `toggle_service_visibility()` **no verifica si existen reservas futuras activas** para ese servicio.

### Ubicación del Código
**Archivo**: `api/views.py`  
**Línea**: 2362-2410 (función `toggle_service_visibility`)

### Código Problemático
```python
@api_view(['PUT'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def toggle_service_visibility(request, service_id: str):
    # ... validación de ownership ...
    
    # Mapear a estado_verificacion sin validar reservas
    if is_active is False and current_state == 'aprobado':
        new_state = 'suspendido'
    elif is_active is True and current_state == 'suspendido':
        new_state = 'aprobado'
    # ...
```

### ¿Qué debería suceder?
Antes de cambiar el estado a `'suspendido'`, el sistema debería:
1. Consultar la tabla `solicitud_servicio` buscando reservas con:
   - `id_servicio_profesional = service_id`
   - `fecha_programada >= HOY`
   - `estado IN ('pendiente', 'confirmada', 'en_curso')`
2. Si existen reservas futuras, **rechazar** la deshabilitación con un mensaje claro
3. Sugerir al trabajador: "Tienes X reservas futuras. Cancélalas primero o espera a que finalicen."

### Impacto
- **Clientes afectados**: Reservas confirmadas pueden quedar en limbo si el servicio se deshabilita
- **Trabajador**: Puede recibir notificaciones/reclamos de clientes con reservas "desaparecidas"
- **Integridad de datos**: Estado inconsistente entre `servicio_profesional.estado_verificacion='suspendido'` y `solicitud_servicio.estado='confirmada'`

---

## Problema 2: SERVICIO SUSPENDIDO SIGUE MOSTRANDO DISPONIBILIDAD EN CALENDARIO ❌

### Descripción
El endpoint `service_availability()` retorna error 403 para servicios suspendidos, pero **solo si el cliente ya tiene el ID del servicio**. Si el trabajador deshabilita mientras un cliente está viendo el calendario, el frontend puede mostrar horarios disponibles de forma inconsistente.

### Ubicación del Código
**Archivo**: `api/views.py`  
**Línea**: 2415 (función `service_availability`)

### Código Actual
```python
if (estado or '').lower() != 'aprobado':
    return Response({"message": "Servicio no disponible"}, status=status.HTTP_403_FORBIDDEN)
```

### ¿Qué falta?
El frontend **no maneja el error 403** de forma clara. Si un cliente ya cargó la disponibilidad y el trabajador deshabilita el servicio, el cliente puede intentar reservar en un cupo "fantasma".

### Impacto
- **Cliente**: Intenta reservar → recibe error genérico → mala experiencia
- **Trabajador**: Puede recibir intentos fallidos de reserva que generan confusión
- **Frontend**: Debería invalidar el caché de disponibilidad si recibe 403

---

## Problema 3: BÚSQUEDA PÚBLICA EXCLUYE SUSPENDIDOS, PERO NO HAY FEEDBACK ❌

### Descripción
El endpoint `services_search()` filtra correctamente servicios suspendidos (`WHERE sp.estado_verificacion = 'aprobado'`), pero si un cliente tenía guardado el servicio (ej: en favoritos o historial de navegación), no sabrá por qué desapareció.

### Ubicación del Código
**Archivo**: `api/views.py`  
**Línea**: 2226

### Código Actual
```python
WHERE sp.estado_verificacion = 'aprobado'
```

### Comportamiento Actual
1. Cliente busca servicios → ve servicio X
2. Cliente guarda enlace/favorito del servicio X
3. Trabajador deshabilita servicio X
4. Cliente regresa al enlace → servicio desapareció sin explicación

### ¿Qué debería suceder?
Si un cliente tiene un enlace directo a un servicio suspendido:
- Mostrar mensaje: "Este servicio está temporalmente suspendido por el profesional."
- Sugerir servicios similares de la misma categoría
- Permitir "seguir" al profesional para recibir notificación cuando reactive

### Impacto
- **Cliente**: Confusión sobre por qué el servicio desapareció
- **Trabajador**: Pierde clientes potenciales sin posibilidad de recuperarlos

---

## Problema 4: NO SE NOTIFICA AL TRABAJADOR SOBRE IMPACTO DE LA DESHABILITACIÓN ⚠️

### Descripción
El frontend muestra un simple switch on/off sin advertencias sobre las consecuencias de deshabilitar el servicio.

### Ubicación del Código
**Archivo**: `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`  
**Línea**: 225 (función `handleToggleServiceActive`)

### Código Actual
```typescript
const handleToggleServiceActive = async (serviceId: string) => {
  // Validación básica de UUID
  if (!isValidUUID(serviceId)) {
    alert('ID de servicio inválido.');
    return;
  }

  // Actualización optimista sin warnings
  setProfessionalServices((prev) =>
    prev.map((srv) =>
      srv.serviceId === serviceId
        ? { ...srv, isActive: !srv.isActive }
        : srv
    )
  );

  try {
    const response = await api.put(`/api/services/${serviceId}/visibility/`, {
      is_active: !professionalServices.find((s) => s.serviceId === serviceId)?.isActive,
    });
    // ...
```

### ¿Qué debería incluir?
Antes de llamar al endpoint, mostrar un diálogo de confirmación:

```typescript
if (!currentService.isActive) {
  // Intentando HABILITAR → sin restricciones
  // proceder normalmente
} else {
  // Intentando DESHABILITAR → verificar impacto
  const confirm = window.confirm(
    "⚠️ Advertencia: Al deshabilitar este servicio:\n" +
    "• No aparecerás en búsquedas públicas\n" +
    "• Los clientes no podrán reservar nuevos cupos\n" +
    "• Si tienes reservas futuras, debes cancelarlas primero\n\n" +
    "¿Deseas continuar?"
  );
  if (!confirm) return;
}
```

### Impacto
- **Trabajador**: Puede deshabilitar accidentalmente sin entender las consecuencias
- **Soporte**: Aumento de tickets "¿por qué no aparezco en búsquedas?"

---

## Problema 5: ESTADOS PENDIENTE Y RECHAZADO NO SE CONSIDERAN AL ALTERNAR ⚠️

### Descripción
La función `toggle_service_visibility()` solo maneja las transiciones:
- `aprobado` → `suspendido` (cuando is_active=false)
- `suspendido` → `aprobado` (cuando is_active=true)

Pero **no valida qué pasa si el servicio está en `'pendiente'` o `'rechazado'`**.

### Ubicación del Código
**Archivo**: `api/views.py`  
**Línea**: 2392-2404

### Código Problemático
```python
# Mapear a estado_verificacion
if is_active is False and current_state == 'aprobado':
    new_state = 'suspendido'
elif is_active is True and current_state == 'suspendido':
    new_state = 'aprobado'
else:
    # Si no es ninguna de estas transiciones, mantener estado actual
    new_state = current_state
```

### Escenarios No Manejados

#### Escenario A: Servicio en estado `'pendiente'`
- **Situación**: Trabajador envió servicio para verificación pero aún no fue aprobado
- **Problema**: El switch aparece habilitado en el frontend, pero alternar no hace nada útil
- **Solución**: Deshabilitar el switch si `estado_verificacion != 'aprobado' AND != 'suspendido'`

#### Escenario B: Servicio en estado `'rechazado'`
- **Situación**: Verificador rechazó el servicio por documentos inválidos
- **Problema**: Trabajador puede intentar "activar" un servicio rechazado, lo cual no tiene sentido
- **Solución**: Mostrar mensaje "Servicio rechazado. Corrige los problemas antes de publicar."

### Impacto
- **Trabajador**: Confusión sobre por qué el switch no funciona
- **Lógica de negocio**: Estados inconsistentes si se fuerza un cambio

---

## Solución Recomendada: Implementación Paso a Paso

### Paso 1: Validar Reservas Activas en Backend

**Archivo**: `api/views.py` → función `toggle_service_visibility()`

```python
@api_view(['PUT'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def toggle_service_visibility(request, service_id: str):
    # ... código existente de validación de ownership ...
    
    # NUEVO: Si intentan deshabilitar, verificar reservas futuras
    if is_active is False and current_state == 'aprobado':
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) 
                FROM solicitud_servicio
                WHERE id_servicio_profesional = %s
                  AND fecha_programada >= CURRENT_DATE
                  AND estado IN ('pendiente', 'confirmada', 'en_curso')
                """,
                [service_id_str]
            )
            count = cur.fetchone()[0]
            
        if count > 0:
            return Response(
                {
                    "ok": False,
                    "message": f"No puedes deshabilitar este servicio porque tienes {count} reserva(s) futura(s) activa(s). Cancélalas primero o espera a que finalicen.",
                    "active_reservations": count
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_state = 'suspendido'
    elif is_active is True and current_state == 'suspendido':
        new_state = 'aprobado'
    else:
        # Validar estados no permitidos
        if current_state not in ('aprobado', 'suspendido'):
            return Response(
                {
                    "ok": False,
                    "message": f"No puedes cambiar la visibilidad de un servicio en estado '{current_state}'. Solo servicios aprobados o suspendidos pueden alternarse."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        new_state = current_state
    
    # ... resto del código para actualizar estado ...
```

---

### Paso 2: Mejorar Manejo de Errores en Frontend

**Archivo**: `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`

```typescript
const handleToggleServiceActive = async (serviceId: string) => {
  if (!isValidUUID(serviceId)) {
    alert('ID de servicio inválido.');
    return;
  }

  const currentService = professionalServices.find((s) => s.serviceId === serviceId);
  if (!currentService) return;

  // NUEVO: Advertencia si intenta deshabilitar
  if (currentService.isActive) {
    const confirm = window.confirm(
      "⚠️ Al deshabilitar este servicio:\n\n" +
      "• No aparecerás en búsquedas públicas\n" +
      "• Los clientes no podrán reservar\n" +
      "• Debes cancelar reservas futuras primero\n\n" +
      "¿Continuar?"
    );
    if (!confirm) return;
  }

  // Actualización optimista
  setProfessionalServices((prev) =>
    prev.map((srv) =>
      srv.serviceId === serviceId
        ? { ...srv, isActive: !srv.isActive }
        : srv
    )
  );

  try {
    const response = await api.put(`/api/services/${serviceId}/visibility/`, {
      is_active: !currentService.isActive,
    });

    if (!response.data.ok) {
      throw new Error(response.data.message || 'Error al cambiar visibilidad');
    }
  } catch (error: any) {
    // Rollback optimista
    setProfessionalServices((prev) =>
      prev.map((srv) =>
        srv.serviceId === serviceId
          ? { ...srv, isActive: currentService.isActive }
          : srv
      )
    );

    // NUEVO: Mostrar mensajes específicos del backend
    const errorMsg = error.response?.data?.message || error.message || 'Error al cambiar estado del servicio';
    
    // Si hay reservas activas, mostrar alerta especial
    if (error.response?.data?.active_reservations) {
      alert(
        `❌ ${errorMsg}\n\n` +
        `Reservas futuras: ${error.response.data.active_reservations}\n\n` +
        "Ve a la pestaña 'Reservas' para gestionarlas."
      );
    } else {
      alert(`❌ ${errorMsg}`);
    }
  }
};
```

---

### Paso 3: Deshabilitar Switch para Estados No Válidos

**Archivo**: `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`

En la sección donde renderizas el switch:

```typescript
<Switch
  checked={service.isActive}
  onCheckedChange={() => handleToggleServiceActive(service.serviceId)}
  disabled={
    service.verificationStatus !== 'aprobado' && 
    service.verificationStatus !== 'suspendido'
  }
  aria-label={`Alternar visibilidad de ${service.categoryName}`}
/>

{/* NUEVO: Tooltip explicativo */}
{(service.verificationStatus === 'pendiente' || service.verificationStatus === 'rechazado') && (
  <span className="text-xs text-muted-foreground">
    {service.verificationStatus === 'pendiente' 
      ? 'En verificación - no puedes cambiar visibilidad aún' 
      : 'Servicio rechazado - corrige los problemas primero'}
  </span>
)}
```

---

### Paso 4: Invalidar Caché de Disponibilidad en Cliente

**Archivo**: `frontend/src/components/user/ProfessionalScheduleManagerAdvanced.tsx`

Si un cliente está viendo disponibilidad y recibe un 403:

```typescript
const fetchAvailability = async (serviceId: string, startDate: string, endDate: string) => {
  try {
    const response = await api.get(`/api/services/${serviceId}/availability/`, {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 403) {
      // Servicio suspendido o no disponible
      alert(
        "⚠️ Este servicio ya no está disponible.\n\n" +
        "El profesional puede haberlo suspendido temporalmente. " +
        "Te recomendamos buscar servicios similares."
      );
      // Limpiar datos locales y redirigir a búsqueda
      navigate('/servicios');
      return null;
    }
    throw error;
  }
};
```

---

## Checklist de Validación

Para asegurar que la deshabilitación funciona correctamente, ejecutar estas pruebas:

### ✅ Test 1: Deshabilitar sin reservas futuras
- **Acción**: Trabajador con servicio aprobado y SIN reservas futuras intenta deshabilitar
- **Esperado**: ✅ Servicio cambia a `estado_verificacion='suspendido'` exitosamente
- **Verificar**: Ya no aparece en búsqueda pública (`services_search`)

### ✅ Test 2: Deshabilitar CON reservas futuras
- **Acción**: Trabajador con servicio aprobado y CON 2 reservas confirmadas futuras intenta deshabilitar
- **Esperado**: ❌ Backend rechaza con HTTP 400 y mensaje "tienes 2 reserva(s) futura(s) activa(s)"
- **Verificar**: Estado sigue siendo `'aprobado'`, frontend muestra alerta clara

### ✅ Test 3: Re-habilitar servicio suspendido
- **Acción**: Trabajador con servicio suspendido intenta habilitar
- **Esperado**: ✅ Servicio cambia a `estado_verificacion='aprobado'` exitosamente
- **Verificar**: Aparece nuevamente en búsqueda pública

### ✅ Test 4: Intentar alternar servicio pendiente
- **Acción**: Trabajador con servicio en `estado_verificacion='pendiente'` intenta usar el switch
- **Esperado**: ❌ Switch deshabilitado en UI, tooltip explica "En verificación"
- **Verificar**: No se hace ninguna llamada al backend

### ✅ Test 5: Intentar alternar servicio rechazado
- **Acción**: Trabajador con servicio en `estado_verificacion='rechazado'` intenta usar el switch
- **Esperado**: ❌ Switch deshabilitado en UI, tooltip explica "Servicio rechazado"
- **Verificar**: No se hace ninguna llamada al backend

### ✅ Test 6: Cliente intenta reservar servicio suspendido
- **Acción**: Cliente obtiene ID de servicio suspendido e intenta llamar `service_availability()`
- **Esperado**: ❌ HTTP 403 con mensaje "Servicio no disponible"
- **Verificar**: Cliente ve mensaje claro y es redirigido a búsqueda

### ✅ Test 7: Cliente intenta booking directo de servicio suspendido
- **Acción**: Cliente intenta POST a `service_book()` con ID de servicio suspendido
- **Esperado**: ❌ HTTP 403 con mensaje "Servicio no disponible"
- **Verificar**: No se crea registro en `solicitud_servicio`

---

## Prioridad de Implementación

### 🔴 CRÍTICO (Implementar inmediatamente)
1. **Problema 1**: Validar reservas activas antes de deshabilitar
   - Evita inconsistencias graves de datos
   - Protege la experiencia del cliente

### 🟠 ALTO (Implementar esta semana)
2. **Problema 4**: Advertencias al trabajador antes de deshabilitar
   - Previene errores accidentales
   - Mejora UX del trabajador

3. **Problema 5**: Validar estados pendiente/rechazado
   - Evita confusión en trabajadores
   - Mejora robustez del sistema

### 🟡 MEDIO (Implementar próxima iteración)
4. **Problema 2**: Invalidar caché de disponibilidad en cliente
   - Mejora UX del cliente
   - Evita intentos fallidos de reserva

5. **Problema 3**: Feedback sobre servicios suspendidos
   - Mejora transparencia
   - Reduce confusión de clientes

---

## Archivos a Modificar

1. `api/views.py`:
   - Línea 2362: función `toggle_service_visibility()` → agregar validación de reservas

2. `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`:
   - Línea 225: función `handleToggleServiceActive()` → agregar advertencia y manejo de errores
   - Línea ~120: renderizado del Switch → agregar lógica de `disabled` para estados no válidos

3. `frontend/src/components/user/ProfessionalScheduleManagerAdvanced.tsx`:
   - Línea ~80: función de fetch de disponibilidad → manejar error 403 con redirección

---

## Conclusión

La funcionalidad de deshabilitación de servicios **tiene lógica correcta en cuanto a cambios de estado**, pero carece de validaciones críticas que pueden causar:
- ❌ Reservas confirmadas en servicios suspendidos (inconsistencia de datos)
- ❌ Trabajadores deshabilitando accidentalmente sin entender consecuencias
- ❌ Clientes intentando reservar servicios "fantasma"
- ❌ Estados inválidos no manejados (pendiente/rechazado)

**Todas estas validaciones deben implementarse antes de liberar a producción.**
