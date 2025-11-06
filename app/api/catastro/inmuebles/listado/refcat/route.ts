import { NextRequest, NextResponse } from 'next/server'
import { buildUrl } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    // Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url)
    const refcat = searchParams.get('ref') || searchParams.get('refcat') // Permitir ambos nombres

    // Validar parámetros requeridos
    if (!refcat) {
      return NextResponse.json(
        { error: 'Falta parámetro requerido: ref o refcat' },
        { status: 400 }
      )
    }

    // Obtener las cookies de autenticación
    const accessToken = request.cookies.get('access-token')
    const refreshToken = request.cookies.get('refresh-token')

    console.log('🏠 Listado inmuebles por refcat - Cookies de autenticación:', {
      accessToken: accessToken ? `${accessToken.value.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.value.substring(0, 20)}...` : null,
    })

    if (!accessToken) {
      console.log('❌ Listado inmuebles por refcat - No se encontró access-token')
      return NextResponse.json(
        { error: 'No se encontró token de autenticación' },
        { status: 401 }
      )
    }

    // Construir parámetros de query
    const params: Record<string, string> = {
      refcat: refcat
    }

    // Construir la URL de la API usando configuración centralizada
    const apiUrl = buildUrl('/catastro/inmuebles/listado/refcat', params)

    console.log('📍 Referencia catastral:', refcat)
    console.log('🌐 Llamando a la API de listado de inmuebles:', apiUrl)

    // Hacer la llamada a la API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    console.log('📋 Respuesta de la API de listado de inmuebles:', {
      status: response.status,
      dataType: typeof data,
      dataLength: Array.isArray(data) ? data.length : 'No es array',
      hasData: !!data
    })

    if (!response.ok) {
      // Si es error 401, intentar refrescar el token
      if (response.status === 401 && refreshToken) {
        try {
          const refreshResponse = await fetch(buildUrl('/api/token/refresh/'), {
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
    console.error('Error en la búsqueda de listado de inmuebles por refcat:', error)
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