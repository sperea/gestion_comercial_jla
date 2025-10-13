# 🎭 Sistema de Control de Acceso por Roles (RBAC)

## Introducción

El sistema de control de acceso basado en roles permite gestionar permisos de usuarios de forma granular, integrándose completamente con un backend Django que maneja la lógica de roles y permisos.

## 🏗️ Arquitectura del Sistema

### Frontend Components

```
RoleContext.tsx          # Context Provider de roles
├── useRoles()          # Hook para acceder a funciones de roles
├── hasRole()           # Verificar rol específico
├── hasAnyRole()        # Verificar múltiples roles
├── isAdmin()           # Verificación de administrador
└── isSuperuser()       # Verificación de superusuario
```

### Backend Integration

```
Django Backend
├── GET /api/users/me/roles/    # Obtener roles del usuario
├── User Model with roles       # Modelo de usuario con roles
├── Role Model                  # Modelo de roles
└── Permission System           # Sistema de permisos Django
```

## 📋 Implementación

### 1. Tipos TypeScript

```typescript
// lib/types/roles.ts
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

### 2. Context Provider

```typescript
// context/RoleContext.tsx
export const RoleProvider = ({ children }) => {
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null)
  
  const hasRole = (roleName: string): boolean => {
    return userRoles?.roles?.some(role => role.nombre === roleName) || false
  }
  
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName))
  }
  
  const isAdmin = (): boolean => {
    return hasRole('admin') || userRoles?.is_superuser || false
  }
  
  const isSuperuser = (): boolean => {
    return userRoles?.is_superuser || false
  }
  
  return (
    <RoleContext.Provider value={{
      userRoles, hasRole, hasAnyRole, isAdmin, isSuperuser
    }}>
      {children}
    </RoleContext.Provider>
  )
}
```

### 3. API Integration

```typescript
// lib/api.ts
export const authAPI = {
  getUserRoles: async (): Promise<UserRoles> => {
    const response = await fetchWithCredentials('/api/users/me/roles/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch user roles')
    }
    
    const data = await response.json()
    
    // Adaptar respuesta Django al formato frontend
    return {
      roles: data.roles || [],
      is_superuser: data.is_superuser || false,
      user_permissions: data.user_permissions || []
    }
  }
}
```

### 4. Proxy Endpoint

```typescript
// app/api/users/me/roles/route.ts
export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('access-token')
    
    if (!accessToken) {
      return Response.json({ error: 'No access token' }, { status: 401 })
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/roles/`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`)
    }
    
    const data = await response.json()
    return Response.json(data)
    
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 🎯 Uso en Componentes

### Verificación de Roles

```typescript
import { useRoles } from '@/context/RoleContext'

const AdminPanel = () => {
  const { hasRole, isAdmin } = useRoles()
  
  if (!isAdmin()) {
    return <div>Acceso denegado</div>
  }
  
  return (
    <div>
      <h1>Panel de Administración</h1>
      {hasRole('admin') && <AdminTools />}
      {hasRole('moderator') && <ModerationPanel />}
    </div>
  )
}
```

### Protección de Rutas

```typescript
// app/admin/layout.tsx
import { useRoles } from '@/context/RoleContext'
import { redirect } from 'next/navigation'

export default function AdminLayout({ children }) {
  const { isAdmin } = useRoles()
  
  if (!isAdmin()) {
    redirect('/unauthorized')
  }
  
  return <div>{children}</div>
}
```

### Renderizado Condicional

```typescript
const UserInterface = () => {
  const { hasRole, hasAnyRole } = useRoles()
  
  return (
    <div>
      {/* Siempre visible */}
      <UserProfile />
      
      {/* Solo para admins */}
      {hasRole('admin') && <AdminSettings />}
      
      {/* Para admins o moderadores */}
      {hasAnyRole(['admin', 'moderator']) && <ModerationTools />}
      
      {/* Solo para usuarios específicos */}
      {hasRole('editor') && <EditingInterface />}
    </div>
  )
}
```

## 🔧 Configuración del Backend Django

### Modelo de Roles Esperado

```python
# models.py
class Role(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    permisos = models.JSONField(default=list)
    
class User(AbstractUser):
    roles = models.ManyToManyField(Role, blank=True)
```

### Vista del API

```python
# views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class UserRolesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        roles_data = []
        for role in user.roles.all():
            roles_data.append({
                'id': role.id,
                'nombre': role.nombre,
                'display_name': role.display_name,
                'descripcion': role.descripcion,
                'permisos': role.permisos
            })
        
        return Response({
            'roles': roles_data,
            'is_superuser': user.is_superuser,
            'user_permissions': list(user.get_user_permissions())
        })
```

### URL Configuration

```python
# urls.py
from django.urls import path
from .views import UserRolesView

urlpatterns = [
    path('api/users/me/roles/', UserRolesView.as_view(), name='user-roles'),
    # ... otras rutas
]
```

## 🧪 Testing y Debug

### Página de Debug (`/roles-debug`)

La aplicación incluye una página completa de debugging que muestra:

- **Información del Usuario**: Datos completos del usuario autenticado
- **Lista de Roles**: Todos los roles asignados al usuario actual  
- **Verificaciones en Tiempo Real**: 
  - `hasRole('admin')`, `hasRole('user')`, `hasRole('moderator')`
  - `hasAnyRole(['admin', 'moderator'])`, `hasAnyRole(['user', 'guest'])`
  - `isAdmin()`, `isSuperuser()`
- **Ejemplos de Código**: Implementaciones prácticas del sistema

### Testing Manual

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir página de debug
http://localhost:3000/roles-debug

# Verificar en consola del navegador
console.log('User roles:', userRoles)
```

## 🚀 Casos de Uso Comunes

### 1. Panel de Administración

```typescript
const AdminDashboard = () => {
  const { isAdmin, hasRole } = useRoles()
  
  if (!isAdmin()) return <UnauthorizedPage />
  
  return (
    <div className="admin-dashboard">
      <AdminNavigation />
      {hasRole('super_admin') && <SystemSettings />}
      {hasRole('user_admin') && <UserManagement />}
      {hasRole('content_admin') && <ContentManagement />}
    </div>
  )
}
```

### 2. Menú de Navegación Dinámico

```typescript
const Navigation = () => {
  const { hasRole, hasAnyRole } = useRoles()
  
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      {hasAnyRole(['admin', 'moderator']) && (
        <Link href="/moderation">Moderación</Link>
      )}
      
      {hasRole('admin') && (
        <Link href="/admin">Administración</Link>
      )}
      
      {hasRole('editor') && (
        <Link href="/editor">Editor</Link>
      )}
    </nav>
  )
}
```

### 3. Botones de Acción Condicionales

```typescript
const UserCard = ({ user }) => {
  const { hasRole, isAdmin } = useRoles()
  
  return (
    <div className="user-card">
      <UserInfo user={user} />
      
      <div className="actions">
        {hasRole('editor') && (
          <EditButton userId={user.id} />
        )}
        
        {hasRole('moderator') && (
          <ModerateButton userId={user.id} />
        )}
        
        {isAdmin() && (
          <DeleteButton userId={user.id} />
        )}
      </div>
    </div>
  )
}
```

## 📊 Mejores Prácticas

### 1. Nomenclatura de Roles

```typescript
// ✅ Bueno: Nombres descriptivos
const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  EDITOR: 'editor',
  USER: 'user'
} as const

// ❌ Evitar: Nombres genéricos
hasRole('role1') // ¿Qué hace role1?
```

### 2. Verificaciones Múltiples

```typescript
// ✅ Bueno: Usar hasAnyRole para verificaciones múltiples
if (hasAnyRole(['admin', 'moderator', 'editor'])) {
  showAdvancedFeatures()
}

// ❌ Evitar: Verificaciones individuales repetidas
if (hasRole('admin') || hasRole('moderator') || hasRole('editor')) {
  showAdvancedFeatures()
}
```

### 3. Componentes de Protección

```typescript
// ✅ Bueno: Crear componentes wrapper para permisos
const ProtectedComponent = ({ 
  requiredRoles, 
  fallback, 
  children 
}: {
  requiredRoles: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}) => {
  const { hasAnyRole } = useRoles()
  
  if (!hasAnyRole(requiredRoles)) {
    return fallback || <div>Sin permisos</div>
  }
  
  return <>{children}</>
}

// Uso
<ProtectedComponent requiredRoles={['admin', 'moderator']}>
  <AdminPanel />
</ProtectedComponent>
```

### 4. Loading States

```typescript
const MyComponent = () => {
  const { userRoles, hasRole } = useRoles()
  
  // ✅ Bueno: Manejar estado de carga
  if (!userRoles) {
    return <LoadingSpinner />
  }
  
  return (
    <div>
      {hasRole('admin') && <AdminContent />}
    </div>
  )
}
```

## 🔧 Extensiones y Personalizaciones

### 1. Permisos Granulares

```typescript
const hasPermission = (permission: string): boolean => {
  return userRoles?.user_permissions?.includes(permission) || false
}

// Uso
if (hasPermission('users.create')) {
  showCreateUserButton()
}
```

### 2. Roles Temporales

```typescript
const hasTemporaryRole = (roleName: string): boolean => {
  const role = userRoles?.roles?.find(r => r.nombre === roleName)
  return role && !role.expired
}
```

### 3. Jerarquía de Roles

```typescript
const ROLE_HIERARCHY = {
  'super_admin': 5,
  'admin': 4, 
  'moderator': 3,
  'editor': 2,
  'user': 1
}

const hasMinimumRole = (minimumRole: string): boolean => {
  const userLevel = Math.max(...userRoles?.roles?.map(r => 
    ROLE_HIERARCHY[r.nombre] || 0
  ) || [0])
  
  return userLevel >= (ROLE_HIERARCHY[minimumRole] || 0)
}
```

## 📝 Troubleshooting

### Problemas Comunes

1. **Roles no se cargan**
   - Verificar que el backend esté corriendo
   - Comprobar la URL del API en variables de entorno
   - Revisar que el usuario esté autenticado

2. **Verificaciones siempre retornan false**
   - Asegurar que `RoleProvider` envuelve la aplicación
   - Verificar la estructura de datos del backend
   - Revisar nombres de roles (case-sensitive)

3. **Roles no se actualizan**
   - Los roles se cargan al hacer login
   - Para forzar actualización, hacer logout/login
   - Considerar implementar refresh de roles

### Debug Útil

```typescript
// En cualquier componente
const { userRoles } = useRoles()
console.log('Current user roles:', userRoles)
console.log('Has admin role:', hasRole('admin'))
```

---

Este sistema de roles proporciona una base sólida y extensible para el control de acceso en aplicaciones Next.js con backends Django.