import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    // Simulación de validación de token y actualización de contraseña
    // En producción, validar el token contra la base de datos y actualizar la contraseña
    if (token && password && password.length >= 6) {
      return NextResponse.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Token inválido o contraseña muy corta (mínimo 6 caracteres)'
      }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}