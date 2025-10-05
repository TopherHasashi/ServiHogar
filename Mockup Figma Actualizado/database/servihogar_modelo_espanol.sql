-- =================================================================
-- MODELO DE DATOS SERVIHOGAR - VERSIÓN EN ESPAÑOL
-- Plataforma de Servicios para el Hogar (Chile)
-- Nombres de tablas en singular y en español
--
-- MODELO DE PRECIOS FIJOS:
-- ✅ Todos los servicios tienen precio fijo (no varía por tiempo)
-- ✅ Duraciones son solo informativas para planificación
-- ✅ precio_por_hora = precio fijo del servicio completo
-- ✅ precio_total = siempre igual al precio fijo
-- =================================================================

-- Tabla de región de Chile
CREATE TABLE region (
    id_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comuna por región
CREATE TABLE comuna (
    id_comuna UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_region UUID NOT NULL REFERENCES region(id_region) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_region, nombre)
);

-- Tabla de categoría de servicio
CREATE TABLE categoria_servicio (
    id_categoria_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE, -- 'Gasfitería', 'Limpieza del Hogar', 'Jardinería'
    descripcion TEXT,
    icono VARCHAR(50), -- Nombre del ícono para UI
    esta_activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de usuario
CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rut VARCHAR(12) UNIQUE NOT NULL, -- RUT chileno con formato 12.345.678-9
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero-no-decir')),
    fecha_nacimiento DATE,
    id_region UUID REFERENCES region(id_region),
    id_comuna UUID REFERENCES comuna(id_comuna),
    direccion TEXT NOT NULL, -- Campo obligatorio según modificación reciente
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'profesional', 'administrador', 'verificador')),
    esta_activo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    miembro_desde TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perfil profesional
CREATE TABLE perfil_profesional (
    id_perfil_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    anos_experiencia VARCHAR(10) NOT NULL, -- '1', '2', '3', '4', '5+'
    descripcion TEXT NOT NULL,
    
    -- Configuración de duración (SOLO INFORMATIVA para el cliente)
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija', 'rango')),
    duracion_fija_minutos INTEGER, -- Duración estimada fija (informativa)
    duracion_minima_minutos INTEGER, -- Duración mínima estimada (informativa)
    duracion_maxima_minutos INTEGER, -- Duración máxima estimada (informativa)
    
    -- PRECIO FIJO DEL SERVICIO (no varía por tiempo)
    precio_por_hora INTEGER NOT NULL, -- NOTA: Ahora representa el precio FIJO del servicio completo (mantiene nombre por compatibilidad)
    
    -- Estado de verificación
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado', 'suspendido')),
    id_verificado_por UUID REFERENCES usuario(id_usuario), -- Referencia al verificador
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    -- Métricas del profesional
    calificacion DECIMAL(3,2) DEFAULT 0.00 CHECK (calificacion >= 0 AND calificacion <= 5),
    trabajos_completados INTEGER DEFAULT 0,
    ganancias_totales INTEGER DEFAULT 0, -- En pesos chilenos
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario) -- Un usuario solo puede tener un perfil profesional
);

-- Tabla de documento profesional
CREATE TABLE documento_profesional (
    id_documento_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('cedula', 'antecedentes', 'certificado', 'experiencia', 'titulo')),
    nombre_documento VARCHAR(255) NOT NULL,
    url_archivo TEXT NOT NULL,
    tamano_archivo INTEGER, -- Tamaño en bytes
    tipo_mime VARCHAR(100),
    es_obligatorio BOOLEAN DEFAULT false, -- Antecedentes es obligatorio
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de horario profesional
CREATE TABLE horario_profesional (
    id_horario_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Domingo, 6=Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    esta_disponible BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_perfil_profesional, dia_semana, hora_inicio)
);

-- Tabla de solicitud servicio
CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID NOT NULL REFERENCES usuario(id_usuario),
    id_profesional UUID NOT NULL REFERENCES usuario(id_usuario),
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- Detalles del servicio
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    
    -- Ubicación del servicio
    direccion_servicio TEXT NOT NULL,
    id_region_servicio UUID REFERENCES region(id_region),
    id_comuna_servicio UUID REFERENCES comuna(id_comuna),
    
    -- Precios fijos del servicio
    precio_por_hora INTEGER NOT NULL, -- PRECIO FIJO del servicio (no varía por tiempo)
    precio_total INTEGER NOT NULL, -- Siempre igual al precio_por_hora en el modelo actual
    moneda VARCHAR(3) DEFAULT 'CLP',
    
    -- Estados del servicio
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado', 'en_disputa')),
    
    -- Timestamps de estado
    confirmado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    razon_cancelacion TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pago y transacciones (MercadoPago)
CREATE TABLE pago (
    id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- Información de MercadoPago
    id_pago_mercadopago VARCHAR(255) UNIQUE,
    id_preferencia_mercadopago VARCHAR(255),
    
    -- Detalles del pago
    monto INTEGER NOT NULL, -- En pesos chilenos
    moneda VARCHAR(3) DEFAULT 'CLP',
    metodo_pago VARCHAR(50), -- 'credit_card', 'debit_card', 'bank_transfer', etc.
    
    -- Estados del pago
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'autorizado', 'en_proceso', 'en_mediacion', 'rechazado', 'cancelado', 'reembolsado', 'contraargado')),
    
    -- Timestamps
    pagado_en TIMESTAMP,
    reembolsado_en TIMESTAMP,
    monto_reembolso INTEGER DEFAULT 0,
    
    -- Información adicional
    referencia_externa VARCHAR(255), -- Referencia externa para conciliación
    descripcion TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de resena y calificación
CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    id_evaluador UUID NOT NULL REFERENCES usuario(id_usuario), -- Cliente que califica
    id_evaluado UUID NOT NULL REFERENCES usuario(id_usuario), -- Profesional calificado
    
    -- Calificación y comentario
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    
    -- Categorías de calificación específicas
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion >= 1 AND calificacion_comunicacion <= 5),
    
    -- Respuesta del profesional
    respuesta_profesional TEXT,
    profesional_respondio_en TIMESTAMP,
    
    es_publica BOOLEAN DEFAULT true,
    es_destacada BOOLEAN DEFAULT false, -- Para destacar en testimonios
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_solicitud_servicio) -- Una reseña por servicio
);

-- Tabla de notificacion
CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'solicitud_servicio', 'pago', 'resena', 'verificacion', etc.
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    
    -- Datos adicionales en JSON
    metadatos JSONB,
    
    -- Estado de la notificación
    esta_leida BOOLEAN DEFAULT false,
    leida_en TIMESTAMP,
    
    -- Enlace de acción (opcional)
    url_accion TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de log administrador para administradores
CREATE TABLE log_administrador (
    id_log_administrador UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_administrador UUID NOT NULL REFERENCES usuario(id_usuario),
    accion VARCHAR(100) NOT NULL, -- 'usuario_creado', 'profesional_verificado', 'servicio_cancelado', etc.
    tipo_entidad VARCHAR(50), -- 'usuario', 'profesional', 'solicitud_servicio', etc.
    id_entidad UUID, -- ID de la entidad afectada
    
    -- Detalles de la acción
    descripcion TEXT,
    valores_anteriores JSONB, -- Estado anterior en JSON
    valores_nuevos JSONB, -- Estado nuevo en JSON
    
    -- Información adicional
    direccion_ip INET,
    agente_usuario TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuracion sistema
CREATE TABLE configuracion_sistema (
    id_configuracion_sistema UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'string' CHECK (tipo_dato IN ('string', 'integer', 'boolean', 'json')),
    es_publico BOOLEAN DEFAULT false, -- Si se puede mostrar en frontend
    id_actualizado_por UUID REFERENCES usuario(id_usuario),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =================================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_rut ON usuario(rut);
CREATE INDEX idx_usuario_region_comuna ON usuario(id_region, id_comuna);
CREATE INDEX idx_usuario_rol ON usuario(rol);
CREATE INDEX idx_usuario_activo ON usuario(esta_activo);

CREATE INDEX idx_perfil_profesional_categoria ON perfil_profesional(id_categoria_servicio);
CREATE INDEX idx_perfil_profesional_verificacion ON perfil_profesional(estado_verificacion);
CREATE INDEX idx_perfil_profesional_calificacion ON perfil_profesional(calificacion DESC);

CREATE INDEX idx_solicitud_servicio_cliente ON solicitud_servicio(id_cliente);
CREATE INDEX idx_solicitud_servicio_profesional ON solicitud_servicio(id_profesional);
CREATE INDEX idx_solicitud_servicio_estado ON solicitud_servicio(estado);
CREATE INDEX idx_solicitud_servicio_fecha ON solicitud_servicio(fecha_programada);
CREATE INDEX idx_solicitud_servicio_ubicacion ON solicitud_servicio(id_region_servicio, id_comuna_servicio);

CREATE INDEX idx_pago_solicitud_servicio ON pago(id_solicitud_servicio);
CREATE INDEX idx_pago_estado ON pago(estado);
CREATE INDEX idx_pago_mercadopago ON pago(id_pago_mercadopago);

CREATE INDEX idx_resena_evaluado ON resena(id_evaluado);
CREATE INDEX idx_resena_calificacion ON resena(calificacion DESC);
CREATE INDEX idx_resena_publica ON resena(es_publica);
CREATE INDEX idx_resena_destacada ON resena(es_destacada);

CREATE INDEX idx_notificacion_usuario ON notificacion(id_usuario);
CREATE INDEX idx_notificacion_no_leida ON notificacion(id_usuario, esta_leida);
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo);

CREATE INDEX idx_log_administrador_admin ON log_administrador(id_administrador);
CREATE INDEX idx_log_administrador_entidad ON log_administrador(tipo_entidad, id_entidad);
CREATE INDEX idx_log_administrador_accion ON log_administrador(accion);
CREATE INDEX idx_log_administrador_fecha ON log_administrador(creado_en DESC);

-- =================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =================================================================

-- Trigger para actualizar actualizado_en automáticamente
CREATE OR REPLACE FUNCTION actualizar_columna_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER actualizar_usuario_actualizado_en BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();
CREATE TRIGGER actualizar_perfil_profesional_actualizado_en BEFORE UPDATE ON perfil_profesional FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();
CREATE TRIGGER actualizar_solicitud_servicio_actualizado_en BEFORE UPDATE ON solicitud_servicio FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();
CREATE TRIGGER actualizar_pago_actualizado_en BEFORE UPDATE ON pago FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();
CREATE TRIGGER actualizar_resena_actualizado_en BEFORE UPDATE ON resena FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();
CREATE TRIGGER actualizar_configuracion_sistema_actualizado_en BEFORE UPDATE ON configuracion_sistema FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();

-- =================================================================
-- DATOS INICIALES
-- =================================================================

-- Insertar regiones de Chile
INSERT INTO region (nombre, codigo) VALUES
('Región de Arica y Parinacota', 'XV'),
('Región de Tarapacá', 'I'),
('Región de Antofagasta', 'II'),
('Región de Atacama', 'III'),
('Región de Coquimbo', 'IV'),
('Región de Valparaíso', 'V'),
('Región Metropolitana', 'RM'),
('Región del Libertador General Bernardo O''Higgins', 'VI'),
('Región del Maule', 'VII'),
('Región del Ñuble', 'XVI'),
('Región del Biobío', 'VIII'),
('Región de La Araucanía', 'IX'),
('Región de Los Ríos', 'XIV'),
('Región de Los Lagos', 'X'),
('Región Aysén del General Carlos Ibáñez del Campo', 'XI'),
('Región de Magallanes y de la Antártica Chilena', 'XII');

-- Insertar categorías de servicios
INSERT INTO categoria_servicio (nombre, descripcion, icono) VALUES
('Gasfitería', 'Servicios de fontanería, plomería y sistemas de agua', 'Wrench'),
('Limpieza del Hogar', 'Servicios de limpieza doméstica y mantenimiento', 'Home'),
('Jardinería', 'Servicios de jardinería, paisajismo y mantención de áreas verdes', 'Scissors');

-- Insertar configuraciones iniciales del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo_dato, es_publico) VALUES
('nombre_plataforma', 'ServiHogar', 'Nombre de la plataforma', 'string', true),
('email_contacto', 'contacto@servihogar.cl', 'Email de contacto principal', 'string', true),
('telefono_soporte', '+56 2 2345 6789', 'Teléfono de soporte', 'string', true),
('tamano_maximo_archivo_mb', '5', 'Tamaño máximo de archivos en MB', 'integer', false),
('tiempo_limite_verificacion_horas', '48', 'Tiempo límite para verificación en horas', 'integer', false),
('precio_minimo_servicio', '10000', 'Precio mínimo de servicio en CLP', 'integer', false),
('duracion_maxima_servicio', '480', 'Duración máxima de servicio en minutos', 'integer', false),
('porcentaje_comision', '10', 'Porcentaje de comisión de la plataforma', 'integer', false);

-- =================================================================
-- VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =================================================================

-- Vista de perfiles profesionales con información completa
CREATE VIEW vista_perfiles_profesionales_completa AS
SELECT 
    pp.*,
    u.nombres,
    u.apellidos,
    u.email,
    u.telefono,
    u.region_id,
    u.comuna_id,
    r.nombre as nombre_region,
    c.nombre as nombre_comuna,
    cs.nombre as nombre_categoria_servicio,
    cs.icono as icono_categoria_servicio,
    COALESCE(estadisticas_resena.cantidad_resenas, 0) as cantidad_resenas,
    COALESCE(estadisticas_resena.calificacion_promedio, 0) as calificacion_calculada
FROM perfil_profesional pp
JOIN usuario u ON pp.usuario_id = u.id
LEFT JOIN region r ON u.region_id = r.id
LEFT JOIN comuna c ON u.comuna_id = c.id
JOIN categoria_servicio cs ON pp.categoria_servicio_id = cs.id
LEFT JOIN (
    SELECT 
        evaluado_id,
        COUNT(*) as cantidad_resenas,
        AVG(calificacion::decimal) as calificacion_promedio
    FROM resena 
    WHERE es_publica = true
    GROUP BY evaluado_id
) estadisticas_resena ON pp.usuario_id = estadisticas_resena.evaluado_id;

-- Vista de solicitudes con información completa
CREATE VIEW vista_solicitudes_servicio_completa AS
SELECT 
    ss.*,
    cliente.nombres as nombres_cliente,
    cliente.apellidos as apellidos_cliente,
    cliente.email as email_cliente,
    cliente.telefono as telefono_cliente,
    prof.nombres as nombres_profesional,
    prof.apellidos as apellidos_profesional,
    prof.email as email_profesional,
    prof.telefono as telefono_profesional,
    cs.nombre as nombre_categoria_servicio,
    ss_region.nombre as nombre_region_servicio,
    ss_comuna.nombre as nombre_comuna_servicio,
    p.estado as estado_pago,
    p.pagado_en,
    r.calificacion as calificacion_resena,
    r.comentario as comentario_resena
FROM solicitud_servicio ss
JOIN usuario cliente ON ss.cliente_id = cliente.id
JOIN usuario prof ON ss.profesional_id = prof.id
JOIN categoria_servicio cs ON ss.categoria_servicio_id = cs.id
LEFT JOIN region ss_region ON ss.region_servicio_id = ss_region.id
LEFT JOIN comuna ss_comuna ON ss.comuna_servicio_id = ss_comuna.id
LEFT JOIN pago p ON ss.id = p.solicitud_servicio_id
LEFT JOIN resena r ON ss.id = r.solicitud_servicio_id;