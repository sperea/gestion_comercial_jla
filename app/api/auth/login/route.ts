import { NextRequest, NextResponse } from 'next/server'

// Proxy para el backend Django - redirige la petición al backend real
export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json()

    // Hacer la petición al backend Django real
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const loginUrl = `${backendUrl}/api/token/`
    
    console.log('🔑 Login request con rememberMe:', { email, password: '***', rememberMe })
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ username: email, password })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error en login desde Django:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      
      // Obtener el mensaje de error más específico
      let errorMessage = 'Error en el login'
      if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
        errorMessage = errorData.non_field_errors[0]
      } else if (errorData.detail) {
        errorMessage = errorData.detail
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: response.status })
    }

    const tokens = await response.json()
    
    console.log('🔍 Tokens recibidos de JLA API:', { access: '***', refresh: '***' })
    
    // Obtener información del usuario usando el access token
    let userData = null
    try {
      const userResponse = await fetch(`${backendUrl}/user/user-info/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (userResponse.ok) {
        userData = await userResponse.json()
        console.log('👤 Datos del usuario obtenidos:', userData)
      } else {
        console.warn('⚠️ No se pudieron obtener los datos del usuario')
        // Crear datos básicos del usuario si no se pueden obtener
        userData = {
          id: 1,
          username: email,
          email: email,
          first_name: '',
          last_name: '',
          is_active: true
        }
      }
    } catch (error) {
      console.error('❌ Error obteniendo datos del usuario:', error)
      // Crear datos básicos del usuario en caso de error
      userData = {
        id: 1,
        username: email,
        email: email,
        first_name: '',
        last_name: '',
        is_active: true
      }
    }
    
    // Crear la respuesta con la estructura esperada por el frontend
    const responseData = {
      success: true,
      data: {
        user: userData,
        tokens: {
          access: tokens.access,
          refresh: tokens.refresh
        }
      },
      message: 'Login exitoso'
    }

    const nextResponse = NextResponse.json(responseData)

    // Ajustar duración de cookies basado en "Recordarme"
    const accessMaxAge = rememberMe ? 30 * 60 : 30 * 60 // 30 minutos (no cambia para seguridad)
    const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7 // 30 días vs 7 días

    // Establecer cookies HTTP-Only para ambos tokens
    // Access token - duración corta (30 minutos para JWT)
    nextResponse.cookies.set('access-token', tokens.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessMaxAge,
      path: '/'
    })

    // Refresh token - duración ajustable según "Recordarme"
    nextResponse.cookies.set('refresh-token', tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshMaxAge,
      path: '/'
    })

    return nextResponse
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error conectando con backend'
    }, { status: 500 })
  }
}