# 🐛 Guía de Debugging y Herramientas de Desarrollo

## Introducción

El proyecto incluye múltiples herramientas y páginas de debugging diseñadas para facilitar el desarrollo y la resolución de problemas, especialmente durante la integración con el backend Django.

## 🛠️ Páginas de Debug Disponibles

### 1. Debug General (`/debug`)

**URL:** `http://localhost:3000/debug`

**Propósito:** Información general del estado de autenticación y conexión con el backend.

**Información mostrada:**
- Estado de autenticación del usuario
- Contenido de cookies (access-token, refresh-token)
- Información del usuario actual desde Django
- Errores de conexión con el backend
- Timestamps de última actualización

**Código ubicado en:** `app/debug/page.tsx`

### 2. Test de Login (`/test-login`)

**URL:** `http://localhost:3000/test-login`

**Propósito:** Pruebas específicas del proceso de login con el backend Django.

**Funcionalidades:**
- Formulario de login simplificado para testing
- Display de respuesta cruda del servidor Django
- Visualización de tokens JWT recibidos
- Debug paso a paso del proceso de autenticación
- Manejo de errores específicos de Django

**Código ubicado en:** `app/test-login/page.tsx`

### 3. Debug de Roles (`/roles-debug`)

**URL:** `http://localhost:3000/roles-debug`

**Propósito:** Verificación completa del sistema de control de acceso por roles.

**Funcionalidades:**
- Lista completa de roles del usuario actual
- Verificación en tiempo real de funciones de roles
- Testing de `hasRole()`, `hasAnyRole()`, `isAdmin()`, `isSuperuser()`
- Ejemplos de código para implementación
- Estado de carga del sistema de roles

**Código ubicado en:** `app/roles-debug/page.tsx`

## 🔍 Debug Endpoints

### 1. Debug User Info (`/api/debug/me`)

**Propósito:** Endpoint para obtener información cruda del usuario desde Django.

```typescript
// GET /api/debug/me
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User"
  },
  "cookies": {
    "access-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh-token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "backend_response": {
    "status": 200,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### 2. Debug Cookies (`/api/debug/cookies`)

**Propósito:** Inspección de todas las cookies almacenadas.

```typescript
// GET /api/debug/cookies
{
  "cookies": [
    {
      "name": "access-token",
      "value": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    },
    {
      "name": "refresh-token", 
      "value": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🚨 Sistema de Logging

### Console Logging

El sistema incluye logging detallado en la consola del navegador:

```typescript
// AuthContext.tsx
console.log('🔐 Login attempt:', { email })
console.log('✅ Login successful:', response.data.user)
console.log('❌ Login failed:', error.message)

// RoleContext.tsx  
console.log('🎭 Loading user roles...')
console.log('✅ Roles loaded:', userRoles)
console.log('🔍 Role check:', { role: roleName, result: hasRole(roleName) })
```

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx (crear si necesario)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error caught by boundary:', error, errorInfo)
    
    // Opcional: Enviar a servicio de logging
    // logErrorToService(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## 🔧 Herramientas de Red

### Network Inspector

Para debugging de requests HTTP:

1. **Abrir DevTools** (F12)
2. **Ir a Network tab**
3. **Filtrar por XHR/Fetch**
4. **Realizar acciones que generen requests**

**Requests importantes a monitorear:**
- `POST /api/auth/login/` - Login
- `GET /api/auth/me/` - Info de usuario  
- `GET /api/users/me/roles/` - Roles
- `POST /api/auth/refresh/` - Refresh de token

### Headers importantes

**Request Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
Cookie: access-token=...; refresh-token=...
```

**Response Headers:**
```
Set-Cookie: access-token=...; HttpOnly; SameSite=Strict
Content-Type: application/json
Access-Control-Allow-Credentials: true
```

## 🧪 Testing Utilities

### Manual Testing Scripts

```typescript
// Ejecutar en consola del navegador

// Test de roles
const testRoles = () => {
  const { hasRole, hasAnyRole, isAdmin } = window.__ROLES_DEBUG__ || {}
  
  if (!hasRole) {
    console.log('❌ Role system not available')
    return
  }
  
  console.log('🧪 Testing roles...')
  console.log('hasRole("admin"):', hasRole('admin'))
  console.log('hasRole("user"):', hasRole('user'))  
  console.log('hasAnyRole(["admin", "moderator"]):', hasAnyRole(['admin', 'moderator']))
  console.log('isAdmin():', isAdmin())
}

// Test de autenticación
const testAuth = async () => {
  try {
    const response = await fetch('/api/auth/me/')
    const data = await response.json()
    console.log('🧪 Auth test result:', data)
  } catch (error) {
    console.error('❌ Auth test failed:', error)
  }
}

// Ejecutar tests
testRoles()
testAuth()
```

### API Testing con curl

```bash
# Test completo del flujo
# 1. Login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# 2. Test user info
curl -b cookies.txt http://localhost:3000/api/auth/me

# 3. Test roles
curl -b cookies.txt http://localhost:3000/api/users/me/roles

# 4. Test direct Django (si está disponible)
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"
```

## 🐛 Troubleshooting Común

### 1. Cookies no se establecen

**Síntomas:**
```javascript
// En /debug muestra:
{
  "cookies": [],
  "user": null,
  "authenticated": false
}
```

**Debug steps:**
1. Verificar Network tab para ver Set-Cookie headers
2. Verificar que el dominio coincida (localhost vs 127.0.0.1)
3. Comprobar configuración de SameSite en cookies

**Solución:**
```typescript
// app/api/auth/login/route.ts
cookieStore.set('access-token', data.access, {
  httpOnly: true,
  secure: false, // Cambiar a false en desarrollo
  sameSite: 'lax', // Menos restrictivo que 'strict'
  maxAge: 60 * 60,
  path: '/', // Asegurar que esté disponible en toda la app
})
```

### 2. CORS Errors

**Síntomas:**
```
Access to fetch at 'http://localhost:8000/api/auth/login/' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Debug steps:**
1. Verificar que Django esté configurado con CORS
2. Comprobar CORS_ALLOWED_ORIGINS en Django settings
3. Verificar headers CORS en response

**Solución Django:**
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

### 3. 401 Unauthorized

**Síntomas:**
```json
{"error": "No access token"}
```

**Debug steps:**
1. Verificar que la cookie se esté enviando
2. Comprobar expiración del token
3. Verificar formato del Authorization header

**Debug útil:**
```typescript
// Agregar en cualquier API route
const cookieStore = cookies()
console.log('🍪 All cookies:', cookieStore.getAll())
console.log('🔑 Access token:', cookieStore.get('access-token'))
```

### 4. Roles no cargan

**Síntomas:**
- `/roles-debug` muestra "No se pudieron cargar los roles"
- `userRoles` es `null`

**Debug steps:**
1. Verificar que el usuario esté autenticado
2. Comprobar endpoint `/api/users/me/roles/` en Network tab
3. Verificar respuesta del backend Django

**Debug código:**
```typescript
// En RoleContext.tsx, agregar logging
const loadUserRoles = async () => {
  try {
    console.log('🎭 Starting role load...')
    const roles = await authAPI.getUserRoles()
    console.log('✅ Roles loaded:', roles)
    setUserRoles(roles)
  } catch (error) {
    console.error('❌ Role load failed:', error)
    setUserRoles(null)
  }
}
```

## 📊 Performance Monitoring

### React DevTools Profiler

1. Instalar React DevTools extension
2. Abrir Profiler tab
3. Grabar durante operaciones de login/roles
4. Analizar re-renders innecesarios

### Network Performance

```typescript
// Medir tiempo de respuesta
const measureApiCall = async (url: string) => {
  const start = performance.now()
  
  try {
    const response = await fetch(url)
    const end = performance.now()
    
    console.log(`📊 ${url}: ${end - start}ms`)
    return response
  } catch (error) {
    const end = performance.now()
    console.log(`❌ ${url} failed after ${end - start}ms:`, error)
    throw error
  }
}

// Usar en api.ts
export const authAPI = {
  login: async (credentials) => {
    return measureApiCall('/api/auth/login')
    // ... resto del código
  }
}
```

## 🎯 Best Practices para Debug

### 1. Structured Logging

```typescript
const logger = {
  auth: (message: string, data?: any) => 
    console.log(`🔐 [AUTH] ${message}`, data || ''),
  
  roles: (message: string, data?: any) => 
    console.log(`🎭 [ROLES] ${message}`, data || ''),
    
  api: (message: string, data?: any) => 
    console.log(`📡 [API] ${message}`, data || ''),
    
  error: (message: string, error?: any) => 
    console.error(`❌ [ERROR] ${message}`, error || '')
}

// Uso
logger.auth('Login attempt started', { email })
logger.roles('Role verification', { role: 'admin', result: true })
logger.api('Request to Django', { endpoint: '/auth/me/', status: 200 })
logger.error('Authentication failed', error)
```

### 2. Environment-based Debugging

```typescript
// lib/debug.ts
export const DEBUG = process.env.NODE_ENV === 'development'

export const debugLog = (category: string, message: string, data?: any) => {
  if (!DEBUG) return
  
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${category}: ${message}`, data || '')
}

// Uso
import { debugLog } from '@/lib/debug'

debugLog('AUTH', 'User login attempt', { email })
debugLog('ROLES', 'Roles loaded successfully', userRoles)
```

### 3. Error Context

```typescript
// lib/error-context.ts
export const withErrorContext = (context: string) => {
  return (error: Error) => {
    console.error(`❌ Error in ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
    
    // Opcional: Enviar a servicio de logging
    // sendErrorToService(context, error)
    
    throw error
  }
}

// Uso
try {
  await authAPI.login(credentials)
} catch (error) {
  withErrorContext('Login Process')(error)
}
```

---

Esta guía de debugging proporciona todas las herramientas necesarias para identificar y resolver problemas durante el desarrollo y la integración con Django.