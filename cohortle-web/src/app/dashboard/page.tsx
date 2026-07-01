'use client';

// DEPLOYMENT_MARKER: 2025-01-BUILD

/**
 * Dashboard Page
 * Enhanced learner dashboard with new learner experience improvements
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEnrolledProgrammes } from '@/lib/hooks/useEnrolledProgrammes';
import { LoadingStateManager } from '@/components/dashboard/LoadingStateManager';
import { EnhancedEmptyState } from '@/components/dashboard/EnhancedEmptyState';
import { OnboardingTips, useOnboardingTips, DEFAULT_ONBOARDING_TIPS } from '@/components/dashboard/OnboardingTips';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { ErrorRecoveryComponent, useErrorRecovery, classifyError } from '@/components/dashboard/ErrorRecoveryComponent';
import { useNavigationHandlers, NavigationFeedback } from '@/components/dashboard/NavigationHandlers';
import { ProgressCard, EnrolledProgramme as ProgressCardProgramme } from '@/components/dashboard/ProgressCard';
import { EnhancedProgressCard } from '@/components/dashboard/EnhancedProgressCard';
import { UpcomingSessionsList } from '@/components/dashboard/UpcomingSessionsList';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { ContinueLearning } from '@/components/dashboard/ContinueLearning';
import { DashboardSection, SessionsLoadingSkeleton, ActivityLoadingSkeleton, ProgrammesLoadingSkeleton } from '@/components/dashboard/DashboardSection';
import { getUpcomingSessions, getRecentActivity } from '@/lib/api/progress';
import { usePerformanceMonitoring } from '@/lib/utils/performanceMonitoring';
import { MyApplicationsSection } from '@/components/dashboard/MyApplicationsSection';
import { EngagementSummary } from '@/components/dashboard/EngagementSummary';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { trackCustomMetric, trackPageView } = usePerformanceMonitoring();
  
  // Error handling
  const { error: dashboardError, handleError, clearError } = useErrorRecovery();
  
  // Navigation handling
  const {
    isNavigating,
    navigationDestination,
    handleJoinWithCode,
    handleBrowseProgrammes,
  } = useNavigationHandlers({
    onNavigationStart: (destination) => {
      console.log(`Navigating to ${destination}`);
    },
    onNavigationError: (error, destination) => {
      handleError(error);
    },
  });

  // Only fetch programmes for students, not conveners
  const shouldFetchProgrammes = !authLoading && user?.role === 'student';
  const { data: programmes, isLoading, error, refetch } = useEnrolledProgrammes({ 
    enabled: shouldFetchProgrammes 
  });

  // State for dashboard data
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadingStartTime] = useState(Date.now());

  // Onboarding state
  const { shouldShowTips } = useOnboardingTips(user?.id || '');

  // Determine if user is new (created within last 24 hours)
  const isNewUser = useMemo(() => {
    // Since we don't have createdAt in the User type, we'll assume users without programmes are new
    // This is a reasonable heuristic for the new learner experience
    return programmes !== null && programmes.length === 0;
  }, [programmes]);

  // Calculate total loading duration
  const totalLoadingDuration = useMemo(() => {
    if (!isLoading && !dashboardLoading) {
      return Date.now() - loadingStartTime;
    }
    return 0;
  }, [isLoading, dashboardLoading, loadingStartTime]);

  // Track performance metrics
  useEffect(() => {
    if (!isLoading && !dashboardLoading) {
      const loadTime = Date.now() - loadingStartTime;
      trackCustomMetric('dashboard_load_time', loadTime);
      trackPageView('/dashboard');
      
      // Track programmes count for analytics
      if (programmes) {
        trackCustomMetric('user_programmes_count', programmes.length, 'count');
      }
    }
  }, [isLoading, dashboardLoading, loadingStartTime, programmes, trackCustomMetric, trackPageView]);

  // Redirect conveners to their dashboard
  useEffect(() => {
    if (!authLoading && user?.role === 'convener') {
      router.replace('/convener/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data (upcoming sessions and recent activity)
  useEffect(() => {
    let isMounted = true;
    
    async function fetchDashboardData() {
      if (!shouldFetchProgrammes) {
        if (isMounted) setDashboardLoading(false);
        return;
      }
      
      console.log('[Dashboard] Fetching dashboard data...', {
        shouldFetchProgrammes,
        programmesCount: programmes?.length,
        isNewUser,
      });
      
      try {
        if (isMounted) setDashboardLoading(true);
        
        // For new users with no programmes, skip additional API calls
        if (programmes && programmes.length === 0 && isNewUser) {
          console.log('[Dashboard] New user with no programmes, skipping API calls');
          if (isMounted) {
            setUpcomingSessions([]);
            setRecentActivity([]);
            setDashboardLoading(false);
          }
          return;
        }
        
        const [sessions, activity] = await Promise.all([
          getUpcomingSessions().catch(err => {
            console.error('[Dashboard] Failed to fetch upcoming sessions:', err);
            return []; // Return empty array on error
          }),
          getRecentActivity(5).catch(err => {
            console.error('[Dashboard] Failed to fetch recent activity:', err);
            return []; // Return empty array on error
          }),
        ]);
        
        console.log('[Dashboard] Data fetched successfully:', {
          sessionsCount: sessions.length,
          activitiesCount: activity.length,
        });
        
        if (isMounted) {
          setUpcomingSessions(sessions);
          setRecentActivity(activity);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to fetch dashboard data:', err);
        if (isMounted) {
          handleError(err);
        }
      } finally {
        if (isMounted) setDashboardLoading(false);
      }
    }

    // Only fetch once programmes data has loaded (not null = hook has resolved)
    if (!isLoading && programmes !== null) {
      fetchDashboardData();
    } else if (!isLoading && programmes === null) {
      if (isMounted) setDashboardLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [shouldFetchProgrammes, programmes, isNewUser, isLoading]);
  // Handle API errors
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#391D65]"></div>
      </div>
    );
  }

  // User should be authenticated at this point (middleware handles redirect)
  if (!user) {
    return null;
  }

  // If convener, show loading while redirecting
  if (user.role === 'convener') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F1FF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#391D65]"></div>
      </div>
    );
  }

  // Show error recovery if there's a dashboard error
  if (dashboardError) {
    return (
      <main className="min-h-screen bg-gray-50 py-8" role="main">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorRecoveryComponent
            error={dashboardError}
            onRetry={() => {
              clearError();
              refetch();
            }}
            onDismiss={clearError}
          />
        </div>
      </main>
    );
  }

  const isCurrentlyLoading = isLoading || dashboardLoading;

  return (
    <DashboardErrorBoundary>
      <main className="min-h-screen bg-gray-50 py-8" role="main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <header className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Learning Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Continue your learning journey
            </p>
          </header>

          {/* Loading State Management */}
          <LoadingStateManager
            isNewUser={isNewUser}
            loadingDuration={isCurrentlyLoading ? Date.now() - loadingStartTime : totalLoadingDuration}
            onTimeout={() => {
              console.warn('Dashboard loading timed out');
            }}
            onComplete={() => {
              console.log('Dashboard loading completed');
            }}
          >
            {/* Content */}
            {!programmes || programmes.length === 0 ? (
              <>
                <EnhancedEmptyState
                  userProfile={{
                    id: user.id,
                    email: user.email,
                    name: user.name || user.email,
                    role: (user.role as 'student' | 'convener') || 'student',
                    createdAt: new Date(),
                    lastLoginAt: new Date(),
                    onboardingCompleted: false,
                    preferences: {
                      showOnboardingTips: true,
                      preferredLoadingStyle: 'skeleton',
                      dismissedMessages: [],
                    },
                  }}
                  onJoinWithCode={handleJoinWithCode}
                  onBrowseProgrammes={handleBrowseProgrammes}
                  showOnboarding={shouldShowTips}
                />
                {/* Show pending applications even when no programmes enrolled */}
                <MyApplicationsSection />
              </>
            ) : (
              <div className="space-y-6">
                {/* Continue Learning Section */}
                <section aria-labelledby="continue-learning-heading">
                  <ContinueLearning />
                </section>

                {/* Two Column Layout for Sessions and Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <DashboardSection
                      title="Upcoming Live Sessions"
                      isLoading={dashboardLoading}
                      isEmpty={upcomingSessions.length === 0}
                      loadingComponent={<SessionsLoadingSkeleton />}
                      onRetry={async () => {
                        try {
                          const sessions = await getUpcomingSessions();
                          setUpcomingSessions(sessions);
                        } catch (err) {
                          console.error('Failed to refresh sessions:', err);
                        }
                      }}
                    >
                      <UpcomingSessionsList sessions={upcomingSessions} maxDisplay={5} />
                    </DashboardSection>

                    <DashboardSection
                      title="Recent Activity"
                      isLoading={dashboardLoading}
                      isEmpty={recentActivity.length === 0}
                      loadingComponent={<ActivityLoadingSkeleton />}
                      onRetry={async () => {
                        try {
                          const activity = await getRecentActivity(5);
                          setRecentActivity(activity);
                        } catch (err) {
                          console.error('Failed to refresh activity:', err);
                        }
                      }}
                    >
                      <RecentActivityFeed activities={recentActivity} maxDisplay={5} />
                    </DashboardSection>
                  </div>

                  {/* Engagement sidebar */}
                  <div className="min-h-[280px]">
                    <EngagementSummary />
                  </div>
                </div>

                {/* My Programmes Section */}
                <DashboardSection
                  title="My Programmes"
                  isLoading={isLoading}
                  isEmpty={programmes.length === 0}
                  loadingComponent={<ProgrammesLoadingSkeleton />}
                  onRetry={refetch}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {programmes.map((programme) => (
                      <EnhancedProgressCard
                        key={programme.id}
                        programme={{
                          id: programme.id,
                          name: programme.name,
                          description: programme.description,
                          thumbnail: undefined, // Not available in current API
                          cohortName: `Cohort ${programme.cohortId}`, // Placeholder
                          cohortId: programme.cohortId,
                          nextLesson: undefined, // Not available in current API
                        }}
                        onClick={() => router.push(`/programmes/${programme.id}`)}
                      />
                    ))}
                  </div>
                </DashboardSection>

                {/* My Applications — Requirement 9.1 */}
                <MyApplicationsSection />
              </div>
            )}
          </LoadingStateManager>

          {/* Onboarding Tips */}
          {shouldShowTips && user && (
            <OnboardingTips
              tips={DEFAULT_ONBOARDING_TIPS}
              userId={user.id}
              onComplete={() => {
                console.log('Onboarding completed');
              }}
            />
          )}

          {/* Navigation Feedback */}
          <NavigationFeedback
            isNavigating={isNavigating}
            destination={navigationDestination}
          />
        </div>
      </main>
    </DashboardErrorBoundary>
  );
}
