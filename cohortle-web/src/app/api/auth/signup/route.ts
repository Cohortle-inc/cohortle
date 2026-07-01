import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password, role, invitationCode } = body;

    // Call backend API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/v1/api/auth/register-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role,
          invitation_code: invitationCode, // Pass invitation code to backend
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: true, message: data.message },
        { status: 400 }
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

    return NextResponse.json({
      error: false,
      user: {
        id: data.user.id.toString(),
        email,
        username: email.split('@')[0],
        name: `${firstName} ${lastName}`,
        role: data.user.role, // Include role from backend response
      },
    });
  } catch (error) {
    console.error('Signup API route error:', error);
    return NextResponse.json(
      { error: true, message: 'Signup failed' },
      { status: 500 }
    );
  }
}
