-- =================================================================
-- MIGRACIÓN PARA SISTEMA DE PRECIOS FIJOS - SERVIHOGAR
-- =================================================================

-- Esta migración documenta el cambio conceptual del sistema de precios
-- No requiere cambios estructurales en la base de datos, solo cambios 
-- de interpretación de los campos existentes

/*
CAMBIOS CONCEPTUALES:

1. ANTES (Sistema de precios variables):
   - precio_por_hora: precio base por hora de trabajo
   - duracion: afectaba el precio final del servicio
   - precio_total: se calculaba multiplicando precio_por_hora * horas

2. AHORA (Sistema de precios fijos):
   - precio_por_hora: PRECIO FIJO del servicio completo (no varía por tiempo)
   - duracion: SOLO informativa para planificación del cliente
   - precio_total: SIEMPRE igual al precio_por_hora

BENEFICIOS:
✅ Transparencia total - cliente sabe precio exacto desde el inicio
✅ Simplicidad - no hay cálculos complejos por tiempo
✅ Profesionales pueden optimizar sin afectar ingresos
✅ Mejor experiencia de usuario
*/

-- =================================================================
-- COMENTARIOS ACTUALIZADOS PARA CAMPOS EXISTENTES
-- =================================================================

-- Agregar comentarios explicativos a las columnas relevantes
COMMENT ON COLUMN perfil_profesional.precio_por_hora IS 
'PRECIO FIJO del servicio completo. Este valor NO varía según el tiempo que tome el trabajo. Mantiene el nombre precio_por_hora por compatibilidad pero representa un precio fijo.';

COMMENT ON COLUMN perfil_profesional.duracion_fija_minutos IS 
'Duración estimada del servicio (SOLO INFORMATIVA). No afecta el precio final.';

COMMENT ON COLUMN perfil_profesional.duracion_minima_minutos IS 
'Duración mínima estimada del servicio (SOLO INFORMATIVA). No afecta el precio final.';

COMMENT ON COLUMN perfil_profesional.duracion_maxima_minutos IS 
'Duración máxima estimada del servicio (SOLO INFORMATIVA). No afecta el precio final.';

COMMENT ON COLUMN solicitud_servicio.precio_por_hora IS 
'PRECIO FIJO del servicio acordado. No varía por el tiempo real del trabajo.';

COMMENT ON COLUMN solicitud_servicio.precio_total IS 
'Precio total del servicio (igual al precio_por_hora en el modelo de precios fijos).';

-- =================================================================
-- VALIDACIONES OPCIONALES (SI SE DESEA ASEGURAR CONSISTENCIA)
-- =================================================================

-- Trigger opcional para asegurar que precio_total sea igual a precio_por_hora
-- en el modelo de precios fijos
CREATE OR REPLACE FUNCTION validar_precio_fijo()
RETURNS TRIGGER AS $$
BEGIN
    -- En el modelo de precios fijos, precio_total debe ser igual a precio_por_hora
    IF NEW.precio_total != NEW.precio_por_hora THEN
        NEW.precio_total = NEW.precio_por_hora;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a la tabla de solicitudes (opcional)
-- CREATE TRIGGER validar_precio_fijo_trigger 
--     BEFORE INSERT OR UPDATE ON solicitud_servicio 
--     FOR EACH ROW EXECUTE FUNCTION validar_precio_fijo();

-- =================================================================
-- ACTUALIZACIÓN DE CONFIGURACIÓN DEL SISTEMA
-- =================================================================

-- Actualizar configuración del sistema para documentar el cambio
INSERT INTO configuracion_sistema (clave, valor, tipo_dato, descripcion, es_publico) 
VALUES 
('modelo_precios', 'fijo', 'string', 'Tipo de modelo de precios: fijo (precio no varía por tiempo) o variable (precio por hora)', false)
ON CONFLICT (clave) DO UPDATE SET 
    valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    actualizado_en = CURRENT_TIMESTAMP;

-- =================================================================
-- DOCUMENTACIÓN DE LA MIGRACIÓN
-- =================================================================

-- Registrar el cambio en el log administrativo (requiere un administrador válido)
/*
INSERT INTO log_administrador (administrador_id, tipo_entidad, id_entidad, accion, valores_anteriores, valores_nuevos, descripcion)
VALUES (
    'UUID_DEL_ADMINISTRADOR_SISTEMA', 
    'sistema', 
    NULL, 
    'migracion_modelo_precios', 
    '{"modelo": "variable", "precio_calculo": "por_hora"}',
    '{"modelo": "fijo", "precio_calculo": "servicio_completo"}',
    'Migración del sistema de precios variables a precios fijos. Los precios ahora son fijos por servicio, independiente del tiempo.'
);
*/

-- =================================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- =================================================================

-- Consulta para verificar profesionales con configuración de precios
/*
SELECT 
    u.nombres || ' ' || u.apellidos as profesional,
    cs.nombre as categoria,
    pp.tipo_duracion,
    pp.precio_por_hora as precio_fijo,
    CASE 
        WHEN pp.tipo_duracion = 'fija' THEN pp.duracion_fija_minutos || ' min (fijo)'
        ELSE pp.duracion_minima_minutos || '-' || pp.duracion_maxima_minutos || ' min (rango)'
    END as duracion_informativa
FROM perfil_profesional pp
JOIN usuario u ON pp.usuario_id = u.id
JOIN categoria_servicio cs ON pp.categoria_servicio_id = cs.id
WHERE pp.estado_verificacion = 'aprobado'
ORDER BY cs.nombre, pp.precio_por_hora;
*/

COMMIT;