# Implementation Plan: Web Student Authentication and Dashboard

## Overview

This implementation plan breaks down the web student authentication and dashboard feature into incremental coding tasks. Each task builds on previous work, starting with core authentication infrastructure, then adding the dashboard and navigation hierarchy, and finally integrating with the existing lesson viewer.

The implementation follows a bottom-up approach: foundational utilities and API clients first, then authentication context and middleware, followed by UI components, and finally page-level integration.

## Tasks

- [x] 1. Set up authentication infrastructure
  - [x] 1.1 Create validation utilities
    - Implement email validation function using standard regex
    - Implement password validation (minimum 8 characters)
    - Implement required field validation
    - Create form error handling utilities
    - _Requirements: 1.5, 1.6, 1.7, 2.6, 10.6, 10.7, 10.8_
  
  - [ ]* 1.2 Write property tests for validation utilities
    - **Property 1: Email validation consistency**
    - **Property 2: Password length validation**
    - **Property 3: Required field validation**
    - **Validates: Requirements 1.5, 1.6, 1.7, 2.6, 10.6, 10.7, 10.8**
  
  - [x] 1.3 Create token storage utilities
    - Implement getStoredToken() function
    - Implement storeToken() function (HTTP-only cookie or localStorage)
    - Implement clearToken() function
    - Add token validation helper
    - _Requirements: 2.3, 2.7, 3.1, 4.2_
  
  - [ ]* 1.4 Write property tests for token storage
    - **Property 6: Token storage after successful login**
    - **Property 8: Session persistence across page refreshes**
    - **Validates: Requirements 2.3, 2.7, 3.1, 3.2, 3.5**

- [x] 2. Extend API client for authentication
  - [x] 2.1 Add authentication interceptors to existing API client
    - Add request interceptor to inject JWT token in Authorization header
    - Add response interceptor to handle 401 errors (clear token, redirect to login)
    - Add error handling for network failures
    - _Requirements: 3.3, 3.4, 13.2_
  
  - [x] 2.2 Implement authentication API functions
    - Create register() function (POST /api/auth/register)
    - Create login() function (POST /api/auth/login)
    - Create logout() function (POST /api/auth/logout)
    - Create requestPasswordReset() function
    - Create resetPassword() function
    - _Requirements: 1.2, 2.2, 4.1, 5.2, 5.5_
  
  - [ ]* 2.3 Write property tests for authentication API functions
    - **Property 4: Registration API call correctness**
    - **Property 5: Login API call correctness**
    - **Property 25: Authentication token injection**
    - **Validates: Requirements 1.2, 2.2, 13.2**
  
  - [x] 2.4 Implement user and programme API functions
    - Create getUserProfile() function (GET /api/user/profile)
    - Create getUserCommunities() function (GET /api/user/communities)
    - Create getCommunityModules() function (GET /api/communities/:id/modules)
    - Create getModuleLessons() function (GET /api/modules/:id/lessons)
    - _Requirements: 6.1, 7.1, 8.1, 14.1_
  
  - [ ]* 2.5 Write property tests for data fetching API functions
    - **Property 14: Data fetching on page load**
    - **Validates: Requirements 6.1, 7.1, 8.1, 14.1**

- [x] 3. Create authentication context and hooks
  - [x] 3.1 Implement AuthContext provider
    - Create AuthContext with user state, isAuthenticated, isLoading
    - Implement login method
    - Implement signup method
    - Implement logout method
    - Implement password reset methods
    - Initialize auth state from stored token on mount
    - _Requirements: 2.3, 2.4, 3.1, 3.2, 4.2, 4.3_
  
  - [x] 3.2 Create useAuth hook
    - Export hook to access AuthContext
    - Add error handling for context usage outside provider
    - _Requirements: All authentication requirements_
  
  - [ ]* 3.3 Write unit tests for AuthContext
    - Test successful login flow
    - Test successful logout flow
    - Test token initialization on mount
    - Test error handling
    - _Requirements: 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_
  
  - [x] 3.4 Create TanStack Query hooks for data fetching
    - Implement useUserProfile() hook
    - Implement useUserCommunities() hook
    - Implement useCommunityModules(communityId) hook
    - Implement useModuleLessons(moduleId) hook
    - Configure appropriate staleTime for each hook
    - _Requirements: 6.1, 7.1, 8.1, 14.1_

- [x] 4. Implement authentication middleware
  - [x] 4.1 Create or extend Next.js middleware for route protection
    - Define protected routes array
    - Define auth-only routes array
    - Check for auth token in cookies
    - Redirect unauthenticated users to login with redirect parameter
    - Redirect authenticated users away from auth pages to dashboard
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_
  
  - [ ]* 4.2 Write property tests for route protection
    - **Property 11: Protected route redirection**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.7**
  
  - [ ]* 4.3 Write unit tests for middleware
    - Test redirect to login for unauthenticated access
    - Test redirect to dashboard for authenticated access to auth pages
    - Test preservation of intended destination URL
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 5. Checkpoint - Ensure authentication infrastructure works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Build reusable UI components
  - [x] 6.1 Create form input components
    - Implement FormInput component with label, error display, and validation states
    - Implement LoadingSpinner component
    - Implement ErrorMessage component
    - Add proper accessibility attributes (aria-labels, aria-invalid)
    - _Requirements: 10.1, 10.5, 11.1_
  
  - [x] 6.2 Create LogoutButton component
    - Implement button that calls logout from useAuth
    - Add loading state during logout
    - Handle logout errors gracefully
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 6.3 Write unit tests for UI components
    - Test FormInput with various states (valid, invalid, disabled)
    - Test LogoutButton click behavior
    - Test error message display
    - _Requirements: 10.1, 10.4, 10.5_

- [x] 7. Implement authentication forms
  - [x] 7.1 Create LoginForm component
    - Implement form with email and password fields
    - Add client-side validation
    - Handle form submission with loading state
    - Display validation and API errors
    - Add "Forgot Password?" link
    - Focus first invalid field on error
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 10.1, 10.4, 10.5_
  
  - [ ]* 7.2 Write property tests for LoginForm
    - **Property 7: Post-login navigation**
    - **Property 21: Form submission loading state**
    - **Property 24: Validation error display**
    - **Validates: Requirements 2.4, 9.6, 10.1, 10.4, 10.5**
  
  - [x] 7.3 Create SignupForm component
    - Implement form with email, username, and password fields
    - Add client-side validation
    - Handle form submission with loading state
    - Display validation and API errors
    - Redirect to login on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ]* 7.4 Write unit tests for SignupForm
    - Test successful registration flow
    - Test validation error display
    - Test duplicate email/username error handling
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 7.5 Create ForgotPasswordForm component
    - Implement form with email field
    - Handle form submission
    - Display confirmation message on success
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 7.6 Create ResetPasswordForm component
    - Implement form with new password and confirm password fields
    - Add password validation
    - Handle form submission
    - Redirect to login on success
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ]* 7.7 Write property tests for password reset flow
    - **Property 12: Password reset API flow**
    - **Property 13: Password update completion**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6**

- [x] 8. Create authentication pages
  - [x] 8.1 Create login page (app/(auth)/login/page.tsx)
    - Render LoginForm component
    - Add page title and description
    - Add link to signup page
    - Handle redirect parameter from URL
    - _Requirements: 2.1, 9.6_
  
  - [x] 8.2 Create signup page (app/(auth)/signup/page.tsx)
    - Render SignupForm component
    - Add page title and description
    - Add link to login page
    - _Requirements: 1.1_
  
  - [x] 8.3 Create forgot password page (app/(auth)/forgot-password/page.tsx)
    - Render ForgotPasswordForm component
    - Add page title and instructions
    - _Requirements: 5.1_
  
  - [x] 8.4 Create reset password page (app/(auth)/reset-password/page.tsx)
    - Render ResetPasswordForm component
    - Extract reset token from URL query parameter
    - Add page title and instructions
    - _Requirements: 5.4_
  
  - [ ]* 8.5 Write integration tests for authentication flow
    - Test complete signup → login → dashboard flow
    - Test logout flow
    - Test password reset flow
    - _Requirements: 1.2, 1.3, 2.2, 2.4, 4.1, 4.2, 4.3, 5.2, 5.5, 5.6_

- [ ] 9. Checkpoint - Ensure authentication pages work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Build dashboard components
  - [x] 10.1 Create WelcomeHeader component
    - Display welcome message with user's name
    - Show user profile picture or initials
    - Add logout button
    - _Requirements: 6.6, 14.2, 14.4_
  
  - [x] 10.2 Create ProgrammeCard component
    - Display programme name, description, and thumbnail
    - Show module count and progress bar
    - Make card clickable to navigate to programme detail
    - Handle missing thumbnail gracefully
    - _Requirements: 6.3, 6.5_
  
  - [ ]* 10.3 Write property tests for ProgrammeCard
    - **Property 16: Required item information display**
    - **Property 17: Item click navigation**
    - **Validates: Requirements 6.3, 6.5**
  
  - [x] 10.4 Create ProgrammeList component
    - Render list of ProgrammeCard components
    - Handle empty state (no programmes enrolled)
    - Display loading state while fetching
    - Display error state with retry button
    - _Requirements: 6.2, 6.4, 11.1_
  
  - [ ]* 10.5 Write property tests for ProgrammeList
    - **Property 15: Complete list rendering**
    - **Property 22: Data loading indicators**
    - **Validates: Requirements 6.2, 11.1**
  
  - [x] 10.6 Create ContinueLearning component
    - Fetch user's last accessed lesson
    - Display "Continue Learning" card with lesson info
    - Link to lesson viewer
    - Handle case where no lesson has been accessed
    - _Requirements: 6.7_

- [x] 11. Create dashboard page
  - [x] 11.1 Implement dashboard page (app/(protected)/dashboard/page.tsx)
    - Use useAuth to get user data
    - Use useUserCommunities to fetch programmes
    - Render WelcomeHeader component
    - Render ContinueLearning component
    - Render ProgrammeList component
    - Handle loading and error states
    - _Requirements: 6.1, 6.2, 6.6, 6.7, 14.1, 14.2_
  
  - [ ]* 11.2 Write property tests for dashboard
    - **Property 19: User information display**
    - **Property 30: Profile picture conditional rendering**
    - **Validates: Requirements 6.6, 14.2, 14.4**
  
  - [ ]* 11.3 Write unit tests for dashboard page
    - Test successful data load and display
    - Test empty state
    - Test error state
    - Test loading state
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 12. Build programme detail components
  - [x] 12.1 Create ProgrammeHeader component
    - Display programme name and description
    - Add breadcrumb navigation (Dashboard > Programme)
    - _Requirements: 7.5_
  
  - [x] 12.2 Create ModuleCard component
    - Display module name, description, and lesson count
    - Show completed lessons count
    - Make card clickable to navigate to module detail
    - _Requirements: 7.3, 7.4_
  
  - [x] 12.3 Create ModuleList component
    - Render list of ModuleCard components
    - Display loading state while fetching
    - Display error state with retry button
    - _Requirements: 7.2, 7.6, 11.1_
  
  - [ ]* 12.4 Write property tests for programme components
    - **Property 18: Parent context display**
    - **Validates: Requirements 7.5**

- [x] 13. Create programme detail page
  - [x] 13.1 Implement programme page (app/(protected)/programmes/[id]/page.tsx)
    - Extract programme ID from URL params
    - Use useCommunityModules to fetch modules
    - Render ProgrammeHeader component
    - Render ModuleList component
    - Handle loading and error states
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [ ]* 13.2 Write unit tests for programme page
    - Test successful data load and display
    - Test error state with retry
    - Test loading state
    - _Requirements: 7.1, 7.2, 7.6_

- [x] 14. Build module detail components
  - [x] 14.1 Create ModuleHeader component
    - Display module name and description
    - Add breadcrumb navigation (Dashboard > Programme > Module)
    - _Requirements: 8.5_
  
  - [x] 14.2 Create LessonCard component
    - Display lesson title, type icon, and duration
    - Show completion status (checkmark if completed)
    - Make card clickable to navigate to lesson viewer
    - _Requirements: 8.3, 8.4, 8.6_
  
  - [ ]* 14.3 Write property tests for LessonCard
    - **Property 20: Lesson completion status visibility**
    - **Property 28: Lesson viewer integration**
    - **Validates: Requirements 8.6, 13.1, 13.2, 13.3**
  
  - [x] 14.4 Create LessonList component
    - Render list of LessonCard components
    - Display loading state while fetching
    - Display error state with retry button
    - _Requirements: 8.2, 8.7, 11.1_

- [x] 15. Create module detail page
  - [x] 15.1 Implement module page (app/(protected)/modules/[id]/page.tsx)
    - Extract module ID from URL params
    - Use useModuleLessons to fetch lessons
    - Render ModuleHeader component
    - Render LessonList component
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.5, 8.7_
  
  - [ ]* 15.2 Write unit tests for module page
    - Test successful data load and display
    - Test error state with retry
    - Test loading state
    - Test lesson completion status display
    - _Requirements: 8.1, 8.2, 8.6, 8.7_

- [ ] 16. Checkpoint - Ensure navigation hierarchy works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Integrate with existing lesson viewer
  - [x] 17.1 Update lesson viewer to support back navigation
    - Add "Back to Module" button/link in lesson viewer
    - Extract module ID from lesson data or URL
    - Link back to module detail page
    - _Requirements: 13.5_
  
  - [x] 17.2 Ensure lesson viewer receives authentication token
    - Verify API client token injection works for lesson viewer
    - Test that lesson viewer redirects to login if unauthenticated
    - _Requirements: 13.2, 9.4_
  
  - [x] 17.3 Implement completion status synchronization
    - When lesson is marked complete, invalidate module lessons query
    - Ensure completion status updates in module view after returning
    - _Requirements: 13.4_
  
  - [ ]* 17.4 Write property tests for lesson viewer integration
    - **Property 29: Completion status synchronization**
    - **Validates: Requirements 13.4**
  
  - [ ]* 17.5 Write integration tests for navigation flow
    - Test complete flow: Dashboard → Programme → Module → Lesson → Back to Module
    - Test completion status updates after marking lesson complete
    - _Requirements: 6.5, 7.4, 8.4, 13.1, 13.4, 13.5_

- [x] 18. Add responsive design and styling
  - [x] 18.1 Implement responsive layouts with Tailwind CSS
    - Add responsive grid for programme/module/lesson lists
    - Ensure multi-column layout on desktop (≥1024px)
    - Ensure single-column layout on mobile (≤767px)
    - Ensure tablet layout adapts appropriately (768-1023px)
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ]* 18.2 Write property tests for responsive design
    - **Property 26: Responsive layout adaptation**
    - **Property 27: Navigation accessibility across viewports**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.6**
  
  - [x] 18.3 Ensure touch targets and accessibility
    - Ensure all interactive elements are minimum 44x44px
    - Add proper ARIA labels and roles
    - Ensure keyboard navigation works
    - Test with screen reader
    - _Requirements: 12.4, 12.6_
  
  - [x] 18.4 Add loading skeletons and transitions
    - Replace loading spinners with skeleton screens where appropriate
    - Add smooth transitions for navigation
    - Implement optimistic updates for better perceived performance
    - _Requirements: 11.1, 11.3_

- [ ] 19. Implement comprehensive error handling
  - [ ] 19.1 Add error boundaries
    - Create ErrorBoundary component
    - Wrap main app sections with error boundaries
    - Display user-friendly error messages
    - Provide refresh/retry options
    - _Requirements: 10.2, 10.3_
  
  - [ ] 19.2 Add specific error handling for all API calls
    - Handle 401 errors (expired/invalid token)
    - Handle 404 errors (resource not found)
    - Handle 409 errors (duplicate email/username)
    - Handle 500 errors (server errors)
    - Handle network errors (timeout, connection failed)
    - _Requirements: 1.4, 2.5, 3.3, 3.4, 4.4, 7.6, 8.7, 10.2, 10.3_
  
  - [ ]* 19.3 Write unit tests for error handling
    - Test all error scenarios
    - Test error message display
    - Test retry functionality
    - Test error recovery strategies
    - _Requirements: 1.4, 2.5, 3.3, 3.4, 7.6, 8.7, 10.2, 10.3_

- [ ] 20. Add profile functionality
  - [ ] 20.1 Create profile section in dashboard
    - Display user name, email, and profile picture
    - Add link to profile settings (placeholder for now)
    - _Requirements: 14.2, 14.3, 14.5_
  
  - [ ]* 20.2 Write unit tests for profile display
    - Test profile information rendering
    - Test profile picture display (with and without image)
    - _Requirements: 14.2, 14.4_

- [ ] 21. Final checkpoint - Ensure all features work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Performance optimization and polish
  - [ ] 22.1 Implement code splitting and lazy loading
    - Lazy load dashboard components
    - Lazy load programme/module detail pages
    - Implement route-based code splitting
    - _Requirements: Performance optimization_
  
  - [ ] 22.2 Add data prefetching
    - Prefetch programme data on hover
    - Prefetch module data on hover
    - Implement optimistic navigation
    - _Requirements: Performance optimization_
  
  - [ ] 22.3 Optimize images
    - Use Next.js Image component for all images
    - Implement lazy loading for images
    - Provide appropriate image sizes for different viewports
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 22.4 Add final polish
    - Ensure consistent spacing and typography
    - Add smooth transitions and animations
    - Test on multiple browsers and devices
    - Fix any remaining UI/UX issues
    - _Requirements: All UI requirements_

- [ ] 23. Final testing and validation
  - [ ]* 23.1 Run all property-based tests
    - Verify all 30 properties pass with 100+ iterations
    - Fix any failing properties
    - _Requirements: All requirements_
  
  - [ ]* 23.2 Run all unit and integration tests
    - Ensure 100% of tests pass
    - Fix any failing tests
    - _Requirements: All requirements_
  
  - [ ] 23.3 Manual testing checklist
    - Test complete signup flow
    - Test complete login flow
    - Test password reset flow
    - Test dashboard navigation
    - Test programme → module → lesson navigation
    - Test logout from various pages
    - Test session persistence across page refreshes
    - Test protected route redirects
    - Test responsive design on different devices
    - Test error handling scenarios
    - _Requirements: All requirements_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user flows
- The implementation builds incrementally: infrastructure → auth → dashboard → navigation → integration
