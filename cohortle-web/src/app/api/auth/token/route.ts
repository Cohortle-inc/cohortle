import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering - this route uses cookies and cannot be statically generated
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Get the current auth token from httpOnly cookie
 * This allows client-side code to check if a token exists without accessing it directly
 */
export async function GET() {
  try {
    const token = cookies().get('auth_token')?.value;

    return NextResponse.json({
      hasToken: !!token,
    });
  } catch (error) {
    console.error('Token check API route error:', error);
    return NextResponse.json(
      { hasToken: false },
      { status: 500 }
    );
  }
}
