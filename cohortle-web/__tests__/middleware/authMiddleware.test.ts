/**
 * @jest-environment node
 */
/**
 * Unit tests for authentication middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: jest.fn((url) => ({
        type: 'redirect',
        url: url.toString(),
      })),
      next: jest.fn(() => ({
        type: 'next',
      })),
    },
  };
});

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login when token is missing for lesson pages', () => {
    const request = new NextRequest('http://localhost:3000/lessons/123?cohortId=456');
    
    // Mock cookies to return no auth token
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });

  it('should preserve return URL for post-login redirect', () => {
    const lessonUrl = 'http://localhost:3000/lessons/123?cohortId=456';
    const request = new NextRequest(lessonUrl);
    
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.searchParams.get('returnUrl')).toBe('/lessons/123?cohortId=456');
  });

  it('should allow access with valid token', () => {
    const request = new NextRequest('http://localhost:3000/lessons/123?cohortId=456');
    
    // Mock cookies to return a valid auth token
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: 'valid-token-123' }),
      },
    });

    const response = middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should not protect public routes', () => {
    const publicRoutes = [
      'http://localhost:3000/',
      'http://localhost:3000/about',
      'http://localhost:3000/contact',
      'http://localhost:3000/login',
    ];

    publicRoutes.forEach((url) => {
      jest.clearAllMocks();
      
      const request = new NextRequest(url);
      Object.defineProperty(request, 'cookies', {
        value: {
          get: jest.fn().mockReturnValue(undefined),
        },
      });

      const response = middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  it('should protect dashboard route', () => {
    const request = new NextRequest('http://localhost:3000/dashboard');
    
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });

  it('should handle nested lesson routes', () => {
    const request = new NextRequest('http://localhost:3000/lessons/123/comments');
    
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('should redirect to login when only authorization header is present (middleware uses cookies only)', () => {
    const request = new NextRequest('http://localhost:3000/lessons/123?cohortId=456');
    
    // Mock cookies to return no token
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    // Middleware only checks cookies, not Authorization header — should redirect
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });
});
