import { NextRequest, NextResponse } from 'next/server'

// Endpoint de debugging para probar /me del backend Django
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 DEBUG: Probando endpoint /me del backend Django')

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const meUrl = `${backendUrl}/api/auth/me/`
    
    console.log('🌐 URL completa:', meUrl)

    // Obtener access token de las cookies si existe
    const accessToken = req.cookies.get('access-token')?.value
    console.log('🔑 Access token:', accessToken ? 'Presente' : 'No encontrado')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Si hay access token, agregarlo a los headers
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(meUrl, {
      method: 'GET',
      headers
    })

    console.log('📨 Status del backend:', response.status)
    console.log('📨 Headers del backend:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('📥 Respuesta raw del backend:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log('📥 Respuesta JSON parseada:', JSON.stringify(responseData, null, 2))
    } catch (parseError) {
      console.log('❌ Error parseando JSON:', parseError)
      responseData = { error: 'Invalid JSON response', raw: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      debug: {
        url: meUrl,
        hasToken: !!accessToken,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseText: responseText
      }
    }, { status: response.status })

  } catch (error) {
    console.log('❌ Error en debug me:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error conectando con backend',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}