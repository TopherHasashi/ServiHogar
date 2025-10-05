# Sistema de Verificación de Documentos - ServiHogar

## Descripción General

El sistema de verificación de documentos para profesionales en ServiHogar implementa una lógica diferenciada según si es la primera solicitud del profesional o si está agregando servicios adicionales.

## Flujo de Verificación

### 1. Primera Solicitud (Crear Perfil Profesional)

Cuando un usuario solicita convertirse en profesional por primera vez, debe proporcionar:

#### Documentación Obligatoria:
- **Certificado de Antecedentes** (obligatorio, solo se solicita una vez)
  - Puede obtenerse en chileatiende.gob.cl
  - Debe estar vigente
  - Se verifica la identidad del profesional
  
- **Documentación de Experiencia** (obligatorio)
  - Certificados profesionales
  - Cartas de recomendación
  - Facturas o boletas de trabajos anteriores
  - Títulos o diplomas relacionados
  - Portfolio de trabajos
  - Cualquier documento que respalde la experiencia en el servicio solicitado

#### Proceso:
1. Usuario completa formulario inicial con:
   - Información general del perfil profesional
   - Datos del primer servicio a ofrecer
   - Sube certificado de antecedentes
   - Sube documentación de experiencia para ese servicio

2. La solicitud queda con estado `pending` (pendiente de verificación)

3. Verificador revisa:
   - Validez del certificado de antecedentes
   - Autenticidad de la documentación de experiencia
   - Coherencia de la información proporcionada

4. Aprobación/Rechazo:
   - **Aprobado**: El profesional puede comenzar a ofrecer el servicio
   - **Rechazado**: Se notifica al profesional con el motivo del rechazo

5. Después de aprobar, todos los documentos se eliminan automáticamente por seguridad

### 2. Servicios Adicionales

Cuando un profesional ya verificado desea agregar un servicio adicional (por ejemplo, ya ofrece Gasfitería y quiere agregar Limpieza):

#### Documentación Obligatoria:
- **Certificado de Antecedentes**: ❌ NO SE SOLICITA (ya fue verificado en la primera solicitud)
  
- **Documentación de Experiencia**: ✅ SÍ SE SOLICITA (específica para el nuevo servicio)
  - Debe demostrar experiencia en el nuevo servicio específico
  - Certificados del área específica
  - Cartas de recomendación relacionadas al nuevo servicio
  - Facturas/boletas de trabajos anteriores en esa categoría
  - Otros documentos relevantes

#### Proceso:
1. Profesional accede a su panel y selecciona "Agregar Servicio"

2. Completa el formulario del nuevo servicio:
   - Categoría de servicio (Gasfitería, Limpieza, Jardinería)
   - Años de experiencia en ese servicio
   - Descripción específica
   - Configuración de precios y duración
   - **Solo sube documentación de experiencia** (NO certificado de antecedentes)

3. La solicitud del nuevo servicio queda con estado `pending`

4. Verificador revisa:
   - **NO** revisa certificado de antecedentes (ya verificado anteriormente)
   - **SÍ** revisa documentación de experiencia específica para el nuevo servicio
   - Valida que la experiencia sea coherente con el servicio solicitado

5. Aprobación/Rechazo:
   - **Aprobado**: El servicio se agrega al perfil del profesional
   - **Rechazado**: El servicio no se agrega, se notifica al profesional

6. Documentos se eliminan automáticamente después de la verificación

## Límites del Sistema

### Servicios Máximos
Un profesional puede ofrecer hasta **3 servicios** simultáneamente:
- Gasfitería
- Limpieza del Hogar
- Jardinería

### Estado de Servicios
Cada servicio tiene estados independientes:
- `pending`: Pendiente de verificación
- `approved`: Aprobado y activo
- `rejected`: Rechazado
- `suspended`: Suspendido temporalmente

## Interfaz del Verificador

### Vista de Primera Solicitud
```
🔵 Primera Solicitud de Servicio
Esta es la primera vez que este profesional solicita verificación.
Debe incluir certificado de antecedentes + documentación de experiencia.

Documentación Requerida:
✅ Certificado de Antecedentes (obligatorio)
✅ Documentación de experiencia en [Servicio]
```

### Vista de Servicio Adicional
```
🟢 Servicio Adicional
Este profesional ya fue verificado anteriormente.
Solo requiere documentación de experiencia para este nuevo servicio.

Documentación Requerida:
❌ Certificado de Antecedentes (ya verificado)
✅ Documentación de experiencia en [Servicio]
```

## Componentes Implementados

### Cliente (Profesional que solicita)
- **ProfessionalTabMultiService.tsx**: 
  - Formulario inicial con certificado de antecedentes + experiencia
  - Formulario de servicio adicional solo con experiencia
  - Gestión de múltiples servicios
  - Activación/desactivación de servicios

- **ProfessionalTab.tsx**: 
  - Componente legacy con la misma lógica actualizada

### Verificador
- **VerifierDashboard.tsx**:
  - Indicadores visuales de tipo de solicitud
  - Vista diferenciada de documentación requerida
  - Alertas contextuales según el tipo de verificación
  - Proceso de aprobación/rechazo con eliminación automática de documentos

## Base de Datos

### Modelo de Datos

```sql
-- Perfil profesional general
CREATE TABLE perfil_profesional (
  id_perfil_profesional INT PRIMARY KEY,
  id_usuario INT,
  descripcion_general TEXT,
  telefono_profesional VARCHAR(20),
  estado_verificacion_general ENUM('pending', 'approved', 'rejected', 'suspended'),
  promedio_calificacion DECIMAL(2,1),
  trabajos_totales INT,
  ganancias_totales DECIMAL(10,2),
  esta_activo BOOLEAN,
  acepta_nuevos_trabajos BOOLEAN,
  fecha_creacion DATETIME,
  fecha_actualizacion DATETIME
);

-- Servicios individuales del profesional
CREATE TABLE servicio_profesional (
  id_servicio_profesional INT PRIMARY KEY,
  id_perfil_profesional INT,
  id_categoria_servicio INT,
  anos_experiencia VARCHAR(10),
  descripcion_servicio TEXT,
  tipo_duracion ENUM('fixed', 'range'),
  duracion_fija INT,
  duracion_minima INT,
  duracion_maxima INT,
  precio_fijo DECIMAL(10,2),
  esta_activo BOOLEAN,
  esta_disponible BOOLEAN,
  estado_verificacion ENUM('pending', 'approved', 'rejected', 'suspended'),
  calificacion DECIMAL(2,1),
  trabajos_completados INT,
  ganancias_totales DECIMAL(10,2),
  es_primer_servicio BOOLEAN, -- Indica si requiere certificado de antecedentes
  fecha_creacion DATETIME,
  fecha_aprobacion DATETIME
);

-- Documentos de verificación (se eliminan después de aprobar/rechazar)
CREATE TABLE documento_verificacion (
  id_documento INT PRIMARY KEY,
  id_servicio_profesional INT,
  tipo_documento ENUM('antecedentes', 'experiencia', 'certificado', 'titulo'),
  nombre_archivo VARCHAR(255),
  ruta_archivo VARCHAR(500),
  fecha_subida DATETIME,
  estado_verificacion ENUM('pending', 'approved', 'rejected')
);
```

### Lógica de Verificación

```sql
-- Verificar si es la primera solicitud del profesional
SELECT COUNT(*) as total_servicios
FROM servicio_profesional sp
JOIN perfil_profesional pp ON sp.id_perfil_profesional = pp.id_perfil_profesional
WHERE pp.id_usuario = [ID_USUARIO]
AND sp.estado_verificacion = 'approved';

-- Si total_servicios = 0: Es primera solicitud (requiere antecedentes)
-- Si total_servicios > 0: Es servicio adicional (NO requiere antecedentes)
```

## Seguridad y Privacidad

### Eliminación de Documentos
- **Automática**: Los documentos se eliminan inmediatamente después de aprobar o rechazar
- **Irreversible**: No se mantiene copia de los documentos sensibles
- **Cumplimiento**: Protege la privacidad del profesional según normativas de datos personales

### Validación de Certificado de Antecedentes
- Solo se solicita una vez por profesional
- Se valida vigencia y autenticidad
- Una vez aprobado, no se vuelve a solicitar para servicios adicionales

## Flujo Completo - Ejemplo

### Caso: Juan Pérez

1. **Solicitud Inicial - Gasfitería**
   - Juan se registra como profesional
   - Sube certificado de antecedentes ✅
   - Sube certificados de gasfitería ✅
   - Estado: `pending`
   - Verificador aprueba
   - Documentos eliminados
   - Estado: `approved`
   - Juan puede ofrecer servicios de gasfitería ✅

2. **Segundo Servicio - Limpieza**
   - Juan agrega servicio de limpieza
   - **NO** sube certificado de antecedentes ❌ (ya verificado)
   - Sube certificados de limpieza ✅
   - Estado: `pending`
   - Verificador aprueba (solo revisa experiencia en limpieza)
   - Documentos eliminados
   - Estado: `approved`
   - Juan puede ofrecer gasfitería + limpieza ✅

3. **Tercer Servicio - Jardinería**
   - Juan agrega servicio de jardinería
   - **NO** sube certificado de antecedentes ❌ (ya verificado)
   - Sube certificados de jardinería ✅
   - Estado: `pending`
   - Verificador aprueba (solo revisa experiencia en jardinería)
   - Documentos eliminados
   - Estado: `approved`
   - Juan puede ofrecer los 3 servicios ✅

## Mejores Prácticas

### Para Profesionales
1. Mantener documentación organizada y actualizada
2. Subir documentos legibles y de buena calidad
3. Proporcionar documentación específica para cada servicio
4. Actualizar certificaciones cuando sea necesario

### Para Verificadores
1. Verificar cuidadosamente el certificado de antecedentes en la primera solicitud
2. Para servicios adicionales, enfocarse solo en la experiencia del nuevo servicio
3. Ser consistente en los criterios de aprobación
4. Proporcionar feedback claro en caso de rechazo
5. Asegurar la eliminación de documentos después de cada verificación

## Notas Técnicas

- El campo `isFirstService` en el frontend determina qué documentación mostrar
- En backend, se debe validar que no se solicite certificado de antecedentes si ya existe uno aprobado
- Los documentos se almacenan temporalmente solo durante el proceso de verificación
- El sistema mantiene un registro de verificaciones pero no de documentos específicos

---

**Última actualización**: Octubre 2025
**Versión del sistema**: 2.0 - Sistema de Múltiples Servicios con Verificación Diferenciada
