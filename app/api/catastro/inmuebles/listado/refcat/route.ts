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

    console.log('🏠 Listado inmuebles por refcat - Parámetros recibidos:', { refcat })
    console.log('🌐 URL completa de la API:', apiUrl)
    console.log('🔧 buildUrl params:', params)
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

    console.log('📡 Respuesta del backend:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    })

    let data: any
    const contentType = response.headers.get('content-type')
    
    try {
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        const textData = await response.text()
        console.error('❌ Respuesta no es JSON:', { contentType, textData: textData.substring(0, 500) })
        data = { error: 'Respuesta no es JSON válido', details: textData }
      }
    } catch (parseError) {
      console.error('❌ Error parseando respuesta:', parseError)
      data = { error: 'Error parseando respuesta del servidor' }
    }
    
    console.log('📋 Respuesta de Django:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      dataLength: Array.isArray(data) ? data.length : (typeof data === 'object' ? Object.keys(data).length : 'scalar'),
      hasData: !!data
    })
    console.log('📊 Datos recibidos:', data)

    if (!response.ok) {
      console.error('❌ Error en la respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data: data
      })
      
      // Manejar errores específicos del backend SQL
      let friendlyError = `Error del servidor: ${response.status}`
      if (data?.detail && typeof data.detail === 'string') {
        if (data.detail.includes('no existe la columna')) {
          friendlyError = 'Error en la base de datos del catastro. El equipo técnico ha sido notificado.'
        } else if (data.detail.includes('sintaxis de entrada no es válida')) {
          friendlyError = 'Error en el procesamiento de datos del catastro. El equipo técnico ha sido notificado.'
        }
      }
      
      // Si es error 401, intentar refrescar el token
      if (response.status === 401 && refreshToken) {
        try {
          console.log('🔄 Token expirado, intentando refresh...')
          const refreshUrl = buildUrl('/api/token/refresh/')
          console.log('🔄 URL de refresh:', refreshUrl)
          
          const refreshResponse = await fetch(refreshUrl, {
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
            console.log('✅ Token refreshed exitosamente')
            
            // Reintentar la llamada original con el nuevo token
            console.log('🔄 Reintentando llamada original con nuevo token...')
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
          error: friendlyError,
          technical_details: process.env.NODE_ENV === 'development' ? data : undefined
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('💥 Error en la búsqueda de listado de inmuebles por refcat:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('💥 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? (error as any).cause : undefined
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}