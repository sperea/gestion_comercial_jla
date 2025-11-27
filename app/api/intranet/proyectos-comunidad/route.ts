import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const INTRANET_API_URL = process.env.NEXT_PUBLIC_INTRANET_API_URL || 'https://portal.jlaasociados.net';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [PROXY INTRANET] Iniciando proxy para proyectos-comunidad');
    
    // Obtener las cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access-token');
    
    if (!accessToken) {
      console.log('❌ [PROXY INTRANET] No se encontró access-token');
      return NextResponse.json(
        { error: 'No authenticated' },
        { status: 401 }
      );
    }

    console.log('🔑 [PROXY INTRANET] Access token encontrado:', accessToken.value.substring(0, 10) + '...');

    // Obtener la información del usuario para conseguir el token_intranet
    const userInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/user-info/`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      console.log('❌ [PROXY INTRANET] Error obteniendo información del usuario:', userInfoResponse.status);
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 401 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const tokenIntranet = userInfo.profile?.token_intranet;
    
    if (!tokenIntranet) {
      console.log('❌ [PROXY INTRANET] No se encontró token_intranet en el perfil del usuario');
      return NextResponse.json(
        { error: 'No intranet token found' },
        { status: 401 }
      );
    }

    console.log('🔑 [PROXY INTRANET] Token de intranet obtenido:', tokenIntranet.substring(0, 10) + '...');

    // Obtener los parámetros de query de la petición original
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construir la URL de la API de intranet
    const intranetUrl = new URL(`${INTRANET_API_URL}/api/proyectos-comunidad/`);
    
    // Copiar los parámetros de query
    searchParams.forEach((value, key) => {
      intranetUrl.searchParams.append(key, value);
    });

    console.log('📡 [PROXY INTRANET] Llamando a:', intranetUrl.toString());
    console.log('🔐 [PROXY INTRANET] Con token:', `Token ${tokenIntranet.substring(0, 10)}...`);

    // Realizar la petición a la API de intranet
    const response = await fetch(intranetUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${tokenIntranet}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📈 [PROXY INTRANET] Respuesta de API:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ [PROXY INTRANET] Error en respuesta:', errorText);
      return NextResponse.json(
        { 
          error: 'Intranet API error', 
          status: response.status,
          message: errorText 
        },
        { status: response.status }
      );
    }

    // Obtener los datos de la respuesta
    const data = await response.json();
    console.log('✅ [PROXY INTRANET] Datos obtenidos exitosamente, registros:', data.results?.length || 'N/A');

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
    console.error('💥 [PROXY INTRANET] Error en proxy:', error);
    return NextResponse.json(
      { 
        error: 'Proxy error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [PROXY INTRANET] Iniciando proxy POST para crear proyecto-comunidad');
    
    // Obtener las cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access-token');
    
    if (!accessToken) {
      console.log('❌ [PROXY INTRANET] No se encontró access-token');
      return NextResponse.json(
        { error: 'No authenticated' },
        { status: 401 }
      );
    }

    // Obtener el cuerpo de la petición
    const body = await request.json();
    
    console.log('🔑 [PROXY INTRANET] Access token encontrado, enviando datos:', Object.keys(body));

    // Obtener la información del usuario para conseguir el token_intranet
    const userInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/user-info/`, {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      console.log('❌ [PROXY INTRANET] Error obteniendo información del usuario:', userInfoResponse.status);
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 401 }
      );
    }

    const userInfo = await userInfoResponse.json();
    const tokenIntranet = userInfo.profile?.token_intranet;
    
    if (!tokenIntranet) {
      console.log('❌ [PROXY INTRANET] No se encontró token_intranet en el perfil del usuario');
      return NextResponse.json(
        { error: 'No intranet token found' },
        { status: 401 }
      );
    }

    console.log('🌐 [PROXY INTRANET] Realizando petición POST a intranet...');

    // Realizar la petición al endpoint real de la intranet
    const intranetResponse = await fetch(`${INTRANET_API_URL}/api/v1/proyectos-comunidad/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${tokenIntranet}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📊 [PROXY INTRANET] Respuesta de intranet:', intranetResponse.status);

    if (!intranetResponse.ok) {
      const errorText = await intranetResponse.text();
      console.log('❌ [PROXY INTRANET] Error de intranet:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: intranetResponse.status });
      } catch {
        return NextResponse.json(
          { error: 'Error creating project', details: errorText },
          { status: intranetResponse.status }
        );
      }
    }

    const data = await intranetResponse.json();
    console.log('✅ [PROXY INTRANET] Proyecto creado exitosamente, ID:', data.id);

    return NextResponse.json(data, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('💥 [PROXY INTRANET] Error en proxy POST:', error);
    return NextResponse.json(
      { 
        error: 'Proxy error', 
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