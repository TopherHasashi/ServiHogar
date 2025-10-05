# 📊 MODELO RELACIONAL SERVIHOGAR
## Diagrama de Relaciones Entre Tablas

```mermaid
erDiagram
    %% ENTIDADES GEOGRÁFICAS
    REGIONS {
        uuid id PK
        varchar name
        varchar code
        timestamp created_at
    }
    
    COMMUNES {
        uuid id PK
        uuid region_id FK
        varchar name
        varchar code
        timestamp created_at
    }
    
    %% SERVICIOS
    SERVICE_CATEGORIES {
        uuid id PK
        varchar name
        text description
        varchar icon
        boolean is_active
        timestamp created_at
    }
    
    %% USUARIOS PRINCIPAL
    USERS {
        uuid id PK
        varchar first_name
        varchar last_name
        varchar rut
        varchar email
        varchar password_hash
        varchar phone
        varchar gender
        date birth_date
        uuid region_id FK
        uuid commune_id FK
        text address
        varchar role
        boolean is_active
        boolean email_verified
        timestamp member_since
        timestamp last_login
        timestamp created_at
        timestamp updated_at
    }
    
    %% PROFESIONALES
    PROFESSIONAL_PROFILES {
        uuid id PK
        uuid user_id FK
        uuid service_category_id FK
        varchar experience_years
        text description
        varchar duration_type
        integer fixed_duration_minutes
        integer min_duration_minutes
        integer max_duration_minutes
        integer price_per_hour
        varchar verification_status
        uuid verified_by FK
        timestamp verified_at
        text rejection_reason
        decimal rating
        integer completed_jobs
        integer total_earnings
        timestamp created_at
        timestamp updated_at
    }
    
    PROFESSIONAL_DOCUMENTS {
        uuid id PK
        uuid professional_profile_id FK
        varchar document_type
        varchar document_name
        text file_url
        integer file_size
        varchar mime_type
        boolean is_required
        varchar verification_status
        uuid verified_by FK
        timestamp verified_at
        text rejection_reason
        timestamp uploaded_at
    }
    
    PROFESSIONAL_SCHEDULES {
        uuid id PK
        uuid professional_profile_id FK
        integer day_of_week
        time start_time
        time end_time
        boolean is_available
        timestamp created_at
    }
    
    %% SOLICITUDES Y SERVICIOS
    SERVICE_REQUESTS {
        uuid id PK
        uuid client_id FK
        uuid professional_id FK
        uuid service_category_id FK
        varchar title
        text description
        date scheduled_date
        time scheduled_time
        integer duration_minutes
        text service_address
        uuid service_region_id FK
        uuid service_commune_id FK
        integer price_per_hour
        integer total_price
        varchar currency
        varchar status
        timestamp confirmed_at
        timestamp started_at
        timestamp completed_at
        timestamp cancelled_at
        text cancellation_reason
        timestamp created_at
        timestamp updated_at
    }
    
    %% PAGOS
    PAYMENTS {
        uuid id PK
        uuid service_request_id FK
        varchar mercadopago_payment_id
        varchar mercadopago_preference_id
        integer amount
        varchar currency
        varchar payment_method
        varchar status
        timestamp paid_at
        timestamp refunded_at
        integer refund_amount
        varchar external_reference
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    %% RESEÑAS
    REVIEWS {
        uuid id PK
        uuid service_request_id FK
        uuid reviewer_id FK
        uuid reviewed_id FK
        integer rating
        text comment
        integer punctuality_rating
        integer quality_rating
        integer communication_rating
        text professional_response
        timestamp professional_responded_at
        boolean is_public
        boolean is_featured
        timestamp created_at
        timestamp updated_at
    }
    
    %% NOTIFICACIONES
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        text message
        jsonb metadata
        boolean is_read
        timestamp read_at
        text action_url
        timestamp created_at
    }
    
    %% LOGS Y CONFIGURACIÓN
    ADMIN_LOGS {
        uuid id PK
        uuid admin_id FK
        varchar action
        varchar entity_type
        uuid entity_id
        text description
        jsonb old_values
        jsonb new_values
        inet ip_address
        text user_agent
        timestamp created_at
    }
    
    SYSTEM_SETTINGS {
        uuid id PK
        varchar key
        text value
        text description
        varchar data_type
        boolean is_public
        uuid updated_by FK
        timestamp created_at
        timestamp updated_at
    }

    %% RELACIONES GEOGRÁFICAS
    REGIONS ||--o{ COMMUNES : "has many"
    REGIONS ||--o{ USERS : "user lives in"
    COMMUNES ||--o{ USERS : "user lives in"
    REGIONS ||--o{ SERVICE_REQUESTS : "service location"
    COMMUNES ||--o{ SERVICE_REQUESTS : "service location"

    %% RELACIONES DE USUARIOS
    USERS ||--o| PROFESSIONAL_PROFILES : "becomes professional"
    USERS ||--o{ SERVICE_REQUESTS : "client requests"
    USERS ||--o{ SERVICE_REQUESTS : "professional provides"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ADMIN_LOGS : "admin performs action"
    USERS ||--o{ SYSTEM_SETTINGS : "admin updates"
    USERS ||--o{ REVIEWS : "client reviews"
    USERS ||--o{ REVIEWS : "professional reviewed"
    USERS ||--o{ PROFESSIONAL_PROFILES : "verifier approves"
    USERS ||--o{ PROFESSIONAL_DOCUMENTS : "verifier approves"

    %% RELACIONES DE SERVICIOS
    SERVICE_CATEGORIES ||--o{ PROFESSIONAL_PROFILES : "specializes in"
    SERVICE_CATEGORIES ||--o{ SERVICE_REQUESTS : "type of service"

    %% RELACIONES DE PROFESIONALES
    PROFESSIONAL_PROFILES ||--o{ PROFESSIONAL_DOCUMENTS : "uploads documents"
    PROFESSIONAL_PROFILES ||--o{ PROFESSIONAL_SCHEDULES : "defines availability"

    %% RELACIONES DE SOLICITUDES
    SERVICE_REQUESTS ||--o| PAYMENTS : "payment for service"
    SERVICE_REQUESTS ||--o| REVIEWS : "generates review"

```

## 🔗 RELACIONES DETALLADAS

### **1. RELACIONES GEOGRÁFICAS**
```sql
-- Una región tiene muchas comunas
regions (1) ←→ (N) communes

-- Un usuario vive en una región y comuna
users (N) ←→ (1) regions
users (N) ←→ (1) communes

-- Una solicitud se realiza en una región y comuna específica
service_requests (N) ←→ (1) regions (service_region_id)
service_requests (N) ←→ (1) communes (service_commune_id)
```

### **2. RELACIONES DE USUARIOS**
```sql
-- Un usuario puede tener un perfil profesional (relación 1:1)
users (1) ←→ (0,1) professional_profiles

-- Un usuario (cliente) puede hacer muchas solicitudes
users (1) ←→ (N) service_requests (client_id)

-- Un usuario (profesional) puede recibir muchas solicitudes
users (1) ←→ (N) service_requests (professional_id)

-- Un usuario recibe muchas notificaciones
users (1) ←→ (N) notifications

-- Un usuario (cliente) puede escribir muchas reseñas
users (1) ←→ (N) reviews (reviewer_id)

-- Un usuario (profesional) puede recibir muchas reseñas
users (1) ←→ (N) reviews (reviewed_id)
```

### **3. RELACIONES DE VERIFICACIÓN**
```sql
-- Un verificador aprueba muchos perfiles profesionales
users (1) ←→ (N) professional_profiles (verified_by)

-- Un verificador aprueba muchos documentos
users (1) ←→ (N) professional_documents (verified_by)

-- Un administrador realiza muchas acciones (logs)
users (1) ←→ (N) admin_logs (admin_id)

-- Un administrador actualiza configuraciones
users (1) ←→ (N) system_settings (updated_by)
```

### **4. RELACIONES DE SERVICIOS**
```sql
-- Una categoría de servicio tiene muchos profesionales
service_categories (1) ←→ (N) professional_profiles

-- Una categoría de servicio tiene muchas solicitudes
service_categories (1) ←→ (N) service_requests
```

### **5. RELACIONES DE PROFESIONALES**
```sql
-- Un perfil profesional tiene muchos documentos
professional_profiles (1) ←→ (N) professional_documents

-- Un perfil profesional tiene muchos horarios
professional_profiles (1) ←→ (N) professional_schedules
```

### **6. RELACIONES DE TRANSACCIONES**
```sql
-- Una solicitud tiene un pago
service_requests (1) ←→ (1) payments

-- Una solicitud puede tener una reseña
service_requests (1) ←→ (0,1) reviews
```

## 📋 TIPOS DE RELACIONES

### **RELACIONES 1:1 (Uno a Uno)**
- `users` ↔ `professional_profiles` - Un usuario puede ser profesional
- `service_requests` ↔ `payments` - Una solicitud tiene un pago
- `service_requests` ↔ `reviews` - Una solicitud puede tener una reseña

### **RELACIONES 1:N (Uno a Muchos)**
- `regions` ↔ `communes` - Una región tiene muchas comunas
- `users` ↔ `service_requests` (como cliente o profesional)
- `professional_profiles` ↔ `professional_documents`
- `professional_profiles` ↔ `professional_schedules`
- `users` ↔ `notifications`
- `service_categories` ↔ `professional_profiles`

### **RELACIONES N:M (Muchos a Muchos)**
No hay relaciones directas N:M en este modelo. Todas las relaciones complejas se manejan a través de tablas intermedias o relaciones 1:N.

## 🔧 CLAVES FORÁNEAS CRÍTICAS

### **Integridad Referencial**
```sql
-- Cascada en eliminación para mantener consistencia
professional_profiles.user_id → users.id (CASCADE)
professional_documents.professional_profile_id → professional_profiles.id (CASCADE)
professional_schedules.professional_profile_id → professional_profiles.id (CASCADE)
notifications.user_id → users.id (CASCADE)

-- Restricción en eliminación para preservar datos históricos
service_requests.client_id → users.id (RESTRICT)
service_requests.professional_id → users.id (RESTRICT)
payments.service_request_id → service_requests.id (RESTRICT)
reviews.service_request_id → service_requests.id (RESTRICT)
```

## 🎯 CONSULTAS TÍPICAS OPTIMIZADAS

### **Búsqueda de Profesionales**
```sql
-- Profesionales por región, servicio y calificación
SELECT pp.*, u.first_name, u.last_name, r.name as region, sc.name as service
FROM professional_profiles pp
JOIN users u ON pp.user_id = u.id
JOIN regions r ON u.region_id = r.id
JOIN service_categories sc ON pp.service_category_id = sc.id
WHERE u.region_id = ? 
  AND pp.service_category_id = ?
  AND pp.rating >= ?
  AND pp.verification_status = 'approved'
ORDER BY pp.rating DESC, pp.completed_jobs DESC;
```

### **Historial de Solicitudes del Cliente**
```sql
-- Solicitudes con estado de pago y reseña
SELECT sr.*, p.status as payment_status, r.rating
FROM service_requests sr
LEFT JOIN payments p ON sr.id = p.service_request_id
LEFT JOIN reviews r ON sr.id = r.service_request_id
WHERE sr.client_id = ?
ORDER BY sr.created_at DESC;
```

### **Dashboard del Profesional**
```sql
-- Métricas del profesional con ganancias y calificaciones
SELECT 
    pp.*,
    COUNT(sr.id) as total_services,
    SUM(CASE WHEN sr.status = 'completed' THEN sr.total_price ELSE 0 END) as total_earnings,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
FROM professional_profiles pp
LEFT JOIN service_requests sr ON pp.user_id = sr.professional_id
LEFT JOIN reviews r ON sr.id = r.service_request_id
WHERE pp.user_id = ?
GROUP BY pp.id;
```

Este modelo relacional está optimizado para las funcionalidades de ServiHogar y mantiene la integridad de datos mientras permite consultas eficientes para todas las operaciones de la plataforma.