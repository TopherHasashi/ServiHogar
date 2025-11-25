BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Drop existing domain tables (dependency-safe order)
DROP TABLE IF EXISTS pago_profesional CASCADE;
DROP TABLE IF EXISTS retencion_plataforma CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS solicitud_servicio CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_servihogar CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_profesional CASCADE;
DROP TABLE IF EXISTS documento_profesional CASCADE;
DROP TABLE IF EXISTS dia_bloqueado CASCADE;
DROP TABLE IF EXISTS periodo_personalizado CASCADE;
DROP TABLE IF EXISTS horario_profesional CASCADE;
DROP TABLE IF EXISTS servicio_profesional CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS resena CASCADE;
DROP TABLE IF EXISTS disputa CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS categoria_servicio CASCADE;
DROP TABLE IF EXISTS comuna CASCADE;
DROP TABLE IF EXISTS region CASCADE;

-- Core geo tables
CREATE TABLE region (
    id_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE region IS 'Regiones administrativas de Chile';
COMMENT ON COLUMN region.codigo IS 'Código oficial de la región (I, II, III, ..., XV, RM)';

CREATE TABLE comuna (
    id_comuna UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_region UUID NOT NULL REFERENCES region(id_region) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_region, nombre)
);

COMMENT ON TABLE comuna IS 'Comunas de Chile agrupadas por región';

-- Minimal seeds (idempotent)
INSERT INTO region (nombre, codigo) VALUES ('Región Metropolitana', 'RM') ON CONFLICT (nombre) DO NOTHING;
WITH rm AS (SELECT id_region FROM region WHERE nombre='Región Metropolitana' OR codigo='RM' LIMIT 1)
INSERT INTO comuna (id_region, nombre, codigo)
SELECT rm.id_region, v.nombre, v.codigo FROM rm
CROSS JOIN (VALUES ('Santiago','STGO'),('Providencia','PROV'),('Las Condes','LCON'),('Maipú','MAIP'),('Ñuñoa','NUNO')) AS v(nombre, codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- Full region set (idempotent)
INSERT INTO region (nombre, codigo) VALUES
 ('Arica y Parinacota','XV'),('Tarapacá','I'),('Antofagasta','II'),('Atacama','III'),('Coquimbo','IV'),('Valparaíso','V'),
 ('Región Metropolitana','RM'),('O''Higgins','VI'),('Maule','VII'),('Ñuble','XVI'),('Biobío','VIII'),('La Araucanía','IX'),
 ('Los Ríos','XIV'),('Los Lagos','X'),('Aysén','XI'),('Magallanes y Antártica Chilena','XII')
ON CONFLICT (nombre) DO NOTHING;

-- The following inserts replicate representative comunas per region (idempotent)
-- (Omitted here for brevity in normalized file; use the full list from DLL_servihogar.sql as needed.)

-- Categories
CREATE TABLE categoria_servicio (
    id_categoria_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE,
    descripcion TEXT,
    descripcion_corta VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categoria_servicio IS 'Categorías de servicios ofrecidos (Gasfitería, Limpieza, Jardinería, etc.)';

-- Users
CREATE TABLE usuario (
    rut VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('masculino','femenino','no_binario')),
    fecha_nacimiento DATE NOT NULL,
    id_comuna UUID NOT NULL REFERENCES comuna(id_comuna),
    direccion TEXT NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','profesional','administrador','verificador')),
    foto_perfil_url TEXT,
    email_verificado BOOLEAN DEFAULT FALSE,
    ultima_actividad TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuario IS 'Tabla central de usuarios con sistema multi-rol';

-- Servicios
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    anos_experiencia VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija','rango')),
    duracion_fija_minutos INTEGER,
    duracion_minima_minutos INTEGER,
    duracion_maxima_minutos INTEGER,
    precio_fijo INTEGER NOT NULL CHECK (precio_fijo > 0),
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente','en_revision','aprobado','rechazado','suspendido')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    trabajos_completados INTEGER DEFAULT 0,
    trabajos_cancelados INTEGER DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rut_usuario, id_categoria_servicio)
);

-- Schedules (level 1/2/3)
CREATE TABLE horario_profesional (
    id_horario_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_servicio_profesional, dia_semana, hora_inicio)
);

-- Semántica de índice de día: 0=Lunes .. 6=Domingo
COMMENT ON COLUMN horario_profesional.dia_semana IS '0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo';

CREATE TABLE periodo_personalizado (
    id_periodo_personalizado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE dia_bloqueado (
    id_dia_bloqueado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    motivo TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_servicio_profesional, fecha)
);

-- Documentos (make FK nullable for ON DELETE SET NULL)
CREATE TABLE documento_profesional (
    id_documento_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE SET NULL,
    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN ('certificado_antecedentes','certificado_experiencia')),
    url_archivo TEXT NOT NULL,
    tipo_mime VARCHAR(100),
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente','aprobado','rechazado')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,
    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cuentas bancarias
CREATE TABLE cuenta_bancaria_profesional (
    id_cuenta_bancaria_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('Corriente','Vista','Ahorro','RUT')),
    numero_cuenta VARCHAR(50) NOT NULL,
    rut_titular VARCHAR(12) NOT NULL,
    nombre_titular VARCHAR(200) NOT NULL,
    email_contacto VARCHAR(255),
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa','inactiva','bloqueada')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rut_usuario, banco, numero_cuenta)
);

-- Unique one principal account per user via prioridad=1
CREATE UNIQUE INDEX IF NOT EXISTS uq_cuenta_principal_por_usuario
ON cuenta_bancaria_profesional (rut_usuario)
WHERE prioridad = 1;

CREATE TABLE cuenta_bancaria_servihogar (
    id_cuenta_bancaria_servihogar UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_identificador VARCHAR(100) NOT NULL UNIQUE,
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL,
    numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
    rut_titular VARCHAR(12) NOT NULL,
    nombre_titular VARCHAR(200) NOT NULL,
    email_contacto VARCHAR(255),
    prioridad INTEGER NOT NULL CHECK (prioridad >= 1 AND prioridad <= 3),
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa','inactiva','bloqueada')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solicitudes + pagos
CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_cliente VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_profesional VARCHAR(12) REFERENCES usuario(rut),
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_programada TIMESTAMP NOT NULL,
    duracion_minutos INTEGER,
    direccion_servicio TEXT NOT NULL,
    id_comuna_servicio UUID NOT NULL REFERENCES comuna(id_comuna),
    precio_total INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','en_progreso','completado','cancelado','en_disputa')),
    confirmado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    razon_cancelacion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pago (
    id_pago_mercadopago VARCHAR(100) PRIMARY KEY,
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    id_cuenta_destino_profesional UUID REFERENCES cuenta_bancaria_profesional(id_cuenta_bancaria_profesional),
    id_cuenta_origen_servihogar UUID REFERENCES cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar),
    monto INTEGER NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','autorizado','en_proceso','rechazado','cancelado','reembolsado','en_revision')),
    comision_plataforma INTEGER DEFAULT 0,
    monto_profesional INTEGER DEFAULT 0,
    liberado_al_profesional_en TIMESTAMP,
    reembolsado_en TIMESTAMP,
    monto_reembolso INTEGER,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE retencion_plataforma (
    id_retencion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pago_mercadopago VARCHAR(100) NOT NULL REFERENCES pago(id_pago_mercadopago),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    monto_total_pago INTEGER NOT NULL CHECK (monto_total_pago > 0),
    porcentaje_retencion DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (porcentaje_retencion >= 0 AND porcentaje_retencion <= 100),
    monto_retenido INTEGER NOT NULL CHECK (monto_retenido >= 0),
    monto_profesional INTEGER NOT NULL CHECK (monto_profesional >= 0),
    id_cuenta_destino_servihogar UUID REFERENCES cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar),
    retenido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_suma_montos CHECK (monto_total_pago = monto_retenido + monto_profesional)
);

CREATE TABLE pago_profesional (
    id_pago_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_retencion UUID NOT NULL REFERENCES retencion_plataforma(id_retencion),
    id_pago_mercadopago VARCHAR(100) NOT NULL REFERENCES pago(id_pago_mercadopago),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_profesional VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    id_cuenta_profesional UUID NOT NULL REFERENCES cuenta_bancaria_profesional(id_cuenta_bancaria_profesional),
    monto_a_pagar INTEGER NOT NULL CHECK (monto_a_pagar > 0),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','pagado','fallido','revertido','retenido')),
    metodo_pago VARCHAR(50) DEFAULT 'transferencia_bancaria',
    referencia_transaccion VARCHAR(100),
    comprobante_url TEXT,
    fecha_programada DATE,
    fecha_procesado TIMESTAMP,
    fecha_pagado TIMESTAMP,
    motivo_fallo TEXT,
    notas TEXT,
    procesado_por VARCHAR(12) REFERENCES usuario(rut),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reseñas, notificaciones y disputas
CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_evaluador VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_evaluado VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    comentario TEXT,
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad BETWEEN 1 AND 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad BETWEEN 1 AND 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion BETWEEN 1 AND 5),
    es_destacada BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('solicitud_servicio','pago','resena','verificacion','mensaje','sistema')),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notificacion IS 'Notificaciones para usuarios';

CREATE TABLE disputa (
    id_disputa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_reportante VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_reportado VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    tipo_disputa VARCHAR(30) NOT NULL CHECK (tipo_disputa IN ('trabajo_incompleto','trabajo_no_realizado','cobro_indebido','mal_trato','incumplimiento_horario','otro')),
    descripcion TEXT NOT NULL,
    evidencia_url TEXT,
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta','en_revision','resuelta','cerrada')),
    resolucion TEXT,
    rut_resuelto_por VARCHAR(12) REFERENCES usuario(rut),
    resuelta_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_usuario_comuna ON usuario(id_comuna);
CREATE INDEX idx_usuario_rol ON usuario(rol);
CREATE INDEX idx_servicio_profesional_rut ON servicio_profesional(rut_usuario);
CREATE INDEX idx_servicio_profesional_categoria ON servicio_profesional(id_categoria_servicio);
CREATE INDEX idx_servicio_profesional_verificacion ON servicio_profesional(estado_verificacion);
CREATE INDEX idx_solicitud_servicio_cliente ON solicitud_servicio(rut_cliente);
CREATE INDEX idx_solicitud_servicio_profesional ON solicitud_servicio(rut_profesional);
CREATE INDEX idx_solicitud_servicio_estado ON solicitud_servicio(estado);
CREATE INDEX idx_solicitud_servicio_fecha ON solicitud_servicio(fecha_programada);
CREATE INDEX idx_pago_solicitud ON pago(id_solicitud_servicio);
CREATE INDEX idx_pago_estado ON pago(estado);
CREATE INDEX idx_retencion_pago ON retencion_plataforma(id_pago_mercadopago);
CREATE INDEX idx_retencion_solicitud ON retencion_plataforma(id_solicitud_servicio);
CREATE INDEX idx_retencion_fecha ON retencion_plataforma(retenido_en);
CREATE INDEX idx_pago_prof_profesional ON pago_profesional(rut_profesional);
CREATE INDEX idx_pago_prof_estado ON pago_profesional(estado);
CREATE INDEX idx_pago_prof_fecha_programada ON pago_profesional(fecha_programada);
CREATE INDEX idx_pago_prof_fecha_pagado ON pago_profesional(fecha_pagado);
CREATE INDEX idx_pago_prof_solicitud ON pago_profesional(id_solicitud_servicio);
CREATE INDEX idx_resena_evaluador ON resena(rut_evaluador);
CREATE INDEX idx_resena_evaluado ON resena(rut_evaluado);
CREATE INDEX idx_resena_destacada ON resena(es_destacada);
CREATE INDEX idx_notificacion_usuario ON notificacion(rut_usuario);
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo);

-- Common triggers
CREATE OR REPLACE FUNCTION actualizar_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_usuario BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_actualizar_servicio_profesional BEFORE UPDATE ON servicio_profesional FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE TRIGGER trigger_actualizar_solicitud_servicio BEFORE UPDATE ON solicitud_servicio FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- RUT validation function and service count trigger
CREATE OR REPLACE FUNCTION validar_rut_chileno(rut VARCHAR) RETURNS BOOLEAN AS $$
DECLARE
  rut_numeros VARCHAR;
  digito_verificador CHAR(1);
  suma INTEGER := 0;
  multiplicador INTEGER := 2;
  resto INTEGER;
  digito_calculado CHAR(1);
BEGIN
  rut_numeros := REPLACE(REPLACE(rut, '.', ''), '-', '');
  digito_verificador := SUBSTRING(rut_numeros FROM LENGTH(rut_numeros));
  rut_numeros := SUBSTRING(rut_numeros FROM 1 FOR LENGTH(rut_numeros) - 1);
  FOR i IN REVERSE 1..LENGTH(rut_numeros) LOOP
    suma := suma + (SUBSTRING(rut_numeros FROM i FOR 1)::INTEGER * multiplicador);
    multiplicador := CASE WHEN multiplicador >= 7 THEN 2 ELSE multiplicador + 1 END;
  END LOOP;
  resto := 11 - (suma % 11);
  IF resto = 11 THEN digito_calculado := '0';
  ELSIF resto = 10 THEN digito_calculado := 'K';
  ELSE digito_calculado := resto::CHAR(1); END IF;
  RETURN UPPER(digito_verificador) = UPPER(digito_calculado);
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validar_max_servicios_profesional() RETURNS TRIGGER AS $$
DECLARE total_servicios INTEGER; BEGIN
  SELECT COUNT(*) INTO total_servicios FROM servicio_profesional WHERE rut_usuario = NEW.rut_usuario;
  IF total_servicios >= 3 THEN RAISE EXCEPTION 'Un profesional no puede tener más de 3 servicios activos'; END IF;
  RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_max_servicios BEFORE INSERT ON servicio_profesional FOR EACH ROW EXECUTE FUNCTION validar_max_servicios_profesional();

COMMIT;
