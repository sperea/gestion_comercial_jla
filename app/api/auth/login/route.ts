import { NextRequest, NextResponse } from 'next/server'

// Simulación de backend - En producción, estas llamadas irían al servidor real
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Simulación de validación de credenciales
    // En producción, esto se haría contra una base de datos real
    if (email === 'admin@example.com' && password === 'password123') {
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Administrador'
      }

      // Simulación de tokens JWT - En producción, estos serían tokens reales
      const tokens = {
        access: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.simulated-access-token',
        refresh: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.simulated-refresh-token'
      }

      const response = NextResponse.json({
        success: true,
        data: {
          user,
          tokens
        },
        message: 'Login exitoso'
      })

      // Establecer cookies HTTP-Only para ambos tokens
      // Access token - duración corta (15 minutos)
      response.cookies.set('access-token', tokens.access, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutos
        path: '/'
      })

      // Refresh token - duración larga (7 días)
      response.cookies.set('refresh-token', tokens.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/'
      })

      return response
    } else {
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}