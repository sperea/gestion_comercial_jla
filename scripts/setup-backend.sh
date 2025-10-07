#!/bin/bash

# Script para configurar diferentes entornos de backend

echo "🔧 Configurador de Backend - JLA Intranet"
echo "==========================================="
echo

# Función para crear .env.local
create_env_file() {
    local api_url=$1
    local description=$2
    
    echo "# Configuración automática - $description" > .env.local
    echo "# Generado el $(date)" >> .env.local
    echo "" >> .env.local
    echo "# URL base de la API del backend" >> .env.local
    echo "NEXT_PUBLIC_API_URL=$api_url" >> .env.local
    echo "" >> .env.local
    echo "# Configuración adicional" >> .env.local
    echo "NODE_ENV=development" >> .env.local
    
    echo "✅ Archivo .env.local creado con:"
    echo "   API_URL: $api_url"
    echo "   Descripción: $description"
    echo
}

# Menú de opciones
echo "Selecciona la configuración de backend:"
echo "1) Desarrollo local (Next.js API routes) - /api"
echo "2) Backend separado local - http://localhost:3001/api"  
echo "3) Backend de staging - https://staging-api.jla.com"
echo "4) Backend de producción - https://api.jla.com"
echo "5) Configuración personalizada"
echo

read -p "Opción (1-5): " option

case $option in
    1)
        create_env_file "/api" "Desarrollo local con Next.js API routes"
        ;;
    2)
        create_env_file "http://localhost:3001/api" "Backend separado en puerto 3001"
        ;;
    3)
        create_env_file "https://staging-api.jla.com" "Entorno de staging"
        ;;
    4)
        create_env_file "https://api.jla.com" "Entorno de producción"
        ;;
    5)
        read -p "Ingresa la URL del backend: " custom_url
        read -p "Descripción (opcional): " custom_desc
        create_env_file "$custom_url" "${custom_desc:-Configuración personalizada}"
        ;;
    *)
        echo "❌ Opción no válida"
        exit 1
        ;;
esac

echo "🚀 Para aplicar los cambios, reinicia el servidor de desarrollo:"
echo "   npm run dev"
echo
echo "📝 Para verificar la configuración actual:"
echo "   cat .env.local"