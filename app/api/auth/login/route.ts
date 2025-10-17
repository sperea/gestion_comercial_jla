import { NextRequest, NextResponse } from 'next/server'

// Proxy para el backend Django - redirige la petición al backend real
export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json()

    // Hacer la petición al backend Django real
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const loginUrl = `${backendUrl}/api/auth/login/`
    
    console.log('🔑 Login request con rememberMe:', { email, rememberMe })
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password, remember_me: rememberMe })
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

    const data = await response.json()
    
    console.log('🔍 Respuesta completa de Django:', data)
    console.log('👤 Usuario en respuesta de Django:', data.user)
    
    // Crear la respuesta con la estructura esperada por el frontend
    const responseData = {
      success: true,
      data: {
        user: data.user,
        tokens: {
          access: data.access,
          refresh: data.refresh
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
    nextResponse.cookies.set('access-token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessMaxAge,
      path: '/'
    })

    // Refresh token - duración ajustable según "Recordarme"
    nextResponse.cookies.set('refresh-token', data.refresh, {
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