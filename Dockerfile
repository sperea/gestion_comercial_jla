# Frontend JLA Colaboradores - Dockerfile
# Imagen optimizada para producción con Next.js

FROM node:18-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuilder la app
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Variables de build - se pasan desde GitHub Actions
ARG VERSION=v0.0.1
ARG BUILD_DATE
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

# Establecer variables de entorno de build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
ENV VERSION=${VERSION}
ENV BUILD_DATE=${BUILD_DATE}

# Construir la aplicación
RUN npm run build

# Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public

# Automaticamente aprovechar output traces para reducir el tamaño de la imagen
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar archivos de versión y configuración
COPY --from=builder /app/VERSION.txt ./VERSION.txt
COPY --from=builder /app/package.json ./package.json

# Metadata de la imagen
LABEL maintainer="sperea@jlaasociados.es"
LABEL description="Frontend para sistema de gestión de colaboradores JLA"
LABEL version="${VERSION}"
LABEL build-date="${BUILD_DATE}"
LABEL org.opencontainers.image.title="JLA Colaboradores Frontend"
LABEL org.opencontainers.image.description="Next.js frontend para gestión de colaboradores y proyectos"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.source="https://github.com/sperea/intranet_colaboradores_frontend"
LABEL org.opencontainers.image.url="https://github.com/sperea/intranet_colaboradores_frontend"
LABEL org.opencontainers.image.vendor="JLA Asociados"
LABEL org.opencontainers.image.licenses="Proprietary"

# Cambiar al usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Script de inicio personalizado para mostrar información de versión
FROM runner AS final

# Script para mostrar información al inicio
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Iniciando Frontend JLA Colaboradores..."' >> /app/start.sh && \
    echo 'echo "📋 Versión: $(cat /app/VERSION.txt 2>/dev/null || echo "v0.0.1")"' >> /app/start.sh && \
    echo 'echo "🐳 Docker: Sí"' >> /app/start.sh && \
    echo 'echo "🌐 Puerto: 3000"' >> /app/start.sh && \
    echo 'echo "⚡ Node.js: $(node --version)"' >> /app/start.sh && \
    echo 'echo "📅 Build: ${BUILD_DATE:-$(date)}"' >> /app/start.sh && \
    echo 'echo "🔗 API Health: http://localhost:3000/api/health"' >> /app/start.sh && \
    echo 'echo "📊 API Version: http://localhost:3000/api/version"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "Iniciando servidor..."' >> /app/start.sh && \
    echo 'exec node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]