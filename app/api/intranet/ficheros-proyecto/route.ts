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
      // Si el endpoint no existe en Django aún, devolver datos mock para desarrollo
      if (intranetResponse.status === 404) {
        console.log('⚠️ [INTRANET PROXY] Endpoint no encontrado, usando datos mock de ficheros');
        
        const mockData = {
          count: 2,
          results: [
            {
              id: 1,
              proyecto: proyecto ? parseInt(proyecto) : 0,
              nombre: "Plano_situacion_edificio.pdf",
              descripcion: "Plano de situación del edificio para la póliza",
              archivo: "/media/proyectos/3516/plano_situacion.pdf",
              fecha_subida: "2025-11-20T10:30:00Z",
              size: 2458624,
              tipo: "pdf"
            },
            {
              id: 2,
              proyecto: proyecto ? parseInt(proyecto) : 0,
              nombre: "Memoria_valorativa_inmueble.docx",
              descripcion: "Memoria valorativa del inmueble para el seguro",
              archivo: "/media/proyectos/3516/memoria_valorativa.docx",
              fecha_subida: "2025-11-22T14:15:00Z",
              size: 1847392,
              tipo: "docx"
            }
          ]
        };

        return NextResponse.json(mockData);
      }

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