'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapaUbicacionProps {
  coord_wgs84: {
    lat: number
    lng: number
    zoom_level: number
  } | null
  ref_catastral: string
}

export default function MapaUbicacion({ coord_wgs84, ref_catastral }: MapaUbicacionProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const [coordenadasValidas, setCoordenadasValidas] = useState(true)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    console.log('🗺️ MapaUbicacion - Coordenadas WGS84 recibidas:', coord_wgs84)

    // Verificar que las coordenadas WGS84 están disponibles
    if (!coord_wgs84) {
      console.warn('⚠️ coord_wgs84 no disponible del backend')
      setCoordenadasValidas(false)
      return
    }

    const { lat, lng, zoom_level } = coord_wgs84

    // Validar que las coordenadas son números válidos
    if (isNaN(lat) || isNaN(lng) || isNaN(zoom_level)) {
      console.warn('⚠️ Coordenadas WGS84 inválidas:', coord_wgs84)
      setCoordenadasValidas(false)
      return
    }

    // Validar rango para España
    if (lat < 35 || lat > 45 || lng < -10 || lng > 5) {
      console.warn('⚠️ Coordenadas fuera del rango de España:', { lat, lng })
      setCoordenadasValidas(false)
      return
    }

    console.log('✅ Coordenadas WGS84 válidas:', { lat, lng, zoom_level })
    setCoordenadasValidas(true)

    // Crear el mapa con el zoom recomendado por el backend
    const map = L.map(mapRef.current).setView([lat, lng], zoom_level)
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

    // Añadir marcador con popup informativo
    L.marker([lat, lng], { icon: defaultIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>Edificio</strong><br/>
          <small>Ref: ${ref_catastral}</small><br/>
          <small>Lat: ${lat.toFixed(6)}</small><br/>
          <small>Lng: ${lng.toFixed(6)}</small>
        </div>
      `)
      .openPopup()
      
    // Añadir círculo de precisión
    L.circle([lat, lng], {
      color: '#d2212b',
      fillColor: '#d2212b', 
      fillOpacity: 0.1,
      radius: 10 // 10 metros de radio para indicar precisión
    }).addTo(map)

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [coord_wgs84, ref_catastral])

  return (
    <>
      {!coordenadasValidas ? (
        <div className="h-full w-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-gray-400 text-4xl mb-3">🗺️</div>
            <p className="text-gray-600 font-medium">Ubicación no disponible</p>
            <p className="text-gray-400 text-sm">No se encontraron coordenadas válidas</p>
          </div>
        </div>
      ) : (
        <div 
          ref={mapRef} 
          className="h-full w-full rounded-lg"
          style={{ minHeight: '300px' }}
        />
      )}
    </>
  )
}