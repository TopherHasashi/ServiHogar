-- 1. CONFIGURACIÓN INICIAL

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
    descripcion TEXT,
    descripcion_corta VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categoria_servicio IS 'Categorías de servicios ofrecidos (Gasfitería, Limpieza, Jardinería, etc.)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 4. SISTEMA DE USUARIOS MULTI-ROL - RUT COMO PK
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE usuario (
    rut VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('masculino', 'femenino', 'no_binario')),
    fecha_nacimiento DATE NOT NULL,
    id_comuna UUID NOT NULL REFERENCES comuna(id_comuna),
    direccion TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'profesional', 'administrador', 'verificador')),
    
    -- CAMPOS OPCIONALES
    foto_perfil_url TEXT,
    
    -- VERIFICACIÓN DE CUENTA
    email_verificado BOOLEAN DEFAULT false,
    
    -- TIMESTAMPS
    ultima_actividad TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuario IS 'Tabla central de usuarios con sistema multi-rol';
COMMENT ON COLUMN usuario.rut IS 'RUT chileno formato 12.345.678-9 - CLAVE PRIMARIA';
COMMENT ON COLUMN usuario.genero IS '3 opciones: masculino, femenino, no_binario';
COMMENT ON COLUMN usuario.id_comuna IS 'Comuna de residencia - región se obtiene mediante JOIN';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 5. SISTEMA DE PROFESIONALES - MÚLTIPLES SERVICIOS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Servicios específicos por profesional (MÚLTIPLES - máximo 3)
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- CONFIGURACIÓN ESPECÍFICA POR SERVICIO (OBLIGATORIA)
    anos_experiencia VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- CONFIGURACIÓN DE DURACIÓN (INFORMATIVA PARA EL CLIENTE)
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija', 'rango')),
    duracion_fija_minutos INTEGER,
    duracion_minima_minutos INTEGER,
    duracion_maxima_minutos INTEGER,
    
    -- PRECIO FIJO POR SERVICIO (OBLIGATORIO)
    precio_fijo INTEGER NOT NULL CHECK (precio_fijo > 0),
    
    -- VERIFICACIÓN INDEPENDIENTE POR SERVICIO
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'suspendido')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    -- MÉTRICAS ESPECÍFICAS POR SERVICIO
    trabajos_completados INTEGER DEFAULT 0,
    trabajos_cancelados INTEGER DEFAULT 0,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un profesional no puede duplicar el mismo servicio
    UNIQUE(rut_usuario, id_categoria_servicio)
);

COMMENT ON TABLE servicio_profesional IS 'Servicios específicos ofrecidos por cada profesional (máximo 3)';
COMMENT ON COLUMN servicio_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN servicio_profesional.precio_fijo IS 'Precio fijo del servicio, no varía por tiempo';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 6. SISTEMA DE HORARIOS AVANZADO (3 NIVELES DE JERARQUÍA)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- NIVEL 1: Horario base semanal
CREATE TABLE horario_profesional (
    id_horario_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0 = Domingo, 6 = Sábado
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- No permitir horarios duplicados
    UNIQUE(id_servicio_profesional, dia_semana, hora_inicio)
);

COMMENT ON TABLE horario_profesional IS 'Horario base semanal del profesional - Nivel 1';
COMMENT ON COLUMN horario_profesional.dia_semana IS '0 = Domingo, 1 = Lunes, ..., 6 = Sábado';

-- NIVEL 2: Períodos personalizados (sobrescribe horario base)
CREATE TABLE periodo_personalizado (
    id_periodo_personalizado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(200), -- "Vacaciones", "Evento especial", etc.
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE periodo_personalizado IS 'Períodos personalizados que sobrescriben horario base - Nivel 2';

-- NIVEL 3: Días específicos bloqueados
CREATE TABLE dia_bloqueado (
    id_dia_bloqueado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    
    fecha DATE NOT NULL,
    motivo TEXT,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(id_servicio_profesional, fecha)
);

COMMENT ON TABLE dia_bloqueado IS 'Días específicos bloqueados - Nivel 3';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 7. DOCUMENTOS Y VERIFICACIÓN DIFERENCIADA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE documento_profesional (
    id_documento_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE SET NULL,
    
    -- TIPO DE DOCUMENTO
    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
        'certificado_antecedentes',
        'certificado_experiencia'
    )),
    url_archivo TEXT NOT NULL,
    tipo_mime VARCHAR(100), -- application/pdf, image/jpeg, etc.
    
    -- ESTADO DE VERIFICACIÓN
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' 
        CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documento_profesional IS 'Documentos del profesional con verificación diferenciada';
COMMENT ON COLUMN documento_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN documento_profesional.rut_verificador IS 'RUT del verificador - FOREIGN KEY a usuario(rut)';
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
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    
    -- ESTADO
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- No duplicar mismas cuentas
    UNIQUE(rut_usuario, banco, numero_cuenta)
);

COMMENT ON TABLE cuenta_bancaria_profesional IS 'Cuentas bancarias de profesionales (máximo 3, con fallback) - V3.0';
COMMENT ON COLUMN cuenta_bancaria_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN cuenta_bancaria_profesional.prioridad IS '1 = Principal, 2 = Secundaria, 3 = Terciaria';

-- En PostgreSQL, la unicidad condicional se implementa con un índice parcial
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuenta_principal_por_usuario
ON cuenta_bancaria_profesional (rut_usuario)
WHERE es_principal IS TRUE;

-- Cuentas bancarias de ServiHogar (corporativas)
CREATE TABLE cuenta_bancaria_servihogar (
    id_cuenta_bancaria_servihogar UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_identificador VARCHAR(100) NOT NULL UNIQUE, -- "Cuenta Principal", "Respaldo 1", "Respaldo 2"
    -- INFORMACIÓN BANCARIA
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
    rut_titular VARCHAR(12) NOT NULL,
    nombre_titular VARCHAR(200) NOT NULL,
    email_contacto VARCHAR(255),
    
    -- CONTROL DE PRIORIDADES
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    
    -- ESTADO
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva', 'bloqueada')),
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE cuenta_bancaria_servihogar IS 'Cuentas bancarias corporativas de ServiHogar';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 9. SOLICITUDES DE SERVICIO
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_cliente VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_profesional VARCHAR(12) REFERENCES usuario(rut),
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional),    
    -- INFORMACIÓN DEL SERVICIO
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- FECHA Y HORA
    fecha_programada DATETIME NOT NULL,
    duracion_minutos INTEGER, -- Solo informativo
    
    -- UBICACIÓN DEL SERVICIO
    direccion_servicio TEXT NOT NULL,
    id_comuna_servicio UUID NOT NULL REFERENCES comuna(id_comuna),
    
    -- PRECIO Y PAGO
    precio_total INTEGER NOT NULL, -- Igual que precio_por_hora
    
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
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE solicitud_servicio IS 'Solicitudes de servicio entre clientes y profesionales';
COMMENT ON COLUMN solicitud_servicio.rut_cliente IS 'RUT del cliente - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN solicitud_servicio.rut_profesional IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN solicitud_servicio.id_comuna_servicio IS 'Comuna donde se realiza el servicio';
COMMENT ON COLUMN solicitud_servicio.precio_total IS 'Precio fijo, no varía por duración';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 10. SISTEMA DE PAGOS CON MERCADOPAGO - ID MERCADOPAGO COMO PK
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE pago (
    id_pago_mercadopago VARCHAR(100) PRIMARY KEY,
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- CUENTAS BANCARIAS UTILIZADAS
    id_cuenta_destino_profesional UUID REFERENCES cuenta_bancaria_profesional(id_cuenta_bancaria_profesional),
    id_cuenta_origen_servihogar UUID REFERENCES cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar),
    
    -- MONTOS
    monto INTEGER NOT NULL CHECK (monto > 0),
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
    
    -- COMISIÓN DE LA PLATAFORMA (5%)
    comision_plataforma INTEGER DEFAULT 0,
    monto_profesional INTEGER DEFAULT 0, -- Monto después de comisión
    
    -- TIMESTAMPS
    liberado_al_profesional_en TIMESTAMP,
    reembolsado_en TIMESTAMP,
    monto_reembolso INTEGER,
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pago IS 'Pagos procesados con MercadoPago - V3.0';
COMMENT ON COLUMN pago.id_pago_mercadopago IS 'ID único de MercadoPago - CLAVE PRIMARIA';
COMMENT ON COLUMN pago.comision_plataforma IS 'Comisión del 5% para ServiHogar';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 10.1. SISTEMA DE RETENCIÓN Y PAGOS A PROFESIONALES
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Tabla: retencion_plataforma
-- Registra cada retención/comisión que ServiHogar toma de los pagos
CREATE TABLE retencion_plataforma (
    id_retencion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- RELACIÓN CON PAGO ORIGINAL
    id_pago_mercadopago VARCHAR(100) NOT NULL REFERENCES pago(id_pago_mercadopago),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    
    -- MONTOS
    monto_total_pago INTEGER NOT NULL CHECK (monto_total_pago > 0), -- Monto total que pagó el cliente
    porcentaje_retencion DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (porcentaje_retencion >= 0 AND porcentaje_retencion <= 100), -- % que retiene ServiHogar
    monto_retenido INTEGER NOT NULL CHECK (monto_retenido >= 0), -- Monto que se queda ServiHogar
    monto_profesional INTEGER NOT NULL CHECK (monto_profesional >= 0), -- Monto que le toca al profesional
    
    -- DESTINO DE LA RETENCIÓN
    id_cuenta_destino_servihogar UUID REFERENCES cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar),
    
    -- TIMESTAMPS
    retenido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- VALIDACIÓN: monto_total = monto_retenido + monto_profesional
    CONSTRAINT chk_suma_montos CHECK (monto_total_pago = monto_retenido + monto_profesional)
);

COMMENT ON TABLE retencion_plataforma IS 'Registro de retenciones/comisiones que ServiHogar toma de cada pago';
COMMENT ON COLUMN retencion_plataforma.porcentaje_retencion IS 'Porcentaje que retiene ServiHogar (por defecto 5%)';
COMMENT ON COLUMN retencion_plataforma.monto_retenido IS 'Monto en CLP que se queda ServiHogar';
COMMENT ON COLUMN retencion_plataforma.monto_profesional IS 'Monto en CLP que le corresponde al profesional';

-- Tabla: pago_profesional
-- Gestiona los pagos que ServiHogar debe hacer a los profesionales
CREATE TABLE pago_profesional (
    id_pago_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- RELACIONES
    id_retencion UUID NOT NULL REFERENCES retencion_plataforma(id_retencion),
    id_pago_mercadopago VARCHAR(100) NOT NULL REFERENCES pago(id_pago_mercadopago),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_profesional VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    
    -- CUENTA BANCARIA DESTINO
    id_cuenta_profesional UUID NOT NULL REFERENCES cuenta_bancaria_profesional(id_cuenta_bancaria_profesional),
    
    -- MONTOS
    monto_a_pagar INTEGER NOT NULL CHECK (monto_a_pagar > 0), -- Monto que se le debe pagar al profesional
    
    -- ESTADO DEL PAGO AL PROFESIONAL
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',        -- Servicio completado, pago pendiente de procesar
        'en_proceso',       -- Pago en proceso de transferencia
        'pagado',           -- Pago exitoso al profesional
        'fallido',          -- Pago falló (problema bancario, cuenta inválida, etc.)
        'revertido',        -- Pago revertido por disputa/reembolso
        'retenido'          -- Pago retenido por incidencia/reclamo
    )),
    
    -- INFORMACIÓN DE PROCESAMIENTO
    metodo_pago VARCHAR(50) DEFAULT 'transferencia_bancaria', -- transferencia_bancaria, cuenta_vista, etc.
    referencia_transaccion VARCHAR(100), -- Número de referencia/comprobante bancario
    comprobante_url TEXT, -- URL del comprobante de pago (PDF/imagen)
    
    -- FECHAS
    fecha_programada DATE, -- Fecha programada para el pago (ej: pagos semanales los viernes)
    fecha_procesado TIMESTAMP, -- Fecha en que se procesó el pago
    fecha_pagado TIMESTAMP, -- Fecha en que se confirmó el pago exitoso
    
    -- INFORMACIÓN ADICIONAL
    motivo_fallo TEXT, -- Si el pago falló, descripción del motivo
    notas TEXT, -- Notas internas sobre el pago
    
    -- AUDITORÍA
    procesado_por VARCHAR(12) REFERENCES usuario(rut), -- RUT del admin que procesó el pago
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pago_profesional IS 'Pagos que ServiHogar debe hacer a los profesionales por servicios completados - V3.0';
COMMENT ON COLUMN pago_profesional.rut_profesional IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN pago_profesional.estado IS 'Estado del pago: pendiente → en_proceso → pagado/fallido';
COMMENT ON COLUMN pago_profesional.fecha_programada IS 'Fecha programada para pago (ej: pagos semanales/mensuales)';
COMMENT ON COLUMN pago_profesional.referencia_transaccion IS 'Número de referencia bancaria del pago';
COMMENT ON COLUMN pago_profesional.procesado_por IS 'RUT del administrador - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 11. RESEÑAS Y CALIFICACIONES
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_evaluador VARCHAR(12) NOT NULL REFERENCES usuario(rut), -- Cliente que califica
    rut_evaluado VARCHAR(12) NOT NULL REFERENCES usuario(rut), -- Profesional evaluado
    
    -- CALIFICACIÓN GENERAL (1-5)
    comentario TEXT,
    
    -- CALIFICACIONES ESPECÍFICAS
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion >= 1 AND calificacion_comunicacion <= 5),
    
    -- CONTROL DE VISUALIZACIÓN
    es_destacada BOOLEAN DEFAULT false, -- Para testimonios
    
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE resena IS 'Reseñas y calificaciones de servicios - V3.0';
COMMENT ON COLUMN resena.rut_evaluador IS 'RUT del cliente - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN resena.rut_evaluado IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 12. MENSAJERÍA Y COMUNICACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notificacion IS 'Notificaciones para usuarios;
COMMENT ON COLUMN notificacion.rut_usuario IS 'RUT del usuario - FOREIGN KEY a usuario(rut)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 13. SISTEMA DE DISPUTAS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE disputa (
    id_disputa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
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
COMMENT ON COLUMN disputa.rut_reportante IS 'RUT del reportante - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN disputa.rut_reportado IS 'RUT del reportado - FOREIGN KEY a usuario(rut)';
COMMENT ON COLUMN disputa.rut_resuelto_por IS 'RUT del admin - FOREIGN KEY a usuario(rut)';

-- 14. ÍNDICES PARA OPTIMIZACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Índices en usuario
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_comuna ON usuario(id_comuna);
CREATE INDEX idx_usuario_rol ON usuario(rol);

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

-- Índices en retencion_plataforma
CREATE INDEX idx_retencion_pago ON retencion_plataforma(id_pago_mercadopago);
CREATE INDEX idx_retencion_solicitud ON retencion_plataforma(id_solicitud_servicio);
CREATE INDEX idx_retencion_fecha ON retencion_plataforma(retenido_en);

-- Índices en pago_profesional
CREATE INDEX idx_pago_prof_profesional ON pago_profesional(rut_profesional);
CREATE INDEX idx_pago_prof_estado ON pago_profesional(estado);
CREATE INDEX idx_pago_prof_fecha_programada ON pago_profesional(fecha_programada);
CREATE INDEX idx_pago_prof_fecha_pagado ON pago_profesional(fecha_pagado);
CREATE INDEX idx_pago_prof_solicitud ON pago_profesional(id_solicitud_servicio);

-- Índices en resena
CREATE INDEX idx_resena_evaluador ON resena(rut_evaluador);
CREATE INDEX idx_resena_evaluado ON resena(rut_evaluado);
CREATE INDEX idx_resena_destacada ON resena(es_destacada);

-- Índices en notificacion
CREATE INDEX idx_notificacion_usuario ON notificacion(rut_usuario);
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 15. FUNCIONES Y TRIGGERS
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
-- 16. CONSTRAINT PARA VALIDAR MÁXIMO 3 SERVICIOS POR PROFESIONAL
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