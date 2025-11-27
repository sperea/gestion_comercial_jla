import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const INTRANET_API_URL = process.env.NEXT_PUBLIC_INTRANET_API_URL || 'https://portal.jlaasociados.net';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [PROXY INTRANET SEARCH] Iniciando proxy para búsqueda de proyectos-comunidad');
    
    // Obtener las cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access-token');
    
    if (!accessToken) {
      console.log('❌ [PROXY INTRANET SEARCH] No se encontró access-token');
      return NextResponse.json(
        { error: 'No authenticated' },
        { status: 401 }
      );
    }

    console.log('🔑 [PROXY INTRANET SEARCH] Access token encontrado:', accessToken.value.substring(0, 10) + '...');

    // Obtener la información del usuario para conseguir el token_intranet
    const userInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/user-info/`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      console.log('❌ [PROXY INTRANET SEARCH] Error obteniendo información del usuario:', userInfoResponse.status);
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 401 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const tokenIntranet = userInfo.profile?.token_intranet;
    
    if (!tokenIntranet) {
      console.log('❌ [PROXY INTRANET SEARCH] No se encontró token_intranet en el perfil del usuario');
      return NextResponse.json(
        { error: 'No intranet token found' },
        { status: 401 }
      );
    }

    console.log('🔑 [PROXY INTRANET SEARCH] Token de intranet obtenido:', tokenIntranet.substring(0, 10) + '...');

    // Obtener los parámetros de query de la petición original
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    console.log('🔍 [PROXY INTRANET SEARCH] Parámetros de búsqueda:', Object.fromEntries(searchParams.entries()));
    
    // Construir la URL de la API de intranet para búsqueda
    const intranetUrl = new URL(`${INTRANET_API_URL}/api/proyectos-comunidad/search/`);
    
    // Copiar los parámetros de query
    searchParams.forEach((value, key) => {
      intranetUrl.searchParams.append(key, value);
    });

    console.log('📡 [PROXY INTRANET SEARCH] Llamando a:', intranetUrl.toString());
    console.log('🔐 [PROXY INTRANET SEARCH] Con token:', `Token ${tokenIntranet.substring(0, 10)}...`);

    // Realizar la petición a la API de intranet
    const response = await fetch(intranetUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${tokenIntranet}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📈 [PROXY INTRANET SEARCH] Respuesta de API:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ [PROXY INTRANET SEARCH] Error en respuesta:', errorText);
      return NextResponse.json(
        { 
          error: 'Intranet API search error', 
          status: response.status,
          message: errorText 
        },
        { status: response.status }
      );
    }

    // Obtener los datos de la respuesta
    const data = await response.json();
    console.log('✅ [PROXY INTRANET SEARCH] Datos de búsqueda obtenidos exitosamente, registros:', data.results?.length || 'N/A');

    // Retornar los datos con los headers de CORS apropiados
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('💥 [PROXY INTRANET SEARCH] Error en proxy:', error);
    return NextResponse.json(
      { 
        error: 'Proxy search error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Manejar las peticiones OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}