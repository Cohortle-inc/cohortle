/**
 * Unit tests for Convener Dashboard page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ConvenerDashboardPage from '@/app/convener/dashboard/page';
import { useConvenerProgrammes } from '@/lib/hooks/useConvenerProgrammes';

// Mock dependencies
jest.mock('@/lib/contexts/AuthContext');
jest.mock('@/lib/hooks/useConvenerProgrammes');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseConvenerProgrammes = useConvenerProgrammes as jest.MockedFunction<typeof useConvenerProgrammes>;

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Convener Dashboard Page', () => {
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
    
    // Default mock for useConvenerProgrammes
    mockUseConvenerProgrammes.mockReturnValue({
      programmes: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      createProgramme: jest.fn(),
      isCreating: false,
      createError: null,
    });
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

    render(<ConvenerDashboardPage />, { wrapper: createWrapper() });

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display dashboard content when user is authenticated', () => {
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

    render(<ConvenerDashboardPage />, { wrapper: createWrapper() });

    // Should show dashboard header
    expect(screen.getByText('Convener Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your programmes and cohorts')).toBeInTheDocument();
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

    const { container } = render(<ConvenerDashboardPage />, { wrapper: createWrapper() });

    // Should render nothing
    expect(container.firstChild).toBeNull();
  });
});
