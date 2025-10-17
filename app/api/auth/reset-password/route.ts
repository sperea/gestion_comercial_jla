import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para restablecer la contraseña
 * POST /api/auth/reset-password
 * Body: { token, new_password, confirm_password }
 * 
 * Valida el token y actualiza la contraseña del usuario en Django
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, new_password, confirm_password } = body

    // Validaciones básicas
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token no proporcionado'
      }, { status: 400 })
    }

    if (!new_password || !confirm_password) {
      return NextResponse.json({
        success: false,
        error: 'Debes proporcionar la nueva contraseña y su confirmación'
      }, { status: 400 })
    }

    if (new_password !== confirm_password) {
      return NextResponse.json({
        success: false,
        error: 'Las contraseñas no coinciden'
      }, { status: 400 })
    }

    // Validar longitud mínima de contraseña
    if (new_password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      }, { status: 400 })
    }

    // Validar complejidad de contraseña (opcional pero recomendado)
    const hasUpperCase = /[A-Z]/.test(new_password)
    const hasLowerCase = /[a-z]/.test(new_password)
    const hasNumbers = /\d/.test(new_password)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña debe contener mayúsculas, minúsculas y números'
      }, { status: 400 })
    }

    // Llamar al backend Django
    const djangoUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset/confirm/`
    
    console.log(`🔐 Restableciendo contraseña con token`)

    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password,
        confirm_password
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error al restablecer contraseña:', data)
      return NextResponse.json({
        success: false,
        error: data.error || data.detail || 'Error al restablecer la contraseña'
      }, { status: response.status })
    }

    console.log('✅ Contraseña restablecida exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en reset-password:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}