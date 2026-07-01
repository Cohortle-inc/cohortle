/**
 * Property-Based Tests for EnhancedEmptyState Component
 * Feature: new-learner-dashboard-experience
 * 
 * **Validates: Requirements 1.2, 2.1, 2.2, 2.3**
 */

import fc from 'fast-check';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { EnhancedEmptyState, UserProfile } from '@/components/dashboard/EnhancedEmptyState';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Generators for property-based testing
const userProfileGenerator = fc.record({
  id: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(name => name.trim().length > 0), // Ensure non-empty name
  role: fc.constantFrom('learner' as const, 'convener' as const),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  lastLoginAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  onboardingCompleted: fc.boolean(),
  preferences: fc.record({
    showOnboardingTips: fc.boolean(),
    preferredLoadingStyle: fc.constantFrom('skeleton' as const, 'spinner' as const),
    dismissedMessages: fc.array(fc.string(), { maxLength: 5 }),
  }),
});

// Generator for empty programmes array (simulating API response)
const emptyProgrammesResponseGenerator = fc.constant([]);

// Generator for API response scenarios
const apiResponseGenerator = fc.record({
  programmes: emptyProgrammesResponseGenerator,
  loading: fc.boolean(),
  error: fc.option(fc.string(), { nil: null }),
});

describe('Feature: new-learner-dashboard-experience - EnhancedEmptyState Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 2: Empty State Response
   * For any API response containing an empty programmes array, the dashboard should 
   * immediately display the enhanced empty state with welcoming message, call-to-action 
   * buttons, and contextual help text instead of continuing to show loading indicators.
   * 
   * **Validates: Requirements 1.2, 2.1, 2.2, 2.3**
   */
  it('Property 2: Empty State Response - Immediate Display on Empty Array', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        apiResponseGenerator,
        (userProfile, apiResponse) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();
          const onDismissOnboarding = jest.fn();

          // When API returns empty programmes array, should immediately show empty state
          if (apiResponse.programmes.length === 0 && !apiResponse.loading) {
            const { container, unmount } = render(
              <EnhancedEmptyState
                userProfile={userProfile}
                onJoinWithCode={onJoinWithCode}
                onBrowseProgrammes={onBrowseProgrammes}
                onDismissOnboarding={onDismissOnboarding}
                showOnboarding={false} // Disable onboarding for this test
              />
            );

            // Should immediately display enhanced empty state (no loading indicators)
            expect(container.querySelector('[role="status"]')).toBeNull();
            expect(container.querySelector('.animate-spin')).toBeNull();
            expect(container.querySelector('.animate-pulse')).toBeNull();

            // Should display welcoming message
            const welcomeText = container.textContent;
            expect(welcomeText).toMatch(/welcome|Welcome|enrolled|programmes/i);

            // Should display call-to-action buttons
            const joinButton = screen.getByText(/join with code/i);
            const browseButton = screen.getByText(/browse programmes/i);
            expect(joinButton).toBeInTheDocument();
            expect(browseButton).toBeInTheDocument();

            // Should display contextual help text
            expect(welcomeText).toMatch(/enrollment code|instructor|browse/i);
            
            unmount(); // Clean up after test
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 2: Empty State Response - Welcoming Message Content', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should contain user's name in welcoming message (only for new or inactive users)
          const welcomeText = container.textContent;
          const isNew = new Date(userProfile.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isInactive = new Date(userProfile.lastLoginAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (isNew || (isInactive && !isNew)) {
            expect(welcomeText).toContain(userProfile.name);
          }

          // Should have appropriate messaging based on user state
          if (isNew) {
            expect(welcomeText).toMatch(/welcome.*dashboard/i);
          } else if (isInactive && !isNew) {
            expect(welcomeText).toMatch(/welcome back/i);
          } else {
            expect(welcomeText).toMatch(/not enrolled.*programmes/i);
          }
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2: Empty State Response - Call-to-Action Button Functionality', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should have prominent call-to-action buttons
          const joinButton = screen.getByText(/join with code/i);
          const browseButton = screen.getByText(/browse programmes/i);

          // Buttons should be clickable and call appropriate handlers
          fireEvent.click(joinButton);
          expect(onJoinWithCode).toHaveBeenCalledTimes(1);
          expect(mockPush).toHaveBeenCalledWith('/join');

          fireEvent.click(browseButton);
          expect(onBrowseProgrammes).toHaveBeenCalledTimes(1);
          expect(mockPush).toHaveBeenCalledWith('/discover');

          // Buttons should have proper styling for prominence
          expect(joinButton).toHaveClass('bg-[#391D65]', 'text-white');
          expect(browseButton).toHaveClass('border-[#391D65]', 'text-[#391D65]');
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 25 }
    );
  });

  it('Property 2: Empty State Response - Contextual Help Text Display', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should display contextual help section
          const helpSection = container.querySelector('.bg-blue-50');
          expect(helpSection).toBeInTheDocument();

          // Should contain helpful guidance
          const helpText = helpSection?.textContent || '';
          expect(helpText).toMatch(/how to get started/i);
          expect(helpText).toMatch(/enrollment code/i);
          expect(helpText).toMatch(/instructor/i);
          expect(helpText).toMatch(/browse.*programmes/i);
          expect(helpText).toMatch(/learning goals/i);

          // Should have proper visual styling for help section
          expect(helpSection).toHaveClass('bg-blue-50', 'border-blue-200');
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 25 }
    );
  });

  it('Property 2: Empty State Response - No Loading Indicators Present', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should NOT display any loading indicators when showing empty state
          expect(container.querySelector('.animate-spin')).toBeNull();
          expect(container.querySelector('.animate-pulse')).toBeNull();
          expect(container.querySelector('[role="status"][aria-live="polite"]')).toBeNull();
          expect(container.textContent).not.toMatch(/loading|fetching|please wait/i);

          // Should display static content immediately
          expect(screen.getByText(/join with code/i)).toBeInTheDocument();
          expect(screen.getByText(/browse programmes/i)).toBeInTheDocument();
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 2: Empty State Response - Visual Design and Accessibility', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should have proper visual hierarchy with headings
          const heading = container.querySelector('h2');
          expect(heading).toBeInTheDocument();
          expect(heading).toHaveClass('text-2xl', 'font-bold');

          // Should have illustration/icon for visual appeal
          const illustration = container.querySelector('.bg-gradient-to-br');
          expect(illustration).toBeInTheDocument();

          // Should have proper button styling for accessibility
          const buttons = container.querySelectorAll('button[class*="rounded-lg"]'); // Only check buttons with rounded-lg class
          buttons.forEach(button => {
            expect(button).toHaveClass('rounded-lg');
            expect(button.textContent?.trim()).toBeTruthy(); // Should have text content
          });

          // Should have at least the main CTA buttons
          expect(buttons.length).toBeGreaterThanOrEqual(2);

          // Should have proper color contrast (using brand colors)
          const primaryButton = screen.getByText(/join with code/i);
          expect(primaryButton).toHaveClass('bg-[#391D65]', 'text-white');
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 2: Empty State Response - User State Adaptation', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          const content = container.textContent;
          const isNew = new Date(userProfile.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isInactive = new Date(userProfile.lastLoginAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

          // Should adapt messaging based on user state
          if (isNew) {
            expect(content).toMatch(/welcome.*dashboard/i);
            expect(content).toMatch(/ready to begin/i);
          } else if (isInactive && !isNew) {
            expect(content).toMatch(/welcome back/i);
            expect(content).toMatch(/great to see you again/i);
            
            // Should show encouraging message for inactive users
            const encouragementSection = container.querySelector('.bg-green-50');
            expect(encouragementSection).toBeInTheDocument();
            expect(encouragementSection?.textContent).toMatch(/continue.*learning/i);
          } else {
            expect(content).toMatch(/not enrolled.*programmes/i);
          }

          // All states should still show the same call-to-action buttons
          expect(screen.getByText(/join with code/i)).toBeInTheDocument();
          expect(screen.getByText(/browse programmes/i)).toBeInTheDocument();
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 40 }
    );
  });

  it('Property 2: Empty State Response - Interactive Elements Functionality', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should have "Show me around" link for onboarding
          const showAroundLink = screen.getByText(/show me around/i);
          expect(showAroundLink).toBeInTheDocument();
          expect(showAroundLink).toHaveClass('underline');

          // Clicking should trigger onboarding display
          fireEvent.click(showAroundLink);
          
          // Should show onboarding modal after click
          waitFor(() => {
            const modal = container.querySelector('[role="dialog"]');
            expect(modal).toBeInTheDocument();
          });

          // All interactive elements should be keyboard accessible
          const interactiveElements = container.querySelectorAll('button, a, [tabindex]');
          interactiveElements.forEach(element => {
            expect(element).not.toHaveAttribute('tabindex', '-1');
          });
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 2: Empty State Response - Content Completeness and Structure', () => {
    fc.assert(
      fc.property(
        userProfileGenerator,
        (userProfile) => {
          cleanup(); // Clean up before each property test run
          
          const onJoinWithCode = jest.fn();
          const onBrowseProgrammes = jest.fn();

          const { container, unmount } = render(
            <EnhancedEmptyState
              userProfile={userProfile}
              onJoinWithCode={onJoinWithCode}
              onBrowseProgrammes={onBrowseProgrammes}
              showOnboarding={false}
            />
          );

          // Should have complete content structure
          const content = container.textContent;

          // 1. Welcoming message with user name (only for new or inactive users)
          const isNew = new Date(userProfile.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isInactive = new Date(userProfile.lastLoginAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          
          if (isNew || (isInactive && !isNew)) {
            expect(content).toContain(userProfile.name);
          }

          // 2. Call-to-action buttons
          expect(screen.getByText(/join with code/i)).toBeInTheDocument();
          expect(screen.getByText(/browse programmes/i)).toBeInTheDocument();

          // 3. Contextual help text
          expect(content).toMatch(/how to get started/i);
          expect(content).toMatch(/enrollment code/i);

          // 4. Additional help section
          expect(content).toMatch(/need help getting started/i);
          expect(screen.getByText(/show me around/i)).toBeInTheDocument();

          // Should have proper semantic structure
          expect(container.querySelector('h2')).toBeInTheDocument(); // Main heading
          expect(container.querySelector('h3')).toBeInTheDocument(); // Help section heading

          // Should have visual elements
          expect(container.querySelector('svg')).toBeInTheDocument(); // Icons
          expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument(); // Illustration
          
          unmount(); // Clean up after test
        }
      ),
      { numRuns: 25 }
    );
  });
});