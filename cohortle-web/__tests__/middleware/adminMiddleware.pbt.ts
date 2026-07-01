/**
 * @jest-environment node
 */
/**
 * Property-Based Tests: Admin middleware `/internal` route protection
 * Feature: admin-dashboard
 *
 * Property 1: Middleware blocks unauthenticated requests to `/internal`
 * Property 2: Middleware blocks non-admin authenticated requests to `/internal`
 * Property 3: Middleware allows admin requests to `/internal`
 *
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import fc from 'fast-check';
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

/** Build a minimal JWT-shaped token with the given role */
function makeToken(role: string): string {
  const payload = Buffer.from(JSON.stringify({ role, id: 1 })).toString('base64');
  return `header.${payload}.sig`;
}

/** Create a NextRequest for the given path, optionally with an auth_token cookie */
function makeRequest(path: string, token?: string): NextRequest {
  const request = new NextRequest(`http://localhost:3000${path}`);
  Object.defineProperty(request, 'cookies', {
    value: {
      get: jest.fn().mockReturnValue(token ? { value: token } : undefined),
    },
  });
  return request;
}

// Arbitrary: random sub-path under /internal (e.g. /internal, /internal/leads, /internal/foo/bar)
const internalPathArb = fc
  .array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 0, maxLength: 4 })
  .map((segments) => '/internal' + (segments.length ? '/' + segments.join('/') : ''));

// Arbitrary: role strings that are NOT admin
const nonAdminRoleArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((r) => r !== 'administrator' && r !== 'admin');

describe('Feature: admin-dashboard, Property 1: Middleware blocks unauthenticated requests to `/internal`', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to /login with returnUrl for any /internal path when no token is present', () => {
    fc.assert(
      fc.property(internalPathArb, (path) => {
        jest.clearAllMocks();
        const request = makeRequest(path); // no token
        middleware(request);

        expect(NextResponse.redirect).toHaveBeenCalled();
        const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
        expect(redirectUrl.pathname).toBe('/login');
        expect(redirectUrl.searchParams.get('returnUrl')).toBe(path);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-dashboard, Property 2: Middleware blocks non-admin authenticated requests to `/internal`', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to /unauthorized for any /internal path when token role is not administrator or admin', () => {
    fc.assert(
      fc.property(internalPathArb, nonAdminRoleArb, (path, role) => {
        jest.clearAllMocks();
        const request = makeRequest(path, makeToken(role));
        middleware(request);

        expect(NextResponse.redirect).toHaveBeenCalled();
        const redirectUrl: URL = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
        expect(redirectUrl.pathname).toBe('/unauthorized');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: admin-dashboard, Property 3: Middleware allows admin requests to `/internal`', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls next() for any /internal path when token role is "administrator"', () => {
    fc.assert(
      fc.property(internalPathArb, (path) => {
        jest.clearAllMocks();
        const request = makeRequest(path, makeToken('administrator'));
        middleware(request);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });

  it('calls next() for any /internal path when token role is "admin"', () => {
    fc.assert(
      fc.property(internalPathArb, (path) => {
        jest.clearAllMocks();
        const request = makeRequest(path, makeToken('admin'));
        middleware(request);

        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      }),
      { numRuns: 100 }
    );
  });
});
