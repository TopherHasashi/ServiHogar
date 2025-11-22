# API de Cuentas Bancarias - Profesional

## Endpoints Disponibles

### 1. Listar Cuentas Bancarias
```http
GET /api/professional/bank-accounts/
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "accounts": [
    {
      "id": "uuid-de-la-cuenta",
      "banco": "Banco Estado",
      "tipo_cuenta": "Corriente",
      "numero_cuenta": "1234567890",
      "rut_titular": "12345678-9",
      "nombre_titular": "Juan Pérez",
      "email_contacto": "juan@example.com",
      "prioridad": 1,
      "estado": "activa",
      "creado_en": "2025-11-18T10:00:00Z",
      "actualizado_en": "2025-11-18T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 2. Crear Cuenta Bancaria
```http
POST /api/professional/bank-accounts/create/
Authorization: Bearer {token}
Content-Type: application/json

{
  "banco": "Banco Estado",
  "tipo_cuenta": "Corriente",
  "numero_cuenta": "1234567890",
  "rut_titular": "12345678-9",
  "nombre_titular": "Juan Pérez",
  "email_contacto": "juan@example.com",
  "prioridad": 1
}
```

**Validaciones:**
- Tipos de cuenta permitidos: `Corriente`, `Vista`, `Ahorro`, `RUT`
- Prioridad: 1 (principal), 2 (secundaria), 3 (terciaria)
- Máximo 3 cuentas por profesional
- Solo una cuenta por prioridad

**Respuesta exitosa (201):**
```json
{
  "message": "Cuenta bancaria creada exitosamente",
  "account_id": "uuid-de-la-cuenta"
}
```

**Errores posibles:**
- `400`: Ya tienes 3 cuentas registradas
- `400`: Ya tienes una cuenta con esa prioridad
- `403`: Solo los profesionales pueden agregar cuentas

### 3. Actualizar Cuenta Bancaria
```http
PUT /api/professional/bank-accounts/{account_id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "banco": "Banco de Chile",
  "tipo_cuenta": "Vista",
  "numero_cuenta": "9876543210",
  "rut_titular": "12345678-9",
  "nombre_titular": "Juan Pérez González",
  "email_contacto": "nuevo@example.com",
  "prioridad": 2,
  "estado": "activa"
}
```

**Campos opcionales:** Puedes actualizar solo los campos que necesites.

**Estados permitidos:** `activa`, `inactiva`, `bloqueada`

**Respuesta exitosa (200):**
```json
{
  "message": "Cuenta bancaria actualizada exitosamente"
}
```

**Errores posibles:**
- `404`: Cuenta no encontrada
- `403`: No tienes permiso para modificar esta cuenta
- `400`: Ya tienes otra cuenta con esa prioridad

### 4. Eliminar Cuenta Bancaria
```http
DELETE /api/professional/bank-accounts/{account_id}/delete/
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Cuenta bancaria eliminada exitosamente"
}
```

**Errores posibles:**
- `404`: Cuenta no encontrada
- `403`: No tienes permiso para eliminar esta cuenta

## Ejemplo de Implementación en React/TypeScript

```typescript
// api/bankAccounts.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface BankAccount {
  id: string;
  banco: string;
  tipo_cuenta: 'Corriente' | 'Vista' | 'Ahorro' | 'RUT';
  numero_cuenta: string;
  rut_titular: string;
  nombre_titular: string;
  email_contacto?: string;
  prioridad: 1 | 2 | 3;
  estado: 'activa' | 'inactiva' | 'bloqueada';
  creado_en: string;
  actualizado_en: string;
}

export interface CreateBankAccountData {
  banco: string;
  tipo_cuenta: 'Corriente' | 'Vista' | 'Ahorro' | 'RUT';
  numero_cuenta: string;
  rut_titular: string;
  nombre_titular: string;
  email_contacto?: string;
  prioridad: 1 | 2 | 3;
}

export const getBankAccounts = async (): Promise<{ accounts: BankAccount[]; total: number }> => {
  return await apiGet('/professional/bank-accounts/');
};

export const createBankAccount = async (data: CreateBankAccountData) => {
  return await apiPost('/professional/bank-accounts/create/', data);
};

export const updateBankAccount = async (accountId: string, data: Partial<CreateBankAccountData>) => {
  return await apiPut(`/professional/bank-accounts/${accountId}/`, data);
};

export const deleteBankAccount = async (accountId: string) => {
  return await apiDelete(`/professional/bank-accounts/${accountId}/delete/`);
};
```

## Componente de Ejemplo - Lista de Cuentas

```typescript
import React, { useState, useEffect } from 'react';
import { getBankAccounts, BankAccount } from '../api/bankAccounts';

export const BankAccountsList: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getBankAccounts();
      setAccounts(data.accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="bank-accounts-list">
      <h2>Mis Cuentas Bancarias</h2>
      {accounts.length === 0 ? (
        <p>No tienes cuentas bancarias registradas</p>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="account-priority">
                Prioridad {account.prioridad}
                {account.prioridad === 1 && ' - Principal'}
              </div>
              <h3>{account.banco}</h3>
              <p>Tipo: {account.tipo_cuenta}</p>
              <p>Cuenta: {account.numero_cuenta}</p>
              <p>Titular: {account.nombre_titular}</p>
              <p>RUT: {account.rut_titular}</p>
              <span className={`status ${account.estado}`}>
                {account.estado}
              </span>
            </div>
          ))}
        </div>
      )}
      {accounts.length < 3 && (
        <button onClick={() => {/* Abrir modal de crear */}}>
          Agregar Cuenta Bancaria
        </button>
      )}
    </div>
  );
};
```

## Componente de Ejemplo - Formulario de Creación

```typescript
import React, { useState } from 'react';
import { createBankAccount, CreateBankAccountData } from '../api/bankAccounts';

export const BankAccountForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<CreateBankAccountData>({
    banco: '',
    tipo_cuenta: 'Corriente',
    numero_cuenta: '',
    rut_titular: '',
    nombre_titular: '',
    email_contacto: '',
    prioridad: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createBankAccount(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta bancaria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bank-account-form">
      <h2>Agregar Cuenta Bancaria</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label>Banco *</label>
        <input
          type="text"
          value={formData.banco}
          onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Tipo de Cuenta *</label>
        <select
          value={formData.tipo_cuenta}
          onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value as any })}
          required
        >
          <option value="Corriente">Corriente</option>
          <option value="Vista">Vista</option>
          <option value="Ahorro">Ahorro</option>
          <option value="RUT">RUT</option>
        </select>
      </div>

      <div className="form-group">
        <label>Número de Cuenta *</label>
        <input
          type="text"
          value={formData.numero_cuenta}
          onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>RUT del Titular *</label>
        <input
          type="text"
          value={formData.rut_titular}
          onChange={(e) => setFormData({ ...formData, rut_titular: e.target.value })}
          placeholder="12345678-9"
          required
        />
      </div>

      <div className="form-group">
        <label>Nombre del Titular *</label>
        <input
          type="text"
          value={formData.nombre_titular}
          onChange={(e) => setFormData({ ...formData, nombre_titular: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Email de Contacto</label>
        <input
          type="email"
          value={formData.email_contacto}
          onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Prioridad *</label>
        <select
          value={formData.prioridad}
          onChange={(e) => setFormData({ ...formData, prioridad: Number(e.target.value) as any })}
          required
        >
          <option value={1}>1 - Principal</option>
          <option value={2}>2 - Secundaria</option>
          <option value={3}>3 - Terciaria</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar Cuenta'}
      </button>
    </form>
  );
};
```

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren token JWT en el header Authorization
2. **Permisos**: Solo los usuarios con `tipo_usuario = 'profesional'` pueden gestionar cuentas
3. **Límites**: Máximo 3 cuentas bancarias por profesional
4. **Prioridad única**: Solo puede haber una cuenta con cada prioridad (1, 2, 3)
5. **Validaciones**: Los campos requeridos están marcados con * en los ejemplos
6. **Estados**: Las cuentas pueden estar en estado `activa`, `inactiva` o `bloqueada`
