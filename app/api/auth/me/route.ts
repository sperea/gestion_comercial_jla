import { NextRequest, NextResponse } from 'next/server'
import { buildUrl, API_ENDPOINTS } from '@/lib/api-config'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando verificación de usuario...')
    
    // Obtener tokens de las cookies
    const accessToken = req.cookies.get('access-token')?.value
    const refreshToken = req.cookies.get('refresh-token')?.value
    
    console.log('🍪 Cookies encontradas:', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    })

    // Si no hay ningún token, retornar error inmediatamente
    if (!accessToken && !refreshToken) {
      console.log('❌ No hay tokens disponibles')
      return NextResponse.json({
        success: false,
        error: 'No autenticado - Sin tokens'
      }, { status: 401 })
    }

    // Si tenemos access token, intentar verificar usuario directamente
    if (accessToken) {
      console.log('🔑 Verificando con access token...')
      try {
        const meUrl = buildUrl(API_ENDPOINTS.auth.userInfo)
        const response = await fetch(meUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          console.log('✅ Usuario verificado con access token')
          return NextResponse.json({
            success: true,
            data: userData
          })
        } else {
          const errorText = await response.text()
          console.log('❌ Access token inválido:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
        }
      } catch (error) {
        console.log('💥 Error verificando access token:', error)
      }
    }

    // Si llegamos aquí, el access token falló o no existe
    // Intentar renovar con refresh token
    if (refreshToken) {
      console.log('🔄 Intentando renovar con refresh token...')
      try {
        const refreshResponse = await fetch(buildUrl(API_ENDPOINTS.auth.refresh), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken })
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          const newAccessToken = refreshData.access
          console.log('✅ Token renovado exitosamente')
          
          // Ahora verificar usuario con el nuevo token
          const meUrl = buildUrl(API_ENDPOINTS.auth.userInfo)
          const userResponse = await fetch(meUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            }
          })

          if (userResponse.ok) {
            const userData = await userResponse.json()
            const nextResponse = NextResponse.json({
              success: true,
              data: userData
            })

            // Actualizar la cookie del access token
            nextResponse.cookies.set('access-token', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 30 * 60, // 30 minutos
              path: '/'
            })

            console.log('✅ Usuario verificado con token renovado')
            return nextResponse
          } else {
            const errorText = await userResponse.text()
            console.log('💥 Error obteniendo usuario con token renovado:', {
              status: userResponse.status,
              statusText: userResponse.statusText,
              error: errorText
            })
          }
        } else {
          console.log('💥 No se pudo renovar el token, código:', refreshResponse.status)
        }
      } catch (error) {
        console.log('💥 Error renovando token:', error)
      }
    }

    // Si llegamos aquí, todo falló
    console.log('❌ Falló verificación completa')
    return NextResponse.json({
      success: false,
      error: 'No autenticado - Token expirado'
    }, { status: 401 })

  } catch (error) {
    console.error('💥 Error crítico en /api/auth/me:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}