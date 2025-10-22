# 🍪 Cookies de Test

Esta carpeta contiene archivos de cookies para testing manual y automatizado del sistema de autenticación.

## 📁 Archivos

### cookies_test.txt
**Propósito**: Cookies generadas por tests automatizados  
**Formato**: Netscape HTTP Cookie File  
**Uso**: Tests automáticos de Python

### cookies.txt
**Propósito**: Cookies de desarrollo manual  
**Uso**: Testing manual con curl/wget

### cookies_manual.txt
**Propósito**: Cookies adicionales para casos específicos  
**Uso**: Debugging y casos edge

## 🔧 Uso con curl

```bash
# Usar cookies guardadas
curl -b tests/cookies/cookies.txt http://localhost:3000/api/auth/me

# Guardar cookies de una sesión
curl -c tests/cookies/new_session.txt \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}' \
     http://localhost:3000/api/auth/login
```

## 🔐 Formato de Cookies

```
#HttpOnly_localhost FALSE / FALSE 1760975253 access-token [JWT_TOKEN]
#HttpOnly_localhost FALSE / FALSE 1761578253 refresh-token [JWT_TOKEN]
```

## ⚠️ Seguridad

- **NO** commitear cookies con tokens reales a producción
- Usar solo cookies de desarrollo/testing
- Regenerar cookies si se exponen accidentalmente