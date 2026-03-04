# Design Document: New Learner Dashboard Experience

## Overview

This design enhances the learner dashboard to provide a smooth, informative experience for new users who haven't enrolled in any programmes yet. The current implementation causes a spinning preloader that never resolves for new learners, creating confusion and a poor first impression.

The solution involves implementing proper loading states, enhanced empty state components, improved error handling, and performance optimizations specifically tailored for new learners. The design ensures that all users, regardless of enrollment status, receive appropriate feedback and clear guidance on next steps.

## Architecture

### Component Hierarchy

```
DashboardPage
├── LoadingStateManager
│   ├── SkeletonLoader
│   └── ProgressIndicator
├── ErrorBoundary
│   └── ErrorRecoveryComponent
├── EmptyStateEnhanced
│   ├── WelcomeMessage
│   ├── ActionButtons
│   └── OnboardingTips
└── EnrolledProgrammesSection
    ├── ProgrammeCards
    └── ContinueLearning
```

### Data Flow

1. **Authentication Check**: Verify user authentication and role
2. **Conditional Data Fetching**: Only fetch programme data for users likely to have enrollments
3. **Progressive Loading**: Show skeleton states while loading, then render appropriate content
4. **Error Handling**: Catch and handle API failures gracefully
5. **State Management**: Maintain loading, error, and data states separately

## Components and Interfaces

### LoadingStateManager

Manages different loading states based on user context and API response times.

```typescript
interface LoadingStateManagerProps {
  isNewUser: boolean;
  loadingDuration: number;
  children: React.ReactNode;
}

interface LoadingState {
  phase: 'initial' | 'fetching' | 'timeout' | 'complete';
  message: string;
  showSkeleton: boolean;
}
```

### EnhancedEmptyState

Improved empty state component with onboarding guidance and clear call-to-actions.

```typescript
interface EnhancedEmptyStateProps {
  userProfile: UserProfile;
  onJoinWithCode: () => void;
  onBrowseProgrammes: () => void;
  onDismissOnboarding: () => void;
  showOnboarding: boolean;
}

interface OnboardingState {
  isFirstVisit: boolean;
  hasSeenTips: boolean;
  lastVisitDate: Date | null;
}
```

### ErrorRecoveryComponent

Handles various error scenarios with appropriate recovery actions.

```typescript
interface ErrorRecoveryProps {
  error: ApiError;
  onRetry: () => void;
  onReportIssue: () => void;
}

interface ApiError {
  type: 'network' | 'authentication' | 'server' | 'timeout';
  message: string;
  statusCode?: number;
  retryable: boolean;
}
```

### DashboardDataManager

Optimized data fetching that adapts to user enrollment status.

```typescript
interface DashboardDataManager {
  fetchUserData(): Promise<UserDashboardData>;
  fetchProgrammeData(userId: string): Promise<EnrolledProgramme[]>;
  prefetchOnboardingData(): Promise<OnboardingContent>;
}

interface UserDashboardData {
  profile: UserProfile;
  enrollmentCount: number;
  lastActivity: Date | null;
  preferences: UserPreferences;
}
```

## Data Models

### Enhanced User Profile

```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'convener';
  createdAt: Date;
  lastLoginAt: Date;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
}

interface UserPreferences {
  showOnboardingTips: boolean;
  preferredLoadingStyle: 'skeleton' | 'spinner';
  dismissedMessages: string[];
}
```

### Loading State Models

```typescript
interface LoadingPhase {
  name: string;
  duration: number;
  message: string;
  showProgress: boolean;
}

interface SkeletonConfig {
  showHeader: boolean;
  showProgrammeCards: number;
  showSidebar: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}
```

### Error State Models

```typescript
interface ErrorState {
  hasError: boolean;
  errorType: ErrorType;
  message: string;
  recoveryActions: RecoveryAction[];
  timestamp: Date;
}

interface RecoveryAction {
  label: string;
  action: () => void;
  primary: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the requirements analysis, the following properties ensure the system behaves correctly across all scenarios:

### Property 1: Dashboard Loading Performance
*For any* user visiting the dashboard, the system should complete initial page structure rendering within 1 second, complete all data loading within 3 seconds for new learners, provide visual feedback for interactions within 200ms, maintain navigation performance under 500ms, and never show loading indicators for more than 10 seconds under any circumstances.
**Validates: Requirements 1.1, 1.4, 3.4, 6.1, 6.4**

### Property 2: Empty State Response
*For any* API response containing an empty programmes array, the dashboard should immediately display the enhanced empty state with welcoming message, call-to-action buttons, and contextual help text instead of continuing to show loading indicators.
**Validates: Requirements 1.2, 2.1, 2.2, 2.3**

### Property 3: Navigation Behavior
*For any* click on call-to-action buttons in the empty state, the system should navigate to the correct destination page ("Join with Code" → enrollment page, "Browse Programmes" → discovery page) within the expected timeframe.
**Validates: Requirements 2.4, 2.5**

### Property 4: Loading State Display
*For any* loading phase (user data, API requests, extended loading), the dashboard should display appropriate loading indicators (skeleton states, progress indicators, timeout messages) instead of blank pages or indefinite spinners.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Error Handling and Recovery
*For any* API error (enrollment failures, network errors, authentication errors), the dashboard should display user-friendly error messages, provide appropriate recovery actions (retry buttons, login redirects), and log detailed information for debugging while showing simplified messages to users.
**Validates: Requirements 1.3, 4.1, 4.2, 4.3, 4.4**

### Property 6: Onboarding Experience
*For any* new learner (first visit, inactive for 7+ days), the dashboard should provide contextual onboarding tips, highlight key actions, show encouraging messages, and maintain dismissible but accessible onboarding flow.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Performance Optimization
*For any* learner with no enrollments, the dashboard should skip unnecessary API calls for programme-specific data, cache user profile data to avoid repeated authentication checks, and maintain optimal performance.
**Validates: Requirements 6.2, 6.3**

### Property 8: Accessibility Compliance
*For any* dashboard state (loading, empty, error), the system should provide appropriate ARIA labels, maintain logical keyboard navigation tab order, announce state changes to screen readers, and ensure sufficient color contrast for visual accessibility.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

## Error Handling

### Error Classification

1. **Network Errors**: Connection timeouts, DNS failures, offline scenarios
2. **API Errors**: Server errors (5xx), client errors (4xx), malformed responses
3. **Authentication Errors**: Token expiration, invalid credentials, permission issues
4. **Performance Errors**: Slow responses, memory issues, rendering problems

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  errorType: ErrorType;
  retryable: boolean;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  fallbackAction: () => void;
}

const errorStrategies: ErrorRecoveryStrategy[] = [
  {
    errorType: 'network',
    retryable: true,
    maxRetries: 3,
    backoffStrategy: 'exponential',
    fallbackAction: () => showOfflineMode()
  },
  {
    errorType: 'authentication',
    retryable: false,
    maxRetries: 0,
    backoffStrategy: 'linear',
    fallbackAction: () => redirectToLogin()
  }
];
```

### Graceful Degradation

When errors occur, the system should degrade gracefully:

1. **Partial Data Loading**: Show available data even if some API calls fail
2. **Cached Content**: Display cached user profile while retrying programme data
3. **Offline Mode**: Provide basic functionality when network is unavailable
4. **Progressive Enhancement**: Start with basic functionality and enhance as data loads

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific scenarios and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific error scenarios and edge cases
- Component rendering with different props
- User interaction flows (clicking buttons, navigation)
- Integration between components and API services
- Accessibility compliance for specific components

**Property-Based Tests** focus on:
- Universal properties across all user states and data combinations
- Performance characteristics under various conditions
- Error handling across different failure modes
- Loading state behavior with randomized timing
- Comprehensive input validation and edge case coverage

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: new-learner-dashboard-experience, Property {number}: {property_text}**

### Test Coverage Areas

1. **Loading Performance**: Measure and verify timing requirements across different scenarios
2. **State Transitions**: Test all possible state changes (loading → loaded, loading → error, etc.)
3. **User Interactions**: Verify all clickable elements and navigation paths
4. **Error Scenarios**: Simulate various failure modes and verify recovery
5. **Accessibility**: Test keyboard navigation, screen reader compatibility, color contrast
6. **Performance**: Monitor API call patterns, caching behavior, render performance

### Integration Testing

Integration tests verify the complete user journey:

1. **New User Flow**: Sign up → Dashboard → Empty State → Join Programme
2. **Error Recovery Flow**: API Failure → Error Display → Retry → Success
3. **Performance Flow**: Slow Network → Loading States → Timeout → Recovery
4. **Accessibility Flow**: Keyboard Navigation → Screen Reader → Visual Impairment Support