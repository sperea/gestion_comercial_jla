import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para validar un token de recuperación de contraseña
 * GET /api/auth/validate-reset-token?token=xxx
 * 
 * Verifica si el token es válido y no ha expirado
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'Token no proporcionado'
      }, { status: 400 })
    }

    // Llamar al backend Django para validar el token
    const djangoUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/password-reset/validate/`
    
    console.log(`🔍 Validando token de recuperación`)

    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Token inválido o expirado')
      return NextResponse.json({
        valid: false,
        error: data.error || 'Token inválido o expirado'
      }, { status: response.status })
    }

    console.log('✅ Token válido')

    return NextResponse.json({
      valid: true,
      email: data.user_email || data.email
    })

  } catch (error) {
    console.error('❌ Error al validar token:', error)
    return NextResponse.json({
      valid: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
