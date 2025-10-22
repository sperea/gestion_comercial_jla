# 🐍 Tests Python - APIs y Backend

Esta carpeta contiene tests Python para probar las APIs del backend y la integración con el frontend.

## 📋 Tests Disponibles

### test_auth.py
**Propósito**: Prueba el flujo completo de autenticación  
**Funcionalidades**:
- Login con credenciales válidas
- Extracción y uso de tokens JWT
- Obtención de perfil de usuario
- Actualización de información de perfil
- Verificación de persistencia de datos

**Ejecutar**:
```bash
python test_auth.py
```

### test_profile_form.py
**Propósito**: Simula exactamente el flujo del formulario de perfil  
**Funcionalidades**:
- Flujo completo de login
- Carga inicial del perfil
- Simulación de cambios en formulario
- Actualización via PUT request
- Verificación inmediata de cambios
- Tests de múltiples actualizaciones seguidas

**Ejecutar**:
```bash
python test_profile_form.py
```

## 🔧 Configuración

### Dependencias
```bash
pip install requests
```

### Variables
- **FRONTEND_URL**: `http://localhost:3000`
- **Credenciales de test**: `sperea@jlaasociados.es` / `jla`

## 📊 Salida Esperada

### Éxito ✅
```
🔐 Haciendo login...
Login status: 200
✅ Login exitoso
📄 Obteniendo perfil...
✅ Perfil obtenido exitosamente
✏️ Actualizando perfil...
✅ Perfil actualizado exitosamente
```

### Error ❌
```
❌ Error en login: {"detail": "Invalid credentials"}
```

## 🚀 Próximos Tests

- Tests de recuperación de contraseña
- Tests del sistema de roles
- Tests de upload de imágenes
- Tests de validación de formularios
- Tests de logout y limpieza de sesión