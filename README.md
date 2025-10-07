# Frontend Auth App - Sistema de Autenticación Empresarial

Una aplicación Next.js 14+ completa con autenticación JWT mediante cookies HTTP-Only, diseñada con Tailwind CSS y siguiendo las mejores prácticas de seguridad.

## 🚀 Características

- **🔐 Autenticación JWT Segura**: Cookies HTTP-Only para máxima seguridad
- **📱 Diseño Responsivo**: Optimizado para móviles y desktop
- **🎨 UI Moderna**: Diseño minimalista con Tailwind CSS y paleta corporativa
- **⚡ Next.js 14+**: App Router con TypeScript
- **🔔 Notificaciones Toast**: Sistema de feedback visual al usuario
- **🛡️ Rutas Protegidas**: Middleware de autenticación automático
- **🔄 Recuperación de Contraseña**: Flujo completo de reset de password

## 🛠️ Tecnologías

- **Framework**: Next.js 15.5.4
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: React Context API
- **Autenticación**: JWT con cookies HTTP-Only
- **Validación**: Validación de formularios en tiempo real

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
│   ├── api/auth/                # Rutas de API para autenticación
│   │   ├── login/route.ts       # Endpoint de login
│   │   ├── logout/route.ts      # Endpoint de logout
│   │   ├── me/route.ts          # Verificación de sesión
│   │   ├── forgot-password/     # Recuperación de contraseña
│   │   └── reset-password/      # Restablecimiento de contraseña
│   ├── dashboard/               # Área protegida
│   │   ├── layout.tsx          # Layout con protección de rutas
│   │   └── page.tsx            # Dashboard principal
│   ├── login/page.tsx          # Página de login
│   ├── forgot-password/page.tsx # Página de recuperación
│   ├── reset-password/[token]/  # Página de restablecimiento
│   ├── layout.tsx              # Layout raíz con providers
│   ├── page.tsx               # Página principal (redirección)
│   └── globals.css            # Estilos globales de Tailwind
├── components/ui/              # Componentes de UI reutilizables
│   ├── Button.tsx             # Componente de botón
│   ├── Input.tsx              # Componente de input
│   ├── Card.tsx               # Componente de tarjeta
│   └── Toast.tsx              # Sistema de notificaciones
├── context/
│   └── AuthContext.tsx        # Context de autenticación
├── lib/
│   └── api.ts                 # Funciones de API
├── .github/
│   └── copilot-instructions.md # Instrucciones del proyecto
├── tailwind.config.js         # Configuración de Tailwind
├── tsconfig.json              # Configuración de TypeScript
├── package.json               # Dependencias del proyecto
└── README.md                  # Este archivo
```

## 🎨 Paleta de Colores

La aplicación utiliza una paleta corporativa específica:

- **Primario**: `#d2212b` (Rojo corporativo)
- **Grises**: Escala completa de 50 a 900
- **Estados**: Verde para éxito, rojo para errores
- **Modo Oscuro**: Configurado para futuras implementaciones

## 🔐 Sistema de Autenticación

### Credenciales de Demo

```
Email: admin@example.com
Contraseña: password123
```

### Flujo de Autenticación

1. **Login**: Validación de credenciales y establecimiento de cookie HTTP-Only
2. **Verificación**: Middleware que verifica la cookie en cada request
3. **Logout**: Eliminación segura de la cookie de sesión
4. **Recuperación**: Envío de token por email (simulado)
5. **Restablecimiento**: Validación de token y actualización de contraseña

### Características de Seguridad

- **Cookies HTTP-Only**: No accesibles desde JavaScript del cliente
- **SameSite**: Protección contra ataques CSRF
- **Secure Flag**: Activado automáticamente en producción (HTTPS)
- **Expiración**: Tokens con tiempo de vida limitado

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

### Configuración Inicial

1. **Copiar el archivo de ejemplo:**
```bash
cp .env.example .env.local
```

2. **Configurar variables según tu entorno:**

#### Desarrollo Local (Frontend y Backend separados)
```env
# Para un backend que corre en puerto diferente
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### Desarrollo Local (Todo en uno)
```env
# Para usar las rutas internas de Next.js (por defecto)
NEXT_PUBLIC_API_URL=/api
```

#### Producción
```env
# Para un backend en servidor remoto
NEXT_PUBLIC_API_URL=https://api.tuempresa.com
```

### Variables Disponibles

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL base del backend | `/api` |

> **Nota:** Las variables que empiezan con `NEXT_PUBLIC_` son expuestas al cliente.

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

## 📚 Próximos Pasos

- [ ] Integración con backend real
- [ ] Tests unitarios y de integración
- [ ] Implementación de modo oscuro
- [ ] Internacionalización (i18n)
- [ ] PWA con Service Workers
- [ ] Implementación de 2FA
- [ ] Analytics y monitoreo

## 👥 Contribución

Este proyecto sigue las mejores prácticas de desarrollo:

1. **Commits Convencionales**: `feat:`, `fix:`, `docs:`, etc.
2. **Código Limpio**: Principios SOLID aplicados
3. **Documentación**: Comentarios en lógicas complejas
4. **Responsividad**: Mobile-first approach

## 📄 Licencia

Proyecto de demostración para implementación de sistemas de autenticación empresarial.

---

**Desarrollado con ❤️ usando Next.js, TypeScript y Tailwind CSS**