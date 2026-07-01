/**
 * Property-Based Test: Verification Notification Visibility
 * Feature: email-verification-flow-improvement
 * Property 3: Verification Notification Visibility
 * 
 * **Validates: Requirements 2.1, 2.2, 2.6, 8.4**
 * 
 * For any authenticated user, the notification bar should be visible if and only if
 * the user's email is unverified, and should include the user's email address.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { User } from '@/lib/contexts/AuthContext';
import { useAuth } from '@/lib/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  User: {} as any,
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Feature: email-verification-flow-improvement, Property 3: Verification Notification Visibility', () => {
  // Helper to render component with mocked auth
  const renderWithAuth = (user: User | null) => {
    mockUseAuth.mockReturnValue({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
      resendVerificationEmail: jest.fn(),
      refreshVerificationStatus: jest.fn(),
    });
    
    return render(<EmailVerificationBanner />);
  };

  it('should be visible if and only if user is authenticated and unverified', () => {
    // Arbitrary for generating user data
    const userArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
      emailVerified: fc.boolean(),
    });

    fc.assert(
      fc.property(
        userArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: userData.emailVerified,
          };

          const { container } = renderWithAuth(user);

          // Property: Banner should be visible if and only if user is unverified
          if (userData.emailVerified) {
            // Verified user: banner should NOT be visible
            expect(container.firstChild).toBeNull();
          } else {
            // Unverified user: banner SHOULD be visible
            expect(container.firstChild).not.toBeNull();
            
            // Banner should have the warning background color
            const banner = container.querySelector('.bg-amber-50');
            expect(banner).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not be visible when user is not authenticated', () => {
    // Test that banner is never shown for unauthenticated users
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = renderWithAuth(null);

          // Property: Banner should NOT be visible for unauthenticated users
          expect(container.firstChild).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include user email address when visible for unverified users', () => {
    // Test that email address is always displayed in the banner
    const unverifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        unverifiedUserArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: false, // Always unverified for this test
          };

          renderWithAuth(user);

          // Property: Banner should contain the user's email address
          const emailText = screen.getByText((content, element) => {
            return element?.textContent?.includes(userData.email) ?? false;
          });
          expect(emailText).toBeTruthy();

          // Property: Email should be in the expected format with parentheses
          const expectedText = `Please verify your email address (${userData.email}) to unlock all features.`;
          expect(screen.getByText(expectedText)).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display resend button when visible for unverified users', () => {
    // Test that resend button is always present in the banner
    const unverifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        unverifiedUserArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: false,
          };

          renderWithAuth(user);

          // Property: Resend button should be present
          const resendButton = screen.getByRole('button', { name: /resend verification email/i });
          expect(resendButton).toBeTruthy();
          expect(resendButton).not.toBeDisabled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain visibility consistency across different user roles', () => {
    // Test that verification status determines visibility regardless of role
    const userArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
      emailVerified: fc.boolean(),
    });

    fc.assert(
      fc.property(
        userArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: userData.emailVerified,
          };

          const { container } = renderWithAuth(user);

          // Property: Visibility should depend only on emailVerified, not role
          const isVisible = container.firstChild !== null;
          expect(isVisible).toBe(!userData.emailVerified);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display warning icon when visible for unverified users', () => {
    // Test that warning icon is present in the banner
    const unverifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        unverifiedUserArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: false,
          };

          const { container } = renderWithAuth(user);

          // Property: Warning icon (SVG) should be present
          const warningIcon = container.querySelector('svg.text-amber-600');
          expect(warningIcon).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent styling for all unverified users', () => {
    // Test that banner styling is consistent regardless of user data
    const unverifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        fc.array(unverifiedUserArb, { minLength: 5, maxLength: 15 }),
        (users) => {
          const stylingClasses: string[] = [];

          for (const userData of users) {
            const user: User = {
              id: userData.id,
              email: userData.email,
              username: userData.username,
              name: userData.name,
              role: userData.role,
              emailVerified: false,
            };

            const { container } = renderWithAuth(user);

            // Collect styling classes
            const banner = container.querySelector('.bg-amber-50');
            if (banner) {
              stylingClasses.push(banner.className);
            }
          }

          // Property: All banners should have identical styling
          const uniqueStyles = new Set(stylingClasses);
          expect(uniqueStyles.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should transition from visible to hidden when emailVerified changes from false to true', () => {
    // Test that banner disappears when verification status changes
    const userArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        userArb,
        (userData) => {
          // First render with unverified user
          const unverifiedUser: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: false,
          };

          const { container: unverifiedContainer } = renderWithAuth(unverifiedUser);

          // Property: Banner should be visible for unverified user
          expect(unverifiedContainer.firstChild).not.toBeNull();

          // Now render with verified user
          const verifiedUser: User = {
            ...unverifiedUser,
            emailVerified: true,
          };

          const { container: verifiedContainer } = renderWithAuth(verifiedUser);

          // Property: Banner should NOT be visible for verified user
          expect(verifiedContainer.firstChild).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include verification message text for all unverified users', () => {
    // Test that the verification message is always present
    const unverifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
    });

    fc.assert(
      fc.property(
        unverifiedUserArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: false,
          };

          renderWithAuth(user);

          // Property: Verification message should be present
          const verificationText = screen.getByText(/please verify your email address/i);
          expect(verificationText).toBeTruthy();

          // Property: Message should mention unlocking features
          const unlockText = screen.getByText(/to unlock all features/i);
          expect(unlockText).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never display for verified users regardless of other properties', () => {
    // Test that verified users never see the banner
    const verifiedUserArb = fc.record({
      id: fc.integer({ min: 1, max: 100000 }).map(String),
      email: fc.emailAddress(),
      username: fc.string({ minLength: 3, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      role: fc.constantFrom('student', 'convener', 'instructor', 'administrator') as fc.Arbitrary<'student' | 'convener' | 'instructor' | 'administrator'>,
      profilePicture: fc.option(fc.webUrl(), { nil: undefined }),
    });

    fc.assert(
      fc.property(
        verifiedUserArb,
        (userData) => {
          const user: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            emailVerified: true, // Always verified
            profilePicture: userData.profilePicture,
          };

          const { container } = renderWithAuth(user);

          // Property: Banner should NEVER be visible for verified users
          expect(container.firstChild).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
