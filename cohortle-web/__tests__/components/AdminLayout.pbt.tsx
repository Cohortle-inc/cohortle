/**
 * Property-Based Test: AdminLayout redirects non-admin users
 * Feature: admin-dashboard
 *
 * Property 4: AdminLayout redirects non-admin users
 * Validates: Requirements 1.4
 *
 * For any rendered AdminLayout where the resolved user.role is not "administrator",
 * the component should trigger a navigation to /unauthorized rather than rendering
 * the admin UI.
 */

import React from 'react';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import AdminLayout from '@/app/internal/layout';

jest.mock('@/lib/contexts/AuthContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush } as any);
  mockUsePathname.mockReturnValue('/internal/leads');
});

describe('Feature: admin-dashboard, Property 4: AdminLayout redirects non-admin users', () => {
  it('always redirects to /unauthorized for any non-administrator role string', () => {
    fc.assert(
      fc.property(
        // Generate any role string that is NOT "administrator"
        fc.string({ minLength: 1, maxLength: 30 }).filter((r) => r !== 'administrator'),
        (role) => {
          jest.clearAllMocks();
          mockUseRouter.mockReturnValue({ push: mockPush } as any);
          mockUsePathname.mockReturnValue('/internal/leads');

          mockUseAuth.mockReturnValue({
            user: {
              id: '1',
              email: 'user@test.com',
              username: 'user',
              name: 'Test User',
              role: role as any,
              emailVerified: true,
            },
            isAuthenticated: true,
            isLoading: false,
            login: jest.fn(),
            loginWithGoogle: jest.fn(),
            signup: jest.fn(),
            logout: jest.fn(),
            resetPassword: jest.fn(),
            updatePassword: jest.fn(),
            resendVerificationEmail: jest.fn(),
            refreshVerificationStatus: jest.fn(),
          });

          render(<AdminLayout><div>Admin Content</div></AdminLayout>);

          expect(mockPush).toHaveBeenCalledWith('/unauthorized');
        }
      ),
      { numRuns: 100 }
    );
  });
});
