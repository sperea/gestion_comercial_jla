# 📋 Conventional Commits - Frontend JLA Colaboradores

Este proyecto utiliza **Conventional Commits** para automatizar el versionado semántico y la generación de releases.

## 🎯 Formato de Commits

### Estructura Básica
```
<tipo>(<área>): <descripción>

[cuerpo opcional]

[pie opcional]
```

### 📌 Componentes

- **tipo**: Categoría del cambio (obligatorio)
- **área**: Contexto del cambio (opcional pero recomendado)
- **descripción**: Descripción breve en imperativo (obligatorio)
- **cuerpo**: Descripción detallada (opcional)
- **pie**: Información adicional como breaking changes (opcional)

## 🏷️ Tipos de Commit

### 🚀 Cambios que afectan la versión

| Tipo | Versión | Descripción | Ejemplo |
|------|---------|-------------|---------|
| `feat` | **MINOR** | Nueva funcionalidad | `feat(auth): agregar autenticación con Google` |
| `fix` | **PATCH** | Corrección de bugs | `fix(profile): corregir validación de email` |
| `BREAKING CHANGE` | **MAJOR** | Cambio que rompe compatibilidad | Ver ejemplos abajo |

### 🔧 Cambios que NO afectan la versión

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `docs` | Cambios en documentación | `docs(readme): actualizar instrucciones de instalación` |
| `style` | Cambios de formato (espacios, comas, etc.) | `style(components): aplicar formato consistent` |
| `refactor` | Refactorización sin cambios funcionales | `refactor(api): simplificar manejo de errores` |
| `test` | Agregar o modificar tests | `test(auth): agregar tests de integración` |
| `chore` | Tareas de mantenimiento | `chore(deps): actualizar dependencias` |
| `ci` | Cambios en CI/CD | `ci(github): mejorar workflow de testing` |
| `perf` | Mejoras de rendimiento | `perf(images): optimizar carga de imágenes` |
| `build` | Cambios en build system | `build(webpack): actualizar configuración` |
| `revert` | Revertir commits anteriores | `revert: feat(auth): remove google auth` |

## 📍 Áreas Recomendadas

### Frontend Específicas
- `auth` - Autenticación y autorización
- `profile` - Gestión de perfiles de usuario
- `ui` - Componentes de interfaz de usuario
- `api` - Integración con APIs
- `routes` - Routing y navegación
- `state` - Manejo de estado (Context API)
- `images` - Gestión de imágenes
- `forms` - Formularios y validaciones
- `notifications` - Sistema de notificaciones
- `responsive` - Diseño responsive

### Generales
- `config` - Configuración del proyecto
- `deps` - Dependencias
- `build` - Sistema de construcción
- `deploy` - Despliegue
- `security` - Seguridad
- `accessibility` - Accesibilidad
- `i18n` - Internacionalización

## 💥 Breaking Changes (MAJOR version)

Para generar una versión **MAJOR** (v2.0.0), incluir `BREAKING CHANGE:` en el pie del commit:

### Formato 1: En el pie
```bash
git commit -m "feat(api): cambiar estructura de respuestas de perfil

BREAKING CHANGE: el endpoint /api/profile ahora devuelve 'user_data' en lugar de 'profile'"
```

### Formato 2: Con !
```bash
git commit -m "feat(auth)!: cambiar sistema de tokens

Migración completa de JWT a OAuth2"
```

## 📝 Ejemplos Prácticos

### ✨ Nuevas Funcionalidades (MINOR)
```bash
# Nueva feature completa
feat(images): implementar sistema de subida de imágenes de perfil

# Nueva funcionalidad en área específica
feat(auth): agregar recuperación de contraseña por email

# Mejora en UI
feat(ui): agregar tema oscuro al dashboard

# Nueva integración
feat(api): integrar con backend Django para perfiles
```

### 🐛 Correcciones (PATCH)
```bash
# Bug fix específico
fix(profile): corregir validación de teléfono en formulario

# Error de UI
fix(responsive): corregir layout en dispositivos móviles

# Problema de integración
fix(api): manejar correctamente errores 500 del backend

# Error de estado
fix(state): prevenir actualización de estado en componente desmontado
```

### 🔧 Mantenimiento (NO afecta versión)
```bash
# Documentación
docs(readme): actualizar instrucciones de configuración del backend

# Refactoring
refactor(components): extraer lógica común de formularios

# Tests
test(auth): agregar tests unitarios para login

# Dependencias
chore(deps): actualizar Next.js a 15.5.4

# CI/CD
ci(actions): optimizar workflow de versionado automático
```

### 💥 Breaking Changes (MAJOR)
```bash
# Cambio en API interna
feat(auth)!: migrar de cookies a localStorage para tokens

BREAKING CHANGE: la autenticación ahora usa localStorage en lugar de cookies HTTP-Only

# Cambio en estructura de componentes
refactor(ui)!: reestructurar sistema de componentes

BREAKING CHANGE: todos los componentes UI ahora requieren prop 'theme'

# Cambio en configuración
feat(config)!: cambiar formato de variables de entorno

BREAKING CHANGE: NEXT_PUBLIC_API_URL ahora se llama NEXT_PUBLIC_BACKEND_URL
```

## 🚀 Flujo de Trabajo Automático

### 1. Desarrollo Local
```bash
# Crear feature branch (opcional)
git checkout -b feat/profile-images

# Hacer cambios...
# Commit con formato convencional
git commit -m "feat(profile): implementar subida de imágenes con preview"

# Push a main (o crear PR)
git push origin main
```

### 2. Automatización (GitHub Actions)
Al hacer push a `main`, automáticamente:
- 🧮 Analiza commits desde último tag
- 📈 Calcula nueva versión (patch/minor/major)
- 📝 Actualiza `VERSION.txt` y `package.json`
- 🏷️ Crea tag de Git
- 📋 Genera changelog
- 🎉 Crea GitHub Release
- 🐳 Construye imagen Docker

### 3. Resultado
- **Commit `feat:`** → v1.1.0 (MINOR)
- **Commit `fix:`** → v1.0.1 (PATCH)  
- **Commit con `BREAKING CHANGE:`** → v2.0.0 (MAJOR)

## 🎨 Tips y Mejores Prácticas

### ✅ Buenos Commits
```bash
feat(auth): agregar autenticación con JWT
fix(profile): corregir validación de email
docs(api): documentar endpoints de versión
test(components): agregar tests de ProfileImageUpload
chore(deps): actualizar react-hot-toast a 2.6.0
```

### ❌ Commits a Evitar
```bash
# Muy genérico
git commit -m "update"
git commit -m "fix stuff"
git commit -m "changes"

# Sin tipo
git commit -m "add new feature"
git commit -m "bug in login"

# Descripción en pasado
git commit -m "feat: added profile page"
git commit -m "fix: fixed the bug"
```

### 📏 Reglas de Descripción
- **Máximo 50 caracteres** en la primera línea
- **Usar imperativo**: "add" no "added" o "adds"
- **Sin punto final** en la descripción
- **Ser específico**: "fix login validation" no "fix bug"
- **En inglés** para consistencia

## 🔍 Herramientas de Verificación

### Scripts Disponibles
```bash
# Ver versión actual
./show_version.sh

# Verificar estado del workflow
./check_version_workflow.sh

# Validar formato de commit (cuando esté disponible)
npm run commit:validate
```

### VSCode Extensions Recomendadas
- **Conventional Commits**: Para ayuda en formato
- **GitLens**: Para mejor visualización de commits
- **Git History**: Para revisar historial de commits

## 📊 Monitoring

### Enlaces de Seguimiento
- **Releases**: https://github.com/sperea/intranet_colaboradores_frontend/releases
- **Actions**: https://github.com/sperea/intranet_colaboradores_frontend/actions
- **Docker Images**: https://github.com/sperea/intranet_colaboradores_frontend/pkgs/container/colaboradores-frontend

### Verificación Local
```bash
# Ver últimos commits con formato
git log --oneline -10

# Ver tags de versión
git tag -l

# Ver información de la última release
curl -s https://api.github.com/repos/sperea/intranet_colaboradores_frontend/releases/latest | jq '.tag_name'
```

---

## 🎯 Resumen Rápido

| Quiero... | Uso... | Resultado |
|-----------|--------|-----------|
| Nueva funcionalidad | `feat(area): descripción` | v1.1.0 (MINOR) |
| Corregir bug | `fix(area): descripción` | v1.0.1 (PATCH) |
| Cambio incompatible | `feat!:` o `BREAKING CHANGE:` | v2.0.0 (MAJOR) |
| Documentar | `docs(area): descripción` | Sin cambio de versión |
| Refactorizar | `refactor(area): descripción` | Sin cambio de versión |
| Actualizar deps | `chore(deps): descripción` | Sin cambio de versión |

**¡Recuerda!** Cada push a `main` con commits convencionales activa el versionado automático 🚀