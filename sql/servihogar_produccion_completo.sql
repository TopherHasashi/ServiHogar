-- ═══════════════════════════════════════════════════════════════════════════════════
-- SERVIHOGAR - BASE DE DATOS PRODUCCIÓN COMPLETA
-- ═══════════════════════════════════════════════════════════════════════════════════
-- 
-- Plataforma de Servicios para el Hogar - Chile
-- Versión: 2.0 (Enero 2025)
-- Base de datos: PostgreSQL 14+
-- Codificación: UTF-8
--
-- CARACTERÍSTICAS PRINCIPALES:
-- ✅ Sistema multi-rol (Cliente, Profesional, Administrador, Verificador)
-- ✅ Múltiples servicios por profesional (máximo 3)
-- ✅ Horarios personalizados con jerarquía de 3 niveles
-- ✅ Verificación diferenciada de documentos
-- ✅ Sistema de cuentas bancarias (hasta 3 por profesional)
-- ✅ Integración con MercadoPago
-- ✅ Sistema de calificaciones y reseñas
-- ✅ Gestión de archivos y documentos
-- ✅ Business Intelligence integrado
-- ✅ Sistema de notificaciones y mensajería
-- ✅ Auditoría completa de acciones
-- ✅ Sistema de disputas y mediación
-- ✅ Promociones y descuentos
-- ✅ Escalable para futuras funcionalidades
--
-- EQUIPO:
-- Scrum Master: Matias Reuque
-- Product Owner: Juan Silva
-- Período: Agosto-Noviembre 2024
--
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 1. CONFIGURACIÓN INICIAL
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid() para UUIDs
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Para constraints de rango de fechas
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Para búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Para búsqueda sin acentos

-- Configuración de zona horaria para Chile
SET timezone = 'America/Santiago';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 2. TABLAS DE CONFIGURACIÓN GEOGRÁFICA
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Regiones de Chile (15 regiones)
CREATE TABLE region (
    id_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE region IS 'Regiones administrativas de Chile';
COMMENT ON COLUMN region.codigo IS 'Código oficial de la región (I, II, III, ..., XV, RM)';

-- Comunas por región
CREATE TABLE comuna (
    id_comuna UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_region UUID NOT NULL REFERENCES region(id_region) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10),
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_region, nombre)
);

COMMENT ON TABLE comuna IS 'Comunas de Chile agrupadas por región';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 3. CATEGORÍAS DE SERVICIOS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE categoria_servicio (
    id_categoria_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    descripcion_corta VARCHAR(200),
    icono VARCHAR(50),
    imagen_url TEXT,
    color_hex VARCHAR(7), -- Color asociado en UI (#FF5733)
    orden_visualizacion INTEGER DEFAULT 0,
    esta_activo BOOLEAN DEFAULT true,
    metadata JSONB, -- Para datos adicionales flexibles
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categoria_servicio IS 'Categorías de servicios ofrecidos (Gasfitería, Limpieza, Jardinería, etc.)';
COMMENT ON COLUMN categoria_servicio.slug IS 'URL-friendly identifier (gasfiteria, limpieza-hogar)';
COMMENT ON COLUMN categoria_servicio.metadata IS 'Datos adicionales en formato JSON para futuras expansiones';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 4. SISTEMA DE USUARIOS MULTI-ROL
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- CAMPOS OBLIGATORIOS
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rut VARCHAR(12) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    
    -- CAMPOS OPCIONALES
    genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero-no-decir')),
    fecha_nacimiento DATE,
    foto_perfil_url TEXT,
    biografia TEXT,
    
    -- UBICACIÓN (REQUERIDA PARA PROFESIONALES)
    id_region UUID REFERENCES region(id_region),
    id_comuna UUID REFERENCES comuna(id_comuna),
    
    -- SISTEMA DE ROLES
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'profesional', 'administrador', 'verificador')),
    roles_adicionales VARCHAR(20)[], -- Array para múltiples roles
    
    -- CONTROL DE ACCESO
    esta_activo BOOLEAN DEFAULT true,
    esta_suspendido BOOLEAN DEFAULT false,
    fecha_suspension TIMESTAMP,
    razon_suspension TEXT,
    suspendido_por UUID REFERENCES usuario(id_usuario),
    
    -- VERIFICACIÓN DE CUENTA
    email_verificado BOOLEAN DEFAULT false,
    telefono_verificado BOOLEAN DEFAULT false,
    token_verificacion_email VARCHAR(100),
    token_recuperacion_password VARCHAR(100),
    fecha_expiracion_token TIMESTAMP,
    
    -- CONFIGURACIÓN DE PRIVACIDAD
    perfil_publico BOOLEAN DEFAULT true,
    mostrar_telefono BOOLEAN DEFAULT false,
    mostrar_email BOOLEAN DEFAULT false,
    acepta_notificaciones_email BOOLEAN DEFAULT true,
    acepta_notificaciones_sms BOOLEAN DEFAULT false,
    acepta_marketing BOOLEAN DEFAULT false,
    
    -- ESTADÍSTICAS
    total_servicios_solicitados INTEGER DEFAULT 0,
    total_servicios_realizados INTEGER DEFAULT 0,
    
    -- SEGURIDAD
    intentos_login_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    ultima_contrasena_cambiada TIMESTAMP,
    
    -- TIMESTAMPS
    miembro_desde TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    ultima_actividad TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuario IS 'Tabla central de usuarios con sistema multi-rol';
COMMENT ON COLUMN usuario.rut IS 'RUT chileno formato 12.345.678-9';
COMMENT ON COLUMN usuario.roles_adicionales IS 'Permite que un usuario tenga múltiples roles (ej: cliente + profesional)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 5. SISTEMA DE PROFESIONALES - MÚLTIPLES SERVICIOS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Perfil profesional general (UNO por usuario)
CREATE TABLE perfil_profesional (
    id_perfil_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    
    -- INFORMACIÓN GENERAL OBLIGATORIA
    descripcion_general TEXT NOT NULL,
    anos_experiencia_total VARCHAR(10), -- '5+', '10+', etc.
    
    -- ESTADO DE VERIFICACIÓN GENERAL
    estado_verificacion_general VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion_general IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    intentos_verificacion INTEGER DEFAULT 0,
    
    -- CERTIFICACIONES Y DOCUMENTOS
    certificado_antecedentes_aprobado BOOLEAN DEFAULT false,
    fecha_aprobacion_antecedentes TIMESTAMP,
    
    -- MÉTRICAS GENERALES (CALCULADAS AUTOMÁTICAMENTE)
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00 CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
    total_trabajos_completados INTEGER DEFAULT 0,
    total_trabajos_cancelados INTEGER DEFAULT 0,
    tasa_aceptacion DECIMAL(5,2) DEFAULT 100.00, -- Porcentaje
    tasa_completacion DECIMAL(5,2) DEFAULT 100.00,
    total_ganancias INTEGER DEFAULT 0,
    
    -- CONTROL DE DISPONIBILIDAD GENERAL
    esta_activo BOOLEAN DEFAULT true,
    acepta_nuevos_trabajos BOOLEAN DEFAULT true,
    radio_cobertura_km INTEGER DEFAULT 10, -- Radio en kilómetros
    
    -- INFORMACIÓN BANCARIA Y FISCAL
    tiene_cuenta_bancaria BOOLEAN DEFAULT false,
    acepta_terminos_profesional BOOLEAN DEFAULT false,
    fecha_aceptacion_terminos TIMESTAMP,
    
    -- ESTADÍSTICAS ADICIONALES
    total_servicios_ofrecidos INTEGER DEFAULT 0,
    fecha_primer_trabajo TIMESTAMP,
    fecha_ultimo_trabajo TIMESTAMP,
    
    -- DESTACADOS Y PROMOCIONES
    es_destacado BOOLEAN DEFAULT false,
    es_premium BOOLEAN DEFAULT false,
    fecha_inicio_premium TIMESTAMP,
    fecha_fin_premium TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE perfil_profesional IS 'Perfil general del profesional, uno por usuario';
COMMENT ON COLUMN perfil_profesional.certificado_antecedentes_aprobado IS 'Certificado de antecedentes se verifica una sola vez';

-- Servicios específicos por profesional (MÚLTIPLES - máximo 3)
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- CONFIGURACIÓN ESPECÍFICA POR SERVICIO (OBLIGATORIA)
    anos_experiencia VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,
    descripcion_corta VARCHAR(300),
    
    -- CONFIGURACIÓN DE DURACIÓN (INFORMATIVA PARA EL CLIENTE)
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija', 'rango')),
    duracion_fija_minutos INTEGER,
    duracion_minima_minutos INTEGER,
    duracion_maxima_minutos INTEGER,
    
    -- PRECIO FIJO POR SERVICIO (OBLIGATORIO)
    precio_fijo INTEGER NOT NULL CHECK (precio_fijo > 0),
    moneda VARCHAR(3) DEFAULT 'CLP',
    precio_anterior INTEGER, -- Para mostrar descuentos
    
    -- CONTROL DE ESTADO POR SERVICIO
    esta_activo BOOLEAN DEFAULT true,
    esta_disponible BOOLEAN DEFAULT true,
    orden_prioridad INTEGER DEFAULT 1, -- Orden de visualización
    
    -- VERIFICACIÓN INDEPENDIENTE POR SERVICIO
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    -- MÉTRICAS ESPECÍFICAS POR SERVICIO
    calificacion DECIMAL(3,2) DEFAULT 0.00 CHECK (calificacion >= 0 AND calificacion <= 5),
    trabajos_completados INTEGER DEFAULT 0,
    trabajos_cancelados INTEGER DEFAULT 0,
    ganancias_totales INTEGER DEFAULT 0,
    
    -- CONTROL DE VERIFICACIÓN DIFERENCIADA
    es_primer_servicio BOOLEAN DEFAULT false,
    requiere_certificado_experiencia BOOLEAN DEFAULT true,
    
    -- CONFIGURACIÓN ADICIONAL
    servicios_incluidos TEXT[], -- Array de servicios específicos incluidos
    servicios_no_incluidos TEXT[],
    materiales_incluidos BOOLEAN DEFAULT false,
    requiere_insumos_cliente BOOLEAN DEFAULT false,
    notas_adicionales TEXT,
    
    -- GALERÍA DE TRABAJOS
    imagenes_trabajos TEXT[], -- URLs de imágenes de trabajos previos
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un profesional no puede duplicar el mismo servicio
    UNIQUE(id_perfil_profesional, id_categoria_servicio)
);

COMMENT ON TABLE servicio_profesional IS 'Servicios específicos ofrecidos por cada profesional (máximo 3)';
COMMENT ON COLUMN servicio_profesional.precio_fijo IS 'Precio fijo del servicio, no varía por tiempo';
COMMENT ON COLUMN servicio_profesional.es_primer_servicio IS 'Si es el primer servicio del profesional, requiere antecedentes';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 6. SISTEMA DE HORARIOS AVANZADO (3 NIVELES DE JERARQUÍA)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Nivel 1: Horario general/plantilla por servicio (BASE)
CREATE TABLE horario_servicio_profesional (
    id_horario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    esta_habilitado BOOLEAN DEFAULT true,
    notas VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_servicio_profesional, dia_semana, hora_inicio)
);

COMMENT ON TABLE horario_servicio_profesional IS 'Horario base semanal del profesional (Nivel 1 - prioridad más baja)';
COMMENT ON COLUMN horario_servicio_profesional.dia_semana IS '0=Domingo, 1=Lunes, ..., 6=Sábado';

-- Nivel 2: Períodos personalizados de horarios (MAYOR PRIORIDAD QUE BASE)
CREATE TABLE periodo_horario_personalizado (
    id_periodo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    nombre_periodo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Evitar períodos superpuestos
    EXCLUDE USING gist (
        id_servicio_profesional WITH =,
        daterange(fecha_inicio, fecha_fin, '[]') WITH &&
    )
);

COMMENT ON TABLE periodo_horario_personalizado IS 'Períodos especiales con horarios personalizados (Nivel 2 - prioridad media)';
COMMENT ON COLUMN periodo_horario_personalizado.nombre_periodo IS 'Ejemplos: "Verano 2025", "Vacaciones Septiembre"';

-- Horarios específicos para cada período personalizado
CREATE TABLE horario_periodo_personalizado (
    id_horario_periodo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_periodo UUID NOT NULL REFERENCES periodo_horario_personalizado(id_periodo) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    esta_habilitado BOOLEAN DEFAULT true,
    UNIQUE(id_periodo, dia_semana, hora_inicio)
);

COMMENT ON TABLE horario_periodo_personalizado IS 'Horarios específicos dentro de un período personalizado';

-- Nivel 3: Días específicos bloqueados (MÁXIMA PRIORIDAD)
CREATE TABLE dia_no_disponible (
    id_dia_no_disponible UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    -- Tipo de bloqueo
    tipo_bloqueo VARCHAR(20) NOT NULL CHECK (tipo_bloqueo IN ('dia_especifico', 'semana_completa', 'mes_completo')),
    
    -- Fechas
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    
    -- Información adicional
    razon VARCHAR(255),
    es_recurrente BOOLEAN DEFAULT false, -- Para feriados anuales
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_servicio_profesional, fecha_inicio)
);

COMMENT ON TABLE dia_no_disponible IS 'Bloqueos de disponibilidad (Nivel 3 - máxima prioridad)';
COMMENT ON COLUMN dia_no_disponible.tipo_bloqueo IS 'Permite bloquear días individuales, semanas o meses completos';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 7. SISTEMA DE DOCUMENTOS Y VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Documentos de verificación (temporal - se eliminan después de aprobar/rechazar)
CREATE TABLE documento_verificacion (
    id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    
    -- TIPO DE DOCUMENTO
    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
        'cedula_identidad_frontal',
        'cedula_identidad_reverso',
        'antecedentes_penales',
        'certificado_experiencia',
        'certificado_estudios',
        'titulo_profesional',
        'licencia_conducir',
        'comprobante_domicilio',
        'otro'
    )),
    categoria_documento VARCHAR(20) NOT NULL CHECK (categoria_documento IN ('identidad', 'antecedentes', 'experiencia', 'certificaciones')),
    
    -- OBLIGATORIEDAD
    es_obligatorio BOOLEAN DEFAULT false,
    
    -- INFORMACIÓN DEL ARCHIVO
    nombre_archivo_original VARCHAR(255) NOT NULL,
    nombre_archivo_sistema VARCHAR(255) NOT NULL UNIQUE,
    url_archivo TEXT NOT NULL,
    url_miniatura TEXT,
    tamano_archivo_bytes INTEGER,
    tipo_mime VARCHAR(100),
    hash_archivo VARCHAR(64), -- SHA-256 para verificar integridad
    
    -- ESTADO DE VERIFICACIÓN
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'expirado')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    fecha_revision TIMESTAMP,
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    comentarios_verificador TEXT,
    
    -- METADATA
    fecha_emision_documento DATE,
    fecha_vencimiento_documento DATE,
    numero_documento VARCHAR(100),
    entidad_emisora VARCHAR(200),
    metadata JSONB,
    
    -- SEGURIDAD Y AUDITORÍA
    ip_subida INET,
    agente_usuario TEXT,
    
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documento_verificacion IS 'Documentos subidos por profesionales para verificación';
COMMENT ON COLUMN documento_verificacion.hash_archivo IS 'SHA-256 hash para verificar que el archivo no fue alterado';

-- Historial de documentos archivados (para auditoría)
CREATE TABLE documento_historial (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_documento_original UUID, -- Referencia al documento original (puede ser NULL si fue eliminado)
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional),
    
    tipo_documento VARCHAR(30) NOT NULL,
    estado_final VARCHAR(20) NOT NULL,
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    fecha_decision TIMESTAMP NOT NULL,
    razon TEXT,
    
    -- Copia de datos importantes
    nombre_archivo_original VARCHAR(255),
    metadata_snapshot JSONB,
    
    archivado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documento_historial IS 'Historial de documentos procesados para auditoría';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 8. SISTEMA DE CUENTAS BANCARIAS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Cuentas bancarias (hasta 3 por profesional, 3 para ServiHogar)
CREATE TABLE cuenta_bancaria (
    id_cuenta_bancaria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con usuario (NULL para cuentas de ServiHogar)
    id_usuario UUID REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    
    -- Tipo de entidad propietaria
    tipo_entidad VARCHAR(20) NOT NULL CHECK (tipo_entidad IN ('profesional', 'servihogar')),
    
    -- Información bancaria
    nombre_banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('corriente', 'vista', 'ahorro', 'rut')),
    numero_cuenta VARCHAR(30) NOT NULL,
    numero_cuenta_ofuscado VARCHAR(30), -- Para mostrar en UI (****1234)
    nombre_titular VARCHAR(200) NOT NULL,
    rut_titular VARCHAR(12) NOT NULL,
    email_titular VARCHAR(255),
    
    -- Información adicional
    codigo_banco VARCHAR(10),
    sucursal VARCHAR(100),
    email_contacto VARCHAR(255),
    telefono_contacto VARCHAR(20),
    
    -- Prioridad y jerarquía (1=principal, 2=respaldo 1, 3=respaldo 2)
    es_principal BOOLEAN DEFAULT false,
    orden_prioridad INTEGER DEFAULT 1 CHECK (orden_prioridad >= 1 AND orden_prioridad <= 3),
    
    -- Estado y verificación
    esta_activa BOOLEAN DEFAULT true,
    esta_verificada BOOLEAN DEFAULT false,
    fecha_verificacion TIMESTAMP,
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    metodo_verificacion VARCHAR(50), -- 'deposito_prueba', 'documento', 'manual'
    
    -- Límites y configuración
    limite_transaccion_diario INTEGER,
    limite_transaccion_mensual INTEGER,
    
    -- Metadata y notas
    notas_internas TEXT,
    razon_rechazo TEXT,
    metadata JSONB,
    
    -- Auditoría
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_creado_por UUID REFERENCES usuario(id_usuario),
    id_actualizado_por UUID REFERENCES usuario(id_usuario),
    
    -- Validaciones
    CONSTRAINT ck_rut_valido CHECK (rut_titular ~ '^[0-9]{1,2}\\.[0-9]{3}\\.[0-9]{3}-[0-9Kk]$'),
    CONSTRAINT ck_numero_cuenta_valido CHECK (LENGTH(numero_cuenta) >= 8 AND LENGTH(numero_cuenta) <= 30)
);

COMMENT ON TABLE cuenta_bancaria IS 'Cuentas bancarias de profesionales y ServiHogar (máximo 3 por entidad)';
COMMENT ON COLUMN cuenta_bancaria.orden_prioridad IS 'Sistema de fallback: 1=principal, 2=respaldo 1, 3=respaldo 2';
COMMENT ON COLUMN cuenta_bancaria.numero_cuenta_ofuscado IS 'Versión ofuscada para mostrar en UI (****1234)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 9. SISTEMA DE SOLICITUDES DE SERVICIO
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_solicitud VARCHAR(20) UNIQUE NOT NULL, -- Código legible (SOL-2025-00001)
    
    -- Participantes
    id_cliente UUID NOT NULL REFERENCES usuario(id_usuario),
    id_profesional UUID NOT NULL REFERENCES usuario(id_usuario),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional),
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- DETALLES DEL SERVICIO (OBLIGATORIOS)
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    duracion_estimada_minutos INTEGER NOT NULL,
    
    -- UBICACIÓN DEL SERVICIO (OBLIGATORIA)
    direccion_servicio TEXT NOT NULL,
    referencia_direccion TEXT,
    id_region_servicio UUID NOT NULL REFERENCES region(id_region),
    id_comuna_servicio UUID NOT NULL REFERENCES comuna(id_comuna),
    coordenadas_latitud DECIMAL(10, 8),
    coordenadas_longitud DECIMAL(11, 8),
    
    -- CONTACTO
    telefono_contacto VARCHAR(20) NOT NULL,
    email_contacto VARCHAR(255),
    nombre_contacto VARCHAR(200),
    
    -- PRECIOS FIJOS
    precio_servicio INTEGER NOT NULL,
    comision_plataforma INTEGER DEFAULT 0,
    precio_total INTEGER GENERATED ALWAYS AS (precio_servicio + comision_plataforma) STORED,
    moneda VARCHAR(3) DEFAULT 'CLP',
    
    -- CÓDIGOS DE DESCUENTO
    id_codigo_descuento UUID,
    monto_descuento INTEGER DEFAULT 0,
    
    -- ESTADOS DEL SERVICIO
    estado VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'confirmado', 'en_camino', 'en_progreso', 'completado', 'cancelado', 'en_disputa', 'rechazado')),
    subestado VARCHAR(50), -- Para estados más específicos
    
    -- TIMESTAMPS DE ESTADO
    confirmado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    id_cancelado_por UUID REFERENCES usuario(id_usuario),
    razon_cancelacion TEXT,
    
    -- INFORMACIÓN ADICIONAL
    solicitudes_especiales TEXT,
    requiere_materiales BOOLEAN DEFAULT false,
    lista_materiales TEXT[],
    instrucciones_acceso TEXT,
    tiene_mascotas BOOLEAN DEFAULT false,
    notas_adicionales TEXT,
    
    -- ARCHIVOS ADJUNTOS
    imagenes_referencias TEXT[], -- URLs de imágenes de referencia
    
    -- RECORDATORIOS
    recordatorio_enviado BOOLEAN DEFAULT false,
    fecha_recordatorio TIMESTAMP,
    
    -- SEGUIMIENTO
    calificado_por_cliente BOOLEAN DEFAULT false,
    calificado_por_profesional BOOLEAN DEFAULT false,
    
    -- METADATA
    origen_solicitud VARCHAR(20) DEFAULT 'web' CHECK (origen_solicitud IN ('web', 'mobile', 'api')),
    ip_solicitud INET,
    agente_usuario TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE solicitud_servicio IS 'Solicitudes de servicio entre clientes y profesionales';
COMMENT ON COLUMN solicitud_servicio.codigo_solicitud IS 'Código legible para tracking (SOL-2025-00001)';

-- Historial de cambios de estado de solicitudes
CREATE TABLE solicitud_estado_historial (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio) ON DELETE CASCADE,
    
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    id_usuario_cambio UUID REFERENCES usuario(id_usuario),
    razon_cambio TEXT,
    notas TEXT,
    metadata JSONB,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE solicitud_estado_historial IS 'Historial completo de cambios de estado en solicitudes';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 10. SISTEMA DE PAGOS Y TRANSACCIONES (MERCADOPAGO)
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE pago (
    id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pago VARCHAR(20) UNIQUE NOT NULL, -- PAG-2025-00001
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- INFORMACIÓN DE MERCADOPAGO
    id_pago_mercadopago VARCHAR(255) UNIQUE,
    id_preferencia_mercadopago VARCHAR(255),
    id_merchant_order VARCHAR(255),
    
    -- DETALLES DEL PAGO
    monto_total INTEGER NOT NULL,
    monto_servicio INTEGER NOT NULL,
    monto_comision INTEGER DEFAULT 0,
    monto_descuento INTEGER DEFAULT 0,
    monto_impuestos INTEGER DEFAULT 0,
    moneda VARCHAR(3) DEFAULT 'CLP',
    
    -- MÉTODO DE PAGO
    metodo_pago VARCHAR(50),
    tipo_pago VARCHAR(30), -- 'credit_card', 'debit_card', 'bank_transfer', 'wallet'
    ultimos_digitos_tarjeta VARCHAR(4),
    marca_tarjeta VARCHAR(30), -- 'visa', 'mastercard', 'amex'
    cuotas INTEGER DEFAULT 1,
    
    -- DESTINATARIOS DEL PAGO
    id_cuenta_bancaria_profesional UUID REFERENCES cuenta_bancaria(id_cuenta_bancaria),
    id_cuenta_bancaria_servihogar UUID REFERENCES cuenta_bancaria(id_cuenta_bancaria),
    
    -- ESTADOS DEL PAGO
    estado VARCHAR(30) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'aprobado', 'autorizado', 'en_proceso', 'en_mediacion', 
                         'rechazado', 'cancelado', 'reembolsado', 'contraargado', 'parcialmente_reembolsado')),
    estado_detalle VARCHAR(100),
    
    -- TIMESTAMPS DE PROCESAMIENTO
    pagado_en TIMESTAMP,
    acreditado_en TIMESTAMP,
    liberado_profesional_en TIMESTAMP,
    reembolsado_en TIMESTAMP,
    
    -- REEMBOLSOS
    monto_reembolso INTEGER DEFAULT 0,
    razon_reembolso TEXT,
    id_procesado_reembolso_por UUID REFERENCES usuario(id_usuario),
    
    -- RETENCIONES
    monto_retenido INTEGER DEFAULT 0,
    dias_retencion INTEGER DEFAULT 7,
    fecha_liberacion_estimada TIMESTAMP,
    
    -- INFORMACIÓN ADICIONAL
    referencia_externa VARCHAR(255),
    descripcion TEXT,
    comprobante_url TEXT,
    factura_url TEXT,
    metadata JSONB,
    
    -- AUDITORÍA
    ip_pago INET,
    agente_usuario TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pago IS 'Pagos procesados a través de MercadoPago';
COMMENT ON COLUMN pago.dias_retencion IS 'Días de retención antes de liberar pago al profesional (default: 7)';

-- Transacciones bancarias (transferencias a profesionales)
CREATE TABLE transaccion_bancaria (
    id_transaccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_transaccion VARCHAR(20) UNIQUE NOT NULL, -- TRX-2025-00001
    
    -- Relación con pago
    id_pago UUID NOT NULL REFERENCES pago(id_pago),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    id_cuenta_bancaria UUID NOT NULL REFERENCES cuenta_bancaria(id_cuenta_bancaria),
    
    -- Tipo de transacción
    tipo_transaccion VARCHAR(30) NOT NULL CHECK (tipo_transaccion IN (
        'pago_profesional',
        'retencion_garantia',
        'liberacion_garantia',
        'comision_plataforma',
        'reembolso_cliente',
        'ajuste',
        'bono',
        'penalizacion'
    )),
    
    -- Montos
    monto INTEGER NOT NULL,
    moneda VARCHAR(3) DEFAULT 'CLP',
    
    -- Estado
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'procesando', 'exitosa', 'fallida', 'revertida', 'cancelada')),
    codigo_error VARCHAR(50),
    mensaje_error TEXT,
    
    -- Información bancaria
    codigo_transaccion_banco VARCHAR(100),
    fecha_procesamiento TIMESTAMP,
    fecha_acreditacion TIMESTAMP,
    
    -- Reintentos en caso de fallo
    intento_numero INTEGER DEFAULT 1,
    cuenta_bancaria_usada INTEGER, -- Qué cuenta se usó (1, 2 o 3)
    
    -- Metadata
    descripcion TEXT,
    notas_internas TEXT,
    datos_adicionales JSONB,
    
    -- Auditoría
    id_procesado_por UUID REFERENCES usuario(id_usuario),
    ip_procesamiento INET,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_monto_positivo CHECK (monto > 0)
);

COMMENT ON TABLE transaccion_bancaria IS 'Transacciones bancarias individuales (transferencias a profesionales)';
COMMENT ON COLUMN transaccion_bancaria.cuenta_bancaria_usada IS 'Indica qué cuenta del sistema de fallback se usó (1=principal, 2=respaldo 1, 3=respaldo 2)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 11. SISTEMA DE CALIFICACIONES Y RESEÑAS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- Participantes
    id_evaluador UUID NOT NULL REFERENCES usuario(id_usuario),
    id_evaluado UUID NOT NULL REFERENCES usuario(id_usuario),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional),
    tipo_evaluador VARCHAR(20) NOT NULL CHECK (tipo_evaluador IN ('cliente', 'profesional')),
    
    -- CALIFICACIÓN PRINCIPAL (OBLIGATORIA)
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    titulo_resena VARCHAR(200),
    comentario TEXT,
    
    -- CALIFICACIONES ESPECÍFICAS (OPCIONALES)
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion >= 1 AND calificacion_comunicacion <= 5),
    calificacion_precio INTEGER CHECK (calificacion_precio >= 1 AND calificacion_precio <= 5),
    calificacion_limpieza INTEGER CHECK (calificacion_limpieza >= 1 AND calificacion_limpieza <= 5),
    
    -- RECOMENDACIONES
    recomendaria_servicio BOOLEAN,
    volveria_contratar BOOLEAN,
    
    -- ASPECTOS POSITIVOS Y NEGATIVOS
    aspectos_positivos TEXT[],
    aspectos_negativos TEXT[],
    
    -- RESPUESTA DEL EVALUADO
    respuesta TEXT,
    respondido_en TIMESTAMP,
    
    -- CONFIGURACIÓN DE VISIBILIDAD
    es_publica BOOLEAN DEFAULT true,
    es_destacada BOOLEAN DEFAULT false,
    es_verificada BOOLEAN DEFAULT false, -- Verificada por equipo ServiHogar
    
    -- MODERACIÓN
    esta_reportada BOOLEAN DEFAULT false,
    razon_reporte TEXT,
    esta_oculta BOOLEAN DEFAULT false,
    razon_ocultar TEXT,
    id_moderado_por UUID REFERENCES usuario(id_usuario),
    
    -- UTILIDAD
    votos_utiles INTEGER DEFAULT 0,
    votos_no_utiles INTEGER DEFAULT 0,
    
    -- IMÁGENES DE EVIDENCIA
    imagenes_evidencia TEXT[],
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE resena IS 'Calificaciones y reseñas bidireccionales entre clientes y profesionales';
COMMENT ON COLUMN resena.es_verificada IS 'Reseña verificada por el equipo como genuina';

-- Votos de utilidad en reseñas
CREATE TABLE resena_voto_utilidad (
    id_voto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_resena UUID NOT NULL REFERENCES resena(id_resena) ON DELETE CASCADE,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario),
    es_util BOOLEAN NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_resena, id_usuario)
);

COMMENT ON TABLE resena_voto_utilidad IS 'Votos de usuarios sobre la utilidad de reseñas';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 12. SISTEMA DE COMUNICACIÓN - NOTIFICACIONES
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    
    -- TIPO Y CATEGORÍA
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'solicitud_servicio',
        'pago_recibido',
        'pago_pendiente',
        'servicio_confirmado',
        'servicio_cancelado',
        'servicio_completado',
        'resena_recibida',
        'documento_aprobado',
        'documento_rechazado',
        'mensaje_nuevo',
        'recordatorio',
        'promocion',
        'sistema',
        'verificacion'
    )),
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    categoria VARCHAR(30) CHECK (categoria IN ('transaccional', 'marketing', 'sistema', 'social')),
    
    -- CONTENIDO
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    mensaje_corto VARCHAR(200), -- Para preview
    
    -- ACCIÓN
    url_accion TEXT,
    accion_principal VARCHAR(50), -- 'ver_solicitud', 'responder_mensaje', etc.
    datos_accion JSONB,
    
    -- CANALES DE ENVÍO
    enviada_email BOOLEAN DEFAULT false,
    enviada_sms BOOLEAN DEFAULT false,
    enviada_push BOOLEAN DEFAULT false,
    
    -- ESTADO
    esta_leida BOOLEAN DEFAULT false,
    leida_en TIMESTAMP,
    esta_archivada BOOLEAN DEFAULT false,
    archivada_en TIMESTAMP,
    
    -- PROGRAMACIÓN
    programada_para TIMESTAMP,
    
    -- METADATA
    icono VARCHAR(50),
    color_hex VARCHAR(7),
    imagen_url TEXT,
    metadatos JSONB,
    
    -- AGRUPACIÓN
    grupo_notificaciones VARCHAR(100), -- Para agrupar notificaciones relacionadas
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enviado_en TIMESTAMP
);

COMMENT ON TABLE notificacion IS 'Notificaciones del sistema para usuarios';
COMMENT ON COLUMN notificacion.grupo_notificaciones IS 'Permite agrupar notificaciones relacionadas en la UI';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 13. SISTEMA DE COMUNICACIÓN - MENSAJERÍA DIRECTA
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Conversaciones entre usuarios
CREATE TABLE conversacion (
    id_conversacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- Participantes (cliente y profesional)
    id_usuario_1 UUID NOT NULL REFERENCES usuario(id_usuario),
    id_usuario_2 UUID NOT NULL REFERENCES usuario(id_usuario),
    
    -- Estado
    esta_activa BOOLEAN DEFAULT true,
    bloqueada BOOLEAN DEFAULT false,
    id_bloqueado_por UUID REFERENCES usuario(id_usuario),
    
    -- Último mensaje
    ultimo_mensaje_en TIMESTAMP,
    ultimo_mensaje_preview TEXT,
    
    -- Metadata
    asunto VARCHAR(255),
    metadata JSONB,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_usuario_1, id_usuario_2, id_solicitud_servicio)
);

COMMENT ON TABLE conversacion IS 'Conversaciones privadas entre clientes y profesionales';

-- Mensajes dentro de conversaciones
CREATE TABLE mensaje (
    id_mensaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversacion UUID NOT NULL REFERENCES conversacion(id_conversacion) ON DELETE CASCADE,
    
    -- Remitente
    id_remitente UUID NOT NULL REFERENCES usuario(id_usuario),
    
    -- Contenido
    contenido TEXT NOT NULL,
    tipo_mensaje VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'imagen', 'archivo', 'ubicacion', 'sistema')),
    
    -- Archivos adjuntos
    archivos_adjuntos TEXT[],
    
    -- Estado de lectura
    esta_leido BOOLEAN DEFAULT false,
    leido_en TIMESTAMP,
    
    -- Metadata
    es_automatico BOOLEAN DEFAULT false,
    metadata JSONB,
    
    -- Moderación
    esta_reportado BOOLEAN DEFAULT false,
    esta_oculto BOOLEAN DEFAULT false,
    
    enviado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mensaje IS 'Mensajes dentro de conversaciones';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 14. SISTEMA DE DISPUTAS Y MEDIACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE disputa (
    id_disputa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_disputa VARCHAR(20) UNIQUE NOT NULL, -- DIS-2025-00001
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    id_pago UUID REFERENCES pago(id_pago),
    
    -- Participantes
    id_solicitante UUID NOT NULL REFERENCES usuario(id_usuario),
    id_contraparte UUID NOT NULL REFERENCES usuario(id_usuario),
    tipo_solicitante VARCHAR(20) NOT NULL CHECK (tipo_solicitante IN ('cliente', 'profesional')),
    
    -- Información de la disputa
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN (
        'servicio_no_realizado',
        'servicio_incompleto',
        'mala_calidad',
        'danos_propiedad',
        'cobro_incorrecto',
        'cancelacion_injustificada',
        'comportamiento_inapropiado',
        'otro'
    )),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    monto_disputa INTEGER,
    
    -- Evidencia
    evidencia_urls TEXT[],
    documentos_adjuntos TEXT[],
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN (
        'abierta',
        'en_revision',
        'en_mediacion',
        'resuelta_favor_cliente',
        'resuelta_favor_profesional',
        'resuelta_neutral',
        'cerrada',
        'escalada'
    )),
    
    -- Mediación
    id_mediador UUID REFERENCES usuario(id_usuario),
    fecha_asignacion_mediador TIMESTAMP,
    comentarios_mediador TEXT,
    decision_mediador TEXT,
    
    -- Resolución
    resolucion TEXT,
    fecha_resolucion TIMESTAMP,
    monto_reembolso INTEGER DEFAULT 0,
    
    -- Prioridad
    prioridad VARCHAR(20) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    
    -- Timestamps
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cerrado_en TIMESTAMP
);

COMMENT ON TABLE disputa IS 'Disputas entre clientes y profesionales que requieren mediación';

-- Mensajes en disputas
CREATE TABLE disputa_mensaje (
    id_mensaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_disputa UUID NOT NULL REFERENCES disputa(id_disputa) ON DELETE CASCADE,
    id_remitente UUID NOT NULL REFERENCES usuario(id_usuario),
    
    tipo_remitente VARCHAR(20) NOT NULL CHECK (tipo_remitente IN ('cliente', 'profesional', 'mediador', 'sistema')),
    mensaje TEXT NOT NULL,
    es_publico BOOLEAN DEFAULT true, -- False para mensajes internos del mediador
    
    archivos_adjuntos TEXT[],
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disputa_mensaje IS 'Comunicación dentro de una disputa';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 15. SISTEMA DE PROMOCIONES Y DESCUENTOS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE codigo_descuento (
    id_codigo_descuento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Código
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    
    -- Tipo de descuento
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    valor_descuento DECIMAL(10,2) NOT NULL,
    descuento_maximo INTEGER, -- Monto máximo de descuento en pesos
    
    -- Restricciones
    monto_minimo_compra INTEGER,
    id_categoria_servicio UUID REFERENCES categoria_servicio(id_categoria_servicio),
    solo_primer_servicio BOOLEAN DEFAULT false,
    usos_maximos INTEGER,
    usos_por_usuario INTEGER DEFAULT 1,
    
    -- Vigencia
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    esta_activo BOOLEAN DEFAULT true,
    
    -- Audiencia
    es_publico BOOLEAN DEFAULT true,
    usuarios_especificos UUID[], -- Array de IDs de usuarios
    
    -- Estadísticas
    veces_usado INTEGER DEFAULT 0,
    monto_total_descuentos INTEGER DEFAULT 0,
    
    -- Metadata
    campana VARCHAR(100),
    notas_internas TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_creado_por UUID REFERENCES usuario(id_usuario)
);

COMMENT ON TABLE codigo_descuento IS 'Códigos de descuento y promociones';

-- Uso de códigos de descuento
CREATE TABLE codigo_descuento_uso (
    id_uso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_codigo_descuento UUID NOT NULL REFERENCES codigo_descuento(id_codigo_descuento),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario),
    id_solicitud_servicio UUID REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    monto_descuento_aplicado INTEGER NOT NULL,
    
    usado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE codigo_descuento_uso IS 'Registro de usos de códigos de descuento';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 16. SISTEMA DE AUDITORÍA Y LOGS DE ADMINISTRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE log_administrador (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_administrador UUID NOT NULL REFERENCES usuario(id_usuario),
    
    -- Acción realizada
    accion VARCHAR(100) NOT NULL,
    tipo_accion VARCHAR(30) CHECK (tipo_accion IN ('crear', 'editar', 'eliminar', 'suspender', 'activar', 'aprobar', 'rechazar', 'otro')),
    
    -- Entidad afectada
    tipo_entidad VARCHAR(50),
    id_entidad UUID,
    nombre_entidad VARCHAR(255),
    
    -- Detalles
    descripcion TEXT,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    
    -- Contexto
    modulo VARCHAR(50), -- 'usuarios', 'profesionales', 'servicios', 'pagos', etc.
    nivel VARCHAR(20) DEFAULT 'info' CHECK (nivel IN ('info', 'warning', 'error', 'critical')),
    
    -- Información técnica
    direccion_ip INET,
    agente_usuario TEXT,
    ubicacion_geografica VARCHAR(100),
    
    -- Resultado
    exitoso BOOLEAN DEFAULT true,
    mensaje_error TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE log_administrador IS 'Auditoría completa de acciones administrativas';

-- Logs de sistema (errores, eventos importantes)
CREATE TABLE log_sistema (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clasificación
    tipo_evento VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('debug', 'info', 'warning', 'error', 'critical')),
    categoria VARCHAR(50),
    
    -- Contenido
    mensaje TEXT NOT NULL,
    stacktrace TEXT,
    
    -- Contexto
    modulo VARCHAR(50),
    funcion VARCHAR(100),
    linea INTEGER,
    
    -- Usuario afectado (si aplica)
    id_usuario UUID REFERENCES usuario(id_usuario),
    
    -- Información técnica
    direccion_ip INET,
    agente_usuario TEXT,
    
    -- Metadata
    datos_adicionales JSONB,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_sistema_nivel ON log_sistema(nivel);
CREATE INDEX idx_log_sistema_fecha ON log_sistema(creado_en);

COMMENT ON TABLE log_sistema IS 'Logs de eventos del sistema, errores y debugging';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 17. CONFIGURACIÓN DEL SISTEMA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE configuracion_sistema (
    id_configuracion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clave única
    clave VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50), -- 'general', 'pagos', 'notificaciones', 'limites', etc.
    
    -- Valor
    valor TEXT NOT NULL,
    valor_default TEXT,
    
    -- Tipo de dato
    tipo_dato VARCHAR(20) DEFAULT 'string' CHECK (tipo_dato IN ('string', 'integer', 'decimal', 'boolean', 'json', 'array')),
    
    -- Metadata
    descripcion TEXT,
    es_publico BOOLEAN DEFAULT false,
    es_modificable BOOLEAN DEFAULT true,
    requiere_reinicio BOOLEAN DEFAULT false,
    
    -- Validación
    validacion_regex VARCHAR(255),
    valor_minimo DECIMAL(10,2),
    valor_maximo DECIMAL(10,2),
    valores_permitidos TEXT[],
    
    -- Auditoría
    id_actualizado_por UUID REFERENCES usuario(id_usuario),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE configuracion_sistema IS 'Configuración global de la plataforma';

-- Historial de cambios en configuración
CREATE TABLE configuracion_historial (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_configuracion UUID NOT NULL REFERENCES configuracion_sistema(id_configuracion),
    
    clave VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT NOT NULL,
    
    id_modificado_por UUID REFERENCES usuario(id_usuario),
    razon_cambio TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE configuracion_historial IS 'Historial de cambios en configuración del sistema';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 18. TABLAS AUXILIARES Y EXTENSIBILIDAD
-- ═══════════════════════════════════════════════════════════════════════════════════

-- FAQ (Preguntas Frecuentes)
CREATE TABLE faq (
    id_faq UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    categoria VARCHAR(50) CHECK (categoria IN ('general', 'cliente', 'profesional', 'pagos', 'seguridad')),
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    
    orden INTEGER DEFAULT 0,
    esta_activo BOOLEAN DEFAULT true,
    es_destacado BOOLEAN DEFAULT false,
    
    vistas INTEGER DEFAULT 0,
    votos_utiles INTEGER DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE faq IS 'Preguntas frecuentes por categoría';

-- Reportes de usuarios (contenido inapropiado, fraude, etc.)
CREATE TABLE reporte (
    id_reporte UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reportante
    id_reportante UUID NOT NULL REFERENCES usuario(id_usuario),
    
    -- Entidad reportada
    tipo_entidad VARCHAR(30) NOT NULL CHECK (tipo_entidad IN ('usuario', 'servicio', 'resena', 'mensaje', 'disputa')),
    id_entidad UUID NOT NULL,
    id_usuario_reportado UUID REFERENCES usuario(id_usuario),
    
    -- Motivo
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN (
        'contenido_inapropiado',
        'spam',
        'fraude',
        'acoso',
        'informacion_falsa',
        'violacion_terminos',
        'otro'
    )),
    descripcion TEXT NOT NULL,
    
    -- Evidencia
    capturas_pantalla TEXT[],
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'rechazado', 'cerrado')),
    id_revisado_por UUID REFERENCES usuario(id_usuario),
    decision TEXT,
    accion_tomada VARCHAR(50),
    
    -- Timestamps
    revisado_en TIMESTAMP,
    resuelto_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE reporte IS 'Reportes de usuarios sobre contenido o comportamiento inapropiado';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 19. ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Índices de usuario
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_rut ON usuario(rut);
CREATE INDEX idx_usuario_ubicacion ON usuario(id_region, id_comuna);
CREATE INDEX idx_usuario_rol ON usuario(rol);
CREATE INDEX idx_usuario_activo ON usuario(esta_activo);
CREATE INDEX idx_usuario_nombre_completo ON usuario((nombres || ' ' || apellidos));
CREATE INDEX idx_usuario_email_verificado ON usuario(email_verificado) WHERE email_verificado = true;

-- Índices de perfiles profesionales
CREATE INDEX idx_perfil_profesional_usuario ON perfil_profesional(id_usuario);
CREATE INDEX idx_perfil_profesional_verificacion ON perfil_profesional(estado_verificacion_general);
CREATE INDEX idx_perfil_profesional_activo ON perfil_profesional(esta_activo, acepta_nuevos_trabajos);
CREATE INDEX idx_perfil_profesional_calificacion ON perfil_profesional(calificacion_promedio DESC) WHERE esta_activo = true;
CREATE INDEX idx_perfil_profesional_destacado ON perfil_profesional(es_destacado) WHERE es_destacado = true;

-- Índices de servicios profesionales
CREATE INDEX idx_servicio_profesional_perfil ON servicio_profesional(id_perfil_profesional);
CREATE INDEX idx_servicio_profesional_categoria ON servicio_profesional(id_categoria_servicio);
CREATE INDEX idx_servicio_profesional_activo ON servicio_profesional(esta_activo, esta_disponible);
CREATE INDEX idx_servicio_profesional_verificacion ON servicio_profesional(estado_verificacion);
CREATE INDEX idx_servicio_profesional_calificacion ON servicio_profesional(calificacion DESC);
CREATE INDEX idx_servicio_profesional_precio ON servicio_profesional(precio_fijo);

-- Índices de solicitudes
CREATE INDEX idx_solicitud_servicio_cliente ON solicitud_servicio(id_cliente);
CREATE INDEX idx_solicitud_servicio_profesional ON solicitud_servicio(id_profesional);
CREATE INDEX idx_solicitud_servicio_estado ON solicitud_servicio(estado);
CREATE INDEX idx_solicitud_servicio_fecha ON solicitud_servicio(fecha_programada);
CREATE INDEX idx_solicitud_servicio_ubicacion ON solicitud_servicio(id_region_servicio, id_comuna_servicio);
CREATE INDEX idx_solicitud_servicio_codigo ON solicitud_servicio(codigo_solicitud);
CREATE INDEX idx_solicitud_servicio_creado ON solicitud_servicio(creado_en DESC);

-- Índices de horarios
CREATE INDEX idx_horario_servicio_profesional ON horario_servicio_profesional(id_servicio_profesional);
CREATE INDEX idx_periodo_personalizado_servicio ON periodo_horario_personalizado(id_servicio_profesional);
CREATE INDEX idx_periodo_personalizado_fechas ON periodo_horario_personalizado(fecha_inicio, fecha_fin);
CREATE INDEX idx_dia_no_disponible_servicio ON dia_no_disponible(id_servicio_profesional);
CREATE INDEX idx_dia_no_disponible_fecha ON dia_no_disponible(fecha_inicio, fecha_fin);

-- Índices de documentos
CREATE INDEX idx_documento_verificacion_servicio ON documento_verificacion(id_servicio_profesional);
CREATE INDEX idx_documento_verificacion_perfil ON documento_verificacion(id_perfil_profesional);
CREATE INDEX idx_documento_verificacion_estado ON documento_verificacion(estado_verificacion);
CREATE INDEX idx_documento_verificacion_tipo ON documento_verificacion(tipo_documento);

-- Índices de cuentas bancarias
CREATE INDEX idx_cuenta_bancaria_usuario ON cuenta_bancaria(id_usuario);
CREATE INDEX idx_cuenta_bancaria_principal ON cuenta_bancaria(id_usuario, es_principal) WHERE es_principal = true;
CREATE INDEX idx_cuenta_bancaria_tipo ON cuenta_bancaria(tipo_entidad);
CREATE INDEX idx_cuenta_bancaria_activa ON cuenta_bancaria(esta_activa) WHERE esta_activa = true;

-- Índices de pagos
CREATE INDEX idx_pago_solicitud ON pago(id_solicitud_servicio);
CREATE INDEX idx_pago_estado ON pago(estado);
CREATE INDEX idx_pago_mercadopago ON pago(id_pago_mercadopago);
CREATE INDEX idx_pago_codigo ON pago(codigo_pago);
CREATE INDEX idx_pago_fecha ON pago(creado_en DESC);

-- Índices de transacciones bancarias
CREATE INDEX idx_transaccion_cuenta ON transaccion_bancaria(id_cuenta_bancaria);
CREATE INDEX idx_transaccion_pago ON transaccion_bancaria(id_pago);
CREATE INDEX idx_transaccion_solicitud ON transaccion_bancaria(id_solicitud_servicio);
CREATE INDEX idx_transaccion_estado ON transaccion_bancaria(estado);
CREATE INDEX idx_transaccion_tipo ON transaccion_bancaria(tipo_transaccion);
CREATE INDEX idx_transaccion_fecha ON transaccion_bancaria(creado_en DESC);

-- Índices de reseñas
CREATE INDEX idx_resena_evaluado ON resena(id_evaluado);
CREATE INDEX idx_resena_servicio ON resena(id_servicio_profesional);
CREATE INDEX idx_resena_calificacion ON resena(calificacion DESC);
CREATE INDEX idx_resena_publica ON resena(es_publica) WHERE es_publica = true;
CREATE INDEX idx_resena_destacada ON resena(es_destacada) WHERE es_destacada = true;

-- Índices de notificaciones
CREATE INDEX idx_notificacion_usuario ON notificacion(id_usuario);
CREATE INDEX idx_notificacion_no_leida ON notificacion(id_usuario, esta_leida) WHERE esta_leida = false;
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo);
CREATE INDEX idx_notificacion_fecha ON notificacion(creado_en DESC);

-- Índices de mensajes
CREATE INDEX idx_conversacion_usuarios ON conversacion(id_usuario_1, id_usuario_2);
CREATE INDEX idx_conversacion_solicitud ON conversacion(id_solicitud_servicio);
CREATE INDEX idx_mensaje_conversacion ON mensaje(id_conversacion);
CREATE INDEX idx_mensaje_remitente ON mensaje(id_remitente);
CREATE INDEX idx_mensaje_fecha ON mensaje(enviado_en DESC);

-- Índices de disputas
CREATE INDEX idx_disputa_solicitud ON disputa(id_solicitud_servicio);
CREATE INDEX idx_disputa_solicitante ON disputa(id_solicitante);
CREATE INDEX idx_disputa_estado ON disputa(estado);
CREATE INDEX idx_disputa_mediador ON disputa(id_mediador);
CREATE INDEX idx_disputa_codigo ON disputa(codigo_disputa);

-- Índices de auditoría
CREATE INDEX idx_log_administrador_admin ON log_administrador(id_administrador);
CREATE INDEX idx_log_administrador_fecha ON log_administrador(creado_en DESC);
CREATE INDEX idx_log_administrador_tipo ON log_administrador(tipo_entidad);
CREATE INDEX idx_log_administrador_accion ON log_administrador(accion);

-- Índices de búsqueda de texto
CREATE INDEX idx_categoria_servicio_nombre_trgm ON categoria_servicio USING gin(nombre gin_trgm_ops);
CREATE INDEX idx_servicio_profesional_descripcion_trgm ON servicio_profesional USING gin(descripcion gin_trgm_ops);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 20. FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de timestamp a todas las tablas relevantes
CREATE TRIGGER trigger_actualizar_usuario 
    BEFORE UPDATE ON usuario 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_perfil_profesional 
    BEFORE UPDATE ON perfil_profesional 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_servicio_profesional 
    BEFORE UPDATE ON servicio_profesional 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_solicitud_servicio 
    BEFORE UPDATE ON solicitud_servicio 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_pago 
    BEFORE UPDATE ON pago 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_resena 
    BEFORE UPDATE ON resena 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_configuracion 
    BEFORE UPDATE ON configuracion_sistema 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_categoria_servicio 
    BEFORE UPDATE ON categoria_servicio 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_cuenta_bancaria 
    BEFORE UPDATE ON cuenta_bancaria 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_conversacion 
    BEFORE UPDATE ON conversacion 
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Función para asegurar solo una cuenta principal por usuario/entidad
CREATE OR REPLACE FUNCTION asegurar_cuenta_bancaria_principal()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se marca como principal, desmarcar otras cuentas
    IF NEW.es_principal = true THEN
        UPDATE cuenta_bancaria 
        SET es_principal = false,
            actualizado_en = CURRENT_TIMESTAMP
        WHERE tipo_entidad = NEW.tipo_entidad
        AND id_cuenta_bancaria != COALESCE(NEW.id_cuenta_bancaria, '00000000-0000-0000-0000-000000000000'::uuid)
        AND (
            (NEW.id_usuario IS NOT NULL AND id_usuario = NEW.id_usuario)
            OR
            (NEW.id_usuario IS NULL AND tipo_entidad = 'servihogar')
        );
    END IF;
    
    -- Si es la primera cuenta activa, marcarla como principal
    IF TG_OP = 'INSERT' AND NEW.es_principal = false AND NEW.esta_activa = true THEN
        DECLARE
            cuenta_existente INTEGER;
        BEGIN
            IF NEW.tipo_entidad = 'profesional' THEN
                SELECT COUNT(*) INTO cuenta_existente
                FROM cuenta_bancaria
                WHERE id_usuario = NEW.id_usuario
                AND tipo_entidad = 'profesional'
                AND esta_activa = true;
            ELSE
                SELECT COUNT(*) INTO cuenta_existente
                FROM cuenta_bancaria
                WHERE tipo_entidad = 'servihogar'
                AND esta_activa = true;
            END IF;
            
            IF cuenta_existente = 0 THEN
                NEW.es_principal := true;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cuenta_principal
BEFORE INSERT OR UPDATE ON cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION asegurar_cuenta_bancaria_principal();

-- Función para validar límite de cuentas bancarias (máximo 3)
CREATE OR REPLACE FUNCTION validar_limite_cuentas_bancarias()
RETURNS TRIGGER AS $$
DECLARE
    total_cuentas INTEGER;
BEGIN
    IF NEW.esta_activa = true THEN
        IF NEW.tipo_entidad = 'profesional' THEN
            SELECT COUNT(*) INTO total_cuentas
            FROM cuenta_bancaria
            WHERE id_usuario = NEW.id_usuario
            AND tipo_entidad = 'profesional'
            AND esta_activa = true
            AND id_cuenta_bancaria != COALESCE(NEW.id_cuenta_bancaria, '00000000-0000-0000-0000-000000000000'::uuid);
        ELSE
            SELECT COUNT(*) INTO total_cuentas
            FROM cuenta_bancaria
            WHERE tipo_entidad = 'servihogar'
            AND esta_activa = true
            AND id_cuenta_bancaria != COALESCE(NEW.id_cuenta_bancaria, '00000000-0000-0000-0000-000000000000'::uuid);
        END IF;
        
        IF total_cuentas >= 3 THEN
            RAISE EXCEPTION 'No se pueden tener más de 3 cuentas bancarias activas';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limite_cuentas
BEFORE INSERT OR UPDATE ON cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION validar_limite_cuentas_bancarias();

-- Función para ofuscar número de cuenta
CREATE OR REPLACE FUNCTION ofuscar_numero_cuenta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_cuenta IS NOT NULL THEN
        -- Ofuscar mostrando solo los últimos 4 dígitos
        NEW.numero_cuenta_ofuscado := '****' || RIGHT(NEW.numero_cuenta, 4);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ofuscar_cuenta
BEFORE INSERT OR UPDATE ON cuenta_bancaria
FOR EACH ROW
EXECUTE FUNCTION ofuscar_numero_cuenta();

-- Función para validar límite de servicios por profesional (máximo 3)
CREATE OR REPLACE FUNCTION validar_limite_servicios_profesional()
RETURNS TRIGGER AS $$
DECLARE
    total_servicios INTEGER;
BEGIN
    IF NEW.esta_activo = true THEN
        SELECT COUNT(*) INTO total_servicios
        FROM servicio_profesional
        WHERE id_perfil_profesional = NEW.id_perfil_profesional
        AND esta_activo = true
        AND id_servicio_profesional != COALESCE(NEW.id_servicio_profesional, '00000000-0000-0000-0000-000000000000'::uuid);
        
        IF total_servicios >= 3 THEN
            RAISE EXCEPTION 'Un profesional no puede tener más de 3 servicios activos';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_limite_servicios
BEFORE INSERT OR UPDATE ON servicio_profesional
FOR EACH ROW
EXECUTE FUNCTION validar_limite_servicios_profesional();

-- Función para actualizar calificación promedio del profesional
CREATE OR REPLACE FUNCTION actualizar_calificacion_profesional()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar calificación del servicio específico
    UPDATE servicio_profesional sp
    SET calificacion = (
        SELECT COALESCE(AVG(r.calificacion::decimal), 0)
        FROM resena r
        WHERE r.id_servicio_profesional = NEW.id_servicio_profesional
        AND r.es_publica = true
    )
    WHERE sp.id_servicio_profesional = NEW.id_servicio_profesional;
    
    -- Actualizar calificación promedio general del profesional
    UPDATE perfil_profesional pp
    SET calificacion_promedio = (
        SELECT COALESCE(AVG(r.calificacion::decimal), 0)
        FROM resena r
        JOIN servicio_profesional sp ON r.id_servicio_profesional = sp.id_servicio_profesional
        WHERE sp.id_perfil_profesional = (
            SELECT id_perfil_profesional 
            FROM servicio_profesional 
            WHERE id_servicio_profesional = NEW.id_servicio_profesional
        )
        AND r.es_publica = true
    )
    WHERE pp.id_perfil_profesional = (
        SELECT id_perfil_profesional 
        FROM servicio_profesional 
        WHERE id_servicio_profesional = NEW.id_servicio_profesional
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_calificacion
AFTER INSERT OR UPDATE ON resena
FOR EACH ROW
EXECUTE FUNCTION actualizar_calificacion_profesional();

-- Función para generar código de solicitud secuencial
CREATE OR REPLACE FUNCTION generar_codigo_solicitud()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_codigo VARCHAR(20);
    contador INTEGER;
BEGIN
    IF NEW.codigo_solicitud IS NULL OR NEW.codigo_solicitud = '' THEN
        -- Obtener el contador del año actual
        SELECT COUNT(*) + 1 INTO contador
        FROM solicitud_servicio
        WHERE EXTRACT(YEAR FROM creado_en) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
        
        -- Generar código: SOL-2025-00001
        nuevo_codigo := 'SOL-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.codigo_solicitud := nuevo_codigo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_solicitud
BEFORE INSERT ON solicitud_servicio
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_solicitud();

-- Similar para pagos, transacciones y disputas
CREATE OR REPLACE FUNCTION generar_codigo_pago()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_codigo VARCHAR(20);
    contador INTEGER;
BEGIN
    IF NEW.codigo_pago IS NULL OR NEW.codigo_pago = '' THEN
        SELECT COUNT(*) + 1 INTO contador
        FROM pago
        WHERE EXTRACT(YEAR FROM creado_en) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
        
        nuevo_codigo := 'PAG-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.codigo_pago := nuevo_codigo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_pago
BEFORE INSERT ON pago
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_pago();

CREATE OR REPLACE FUNCTION generar_codigo_transaccion()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_codigo VARCHAR(20);
    contador INTEGER;
BEGIN
    IF NEW.codigo_transaccion IS NULL OR NEW.codigo_transaccion = '' THEN
        SELECT COUNT(*) + 1 INTO contador
        FROM transaccion_bancaria
        WHERE EXTRACT(YEAR FROM creado_en) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
        
        nuevo_codigo := 'TRX-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.codigo_transaccion := nuevo_codigo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_transaccion
BEFORE INSERT ON transaccion_bancaria
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_transaccion();

CREATE OR REPLACE FUNCTION generar_codigo_disputa()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_codigo VARCHAR(20);
    contador INTEGER;
BEGIN
    IF NEW.codigo_disputa IS NULL OR NEW.codigo_disputa = '' THEN
        SELECT COUNT(*) + 1 INTO contador
        FROM disputa
        WHERE EXTRACT(YEAR FROM creado_en) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
        
        nuevo_codigo := 'DIS-' || EXTRACT(YEAR FROM CURRENT_TIMESTAMP) || '-' || LPAD(contador::TEXT, 5, '0');
        NEW.codigo_disputa := nuevo_codigo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_disputa
BEFORE INSERT ON disputa
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_disputa();

-- Función para registrar cambios de estado en solicitudes
CREATE OR REPLACE FUNCTION registrar_cambio_estado_solicitud()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO solicitud_estado_historial (
            id_solicitud_servicio,
            estado_anterior,
            estado_nuevo,
            id_usuario_cambio,
            creado_en
        ) VALUES (
            NEW.id_solicitud_servicio,
            OLD.estado,
            NEW.estado,
            NEW.id_cliente, -- Se puede mejorar para detectar quién hizo el cambio
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_cambio_estado
AFTER UPDATE ON solicitud_servicio
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_estado_solicitud();

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 21. VISTAS PARA CONSULTAS FRECUENTES Y BI
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Vista de profesionales con todos sus servicios
CREATE OR REPLACE VIEW vista_profesionales_completo AS
SELECT 
    pp.id_perfil_profesional,
    u.id_usuario,
    u.nombres,
    u.apellidos,
    u.nombres || ' ' || u.apellidos AS nombre_completo,
    u.email,
    u.telefono,
    u.direccion,
    u.foto_perfil_url,
    r.nombre as region,
    c.nombre as comuna,
    pp.descripcion_general,
    pp.anos_experiencia_total,
    pp.estado_verificacion_general,
    pp.calificacion_promedio,
    pp.total_trabajos_completados,
    pp.total_ganancias,
    pp.esta_activo as perfil_activo,
    pp.acepta_nuevos_trabajos,
    pp.es_destacado,
    pp.es_premium,
    pp.certificado_antecedentes_aprobado,
    
    -- Servicios como JSON
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id_servicio', sp.id_servicio_profesional,
                'categoria_id', cs.id_categoria_servicio,
                'categoria', cs.nombre,
                'slug_categoria', cs.slug,
                'icono', cs.icono,
                'descripcion', sp.descripcion,
                'descripcion_corta', sp.descripcion_corta,
                'experiencia', sp.anos_experiencia,
                'precio_fijo', sp.precio_fijo,
                'precio_anterior', sp.precio_anterior,
                'tipo_duracion', sp.tipo_duracion,
                'duracion_fija', sp.duracion_fija_minutos,
                'duracion_minima', sp.duracion_minima_minutos,
                'duracion_maxima', sp.duracion_maxima_minutos,
                'esta_activo', sp.esta_activo,
                'esta_disponible', sp.esta_disponible,
                'estado_verificacion', sp.estado_verificacion,
                'calificacion', sp.calificacion,
                'trabajos_completados', sp.trabajos_completados,
                'orden_prioridad', sp.orden_prioridad
            )
        ) FILTER (WHERE sp.id_servicio_profesional IS NOT NULL),
        '[]'::json
    ) as servicios
    
FROM perfil_profesional pp
JOIN usuario u ON pp.id_usuario = u.id_usuario
LEFT JOIN region r ON u.id_region = r.id_region
LEFT JOIN comuna c ON u.id_comuna = c.id_comuna
LEFT JOIN servicio_profesional sp ON pp.id_perfil_profesional = sp.id_perfil_profesional
LEFT JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
WHERE u.esta_activo = true
GROUP BY pp.id_perfil_profesional, u.id_usuario, u.nombres, u.apellidos, u.email, 
         u.telefono, u.direccion, u.foto_perfil_url, r.nombre, c.nombre, pp.descripcion_general,
         pp.anos_experiencia_total, pp.estado_verificacion_general, pp.calificacion_promedio, 
         pp.total_trabajos_completados, pp.total_ganancias, pp.esta_activo, pp.acepta_nuevos_trabajos,
         pp.es_destacado, pp.es_premium, pp.certificado_antecedentes_aprobado;

COMMENT ON VIEW vista_profesionales_completo IS 'Vista completa de profesionales con todos sus servicios en formato JSON';

-- Vista de servicios disponibles para búsqueda (optimizada)
CREATE OR REPLACE VIEW vista_servicios_busqueda AS
SELECT 
    sp.id_servicio_profesional,
    sp.id_perfil_profesional,
    u.id_usuario,
    u.nombres || ' ' || u.apellidos AS nombre_profesional,
    u.telefono,
    u.foto_perfil_url,
    r.nombre as region,
    r.id_region,
    c.nombre as comuna,
    c.id_comuna,
    cs.id_categoria_servicio,
    cs.nombre as categoria,
    cs.slug as categoria_slug,
    cs.icono,
    cs.color_hex,
    sp.descripcion,
    sp.descripcion_corta,
    sp.anos_experiencia,
    sp.precio_fijo,
    sp.precio_anterior,
    sp.tipo_duracion,
    sp.duracion_fija_minutos,
    sp.duracion_minima_minutos,
    sp.duracion_maxima_minutos,
    sp.calificacion,
    sp.trabajos_completados,
    pp.descripcion_general,
    pp.calificacion_promedio,
    pp.total_trabajos_completados,
    pp.es_destacado,
    pp.es_premium,
    
    -- Verificar si tiene horarios disponibles
    EXISTS (
        SELECT 1 FROM horario_servicio_profesional h 
        WHERE h.id_servicio_profesional = sp.id_servicio_profesional 
        AND h.esta_habilitado = true
    ) as tiene_horarios,
    
    -- Total de reseñas
    (
        SELECT COUNT(*) 
        FROM resena r 
        WHERE r.id_servicio_profesional = sp.id_servicio_profesional 
        AND r.es_publica = true
    ) as total_resenas
    
FROM servicio_profesional sp
JOIN perfil_profesional pp ON sp.id_perfil_profesional = pp.id_perfil_profesional
JOIN usuario u ON pp.id_usuario = u.id_usuario
JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
LEFT JOIN region r ON u.id_region = r.id_region
LEFT JOIN comuna c ON u.id_comuna = c.id_comuna
WHERE sp.esta_activo = true 
  AND sp.esta_disponible = true 
  AND sp.estado_verificacion = 'aprobado'
  AND pp.esta_activo = true 
  AND pp.acepta_nuevos_trabajos = true
  AND pp.estado_verificacion_general = 'aprobado'
  AND u.esta_activo = true
  AND cs.esta_activo = true;

COMMENT ON VIEW vista_servicios_busqueda IS 'Servicios activos y verificados listos para búsqueda de clientes';

-- Vista de métricas para Business Intelligence
CREATE OR REPLACE VIEW vista_metricas_bi AS
SELECT 
    -- Métricas de usuarios
    (SELECT COUNT(*) FROM usuario WHERE esta_activo = true) as usuarios_activos_total,
    (SELECT COUNT(*) FROM usuario WHERE rol = 'cliente' AND esta_activo = true) as clientes_activos,
    (SELECT COUNT(*) FROM perfil_profesional WHERE esta_activo = true AND estado_verificacion_general = 'aprobado') as profesionales_activos,
    (SELECT COUNT(*) FROM usuario WHERE DATE(creado_en) = CURRENT_DATE) as usuarios_nuevos_hoy,
    (SELECT COUNT(*) FROM usuario WHERE DATE(creado_en) >= DATE_TRUNC('month', CURRENT_DATE)) as usuarios_nuevos_mes,
    
    -- Métricas de servicios
    (SELECT COUNT(*) FROM servicio_profesional WHERE esta_activo = true AND estado_verificacion = 'aprobado') as servicios_activos,
    (SELECT COUNT(*) FROM servicio_profesional WHERE estado_verificacion = 'pendiente') as servicios_pendientes_verificacion,
    (SELECT COUNT(DISTINCT id_perfil_profesional) FROM servicio_profesional WHERE esta_activo = true) as profesionales_con_servicios,
    
    -- Métricas de solicitudes
    (SELECT COUNT(*) FROM solicitud_servicio WHERE DATE(creado_en) = CURRENT_DATE) as solicitudes_hoy,
    (SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'completado' AND DATE(completado_en) = CURRENT_DATE) as servicios_completados_hoy,
    (SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'pendiente') as solicitudes_pendientes,
    (SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'confirmado') as solicitudes_confirmadas,
    (SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'en_progreso') as solicitudes_en_progreso,
    (SELECT COUNT(*) FROM solicitud_servicio WHERE estado = 'en_disputa') as solicitudes_en_disputa,
    
    -- Métricas financieras
    (SELECT COALESCE(SUM(precio_servicio), 0) FROM solicitud_servicio WHERE estado = 'completado' AND DATE_TRUNC('month', completado_en) = DATE_TRUNC('month', CURRENT_DATE)) as ingresos_mes_actual,
    (SELECT COALESCE(SUM(precio_servicio), 0) FROM solicitud_servicio WHERE estado = 'completado' AND DATE(completado_en) = CURRENT_DATE) as ingresos_hoy,
    (SELECT COALESCE(SUM(comision_plataforma), 0) FROM solicitud_servicio WHERE estado = 'completado' AND DATE_TRUNC('month', completado_en) = DATE_TRUNC('month', CURRENT_DATE)) as comisiones_mes_actual,
    
    -- Métricas de pagos
    (SELECT COUNT(*) FROM pago WHERE estado = 'aprobado' AND DATE(pagado_en) = CURRENT_DATE) as pagos_aprobados_hoy,
    (SELECT COUNT(*) FROM pago WHERE estado = 'pendiente') as pagos_pendientes,
    (SELECT COALESCE(SUM(monto_total), 0) FROM pago WHERE estado = 'aprobado' AND DATE_TRUNC('month', pagado_en) = DATE_TRUNC('month', CURRENT_DATE)) as monto_pagos_mes,
    
    -- Métricas de calidad
    (SELECT COALESCE(AVG(calificacion::decimal), 0) FROM resena WHERE es_publica = true) as calificacion_promedio_global,
    (SELECT COUNT(*) FROM resena WHERE DATE(creado_en) >= DATE_TRUNC('month', CURRENT_DATE)) as resenas_mes_actual,
    (SELECT COUNT(*) FROM resena WHERE es_destacada = true AND es_publica = true) as resenas_destacadas,
    
    -- Métricas de verificación
    (SELECT COUNT(*) FROM documento_verificacion WHERE estado_verificacion = 'pendiente') as documentos_pendientes_verificacion,
    (SELECT COUNT(*) FROM servicio_profesional WHERE estado_verificacion = 'pendiente') as servicios_pendientes_aprobacion,
    
    -- Métricas de disputas
    (SELECT COUNT(*) FROM disputa WHERE estado IN ('abierta', 'en_revision', 'en_mediacion')) as disputas_activas,
    
    -- Timestamp de actualización
    CURRENT_TIMESTAMP as actualizado_en;

COMMENT ON VIEW vista_metricas_bi IS 'Métricas principales para Dashboard de Business Intelligence';

-- Vista de documentos pendientes de verificación (para Verificadores)
CREATE OR REPLACE VIEW vista_documentos_pendientes AS
SELECT 
    dv.id_documento,
    dv.tipo_documento,
    dv.categoria_documento,
    dv.es_obligatorio,
    dv.nombre_archivo_original,
    dv.url_archivo,
    dv.url_miniatura,
    dv.tamano_archivo_bytes,
    dv.estado_verificacion,
    dv.subido_en,
    
    -- Información del profesional
    u.id_usuario,
    u.nombres || ' ' || u.apellidos AS nombre_profesional,
    u.email,
    u.telefono,
    u.rut,
    
    -- Información del servicio
    sp.id_servicio_profesional,
    cs.nombre AS categoria_servicio,
    sp.descripcion AS descripcion_servicio,
    
    -- Información del perfil
    pp.id_perfil_profesional,
    pp.estado_verificacion_general,
    pp.certificado_antecedentes_aprobado,
    sp.es_primer_servicio,
    
    -- Tiempo transcurrido
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - dv.subido_en))/3600 AS horas_desde_subida
    
FROM documento_verificacion dv
JOIN servicio_profesional sp ON dv.id_servicio_profesional = sp.id_servicio_profesional
JOIN perfil_profesional pp ON dv.id_perfil_profesional = pp.id_perfil_profesional
JOIN usuario u ON pp.id_usuario = u.id_usuario
JOIN categoria_servicio cs ON sp.id_categoria_servicio = cs.id_categoria_servicio
WHERE dv.estado_verificacion IN ('pendiente', 'en_revision')
ORDER BY dv.subido_en ASC;

COMMENT ON VIEW vista_documentos_pendientes IS 'Documentos pendientes de verificación con información del profesional y servicio';

-- Vista de transacciones por profesional
CREATE OR REPLACE VIEW vista_transacciones_profesional AS
SELECT 
    u.id_usuario,
    u.nombres || ' ' || u.apellidos AS nombre_profesional,
    COUNT(DISTINCT ss.id_solicitud_servicio) AS total_servicios,
    COUNT(DISTINCT CASE WHEN ss.estado = 'completado' THEN ss.id_solicitud_servicio END) AS servicios_completados,
    COALESCE(SUM(CASE WHEN ss.estado = 'completado' THEN ss.precio_servicio ELSE 0 END), 0) AS ingresos_totales,
    COALESCE(SUM(CASE WHEN ss.estado = 'completado' THEN ss.comision_plataforma ELSE 0 END), 0) AS comisiones_pagadas,
    COALESCE(SUM(CASE WHEN ss.estado = 'completado' THEN (ss.precio_servicio - ss.comision_plataforma) ELSE 0 END), 0) AS ingresos_netos,
    COALESCE(AVG(CASE WHEN r.calificacion IS NOT NULL THEN r.calificacion END), 0) AS calificacion_promedio,
    COUNT(DISTINCT r.id_resena) AS total_resenas,
    COUNT(DISTINCT cb.id_cuenta_bancaria) AS cuentas_bancarias,
    COUNT(DISTINCT tb.id_transaccion) AS total_transacciones,
    COALESCE(SUM(CASE WHEN tb.estado = 'exitosa' THEN tb.monto ELSE 0 END), 0) AS monto_transferido
FROM usuario u
JOIN perfil_profesional pp ON u.id_usuario = pp.id_usuario
LEFT JOIN servicio_profesional sp ON pp.id_perfil_profesional = sp.id_perfil_profesional
LEFT JOIN solicitud_servicio ss ON u.id_usuario = ss.id_profesional
LEFT JOIN resena r ON ss.id_solicitud_servicio = r.id_solicitud_servicio
LEFT JOIN cuenta_bancaria cb ON u.id_usuario = cb.id_usuario AND cb.esta_activa = true
LEFT JOIN pago p ON ss.id_solicitud_servicio = p.id_solicitud_servicio
LEFT JOIN transaccion_bancaria tb ON p.id_pago = tb.id_pago
WHERE u.rol = 'profesional'
GROUP BY u.id_usuario, u.nombres, u.apellidos;

COMMENT ON VIEW vista_transacciones_profesional IS 'Resumen financiero y estadísticas por profesional';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 22. DATOS INICIALES
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Regiones de Chile (15 regiones)
INSERT INTO region (nombre, codigo, esta_activo) VALUES
('Región de Arica y Parinacota', 'XV', true),
('Región de Tarapacá', 'I', true),
('Región de Antofagasta', 'II', true),
('Región de Atacama', 'III', true),
('Región de Coquimbo', 'IV', true),
('Región de Valparaíso', 'V', true),
('Región Metropolitana de Santiago', 'RM', true),
('Región del Libertador General Bernardo O''Higgins', 'VI', true),
('Región del Maule', 'VII', true),
('Región del Ñuble', 'XVI', true),
('Región del Biobío', 'VIII', true),
('Región de La Araucanía', 'IX', true),
('Región de Los Ríos', 'XIV', true),
('Región de Los Lagos', 'X', true),
('Región de Aysén del General Carlos Ibáñez del Campo', 'XI', true),
('Región de Magallanes y de la Antártica Chilena', 'XII', true)
ON CONFLICT (codigo) DO NOTHING;

-- Categorías de servicios iniciales
INSERT INTO categoria_servicio (nombre, slug, descripcion, descripcion_corta, icono, color_hex, orden_visualizacion, esta_activo) VALUES
('Gasfitería', 'gasfiteria', 'Servicios profesionales de fontanería, plomería y sistemas de agua. Instalación, reparación y mantenimiento de sistemas hidráulicos.', 'Instalación y reparación de sistemas de agua', 'Wrench', '#3B82F6', 1, true),
('Limpieza del Hogar', 'limpieza-hogar', 'Servicios de limpieza doméstica profesional y mantenimiento del hogar. Limpieza profunda, regular y especializada.', 'Limpieza profesional para tu hogar', 'Home', '#10B981', 2, true),
('Jardinería', 'jardineria', 'Servicios de jardinería, paisajismo y mantención de áreas verdes. Poda, diseño y cuidado de jardines.', 'Mantención y diseño de jardines', 'Scissors', '#8B5CF6', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, categoria, valor, valor_default, descripcion, tipo_dato, es_publico, es_modificable) VALUES
-- General
('nombre_plataforma', 'general', 'ServiHogar', 'ServiHogar', 'Nombre de la plataforma', 'string', true, false),
('email_contacto', 'general', 'contacto@servihogar.cl', 'contacto@servihogar.cl', 'Email de contacto principal', 'string', true, true),
('telefono_soporte', 'general', '+56 2 2345 6789', '+56 2 2345 6789', 'Teléfono de soporte', 'string', true, true),
('direccion_oficina', 'general', 'Santiago, Chile', 'Santiago, Chile', 'Dirección de oficinas', 'string', true, true),

-- Archivos y uploads
('tamano_maximo_archivo_mb', 'archivos', '5', '5', 'Tamaño máximo de archivos en MB', 'integer', false, true),
('tipos_archivos_permitidos', 'archivos', 'jpg,jpeg,png,pdf', 'jpg,jpeg,png,pdf', 'Extensiones de archivo permitidas', 'string', false, true),
('tamano_maximo_imagen_perfil_mb', 'archivos', '2', '2', 'Tamaño máximo de imagen de perfil en MB', 'integer', false, true),

-- Verificación
('tiempo_limite_verificacion_horas', 'verificacion', '48', '48', 'Tiempo límite para verificación en horas', 'integer', false, true),
('aprobacion_automatica_verificados', 'verificacion', 'true', 'true', 'Aprueba automáticamente profesionales ya verificados', 'boolean', false, true),
('requiere_antecedentes_primer_servicio', 'verificacion', 'true', 'true', 'Requiere certificado de antecedentes en primer servicio', 'boolean', false, true),

-- Servicios
('max_servicios_por_profesional', 'servicios', '3', '3', 'Máximo servicios que puede ofrecer un profesional', 'integer', false, false),
('precio_minimo_servicio', 'servicios', '10000', '10000', 'Precio mínimo de servicio en CLP', 'integer', true, true),
('precio_maximo_servicio', 'servicios', '500000', '500000', 'Precio máximo de servicio en CLP', 'integer', true, true),
('duracion_minima_servicio_minutos', 'servicios', '30', '30', 'Duración mínima de un servicio en minutos', 'integer', false, true),
('duracion_maxima_servicio_minutos', 'servicios', '480', '480', 'Duración máxima de un servicio en minutos (8 horas)', 'integer', false, true),

-- Pagos y comisiones
('porcentaje_comision', 'pagos', '15', '15', 'Porcentaje de comisión de la plataforma', 'integer', false, true),
('dias_retencion_pago', 'pagos', '7', '7', 'Días de retención antes de liberar pago al profesional', 'integer', false, true),
('monto_minimo_retiro', 'pagos', '10000', '10000', 'Monto mínimo para solicitar retiro en CLP', 'integer', false, true),
('max_cuentas_bancarias', 'pagos', '3', '3', 'Máximo de cuentas bancarias por usuario', 'integer', false, false),

-- Calificaciones
('calificacion_minima_profesional', 'calificaciones', '3.0', '3.0', 'Calificación mínima para mantener cuenta activa', 'decimal', false, true),
('minimo_servicios_calificacion', 'calificaciones', '5', '5', 'Mínimo de servicios para mostrar calificación', 'integer', false, true),

-- Notificaciones
('enviar_email_bienvenida', 'notificaciones', 'true', 'true', 'Enviar email de bienvenida a nuevos usuarios', 'boolean', false, true),
('enviar_recordatorio_servicio_horas', 'notificaciones', '24', '24', 'Horas antes del servicio para enviar recordatorio', 'integer', false, true),

-- Seguridad
('max_intentos_login', 'seguridad', '5', '5', 'Máximo intentos de login antes de bloquear cuenta', 'integer', false, true),
('tiempo_bloqueo_minutos', 'seguridad', '30', '30', 'Tiempo de bloqueo después de exceder intentos', 'integer', false, true),
('expiracion_token_horas', 'seguridad', '24', '24', 'Tiempo de expiración de tokens de verificación', 'integer', false, true),

-- Sistema
('modo_mantenimiento', 'sistema', 'false', 'false', 'Activa/desactiva el modo mantenimiento', 'boolean', false, true),
('permitir_registro_profesionales', 'sistema', 'true', 'true', 'Permite registro de nuevos profesionales', 'boolean', false, true),
('permitir_registro_clientes', 'sistema', 'true', 'true', 'Permite registro de nuevos clientes', 'boolean', false, true),
('version_app', 'sistema', '2.0.0', '2.0.0', 'Versión actual de la aplicación', 'string', true, false)
ON CONFLICT (clave) DO NOTHING;

-- FAQs iniciales
-- Evitar duplicados en FAQs al re-ejecutar el script
CREATE UNIQUE INDEX IF NOT EXISTS uq_faq_categoria_pregunta ON faq(categoria, pregunta);

INSERT INTO faq (categoria, pregunta, respuesta, orden, esta_activo, es_destacado) VALUES
('general', '¿Qué es ServiHogar?', 'ServiHogar es una plataforma que conecta a personas que necesitan servicios para el hogar con profesionales verificados. Ofrecemos servicios de gasfitería, limpieza del hogar y jardinería en todo Chile.', 1, true, true),
('general', '¿En qué regiones operan?', 'Actualmente operamos en las 15 regiones de Chile. Puedes seleccionar tu región al registrarte o buscar servicios.', 2, true, true),
('cliente', '¿Cómo solicito un servicio?', 'Para solicitar un servicio: 1) Busca el servicio que necesitas, 2) Selecciona un profesional, 3) Elige fecha y hora, 4) Confirma tu solicitud y realiza el pago. Recibirás confirmación por email.', 1, true, true),
('cliente', '¿Cómo se realiza el pago?', 'Los pagos se procesan de forma segura a través de MercadoPago. Aceptamos tarjetas de crédito, débito y transferencias bancarias. El pago se retiene hasta que el servicio se complete satisfactoriamente.', 2, true, true),
('profesional', '¿Cómo me registro como profesional?', 'Para registrarte como profesional: 1) Crea una cuenta, 2) Completa tu perfil profesional, 3) Sube tus documentos de verificación, 4) Espera la aprobación (24-48 horas). Una vez aprobado, podrás ofrecer hasta 3 servicios.', 1, true, true),
('profesional', '¿Cuánto cobra la plataforma?', 'ServiHogar cobra una comisión del 15% sobre el valor del servicio. Tú estableces tus propios precios y recibes el 85% de cada servicio completado.', 2, true, true),
('pagos', '¿Cuándo recibo mi pago como profesional?', 'Los pagos se liberan 7 días después de completar el servicio, siempre que el cliente no haya abierto una disputa. Los fondos se transfieren directamente a tu cuenta bancaria registrada.', 1, true, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 23. COMENTARIOS FINALES Y RESUMEN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Deshabilitado para evitar modificar comentarios a nivel de base de datos por accidente
-- COMMENT ON DATABASE postgres IS 'ServiHogar - Plataforma de Servicios para el Hogar';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- RESUMEN DE LA BASE DE DATOS
-- ═══════════════════════════════════════════════════════════════════════════════════
--
-- TABLAS PRINCIPALES (35 total):
-- ✅ 2 Geografía: region, comuna
-- ✅ 1 Categorías: categoria_servicio
-- ✅ 1 Usuarios: usuario
-- ✅ 3 Profesionales: perfil_profesional, servicio_profesional, cuenta_bancaria
-- ✅ 4 Horarios: horario_servicio_profesional, periodo_horario_personalizado, 
--              horario_periodo_personalizado, dia_no_disponible
-- ✅ 3 Documentos: documento_verificacion, documento_historial
-- ✅ 2 Solicitudes: solicitud_servicio, solicitud_estado_historial
-- ✅ 3 Pagos: pago, transaccion_bancaria
-- ✅ 2 Calificaciones: resena, resena_voto_utilidad
-- ✅ 3 Comunicación: notificacion, conversacion, mensaje
-- ✅ 2 Disputas: disputa, disputa_mensaje
-- ✅ 2 Promociones: codigo_descuento, codigo_descuento_uso
-- ✅ 4 Administración: log_administrador, log_sistema, configuracion_sistema, 
--                     configuracion_historial
-- ✅ 2 Auxiliares: faq, reporte
--
-- FUNCIONES Y TRIGGERS:
-- ✅ 15+ funciones automatizadas
-- ✅ 20+ triggers
--
-- VISTAS:
-- ✅ 6 vistas principales para BI y consultas
--
-- ÍNDICES:
-- ✅ 70+ índices para optimización
--
-- EXTENSIONES REQUERIDAS:
-- ✅ uuid-ossp (UUIDs)
-- ✅ btree_gist (rangos de fechas)
-- ✅ pg_trgm (búsqueda de texto)
-- ✅ unaccent (búsqueda sin acentos)
--
-- CARACTERÍSTICAS:
-- ✅ Sistema multi-rol escalable
-- ✅ Múltiples servicios por profesional (máximo 3)
-- ✅ Horarios con 3 niveles de jerarquía
-- ✅ Verificación diferenciada de documentos
-- ✅ Sistema de cuentas bancarias con fallback
-- ✅ Integración completa con MercadoPago
-- ✅ Sistema de disputas y mediación
-- ✅ Mensajería directa entre usuarios
-- ✅ Promociones y descuentos
-- ✅ Auditoría completa de acciones
-- ✅ Business Intelligence integrado
-- ✅ Escalable para futuras funcionalidades
--
-- ═══════════════════════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT - BASE DE DATOS LISTA PARA PRODUCCIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ BASE DE DATOS SERVIHOGAR CREADA EXITOSAMENTE';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADÍSTICAS:';
    RAISE NOTICE '   • 35 Tablas principales';
    RAISE NOTICE '   • 15+ Regiones de Chile';
    RAISE NOTICE '   • 3 Categorías de servicio';
    RAISE NOTICE '   • 70+ Índices de optimización';
    RAISE NOTICE '   • 15+ Funciones automatizadas';
    RAISE NOTICE '   • 20+ Triggers activos';
    RAISE NOTICE '   • 6 Vistas para consultas';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FUNCIONALIDADES:';
    RAISE NOTICE '   ✅ Sistema multi-rol completo';
    RAISE NOTICE '   ✅ Múltiples servicios por profesional';
    RAISE NOTICE '   ✅ Sistema de horarios avanzado';
    RAISE NOTICE '   ✅ Verificación de documentos';
    RAISE NOTICE '   ✅ Cuentas bancarias con fallback';
    RAISE NOTICE '   ✅ Integración MercadoPago';
    RAISE NOTICE '   ✅ Sistema de disputas';
    RAISE NOTICE '   ✅ Mensajería directa';
    RAISE NOTICE '   ✅ Promociones y descuentos';
    RAISE NOTICE '   ✅ Business Intelligence';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Poblar datos de comunas por región';
    RAISE NOTICE '   2. Crear usuario administrador inicial';
    RAISE NOTICE '   3. Configurar cuentas bancarias ServiHogar';
    RAISE NOTICE '   4. Revisar configuración del sistema';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
    RAISE NOTICE '📅 Versión: 2.0 - Enero 2025';
    RAISE NOTICE '👥 Equipo: Matias Reuque & Juan Silva';
    RAISE NOTICE '🏢 Proyecto: ServiHogar - Plataforma de Servicios para el Hogar';
    RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
