#!/bin/bash

# Script para mostrar la versión actual del proyecto
# Uso: ./show_version.sh

echo "🔍 INFORMACIÓN DE VERSIÓN - Frontend JLA Colaboradores"
echo "=================================================="
echo ""

# Función para mostrar con colores
print_info() {
    echo -e "\033[36m$1:\033[0m $2"
}

print_success() {
    echo -e "\033[32m✅ $1:\033[0m $2"
}

print_warning() {
    echo -e "\033[33m⚠️  $1:\033[0m $2"
}

print_error() {
    echo -e "\033[31m❌ $1:\033[0m $2"
}

# Leer versión desde VERSION.txt
if [ -f "VERSION.txt" ]; then
    VERSION=$(cat VERSION.txt)
    print_success "Versión Actual" "$VERSION"
else
    print_error "Archivo VERSION.txt" "No encontrado"
    VERSION="Desconocida"
fi

# Leer información del package.json
if [ -f "package.json" ]; then
    PACKAGE_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
    PACKAGE_NAME=$(grep '"name"' package.json | sed 's/.*"name": "\([^"]*\)".*/\1/')
    print_info "Package.json Version" "$PACKAGE_VERSION"
    print_info "Nombre del Proyecto" "$PACKAGE_NAME"
else
    print_warning "package.json" "No encontrado"
fi

echo ""
print_info "Framework" "Next.js $(grep '"next"' package.json | sed 's/.*"next": "\([^"]*\)".*/\1/' 2>/dev/null || echo 'Desconocido')"
print_info "Node.js" "$(node --version 2>/dev/null || echo 'No disponible')"
print_info "npm" "$(npm --version 2>/dev/null || echo 'No disponible')"

# Información de Git
echo ""
echo "📋 INFORMACIÓN DE GIT"
echo "==================="

if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "Desconocida")
    LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%cr)" 2>/dev/null || echo "No disponible")
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "Sin tags")
    
    print_info "Branch Actual" "$CURRENT_BRANCH"
    print_info "Último Commit" "$LAST_COMMIT"
    print_info "Último Tag" "$LAST_TAG"
    
    # Verificar si hay cambios sin commit
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Estado" "Hay cambios sin commit"
    else
        print_success "Estado" "Working directory limpio"
    fi
else
    print_error "Git" "No es un repositorio git"
fi

# URLs útiles
echo ""
echo "🔗 ENLACES ÚTILES"
echo "================"
echo "📦 Releases: https://github.com/sperea/intranet_colaboradores_frontend/releases"
echo "⚡ Actions:  https://github.com/sperea/intranet_colaboradores_frontend/actions"
echo "🐳 Docker:   https://github.com/sperea/intranet_colaboradores_frontend/pkgs/container/colaboradores-frontend"

# Verificar si el servidor está corriendo
echo ""
echo "🌐 ESTADO DEL SERVIDOR"
echo "====================="

if curl -s http://localhost:3000/api/ > /dev/null 2>&1; then
    API_VERSION=$(curl -s http://localhost:3000/api/ | grep -o '"version":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "No disponible")
    print_success "Servidor Local" "Activo en http://localhost:3000"
    print_info "API Version" "$API_VERSION"
else
    print_warning "Servidor Local" "No está corriendo en puerto 3000"
fi

# Verificar archivos importantes
echo ""
echo "📁 ARCHIVOS DEL SISTEMA"
echo "======================"

check_file() {
    if [ -f "$1" ]; then
        print_success "$1" "Existe"
    else
        print_warning "$1" "No encontrado"
    fi
}

check_file "VERSION.txt"
check_file "package.json"
check_file ".github/workflows/version-bump.yml"
check_file "CONVENTIONAL_COMMITS.md"
check_file "Dockerfile"

echo ""
echo "🎯 Para más información:"
echo "   • Ejecuta: ./check_version_workflow.sh"
echo "   • Revisa: CONVENTIONAL_COMMITS.md"
echo "   • API: http://localhost:3000/api/version/"
echo ""