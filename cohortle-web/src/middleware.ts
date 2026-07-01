import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/lessons', '/dashboard', '/programmes', '/modules', '/join'];

// Convener-only routes (require authentication and convener role)
const convenerRoutes = ['/convener'];

// Administrator-only routes (require authentication and administrator role)
const adminRoutes = ['/admin', '/internal'];

// Auth-only routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

// Role setup routes (accessible with token but no role required)
const roleSetupRoutes = ['/select-role'];

/**
 * Helper function to decode JWT token and extract role
 * Note: This is a simple decode without verification (verification happens on backend)
 * Only used for routing decisions, not security
 */
function getRoleFromToken(token: string | undefined): string | null {
  try {
    // Check if token exists and is a valid string
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    // Check if token has the expected JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept stale server action requests from old deployments.
  // These arrive as POST requests with a 'Next-Action' header but this app
  // has no server actions — they come from users with cached pages from a
  // previous build. Return a redirect so the browser reloads the fresh page.
  const nextAction = request.headers.get('Next-Action');
  if (nextAction) {
    const referer = request.headers.get('referer');
    const redirectUrl = referer
      ? new URL(referer)
      : new URL('/', request.url);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  // Check for auth token in cookies or localStorage (via cookie)
  const authToken = request.cookies.get('auth_token')?.value;

  // Check if the current path is a convener route
  const isConvenerRoute = convenerRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth-only route
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is a role setup route
  const isRoleSetupRoute = roleSetupRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Handle administrator routes - require authentication and administrator role
  if (isAdminRoute) {
    if (!authToken) {
      // No token found, redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Decode token to check role
    const userRole = getRoleFromToken(authToken);
    
    if (userRole !== 'administrator' && userRole !== 'admin') {
      // User doesn't have administrator role, redirect to unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  }

  // Handle convener routes - require authentication and convener role
  if (isConvenerRoute) {
    if (!authToken) {
      // No token found, redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Decode token to check role
    const userRole = getRoleFromToken(authToken);
    
    // Allow convener, instructor, and administrator roles
    const allowedRoles = ['convener', 'instructor', 'administrator', 'admin'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role, redirect to unauthorized
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedRoute && !authToken) {
    // No token found, redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Handle role setup routes (allow access with token)
  if (isRoleSetupRoute && !authToken) {
    // No token found, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Handle auth-only routes (redirect if already logged in)
  if (isAuthRoute && authToken) {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*$).*)',
  ],
};
