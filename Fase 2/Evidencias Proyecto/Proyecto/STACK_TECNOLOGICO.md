# Stack Tecnológico - ServiHogar

## 📋 Resumen Ejecutivo

**Tipo de Proyecto:** Plataforma web de servicios profesionales a domicilio  
**Arquitectura:** Cliente-Servidor con API RESTful  
**Containerización:** Docker Compose (3 servicios)

---

## 🎯 BACKEND

### Framework Principal
- **Django 4.2.25** - Framework web de Python
- **Django REST Framework 3.16.1** - API RESTful

### Base de Datos
- **PostgreSQL 16** - Base de datos relacional
- **psycopg 3.2.10** - Adaptador PostgreSQL para Python

### Autenticación y Seguridad
- **djangorestframework-simplejwt 5.3.1** - Autenticación JWT (JSON Web Tokens)
- **django-cors-headers 4.9.0** - Manejo de CORS para comunicación frontend-backend

### Pagos
- **MercadoPago SDK 2.2.3** - Integración de pagos

### Configuración
- **django-environ 0.12.0** - Manejo de variables de entorno

### Servidor
- **Python 3.x** (versión del Dockerfile)
- **Gunicorn/Django Development Server** - Servidor de aplicaciones

### Routing Backend (Django URLs)
```
/admin/                                    # Panel de administración Django
/api/ping/                                 # Health check
/api/auth/register/                        # Registro de usuarios
/api/auth/login/                           # Login JWT
/api/auth/refresh/                         # Refresh token
/api/auth/me/                              # Perfil usuario
/api/auth/me/update/                       # Actualizar perfil
/api/auth/me/avatar/                       # Upload avatar
/api/professional/apply/                   # Aplicar como profesional
/api/professional/stats/                   # Estadísticas profesional
/api/verifications/pending/                # Verificaciones pendientes
/api/verifications/service/<uuid>/         # Verificar servicio
/api/verifications/stats/                  # Estadísticas verificador
/api/geo/regiones/                         # Regiones de Chile
/api/geo/comunas/                          # Comunas de Chile
/api/categories/                           # Categorías de servicios
/api/my/services/                          # Servicios del profesional
/api/schedule/<uuid>/                      # Horario de servicio
/api/schedule/<uuid>/block-conflicts/      # Conflictos de horario
/api/services/<uuid>/price/                # Actualizar precio
/api/services/<uuid>/details/              # Actualizar detalles servicio
/api/services/<uuid>/toggle/               # Activar/desactivar servicio
/api/admin/...                             # Endpoints administrativos
/api/payments/...                          # Endpoints de pagos
```

---

## 🎨 FRONTEND

### Framework y Librerías Core
- **React 19.1.1** - Librería UI
- **React DOM 19.1.1** - Renderizado React
- **TypeScript 5.8.3** - Tipado estático
- **Vite 7.1.7** - Build tool y dev server

### Routing
- **React Router DOM 7.9.3** - Enrutamiento del lado del cliente
  - **createBrowserRouter** - Router basado en data
  - **Layouts anidados:**
    - `Layout` - Header + Footer (páginas públicas)
    - `AuthLayout` - Sin header/footer (login/register)
    - `AuthenticatedLayout` - Sin header/footer (dashboards)

### Routing Frontend (React Router)
```
Rutas Públicas (con Header/Footer):
  /                          # Homepage (Hero, Services, Benefits)
  /servicios                 # Catálogo de servicios
  /como-funciona             # Cómo funciona la plataforma
  /resenas                   # Reseñas de clientes
  /contacto                  # Formulario de contacto
  /terminos                  # Términos y condiciones
  /privacidad                # Política de privacidad
  /payment/success           # Pago exitoso
  /payment/failure           # Pago fallido
  /payment/pending           # Pago pendiente
  /*                         # 404 Not Found

Rutas de Autenticación (sin Header/Footer):
  /login                     # Inicio de sesión
  /register                  # Registro de usuarios

Rutas Autenticadas (dashboards, sin Header/Footer):
  /profesional               # Dashboard profesional
  /verificador               # Dashboard verificador
  /cliente                   # Dashboard cliente
  /admin                     # Dashboard administrador
```

### UI y Componentes
- **Radix UI** - Componentes primitivos accesibles:
  - accordion, alert-dialog, avatar, checkbox, dialog
  - dropdown-menu, hover-card, label, menubar
  - navigation-menu, popover, progress, radio-group
  - scroll-area, select, separator, slider, switch
  - tabs, toggle, tooltip (26 componentes)
- **Lucide React 0.544.0** - Iconos (5000+ iconos)
- **Sonner 2.0.3** - Sistema de notificaciones toast

### Estilos
- **Tailwind CSS 4.1.14** - Framework CSS utility-first
- **PostCSS 8.5.6** - Procesador CSS
- **Autoprefixer 10.4.21** - Prefijos CSS automáticos
- **@tailwindcss/postcss 4.1.14** - Plugin PostCSS para Tailwind
- **class-variance-authority 0.7.1** - Variantes de componentes
- **clsx 2.1.1** - Utilidad para combinar clases CSS
- **tailwind-merge 3.3.1** - Merge inteligente de clases Tailwind

### Formularios y Validación
- **React Hook Form 7.55.0** - Manejo de formularios
- **input-otp 1.4.2** - Componente OTP

### Visualización de Datos
- **Recharts 2.15.2** - Gráficos y visualizaciones

### Pagos
- **@mercadopago/sdk-react 1.0.6** - Integración MercadoPago

### Carruseles y Paneles
- **Embla Carousel React 8.6.0** - Carrusel
- **Embla Carousel Autoplay 8.6.0** - Autoplay para carrusel
- **React Resizable Panels 2.1.7** - Paneles redimensionables

### Otras Utilidades
- **cmdk 1.1.1** - Command menu component
- **vaul 1.1.2** - Drawer component
- **next-themes 0.4.6** - Gestión de temas

### Herramientas de Desarrollo
- **ESLint 9.36.0** - Linter
- **@eslint/js** - Configuración ESLint
- **eslint-plugin-react-hooks** - Reglas React Hooks
- **eslint-plugin-react-refresh** - Reglas React Refresh
- **TypeScript ESLint 8.44.0** - ESLint para TypeScript
- **@vitejs/plugin-react 5.0.3** - Plugin Vite para React

---

## 🐳 INFRAESTRUCTURA Y DEVOPS

### Containerización
- **Docker** - Plataforma de contenedores
- **Docker Compose** - Orquestación de contenedores

### Servicios Docker
1. **servihogar-postgres** (db)
   - Imagen: `postgres:16`
   - Puerto: `5432:5432`
   - Volumen persistente: `pgdata`

2. **servihogar-pgadmin** (pgadmin)
   - Imagen: `dpage/pgadmin4:8`
   - Puerto: `5050:80`
   - Usuario: admin@servihogar.cl / admin

3. **servihogar-web** (web - Django)
   - Build: Dockerfile custom
   - Puerto: `8000:8000`
   - Volumen: código fuente montado

4. **servihogar-frontend** (frontend - React)
   - Build: Dockerfile custom (nginx)
   - Puerto: `5173:80`
   - Volumen: build de producción

### Scripts y Automatización
- **dev.ps1** - Script PowerShell para desarrollo
- **entrypoint.sh** - Script de inicialización del contenedor Django

---

## 📁 ESTRUCTURA DEL PROYECTO

```
Proyecto/
├── api/                          # App Django con API REST
│   ├── models.py                 # Modelos de datos
│   ├── views.py                  # Endpoints API (3757+ líneas)
│   ├── serializers.py            # Serialización JSON
│   ├── urls.py                   # Rutas API
│   ├── signals.py                # Señales Django
│   └── migrations/               # Migraciones BD
├── frontend/                     # Aplicación React
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   │   ├── ui/               # Componentes UI base (Radix)
│   │   │   ├── user/             # Componentes de usuario
│   │   │   ├── admin/            # Componentes admin
│   │   │   └── professional/     # Componentes profesional
│   │   ├── pages/                # Páginas/Vistas
│   │   ├── lib/                  # Utilidades
│   │   │   ├── api.ts            # Cliente API
│   │   │   └── auth.tsx          # Context autenticación
│   │   ├── assets/               # Recursos estáticos
│   │   ├── main.tsx              # Entry point + Router
│   │   ├── App.tsx               # Componente raíz
│   │   └── index.css             # Estilos globales (Tailwind)
│   ├── package.json              # Dependencias Node
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── vite.config.ts            # Configuración Vite
│   ├── tailwind.config.ts        # Configuración Tailwind
│   └── Dockerfile                # Imagen frontend
├── servihogar/                   # Configuración Django
│   ├── settings.py               # Configuración Django
│   ├── urls.py                   # URLs principales
│   └── wsgi.py                   # WSGI config
├── db/                           # Scripts SQL
├── fixes/                        # Parches SQL
├── scripts/                      # Scripts Python
├── docker-compose.yml            # Orquestación Docker
├── Dockerfile                    # Imagen backend
├── requirements.txt              # Dependencias Python
├── manage.py                     # CLI Django
└── README.md                     # Documentación
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### Sistema de Autenticación
- **JWT (JSON Web Tokens)** con djangorestframework-simplejwt
- **Access Token** - Token de corta duración
- **Refresh Token** - Token de larga duración para renovar access tokens

### Roles de Usuario
1. **Cliente** - Usuario regular que contrata servicios
2. **Profesional** - Proveedor de servicios
3. **Verificador** - Valida servicios profesionales
4. **Administrador** - Gestión completa de la plataforma

### Context de Autenticación (Frontend)
- **AuthProvider** - Context provider global
- **useAuth Hook** - Hook personalizado para acceder al estado de auth
- Almacenamiento en **localStorage** de tokens JWT

---

## 🗃️ BASE DE DATOS

### Esquema Principal
- **usuario_dominio** - Usuarios del sistema
- **perfil** - Perfiles extendidos de usuario
- **categoria_servicio** - Categorías de servicios
- **servicio_profesional** - Servicios ofrecidos
- **plantilla_horaria** - Horarios semanales
- **horario_personalizado** - Horarios personalizados
- **bloqueo_dia** - Días bloqueados/no disponibles
- **region** - Regiones de Chile
- **comuna** - Comunas de Chile
- **documento_profesional** - Documentos verificación
- **solicitud_servicio** - Solicitudes de clientes
- **cuenta_bancaria** - Cuentas para pagos
- **resena** - Reseñas y calificaciones

### Migraciones
- Sistema de migraciones Django ORM
- Scripts SQL adicionales en `/db` y `/fixes`

---

## 🔄 FLUJO DE DATOS

### Cliente → Servidor
1. Frontend hace request HTTP a backend (fetch/axios)
2. JWT token en header `Authorization: Bearer <token>`
3. Django valida token y permisos
4. Django consulta PostgreSQL
5. Django serializa respuesta (DRF)
6. Frontend recibe JSON y actualiza UI (React)

### Patrones de Comunicación
- **REST API** - Endpoints RESTful
- **JSON** - Formato de intercambio de datos
- **CORS** - Habilitado para desarrollo local

---

## 🚀 COMANDOS Y SCRIPTS

### Backend (Django)
```bash
python manage.py runserver              # Servidor desarrollo
python manage.py migrate                # Aplicar migraciones
python manage.py makemigrations         # Crear migraciones
python manage.py createsuperuser        # Crear admin
python manage.py shell                  # Shell Python
```

### Frontend (React/Vite)
```bash
npm run dev                             # Servidor desarrollo (Vite)
npm run build                           # Build producción
npm run preview                         # Preview build
npm run lint                            # Lint código
```

### Docker
```bash
docker-compose up                       # Iniciar todos los servicios
docker-compose up -d                    # Modo detached
docker-compose down                     # Detener servicios
docker-compose logs -f web              # Ver logs Django
docker-compose restart frontend         # Reiniciar frontend
docker-compose exec web python manage.py migrate  # Migrar en contenedor
```

---

## 🌐 PUERTOS Y SERVICIOS

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Vite Dev) | 5173 | http://localhost:5173 |
| Frontend (Nginx Prod) | 80 | http://localhost |
| Backend (Django) | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| pgAdmin | 5050 | http://localhost:5050 |

---

## 📦 GESTORES DE PAQUETES

- **pip** - Gestión de paquetes Python (backend)
- **npm** - Gestión de paquetes Node.js (frontend)

---

## 🔧 VARIABLES DE ENTORNO

### Backend (.env o docker-compose.yml)
- `DEBUG` - Modo debug Django
- `SECRET_KEY` - Clave secreta Django
- `ALLOWED_HOSTS` - Hosts permitidos
- `DATABASE_URL` - URL conexión PostgreSQL
- `CORS_ALLOWED_ORIGINS` - Orígenes CORS permitidos
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `DB_PASSWORD` - Credenciales DB

### Frontend
- Variables de entorno de Vite (si es necesario)
- API URL configurada en `lib/api.ts`

---

## 📊 MÉTRICAS DEL PROYECTO

- **Backend:** ~3757+ líneas en views.py
- **Endpoints API:** 100+ rutas
- **Componentes Frontend:** 80+ componentes
- **Páginas:** 15+ páginas/vistas
- **Dependencias Python:** 7 principales
- **Dependencias npm:** 47 principales + 15 dev
- **Componentes UI (Radix):** 26 primitivos

---

## 🎨 SISTEMA DE DISEÑO

### Tokens de Color (Tailwind Theme)
- `background` - #ffffff
- `foreground` - #111827
- `primary` - #111827
- `secondary` - #f3f4f6
- `accent` - #e5e7eb
- `destructive` - #dc2626
- `border` - rgba(0,0,0,0.1)
- `ring` - #3b82f6

### Componentes UI Base
- Todos los componentes usan **Radix UI** como base
- Estilizados con **Tailwind CSS**
- Variantes gestionadas con **class-variance-authority**

---

## 📝 NOTAS ADICIONALES

### Integraciones
- **MercadoPago** - Procesamiento de pagos
- **PostgreSQL** - Base de datos principal
- **JWT** - Autenticación stateless

### Características Clave
- **Responsive Design** - Móvil y desktop
- **Accesibilidad** - Componentes Radix UI accesibles
- **Validación** - React Hook Form + validaciones backend
- **Notificaciones** - Sistema toast con Sonner
- **Gestión de horarios** - Calendario personalizado
- **Sistema de verificación** - Validación de profesionales
- **Multi-rol** - 4 tipos de usuarios con permisos diferentes

---

**Última actualización:** 16 de Noviembre, 2025
