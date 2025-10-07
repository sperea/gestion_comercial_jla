import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth-token')

    if (!authToken || authToken.value !== 'simulated-jwt-token') {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Simulación de usuario autenticado
    const user = {
      id: '1',
      email: 'admin@example.com',
      name: 'Administrador'
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}