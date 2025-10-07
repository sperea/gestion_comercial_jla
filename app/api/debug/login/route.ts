import { NextRequest, NextResponse } from 'next/server'

// Endpoint de debugging para probar la conexión con el backend real
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    console.log('🔍 DEBUG: Intentando login con backend real')
    console.log('📧 Email:', email)
    console.log('🔗 Backend URL:', process.env.NEXT_PUBLIC_API_URL)

    // Hacer la petición al backend real
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const loginUrl = `${backendUrl}/api/auth/login/`
    
    console.log('🌐 URL completa:', loginUrl)
    
    const loginData = {
      email: email,
      password: password
    }
    
    console.log('📤 Datos enviados:', JSON.stringify(loginData, null, 2))

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(loginData)
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

    // Devolver la respuesta del backend tal como viene
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: responseData,
      debug: {
        url: loginUrl,
        requestData: loginData,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseText: responseText
      }
    }, { status: response.status })

  } catch (error) {
    console.log('❌ Error en debug login:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error conectando con backend',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}