import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { google_id_token } = body;

    if (!google_id_token) {
      return NextResponse.json(
        { error: true, message: 'google_id_token is required' },
        { status: 400 }
      );
    }

    // Forward to backend Google auth endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/v1/api/auth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_id_token }),
      }
    );

    const data = await response.json();

    if (data.error || !response.ok) {
      return NextResponse.json(
        { error: true, message: data.message || 'Google sign-in failed' },
        { status: response.status }
      );
    }

    // Set httpOnly cookie — same settings as /api/auth/login
    cookies().set('auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({ error: false, user: data.user });
  } catch (error) {
    console.error('[Google Callback] Exception:', error);
    return NextResponse.json(
      { error: true, message: 'Google sign-in failed' },
      { status: 500 }
    );
  }
}
