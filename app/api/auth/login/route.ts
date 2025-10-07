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

      // En producción, aquí se generaría un JWT real
      const response = NextResponse.json({
        success: true,
        data: user,
        message: 'Login exitoso'
      })

      // Establecer cookie HTTP-Only con el JWT
      // En producción, usar un JWT real y configurar secure: true en HTTPS
      response.cookies.set('auth-token', 'simulated-jwt-token', {
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