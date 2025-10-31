import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Obtener la referencia catastral de los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const refcat = searchParams.get('refcat')

    // Validar parámetro requerido
    if (!refcat) {
      return NextResponse.json(
        { error: 'Falta el parámetro requerido: refcat' },
        { status: 400 }
      )
    }

    // Obtener las cookies de autenticación
    const accessToken = request.cookies.get('access-token')
    const refreshToken = request.cookies.get('refresh-token')

    console.log('🏗️ Edificio detalle - Cookies de autenticación:', {
      accessToken: accessToken ? `${accessToken.value.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.value.substring(0, 20)}...` : null,
      allCookies: request.cookies.getAll().map(c => c.name)
    })

    if (!accessToken) {
      console.log('❌ Edificio detalle - No se encontró access-token')
      return NextResponse.json(
        { error: 'No se encontró token de autenticación' },
        { status: 401 }
      )
    }

    // Construir la URL de la API
    const apiEndpoint = new URL(`${config.apiUrl}/catastro/inmuebles/refcat/`)
    apiEndpoint.searchParams.set('refcat', refcat)

    console.log('📍 Parámetros recibidos:', { refcat })
    console.log('🌐 Llamando a la API de detalle edificio:', apiEndpoint.toString())

    // Hacer la llamada a la API externa
    const response = await fetch(apiEndpoint.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    console.log('📋 Respuesta de la API de detalle edificio:', {
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
          const refreshResponse = await fetch(`${config.apiUrl}/api/token/refresh/`, {
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
            const retryResponse = await fetch(apiEndpoint.toString(), {
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
    console.error('Error en la búsqueda de detalle del edificio:', error)
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