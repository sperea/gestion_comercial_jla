import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Obtener tokens de las cookies
    let accessToken = req.cookies.get('access-token')?.value
    const refreshToken = req.cookies.get('refresh-token')?.value
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // Si no hay access token pero sí refresh token, intentar renovarlo
    if (!accessToken && refreshToken) {
      console.log('🔄 Access token no encontrado, intentando renovar con refresh token...')
      
      try {
        const refreshResponse = await fetch(`${backendUrl}/api/auth/refresh/`, {
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
          
          // Crear respuesta con el nuevo access token en cookie
          const meUrl = `${backendUrl}/api/users/me/`
          const userResponse = await fetch(meUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`
            }
          })

          if (!userResponse.ok) {
            throw new Error('Error al obtener datos del usuario con token renovado')
          }

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

          return nextResponse
        } else {
          console.log('❌ No se pudo renovar el token')
        }
      } catch (refreshError) {
        console.log('💥 Error renovando token:', refreshError)
      }
    }

    // Si no hay access token y no se pudo renovar, retornar no autenticado
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado - Token no encontrado o expirado'
      }, { status: 401 })
    }

    // Hacer petición al backend Django con el token
    const meUrl = `${backendUrl}/api/users/me/`
    
    const response = await fetch(meUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: errorData.message || errorData.detail || 'Error al verificar usuario'
      }, { status: response.status })
    }

    const userData = await response.json()
    
    return NextResponse.json({
      success: true,
      data: userData
    })
  } catch (error) {
    console.error('💥 Error en /api/auth/me:', error)
    return NextResponse.json({
      success: false,
      error: 'Error conectando con backend'
    }, { status: 500 })
  }
}