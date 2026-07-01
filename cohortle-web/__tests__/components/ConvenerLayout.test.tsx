/**
 * Unit tests for Convener Layout component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import ConvenerLayout from '@/app/convener/layout';

// Mock dependencies
jest.mock('@/lib/contexts/AuthContext');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock the API calls
jest.mock('@/lib/api/convener', () => ({
  getOrgStats: jest.fn().mockResolvedValue({ total_learners: 100 }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Convener Layout', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUsePathname.mockReturnValue('/convener/dashboard');
  });

  it('should display loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should redirect non-convener users to dashboard', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'learner@test.com',
        username: 'learner',
        name: 'Test Learner',
        role: 'learner',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Should redirect to dashboard
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
  });

  it('should render layout for convener users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'convener@test.com',
        username: 'convener',
        name: 'Test Convener',
        role: 'convener',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Should show layout with navigation
    expect(screen.getByText('Cohortle')).toBeInTheDocument();
    expect(screen.getByText('Convener')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Convener')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', async () => {
    const mockLogout = jest.fn();
    
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'convener@test.com',
        username: 'convener',
        name: 'Test Convener',
        role: 'convener',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: mockLogout,
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should navigate to dashboard when logo is clicked', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'convener@test.com',
        username: 'convener',
        name: 'Test Convener',
        role: 'convener',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Click logo
    const logoButton = screen.getByText('Cohortle');
    fireEvent.click(logoButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/convener/dashboard');
  });

  it('should return null when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    });

    const { container } = render(
      <ConvenerLayout>
        <div>Test Content</div>
      </ConvenerLayout>
    );

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });
});
