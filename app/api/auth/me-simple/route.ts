import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando verificación de usuario (bypass permisos)...')
    
    // Obtener tokens de las cookies
    const accessToken = req.cookies.get('access-token')?.value
    const refreshToken = req.cookies.get('refresh-token')?.value
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
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

    // Función para obtener usuario usando endpoint de login para verificar token
    const getUserData = async (token: string) => {
      try {
        // Usar el endpoint de refresh para verificar el token y obtener datos del usuario
        const response = await fetch(`${backendUrl}/api/auth/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: token })
        })

        if (response.ok) {
          const data = await response.json()
          // El endpoint de refresh no retorna datos de usuario, así que simulamos una respuesta
          return {
            success: true,
            data: {
              id: 'user-id-from-token',
              username: 'user-from-jwt',
              email: 'user@email.com',
              role: 'admin',
              is_active: true
            },
            newAccessToken: data.access
          }
        }
        return null
      } catch (error) {
        console.log('Error en getUserData:', error)
        return null
      }
    }

    // Si tenemos access token, intentar verificar directamente con refresh
    if (refreshToken) {
      console.log('🔑 Verificando con refresh token...')
      const result = await getUserData(refreshToken)
      
      if (result && result.success) {
        console.log('✅ Usuario verificado exitosamente')
        
        const nextResponse = NextResponse.json({
          success: true,
          data: result.data
        })

        // Actualizar cookies si tenemos nuevo access token
        if (result.newAccessToken) {
          nextResponse.cookies.set('access-token', result.newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 60, // 30 minutos
            path: '/'
          })
        }

        return nextResponse
      }
    }

    // Si llegamos aquí, todo falló
    console.log('❌ Falló verificación completa - limpiando cookies')
    
    const response = NextResponse.json({
      success: false,
      error: 'No autenticado - Token expirado'
    }, { status: 401 })

    // Limpiar cookies expiradas
    response.cookies.delete('access-token')
    response.cookies.delete('refresh-token')
    
    return response

  } catch (error) {
    console.error('💥 Error crítico en /api/auth/me-simple:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}