import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[Login API Route] Calling backend with email:', email);

    // Call backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/v1/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }
    );

    console.log('[Login API Route] Backend response status:', response.status);

    const data = await response.json();
    console.log('[Login API Route] Backend response data:', JSON.stringify(data));

    if (data.error) {
      console.log('[Login API Route] Backend returned error:', data.message);
      return NextResponse.json(
        { error: true, message: data.message },
        { status: 401 }
      );
    }

    // Validate response structure
    if (!data.user || !data.user.email) {
      console.error('[Login API Route] Invalid backend response structure:', data);
      return NextResponse.json(
        { error: true, message: 'Invalid response from authentication server' },
        { status: 500 }
      );
    }

    // Set httpOnly cookie with the token
    cookies().set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('[Login API Route] Success, returning user:', data.user);

    return NextResponse.json({
      error: false,
      user: data.user,
    });
  } catch (error) {
    console.error('[Login API Route] Exception:', error);
    return NextResponse.json(
      { error: true, message: 'Login failed' },
      { status: 500 }
    );
  }
}
