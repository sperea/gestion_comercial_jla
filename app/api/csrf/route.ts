import { NextRequest, NextResponse } from 'next/server'
import config from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    // Hacer una request GET a Django que retorne el token CSRF
    // Django normalmente proporciona el token en la respuesta de cualquier GET
    const backendResponse = await fetch(`${config.apiUrl}/api/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include'
    })

    // Obtener el token CSRF de las cookies de respuesta
    const setCookieHeader = backendResponse.headers.get('set-cookie')
    let csrfToken = null
    
    if (setCookieHeader) {
      // Buscar csrftoken en las cookies de respuesta
      const cookies = setCookieHeader.split(',')
      for (const cookie of cookies) {
        if (cookie.trim().startsWith('csrftoken=')) {
          const tokenMatch = cookie.match(/csrftoken=([^;]+)/)
          if (tokenMatch) {
            csrfToken = tokenMatch[1]
            break
          }
        }
      }
    }

    if (!csrfToken) {
      // Si no hay token en set-cookie, intentar obtenerlo de otra manera
      // Algunos backends Django están configurados para enviar el token en el body
      try {
        const responseText = await backendResponse.text()
        // Verificar si el token está en alguna parte de la respuesta
        console.log('Django response for CSRF:', responseText.substring(0, 200))
      } catch (e) {
        console.log('Could not read Django response for CSRF token')
      }
    }

    return NextResponse.json({
      csrfToken: csrfToken || 'no-token-available',
      success: csrfToken ? true : false
    })

  } catch (error) {
    console.error('Error obteniendo CSRF token de Django:', error)
    return NextResponse.json(
      { error: 'Error obteniendo CSRF token', csrfToken: null },
      { status: 500 }
    )
  }
}