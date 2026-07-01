import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the auth token cookie
    cookies().set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return NextResponse.json({
      error: false,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout API route error:', error);
    return NextResponse.json(
      { error: true, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
