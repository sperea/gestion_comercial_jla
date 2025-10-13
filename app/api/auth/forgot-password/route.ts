import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint para solicitar recuperación de contraseña
 * POST /api/auth/forgot-password
 * 
 * Este endpoint actúa como proxy hacia el backend Django.
 * Django verificará si el email existe y enviará el correo con el token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'El email es requerido'
      }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'El formato del email no es válido'
      }, { status: 400 })
    }

    // Llamar al backend Django
    const djangoUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password/`
    
    console.log(`🔐 Solicitando recuperación de contraseña para: ${email}`)
    console.log(`📡 Django URL: ${djangoUrl}`)

    const response = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error desde Django:', data)
      return NextResponse.json({
        success: false,
        error: data.error || data.detail || 'Error al procesar la solicitud'
      }, { status: response.status })
    }

    console.log('✅ Email de recuperación enviado exitosamente')

    // Siempre devolvemos éxito para no revelar si el email existe
    // (mejor práctica de seguridad)
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
    })

  } catch (error) {
    console.error('❌ Error en forgot-password:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}