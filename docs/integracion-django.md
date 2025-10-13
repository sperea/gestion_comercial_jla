# 🐍 Integración Django Backend

## Introducción

Este frontend Next.js está diseñado específicamente para integrarse con un backend Django que implementa Django REST Framework (DRF) con autenticación JWT. La comunicación se realiza a través de proxy endpoints que manejan de forma segura los tokens y cookies.

## 🔗 Arquitectura de Integración

```
Frontend Next.js          Django Backend
├── Login Form       →    POST /api/auth/login/
├── Proxy Endpoints  →    Django REST API
├── JWT Cookies      ←    JWT Access/Refresh Tokens
└── Role System      ←    GET /api/users/me/roles/
```

## 📡 Endpoints Django Requeridos

### Autenticación

| Endpoint | Método | Propósito | Request | Response |
|----------|--------|-----------|---------|----------|
| `/api/auth/login/` | POST | Login de usuario | `{email, password}` | `{access, refresh, user}` |
| `/api/auth/refresh/` | POST | Refresh token | `{refresh}` | `{access}` |
| `/api/auth/me/` | GET | Info del usuario | Header: `Authorization: Bearer <token>` | `{user_data}` |
| `/api/users/me/roles/` | GET | Roles del usuario | Header: `Authorization: Bearer <token>` | `{roles, is_superuser}` |

### Configuración Django

#### 1. Instalación de Dependencias

```bash
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
```

#### 2. Settings.py

```python
# settings.py
import os
from datetime import timedelta

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Tu app
    'tu_app',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS Settings para desarrollo
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev server
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Para producción, ser más específico:
# CORS_ALLOWED_ORIGINS = [
#     "https://tu-frontend.com",
# ]
```

#### 3. URLs

```python
# urls.py (principal)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tu_app.urls')),
]

# tu_app/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Autenticación
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.CurrentUserView.as_view(), name='current_user'),
    
    # Roles
    path('users/me/roles/', views.UserRolesView.as_view(), name='user_roles'),
]
```

#### 4. Modelos

```python
# models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class Role(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    display_name = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    permisos = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return self.display_name

class User(AbstractUser):
    email = models.EmailField(unique=True)
    roles = models.ManyToManyField(Role, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email

# Importante: Agregar en settings.py
AUTH_USER_MODEL = 'tu_app.User'
```

#### 5. Vistas

```python
# views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, RoleSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email y contraseña son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=email, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

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

#### 6. Serializers

```python
# serializers.py
from rest_framework import serializers
from .models import User, Role

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'nombre', 'display_name', 'descripcion', 'permisos']
```

## 🔧 Configuración Frontend

### Proxy Endpoints Next.js

El frontend incluye endpoints que actúan como proxy hacia Django:

#### 1. Login Proxy

```typescript
// app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return Response.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    
    // Establecer cookies HTTP-Only
    const cookieStore = cookies()
    cookieStore.set('access-token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hora
    })
    
    cookieStore.set('refresh-token', data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    })
    
    // Adaptar respuesta para el frontend
    return Response.json({
      success: true,
      data: {
        user: data.user,
        tokens: {
          access: data.access,
          refresh: data.refresh
        }
      }
    })
    
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### 2. User Info Proxy

```typescript
// app/api/auth/me/route.ts
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('access-token')
    
    if (!accessToken) {
      return Response.json({ error: 'No access token' }, { status: 401 })
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`)
    }
    
    const userData = await response.json()
    return Response.json(userData)
    
  } catch (error) {
    return Response.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}
```

#### 3. Roles Proxy

```typescript
// app/api/users/me/roles/route.ts
import { cookies } from 'next/headers'

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

## 🧪 Testing de la Integración

### 1. Test Manual con cURL

```bash
# Test de login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# Test de usuario actual (con token)
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer <access_token>"

# Test de roles
curl -X GET http://localhost:8000/api/users/me/roles/ \
  -H "Authorization: Bearer <access_token>"
```

### 2. Test desde Frontend

El proyecto incluye páginas de debug:

- `/debug` - Debug general de autenticación
- `/test-login` - Test específico de login Django
- `/roles-debug` - Debug del sistema de roles

### 3. Debug en Django

```python
# En tus vistas Django
import logging
logger = logging.getLogger(__name__)

class LoginView(APIView):
    def post(self, request):
        logger.info(f"Login attempt for: {request.data.get('email')}")
        # ... resto del código
```

## 🔐 Consideraciones de Seguridad

### 1. CORS Configuration

```python
# settings.py - Producción
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio.com",  # Solo tu frontend
]

CORS_ALLOW_CREDENTIALS = True

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding', 
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### 2. JWT Security

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Corto para seguridad
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),     # Razonable para UX
    'ROTATE_REFRESH_TOKENS': True,                   # Rotación automática
    'BLACKLIST_AFTER_ROTATION': True,               # Invalidar tokens viejos
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 3. Rate Limiting

```python
# Opcional: Django-ratelimit
from django_ratelimit.decorators import ratelimit

class LoginView(APIView):
    @ratelimit(key='ip', rate='5/m', method='POST')
    def post(self, request):
        # ... código de login
```

## 🚀 Deployment

### 1. Variables de Entorno

```bash
# Django
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=tu-secret-key-super-segura
DEBUG=False
ALLOWED_HOSTS=api.tudominio.com

# Next.js  
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  django:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname
    depends_on:
      - db
      
  frontend:
    build: ./frontend  
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://django:8000/api
    depends_on:
      - django
      
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: dbname
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
```

## 🐛 Troubleshooting

### Errores Comunes

#### 1. CORS Error
```
Access to fetch at 'http://localhost:8000/api/auth/login/' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solución:** Verificar `CORS_ALLOWED_ORIGINS` en Django settings.py

#### 2. 401 Unauthorized
```json
{"error": "No access token"}
```

**Solución:** Verificar que las cookies se están estableciendo correctamente

#### 3. 400 Bad Request en Login

**Solución:** Verificar estructura de datos enviada y esperada

### Debug Utils

```python
# Django - Ver headers recibidos
class LoginView(APIView):
    def post(self, request):
        print("Headers:", request.headers)
        print("Data:", request.data) 
        # ... resto del código
```

```typescript
// Next.js - Debug de cookies
// app/api/debug/cookies/route.ts
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  
  return Response.json({
    cookies: allCookies,
    timestamp: new Date().toISOString()
  })
}
```

---

Esta integración proporciona una base sólida y segura para conectar Next.js con Django, manteniendo las mejores prácticas de seguridad y una experiencia de usuario fluida.