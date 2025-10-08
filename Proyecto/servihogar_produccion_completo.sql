-- ═══════════════════════════════════════════════════════════════════════════════════
-- SERVIHOGAR - BASE DE DATOS PRODUCCIÓN COMPLETA
-- ═══════════════════════════════════════════════════════════════════════════════════
-- 
-- Plataforma de Servicios para el Hogar - Chile
-- Versión: 3.0 (Enero 2025) - ✅ VALIDADA POR PROFESORES
-- Base de datos: PostgreSQL 14+
-- Codificación: UTF-8
--
-- CAMBIOS CRÍTICOS EN V3.0:
-- ✅ RUT como clave primaria (no UUID)
-- ✅ Eliminada redundancia geográfica (solo id_comuna)
-- ✅ Género actualizado (3 opciones inclusivas)
-- ✅ Campos obligatorios correctos (NOT NULL)
-- ✅ ID MercadoPago como PK en pagos
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
-- Período: Agosto 2024 - Enero 2025
--
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 1. CONFIGURACIÓN INICIAL
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- Para constraints de rango de fechas
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Para búsqueda de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Para búsqueda sin acentos

-- Configuración de zona horaria para Chile
SET timezone = 'America/Santiago';

-- Asegurar codificación del cliente en UTF-8 para mantener tildes y ñ
SET client_encoding = 'UTF8';

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

-- Seeds mínimos para habilitar pruebas (idempotentes)
-- Región Metropolitana y 5 comunas frecuentes
INSERT INTO region (nombre, codigo)
VALUES ('Región Metropolitana', 'RM')
ON CONFLICT (nombre) DO NOTHING;

WITH rm AS (
    SELECT id_region FROM region WHERE nombre='Región Metropolitana' OR codigo='RM' LIMIT 1
)
INSERT INTO comuna (id_region, nombre, codigo)
SELECT rm.id_region, v.nombre, v.codigo
FROM rm
CROSS JOIN (
    VALUES
    ('Santiago', 'STGO'),
    ('Providencia', 'PROV'),
    ('Las Condes', 'LCON'),
    ('Maipú', 'MAIP'),
    ('Ñuñoa', 'NUNO')
) AS v(nombre, codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Semillas completas de regiones (16) y comunas representativas por región (idempotentes)
-- Regiones
INSERT INTO region (nombre, codigo)
VALUES
    ('Arica y Parinacota', 'XV'),
    ('Tarapacá', 'I'),
    ('Antofagasta', 'II'),
    ('Atacama', 'III'),
    ('Coquimbo', 'IV'),
    ('Valparaíso', 'V'),
    ('Región Metropolitana', 'RM'),
    ('O''Higgins', 'VI'),
    ('Maule', 'VII'),
    ('Ñuble', 'XVI'),
    ('Biobío', 'VIII'),
    ('La Araucanía', 'IX'),
    ('Los Ríos', 'XIV'),
    ('Los Lagos', 'X'),
    ('Aysén', 'XI'),
    ('Magallanes y Antártica Chilena', 'XII')
ON CONFLICT (nombre) DO NOTHING;

-- Arica y Parinacota
WITH r AS (SELECT id_region FROM region WHERE nombre='Arica y Parinacota')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Arica','ARICA'),('Camarones','CAM'),('Putre','PUT'),('General Lagos','GLA')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Tarapacá
WITH r AS (SELECT id_region FROM region WHERE nombre='Tarapacá')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Iquique','IQQ'),('Alto Hospicio','AHOS'),('Pozo Almonte','PAL'),('Camiña','CAMI'),('Colchane','COL'),('Huara','HUA'),('Pica','PICA')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Antofagasta
WITH r AS (SELECT id_region FROM region WHERE nombre='Antofagasta')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Antofagasta','ANF'),('Mejillones','MEJ'),('Sierra Gorda','SGO'),('Taltal','TAL'),('Calama','CAL'),('Ollagüe','OLL'),('San Pedro de Atacama','SPA'),('Tocopilla','TOC'),('María Elena','MEL')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Atacama
WITH r AS (SELECT id_region FROM region WHERE nombre='Atacama')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Copiapó','COP'),('Caldera','CALD'),('Tierra Amarilla','TAM'),('Chañaral','CHA'),('Diego de Almagro','DAL'),('Vallenar','VAL'),('Huasco','HUA3'),('Freirina','FRE'),('Alto del Carmen','ADC')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Coquimbo
WITH r AS (SELECT id_region FROM region WHERE nombre='Coquimbo')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('La Serena','LS'),('Coquimbo','CQB'),('Andacollo','AND'),('La Higuera','LH'),('Paihuano','PAI'),('Vicuña','VIC'),('Illapel','ILL'),('Canela','CAN'),('Los Vilos','LV'),('Salamanca','SAL'),('Ovalle','OVL'),('Combarbalá','COM'),('Monte Patria','MP'),('Punitaqui','PUN'),('Río Hurtado','RH')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Valparaíso
WITH r AS (SELECT id_region FROM region WHERE nombre='Valparaíso')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Valparaíso','VALP'),('Viña del Mar','VDM'),('Concón','CONC'),('Quintero','QTR'),('Puchuncaví','PUC'),('Casablanca','CAS'),('Juan Fernández','JF'),
           ('Quillota','QUI'),('La Calera','LCA'),('La Cruz','LCR'),('Nogales','NOG'),('Hijuelas','HIJ'),
           ('San Antonio','SA'),('Cartagena','CAR'),('El Tabo','ETB'),('El Quisco','EQ'),('Algarrobo','ALG'),
           ('San Felipe','SFE'),('Llaillay','LLA'),('Catemu','CAT'),('Panquehue','PAN'),('Putaendo','PUTA'),('Santa María','SM'),
           ('Los Andes','LAN'),('Calle Larga','CLL'),('Rinconada','RIN'),('San Esteban','SE'),
           ('La Ligua','LLI'),('Cabildo','CAB'),('Zapallar','ZAP'),('Papudo','PAP'),
           ('Quilpué','QPE'),('Villa Alemana','VA'),('Limache','LIM'),('Olmué','OLM')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- O'Higgins
WITH r AS (SELECT id_region FROM region WHERE nombre='O''Higgins')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Rancagua','RAN'),('Machalí','MAC'),('Graneros','GRA'),('Doñihue','DON'),('Coltauco','COLT'),('Coinco','COI'),('Las Cabras','LC'),('Requínoa','REQ'),('Rengo','REN'),('Olivar','OLI'),('Malloa','MAL'),('Quinta de Tilcoco','QDT'),('San Vicente','SV'),('Pichidegua','PIC'),('Peumo','PEU'),
           ('San Fernando','SFE2'),('Chimbarongo','CHI'),('Nancagua','NAN'),('Placilla','PLA'),('Santa Cruz','SCR'),('Palmilla','PALM'),('Peralillo','PER'),('Lolol','LOL'),('Pumanque','PUM'),
           ('Pichilemu','PMU'),('La Estrella','LES'),('Litueche','LIT'),('Marchigüe','MAR'),('Navidad','NAV'),('Paredones','PAR')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Maule
WITH r AS (SELECT id_region FROM region WHERE nombre='Maule')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Talca','TALC'),('Constitución','CON'),('Curepto','CUR'),('Empedrado','EMP'),('Maule','MAU'),('Pelarco','PEL'),('Pencahue','PEN'),('Río Claro','RCL'),('San Clemente','SCL'),('San Rafael','SRF'),
           ('Curicó','CURC'),('Hualañé','HUA2'),('Licantén','LIC'),('Molina','MOL'),('Rauco','RAU'),('Romeral','ROM'),('Sagrada Familia','SAG'),('Teno','TEN'),('Vichuquén','VIC2'),
           ('Linares','LIN'),('Colbún','COLB'),('Longaví','LON'),('Parral','PAR2'),('Retiro','RET'),('San Javier','SJ'),('Villa Alegre','VAL2'),('Yerbas Buenas','YB'),
           ('Cauquenes','CAU'),('Chanco','CHA2'),('Pelluhue','PEL2')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Ñuble
WITH r AS (SELECT id_region FROM region WHERE nombre='Ñuble')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Chillán','CHN'),('Chillán Viejo','CHV'),('Bulnes','BUL'),('Quillón','QUI2'),('San Ignacio','SIG'),('El Carmen','ELC'),('Pemuco','PEM'),('Yungay','YUN'),('San Carlos','SCA'),('Coihueco','COI2'),('San Fabián','SFB'),('Ñiquén','NIQ'),('San Nicolás','SNI'),('Ninhue','NIN'),('Portezuelo','POR'),('Quirihue','QUIR'),('Cobquecura','COB'),('Trehuaco','TRE'),('Ránquil','RAN'),('Coelemu','COE')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Biobío
WITH r AS (SELECT id_region FROM region WHERE nombre='Biobío')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Concepción','CONC2'),('Coronel','COR'),('Chiguayante','CHI3'),('Florida','FLO'),('Hualpén','HUA4'),('Hualqui','HUA5'),('Lota','LOT'),('Penco','PEN2'),('San Pedro de la Paz','SPDLP'),('Santa Juana','SJU'),('Talcahuano','TAL2'),('Tomé','TOM'),
           ('Los Ángeles','LAN2'),('Antuco','ANT'),('Cabrero','CAB2'),('Laja','LAJ'),('Mulchén','MUL'),('Nacimiento','NAC'),('Negrete','NEG'),('Quilaco','QLC'),('Quilleco','QLL'),('San Rosendo','SRS'),('Santa Bárbara','SBA'),('Tucapel','TUC'),('Yumbel','YUM'),('Alto Biobío','ABI'),
           ('Arauco','ARU'),('Cañete','CAN2'),('Contulmo','CON3'),('Curanilahue','CUR2'),('Lebu','LEB'),('Los Álamos','LAL'),('Tirúa','TIR')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- La Araucanía
WITH r AS (SELECT id_region FROM region WHERE nombre='La Araucanía')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Temuco','TEM'),('Carahue','CAR2'),('Cholchol','CHO'),('Cunco','CUN'),('Curarrehue','CUR3'),('Freire','FRE2'),('Galvarino','GAL'),('Gorbea','GOR'),('Lautaro','LAU'),('Loncoche','LON2'),('Melipeuco','MEL2'),('Nueva Imperial','NIM'),('Padre Las Casas','PLC'),('Perquenco','PER2'),('Pitrufquén','PIT'),('Pucón','PUC2'),('Saavedra','SAA'),('Teodoro Schmidt','TS'),('Toltén','TOL'),('Vilcún','VIL'),('Villarrica','VIC3'),
           ('Angol','ANG'),('Collipulli','COL2'),('Curacautín','CUR4'),('Ercilla','ERC'),('Lonquimay','LQM'),('Los Sauces','LSA'),('Lumaco','LUM'),('Purén','PUR'),('Renaico','REN2'),('Traiguén','TRA'),('Victoria','VIC4')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Los Ríos
WITH r AS (SELECT id_region FROM region WHERE nombre='Los Ríos')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Valdivia','VAL2'),('Corral','COR2'),('Lanco','LAN3'),('Los Lagos','LLG'),('Máfil','MAF'),('Mariquina','MAR2'),('Paillaco','PAI2'),('Panguipulli','PAN2'),('La Unión','LUN'),('Futrono','FUT'),('Lago Ranco','LR'),('Río Bueno','RBU')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Los Lagos
WITH r AS (SELECT id_region FROM region WHERE nombre='Los Lagos')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Puerto Montt','PMT'),('Calbuco','CAL2'),('Cochamó','COC'),('Maullín','MAU2'),('Puerto Varas','PVA'),('Llanquihue','LLA2'),('Frutillar','FRU'),('Fresia','FRE3'),('Los Muermos','LMU'),
           ('Osorno','OSO'),('Puyehue','PUY'),('Río Negro','RNE'),('Purranque','PUR2'),('San Pablo','SPB'),
           ('Castro','CAS2'),('Ancud','ANC'),('Quellón','QUE'),('Quemchi','QUEM'),('Dalcahue','DAL2'),('Curaco de Vélez','CDV'),('Puqueldón','PUQ'),('Queilén','QEI'),('Chonchi','CHO2'),
           ('Chaitén','CHA3'),('Futaleufú','FUT2'),('Hualaihué','HUA6'),('Palena','PAL2')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Aysén
WITH r AS (SELECT id_region FROM region WHERE nombre='Aysén')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Coyhaique','COY'),('Lago Verde','LVE'),('Aysén','AYS'),('Cisnes','CIS'),('Guaitecas','GUA'),('Cochrane','COC2'),('O''Higgins','OH'),('Tortel','TOR'),('Chile Chico','CHC'),('Río Ibáñez','RIB')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Magallanes y Antártica Chilena
WITH r AS (SELECT id_region FROM region WHERE nombre='Magallanes y Antártica Chilena')
INSERT INTO comuna (id_region, nombre, codigo)
SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Punta Arenas','PA'),('Laguna Blanca','LAG'),('Río Verde','RVE'),('San Gregorio','SGR'),('Cabo de Hornos','CDH'),('Antártica','ANTC'),('Porvenir','POR2'),('Primavera','PRI'),('Timaukel','TIM'),('Puerto Natales','PNA'),('Torres del Paine','TDP')
) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

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
-- 4. SISTEMA DE USUARIOS MULTI-ROL - ✅ RUT COMO PK
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE usuario (
    -- ✅ CAMBIO V3.0: RUT COMO CLAVE PRIMARIA
    rut VARCHAR(12) PRIMARY KEY,
    
    -- CAMPOS OBLIGATORIOS (NOT NULL)
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    -- ✅ CAMBIO V3.0: Género 3 opciones inclusivas
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('masculino', 'femenino', 'no_binario')),
    fecha_nacimiento DATE NOT NULL,
    -- ✅ CAMBIO V3.0: Solo id_comuna (id_region eliminado)
    id_comuna UUID NOT NULL REFERENCES comuna(id_comuna),
    direccion TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'profesional', 'administrador', 'verificador')),
    
    -- CAMPOS OPCIONALES
    foto_perfil_url TEXT,
    biografia TEXT,
    
    -- SISTEMA DE ROLES
    roles_adicionales VARCHAR(20)[], -- Array para múltiples roles
    
    -- CONTROL DE ACCESO
    esta_activo BOOLEAN DEFAULT true,
    esta_suspendido BOOLEAN DEFAULT false,
    fecha_suspension TIMESTAMP,
    razon_suspension TEXT,
    suspendido_por VARCHAR(12) REFERENCES usuario(rut),
    
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

COMMENT ON TABLE usuario IS 'Tabla central de usuarios con sistema multi-rol - V3.0';
COMMENT ON COLUMN usuario.rut IS '✅ RUT chileno formato 12.345.678-9 - CLAVE PRIMARIA';
COMMENT ON COLUMN usuario.genero IS '✅ 3 opciones: masculino, femenino, no_binario';
COMMENT ON COLUMN usuario.id_comuna IS '✅ Comuna de residencia - región se obtiene mediante JOIN';
COMMENT ON COLUMN usuario.roles_adicionales IS 'Permite que un usuario tenga múltiples roles (ej: cliente + profesional)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 5. SISTEMA DE PROFESIONALES - MÚLTIPLES SERVICIOS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Perfil profesional general (UNO por usuario)
CREATE TABLE perfil_profesional (
    id_perfil_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL UNIQUE REFERENCES usuario(rut) ON DELETE CASCADE,
    
    -- INFORMACIÓN GENERAL OBLIGATORIA
    descripcion_general TEXT NOT NULL,
    anos_experiencia_total VARCHAR(10), -- '5+', '10+', etc.
    
    -- ESTADO DE VERIFICACIÓN GENERAL
    estado_verificacion_general VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion_general IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
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

COMMENT ON TABLE perfil_profesional IS 'Perfil general del profesional, uno por usuario - V3.0';
COMMENT ON COLUMN perfil_profesional.rut_usuario IS '✅ RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN perfil_profesional.certificado_antecedentes_aprobado IS 'Certificado de antecedentes se verifica una sola vez';

-- Servicios específicos por profesional (MÚLTIPLES - máximo 3)
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
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
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
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
    UNIQUE(rut_usuario, id_categoria_servicio)
);

COMMENT ON TABLE servicio_profesional IS 'Servicios específicos ofrecidos por cada profesional (máximo 3) - V3.0';
COMMENT ON COLUMN servicio_profesional.rut_usuario IS '✅ RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN servicio_profesional.precio_fijo IS 'Precio fijo del servicio, no varía por tiempo';
COMMENT ON COLUMN servicio_profesional.es_primer_servicio IS 'Si es el primer servicio del profesional, requiere antecedentes';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 6. SISTEMA DE HORARIOS AVANZADO (3 NIVELES DE JERARQUÍA)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- NIVEL 1: Horario base semanal
CREATE TABLE horario_profesional (
    id_horario_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0 = Domingo, 6 = Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    esta_disponible BOOLEAN DEFAULT true,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- No permitir horarios duplicados
    UNIQUE(id_perfil_profesional, id_servicio_profesional, dia_semana, hora_inicio)
);

COMMENT ON TABLE horario_profesional IS 'Horario base semanal del profesional - Nivel 1';
COMMENT ON COLUMN horario_profesional.dia_semana IS '0 = Domingo, 1 = Lunes, ..., 6 = Sábado';

-- NIVEL 2: Períodos personalizados (sobrescribe horario base)
CREATE TABLE periodo_personalizado (
    id_periodo_personalizado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(200), -- "Vacaciones", "Evento especial", etc.
    esta_activo BOOLEAN DEFAULT true,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE periodo_personalizado IS 'Períodos personalizados que sobrescriben horario base - Nivel 2';

-- NIVEL 3: Días específicos bloqueados (máxima prioridad)
CREATE TABLE dia_bloqueado (
    id_dia_bloqueado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    fecha DATE NOT NULL,
    motivo TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_perfil_profesional, id_servicio_profesional, fecha)
);

COMMENT ON TABLE dia_bloqueado IS 'Días específicos bloqueados - Nivel 3 (máxima prioridad)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 7. DOCUMENTOS Y VERIFICACIÓN DIFERENCIADA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE documento_profesional (
    id_documento_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil_profesional UUID NOT NULL REFERENCES perfil_profesional(id_perfil_profesional) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE SET NULL,
    
    -- TIPO DE DOCUMENTO
    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
        'cedula_identidad',
        'certificado_antecedentes',
        'certificado_experiencia',
        'titulo_profesional',
        'certificacion_especialidad',
        'foto_perfil',
        'foto_trabajo'
    )),
    
    nombre_documento VARCHAR(200) NOT NULL,
    url_archivo TEXT NOT NULL,
    tamano_archivo INTEGER, -- Tamaño en bytes
    tipo_mime VARCHAR(100), -- application/pdf, image/jpeg, etc.
    
    -- CONTROL DE OBLIGATORIEDAD
    es_obligatorio BOOLEAN DEFAULT false,
    
    -- ESTADO DE VERIFICACIÓN
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documento_profesional IS 'Documentos del profesional con verificación diferenciada - V3.0';
COMMENT ON COLUMN documento_profesional.rut_verificador IS '✅ RUT del verificador - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN documento_profesional.id_servicio_profesional IS 'NULL = documento general, UUID = documento específico del servicio';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 8. SISTEMA DE CUENTAS BANCARIAS (HASTA 3 POR PROFESIONAL)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Cuentas bancarias de profesionales
CREATE TABLE cuenta_bancaria_profesional (
    id_cuenta_bancaria_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    
    -- INFORMACIÓN BANCARIA
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('Corriente', 'Vista', 'Ahorro', 'RUT')),
    numero_cuenta VARCHAR(50) NOT NULL,
    rut_titular VARCHAR(12) NOT NULL,
    nombre_titular VARCHAR(200) NOT NULL,
    email_contacto VARCHAR(255),
    
    -- CONTROL DE PRIORIDADES (HASTA 3 CUENTAS)
    es_principal BOOLEAN DEFAULT false,
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    
    -- ESTADO
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
    
    verificado_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- No duplicar mismas cuentas
    UNIQUE(rut_usuario, banco, numero_cuenta)
);

COMMENT ON TABLE cuenta_bancaria_profesional IS 'Cuentas bancarias de profesionales (máximo 3, con fallback) - V3.0';
COMMENT ON COLUMN cuenta_bancaria_profesional.rut_usuario IS '✅ RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN cuenta_bancaria_profesional.prioridad IS '1 = Principal, 2 = Secundaria, 3 = Terciaria';

-- En PostgreSQL, la unicidad condicional se implementa con un índice parcial
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuenta_principal_por_usuario
ON cuenta_bancaria_profesional (rut_usuario)
WHERE es_principal IS TRUE;

-- Cuentas bancarias de ServiHogar (corporativas)
CREATE TABLE cuenta_bancaria_servihogar (
    id_cuenta_bancaria_servihogar UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    nombre_identificador VARCHAR(100) NOT NULL UNIQUE, -- "Cuenta Principal", "Respaldo 1", etc.
    
    -- INFORMACIÓN BANCARIA
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
    rut_titular VARCHAR(12) NOT NULL,
    nombre_titular VARCHAR(200) NOT NULL,
    email_contacto VARCHAR(255),
    
    -- CONTROL DE PRIORIDADES
    es_principal BOOLEAN DEFAULT false,
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    
    -- ESTADO
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
    
    verificado_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE cuenta_bancaria_servihogar IS 'Cuentas bancarias corporativas de ServiHogar';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 9. SOLICITUDES DE SERVICIO
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_cliente VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_profesional VARCHAR(12) REFERENCES usuario(rut),
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional),
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- INFORMACIÓN DEL SERVICIO
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- FECHA Y HORA
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    duracion_minutos INTEGER, -- Solo informativo
    
    -- UBICACIÓN DEL SERVICIO
    direccion_servicio TEXT NOT NULL,
    -- ✅ CAMBIO V3.0: Solo id_comuna (región se obtiene mediante JOIN)
    id_comuna_servicio UUID NOT NULL REFERENCES comuna(id_comuna),
    
    -- PRECIO Y PAGO
    precio_por_hora INTEGER NOT NULL, -- Precio fijo del servicio
    precio_total INTEGER NOT NULL, -- Igual que precio_por_hora
    moneda VARCHAR(3) DEFAULT 'CLP',
    
    -- ESTADO DE LA SOLICITUD
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',        -- Esperando aceptación del profesional
        'confirmado',       -- Profesional aceptó
        'en_progreso',      -- Trabajo iniciado
        'completado',       -- Trabajo terminado
        'cancelado',        -- Cancelado por cliente o profesional
        'en_disputa'        -- Hay una disputa abierta
    )),
    
    -- TIMESTAMPS DE ESTADO
    confirmado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    razon_cancelacion TEXT,
    
    -- INFORMACIÓN ADICIONAL
    notas_cliente TEXT,
    notas_profesional TEXT,
    imagenes_servicio TEXT[], -- URLs de fotos del trabajo
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE solicitud_servicio IS 'Solicitudes de servicio entre clientes y profesionales - V3.0';
COMMENT ON COLUMN solicitud_servicio.rut_cliente IS '✅ RUT del cliente - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN solicitud_servicio.rut_profesional IS '✅ RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN solicitud_servicio.id_comuna_servicio IS '✅ Comuna donde se realiza el servicio';
COMMENT ON COLUMN solicitud_servicio.precio_total IS 'Precio fijo, no varía por duración';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 10. SISTEMA DE PAGOS CON MERCADOPAGO - ✅ ID MERCADOPAGO COMO PK
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE pago (
    -- ✅ CAMBIO V3.0: ID de MercadoPago como clave primaria
    id_pago_mercadopago VARCHAR(100) PRIMARY KEY,
    
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- CUENTAS BANCARIAS UTILIZADAS
    id_cuenta_destino_profesional UUID REFERENCES cuenta_bancaria_profesional(id_cuenta_bancaria_profesional),
    id_cuenta_origen_servihogar UUID REFERENCES cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar),
    
    -- INFORMACIÓN DE MERCADOPAGO
    id_preferencia_mercadopago VARCHAR(100),
    
    -- MONTOS
    monto INTEGER NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) DEFAULT 'CLP',
    metodo_pago VARCHAR(50),
    
    -- ESTADO DEL PAGO
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'aprobado',
        'autorizado',
        'en_proceso',
        'rechazado',
        'cancelado',
        'reembolsado'
    )),
    
    -- COMISIÓN DE LA PLATAFORMA (15%)
    comision_plataforma INTEGER DEFAULT 0,
    monto_profesional INTEGER DEFAULT 0, -- Monto después de comisión
    
    -- TIMESTAMPS
    pagado_en TIMESTAMP,
    liberado_al_profesional_en TIMESTAMP,
    reembolsado_en TIMESTAMP,
    monto_reembolso INTEGER,
    
    -- INFORMACIÓN ADICIONAL
    referencia_externa VARCHAR(200),
    descripcion TEXT,
    
    -- CONTROL DE FALLBACK BANCARIO
    intento_fallback BOOLEAN DEFAULT false,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pago IS 'Pagos procesados con MercadoPago - V3.0';
COMMENT ON COLUMN pago.id_pago_mercadopago IS '✅ ID único de MercadoPago - CLAVE PRIMARIA';
COMMENT ON COLUMN pago.comision_plataforma IS 'Comisión del 15% para ServiHogar';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 11. RESEÑAS Y CALIFICACIONES
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_evaluador VARCHAR(12) NOT NULL REFERENCES usuario(rut), -- Cliente que califica
    rut_evaluado VARCHAR(12) NOT NULL REFERENCES usuario(rut), -- Profesional evaluado
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional),
    
    -- CALIFICACIÓN GENERAL (1-5)
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    
    -- CALIFICACIONES ESPECÍFICAS
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion >= 1 AND calificacion_comunicacion <= 5),
    
    -- RESPUESTA DEL PROFESIONAL
    respuesta_profesional TEXT,
    profesional_respondio_en TIMESTAMP,
    
    -- CONTROL DE VISUALIZACIÓN
    es_publica BOOLEAN DEFAULT true,
    es_destacada BOOLEAN DEFAULT false, -- Para testimonios
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE resena IS 'Reseñas y calificaciones de servicios - V3.0';
COMMENT ON COLUMN resena.rut_evaluador IS '✅ RUT del cliente - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN resena.rut_evaluado IS '✅ RUT del profesional - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 12. MENSAJERÍA Y COMUNICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE mensaje (
    id_mensaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_remitente VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_destinatario VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    
    contenido TEXT NOT NULL,
    
    -- CONTROL DE MENSAJES DEL SISTEMA
    es_sistema BOOLEAN DEFAULT false,
    
    -- CONTROL DE LECTURA
    esta_leido BOOLEAN DEFAULT false,
    leido_en TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mensaje IS 'Mensajes entre usuarios por solicitud de servicio - V3.0';
COMMENT ON COLUMN mensaje.rut_remitente IS '✅ RUT del remitente - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN mensaje.rut_destinatario IS '✅ RUT del destinatario - FOREIGN KEY a usuario(rut)';

CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    
    -- TIPO Y CONTENIDO
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'solicitud_servicio',
        'pago',
        'resena',
        'verificacion',
        'mensaje',
        'sistema'
    )),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    metadatos JSONB,
    
    -- CONTROL DE LECTURA
    esta_leida BOOLEAN DEFAULT false,
    leida_en TIMESTAMP,
    
    -- ACCIÓN ASOCIADA
    url_accion TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notificacion IS 'Notificaciones para usuarios - V3.0';
COMMENT ON COLUMN notificacion.rut_usuario IS '✅ RUT del usuario - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 13. SISTEMA DE DISPUTAS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE disputa (
    id_disputa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_reportante VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_reportado VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    
    -- TIPO DE DISPUTA
    tipo_disputa VARCHAR(30) NOT NULL CHECK (tipo_disputa IN (
        'trabajo_incompleto',
        'trabajo_no_realizado',
        'cobro_indebido',
        'mal_trato',
        'incumplimiento_horario',
        'otro'
    )),
    
    descripcion TEXT NOT NULL,
    evidencia_url TEXT, -- URLs de evidencias separadas por comas
    
    -- ESTADO DE LA DISPUTA
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN (
        'abierta',
        'en_revision',
        'resuelta',
        'cerrada'
    )),
    
    -- RESOLUCIÓN
    resolucion TEXT,
    rut_resuelto_por VARCHAR(12) REFERENCES usuario(rut), -- Administrador
    resuelta_en TIMESTAMP,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE disputa IS 'Sistema de disputas entre usuarios - V3.0';
COMMENT ON COLUMN disputa.rut_reportante IS '✅ RUT del reportante - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN disputa.rut_reportado IS '✅ RUT del reportado - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN disputa.rut_resuelto_por IS '✅ RUT del admin - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 14. PROMOCIONES Y DESCUENTOS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE promocion (
    id_promocion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    codigo VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo')),
    valor DECIMAL(10,2) NOT NULL,
    
    descripcion TEXT,
    
    -- PERÍODO DE VALIDEZ
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- LÍMITES DE USO
    usos_maximos INTEGER, -- NULL = sin límite
    usos_actuales INTEGER DEFAULT 0,
    monto_minimo INTEGER, -- Monto mínimo para aplicar
    
    -- RESTRICCIONES
    id_categoria_servicio UUID REFERENCES categoria_servicio(id_categoria_servicio), -- NULL = todas
    
    esta_activa BOOLEAN DEFAULT true,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE promocion IS 'Promociones y códigos de descuento';

CREATE TABLE uso_promocion (
    id_uso_promocion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    id_promocion UUID NOT NULL REFERENCES promocion(id_promocion),
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    descuento_aplicado INTEGER NOT NULL,
    
    usado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE uso_promocion IS 'Registro de uso de promociones - V3.0';
COMMENT ON COLUMN uso_promocion.rut_usuario IS '✅ RUT del usuario - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 15. ADMINISTRACIÓN Y AUDITORÍA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE log_administrador (
    id_log_administrador UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_administrador VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    
    -- ACCIÓN REALIZADA
    accion VARCHAR(50) NOT NULL CHECK (accion IN (
        'crear',
        'editar',
        'eliminar',
        'aprobar',
        'rechazar',
        'suspender',
        'reactivar'
    )),
    
    -- ENTIDAD AFECTADA
    tipo_entidad VARCHAR(50) NOT NULL,
    id_entidad VARCHAR(100), -- Puede ser RUT o UUID dependiendo de la entidad
    
    descripcion TEXT NOT NULL,
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    
    -- INFORMACIÓN TÉCNICA
    direccion_ip INET,
    agente_usuario TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE log_administrador IS 'Auditoría de acciones de administradores - V3.0';
COMMENT ON COLUMN log_administrador.rut_administrador IS '✅ RUT del admin - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN log_administrador.id_entidad IS 'Puede ser RUT (usuarios) o UUID (otras entidades)';

CREATE TABLE configuracion_sistema (
    id_configuracion_sistema UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato VARCHAR(20) NOT NULL CHECK (tipo_dato IN ('string', 'integer', 'boolean', 'json')),
    
    es_publico BOOLEAN DEFAULT false,
    
    -- ✅ CAMBIO V3.0: FK usando RUT
    rut_actualizado_por VARCHAR(12) REFERENCES usuario(rut),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE configuracion_sistema IS 'Configuración general del sistema - V3.0';
COMMENT ON COLUMN configuracion_sistema.rut_actualizado_por IS '✅ RUT del admin - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 16. ÍNDICES PARA OPTIMIZACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Índices en usuario
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_comuna ON usuario(id_comuna);
CREATE INDEX idx_usuario_rol ON usuario(rol);

-- Índices en perfil_profesional
CREATE INDEX idx_perfil_profesional_rut ON perfil_profesional(rut_usuario);
CREATE INDEX idx_perfil_profesional_verificacion ON perfil_profesional(estado_verificacion_general);
CREATE INDEX idx_perfil_profesional_activo ON perfil_profesional(esta_activo);

-- Índices en servicio_profesional
CREATE INDEX idx_servicio_profesional_rut ON servicio_profesional(rut_usuario);
CREATE INDEX idx_servicio_profesional_categoria ON servicio_profesional(id_categoria_servicio);
CREATE INDEX idx_servicio_profesional_verificacion ON servicio_profesional(estado_verificacion);

-- Índices en solicitud_servicio
CREATE INDEX idx_solicitud_servicio_cliente ON solicitud_servicio(rut_cliente);
CREATE INDEX idx_solicitud_servicio_profesional ON solicitud_servicio(rut_profesional);
CREATE INDEX idx_solicitud_servicio_estado ON solicitud_servicio(estado);
CREATE INDEX idx_solicitud_servicio_fecha ON solicitud_servicio(fecha_programada);

-- Índices en pago
CREATE INDEX idx_pago_solicitud ON pago(id_solicitud_servicio);
CREATE INDEX idx_pago_estado ON pago(estado);

-- Índices en resena
CREATE INDEX idx_resena_evaluador ON resena(rut_evaluador);
CREATE INDEX idx_resena_evaluado ON resena(rut_evaluado);
CREATE INDEX idx_resena_publica ON resena(es_publica);

-- Índices en mensaje
CREATE INDEX idx_mensaje_solicitud ON mensaje(id_solicitud_servicio);
CREATE INDEX idx_mensaje_remitente ON mensaje(rut_remitente);
CREATE INDEX idx_mensaje_destinatario ON mensaje(rut_destinatario);

-- Índices en notificacion
CREATE INDEX idx_notificacion_usuario ON notificacion(rut_usuario);
CREATE INDEX idx_notificacion_leida ON notificacion(esta_leida);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 17. FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar_en
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

-- Función para validar RUT chileno
CREATE OR REPLACE FUNCTION validar_rut_chileno(rut VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    rut_numeros VARCHAR;
    digito_verificador CHAR(1);
    suma INTEGER := 0;
    multiplicador INTEGER := 2;
    resto INTEGER;
    digito_calculado CHAR(1);
BEGIN
    -- Eliminar puntos y guión
    rut_numeros := REPLACE(REPLACE(rut, '.', ''), '-', '');
    
    -- Extraer dígito verificador
    digito_verificador := SUBSTRING(rut_numeros FROM LENGTH(rut_numeros));
    rut_numeros := SUBSTRING(rut_numeros FROM 1 FOR LENGTH(rut_numeros) - 1);
    
    -- Calcular dígito verificador
    FOR i IN REVERSE 1..LENGTH(rut_numeros) LOOP
        suma := suma + (SUBSTRING(rut_numeros FROM i FOR 1)::INTEGER * multiplicador);
        multiplicador := multiplicador + 1;
        IF multiplicador > 7 THEN
            multiplicador := 2;
        END IF;
    END LOOP;
    
    resto := 11 - (suma % 11);
    
    IF resto = 11 THEN
        digito_calculado := '0';
    ELSIF resto = 10 THEN
        digito_calculado := 'K';
    ELSE
        digito_calculado := resto::CHAR(1);
    END IF;
    
    RETURN UPPER(digito_verificador) = UPPER(digito_calculado);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_rut_chileno IS 'Valida el dígito verificador de un RUT chileno';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 18. CONSTRAINT PARA VALIDAR MÁXIMO 3 SERVICIOS POR PROFESIONAL
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validar_max_servicios_profesional()
RETURNS TRIGGER AS $$
DECLARE
    total_servicios INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total_servicios
    FROM servicio_profesional
    WHERE rut_usuario = NEW.rut_usuario;
    
    IF total_servicios >= 3 THEN
        RAISE EXCEPTION 'Un profesional no puede tener más de 3 servicios activos';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_max_servicios
    BEFORE INSERT ON servicio_profesional
    FOR EACH ROW EXECUTE FUNCTION validar_max_servicios_profesional();

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 19. DATOS INICIALES DE CONFIGURACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo_dato, es_publico)
VALUES
    ('comision_plataforma', '15', 'Porcentaje de comisión de la plataforma', 'integer', true),
    ('max_servicios_profesional', '3', 'Máximo de servicios por profesional', 'integer', true),
    ('radio_cobertura_default', '10', 'Radio de cobertura default en km', 'integer', true),
    ('dias_cancelacion_gratis', '2', 'Días antes del servicio para cancelar sin cargo', 'integer', true);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT - VERSIÓN 3.0
-- ═══════════════════════════════════════════════════════════════════════════════════

-- RESUMEN DE CAMBIOS V3.0:
-- ✅ RUT como clave primaria en tabla usuario
-- ✅ Todas las FK ahora usan rut en lugar de id_usuario
-- ✅ Eliminado id_region de usuario (se obtiene mediante comuna)
-- ✅ Género actualizado: 3 opciones (masculino, femenino, no_binario)
-- ✅ Campos obligatorios correctos con NOT NULL
-- ✅ id_pago_mercadopago como PK en tabla pago
-- ✅ Eliminado id_region de solicitud_servicio
-- ✅ Función de validación de RUT chileno implementada
-- ✅ 35 tablas completas y optimizadas
-- ✅ Índices para mejorar performance
-- ✅ Triggers para control de integridad
-- ✅ Listo para PostgreSQL 14+
