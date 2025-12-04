import { NextRequest, NextResponse } from 'next/server'
import { buildUrl, API_ENDPOINTS } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    // Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const tipoVia = searchParams.get('tipo_via')
    const nombreVia = searchParams.get('nombre_via')
    const nombreMunicipio = searchParams.get('nombre_municipio')
    const nombreProvincia = searchParams.get('nombre_provincia')
    const numero = searchParams.get('numero') // Puede ser null/vacío

    // Validar parámetros requeridos
    if (!tipoVia || !nombreVia || !nombreMunicipio || !nombreProvincia) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: tipo_via, nombre_via, nombre_municipio, nombre_provincia' },
        { status: 400 }
      )
    }

    // Obtener las cookies de autenticación (usando el mismo nombre que el endpoint de calles)
    const accessToken = request.cookies.get('access-token')
    const refreshToken = request.cookies.get('refresh-token')

    console.log('🔑 Inmuebles - Cookies de autenticación:', {
      accessToken: accessToken ? `${accessToken.value.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.value.substring(0, 20)}...` : null,
      allCookies: request.cookies.getAll().map(c => c.name)
    })

    if (!accessToken) {
      console.log('❌ Inmuebles - No se encontró access-token')
      return NextResponse.json(
        { error: 'No se encontró token de autenticación' },
        { status: 401 }
      )
    }

    // Construir parámetros de query
    const params: Record<string, string> = {
      tipo_via: tipoVia,
      nombre_via: nombreVia,
      nombre_municipio: nombreMunicipio,
      nombre_provincia: nombreProvincia,
    }
    
    // Solo añadir número si existe y no está vacío
    if (numero && numero.trim()) {
      params.numero = numero.trim()
    }

    // Construir la URL de la API usando configuración centralizada
    const apiUrl = buildUrl(API_ENDPOINTS.catastro.inmuebles, params)

    console.log('🏠 Búsqueda inmuebles - Parámetros recibidos:', params)
    console.log('🔍 Parámetros individuales:', {
      tipo_via: JSON.stringify(tipoVia),
      nombre_via: JSON.stringify(nombreVia), 
      nombre_municipio: JSON.stringify(nombreMunicipio),
      nombre_provincia: JSON.stringify(nombreProvincia),
      numero: JSON.stringify(numero)
    })
    console.log('🌐 URL completa de la API Django:', apiUrl)
    console.log('📤 Headers de la petición:', {
      'Authorization': `Bearer ${accessToken.value.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    })

    // Hacer la llamada a la API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(' Respuesta status:', response.status)

    if (!response.ok) {
      console.error('❌ Error en la respuesta de Django:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl
      })

      // Intentar leer el cuerpo de la respuesta de error
      let errorBody
      try {
        errorBody = await response.text()
        console.error('📄 Cuerpo de la respuesta de error:', errorBody)
      } catch (e) {
        console.error('❌ No se pudo leer el cuerpo del error:', e)
      }

      // Si es 401, intentar refrescar el token (para ahora, simplemente devolver el error)
      if (response.status === 401) {
        console.log('🔄 Token expirado - necesario implementar refresh')
      }
      
      throw new Error(`API call failed with status ${response.status}: ${errorBody || response.statusText}`)
    }

    const data = await response.json()
    
    console.log('📋 Respuesta de la API de inmuebles:', {
      status: response.status,
      dataLength: Array.isArray(data) ? data.length : 'No es array',
      dataType: typeof data,
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null,
      data: data
    })
    
    console.log('✅ Respuesta exitosa de Django:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Error en la búsqueda de inmuebles:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}