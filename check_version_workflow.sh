#!/bin/bash

# Script para verificar el estado completo del workflow de versionado
# Uso: ./check_version_workflow.sh

echo "🔍 VERIFICACIÓN COMPLETA DEL WORKFLOW DE VERSIONADO"
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

print_section() {
    echo ""
    echo -e "\033[1m$1\033[0m"
    echo "$(echo "$1" | sed 's/./=/g')"
}

# 1. Verificar archivos del sistema de versionado
print_section "📁 ARCHIVOS DEL SISTEMA"

check_file() {
    if [ -f "$1" ]; then
        print_success "$1" "✓ Existe"
        return 0
    else
        print_error "$1" "✗ No encontrado"
        return 1
    fi
}

FILES_OK=0
check_file "VERSION.txt" && ((FILES_OK++))
check_file ".github/workflows/version-bump.yml" && ((FILES_OK++))
check_file "CONVENTIONAL_COMMITS.md" && ((FILES_OK++))
check_file "package.json" && ((FILES_OK++))

echo ""
print_info "Archivos del sistema" "$FILES_OK/4 correctos"

# 2. Verificar contenido del workflow
print_section "⚙️ CONFIGURACIÓN DEL WORKFLOW"

if [ -f ".github/workflows/version-bump.yml" ]; then
    # Verificar componentes clave del workflow
    if grep -q "semver-action" .github/workflows/version-bump.yml; then
        print_success "Semver Action" "✓ Configurado"
    else
        print_error "Semver Action" "✗ No configurado"
    fi
    
    if grep -q "docker/build-push-action" .github/workflows/version-bump.yml; then
        print_success "Docker Build" "✓ Configurado"
    else
        print_warning "Docker Build" "⚠ No configurado"
    fi
    
    if grep -q "create-release" .github/workflows/version-bump.yml; then
        print_success "GitHub Release" "✓ Configurado"
    else
        print_error "GitHub Release" "✗ No configurado"
    fi
else
    print_error "Workflow File" "✗ No existe"
fi

# 3. Verificar información de versión
print_section "📋 INFORMACIÓN DE VERSIÓN"

if [ -f "VERSION.txt" ]; then
    CURRENT_VERSION=$(cat VERSION.txt)
    print_info "Versión Actual" "$CURRENT_VERSION"
else
    print_error "VERSION.txt" "No existe"
    CURRENT_VERSION="Desconocida"
fi

if [ -f "package.json" ]; then
    PACKAGE_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
    print_info "Package Version" "$PACKAGE_VERSION"
    
    # Verificar si las versiones coinciden
    VERSION_NUMBER=$(echo "$CURRENT_VERSION" | sed 's/^v//')
    if [ "$VERSION_NUMBER" = "$PACKAGE_VERSION" ]; then
        print_success "Sincronización" "✓ Versiones coinciden"
    else
        print_warning "Sincronización" "⚠ Versiones no coinciden"
    fi
fi

# 4. Verificar Git y repositorio
print_section "🔄 ESTADO DE GIT"

if git rev-parse --git-dir > /dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Branch Actual" "$CURRENT_BRANCH"
    
    # Verificar si estamos en main
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_success "Branch Principal" "✓ En main"
    else
        print_warning "Branch Principal" "⚠ No en main (workflow se ejecuta en main)"
    fi
    
    # Verificar commits recientes
    RECENT_COMMITS=$(git log --oneline -5 --pretty=format:"%s" | head -5)
    echo ""
    print_info "Últimos 5 commits" ""
    echo "$RECENT_COMMITS" | while read -r commit; do
        if [[ $commit =~ ^(feat|fix|docs|style|refactor|test|chore) ]]; then
            echo -e "\033[32m  ✓ $commit\033[0m"
        else
            echo -e "\033[33m  ⚠ $commit (no sigue Conventional Commits)\033[0m"
        fi
    done
    
    # Verificar tags
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "Sin tags")
    print_info "Último Tag" "$LAST_TAG"
    
    # Verificar estado del working directory
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Working Directory" "⚠ Hay cambios sin commit"
        echo "   Archivos modificados:"
        git status --porcelain | head -5 | while read -r line; do
            echo "     $line"
        done
    else
        print_success "Working Directory" "✓ Limpio"
    fi
    
    # Verificar si hay commits sin push
    UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l)
    if [ "$UNPUSHED" -gt 0 ]; then
        print_warning "Commits Sin Push" "⚠ $UNPUSHED commits sin push"
    else
        print_success "Sincronización" "✓ Todo pusheado"
    fi
else
    print_error "Git Repository" "✗ No es un repositorio git"
fi

# 5. Verificar APIs de versión
print_section "🌐 APIS DE VERSIÓN"

check_api() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        local response=$(curl -s "$url")
        if echo "$response" | grep -q "version"; then
            local api_version=$(echo "$response" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "No disponible")
            print_success "$name" "✓ Activo (versión: $api_version)"
        else
            print_warning "$name" "⚠ Responde pero sin información de versión"
        fi
    else
        print_warning "$name" "⚠ No disponible"
    fi
}

check_api "http://localhost:3000/api/" "API Root"
check_api "http://localhost:3000/api/version/" "API Version"
check_api "http://localhost:3000/api/health/" "Health Check"

# 6. Verificar workflow de GitHub Actions
print_section "🚀 GITHUB ACTIONS"

# Solo si tenemos acceso a la API de GitHub
if command -v curl > /dev/null && [ -n "${GITHUB_TOKEN:-}" ]; then
    print_info "Verificando workflows..." "Usando GITHUB_TOKEN"
    # Aquí podrías agregar verificaciones de la API de GitHub
else
    print_warning "GitHub API" "⚠ No disponible (sin GITHUB_TOKEN)"
    echo "   Para verificar workflows manualmente:"
    echo "   🔗 https://github.com/sperea/intranet_colaboradores_frontend/actions"
fi

# 7. Resumen y recomendaciones
print_section "📊 RESUMEN Y RECOMENDACIONES"

echo "Estado general del sistema de versionado:"
echo ""

if [ $FILES_OK -eq 4 ] && [ -f ".github/workflows/version-bump.yml" ]; then
    print_success "Sistema de Versionado" "✓ Completamente configurado"
else
    print_error "Sistema de Versionado" "✗ Configuración incompleta"
fi

echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo ""
echo "1. 📝 Para hacer un release:"
echo "   git commit -m \"feat(area): descripción del cambio\""
echo "   git push origin main"
echo ""
echo "2. 🔍 Para monitorear:"
echo "   • Workflows: https://github.com/sperea/intranet_colaboradores_frontend/actions"
echo "   • Releases:  https://github.com/sperea/intranet_colaboradores_frontend/releases"
echo "   • Docker:    https://github.com/sperea/intranet_colaboradores_frontend/pkgs/container/colaboradores-frontend"
echo ""
echo "3. 📋 Para commits automáticos:"
echo "   • Lee: CONVENTIONAL_COMMITS.md"
echo "   • Usa formatos: feat(), fix(), docs(), etc."
echo ""
echo "4. 🚀 Para verificar API local:"
echo "   curl http://localhost:3000/api/version/"
echo ""

# Mostrar comandos útiles
print_section "🛠️ COMANDOS ÚTILES"

echo "# Ver información básica de versión"
echo "./show_version.sh"
echo ""
echo "# Verificar este workflow completo"
echo "./check_version_workflow.sh"
echo ""
echo "# Ver últimos commits con formato"
echo "git log --oneline -10"
echo ""
echo "# Ver todos los tags de versión"
echo "git tag -l"
echo ""
echo "# Probar API de versión local"
echo "curl http://localhost:3000/api/version/ | jq"
echo ""
echo "# Ver estado de GitHub Actions (requiere gh CLI)"
echo "gh workflow list"
echo "gh run list --limit 5"
echo ""