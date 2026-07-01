import { NextRequest, NextResponse } from 'next/server';

/**
 * Test API route to debug header forwarding
 */
export async function GET(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    message: 'Headers received',
    headers: headers,
    authorization: request.headers.get('Authorization'),
    authorizationLower: request.headers.get('authorization'),
  });
}

export async function POST(request: NextRequest) {
  const headers = Object.fromEntries(request.headers.entries());
  
  return NextResponse.json({
    message: 'Headers received',
    headers: headers,
    authorization: request.headers.get('Authorization'),
    authorizationLower: request.headers.get('authorization'),
  });
}