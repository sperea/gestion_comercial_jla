import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Eliminar ambas cookies de autenticación
    response.cookies.delete('access-token')
    response.cookies.delete('refresh-token')

    return response
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}