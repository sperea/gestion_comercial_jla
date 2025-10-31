import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Obtener el parámetro de búsqueda
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 3) {
      return NextResponse.json({
        success: false,
        error: 'El término de búsqueda debe tener al menos 3 caracteres'
      }, { status: 400 })
    }

    // Obtener el access token de las cookies
    const accessToken = req.cookies.get('access-token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Hacer la llamada al backend de JLA Asociados
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.jlaasociados.net'
    const catastroUrl = `${backendUrl}/catastro/calles/?q=${encodeURIComponent(query.trim())}`
    
    console.log('🏠 Buscando calles en:', catastroUrl)
    
    const response = await fetch(catastroUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Error del backend catastro:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      })
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Sesión expirada. Por favor, inicia sesión nuevamente'
        }, { status: 401 })
      } else if (response.status === 404) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No se encontraron calles que coincidan con tu búsqueda'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: errorData.message || errorData.detail || 'Error al buscar en el catastro'
        }, { status: response.status })
      }
    }

    const data = await response.json()
    console.log('✅ Resultados del catastro recibidos:', data)
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Búsqueda realizada exitosamente'
    })

  } catch (error) {
    console.error('💥 Error en /api/catastro/calles:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}