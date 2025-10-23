import { NextRequest, NextResponse } from 'next/server'

// Mock login endpoint para desarrollo - permite ver el dashboard sin backend real
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('🔍 Mock login attempt:', { email: body.email })
    
    // Simular un login exitoso para cualquier email válido
    if (body.email && body.email.includes('@')) {
      const mockUser = {
        id: '1',
        username: body.email.split('@')[0],
        email: body.email,
        first_name: 'Usuario',
        last_name: 'Mock',
        full_name: 'Usuario Mock',
        name: 'Usuario Mock',
        phone: '+56 9 1234 5678',
        profile_image: null,
        role: 'admin',
        roles: ['admin', 'user'],
        role_names: ['Administrador', 'Usuario'],
        is_active: true,
        date_joined: '2024-01-01T00:00:00Z',
        last_login: new Date().toISOString()
      }

      // Generar tokens mock
      const mockAccessToken = 'mock-access-token-' + Date.now()
      const mockRefreshToken = 'mock-refresh-token-' + Date.now()

      console.log('✅ Mock login successful for:', body.email)
      
      const response = NextResponse.json({
        success: true,
        data: {
          user: mockUser,
          tokens: {
            access: mockAccessToken,
            refresh: mockRefreshToken
          }
        },
        message: 'Login mock exitoso'
      })

      // Establecer cookies mock
      response.cookies.set('access-token', mockAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 minutos
        path: '/'
      })

      response.cookies.set('refresh-token', mockRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 días
        path: '/'
      })

      return response
    } else {
      return NextResponse.json({
        success: false,
        error: 'Email inválido'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Error en mock login:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}