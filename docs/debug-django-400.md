# 🔧 Debugging Backend Django - Error 400

## 📊 Análisis del Error

El backend Django está devolviendo un **Bad Request (400)** al intentar hacer login. Esto indica que hay un problema con la estructura de los datos o validación.

## 🔍 Posibles Causas del Error 400

### 1. **CORS (Cross-Origin Resource Sharing)**
```bash
# En el backend Django, verificar settings.py:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

CORS_ALLOW_CREDENTIALS = True
```

### 2. **CSRF Token**
Django requiere token CSRF por defecto. Opciones:
```python
# Opción 1: Deshabilitar CSRF para API (recomendado para JWT)
from django.views.decorators.csrf import csrf_exempt

# Opción 2: Configurar CSRF correctamente
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
```

### 3. **Estructura de Datos**
El backend Django podría esperar campos diferentes:
```python
# Posibles estructuras que Django podría esperar:
{
    "username": "sperea@jlaasociados.es",  # En lugar de "email"
    "password": "password"
}

# O con validadores específicos:
{
    "email": "sperea@jlaasociados.es",
    "password": "password",
    "grant_type": "password"  # Si usa OAuth2
}
```

### 4. **Configuración de Django REST Framework**
```python
# En settings.py verificar:
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# URLs correctas en urls.py:
urlpatterns = [
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', RefreshView.as_view(), name='refresh'),
]
```

### 5. **Configuración JWT**
Si usa django-rest-framework-simplejwt:
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## 🧪 Debugging Steps

### Paso 1: Probar con página de debug
1. Ir a: `http://localhost:3001/debug`
2. Usar email: `sperea@jlaasociados.es`
3. Probar diferentes contraseñas
4. Revisar la respuesta completa del backend

### Paso 2: Verificar logs del backend
```bash
# En el terminal del backend Docker:
docker logs -f [container-name] | grep -E "(ERROR|WARNING|400)"
```

### Paso 3: Probar con cURL directo
```bash
# Probar directamente al backend:
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "sperea@jlaasociados.es", "password": "tu_password"}' \
  -v

# Alternativa con username:
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "sperea@jlaasociados.es", "password": "tu_password"}' \
  -v
```

## 🔧 Soluciones Probables

### Solución 1: Actualizar campo email → username
```typescript
// En lib/api.ts, cambiar:
const loginData = {
  username: credentials.email, // Cambiar de 'email' a 'username'
  password: credentials.password
}
```

### Solución 2: Agregar headers adicionales
```typescript
// Agregar headers CSRF o Accept específicos
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
}
```

### Solución 3: Configurar CORS en Django
```python
# pip install django-cors-headers
# Agregar a INSTALLED_APPS:
'corsheaders',

# Agregar a MIDDLEWARE:
'corsheaders.middleware.CorsMiddleware',
'django.middleware.common.CommonMiddleware',

# Configurar CORS:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
CORS_ALLOW_CREDENTIALS = True
```

## 📋 Checklist de Verificación

- [ ] Backend Django corriendo en puerto 8000
- [ ] CORS configurado correctamente
- [ ] URLs de Django configuradas (`/api/auth/login/`)
- [ ] Serializers de Django configurados
- [ ] Usuario existe en base de datos Django
- [ ] Contraseña correcta
- [ ] Campo correcto (email vs username)
- [ ] Headers Content-Type correctos
- [ ] CSRF deshabilitado o configurado

## 🚀 Próximos Pasos

1. **Usar página debug**: `http://localhost:3001/debug`
2. **Revisar respuesta completa** del backend
3. **Ajustar estructura de datos** según respuesta
4. **Configurar CORS** en Django si es necesario
5. **Verificar usuarios y contraseñas** en Django admin

El archivo de debug te mostrará exactamente qué está enviando el frontend y qué está respondiendo el backend, lo que nos permitirá identificar el problema específico.