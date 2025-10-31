import { NextRequest, NextResponse } from 'next/server'

// Endpoint para renovar access token usando refresh token
export async function POST(req: NextRequest) {
  try {
    // Obtener refresh token de las cookies
    const refreshToken = req.cookies.get('refresh-token')?.value

    if (!refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Refresh token no encontrado'
      }, { status: 401 })
    }

    // Hacer petición al backend JLA Asociados para renovar el token
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const refreshUrl = `${backendUrl}/api/token/refresh/`
    
    console.log('🔄 Renovando token con backend Django...')
    
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('❌ Error renovando token:', errorData)
      return NextResponse.json({
        success: false,
        error: errorData.detail || 'Refresh token inválido o expirado'
      }, { status: response.status })
    }

    const data = await response.json()
    const newAccessToken = data.access
    console.log('✅ Token renovado exitosamente')

    const nextResponse = NextResponse.json({
      success: true,
      data: {
        access: newAccessToken
      },
      message: 'Token renovado exitosamente'
    })

    // Establecer nueva cookie con el access token renovado
    nextResponse.cookies.set('access-token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60, // 30 minutos
      path: '/'
    })

    return nextResponse
  } catch (error) {
    console.error('💥 Error en /api/auth/refresh:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}