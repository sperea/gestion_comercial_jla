import { NextRequest, NextResponse } from 'next/server'

// Proxy para el backend Django - redirige la petición al backend real
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 LOGIN PROXY: Recibiendo petición de login')
    
    const { email, password } = await req.json()
    console.log('👤 LOGIN PROXY: Email:', email)

    // Hacer la petición al backend Django real
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const loginUrl = `${backendUrl}/api/auth/login/`
    
    console.log('🌐 LOGIN PROXY: URL del backend:', loginUrl)
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })
    
    console.log('📨 LOGIN PROXY: Status del backend:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.message || errorData.detail || 'Error en el login'
      }, { status: response.status })
    }

    const data = await response.json()
    
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

    // Establecer cookies HTTP-Only para ambos tokens
    // Access token - duración corta (30 minutos para JWT)
    nextResponse.cookies.set('access-token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60, // 30 minutos
      path: '/'
    })

    // Refresh token - duración larga (7 días)
    nextResponse.cookies.set('refresh-token', data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
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