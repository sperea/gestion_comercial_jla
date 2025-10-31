'use client'

import { useEffect, useRef } from 'react'

interface MapComponentProps {
  address: string
  municipio: string
  provincia: string
}

export default function MapComponent({ address, municipio, provincia }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    // Solo cargar el mapa en el cliente
    if (typeof window === 'undefined') return

    const initMap = async () => {
      try {
        // Cargar Leaflet dinámicamente
        const L = (await import('leaflet')).default
        
        // CSS de Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }

        if (mapRef.current && !mapInstance.current) {
          // Crear el mapa centrado en Madrid por defecto
          mapInstance.current = L.map(mapRef.current).setView([40.4168, -3.7038], 13)

          // Añadir tiles de OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance.current)

          // Buscar la dirección usando Nominatim (geocodificador gratuito de OpenStreetMap)
          const searchAddress = `${address}, ${municipio}, ${provincia}, España`
          console.log('🗺️ Buscando coordenadas para:', searchAddress)
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
          )
          
          if (response.ok) {
            const results = await response.json()
            if (results && results.length > 0) {
              const { lat, lon } = results[0]
              const coords: [number, number] = [parseFloat(lat), parseFloat(lon)]
              
              console.log('🎯 Coordenadas encontradas:', coords)
              
              // Centrar el mapa en la ubicación encontrada
              mapInstance.current.setView(coords, 17)
              
              // Añadir marcador
              const marker = L.marker(coords).addTo(mapInstance.current)
              marker.bindPopup(`
                <div class="text-sm">
                  <strong>${address}</strong><br>
                  ${municipio}, ${provincia}
                </div>
              `).openPopup()
              
            } else {
              console.warn('⚠️ No se encontraron coordenadas para la dirección')
            }
          } else {
            console.error('❌ Error en la geocodificación')
          }
        }
      } catch (error) {
        console.error('Error cargando el mapa:', error)
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [address, municipio, provincia])

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          🗺️ Ubicación del Edificio
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Mapa interactivo de la dirección catastral
        </p>
      </div>
      <div 
        ref={mapRef} 
        className="h-64 w-full"
        style={{ height: '300px' }}
      />
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          📍 {address}, {municipio}, {provincia} • Mapa proporcionado por OpenStreetMap
        </p>
      </div>
    </div>
  )
}