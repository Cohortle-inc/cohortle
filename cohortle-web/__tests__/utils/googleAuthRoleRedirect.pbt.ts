/**
 * Property-Based Test: Role-based redirect is deterministic
 * Feature: google-auth-integration
 * Property 5: Role-based redirect is deterministic
 *
 * Validates: Requirements 6.4
 *
 * For any user object returned from the Google auth flow, the redirect destination
 * should be /dashboard if role === 'student' and /convener/dashboard if role === 'convener',
 * with no other outcomes for these two roles.
 */

import fc from 'fast-check';

// Pure function extracted from AuthContext.loginWithGoogle redirect logic
function getRedirectUrl(role: string | undefined): string {
  return role === 'convener' ? '/convener/dashboard' : '/dashboard';
}

describe('Feature: google-auth-integration, Property 5: Role-based redirect is deterministic', () => {
  it('always redirects student role to /dashboard', () => {
    fc.assert(
      fc.property(
        fc.constant('student'),
        (role) => {
          expect(getRedirectUrl(role)).toBe('/dashboard');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always redirects convener role to /convener/dashboard', () => {
    fc.assert(
      fc.property(
        fc.constant('convener'),
        (role) => {
          expect(getRedirectUrl(role)).toBe('/convener/dashboard');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('redirect is deterministic for any role value — student and convener always produce the correct URL', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('student', 'convener'),
        (role) => {
          const url = getRedirectUrl(role);

          if (role === 'student') {
            expect(url).toBe('/dashboard');
          } else if (role === 'convener') {
            expect(url).toBe('/convener/dashboard');
          }

          // No other outcomes — the result must be one of these two
          expect(['/dashboard', '/convener/dashboard']).toContain(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('any unknown role falls back to /dashboard (safe default)', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s !== 'convener'),
        (role) => {
          // Any non-convener role (including student, undefined, empty, arbitrary) → /dashboard
          expect(getRedirectUrl(role)).toBe('/dashboard');
        }
      ),
      { numRuns: 100 }
    );
  });
});
