import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API proxy that forwards requests to backend with auth token from httpOnly cookie
 * This allows client-side code to make authenticated requests without accessing the token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get token from httpOnly cookie
    const token = cookies().get('auth_token')?.value;

    // Build the backend URL with query parameters
    const backendBaseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${pathSegments.join('/')}`;
    
    // Get query parameters from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const backendUrl = searchParams ? `${backendBaseUrl}?${searchParams}` : backendBaseUrl;
    
    // Check for Authorization header in the incoming request first (for password reset, etc.)
    const incomingAuth = request.headers.get('Authorization') || request.headers.get('authorization');
    
    console.log('Proxy debug - incoming headers:', {
      authorization: incomingAuth,
      authorizationLower: request.headers.get('authorization'),
      authorizationUpper: request.headers.get('Authorization'),
      allHeaders: Object.fromEntries(request.headers.entries())
    });
    
    // Get request body if present
    let body: string | null = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (e) {
        // No body
      }
    }

    // Forward request to backend with proper header case
    // Backend JwtService.getToken() expects req.headers.authorization (lowercase)
    const contentType = request.headers.get('content-type') || 'application/json';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    
    if (incomingAuth) {
      // Use lowercase 'authorization' header to match backend expectations
      headers['authorization'] = incomingAuth;
    } else if (token) {
      // Use lowercase 'authorization' header to match backend expectations  
      headers['authorization'] = `Bearer ${token}`;
    }

    console.log('Proxy request:', {
      method,
      path: pathSegments.join('/'),
      queryParams: searchParams,
      backendUrl,
      hasToken: !!token,
      incomingAuth: !!incomingAuth,
      finalAuthHeader: headers['authorization'] ? 'Bearer ***' : 'none'
    });

    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body || undefined,
    });

    const data = await response.text();
    
    console.log('Proxy response:', {
      status: response.status,
      dataLength: data.length
    });

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy request error:', error);
    return NextResponse.json(
      { error: true, message: 'Proxy request failed' },
      { status: 500 }
    );
  }
}
