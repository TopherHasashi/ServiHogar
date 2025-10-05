-- =================================================================
-- MIGRACIÓN PARA MÚLTIPLES SERVICIOS POR PROFESIONAL - SERVIHOGAR
-- =================================================================

-- PASO 1: Crear nueva tabla para servicios múltiples del profesional
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- Configuración específica por servicio
    anos_experiencia VARCHAR(10) NOT NULL, -- '1', '2', '3', '4', '5+'
    descripcion TEXT NOT NULL,
    
    -- Configuración de duración (SOLO INFORMATIVA para el cliente)
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija', 'rango')),
    duracion_fija_minutos INTEGER, -- Duración estimada fija (informativa)
    duracion_minima_minutos INTEGER, -- Duración mínima estimada (informativa)
    duracion_maxima_minutos INTEGER, -- Duración máxima estimada (informativa)
    
    -- PRECIO FIJO DEL SERVICIO (no varía por tiempo)
    precio_fijo INTEGER NOT NULL, -- Precio fijo del servicio completo
    
    -- Estado del servicio individual
    esta_activo BOOLEAN DEFAULT true, -- Profesional puede habilitar/deshabilitar
    esta_disponible BOOLEAN DEFAULT true, -- Para pausas temporales
    
    -- Estado de verificación por servicio
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado', 'suspendido')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    -- Métricas específicas por servicio
    calificacion DECIMAL(3,2) DEFAULT 0.00 CHECK (calificacion >= 0 AND calificacion <= 5),
    trabajos_completados INTEGER DEFAULT 0,
    ganancias_totales INTEGER DEFAULT 0, -- En pesos chilenos
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un profesional no puede tener el mismo servicio duplicado
    UNIQUE(id_usuario, id_categoria_servicio)
);

-- PASO 2: Modificar perfil_profesional para datos generales del profesional
-- Remover campos específicos del servicio y mantener datos generales
CREATE TABLE perfil_profesional_nuevo (
    id_perfil_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    
    -- Información general del profesional
    descripcion_general TEXT, -- Descripción general del profesional
    telefono_profesional VARCHAR(20), -- Teléfono específico para trabajo
    
    -- Estado general de verificación del profesional
    estado_verificacion_general VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion_general IN ('pendiente', 'aprobado', 'rechazado', 'suspendido')),
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    -- Métricas generales (calculadas desde servicios individuales)
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00 CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
    total_trabajos_completados INTEGER DEFAULT 0,
    total_ganancias INTEGER DEFAULT 0, -- En pesos chilenos
    
    -- Control de disponibilidad general
    esta_activo BOOLEAN DEFAULT true,
    acepta_nuevos_trabajos BOOLEAN DEFAULT true,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_usuario) -- Un usuario solo puede tener un perfil profesional
);

-- PASO 3: Actualizar tabla de documentos para referenciar al perfil general
-- Los documentos (cédula, antecedentes) aplican a todos los servicios del profesional
-- Solo necesitamos una referencia al perfil general

-- PASO 4: Crear índices para optimización
CREATE INDEX idx_servicio_profesional_usuario ON servicio_profesional(id_usuario);
CREATE INDEX idx_servicio_profesional_categoria ON servicio_profesional(id_categoria_servicio);
CREATE INDEX idx_servicio_profesional_activo ON servicio_profesional(esta_activo);
CREATE INDEX idx_servicio_profesional_verificacion ON servicio_profesional(estado_verificacion);
CREATE INDEX idx_servicio_profesional_calificacion ON servicio_profesional(calificacion DESC);

-- PASO 5: Actualizar triggers
CREATE TRIGGER actualizar_servicio_profesional_actualizado_en 
    BEFORE UPDATE ON servicio_profesional 
    FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();

CREATE TRIGGER actualizar_perfil_profesional_nuevo_actualizado_en 
    BEFORE UPDATE ON perfil_profesional_nuevo 
    FOR EACH ROW EXECUTE FUNCTION actualizar_columna_actualizado_en();

-- PASO 6: Comentarios explicativos
COMMENT ON TABLE servicio_profesional IS 
'Servicios específicos que ofrece cada profesional. Un profesional puede ofrecer múltiples servicios (Gasfitería, Limpieza, Jardinería) con configuraciones independientes.';

COMMENT ON COLUMN servicio_profesional.esta_activo IS 
'Permite al profesional habilitar/deshabilitar servicios específicos sin afectar otros servicios que ofrece.';

COMMENT ON COLUMN servicio_profesional.precio_fijo IS 
'Precio fijo por este servicio específico. No varía por tiempo de duración.';

COMMENT ON TABLE perfil_profesional_nuevo IS 
'Perfil general del profesional que agrupa información común. Los servicios específicos están en la tabla servicio_profesional.';

-- =================================================================
-- MIGRACIÓN DE DATOS EXISTENTES (OPCIONAL)
-- =================================================================

/*
-- Para migrar datos existentes de perfil_profesional a las nuevas tablas:

-- 1. Migrar datos generales del profesional
INSERT INTO perfil_profesional_nuevo (
    id_usuario, 
    descripcion_general, 
    estado_verificacion_general,
    id_verificado_por,
    verificado_en,
    razon_rechazo,
    calificacion_promedio,
    total_trabajos_completados,
    total_ganancias,
    esta_activo,
    creado_en,
    actualizado_en
)
SELECT 
    id_usuario,
    descripcion,
    estado_verificacion,
    id_verificado_por,
    verificado_en,
    razon_rechazo,
    calificacion,
    trabajos_completados,
    ganancias_totales,
    true, -- esta_activo por defecto
    creado_en,
    actualizado_en
FROM perfil_profesional;

-- 2. Migrar servicios específicos
INSERT INTO servicio_profesional (
    id_usuario,
    id_categoria_servicio,
    anos_experiencia,
    descripcion,
    tipo_duracion,
    duracion_fija_minutos,
    duracion_minima_minutos,
    duracion_maxima_minutos,
    precio_fijo,
    esta_activo,
    estado_verificacion,
    id_verificado_por,
    verificado_en,
    razon_rechazo,
    calificacion,
    trabajos_completados,
    ganancias_totales,
    creado_en,
    actualizado_en
)
SELECT 
    id_usuario,
    id_categoria_servicio,
    anos_experiencia,
    descripcion,
    tipo_duracion,
    duracion_fija_minutos,
    duracion_minima_minutos,
    duracion_maxima_minutos,
    precio_por_hora, -- Ahora precio_fijo
    true, -- esta_activo por defecto
    estado_verificacion,
    id_verificado_por,
    verificado_en,
    razon_rechazo,
    calificacion,
    trabajos_completados,
    ganancias_totales,
    creado_en,
    actualizado_en
FROM perfil_profesional;

-- 3. Actualizar referencias en documento_profesional para usar perfil_profesional_nuevo
-- (Esto requiere mapear los IDs correctamente)
*/

-- =================================================================
-- FUNCIONES ÚTILES PARA MÚLTIPLES SERVICIOS
-- =================================================================

-- Función para calcular métricas generales del profesional
CREATE OR REPLACE FUNCTION actualizar_metricas_profesional(usuario_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE perfil_profesional_nuevo SET
        calificacion_promedio = (
            SELECT COALESCE(AVG(calificacion), 0)
            FROM servicio_profesional 
            WHERE id_usuario = usuario_id AND esta_activo = true
        ),
        total_trabajos_completados = (
            SELECT COALESCE(SUM(trabajos_completados), 0)
            FROM servicio_profesional 
            WHERE id_usuario = usuario_id
        ),
        total_ganancias = (
            SELECT COALESCE(SUM(ganancias_totales), 0)
            FROM servicio_profesional 
            WHERE id_usuario = usuario_id
        ),
        actualizado_en = CURRENT_TIMESTAMP
    WHERE id_usuario = usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas automáticamente
CREATE OR REPLACE FUNCTION trigger_actualizar_metricas_profesional()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_metricas_profesional(NEW.id_usuario);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_metricas_al_cambiar_servicio
    AFTER INSERT OR UPDATE OR DELETE ON servicio_profesional
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_metricas_profesional();

COMMIT;