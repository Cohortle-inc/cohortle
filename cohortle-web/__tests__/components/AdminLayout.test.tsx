/**
 * Unit tests for AdminLayout component
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 3.1, 3.2
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};

const adminUser = {
  id: '1',
  email: 'admin@test.com',
  username: 'admin',
  name: 'Test Admin',
  role: 'administrator' as const,
  emailVerified: true,
};

function baseAuth(overrides = {}) {
  return {
    user: adminUser,
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue(mockRouter as any);
  mockUsePathname.mockReturnValue('/internal/leads');
});

describe('AdminLayout', () => {
  it('renders loading spinner when isLoading is true', () => {
    mockUseAuth.mockReturnValue(baseAuth({ user: null, isLoading: true }) as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children and user name when user is administrator', () => {
    mockUseAuth.mockReturnValue(baseAuth() as any);

    render(<AdminLayout><div>Page Content</div></AdminLayout>);

    expect(screen.getByText('Page Content')).toBeInTheDocument();
    expect(screen.getByText('Test Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls router.push("/unauthorized") when user role is not administrator', () => {
    mockUseAuth.mockReturnValue(baseAuth({
      user: { ...adminUser, role: 'student' },
    }) as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('calls router.push("/login") when no user session exists', () => {
    mockUseAuth.mockReturnValue(baseAuth({ user: null }) as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('calls logout and router.push("/login") when logout button is clicked', async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(baseAuth({ logout: mockLogout }) as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('"Leads" nav link has active styles when pathname is /internal/leads', () => {
    mockUsePathname.mockReturnValue('/internal/leads');
    mockUseAuth.mockReturnValue(baseAuth() as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    const leadsButton = screen.getByText('Leads');
    expect(leadsButton.className).toContain('border-b-2');
  });

  it('"Leads" nav link does not have active styles on other paths', () => {
    mockUsePathname.mockReturnValue('/internal/other');
    mockUseAuth.mockReturnValue(baseAuth() as any);

    render(<AdminLayout><div>Content</div></AdminLayout>);

    const leadsButton = screen.getByText('Leads');
    expect(leadsButton.className).not.toContain('border-b-2');
  });
});
