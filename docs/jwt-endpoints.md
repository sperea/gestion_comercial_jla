# Documentación de Endpoints JWT

## 📋 Resumen de Endpoints JWT

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/auth/login/` | POST | Obtener tokens JWT (access + refresh) |
| `/api/auth/refresh/` | POST | Renovar access token usando refresh token |
| `/api/auth/me/` | GET | Verificar usuario actual con access token |
| `/api/auth/logout/` | POST | Cerrar sesión y limpiar tokens |

---

## 🔐 Endpoint Principal de Login

**URL:** `POST /api/auth/login/`

### 📝 Datos a enviar:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### 📄 Respuesta exitosa:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "name": "Administrador"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.simulated-access-token",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.simulated-refresh-token"
    }
  },
  "message": "Login exitoso"
}
```

**Cookies establecidas:**
- `access-token`: Token de acceso (15 minutos de duración)
- `refresh-token`: Token de renovación (7 días de duración)

---

## 🔄 Endpoint para Renovar Token

**URL:** `POST /api/auth/refresh/`

### 📝 Datos a enviar:
No requiere body. Utiliza el `refresh-token` de las cookies HTTP-Only.

### 📄 Respuesta exitosa:
```json
{
  "success": true,
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.new-simulated-access-token"
  },
  "message": "Token renovado exitosamente"
}
```

**Cookie actualizada:**
- `access-token`: Nuevo token de acceso (15 minutos de duración)

---

## 👤 Endpoint de Verificación de Usuario

**URL:** `GET /api/auth/me/`

### 📝 Autenticación:
Utiliza el `access-token` de las cookies HTTP-Only.

### 📄 Respuesta exitosa:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "admin@example.com",
    "name": "Administrador"
  }
}
```

### 🔄 Renovación Automática:
Si el access token ha expirado (401), el frontend automáticamente:
1. Intenta renovar el token usando `/api/auth/refresh/`
2. Si la renovación es exitosa, reintenta la petición original
3. Si falla, redirige al login

---

## 🚪 Endpoint de Logout

**URL:** `POST /api/auth/logout/`

### 📝 Datos a enviar:
No requiere body.

### 📄 Respuesta exitosa:
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Cookies eliminadas:**
- `access-token`: Eliminada
- `refresh-token`: Eliminada

---

## 💻 Ejemplo de Uso con JavaScript/Frontend

```javascript
// Login
const loginResponse = await fetch('/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Importante para cookies
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});

// Verificar usuario (con renovación automática)
const userResponse = await fetch('/api/auth/me/', {
  credentials: 'include'
});

// Renovar token manualmente
const refreshResponse = await fetch('/api/auth/refresh/', {
  method: 'POST',
  credentials: 'include'
});

// Logout
const logoutResponse = await fetch('/api/auth/logout/', {
  method: 'POST',
  credentials: 'include'
});
```

---

## 🔧 Ejemplo con cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}' \
  -c cookies.txt

# Verificar usuario
curl -X GET http://localhost:8000/api/auth/me/ \
  -b cookies.txt

# Renovar token
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -X POST http://localhost:8000/api/auth/logout/ \
  -b cookies.txt
```

---

## ⚡ Características Implementadas

### 🔒 Seguridad
- **Cookies HTTP-Only**: Los tokens se almacenan en cookies seguras, no accesibles desde JavaScript
- **Tokens separados**: Access token de corta duración (15 min) y refresh token de larga duración (7 días)
- **Renovación automática**: El frontend maneja automáticamente la renovación de tokens expirados

### 🚀 Funcionalidades
- **Autenticación persistente**: La sesión se mantiene entre recargas de página
- **Manejo de errores**: Respuestas claras para diferentes escenarios de error
- **Limpieza de sesión**: Logout completo que elimina todos los tokens

### 🛠️ Configuración
- **Backend configurable**: URL del backend configurable via variable `NEXT_PUBLIC_API_URL`
- **Desarrollo local**: Configurado para funcionar con backend en `http://localhost:8000`

---

## 📝 Notas Importantes

1. **Duración de tokens**:
   - Access token: 15 minutos (corta duración por seguridad)
   - Refresh token: 7 días (permite sesiones persistentes)

2. **Renovación automática**:
   - Se ejecuta automáticamente cuando el access token expira
   - Transparente para el usuario final

3. **Seguridad**:
   - Las cookies son HTTP-Only y no accesibles desde JavaScript del lado cliente
   - En producción, usar `secure: true` para HTTPS

4. **Simulación**:
   - Los endpoints actuales son simulaciones para desarrollo
   - En producción, conectar a un backend real con JWT verdaderos