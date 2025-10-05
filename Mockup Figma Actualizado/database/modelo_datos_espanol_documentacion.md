# Modelo de Datos ServiHogar - Versión en Español

## Descripción General
Este documento describe el modelo de datos relacional para la plataforma ServiHogar, completamente traducido al español con nombres de tablas en singular.

## Estructura de Tablas

### Tablas Geográficas

#### `region`
Almacena las regiones administrativas de Chile.
- **Campos principales**: `nombre`, `codigo`
- **Ejemplo**: 'Región Metropolitana', 'RM'

#### `comuna` 
Almacena las comunas por cada región.
- **Relación**: Pertenece a una `region`
- **Campos principales**: `nombre`, `codigo`, `region_id`

### Tabla de Servicios

#### `categoria_servicio`
Define las categorías de servicios disponibles.
- **Categorías actuales**: Gasfitería, Limpieza del Hogar, Jardinería
- **Campos**: `nombre`, `descripcion`, `icono`, `esta_activo`

### Tablas de Usuarios

#### `usuario`
Tabla principal que almacena todos los usuarios del sistema.
- **Roles disponibles**: 'cliente', 'profesional', 'administrador', 'verificador'
- **Campos obligatorios**: `nombres`, `apellidos`, `rut`, `email`, `direccion`
- **Campos de ubicación**: `region_id`, `comuna_id`
- **Validaciones**: RUT único, email único

#### `perfil_profesional`
Perfil específico para profesionales que ofrecen servicios.
- **Relación**: Un usuario puede tener un perfil profesional
- **Estados de verificación**: 'pendiente', 'aprobado', 'rechazado', 'suspendido'
- **Configuración de servicios**: duración (fija/rango - solo informativa), precio fijo del servicio
- **Métricas**: calificación, trabajos completados, ganancias totales

#### `documento_profesional`
Documentos subidos por profesionales para verificación.
- **Tipos**: 'cedula', 'antecedentes', 'certificado', 'experiencia', 'titulo'
- **Campo obligatorio**: Antecedentes criminales
- **Estados**: 'pendiente', 'aprobado', 'rechazado'

#### `horario_profesional`
Horarios semanales de disponibilidad de profesionales.
- **Días**: 0=Domingo hasta 6=Sábado
- **Campos**: `dia_semana`, `hora_inicio`, `hora_fin`, `esta_disponible`

### Tablas de Servicios y Pagos

#### `solicitud_servicio`
Registro de servicios solicitados por clientes.
- **Participantes**: `cliente_id`, `profesional_id`
- **Detalles**: título, descripción, fecha/hora programada, duración
- **Ubicación**: dirección del servicio, región, comuna
- **Precios**: precio fijo del servicio, precio total (siempre igual al precio fijo)
- **Estados**: 'pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado', 'en_disputa'

#### `pago`
Registro de pagos y transacciones con MercadoPago.
- **Integración**: IDs de MercadoPago para pagos y preferencias
- **Estados**: 'pendiente', 'aprobado', 'rechazado', 'reembolsado', etc.
- **Campos**: monto, moneda (CLP), método de pago

### Tablas de Reseñas y Comunicación

#### `resena`
Calificaciones y comentarios de servicios completados.
- **Calificación general**: 1 a 5 estrellas
- **Calificaciones específicas**: puntualidad, calidad, comunicación
- **Respuesta profesional**: Los profesionales pueden responder
- **Visibilidad**: `es_publica`, `es_destacada`

#### `notificacion`
Sistema de notificaciones para usuarios.
- **Tipos**: 'solicitud_servicio', 'pago', 'resena', 'verificacion'
- **Estado**: `esta_leida`, `leida_en`
- **Metadatos**: Información adicional en JSON

### Tablas Administrativas

#### `log_administrador`
Registro de acciones administrativas para auditoría.
- **Acciones**: 'usuario_creado', 'profesional_verificado', etc.
- **Entidades afectadas**: usuario, profesional, solicitud_servicio
- **Tracking**: valores anteriores y nuevos en JSON

#### `configuracion_sistema`
Configuraciones del sistema modificables.
- **Tipos de datos**: string, integer, boolean, json
- **Visibilidad**: `es_publico` para mostrar en frontend
- **Configuraciones incluidas**: nombre plataforma, contactos, límites de archivos

## Vistas Útiles

### `vista_perfiles_profesionales_completa`
Vista que une información de profesionales con sus ubicaciones, categorías y estadísticas de reseñas.

### `vista_solicitudes_servicio_completa`
Vista que consolida información completa de solicitudes con datos de cliente, profesional, pagos y reseñas.

## Características Técnicas

### Índices Optimizados
- Búsquedas por email y RUT
- Filtros por región y comuna
- Estados de verificación y solicitudes
- Calificaciones ordenadas descendentemente

### Triggers Automáticos
- Actualización automática de `actualizado_en`
- Aplicado a tablas principales que requieren tracking de cambios

### Datos Iniciales
- 16 regiones de Chile con códigos oficiales
- 3 categorías de servicios predefinidas
- Configuraciones del sistema con valores por defecto

## Características de Seguridad y Validación

### Constraints
- Validación de géneros permitidos
- Validación de roles de usuario
- Estados controlados para verificación y servicios
- Rangos de calificación (1-5)
- Días de semana válidos (0-6)

### Integridad Referencial
- Claves foráneas con CASCADE DELETE donde apropiado
- Constraints UNIQUE para evitar duplicados
- Validaciones CHECK para asegurar datos consistentes

### Privacidad
- Separación de datos sensibles
- Control de visibilidad de información personal
- Sistema de roles para acceso diferenciado

## Modelo de Precios Fijos (Actualización)

### Sistema Actual
A partir de la implementación actual, **todos los servicios tienen precios fijos**:
- ✅ **Precio fijo por servicio**: Independiente del tiempo exacto que tome el trabajo
- ✅ **Duración informativa**: Los rangos de duración son solo para que el cliente sepa cuánto tiempo estimado tomará
- ✅ **Sin variaciones**: El precio no cambia según el tiempo real del servicio
- ✅ **Simplicidad**: Tanto clientes como profesionales conocen el precio exacto desde el inicio

### Campos de Precio en Base de Datos
- `precio_por_hora` → **Ahora representa el precio FIJO del servicio** (mantiene el nombre por compatibilidad)
- `precio_total` → **Siempre igual al precio fijo** 
- `duracion_*` → **Solo para información y planificación del cliente**

### Beneficios del Modelo
- Transparencia total en precios
- Sin sorpresas para el cliente
- Simplicidad en facturación 
- Profesionales pueden optimizar su tiempo sin afectar ingresos

Este modelo está optimizado para PostgreSQL y soporta todas las funcionalidades actuales de la plataforma ServiHogar, incluyendo el sistema de regiones chilenas, verificación de profesionales, pagos con MercadoPago, sistema completo de reseñas, y el nuevo modelo de precios fijos.