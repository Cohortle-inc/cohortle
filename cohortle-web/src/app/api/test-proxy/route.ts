import { NextRequest, NextResponse } from 'next/server';

/**
 * Test proxy to debug Authorization header forwarding
 */
export async function POST(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    
    console.log('Test proxy - Authorization header:', authHeader);
    console.log('Test proxy - All headers:', Object.fromEntries(request.headers.entries()));
    
    // Forward to backend
    const response = await fetch('https://api.cohortle.com/v1/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
      body: await request.text(),
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Test proxy error:', error);
    return NextResponse.json(
      { error: true, message: 'Test proxy failed' },
      { status: 500 }
    );
  }
}