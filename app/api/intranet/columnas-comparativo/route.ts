import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const INTRANET_API_URL = process.env.NEXT_PUBLIC_INTRANET_API_URL || 'https://portal.jlaasociados.net';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [PROXY INTRANET] Iniciando proxy para columnas-comparativo');
    console.log('🔧 [PROXY INTRANET] Variables de entorno debug:');
    console.log('    NEXT_PUBLIC_INTRANET_API_URL desde process.env:', process.env.NEXT_PUBLIC_INTRANET_API_URL);
    console.log('    INTRANET_API_URL final a usar:', INTRANET_API_URL);
    console.log('    NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
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
    console.log('🔑 [PROXY INTRANET] Token completo para debug:', `Token ${tokenIntranet}`);

    // Obtener los parámetros de query de la petición original
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const proyecto = searchParams.get('proyecto');
    
    console.log('🔍 [PROXY INTRANET] URL original recibida:', request.url);
    console.log('🔍 [PROXY INTRANET] Parámetros de query:', Object.fromEntries(searchParams.entries()));
    console.log('🔍 [PROXY INTRANET] Parámetro proyecto extraído:', proyecto);
    console.log('🔍 [PROXY INTRANET] INTRANET_API_URL configurada:', INTRANET_API_URL);
    
    // Construir la URL de la API de intranet - manejo inteligente de endpoints
    let intranetUrl: URL;
    
    if (proyecto) {
      // Si hay parámetro proyecto, usar el endpoint anidado
      intranetUrl = new URL(`${INTRANET_API_URL}/api/proyectos/${proyecto}/columnas-comparativo/`);
      console.log('🎯 [PROXY INTRANET] Usando endpoint anidado porque proyecto =', proyecto);
    } else {
      // Si no hay parámetro proyecto, usar el endpoint directo
      intranetUrl = new URL(`${INTRANET_API_URL}/api/columnas-comparativo/`);
      console.log('🎯 [PROXY INTRANET] Usando endpoint directo porque NO hay parámetro proyecto');
      // Copiar los demás parámetros de query
      searchParams.forEach((value, key) => {
        if (key !== 'proyecto') {
          intranetUrl.searchParams.append(key, value);
          console.log('🔗 [PROXY INTRANET] Copiando parámetro:', key, '=', value);
        }
      });
    }

    console.log('📡 [PROXY INTRANET] URL final construida:', intranetUrl.toString());
    console.log('🔐 [PROXY INTRANET] Headers de autenticación que se enviarán:');
    console.log('    Authorization:', `Token ${tokenIntranet}`);
    console.log('    Content-Type: application/json');
    console.log('    Accept: application/json');

    // Realizar la petición a la API de intranet
    console.log('🚀 [PROXY INTRANET] === INICIANDO PETICIÓN A DJANGO ===');
    console.log('🚀 [PROXY INTRANET] Método: GET');
    console.log('🚀 [PROXY INTRANET] URL: ' + intranetUrl.toString());
    console.log('🚀 [PROXY INTRANET] Headers completos:');
    console.log('    Authorization: Token ' + tokenIntranet);
    console.log('    Content-Type: application/json');
    console.log('    Accept: application/json');
    
    const response = await fetch(intranetUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${tokenIntranet}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📈 [PROXY INTRANET] === RESPUESTA RECIBIDA DE DJANGO ===');
    console.log('📈 [PROXY INTRANET] Status Code:', response.status);
    console.log('📈 [PROXY INTRANET] Status Text:', response.statusText);
    console.log('📈 [PROXY INTRANET] Headers de respuesta:');
    for (const [key, value] of response.headers.entries()) {
      console.log('    ' + key + ':', value);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ [PROXY INTRANET] === ERROR EN RESPUESTA DE DJANGO ===');
      console.log('❌ [PROXY INTRANET] Status:', response.status);
      console.log('❌ [PROXY INTRANET] Status Text:', response.statusText);
      console.log('❌ [PROXY INTRANET] URL que falló:', intranetUrl.toString());
      console.log('❌ [PROXY INTRANET] Token usado:', `Token ${tokenIntranet}`);
      console.log('❌ [PROXY INTRANET] Cuerpo de error completo:');
      console.log('❌ [PROXY INTRANET] ===================================');
      console.log(errorText);
      console.log('❌ [PROXY INTRANET] ===================================');
      
      return NextResponse.json(
        { 
          error: 'Intranet API error', 
          status: response.status,
          message: errorText,
          debug: {
            url: intranetUrl.toString(),
            token: `Token ${tokenIntranet}`,
            statusCode: response.status,
            statusText: response.statusText
          }
        },
        { status: response.status }
      );
    }

    // Obtener los datos de la respuesta
    const data = await response.json();
    console.log('✅ [PROXY INTRANET] Datos obtenidos exitosamente, registros:', data.results?.length || data.length || 'N/A');

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