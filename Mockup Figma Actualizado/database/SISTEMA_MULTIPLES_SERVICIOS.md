# Sistema de Múltiples Servicios por Profesional - ServiHogar

## Descripción General

Implementación completa del sistema que permite a los profesionales **ofrecer múltiples servicios** (Gasfitería, Limpieza del Hogar, Jardinería) de forma independiente, con la capacidad de **habilitar/deshabilitar** cada servicio según su disponibilidad.

## Cambios en el Modelo de Datos

### Nueva Estructura de Tablas

#### 1. `perfil_profesional` → **Perfil General**
```sql
CREATE TABLE perfil_profesional (
    id_perfil_profesional UUID PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario),
    
    -- Información general del profesional
    descripcion_general TEXT,
    telefono_profesional VARCHAR(20),
    
    -- Estado general de verificación
    estado_verificacion_general VARCHAR(20) DEFAULT 'pendiente',
    id_verificado_por UUID REFERENCES usuario(id_usuario),
    
    -- Métricas generales (calculadas automáticamente)
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_trabajos_completados INTEGER DEFAULT 0,
    total_ganancias INTEGER DEFAULT 0,
    
    -- Control de disponibilidad general
    esta_activo BOOLEAN DEFAULT true,
    acepta_nuevos_trabajos BOOLEAN DEFAULT true
);
```

#### 2. `servicio_profesional` → **Servicios Específicos** ⭐
```sql
CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY,
    id_usuario UUID NOT NULL REFERENCES usuario(id_usuario),
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),
    
    -- Configuración específica por servicio
    anos_experiencia VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_duracion VARCHAR(10) NOT NULL,
    duracion_fija_minutos INTEGER,
    duracion_minima_minutos INTEGER,
    duracion_maxima_minutos INTEGER,
    precio_fijo INTEGER NOT NULL,
    
    -- Control de estado por servicio
    esta_activo BOOLEAN DEFAULT true, -- ⭐ HABILITAR/DESHABILITAR
    esta_disponible BOOLEAN DEFAULT true,
    
    -- Verificación independiente por servicio
    estado_verificacion VARCHAR(20) DEFAULT 'pendiente',
    
    -- Métricas específicas por servicio
    calificacion DECIMAL(3,2) DEFAULT 0.00,
    trabajos_completados INTEGER DEFAULT 0,
    ganancias_totales INTEGER DEFAULT 0,
    
    -- Un profesional no puede duplicar el mismo servicio
    UNIQUE(id_usuario, id_categoria_servicio)
);
```

### Beneficios del Nuevo Modelo

| **Funcionalidad** | **Modelo Anterior** | **Modelo Nuevo** |
|-------------------|--------------------|--------------------|
| **Servicios por profesional** | 1 servicio fijo | **Múltiples servicios** |
| **Control individual** | Todo o nada | **Habilitar/deshabilitar** por servicio |
| **Precios** | Un precio general | **Precio específico** por servicio |
| **Configuración** | Una configuración | **Configuración independiente** |
| **Verificación** | Una verificación | **Verificación por servicio** |
| **Métricas** | Generales | **Específicas + generales calculadas** |

## Interfaz de Usuario Actualizada

### ProfessionalTabMultiService.tsx

#### **Características Principales:**

🏠 **Vista de Resumen**:
- Perfil profesional general
- Lista rápida de todos los servicios
- **Switches para habilitar/deshabilitar** cada servicio
- Métricas consolidadas

📋 **Gestión de Servicios**:
- **Agregar múltiples servicios** (hasta 3: Gasfitería, Limpieza, Jardinería)
- **Configuración independiente** por servicio:
  - Precio fijo específico
  - Duración estimada (fija o rango)
  - Descripción especializada
  - Años de experiencia en ese servicio

⚙️ **Controles de Estado**:
- **Switch principal** por servicio (activo/inactivo)
- Control de disponibilidad temporal
- Estado de verificación independiente
- Métricas específicas (calificación, trabajos, ganancias)

🔧 **Funcionalidades Avanzadas**:
- **Eliminar servicios** que ya no ofrece
- **Editar configuración** de servicios existentes
- **Vista unificada** de horarios (aplica a todos los servicios)
- **Documentos compartidos** (aplican a todos los servicios)

### Estados de Servicio

#### 1. **Activo** ✅
```typescript
{
  isActive: true,
  isAvailable: true,
  verificationStatus: 'approved'
}
```
- Visible para clientes
- Acepta nuevas reservas
- Aparece en búsquedas

#### 2. **Inactivo** ❌
```typescript
{
  isActive: false,
  isAvailable: true,
  verificationStatus: 'approved'
}
```
- **No visible** para clientes
- **No acepta** nuevas reservas
- Profesional puede reactivar cuando desee

#### 3. **Pausado** ⏸️
```typescript
{
  isActive: true,
  isAvailable: false,
  verificationStatus: 'approved'
}
```
- Visible pero marcado como "No disponible"
- Para mantenimiento temporal

#### 4. **En Verificación** 🔍
```typescript
{
  isActive: true,
  isAvailable: true,
  verificationStatus: 'pending'
}
```
- Esperando aprobación del verificador
- No acepta reservas hasta ser aprobado

## Flujo de Usuario

### **Nuevo Profesional**:
1. **Registro inicial** con primer servicio obligatorio
2. **Configuración** de perfil general + primer servicio
3. **Verificación** del servicio inicial
4. **Agregar servicios adicionales** cuando desee

### **Profesional Existente**:
1. **Vista de resumen** con todos sus servicios
2. **Habilitar/deshabilitar** servicios con un click
3. **Agregar nuevos servicios** sin afectar los existentes
4. **Configurar precios** independientes por servicio
5. **Gestionar verificación** separada por servicio

## Casos de Uso Reales

### **Ejemplo 1: Profesional Multiespecialidad**
```typescript
{
  generalDescription: "Profesional con 8 años de experiencia en servicios del hogar",
  services: [
    {
      categoryName: "Gasfitería",
      priceFixed: 35000,
      experience: "5 años",
      isActive: true, // ✅ Activo
      verificationStatus: "approved"
    },
    {
      categoryName: "Limpieza del Hogar", 
      priceFixed: 25000,
      experience: "3 años",
      isActive: false, // ❌ Deshabilitado temporalmente
      verificationStatus: "approved"
    },
    {
      categoryName: "Jardinería",
      priceFixed: 40000,
      experience: "2 años", 
      isActive: true, // ✅ Activo
      verificationStatus: "pending" // 🔍 En verificación
    }
  ]
}
```

### **Ejemplo 2: Gestión Estacional**
Un profesional puede:
- **Activar jardinería** en primavera/verano
- **Desactivar jardinería** en invierno
- **Mantener gasfitería** activa todo el año
- **Agregar limpieza** para la temporada navideña

## Migración y Compatibilidad

### **Para Profesionales Existentes**:
1. Datos actuales se **migran automáticamente** al nuevo modelo
2. **Servicio principal** se convierte en el primer servicio específico
3. **Configuración existente** se preserva
4. **Pueden agregar servicios adicionales** inmediatamente

### **Para Nuevos Profesionales**:
1. **Proceso guiado** para crear perfil general + primer servicio
2. **Opciones claras** para agregar servicios adicionales
3. **Configuración independiente** desde el inicio

## Beneficios del Sistema

### **Para Profesionales** 🛠️:
- **Diversificación de ingresos** (múltiples servicios)
- **Control granular** (activar/desactivar por conveniencia)
- **Flexibilidad estacional** (adaptarse a demanda)
- **Especialización progresiva** (agregar servicios gradualmente)

### **Para Clientes** 👥:
- **Más opciones** de profesionales por servicio
- **Profesionales especializados** en cada área
- **Precios competitivos** por especialización
- **Mejor calidad** por experiencia específica

### **Para la Plataforma** 📈:
- **Mayor catálogo** de servicios disponibles
- **Profesionales más activos** (múltiples fuentes de ingreso)
- **Mejor retención** de profesionales
- **Crecimiento escalable** del marketplace

---

**Estado**: ✅ Implementado  
**Fecha**: Enero 2025  
**Versión**: Sistema Múltiples Servicios v1.0  
**Impacto**: Transformación completa del modelo profesional