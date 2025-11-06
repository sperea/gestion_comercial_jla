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

    console.log('📍 Parámetros recibidos:', params)
    console.log('🌐 Llamando a la API de inmuebles:', apiUrl)

    // Hacer la llamada a la API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    console.log('📋 Respuesta de la API de inmuebles:', {
      status: response.status,
      dataLength: Array.isArray(data) ? data.length : 'No es array',
      dataType: typeof data,
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : null,
      data: data
    })

    if (!response.ok) {
      // Si es error 401, intentar refrescar el token
      if (response.status === 401 && refreshToken) {
        try {
          const refreshResponse = await fetch(buildUrl(API_ENDPOINTS.auth.refresh), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refresh: refreshToken.value
            })
          })

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            
            // Reintentar la llamada original con el nuevo token
            const retryResponse = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${refreshData.access}`,
                'Content-Type': 'application/json',
              },
            })

            const retryData = await retryResponse.json()
            
            if (retryResponse.ok) {
              // Actualizar la cookie del access token
              const response = NextResponse.json({
                success: true,
                data: retryData
              })
              
              response.cookies.set('access-token', refreshData.access, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 // 24 horas
              })

              return response
            }
          }
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError)
        }
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Error del servidor: ${response.status}`,
          details: data 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

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