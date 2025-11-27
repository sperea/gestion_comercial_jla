import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    console.log('🔄 [INTRANET PROXY] Obteniendo proyecto específico:', projectId);
    
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

    console.log('🌐 [INTRANET PROXY] Token intranet encontrado, haciendo petición al proyecto');

    // Hacer la petición al endpoint de intranet usando la URL configurada
    const intranetBaseUrl = process.env.NEXT_PUBLIC_INTRANET_API_URL || 'https://portal.jlaasociados.net'
    const intranetUrl = `${intranetBaseUrl}/api/proyectos-comunidad/?pk=${projectId}`
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
    console.log('✅ [INTRANET PROXY] Respuesta obtenida, buscando proyecto específico');

    // Buscar el proyecto específico en los resultados
    const proyecto = data.results?.find((p: any) => p.id === parseInt(projectId))
    
    if (!proyecto) {
      console.log('❌ [INTRANET PROXY] Proyecto no encontrado en resultados');
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ [INTRANET PROXY] Proyecto encontrado exitosamente');
    return NextResponse.json(proyecto)

  } catch (error) {
    console.error('💥 [INTRANET PROXY] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}