/**
 * @jest-environment node
 */
/**
 * Unit tests for convener route middleware
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

describe('Convener Route Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login when token is missing for convener routes', () => {
    const request = new NextRequest('http://localhost:3000/convener/dashboard');
    
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

  it('should preserve return URL for post-login redirect to convener routes', () => {
    const convenerUrl = 'http://localhost:3000/convener/dashboard';
    const request = new NextRequest(convenerUrl);
    
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue(undefined),
      },
    });

    const response = middleware(request);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectUrl.searchParams.get('returnUrl')).toBe('/convener/dashboard');
  });

  it('should allow access to convener routes with valid token', () => {
    const request = new NextRequest('http://localhost:3000/convener/dashboard');
    
    // Mock cookies to return a valid auth token with convener role (JWT format: header.payload.sig)
    const payload = Buffer.from(JSON.stringify({ role: 'convener', id: 1 })).toString('base64');
    Object.defineProperty(request, 'cookies', {
      value: {
        get: jest.fn().mockReturnValue({ value: `header.${payload}.sig` }),
      },
    });

    const response = middleware(request);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should protect nested convener routes', () => {
    const nestedRoutes = [
      'http://localhost:3000/convener/programmes/new',
      'http://localhost:3000/convener/programmes/123',
      'http://localhost:3000/convener/programmes/123/cohorts/new',
    ];

    nestedRoutes.forEach((url) => {
      jest.clearAllMocks();
      
      const request = new NextRequest(url);
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
  });

  it('should allow access to nested convener routes with token', () => {
    const nestedRoutes = [
      'http://localhost:3000/convener/programmes/new',
      'http://localhost:3000/convener/programmes/123',
      'http://localhost:3000/convener/programmes/123/cohorts/new',
    ];

    // Valid JWT with convener role
    const payload = Buffer.from(JSON.stringify({ role: 'convener', id: 1 })).toString('base64');
    const validToken = `header.${payload}.sig`;

    nestedRoutes.forEach((url) => {
      jest.clearAllMocks();
      
      const request = new NextRequest(url);
      Object.defineProperty(request, 'cookies', {
        value: {
          get: jest.fn().mockReturnValue({ value: validToken }),
        },
      });

      const response = middleware(request);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });
});
