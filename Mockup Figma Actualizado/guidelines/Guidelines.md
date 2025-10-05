# Plataforma de Servicios para el Hogar - Guidelines

## Arquitectura Modular

### UserDashboard Structure
El UserDashboard está dividido en componentes modulares para facilitar el mantenimiento y las modificaciones:

**Estructura de archivos:**
```
/components/user/
├── UserDashboardModular.tsx    # Componente principal
├── tabs/
│   ├── SearchTab.tsx           # Búsqueda de servicios
│   ├── RequestsTab.tsx         # Mis solicitudes (con sistema de calificaciones)
│   ├── ProfileTab.tsx          # Mi perfil
│   └── ProfessionalTab.tsx     # Panel profesional
├── ReviewModal.tsx             # Modal de reseñas
├── ServiceBooking.tsx          # Reserva de servicios
└── ProfessionalScheduleManager.tsx
```

**Ventajas de la estructura modular:**
- ✅ Ediciones específicas sin afectar otras secciones
- ✅ Código más organizado y mantenible  
- ✅ Reducción del riesgo de pérdida de contenido
- ✅ Facilita testing y debugging

### Sistema de Calificaciones

**Implementación en RequestsTab.tsx:**
- Botón "Calificar" siempre visible para UX consistente
- Estados: Deshabilitado (gris) → Habilitado (azul) → Calificado (dorado)
- Tooltips informativos para cada estado
- Integración con ReviewModal para calificaciones detalladas

**Lógica de estados:**
```typescript
disabled={request.status !== "Completado" || !!request.rating}
```

## Reglas de Modificación

### Para editar UserDashboard:
1. **NUNCA** editar UserDashboardModular.tsx directamente para funcionalidades específicas
2. **SIEMPRE** editar el tab específico en `/tabs/`
3. **PRESERVAR** las props interfaces entre componentes
4. **MANTENER** la consistencia de estados entre tabs

### Para agregar nuevas funcionalidades:
1. Identificar el tab correcto (`SearchTab`, `RequestsTab`, `ProfileTab`, `ProfessionalTab`)
2. Editar solo ese archivo específico
3. Si la funcionalidad afecta múltiples tabs, coordinar cambios en el componente principal

## Design System

### Iconografía
- Verde (`text-green-600`) = Verificación, seguridad, confianza, completado
- Azul = Confirmado, acciones primarias
- Amarillo = Pendiente, advertencias
- Gris = Deshabilitado, información secundaria

### Estados de botones
- `variant="default"` = Acción primaria habilitada
- `variant="secondary"` = Acción secundaria o estado neutro  
- `variant="outline"` = Acción alternativa
- `disabled={true}` = Acción no disponible (con tooltip explicativo)

### Tooltips obligatorios
Siempre incluir `title` en botones deshabilitados para explicar el motivo.

## Componentes Protegidos

### No modificar:
- `/components/figma/ImageWithFallback.tsx`
- Archivos en `/components/ui/` (ShadCN components)

### Archivos temporales:
- Eliminar archivos que comiencen con `temp_`
- Mantener solo los componentes de producción

## General Guidelines

### Code Organization
- Keep file sizes small and put helper functions and components in their own files
- Use responsive layouts with flexbox and grid by default
- Refactor code as you go to keep it clean
- Only use absolute positioning when necessary

### Typography
- Do not override default typography (font-size, font-weight, line-height) unless specifically requested
- The design system handles typography automatically through `/styles/globals.css`
- Use semantic HTML elements (h1, h2, h3, p, etc.) for proper styling