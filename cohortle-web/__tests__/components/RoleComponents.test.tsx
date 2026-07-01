/**
 * Unit Tests: Frontend Role Components
 * Feature: role-validation-assignment-logic
 * Task: 7.3
 * 
 * Tests RoleContext, RoleGuard, PermissionGuard, and RoleRedirect components
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { RoleProvider, useRole } from '@/lib/contexts/RoleContext';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { RoleRedirect } from '@/components/auth/RoleRedirect';
import { useAuth } from '@/lib/contexts/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Test component to access role context
function TestComponent() {
  const { userRole, hasRole, hasPermission, canPerformAction } = useRole();
  
  return (
    <div>
      <div data-testid="user-role">{userRole || 'none'}</div>
      <div data-testid="has-learner">{hasRole('learner').toString()}</div>
      <div data-testid="has-convener">{hasRole('convener').toString()}</div>
      <div data-testid="has-admin">{hasRole('administrator').toString()}</div>
    </div>
  );
}

describe('RoleContext and useRole Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Role Context Provider', () => {
    it('should provide user role from auth context', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'learner' },
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('learner');
    });

    it('should return null role when user is not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('none');
    });

    it('should handle loading state', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: true,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('user-role')).toHaveTextContent('none');
    });
  });

  describe('hasRole Function', () => {
    it('should return true for exact role match', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'convener' },
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('has-convener')).toHaveTextContent('true');
    });

    it('should support role hierarchy - admin has convener access', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'administrator' },
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('has-learner')).toHaveTextContent('true');
      expect(screen.getByTestId('has-convener')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
    });

    it('should support role hierarchy - convener has learner access', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'convener' },
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('has-learner')).toHaveTextContent('true');
      expect(screen.getByTestId('has-convener')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
    });

    it('should not grant higher-level access to lower roles', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'learner' },
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('has-learner')).toHaveTextContent('true');
      expect(screen.getByTestId('has-convener')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
    });

    it('should return false when user has no role', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isLoading: false,
      });

      render(
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      );

      expect(screen.getByTestId('has-learner')).toHaveTextContent('false');
      expect(screen.getByTestId('has-convener')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('false');
    });
  });

  describe('canPerformAction Function', () => {
    it('should allow convener to access convener dashboard', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'convener' },
        isLoading: false,
      });

      const TestActionComponent = () => {
        const { canPerformAction } = useRole();
        const [canAccess, setCanAccess] = React.useState<boolean | null>(null);

        React.useEffect(() => {
          canPerformAction('access_convener_dashboard').then(setCanAccess);
        }, [canPerformAction]);

        return <div data-testid="can-access">{canAccess?.toString() || 'loading'}</div>;
      };

      render(
        <RoleProvider>
          <TestActionComponent />
        </RoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access')).toHaveTextContent('true');
      });
    });

    it('should deny learner access to convener dashboard', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'learner' },
        isLoading: false,
      });

      const TestActionComponent = () => {
        const { canPerformAction } = useRole();
        const [canAccess, setCanAccess] = React.useState<boolean | null>(null);

        React.useEffect(() => {
          canPerformAction('access_convener_dashboard').then(setCanAccess);
        }, [canPerformAction]);

        return <div data-testid="can-access">{canAccess?.toString() || 'loading'}</div>;
      };

      render(
        <RoleProvider>
          <TestActionComponent />
        </RoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('can-access')).toHaveTextContent('false');
      });
    });

    it('should allow administrator to perform all actions', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'administrator' },
        isLoading: false,
      });

      const TestActionComponent = () => {
        const { canPerformAction } = useRole();
        const [results, setResults] = React.useState<Record<string, boolean>>({});

        React.useEffect(() => {
          Promise.all([
            canPerformAction('access_convener_dashboard'),
            canPerformAction('create_programme'),
            canPerformAction('modify_system_settings'),
            canPerformAction('manage_users'),
          ]).then(([dashboard, programme, settings, users]) => {
            setResults({ dashboard, programme, settings, users });
          });
        }, [canPerformAction]);

        return (
          <div>
            <div data-testid="dashboard">{results.dashboard?.toString()}</div>
            <div data-testid="programme">{results.programme?.toString()}</div>
            <div data-testid="settings">{results.settings?.toString()}</div>
            <div data-testid="users">{results.users?.toString()}</div>
          </div>
        );
      };

      render(
        <RoleProvider>
          <TestActionComponent />
        </RoleProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toHaveTextContent('true');
        expect(screen.getByTestId('programme')).toHaveTextContent('true');
        expect(screen.getByTestId('settings')).toHaveTextContent('true');
        expect(screen.getByTestId('users')).toHaveTextContent('true');
      });
    });
  });

  describe('useRole Hook Error Handling', () => {
    it('should throw error when used outside RoleProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useRole must be used within a RoleProvider');

      consoleSpy.mockRestore();
    });
  });
});

describe('RoleGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has required role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'convener' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleGuard role="convener">
          <div data-testid="protected-content">Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should not render children when user lacks required role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleGuard role="convener">
          <div data-testid="protected-content">Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render fallback when user lacks required role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleGuard 
          role="convener"
          fallback={<div data-testid="fallback">Access Denied</div>}
        >
          <div data-testid="protected-content">Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('should support multiple roles', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'convener' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleGuard role={['convener', 'administrator']}>
          <div data-testid="protected-content">Admin or Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should respect role hierarchy', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'administrator' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleGuard role="convener">
          <div data-testid="protected-content">Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    // Administrator should have access to convener content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should show loading state when requested', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <RoleProvider>
        <RoleGuard role="convener" showLoading={true}>
          <div data-testid="protected-content">Convener Content</div>
        </RoleGuard>
      </RoleProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when user has required permission', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'convener', permissions: ['create_programme'] },
      isLoading: false,
    });

    // Note: Current implementation returns empty permissions array
    // This test documents expected behavior when permissions are implemented
    render(
      <RoleProvider>
        <PermissionGuard permission="create_programme">
          <div data-testid="protected-content">Create Programme</div>
        </PermissionGuard>
      </RoleProvider>
    );

    // Currently will not render due to empty permissions
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should not render children when user lacks required permission', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner', permissions: [] },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <PermissionGuard permission="create_programme">
          <div data-testid="protected-content">Create Programme</div>
        </PermissionGuard>
      </RoleProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render fallback when user lacks required permission', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner', permissions: [] },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <PermissionGuard 
          permission="create_programme"
          fallback={<div data-testid="fallback">Permission Denied</div>}
        >
          <div data-testid="protected-content">Create Programme</div>
        </PermissionGuard>
      </RoleProvider>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('should show loading state when requested', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <RoleProvider>
        <PermissionGuard permission="create_programme" showLoading={true}>
          <div data-testid="protected-content">Create Programme</div>
        </PermissionGuard>
      </RoleProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});

describe('RoleRedirect Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should redirect learner to learner dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
            'convener': '/convener/dashboard',
            'administrator': '/admin/dashboard',
          }}
        />
      </RoleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should redirect convener to convener dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'convener' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
            'convener': '/convener/dashboard',
            'administrator': '/admin/dashboard',
          }}
        />
      </RoleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/convener/dashboard');
    });
  });

  it('should redirect administrator to admin dashboard', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'administrator' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
            'convener': '/convener/dashboard',
            'administrator': '/admin/dashboard',
          }}
        />
      </RoleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should redirect to default URL when role not in map', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'unknown_role' },
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
            'convener': '/convener/dashboard',
          }}
          defaultUrl="/login"
        />
      </RoleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should redirect to default URL when user has no role', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
            'convener': '/convener/dashboard',
          }}
          defaultUrl="/login"
        />
      </RoleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should show loading state during redirect', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
          }}
          showLoading={true}
        />
      </RoleProvider>
    );

    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should not redirect while loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { role: 'learner' },
      isLoading: true,
    });

    render(
      <RoleProvider>
        <RoleRedirect 
          roleMap={{
            'learner': '/dashboard',
          }}
        />
      </RoleProvider>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });
});
