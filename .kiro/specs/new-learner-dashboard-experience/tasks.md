# Implementation Plan: New Learner Dashboard Experience

## Overview

This implementation plan converts the design into discrete coding tasks that will fix the spinning preloader issue and enhance the new learner dashboard experience. The tasks focus on improving loading states, implementing proper empty state handling, adding error recovery, and optimizing performance for new learners.

## Tasks

- [x] 1. Create enhanced loading state management system
  - [x] 1.1 Implement LoadingStateManager component
    - Create TypeScript interfaces for loading states and phases
    - Implement conditional loading logic based on user enrollment status
    - Add timeout handling for long-running requests
    - _Requirements: 1.1, 1.4, 3.1, 3.2, 3.3_

  - [x] 1.2 Write property test for loading state management
    - **Property 1: Dashboard Loading Performance**
    - **Validates: Requirements 1.1, 1.4, 3.4, 6.1, 6.4**

  - [x] 1.3 Create SkeletonLoader component
    - Implement skeleton UI for dashboard sections
    - Add configurable skeleton patterns for different content types
    - Ensure accessibility with proper ARIA labels
    - _Requirements: 3.1, 7.1_

  - [x] 1.4 Write unit tests for SkeletonLoader
    - Test skeleton rendering with different configurations
    - Test accessibility attributes and ARIA labels
    - _Requirements: 3.1, 7.1_

- [-] 2. Enhance empty state experience
  - [x] 2.1 Upgrade EmptyState component to EnhancedEmptyState
    - Add welcoming messaging and improved visual design
    - Implement prominent call-to-action buttons
    - Add contextual help text and onboarding tips
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Write property test for empty state response
    - **Property 2: Empty State Response**
    - **Validates: Requirements 1.2, 2.1, 2.2, 2.3**

  - [x] 2.3 Implement onboarding flow components
    - Create OnboardingTips component with dismissible tips
    - Add first-visit detection and user preference storage
    - Implement encouraging messages for inactive users
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 2.4 Write property test for onboarding experience
    - **Property 6: Onboarding Experience**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 3. Implement navigation and interaction handling
  - [x] 3.1 Add navigation handlers to EmptyState buttons
    - Implement "Join with Code" navigation to enrollment page
    - Implement "Browse Programmes" navigation to discovery page
    - Add visual feedback for button interactions
    - _Requirements: 2.4, 2.5, 3.4_

  - [ ] 3.2 Write property test for navigation behavior
    - **Property 3: Navigation Behavior**
    - **Validates: Requirements 2.4, 2.5**

- [ ] 4. Checkpoint - Ensure loading and empty states work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement comprehensive error handling
  - [x] 5.1 Create ErrorRecoveryComponent
    - Implement error classification and user-friendly messaging
    - Add retry functionality with exponential backoff
    - Handle authentication errors with proper redirects
    - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4_

  - [ ] 5.2 Write property test for error handling and recovery
    - **Property 5: Error Handling and Recovery**
    - **Validates: Requirements 1.3, 4.1, 4.2, 4.3, 4.4**

  - [x] 5.3 Add ErrorBoundary wrapper for dashboard
    - Implement React error boundary for component errors
    - Add error logging and user-friendly fallback UI
    - Ensure graceful degradation for partial failures
    - _Requirements: 4.4_

  - [ ] 5.4 Write unit tests for error boundary
    - Test error catching and fallback rendering
    - Test error logging functionality
    - _Requirements: 4.4_

- [ ] 6. Optimize dashboard performance for new learners
  - [ ] 6.1 Implement conditional API fetching logic
    - Skip programme-specific API calls for users with no enrollments
    - Add enrollment count check before fetching dashboard data
    - Implement smart caching for user profile data
    - _Requirements: 6.2, 6.3_

  - [ ] 6.2 Write property test for performance optimization
    - **Property 7: Performance Optimization**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 6.3 Add performance monitoring and metrics
    - Implement timing measurements for key operations
    - Add performance logging for debugging
    - Monitor API call patterns for optimization
    - _Requirements: 6.1, 6.4_

- [ ] 7. Enhance accessibility and usability
  - [ ] 7.1 Implement comprehensive accessibility features
    - Add ARIA labels for all loading and empty states
    - Implement logical keyboard navigation tab order
    - Add screen reader announcements for state changes
    - Ensure color contrast compliance for all text
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 7.2 Write property test for accessibility compliance
    - **Property 8: Accessibility Compliance**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 8. Update dashboard page integration
  - [x] 8.1 Integrate new components into DashboardPage
    - Replace existing loading logic with LoadingStateManager
    - Replace EmptyState with EnhancedEmptyState
    - Add ErrorBoundary wrapper and error handling
    - Wire up all new components and event handlers
    - _Requirements: 1.1, 1.2, 2.1, 4.1_

  - [ ] 8.2 Write property test for loading state display
    - **Property 4: Loading State Display**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 8.3 Update useEnrolledProgrammes hook
    - Add better error handling and retry logic
    - Implement conditional fetching based on user status
    - Add caching and performance optimizations
    - _Requirements: 6.2, 6.3_

- [ ] 9. Final integration and testing
  - [ ] 9.1 Integration testing for complete user flows
    - Test new user signup → dashboard → empty state → join programme flow
    - Test error scenarios and recovery paths
    - Test performance under various network conditions
    - _Requirements: All requirements_

  - [ ] 9.2 Write integration tests for user flows
    - Test complete new learner onboarding experience
    - Test error recovery and retry functionality
    - _Requirements: All requirements_

- [x] 10. Final checkpoint - Ensure all functionality works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on TypeScript implementation with React components
- Maintain backward compatibility with existing dashboard functionality