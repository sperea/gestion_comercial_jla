# JL## 🚀 Características

- **🔐 Autenticación JWT Segura**: Cookies HTTP-Only con integración Django
- **🔑 Recuperación de Contraseña**: Sistema completo con tokens seguros y email
- **🎭 Control de Acceso por Roles**: Sistema completo de permisos y verificaciones
- **🔗 Integración Django**: Compatible con backend Django REST Framework + JWT
- **📱 Diseño Responsivo**: Optimizado para móviles y desktop
- **🎨 UI Moderna**: Diseño minimalista con Tailwind CSS y paleta corporativa JLA
- **⚡ Next.js 15.5.4**: App Router con TypeScript y proxy endpoints
- **🔔 Notificaciones Toast**: Sistema rediseñado de feedback visual
- **🛡️ Rutas Protegidas**: Middleware de autenticación y autorización
- **🔧 Herramientas Debug**: Páginas de depuración para desarrollo
- **🌐 Backend Configurable**: URLs configurables via variables de entornores - Sistema de Autenticación Frontend

Aplicación Next.js 15.5.4 completa con autenticación JWT y control de acceso basado en roles, integrada con backend Django. Diseñada con Tailwind CSS y siguiendo las mejores prácticas de seguridad empresarial.

## 🚀 Características

- **🔐 Autenticación JWT Segura**: Cookies HTTP-Only con integración Django
- **🎭 Control de Acceso por Roles**: Sistema completo de permisos y verificaciones
- **🔗 Integración Django**: Compatible con backend Django REST Framework + JWT
- **📱 Diseño Responsivo**: Optimizado para móviles y desktop
- **🎨 UI Moderna**: Diseño minimalista con Tailwind CSS y paleta corporativa JLA
- **⚡ Next.js 15.5.4**: App Router con TypeScript y proxy endpoints
- **🔔 Notificaciones Toast**: Sistema rediseñado de feedback visual
- **🛡️ Rutas Protegidas**: Middleware de autenticación y autorización
- **� Herramientas Debug**: Páginas de depuración para desarrollo
- **🌐 Backend Configurable**: URLs configurables via variables de entorno

## 🛠️ Tecnologías

- **Framework**: Next.js 15.5.4
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: React Context API (AuthContext + RoleContext)
- **Backend**: Django REST Framework con JWT
- **Autenticación**: JWT con cookies HTTP-Only + Bearer tokens
- **Autorización**: Sistema de roles y permisos
- **API**: Proxy endpoints para integración Django
- **Validación**: Validación de formularios y permisos en tiempo real

## 📦 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar backend (opcional)
npm run setup:backend
# O usar configuraciones predefinidas:
npm run config:local     # Para desarrollo local (/api)
npm run config:external  # Para backend externo (puerto 3001)

# 3. Ejecutar en modo desarrollo
npm run dev

# 4. Compilar para producción
npm run build

# 5. Ejecutar en producción
npm start
```

### Comandos de Configuración

```bash
npm run config:show      # Mostrar configuración actual
npm run config:local     # Configurar para desarrollo local (/api)
npm run config:external  # Configurar para backend externo (puerto 3001)
npm run setup:backend    # Asistente de configuración interactivo
```

## 🏗️ Estructura del Proyecto

```
frontend/
├── app/                          # App Router de Next.js
│   ├── api/                     # Rutas de API y proxy endpoints
│   │   ├── auth/               # Endpoints de autenticación (proxy Django)
│   │   │   ├── login/route.ts  # Proxy a Django /api/auth/login/
│   │   │   ├── logout/route.ts # Proxy a Django /api/auth/logout/
│   │   │   ├── me/route.ts     # Proxy a Django /api/auth/me/
│   │   │   └── refresh/route.ts # Proxy a Django /api/auth/refresh/
│   │   ├── users/me/           # Endpoints de usuario
│   │   │   └── roles/route.ts  # Proxy a Django /api/users/me/roles/
│   │   └── debug/              # Endpoints de depuración
│   │       └── me/route.ts     # Debug de información de usuario
│   ├── dashboard/              # Área protegida principal
│   │   ├── layout.tsx         # Layout con protección de rutas
│   │   └── page.tsx           # Dashboard principal
│   ├── debug/                 # Páginas de depuración
│   │   └── page.tsx          # Debug de autenticación
│   ├── roles-debug/           # Debug del sistema de roles
│   │   └── page.tsx          # Verificación de roles y permisos
│   ├── test-login/           # Test de login con Django
│   │   └── page.tsx         # Página de pruebas de login
│   ├── login/page.tsx        # Página de login
│   ├── layout.tsx           # Layout raíz con providers
│   ├── client-layout.tsx    # Layout del cliente con Context Providers
│   ├── page.tsx            # Página principal (redirección)
│   └── globals.css         # Estilos globales de Tailwind
├── components/ui/           # Componentes de UI reutilizables
│   ├── Button.tsx          # Componente de botón
│   ├── Input.tsx           # Componente de input
│   ├── Card.tsx            # Componente de tarjeta
│   └── Toast.tsx           # Sistema de notificaciones rediseñado
├── context/                # Context API para estado global
│   ├── AuthContext.tsx    # Context de autenticación con Django
│   └── RoleContext.tsx    # Context de roles y permisos
├── lib/                   # Utilidades y configuración
│   ├── api.ts            # Cliente API con integración Django
│   ├── config.ts         # Configuración de variables de entorno
│   └── types/           # Definiciones de tipos TypeScript
│       └── roles.ts     # Tipos para sistema de roles
├── scripts/             # Scripts de configuración automatizada
│   ├── setup-backend.js # Configuración interactiva del backend
│   ├── config-local.js  # Configuración para desarrollo local
│   └── config-external.js # Configuración para backend externo
├── docs/               # Documentación técnica
│   ├── debug-django-400.md # Debug de errores 400 con Django
│   └── jwt-endpoints.md    # Documentación de endpoints JWT
├── .github/
│   └── copilot-instructions.md # Instrucciones del proyecto
├── tailwind.config.js     # Configuración de Tailwind
├── tsconfig.json          # Configuración de TypeScript
├── package.json           # Dependencias del proyecto
└── README.md              # Este archivo
```

## 🎨 Paleta de Colores

La aplicación utiliza una paleta corporativa específica:

- **Primario**: `#d2212b` (Rojo corporativo)
- **Grises**: Escala completa de 50 a 900
- **Estados**: Verde para éxito, rojo para errores
- **Modo Oscuro**: Configurado para futuras implementaciones

## 🔐 Sistema de Autenticación

### Integración con Django Backend

El frontend está diseñado para trabajar con un backend Django que implementa JWT authentication:

```python
# Backend Django endpoints esperados:
POST /api/auth/login/     # Login con email/password
POST /api/auth/refresh/   # Refresh del access token  
GET  /api/auth/me/        # Información del usuario actual
GET  /api/users/me/roles/ # Roles y permisos del usuario
```

### Flujo de Autenticación

1. **Login**: Envío de credenciales a Django `/api/auth/login/`
2. **Token Storage**: Almacenamiento seguro en cookies HTTP-Only
3. **Verificación**: Middleware que verifica tokens en cada request
4. **Refresh**: Renovación automática de tokens expirados
5. **Logout**: Eliminación segura de cookies de sesión

### Características de Seguridad

- **Cookies HTTP-Only**: No accesibles desde JavaScript del cliente
- **Bearer Tokens**: Authorization headers para requests autenticados
- **SameSite**: Protección contra ataques CSRF
- **Secure Flag**: Activado automáticamente en producción (HTTPS)
- **Token Refresh**: Renovación automática antes de expiración
- **Proxy Endpoints**: APIs Next.js que actúan como proxy seguro a Django

## 🔑 Sistema de Recuperación de Contraseña

### Flujo Completo

El sistema permite a los usuarios recuperar su contraseña de forma segura mediante tokens únicos:

1. **Solicitud**: Usuario ingresa su email en `/forgot-password`
2. **Validación**: Backend verifica si el email existe
3. **Token**: Se genera un token seguro con expiración de 1 hora
4. **Email**: Se envía email con enlace de recuperación
5. **Validación Token**: Al hacer clic, se valida el token antes de mostrar el formulario
6. **Reset**: Usuario establece nueva contraseña con validación de complejidad
7. **Confirmación**: Contraseña actualizada y token invalidado

### Endpoints Django Requeridos

```python
POST /api/auth/forgot-password/      # Solicitar recuperación
POST /api/auth/validate-reset-token/ # Validar token
POST /api/auth/reset-password/       # Restablecer contraseña
```

### Validaciones de Seguridad

- ✅ Token único generado con `secrets.token_urlsafe(32)`
- ✅ Expiración de 1 hora
- ✅ Un solo uso por token
- ✅ Contraseña mínimo 8 caracteres
- ✅ Debe contener mayúsculas, minúsculas y números
- ✅ No se revela si el email existe (seguridad)

### Uso

```typescript
import { authAPI } from '@/lib/api'

// Solicitar recuperación
const result = await authAPI.forgotPassword('usuario@ejemplo.com')

// Validar token
const validation = await authAPI.validateResetToken(token)

// Restablecer contraseña
const reset = await authAPI.resetPassword(token, 'NuevaPass123', 'NuevaPass123')
```

Ver [documentación completa](./docs/recuperacion-password.md) para detalles de implementación Django.

## 🎭 Sistema de Control de Acceso por Roles

### Funcionalidades

El sistema de roles permite controlar el acceso a diferentes partes de la aplicación basado en los permisos del usuario:

```typescript
import { useRoles } from '@/context/RoleContext'

const MyComponent = () => {
  const { hasRole, hasAnyRole, isAdmin, isSuperuser } = useRoles()
  
  // Verificar rol específico
  if (!hasRole('admin')) {
    return <div>Acceso denegado</div>
  }
  
  // Verificar múltiples roles
  if (hasAnyRole(['admin', 'moderator'])) {
    return <AdminTools />
  }
  
  // Verificaciones especiales
  if (isAdmin()) {
    return <SuperAdminPanel />
  }
  
  return <RegularContent />
}
```

### Funciones de Verificación

| Función | Descripción | Ejemplo |
|---------|-------------|---------|
| `hasRole(roleName)` | Verifica si el usuario tiene un rol específico | `hasRole('admin')` |
| `hasAnyRole(roleNames[])` | Verifica si tiene alguno de los roles | `hasAnyRole(['admin', 'moderator'])` |
| `isAdmin()` | Verifica si es administrador | `isAdmin()` |
| `isSuperuser()` | Verifica si es superusuario | `isSuperuser()` |

### Estructura de Datos de Roles

```typescript
interface Role {
  id: number
  nombre: string
  display_name: string
  descripcion: string
  permisos: string[]
}

interface UserRoles {
  roles: Role[]
  is_superuser: boolean
  user_permissions: string[]
}
```

### Integración con Django

El sistema obtiene los roles llamando a `GET /api/users/me/roles/` que debe retornar:

```json
{
  "roles": [
    {
      "id": 1,
      "nombre": "admin",
      "display_name": "Administrador", 
      "descripcion": "Acceso completo al sistema",
      "permisos": ["users.view", "users.create", "users.edit"]
    }
  ],
  "is_superuser": false,
  "user_permissions": []
}
```

## 📱 Diseño Responsivo

La aplicación está optimizada para:

- **Móviles**: < 640px - Diseño vertical, botones táctiles grandes
- **Tablets**: 640px - 1024px - Layout adaptativo
- **Desktop**: > 1024px - Aprovechamiento completo del espacio

## 🔔 Sistema de Notificaciones

Tipos de notificaciones toast:

- **Success** (verde): Operaciones exitosas
- **Error** (rojo): Errores y validaciones
- **Loading** (gris): Operaciones en progreso

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en puerto 3000

# Producción
npm run build        # Compilar para producción
npm start           # Ejecutar versión compilada

# Calidad de código
npm run lint        # Verificar código con ESLint
npm run type-check  # Verificar tipos de TypeScript
```

## 🌐 Variables de Entorno

### Configuración Django Backend

Para conectar con tu backend Django, configura la URL del API:

#### Desarrollo Local (Django en puerto 8000)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### Desarrollo Docker
```env  
NEXT_PUBLIC_API_URL=http://django:8000/api
```

#### Producción
```env
NEXT_PUBLIC_API_URL=https://api.tuempresa.com/api
```

### Scripts de Configuración Automatizada

```bash
# Configuración interactiva
npm run setup:backend

# Configuraciones predefinidas
npm run config:local     # http://localhost:8000/api
npm run config:external  # Permite ingresar URL personalizada
npm run config:show      # Muestra configuración actual
```

### Variables Disponibles

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend Django | `http://localhost:8000/api` |

> **Nota:** Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente.

## 🐛 Herramientas de Debug y Desarrollo

### Páginas de Depuración

El proyecto incluye páginas especializadas para debugging:

| URL | Descripción | Funcionalidad |
|-----|-------------|---------------|
| `/debug` | Debug general | Información de autenticación y tokens |
| `/test-login` | Test de login | Pruebas específicas con backend Django |
| `/roles-debug` | Debug de roles | Verificación del sistema de permisos |

### Debug de Autenticación (`/debug`)

- Información del usuario actual
- Estado de cookies (access-token, refresh-token)
- Respuestas del backend Django
- Errores de conexión y autenticación

### Debug de Roles (`/roles-debug`)

- Lista completa de roles del usuario
- Verificación de funciones `hasRole()`, `hasAnyRole()`
- Estado de `isAdmin()` e `isSuperuser()`
- Ejemplos de implementación

### Test de Login (`/test-login`)

- Pruebas específicas de integración Django
- Debugging de respuestas de autenticación
- Verificación de estructura de tokens JWT

## 🔧 Personalización

### Colores Corporativos

Editar `tailwind.config.js` para cambiar la paleta:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#tu-color-primario',
        // ... más tonos
      }
    }
  }
}
```

### API Backend

Para conectar con un backend real, configurar la variable de entorno:

**Opción 1: Archivo .env.local**
```env
NEXT_PUBLIC_API_URL=https://tu-api.com
```

**Opción 2: Variables del sistema (producción)**
```bash
export NEXT_PUBLIC_API_URL=https://api.tuempresa.com
```

**Estructura esperada del backend:**
- `POST /auth/login` - Autenticación
- `POST /auth/logout` - Cerrar sesión  
- `GET /auth/me` - Usuario actual
- `POST /auth/forgot-password` - Solicitar reset
- `POST /auth/reset-password` - Confirmar reset

### Rutas Protegidas

Agregar nuevas rutas protegidas creando layouts similares a `app/dashboard/layout.tsx`.

## 🐛 Solución de Problemas

### Error de Cookies

Si las cookies no funcionan en desarrollo:

1. Verificar que `credentials: 'include'` esté presente en las requests
2. Asegurar que el servidor responda con headers CORS apropiados
3. Verificar la configuración de cookies en las rutas API

### Errores de TypeScript

Asegurar que todas las dependencias de tipos están instaladas:

```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

### Problemas de Tailwind

Si los estilos no se aplican:

1. Verificar que PostCSS está configurado correctamente
2. Asegurar que los paths en `tailwind.config.js` son correctos
3. Verificar que `globals.css` tiene las directivas de Tailwind

## 📚 Documentación Completa

### Guías Técnicas

- **[Sistema de Roles](./docs/sistema-roles.md)** - Control de acceso basado en roles (RBAC)
- **[Integración Django](./docs/integracion-django.md)** - Configuración completa del backend Django
- **[Recuperación de Contraseña](./docs/recuperacion-password.md)** - Sistema completo de password reset
- **[Herramientas de Debug](./docs/debugging.md)** - Guía de debugging y desarrollo
- **[Endpoints JWT](./docs/jwt-endpoints.md)** - Documentación de endpoints de autenticación
- **[Debug Django 400](./docs/debug-django-400.md)** - Resolución de errores específicos

### Páginas de Debug

| URL | Propósito |
|-----|-----------|
| `/debug` | Estado general de autenticación |
| `/test-login` | Pruebas de login con Django |
| `/roles-debug` | Verificación del sistema de roles |

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Compilación para producción

# Configuración Backend  
npm run setup:backend   # Asistente interactivo
npm run config:local    # Django localhost:8000
npm run config:external # Backend personalizado
npm run config:show     # Mostrar configuración actual

# Calidad de código
npm run lint           # ESLint
npm run type-check     # Verificación TypeScript
```

## 🎯 Estado Actual del Proyecto

### ✅ Completado

- [x] **Sistema de Autenticación JWT** con cookies HTTP-Only
- [x] **Integración Django Backend** con proxy endpoints
- [x] **Control de Acceso por Roles** (RBAC) completo
- [x] **Sistema de Notificaciones Toast** rediseñado
- [x] **Herramientas de Debug** para desarrollo
- [x] **Configuración Automatizada** del backend
- [x] **Documentación Completa** técnica y de usuario
- [x] **UI Corporativa JLA** con Tailwind CSS
- [x] **TypeScript** completo con tipos definidos

### 🚀 Próximos Pasos

- [ ] Tests unitarios y de integración
- [ ] Middleware de refresh automático de tokens
- [ ] Implementación de modo oscuro
- [ ] Internacionalización (i18n)
- [ ] PWA con Service Workers
- [ ] Analytics y monitoreo
- [ ] CI/CD pipeline

## 👥 Contribución

Este proyecto sigue las mejores prácticas de desarrollo:

1. **Commits Convencionales**: `feat:`, `fix:`, `docs:`, etc.
2. **Código Limpio**: Principios SOLID aplicados
3. **Documentación**: Guías completas para cada funcionalidad
4. **Responsividad**: Mobile-first approach
5. **Seguridad**: JWT + cookies HTTP-Only + CORS configurado
6. **Debugging**: Herramientas integradas para desarrollo

## 📄 Licencia

Proyecto de demostración para implementación de sistemas de autenticación empresarial.

---

**Desarrollado con ❤️ usando Next.js, TypeScript y Tailwind CSS**