import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [INTRANET PROXY] Obteniendo ficheros proyecto');
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const proyecto = searchParams.get('proyecto')
    
    console.log('📋 [INTRANET PROXY] Filtro proyecto:', proyecto);
    
    // Obtener las cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access-token')?.value

    if (!accessToken) {
      console.log('❌ [INTRANET PROXY] No se encontró el token de acceso');
      return NextResponse.json(
        { error: 'No autorizado - Token de acceso no encontrado' },
        { status: 401 }
      )
    }

    console.log('🔑 [INTRANET PROXY] Token de acceso encontrado');

    // Primero obtener información del usuario para conseguir el token_intranet
    const userInfoResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      },
    });

    if (!userInfoResponse.ok) {
      console.log('❌ [INTRANET PROXY] Error obteniendo info del usuario:', userInfoResponse.status);
      return NextResponse.json(
        { error: 'Error obteniendo información del usuario' },
        { status: userInfoResponse.status }
      )
    }

    const userInfoData = await userInfoResponse.json()
    const intranetToken = userInfoData.data?.profile?.token_intranet

    if (!intranetToken) {
      console.log('❌ [INTRANET PROXY] Usuario no tiene token_intranet');
      return NextResponse.json(
        { error: 'Usuario no tiene acceso a intranet' },
        { status: 403 }
      )
    }

    console.log('🌐 [INTRANET PROXY] Token intranet encontrado, haciendo petición a ficheros proyecto');

    // Construir URL con parámetros usando la URL configurada
    const intranetBaseUrl = process.env.NEXT_PUBLIC_INTRANET_API_URL || 'https://portal.jlaasociados.net'
    let intranetUrl = `${intranetBaseUrl}/api/ficheros-proyecto/`
    if (proyecto) {
      intranetUrl += '?proyecto=' + proyecto
    }
    
    console.log('📡 [INTRANET PROXY] URL destino:', intranetUrl);

    const intranetResponse = await fetch(intranetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${intranetToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 [INTRANET PROXY] Status respuesta intranet:', intranetResponse.status);

    if (!intranetResponse.ok) {
      const errorText = await intranetResponse.text()
      console.log('❌ [INTRANET PROXY] Error en respuesta:', errorText);
      return NextResponse.json(
        { error: `Error en la API de intranet: ${intranetResponse.status}` },
        { status: intranetResponse.status }
      )
    }

    const data = await intranetResponse.json()
    console.log('✅ [INTRANET PROXY] Ficheros proyecto obtenidos exitosamente');

    return NextResponse.json(data)

  } catch (error) {
    console.error('💥 [INTRANET PROXY] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}