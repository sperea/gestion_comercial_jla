# 🧪 Tests - JLA Colaboradores Frontend

Esta carpeta contiene todos los tests del proyecto, organizados por categorías para facilitar su gestión y ejecución.

## 📁 Estructura de Tests

```
tests/
├── README.md                    # Este archivo
├── python/                     # Tests en Python para APIs
│   ├── test_auth.py            # Tests de autenticación y login
│   └── test_profile_form.py    # Tests del formulario de perfil
├── cookies/                    # Archivos de cookies para testing
│   ├── cookies_test.txt        # Cookies de test automatizado
│   ├── cookies.txt             # Cookies manuales de desarrollo  
│   └── cookies_manual.txt      # Cookies manuales adicionales
├── integration/                # Tests de integración (futuro)
└── unit/                      # Tests unitarios (futuro)
```

## 🐍 Tests Python

Los tests Python están diseñados para probar las APIs del backend desde el frontend.

### test_auth.py
Prueba el flujo completo de autenticación:
- Login con credenciales
- Obtención de perfil del usuario
- Actualización de información del perfil
- Verificación de persistencia de datos

**Uso:**
```bash
cd tests/python
python test_auth.py
```

### test_profile_form.py
Simula el flujo exacto del formulario de perfil en el navegador:
- Login y obtención de token
- Carga inicial del perfil
- Simulación de cambio en formulario
- Actualización via PUT
- Verificación inmediata
- Tests de múltiples actualizaciones

**Uso:**
```bash
cd tests/python
python test_profile_form.py
```

## 🍪 Archivos de Cookies

Contienen cookies de sesión para testing manual y automatizado:

- **cookies_test.txt**: Cookies generadas por tests automáticos
- **cookies.txt**: Cookies de desarrollo manual
- **cookies_manual.txt**: Cookies adicionales para casos específicos

**Formato**: Compatible con Netscape HTTP Cookie File (curl/wget)

## 🚀 Ejecutar Tests

### Prerrequisitos
```bash
# Instalar dependencias Python
pip install requests

# Asegurarse de que el servidor de desarrollo esté corriendo
npm run dev
```

### Ejecutar todos los tests Python
```bash
cd tests/python
python test_auth.py
python test_profile_form.py
```

### Variables de entorno
Los tests usan por defecto:
- **FRONTEND_URL**: `http://localhost:3000`
- **Credenciales**: `sperea@jlaasociados.es` / `jla`

## 📋 Tipos de Tests

### ✅ Implementados
- **Autenticación**: Login, logout, gestión de tokens
- **Perfil de usuario**: CRUD de información personal
- **Cookies**: Gestión de sesiones HTTP-Only

### 🔄 Planificados
- **Tests unitarios**: Componentes React individuales
- **Tests de integración**: Flujos completos E2E
- **Tests de API**: Cobertura completa de endpoints
- **Tests de UI**: Selenium/Playwright para navegador
- **Tests de rendimiento**: Carga y stress testing

## 🔧 Configuración

### Personalizar URLs
Editar en cada archivo de test:
```python
FRONTEND_URL = "http://localhost:3000"  # Cambiar si es necesario
```

### Credenciales de Test
Para usar credenciales diferentes, modificar:
```python
login_data = {
    "email": "tu_email@ejemplo.com",
    "password": "tu_password"
}
```

## 📊 Resultados Esperados

### Tests Exitosos
- ✅ Status 200 en todas las requests
- ✅ Tokens JWT válidos en cookies
- ✅ Datos persistidos correctamente
- ✅ Respuestas JSON bien formateadas

### Indicadores de Problemas
- ❌ Status 401/403: Problemas de autenticación
- ❌ Status 400: Datos malformados
- ❌ Status 500: Errores del servidor
- ❌ Timeouts: Problemas de conectividad

## 🐛 Debugging

### Logs detallados
Los tests muestran información detallada:
- Estados HTTP de cada request
- Contenido de cookies recibidas
- Datos de perfil antes/después
- Mensajes de error específicos

### Troubleshooting común
1. **Error de conexión**: Verificar que `npm run dev` esté corriendo
2. **Error 401**: Credenciales incorrectas o tokens expirados
3. **Error 500**: Revisar logs del servidor backend
4. **Tests inconsistentes**: Verificar estado del backend

## 📝 Agregar Nuevos Tests

### Test Python nuevo
1. Crear archivo en `tests/python/test_nuevo.py`
2. Seguir el patrón de los tests existentes
3. Documentar en este README

### Test de otro tipo
1. Crear subcarpeta apropiada (ej: `tests/e2e/`)
2. Agregar documentación específica
3. Actualizar la estructura en este archivo

---

**Mantenido por**: Equipo JLA Colaboradores  
**Última actualización**: $(date +'%Y-%m-%d')