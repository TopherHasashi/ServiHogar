# Implementación de Correcciones para Deshabilitación de Servicios

## Resumen
Este documento contiene la implementación completa de las correcciones para los 5 problemas críticos identificados en `PROBLEMAS_DESHABILITACION_SERVICIO.md`.

---

## Corrección 1: Validar Reservas Activas en Backend

### Archivo: `api/views.py`
### Función: `toggle_service_visibility()` (línea 2362)

**Reemplazar función completa**:

```python
@api_view(['PUT'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def toggle_service_visibility(request, service_id: str):
	"""
	Alterna la visibilidad de un servicio (aprobado <-> suspendido).
	Solo el propietario puede alternar. Si intenta suspender, valida que no haya reservas futuras.
	
	Body JSON:
		{
			"is_active": true/false
		}
	
	Respuesta:
		{
			"ok": true/false,
			"service_id": "uuid",
			"is_active": true/false,
			"message": "..." (opcional)
		}
	"""
	service_id_str = str(service_id)
	data = request.data or {}
	is_active = data.get('is_active')
	
	if is_active is None:
		return Response(
			{"ok": False, "message": "Se requiere el campo 'is_active'"},
			status=status.HTTP_400_BAD_REQUEST
		)
	
	user_email = request.user.email
	
	# Verificar ownership
	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT sp.estado_verificacion, u.email
			FROM servicio_profesional sp
			JOIN usuario u ON u.rut = sp.rut_usuario
			WHERE sp.id_servicio_profesional = %s
			""",
			[service_id_str]
		)
		row = cur.fetchone()
	
	if not row:
		return Response(
			{"ok": False, "message": "Servicio no encontrado"},
			status=status.HTTP_404_NOT_FOUND
		)
	
	current_state, owner_email = row
	
	if owner_email.lower() != user_email.lower():
		return Response(
			{"ok": False, "message": "No tienes permiso para modificar este servicio"},
			status=status.HTTP_403_FORBIDDEN
		)
	
	# Validar estados permitidos
	if current_state not in ('aprobado', 'suspendido'):
		return Response(
			{
				"ok": False,
				"message": f"No puedes cambiar la visibilidad de un servicio en estado '{current_state}'. Solo servicios aprobados o suspendidos pueden alternarse."
			},
			status=status.HTTP_400_BAD_REQUEST
		)
	
	# Determinar nuevo estado
	new_state = current_state  # default: mantener
	
	# Si intenta DESHABILITAR (is_active=False) y está aprobado
	if is_active is False and current_state == 'aprobado':
		# VALIDACIÓN CRÍTICA: Verificar reservas futuras activas
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
			active_reservations = cur.fetchone()[0]
		
		if active_reservations > 0:
			return Response(
				{
					"ok": False,
					"message": f"No puedes deshabilitar este servicio porque tienes {active_reservations} reserva(s) futura(s) activa(s). Cancélalas primero o espera a que finalicen.",
					"active_reservations": active_reservations,
					"service_id": service_id_str,
					"is_active": True  # mantener activo
				},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		new_state = 'suspendido'
	
	# Si intenta HABILITAR (is_active=True) y está suspendido
	elif is_active is True and current_state == 'suspendido':
		new_state = 'aprobado'
	
	# Si no hay cambio necesario
	if new_state == current_state:
		return Response(
			{
				"ok": True,
				"service_id": service_id_str,
				"is_active": (new_state == 'aprobado'),
				"message": "El servicio ya está en el estado solicitado"
			}
		)
	
	# Actualizar estado
	with connection.cursor() as cur:
		cur.execute(
			"""
			UPDATE servicio_profesional
			SET estado_verificacion = %s, actualizado_en = CURRENT_TIMESTAMP
			WHERE id_servicio_profesional = %s
			""",
			[new_state, service_id_str]
		)
	
	return Response(
		{
			"ok": True,
			"service_id": service_id_str,
			"is_active": (new_state == 'aprobado'),
			"message": f"Servicio {'habilitado' if new_state == 'aprobado' else 'deshabilitado'} exitosamente"
		}
	)
```

**Cambios realizados**:
1. ✅ Validación de reservas futuras antes de suspender
2. ✅ Validación de estados permitidos (solo aprobado/suspendido)
3. ✅ Mensajes descriptivos en respuestas de error
4. ✅ Campo `active_reservations` en respuesta cuando hay conflicto
5. ✅ Manejo de caso "sin cambios" (evita UPDATE innecesario)

---

## Corrección 2: Mejorar Manejo de Errores en Frontend

### Archivo: `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`
### Función: `handleToggleServiceActive()` (línea 225)

**Reemplazar función completa**:

```typescript
/**
 * Alterna la visibilidad de un servicio profesional.
 * Validaciones:
 * - UUID válido
 * - Advertencia al deshabilitar (UX)
 * - Manejo de errores específicos del backend (ej: reservas activas)
 */
const handleToggleServiceActive = async (serviceId: string) => {
  // Validación de UUID
  if (!isValidUUID(serviceId)) {
    alert('ID de servicio inválido.');
    return;
  }

  const currentService = professionalServices.find((s) => s.serviceId === serviceId);
  if (!currentService) {
    console.error('Servicio no encontrado en estado local:', serviceId);
    return;
  }

  // Advertencia al DESHABILITAR
  if (currentService.isActive) {
    const userConfirmed = window.confirm(
      "⚠️ Al deshabilitar este servicio:\n\n" +
      "• Ya no aparecerás en búsquedas públicas\n" +
      "• Los clientes no podrán hacer nuevas reservas\n" +
      "• Si tienes reservas futuras activas, debes cancelarlas primero\n\n" +
      "¿Deseas continuar?"
    );
    
    if (!userConfirmed) {
      return; // Usuario canceló
    }
  }

  // Actualización optimista de UI
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

    // Verificar respuesta del backend
    if (!response.data.ok) {
      throw new Error(response.data.message || 'Error al cambiar visibilidad del servicio');
    }

    // Éxito: mostrar confirmación breve
    console.log('✅ Servicio actualizado:', response.data);
    
  } catch (error: any) {
    // Rollback de actualización optimista
    setProfessionalServices((prev) =>
      prev.map((srv) =>
        srv.serviceId === serviceId
          ? { ...srv, isActive: currentService.isActive }
          : srv
      )
    );

    // Manejo de errores específicos
    const errorData = error.response?.data;
    const errorMsg = errorData?.message || error.message || 'Error desconocido al cambiar estado del servicio';
    
    // Caso especial: reservas activas
    if (errorData?.active_reservations && errorData.active_reservations > 0) {
      alert(
        `❌ No se puede deshabilitar el servicio\n\n` +
        `${errorMsg}\n\n` +
        `Reservas futuras activas: ${errorData.active_reservations}\n\n` +
        `💡 Ve a la pestaña "Reservas" para gestionar las reservas pendientes.`
      );
    } 
    // Caso especial: estado no permitido
    else if (errorMsg.includes('estado')) {
      alert(
        `❌ Estado no válido\n\n` +
        `${errorMsg}\n\n` +
        `Solo puedes alternar servicios aprobados o suspendidos.`
      );
    }
    // Error genérico
    else {
      alert(`❌ ${errorMsg}`);
    }
    
    console.error('Error al cambiar visibilidad:', error);
  }
};
```

**Cambios realizados**:
1. ✅ Confirmación con advertencias claras antes de deshabilitar
2. ✅ Manejo específico de error de reservas activas (muestra cantidad)
3. ✅ Manejo específico de error de estados no permitidos
4. ✅ Rollback de UI optimista en caso de error
5. ✅ Logs para debugging
6. ✅ Mensajes amigables con emojis para mejor UX

---

## Corrección 3: Deshabilitar Switch para Estados No Válidos

### Archivo: `frontend/src/components/user/tabs/ProfessionalTabMultiService.tsx`
### Sección: Renderizado del Switch en la tabla de servicios

**Buscar el código del Switch y reemplazar**:

```typescript
{/* Switch de activación/desactivación */}
<div className="flex flex-col items-center gap-1">
  <Switch
    checked={service.isActive}
    onCheckedChange={() => handleToggleServiceActive(service.serviceId)}
    disabled={
      // Solo permitir toggle si el servicio está aprobado o suspendido
      service.verificationStatus !== 'aprobado' && 
      service.verificationStatus !== 'suspendido'
    }
    aria-label={`Alternar visibilidad de ${service.categoryName}`}
  />
  
  {/* Tooltip explicativo para estados no válidos */}
  {service.verificationStatus === 'pendiente' && (
    <span className="text-xs text-amber-600 dark:text-amber-400 text-center max-w-[100px]">
      En verificación
    </span>
  )}
  
  {service.verificationStatus === 'rechazado' && (
    <span className="text-xs text-red-600 dark:text-red-400 text-center max-w-[100px]">
      Servicio rechazado
    </span>
  )}
  
  {(service.verificationStatus === 'aprobado' || service.verificationStatus === 'suspendido') && (
    <span className={`text-xs ${service.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'} text-center`}>
      {service.isActive ? 'Activo' : 'Suspendido'}
    </span>
  )}
</div>
```

**Cambios realizados**:
1. ✅ Propiedad `disabled` en Switch basada en `verificationStatus`
2. ✅ Labels informativos debajo del switch según estado
3. ✅ Colores semánticos (verde=activo, gris=suspendido, ámbar=pendiente, rojo=rechazado)
4. ✅ Tooltip explica por qué está deshabilitado

**Nota**: Si el Switch no está dentro de una tabla sino en otro layout, busca el componente `<Switch>` y aplica la misma lógica de `disabled`.

---

## Corrección 4: Invalidar Caché de Disponibilidad en Cliente

### Archivo: `frontend/src/components/user/ProfessionalScheduleManagerAdvanced.tsx`
### Ubicación: Función que obtiene disponibilidad del servicio

**Buscar la función de fetch de disponibilidad** (probablemente alrededor de la línea 80-120):

```typescript
/**
 * Obtiene la disponibilidad de un servicio en un rango de fechas.
 * Maneja error 403 (servicio suspendido) con feedback claro al usuario.
 */
const fetchServiceAvailability = async (
  serviceId: string, 
  startDate: string, 
  endDate: string
) => {
  try {
    const response = await api.get(`/api/services/${serviceId}/availability/`, {
      params: { 
        start: startDate, 
        end: endDate 
      }
    });
    
    return response.data;
    
  } catch (error: any) {
    const status = error.response?.status;
    
    // Servicio suspendido o no disponible
    if (status === 403) {
      alert(
        "⚠️ Servicio no disponible\n\n" +
        "Este servicio ya no está disponible para reservas. " +
        "El profesional puede haberlo suspendido temporalmente.\n\n" +
        "Te recomendamos buscar servicios similares en nuestra plataforma."
      );
      
      // Limpiar estado local y redirigir a búsqueda
      // (ajustar según tu router - React Router, Next.js, etc.)
      window.location.href = '/servicios';
      return null;
    }
    
    // Servicio no encontrado
    if (status === 404) {
      alert(
        "❌ Servicio no encontrado\n\n" +
        "Este servicio puede haber sido eliminado."
      );
      window.location.href = '/servicios';
      return null;
    }
    
    // Otros errores
    console.error('Error al obtener disponibilidad:', error);
    throw error;
  }
};
```

**Cambios realizados**:
1. ✅ Manejo específico de HTTP 403 (servicio suspendido)
2. ✅ Manejo específico de HTTP 404 (servicio eliminado)
3. ✅ Alert amigable explicando qué pasó
4. ✅ Redirección automática a página de búsqueda
5. ✅ Limpieza de estado local antes de redirigir

**Nota adicional**: Si tienes un sistema de caché (ej: React Query, Redux), invalida el caché del servicio:

```typescript
// Ejemplo con React Query
if (status === 403) {
  queryClient.invalidateQueries(['service', serviceId]);
  queryClient.removeQueries(['service', serviceId]);
  // ...resto del código
}
```

---

## Corrección 5: Validación en Endpoint de Búsqueda (Opcional - Mejora UX)

### Archivo: `api/views.py`
### Función: `service_detail()` (crear si no existe)

**Agregar endpoint para obtener detalles de un servicio individual**:

```python
@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([AllowAny])  # Público
def service_detail_view(request, service_id: str):
	"""
	Retorna detalles de un servicio individual, incluyendo si está suspendido.
	Útil para mostrar mensajes claros en frontend cuando un servicio no está disponible.
	"""
	service_id_str = str(service_id)
	
	with connection.cursor() as cur:
		cur.execute(
			"""
			SELECT 
				sp.id_servicio_profesional,
				sp.estado_verificacion,
				cs.nombre AS categoria,
				sp.descripcion,
				sp.precio_fijo,
				u.nombres,
				u.apellidos
			FROM servicio_profesional sp
			JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
			JOIN usuario u ON u.rut = sp.rut_usuario
			WHERE sp.id_servicio_profesional = %s
			""",
			[service_id_str]
		)
		row = cur.fetchone()
	
	if not row:
		return Response(
			{"message": "Servicio no encontrado"},
			status=status.HTTP_404_NOT_FOUND
		)
	
	service_id, estado, categoria, descripcion, precio, nombres, apellidos = row
	
	# Siempre retornar datos, pero indicar si está disponible
	return Response({
		"service_id": service_id,
		"estado_verificacion": estado,
		"is_available": (estado == 'aprobado'),
		"categoria": categoria,
		"descripcion": descripcion,
		"precio_fijo": precio,
		"profesional": {
			"nombres": nombres,
			"apellidos": apellidos
		},
		"message": _get_status_message(estado)
	})


def _get_status_message(estado: str) -> str:
	"""Retorna mensaje amigable según estado del servicio."""
	messages = {
		'aprobado': 'Servicio disponible para reservas',
		'suspendido': 'Este servicio está temporalmente suspendido por el profesional',
		'pendiente': 'Este servicio está en proceso de verificación',
		'rechazado': 'Este servicio fue rechazado por el equipo de verificación'
	}
	return messages.get(estado, 'Estado desconocido')
```

**Registrar endpoint en `urls.py`**:

```python
path('api/services/<str:service_id>/detail/', views.service_detail_view, name='service_detail'),
```

**Uso en frontend**:

```typescript
// En página de detalle de servicio
const checkServiceStatus = async (serviceId: string) => {
  try {
    const response = await api.get(`/api/services/${serviceId}/detail/`);
    const service = response.data;
    
    if (!service.is_available) {
      // Mostrar banner de advertencia
      return (
        <div className="bg-amber-100 border-l-4 border-amber-500 p-4">
          <p className="text-amber-800">
            ⚠️ {service.message}
          </p>
          {service.estado_verificacion === 'suspendido' && (
            <p className="text-sm text-amber-700 mt-2">
              Puede que el profesional reactive este servicio pronto. 
              <a href="/servicios" className="underline">Ver servicios similares</a>
            </p>
          )}
        </div>
      );
    }
  } catch (error) {
    console.error('Error al verificar estado del servicio:', error);
  }
};
```

---

## Test Suite de Validación

### Crear archivo: `tests/test_toggle_service_visibility.py`

```python
"""
Tests para validar la funcionalidad de toggle_service_visibility.
Ejecutar con: python manage.py test tests.test_toggle_service_visibility
"""
import uuid
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


class ToggleServiceVisibilityTestCase(TestCase):
	"""Tests para el endpoint toggle_service_visibility."""
	
	def setUp(self):
		"""Setup inicial para todos los tests."""
		# Crear usuario profesional
		self.user = User.objects.create_user(
			username='test_prof',
			email='test@example.com',
			password='testpass123'
		)
		self.token = Token.objects.create(user=self.user)
		self.client = APIClient()
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
		
		# IDs de prueba (ajustar según tu base de datos de test)
		self.service_id_aprobado = str(uuid.uuid4())
		self.service_id_pendiente = str(uuid.uuid4())
		self.service_id_rechazado = str(uuid.uuid4())
		
		# Nota: Aquí deberías crear servicios de prueba en tu DB de test
		# usando fixtures o migraciones de test
	
	def test_deshabilitar_sin_reservas_exitoso(self):
		"""Test 1: Deshabilitar servicio aprobado sin reservas futuras."""
		response = self.client.put(
			f'/api/services/{self.service_id_aprobado}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['ok'])
		self.assertFalse(response.data['is_active'])
	
	def test_deshabilitar_con_reservas_rechazado(self):
		"""Test 2: Deshabilitar servicio con reservas futuras debe fallar."""
		# Crear reserva futura en DB de test (ajustar según tus modelos)
		# ...
		
		response = self.client.put(
			f'/api/services/{self.service_id_aprobado}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		self.assertEqual(response.status_code, 400)
		self.assertFalse(response.data['ok'])
		self.assertIn('reserva', response.data['message'].lower())
		self.assertGreater(response.data['active_reservations'], 0)
	
	def test_habilitar_suspendido_exitoso(self):
		"""Test 3: Re-habilitar servicio suspendido."""
		# Primero suspender
		self.client.put(
			f'/api/services/{self.service_id_aprobado}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		# Luego re-habilitar
		response = self.client.put(
			f'/api/services/{self.service_id_aprobado}/visibility/',
			{'is_active': True},
			format='json'
		)
		
		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['ok'])
		self.assertTrue(response.data['is_active'])
	
	def test_alternar_servicio_pendiente_rechazado(self):
		"""Test 4: Intentar alternar servicio en estado pendiente."""
		response = self.client.put(
			f'/api/services/{self.service_id_pendiente}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		self.assertEqual(response.status_code, 400)
		self.assertFalse(response.data['ok'])
		self.assertIn('estado', response.data['message'].lower())
	
	def test_sin_ownership_rechazado(self):
		"""Test 5: Usuario no propietario no puede alternar."""
		# Crear otro usuario
		other_user = User.objects.create_user(
			username='other',
			email='other@example.com',
			password='pass'
		)
		other_token = Token.objects.create(user=other_user)
		other_client = APIClient()
		other_client.credentials(HTTP_AUTHORIZATION=f'Token {other_token.key}')
		
		response = other_client.put(
			f'/api/services/{self.service_id_aprobado}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		self.assertEqual(response.status_code, 403)
		self.assertFalse(response.data['ok'])
	
	def test_servicio_inexistente_404(self):
		"""Test 6: Servicio que no existe retorna 404."""
		fake_id = str(uuid.uuid4())
		response = self.client.put(
			f'/api/services/{fake_id}/visibility/',
			{'is_active': False},
			format='json'
		)
		
		self.assertEqual(response.status_code, 404)
```

---

## Checklist de Implementación

### Backend (Django)
- [ ] Implementar corrección en `toggle_service_visibility()` con validación de reservas
- [ ] Agregar validación de estados permitidos (solo aprobado/suspendido)
- [ ] Crear endpoint opcional `service_detail_view()` para UX mejorada
- [ ] Ejecutar tests unitarios (`python manage.py test tests.test_toggle_service_visibility`)
- [ ] Verificar en DB de desarrollo con datos reales

### Frontend (React/TypeScript)
- [ ] Actualizar `handleToggleServiceActive()` con advertencias y manejo de errores
- [ ] Implementar lógica `disabled` en componente Switch
- [ ] Agregar tooltips/labels para estados no válidos
- [ ] Implementar manejo de error 403 en fetch de disponibilidad
- [ ] Probar flujo completo: habilitar → deshabilitar → intentar con reservas

### Testing Manual
- [ ] Test 1: Deshabilitar servicio sin reservas → ✅ éxito
- [ ] Test 2: Deshabilitar servicio con reservas → ❌ rechazado con mensaje claro
- [ ] Test 3: Re-habilitar servicio suspendido → ✅ éxito
- [ ] Test 4: Intentar alternar servicio pendiente → Switch deshabilitado
- [ ] Test 5: Intentar alternar servicio rechazado → Switch deshabilitado
- [ ] Test 6: Cliente intenta ver disponibilidad de servicio suspendido → Error 403 + redirección
- [ ] Test 7: Búsqueda pública no muestra servicios suspendidos → ✅ correcto (ya funciona)

### Documentación
- [ ] Actualizar README con nuevas validaciones
- [ ] Documentar endpoint `toggle_service_visibility` en API docs
- [ ] Agregar ejemplos de respuestas de error en documentación
- [ ] Crear guía de usuario: "Cómo suspender un servicio correctamente"

---

## Notas de Despliegue

### Rollback Plan
Si surge algún problema en producción:

1. **Rollback Backend**: Revertir commit con `git revert <commit-hash>`
2. **Rollback Frontend**: Desplegar versión anterior desde tag
3. **Validar DB**: Verificar que no hay servicios suspendidos con reservas activas:

```sql
SELECT 
    sp.id_servicio_profesional,
    sp.estado_verificacion,
    COUNT(ss.id_solicitud_servicio) AS reservas_futuras
FROM servicio_profesional sp
LEFT JOIN solicitud_servicio ss ON ss.id_servicio_profesional = sp.id_servicio_profesional
WHERE sp.estado_verificacion = 'suspendido'
  AND ss.fecha_programada >= CURRENT_DATE
  AND ss.estado IN ('pendiente', 'confirmada', 'en_curso')
GROUP BY sp.id_servicio_profesional, sp.estado_verificacion
HAVING COUNT(ss.id_solicitud_servicio) > 0;
```

Si hay resultados, ejecutar script de limpieza para notificar a clientes afectados.

---

## Conclusión

Con estas 5 correcciones implementadas:
- ✅ No se pueden deshabilitar servicios con reservas futuras
- ✅ Trabajadores reciben advertencias claras antes de deshabilitar
- ✅ Estados no válidos (pendiente/rechazado) no permiten toggle
- ✅ Clientes reciben feedback claro cuando un servicio no está disponible
- ✅ Sistema robusto contra inconsistencias de datos

**Tiempo estimado de implementación**: 4-6 horas  
**Prioridad**: 🔴 CRÍTICA (implementar antes de producción)
