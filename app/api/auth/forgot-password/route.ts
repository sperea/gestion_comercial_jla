import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Simulación de envío de email
    // En producción, aquí se enviaría un email real con un token único
    console.log(`Simulando envío de email de recuperación a: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu email'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}