'use client';

/**
 * NavigationHandlers Component
 * Handles navigation with visual feedback and analytics
 * Requirements: 2.4, 2.5, 3.4
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface NavigationHandlersProps {
  onNavigationStart?: (destination: string) => void;
  onNavigationComplete?: (destination: string) => void;
  onNavigationError?: (error: Error, destination: string) => void;
}

export function useNavigationHandlers({
  onNavigationStart,
  onNavigationComplete,
  onNavigationError,
}: NavigationHandlersProps = {}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<string | null>(null);

  // Handle navigation with feedback
  const handleNavigation = async (destination: string, options?: { replace?: boolean }) => {
    try {
      setIsNavigating(true);
      setNavigationDestination(destination);
      onNavigationStart?.(destination);

      // Add visual feedback delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));

      if (options?.replace) {
        router.replace(destination);
      } else {
        router.push(destination);
      }

      onNavigationComplete?.(destination);
    } catch (error) {
      const navigationError = error instanceof Error ? error : new Error('Navigation failed');
      onNavigationError?.(navigationError, destination);
    } finally {
      setIsNavigating(false);
      setNavigationDestination(null);
    }
  };

  // Specific navigation handlers
  const handleJoinWithCode = () => {
    handleNavigation('/join');
  };

  const handleBrowseProgrammes = () => {
    handleNavigation('/discover');
  };

  const handleExploreProgrammes = () => {
    handleNavigation('/programmes');
  };

  const handleGoToDashboard = () => {
    handleNavigation('/dashboard');
  };

  const handleGoToProfile = () => {
    handleNavigation('/profile');
  };

  return {
    isNavigating,
    navigationDestination,
    handleNavigation,
    handleJoinWithCode,
    handleBrowseProgrammes,
    handleExploreProgrammes,
    handleGoToDashboard,
    handleGoToProfile,
  };
}

// Visual feedback component for navigation
export interface NavigationFeedbackProps {
  isNavigating: boolean;
  destination: string | null;
  className?: string;
}

export function NavigationFeedback({ isNavigating, destination, className = '' }: NavigationFeedbackProps) {
  if (!isNavigating || !destination) {
    return null;
  }

  const getDestinationLabel = (dest: string) => {
    switch (dest) {
      case '/join':
        return 'Join with Code';
      case '/discover':
        return 'Discover Programmes';
      case '/programmes':
        return 'Explore Programmes';
      case '/dashboard':
        return 'Dashboard';
      case '/profile':
        return 'Profile';
      default:
        return 'Loading';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#391D65]" aria-hidden="true"></div>
        <span className="text-sm font-medium text-gray-900">
          Navigating to {getDestinationLabel(destination)}...
        </span>
      </div>
    </div>
  );
}

// Enhanced button component with navigation feedback
export interface NavigationButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function NavigationButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  'aria-label': ariaLabel,
}: NavigationButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#391D65] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#391D65] text-white hover:bg-[#391D65]/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
    secondary: 'bg-white text-[#391D65] border-2 border-[#391D65] hover:bg-[#391D65] hover:text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
  };

  const handleClick = () => {
    if (!disabled && !isLoading) {
      // Provide immediate visual feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
          button.style.transform = '';
        }, 150);
      }
      
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" aria-hidden="true"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Analytics helper for tracking navigation events
export function trackNavigationEvent(destination: string, source: string = 'dashboard') {
  // This would integrate with your analytics service
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'navigation', {
      event_category: 'user_interaction',
      event_label: `${source}_to_${destination}`,
      destination,
      source,
    });
  }

  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Navigation: ${source} -> ${destination}`);
  }
}
