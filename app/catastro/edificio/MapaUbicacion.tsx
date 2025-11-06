'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapaUbicacionProps {
  coord_x: string
  coord_y: string
  ref_catastral: string
}

// Función para convertir coordenadas UTM ETRS89 zona 30N a lat/lng
function utmToLatLng(x: number, y: number): [number, number] {
  // Conversión simplificada para coordenadas UTM zona 30N (España)
  // Basada en puntos de referencia conocidos de Madrid
  
  // Para Madrid, las coordenadas aproximadas son:
  // Centro de Madrid: UTM X≈440000, Y≈4474000 → lat≈40.4168, lng≈-3.7038
  
  // Factores de conversión aproximados para la zona de Madrid
  const latFactor = 1 / 111320; // metros por grado de latitud
  const lngFactor = 1 / (111320 * Math.cos(40.4 * Math.PI / 180)); // metros por grado de longitud
  
  // Punto de referencia (centro aproximado de Madrid)
  const refX = 440000;
  const refY = 4474000;
  const refLat = 40.4168;
  const refLng = -3.7038;
  
  // Calcular diferencias
  const deltaX = x - refX;
  const deltaY = y - refY;
  
  // Convertir a lat/lng
  const lat = refLat + (deltaY * latFactor);
  const lng = refLng + (deltaX * lngFactor);
  
  return [lat, lng];
}

export default function MapaUbicacion({ coord_x, coord_y, ref_catastral }: MapaUbicacionProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Las coordenadas vienen en formato con 2 decimales sin separador
    // Ejemplo: 44808810 = 448088.10 metros
    const x = parseFloat(coord_x) / 100
    const y = parseFloat(coord_y) / 100
    
    console.log('🗺️ Coordenadas originales:', { coord_x, coord_y })
    console.log('🔢 Coordenadas procesadas (÷100):', { x, y })
    
    // Convertir coordenadas UTM a lat/lng
    const [lat, lng] = utmToLatLng(x, y)
    
    console.log('🌍 Coordenadas convertidas:', { lat, lng })

    // Crear el mapa
    const map = L.map(mapRef.current).setView([lat, lng], 16)
    mapInstance.current = map

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Configurar el icono del marcador
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    // Añadir marcador
    L.marker([lat, lng], { icon: defaultIcon })
      .addTo(map)
      .bindPopup(`
        <div>
          <strong>Edificio</strong><br>
          Ref. Catastral: ${ref_catastral}<br>
          Coordenadas: ${coord_x}, ${coord_y}
        </div>
      `)
      .openPopup()

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [coord_x, coord_y, ref_catastral])

  return (
    <div 
      ref={mapRef} 
      className="h-full w-full rounded-lg"
      style={{ minHeight: '300px' }}
    />
  )
}