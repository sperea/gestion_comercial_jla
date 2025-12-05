#!/bin/bash

# Script para depurar discrepancias de categorización catastral
echo "🔍 Depurando edificio 3265402VK4736E..."

# 1. Obtener datos de resumen del edificio
echo "📊 1. Datos de resumen del edificio:"
curl -s "http://localhost:3000/api/catastro/edificio-general?ref=3265402VK4736E" | jq '.distribucion // "No distribucion found"'

echo -e "\n📋 2. Datos detallados de inmuebles:"
# 2. Obtener listado detallado de inmuebles
curl -s "http://localhost:3000/api/catastro/inmuebles/listado/refcat?ref=3265402VK4736E" | jq '[.[] | {uso_principal, uso_descripcion, superficie_m2}] | group_by(.uso_principal) | map({codigo: .[0].uso_principal, descripcion: .[0].uso_descripcion, cantidad: length, superficie_total: (map(.superficie_m2 | tonumber) | add)}) | sort_by(.codigo)'

echo -e "\n🏷️ 3. Códigos únicos encontrados:"
curl -s "http://localhost:3000/api/catastro/inmuebles/listado/refcat?ref=3265402VK4736E" | jq '[.[] | .uso_principal] | unique | sort'

echo -e "\n📝 4. Descripciones únicas encontradas:"
curl -s "http://localhost:3000/api/catastro/inmuebles/listado/refcat?ref=3265402VK4736E" | jq '[.[] | .uso_descripcion] | unique | sort'