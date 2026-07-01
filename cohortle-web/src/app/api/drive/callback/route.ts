import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/drive/callback
 *
 * Handles the Google OAuth redirect after the convener authorises Drive access.
 *
 * Flow:
 *   1. Google redirects here with ?code=... (success) or ?error=... (failure/cancel)
 *   2. On success: POST the code to the backend /v1/api/drive/connect
 *   3. Redirect back to /convener/settings with a success or error query param
 *
 * Requirements: 1.4, 1.7, 1.8
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const settingsUrl = new URL('/convener/settings', request.url);

  const error = searchParams.get('error');
  const code = searchParams.get('code');

  // OAuth was cancelled or denied by the user — Req 1.7
  if (error === 'access_denied' || (!code && !error)) {
    settingsUrl.searchParams.set('drive_cancelled', '1');
    return NextResponse.redirect(settingsUrl);
  }

  // Google returned a different error — Req 1.8
  if (error) {
    settingsUrl.searchParams.set(
      'drive_error',
      encodeURIComponent(`Google Drive authorisation failed: ${error}`)
    );
    return NextResponse.redirect(settingsUrl);
  }

  // Exchange the code with the backend
  try {
    const token = cookies().get('auth_token')?.value;

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/v1/api/drive/connect`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      settingsUrl.searchParams.set(
        'drive_error',
        encodeURIComponent(data.message || 'Failed to connect Google Drive.')
      );
      return NextResponse.redirect(settingsUrl);
    }

    // Success — redirect back to settings; the DriveConnectionSection will
    // re-fetch status and show the connected state.
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    console.error('[Drive Callback] Exception:', err);
    settingsUrl.searchParams.set(
      'drive_error',
      encodeURIComponent('An unexpected error occurred while connecting Google Drive.')
    );
    return NextResponse.redirect(settingsUrl);
  }
}
