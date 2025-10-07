# Proyecto Frontend JLA - Colaboradores

Este es un proyecto de autenticación frontend desarrollado con Next.js 15.5.4 y TypeScript.

## Características del Proyecto

- **Framework**: Next.js 14+ con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS con paleta corporativa
- **Autenticación**: JWT con cookies HTTP-Only
- **Estado**: React Context API
- **Notificaciones**: Sistema de toast integrado
- **Configuración**: Variables de entorno para backend configurable

## Configuración Completada

- [x] Sistema de autenticación JWT completo
- [x] Componentes UI responsivos con branding corporativo
- [x] Context API para manejo de estado global
- [x] Rutas protegidas y redirecciones automáticas
- [x] Sistema de notificaciones toast
- [x] Logo corporativo integrado
- [x] URL del backend configurable via variables de entorno
- [x] Scripts de configuración automatizada
- [x] Documentación completa

## Estructura Principal

```
/app/                    # Rutas y páginas (App Router)
/components/            # Componentes reutilizables
/context/              # Context API (AuthContext)
/lib/                  # Utilidades (config, api)
/scripts/              # Scripts de configuración
/public/               # Recursos estáticos
```

## Configuración del Backend

El proyecto incluye múltiples formas de configurar la URL del backend:

1. **Variables de entorno**: Edita `.env.local`
2. **Scripts npm**: `npm run config:local`, `npm run config:external`
3. **Script interactivo**: `npm run setup:backend`

## Comandos Principales

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run config:show` - Mostrar configuración actual
- `npm run setup:backend` - Configuración interactiva del backend

## Instrucciones para Copilot

- Este proyecto usa Next.js 15.5.4 con TypeScript y App Router
- Mantener consistencia con la paleta de colores corporativa (#d2212b)
- Usar el Context API existente para autenticación
- Seguir los patrones de componentes ya establecidos
- Las variables de entorno se manejan a través de `lib/config.ts`
- Usar `lib/api.ts` para todas las llamadas al backend