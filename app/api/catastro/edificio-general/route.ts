import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { API_ENDPOINTS, buildUrl } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const refcat = searchParams.get('refcat')
    
    if (!refcat) {
      return NextResponse.json(
        { success: false, error: 'Referencia catastral requerida' },
        { status: 400 }
      )
    }

    console.log('🏢 [API] edificio-general - Referencia:', refcat)
    
    // Obtener tokens de las cookies (nombres correctos con guiones)
    const accessToken = request.cookies.get('access-token')
    const refreshToken = request.cookies.get('refresh-token')
    
    console.log('🔑 [edificio-general] Tokens disponibles:', {
      accessToken: accessToken ? `${accessToken.value.substring(0, 20)}...` : null,
      refreshToken: refreshToken ? `${refreshToken.value.substring(0, 20)}...` : null,
    })

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para acceder a esta información' },
        { status: 401 }
      )
    }

    // Llamada al backend optimizada (sin inmuebles)
    const backendUrl = `${config.apiUrl}/catastro/edificio-general/`
    const params = new URLSearchParams({ refcat })
    
    console.log('🔗 [edificio-general] Llamando al backend optimizado:', `${backendUrl}?${params}`)
    
    const response = await fetch(`${backendUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    })

    // Si el token ha expirado, intentar renovar
    if (response.status === 401 && refreshToken) {
      console.log('🔄 [edificio-general] Token expirado, intentando renovar...')
      
      try {
        const refreshUrl = buildUrl(API_ENDPOINTS.auth.refresh)
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
          console.log('✅ [edificio-general] Token renovado exitosamente')
          
          // Reintentar la petición original con el nuevo token
          const retryResponse = await fetch(`${backendUrl}?${params}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${refreshData.access}`,
              'Content-Type': 'application/json',
            },
          })

          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            console.log('✅ [edificio-general] Respuesta exitosa después de renovar token')
            
            // Actualizar cookie con el nuevo access token
            const nextResponse = NextResponse.json(retryData)
            nextResponse.cookies.set('access-token', refreshData.access, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 30 * 60, // 30 minutos
              path: '/'
            })
            
            return nextResponse
          }
        }
      } catch (refreshError) {
        console.error('❌ [edificio-general] Error al refrescar token:', refreshError)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [edificio-general] Error del backend:', response.status, errorText)
      
      return NextResponse.json(
        { 
          success: false, 
          error: response.status === 401 ? 'No tienes permisos para acceder a esta información' : `Error del backend: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [edificio-general] Respuesta del backend optimizada recibida (sin inmuebles)')
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('💥 [edificio-general] Error en API:', error)
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