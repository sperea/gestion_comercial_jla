import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Verificar access token en las cookies
    const accessToken = req.cookies.get('access-token')

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado - Access token no encontrado'
      }, { status: 401 })
    }

    // Simulación de validación del access token
    // En producción, aquí se verificaría y decodificaría el JWT
    const validTokens = [
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.simulated-access-token',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.new-simulated-access-token'
    ]

    if (!validTokens.includes(accessToken.value)) {
      return NextResponse.json({
        success: false,
        error: 'Access token inválido o expirado'
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