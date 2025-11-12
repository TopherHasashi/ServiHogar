# Validaciones de Creación de Servicios Profesionales

## Resumen de Implementación
Se han implementado **5 validaciones críticas** en el endpoint `apply_professional` (`api/views.py`) para garantizar la integridad de datos y cumplir con las reglas de negocio.

---

## ✅ Validaciones Implementadas

### 1. **Prevención de Servicios Duplicados (Misma Categoría)**
**Ubicación**: `api/views.py` línea ~868  
**Código HTTP**: 400 Bad Request

```python
# Verifica que el profesional no tenga ya un servicio en esta categoría
SELECT COUNT(*)
FROM servicio_profesional
WHERE rut_usuario = %s AND id_categoria_servicio = %s
```

**Mensaje de Error**:
```
"Ya tienes un servicio en la categoría '{nombre_categoria}'. No puedes crear servicios duplicados en la misma categoría."
```

**Ejemplo**:
- ❌ Usuario `11.570.564-4` intenta crear segundo servicio en "Gasfitería" → **RECHAZADO**
- ✅ Usuario `11.570.564-4` crea servicio en "Limpieza" → **ACEPTADO** (diferente categoría)

---

### 2. **Límite de 3 Servicios Máximo por Profesional**
**Ubicación**: `api/views.py` línea ~883  
**Código HTTP**: 400 Bad Request

```python
# Cuenta el total de servicios del profesional
SELECT COUNT(*)
FROM servicio_profesional
WHERE rut_usuario = %s
```

**Mensaje de Error**:
```
"Has alcanzado el límite máximo de 3 servicios. No puedes agregar más servicios."
```

**Ejemplo**:
- ✅ Usuario con 2 servicios → **PUEDE crear 1 más**
- ⚠️ Usuario con 3 servicios → **NO PUEDE crear más**

---

### 3. **Precio Debe Ser Positivo**
**Ubicación**: `api/views.py` línea ~819  
**Código HTTP**: 400 Bad Request

```python
if price_fixed <= 0:
    return Response({"message": "El precio debe ser mayor a 0"}, ...)
```

**Mensaje de Error**:
```
"El precio debe ser mayor a 0"
```

**Ejemplos**:
- ❌ `price_fixed = 0` → **RECHAZADO**
- ❌ `price_fixed = -1000` → **RECHAZADO**
- ✅ `price_fixed = 25000` → **ACEPTADO**

---

### 4. **Años de Experiencia Entre 0 y 50**
**Ubicación**: `api/views.py` línea ~823  
**Código HTTP**: 400 Bad Request

```python
if exp_int < 0 or exp_int > 50:
    return Response({"message": "Los años de experiencia deben estar entre 0 y 50"}, ...)
```

**Mensaje de Error**:
```
"Los años de experiencia deben estar entre 0 y 50"
```

**Ejemplos**:
- ❌ `experience = -5` → **RECHAZADO**
- ❌ `experience = 100` → **RECHAZADO**
- ✅ `experience = 5` → **ACEPTADO**
- ✅ `experience = 0` → **ACEPTADO** (recién egresado)

---

### 5. **Tipos de Archivo Permitidos (PDF, JPG, PNG)**
**Ubicación**: `api/views.py` línea ~997  
**Código HTTP**: 400 Bad Request

```python
allowed_mimes = {'application/pdf', 'image/jpeg', 'image/jpg', 'image/png'}

# Para certificado
if cert_mime not in allowed_mimes:
    return Response({"message": "Certificado debe ser PDF, JPG o PNG"}, ...)

# Para documentos de experiencia
if exp_mime not in allowed_mimes:
    return Response({"message": "Los documentos de experiencia deben ser PDF, JPG o PNG"}, ...)
```

**Mensajes de Error**:
```
"Certificado debe ser PDF, JPG o PNG"
"Los documentos de experiencia deben ser PDF, JPG o PNG"
```

**Tipos MIME Permitidos**:
- ✅ `application/pdf`
- ✅ `image/jpeg`
- ✅ `image/jpg`
- ✅ `image/png`

**Ejemplos Bloqueados**:
- ❌ `application/msword` (.doc)
- ❌ `application/zip`
- ❌ `text/plain` (.txt)
- ❌ `application/x-executable`

---

## 🔒 Validaciones Previas (Ya Existentes)

### 6. **Tamaño Máximo de Archivos: 5MB**
```python
max_bytes = 5 * 1024 * 1024
if cert_file.size > max_bytes:
    return Response({"message": "Certificado supera 5MB"}, ...)
```

### 7. **Campos Requeridos**
- `general_description`: Descripción general del profesional
- `category_slug`: Categoría del servicio
- `experience`: Años de experiencia
- `description`: Descripción del servicio
- `price_fixed`: Precio del servicio
- `experience_docs`: Al menos 1 documento de experiencia

### 8. **Tipo de Duración Válido**
- `duration_type`: Debe ser `"fixed"` o `"range"`
- Si es `fixed`: `fixed_duration` debe ser > 0
- Si es `range`: `min_duration` y `max_duration` deben ser > 0 y `min_duration <= max_duration`

### 9. **Usuario Debe Existir en Tabla `usuario`**
```python
try:
    dom = UsuarioDominio.objects.get(email=user.email)
except UsuarioDominio.DoesNotExist:
    return Response({"message": "Usuario sin registro principal en 'usuario'"}, ...)
```

### 10. **Categoría Debe Existir**
- La categoría especificada debe existir en `categoria_servicio`
- Búsqueda flexible por slug o nombre (con unaccent)

---

## 📊 Estado Actual de la Base de Datos

### Servicios Existentes
| RUT Usuario   | Categoría   | Experiencia | Precio | Estado    |
|--------------|-------------|-------------|--------|-----------|
| 11.570.564-4 | Jardinería  | 5 años      | $25,000| Aprobado  |
| 11.570.564-4 | Gasfitería  | 3 años      | $25,000| Pendiente |

**Total**: 1 profesional con 2 servicios  
**Capacidad restante**: Este profesional puede crear **1 servicio más**

### Categorías Disponibles
1. **Gasfitería** (slug: `gasfiteria`)
2. **Jardinería** (slug: `jardineria`)
3. **Limpieza del Hogar** (slug: `limpieza`)

---

## 🧪 Pruebas de Validación

### Escenario 1: Intento de Servicio Duplicado
```bash
# Profesional 11.570.564-4 intenta crear otro servicio de "Gasfitería"
POST /api/professional/apply/
{
  "category_slug": "gasfiteria",
  "experience": "3",
  ...
}

# Respuesta esperada:
HTTP 400
{
  "message": "Ya tienes un servicio en la categoría 'Gasfitería'. No puedes crear servicios duplicados en la misma categoría."
}
```

### Escenario 2: Límite de Servicios
```bash
# Profesional con 3 servicios intenta crear un cuarto
POST /api/professional/apply/
{
  "category_slug": "limpieza",
  ...
}

# Respuesta esperada:
HTTP 400
{
  "message": "Has alcanzado el límite máximo de 3 servicios. No puedes agregar más servicios."
}
```

### Escenario 3: Precio Inválido
```bash
POST /api/professional/apply/
{
  "price_fixed": 0,  # o negativo
  ...
}

# Respuesta esperada:
HTTP 400
{
  "message": "El precio debe ser mayor a 0"
}
```

### Escenario 4: Experiencia Fuera de Rango
```bash
POST /api/professional/apply/
{
  "experience": "75",  # o negativo
  ...
}

# Respuesta esperada:
HTTP 400
{
  "message": "Los años de experiencia deben estar entre 0 y 50"
}
```

### Escenario 5: Tipo de Archivo Inválido
```bash
POST /api/professional/apply/
FormData:
  - certificate: documento.docx  # tipo: application/msword
  ...

# Respuesta esperada:
HTTP 400
{
  "message": "Certificado debe ser PDF, JPG o PNG"
}
```

---

## 🎯 Beneficios de las Validaciones

### Para la Integridad de Datos
- ✅ No hay servicios duplicados en la misma categoría
- ✅ No hay profesionales con más de 3 servicios
- ✅ Todos los precios son valores positivos reales
- ✅ Años de experiencia dentro de rangos razonables
- ✅ Solo archivos seguros (PDF, imágenes)

### Para la Experiencia de Usuario
- ✅ Mensajes de error claros y específicos
- ✅ Validación temprana (antes de procesar archivos)
- ✅ Prevención de errores comunes
- ✅ Retroalimentación inmediata

### Para la Seguridad
- ✅ Previene carga de archivos ejecutables
- ✅ Limita tamaño de archivos (DoS)
- ✅ Valida rangos de datos numéricos
- ✅ Previene manipulación de límites de negocio

---

## 📝 Archivos Modificados

### `api/views.py`
- **Línea ~819**: Validación de precio positivo
- **Línea ~823**: Validación de rango de experiencia
- **Línea ~868**: Validación de servicios duplicados
- **Línea ~883**: Validación de límite de 3 servicios
- **Línea ~997**: Validación de tipos MIME de archivos

### `scripts/test_service_validations.py`
- Script de prueba automatizado para verificar todas las validaciones
- Ejecutar con: `docker exec -i servihogar-web python scripts/test_service_validations.py`

---

## ✨ Conclusión

Se han implementado **5 validaciones críticas** que previenen:
1. ❌ Servicios duplicados en la misma categoría
2. ❌ Más de 3 servicios por profesional
3. ❌ Precios inválidos (0 o negativos)
4. ❌ Años de experiencia fuera de rango
5. ❌ Archivos con tipos no permitidos

**Estado**: ✅ **LISTO PARA PRODUCCIÓN**  
**Próximos pasos**: Pruebas manuales en el frontend para validar comportamiento completo

---

**Fecha de implementación**: 11 de noviembre de 2025  
**Desarrollador**: Matias Reuque  
**Repositorio**: ServiHogar / Rama: Desarrollo-ServiHogar-Matias-Reuque
