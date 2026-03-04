# Implementation Plan: WLIMP Programme Rollout

## Overview

This implementation plan breaks down the WLIMP Programme Rollout feature into incremental coding tasks. The approach follows a bottom-up strategy: database schema → backend services → API endpoints → frontend components → integration. Each task builds on previous work, with property-based tests placed close to implementation to catch errors early.

The implementation prioritizes the learner enrollment and content access flow first, followed by content management capabilities for conveners.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration files for programmes, cohorts, weeks, lessons, and enrollments tables
  - Add indexes for performance (enrollment_code, user_id, cohort_id, programme_id, week_id)
  - Run migrations on development database
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [ ] 2. Implement backend data models and services
  - [x] 2.1 Create TypeScript interfaces for Programme, Cohort, Week, Lesson, Enrollment
    - Define interfaces matching database schema
    - Add validation types for input data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

  - [x] 2.2 Write property test for programme creation round trip
    - **Property 1: Programme Creation Round Trip**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Implement EnrollmentService with code validation and enrollment logic
    - Create validateCode method to check code format and existence
    - Create checkExistingEnrollment method to prevent duplicates
    - Create enrollLearner method to create enrollment records
    - _Requirements: 2.1, 2.4, 2.6, 2.7_

  - [x] 2.4 Write property test for enrollment idempotency
    - **Property 7: Enrollment Idempotency**
    - **Validates: Requirements 2.1, 2.7**

  - [x] 2.5 Write property test for invalid code rejection
    - **Property 8: Invalid Code Rejection**
    - **Validates: Requirements 2.4, 2.6**

  - [x] 2.6 Implement ProgrammeService with current week calculation
    - Create getProgrammeById method
    - Create getCurrentWeek method using date calculation logic
    - Create getProgrammeWeeks method with week filtering
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 2.7 Write property test for current week calculation
    - **Property 9: Current Week Calculation**
    - **Validates: Requirements 3.2**

  - [x] 2.8 Write property test for week visibility filtering
    - **Property 11: Week Visibility Filtering**
    - **Validates: Requirements 3.5**

  - [x] 2.9 Implement ContentService for weeks and lessons management
    - Create getWeekLessons method
    - Create getLessonById method
    - Create createWeek, createLesson methods
    - Create updateLessonOrder method
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 7.3, 7.4, 7.5_

  - [x] 2.10 Write property test for lesson-week association
    - **Property 4: Lesson-Week Association**
    - **Validates: Requirements 1.4**

  - [x] 2.11 Write property test for external content URL storage
    - **Property 5: External Content URL Storage**
    - **Validates: Requirements 1.5**

  - [x] 2.12 Write property test for lesson reordering preservation
    - **Property 6: Lesson Reordering Preservation**
    - **Validates: Requirements 1.6**

- [x] 3. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement API endpoints
  - [x] 4.1 Create POST /api/v1/programmes/enroll endpoint
    - Validate request body (code format)
    - Call EnrollmentService to process enrollment
    - Return programme and cohort data on success
    - Handle errors (invalid code, duplicate enrollment)
    - _Requirements: 2.1, 2.4, 2.6, 2.7_

  - [ ]* 4.2 Write unit tests for enrollment endpoint
    - Test valid code enrollment
    - Test invalid code format rejection
    - Test non-existent code rejection
    - Test duplicate enrollment idempotency
    - _Requirements: 2.1, 2.4, 2.6, 2.7_

  - [x] 4.3 Create GET /api/v1/programmes/:id endpoint
    - Fetch programme metadata
    - Calculate current week
    - Return programme data with current week indicator
    - _Requirements: 3.1, 3.2_

  - [x] 4.4 Create GET /api/v1/programmes/:id/weeks endpoint
    - Fetch weeks for programme
    - Filter to show only past and current weeks
    - Include lessons for each week
    - Sort lessons by order_index
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 4.5 Write property test for programme page structure
    - **Property 10: Programme Page Structure**
    - **Validates: Requirements 3.1, 3.3, 3.4**

  - [x] 4.6 Create GET /api/v1/lessons/:id endpoint
    - Fetch lesson by ID
    - Include week and programme metadata
    - Return lesson content with type and URL
    - _Requirements: 4.1, 4.2_

  - [ ]* 4.7 Write unit tests for lesson endpoint
    - Test lesson retrieval with valid ID
    - Test 404 for non-existent lesson
    - Test unauthorized access (not enrolled)
    - _Requirements: 4.1, 4.2_

- [x] 5. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement frontend API client functions
  - [x] 6.1 Add enrollInProgramme function to API client
    - Create POST request to enrollment endpoint
    - Handle response and errors
    - Return programme data on success
    - _Requirements: 2.1_

  - [x] 6.2 Add getProgrammeWeeks function to API client
    - Create GET request to weeks endpoint
    - Parse and return weeks with lessons
    - _Requirements: 3.3, 3.4_

  - [x] 6.3 Add getLessonById function to API client
    - Create GET request to lesson endpoint
    - Parse and return lesson data
    - _Requirements: 4.1, 4.2_

- [ ] 7. Implement Join Programme page
  - [x] 7.1 Create /join page component with enrollment form
    - Create form with code input field
    - Add client-side validation for code format (WORD-YEAR)
    - Add submit button with loading state
    - Display error messages for invalid codes
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 7.2 Implement enrollment submission and redirect logic
    - Call enrollInProgramme API function on submit
    - Handle success: redirect to /programmes/[id]
    - Handle errors: display error message
    - _Requirements: 2.1, 2.2_

  - [ ]* 7.3 Write unit tests for join page
    - Test form validation
    - Test successful enrollment flow
    - Test error handling
    - _Requirements: 2.1, 2.2, 2.4, 2.6_

- [ ] 8. Enhance Dashboard with programme cards
  - [x] 8.1 Update dashboard to fetch and display enrolled programmes
    - Fetch user's enrolled programmes via existing API
    - Calculate current week for each programme
    - Display programme cards with title and week indicator
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.2 Update EmptyState component to include "Join with Code" CTA
    - Add button linking to /join page
    - Update empty state message for learners
    - _Requirements: 5.4, 5.5_

  - [ ]* 8.3 Write property test for dashboard programme cards
    - **Property 13: Dashboard Programme Cards**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ]* 8.4 Write unit tests for dashboard updates
    - Test empty state display
    - Test programme cards display
    - Test current week indicator
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Implement Programme Page
  - [x] 9.1 Create /programmes/[id] page component
    - Fetch programme data and weeks
    - Display ProgrammeHeader with title and description
    - Render weeks with current week indicator
    - Group lessons under each week
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 9.2 Create WeekSection component
    - Display week number and title
    - Show "Current Week" badge for current week
    - Render lesson cards in grid layout
    - _Requirements: 3.2, 3.3_

  - [x] 9.3 Update or create LessonCard component for programme context
    - Display lesson title and description
    - Show content type icon (video, link, pdf)
    - Add "View lesson" CTA button
    - Link to /lessons/[id]
    - _Requirements: 3.4_

  - [ ]* 9.4 Write unit tests for programme page
    - Test programme header rendering
    - Test week grouping
    - Test current week indicator
    - Test lesson card rendering
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Lesson Page
  - [x] 11.1 Create /lessons/[id] page component
    - Fetch lesson data
    - Display lesson title and description
    - Render content based on content type
    - Add back link to programme page
    - _Requirements: 4.1, 4.5_

  - [x] 11.2 Create content rendering logic for different types
    - YouTube: embed video player using iframe
    - PDF/Drive: render clickable link with icon
    - Handle content loading states
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 11.3 Write property test for lesson content rendering
    - **Property 12: Lesson Content Rendering**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 11.4 Write unit tests for lesson page
    - Test YouTube embed rendering
    - Test PDF link rendering
    - Test Drive link rendering
    - Test back link navigation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Implement content management endpoints (convener features)
  - [x] 12.1 Create POST /api/v1/programmes endpoint
    - Accept programme name, description, start date
    - Create programme record
    - Return created programme
    - _Requirements: 1.1_

  - [x] 12.2 Create POST /api/v1/programmes/:id/cohorts endpoint
    - Accept cohort name, enrollment code, start date
    - Validate enrollment code uniqueness
    - Create cohort record
    - Return created cohort
    - _Requirements: 1.2_

  - [ ]* 12.3 Write property test for multiple cohorts per programme
    - **Property 2: Multiple Cohorts Per Programme**
    - **Validates: Requirements 1.2**

  - [x] 12.4 Create POST /api/v1/programmes/:id/weeks endpoint
    - Accept week number, title, start date
    - Validate week number uniqueness within programme
    - Create week record
    - Return created week
    - _Requirements: 1.3_

  - [ ]* 12.5 Write property test for week organization preservation
    - **Property 3: Week Organization Preservation**
    - **Validates: Requirements 1.3**

  - [x] 12.6 Create POST /api/v1/weeks/:id/lessons endpoint
    - Accept lesson title, description, content type, content URL, order index
    - Validate URL format
    - Create lesson record
    - Return created lesson
    - _Requirements: 1.4, 1.5_

  - [x] 12.7 Create PUT /api/v1/weeks/:id/lessons/reorder endpoint
    - Accept array of lesson IDs in new order
    - Update order_index for each lesson
    - Return updated lessons
    - _Requirements: 1.6_

  - [x] 12.8 Create PUT /api/v1/lessons/:id endpoint
    - Accept updated title, description, content URL
    - Update lesson record
    - Return updated lesson
    - _Requirements: 7.5_

  - [ ]* 12.9 Write property test for content immediate visibility
    - **Property 14: Content Immediate Visibility**
    - **Validates: Requirements 7.3**

  - [ ]* 12.10 Write property test for lesson order preservation on addition
    - **Property 15: Lesson Order Preservation on Addition**
    - **Validates: Requirements 7.4**

  - [ ]* 12.11 Write property test for lesson update round trip
    - **Property 16: Lesson Update Round Trip**
    - **Validates: Requirements 7.5**

  - [ ]* 12.12 Write unit tests for content management endpoints
    - Test programme creation
    - Test cohort creation with duplicate code handling
    - Test week creation
    - Test lesson creation
    - Test lesson reordering
    - Test lesson updates
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.5_

- [x] 13. Checkpoint - Ensure all content management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement mobile optimizations
  - [x] 14.1 Add responsive styles to all components
    - Ensure 320px minimum width support
    - Use mobile-first CSS approach
    - Test touch targets (minimum 44x44px)
    - _Requirements: 6.1_

  - [x] 14.2 Implement lazy loading for embedded content
    - Add loading="lazy" to YouTube iframes
    - Defer loading of non-critical content
    - Show loading skeletons while content loads
    - _Requirements: 6.5_

  - [x] 14.3 Optimize bundle size
    - Code-split routes using Next.js dynamic imports
    - Remove unused dependencies
    - Minimize CSS and JavaScript
    - _Requirements: 6.4_

- [ ] 15. Implement authentication integration
  - [x] 15.1 Add authentication checks to all protected routes
    - Verify user is authenticated before accessing programmes
    - Verify user is enrolled before accessing programme content
    - Redirect to login if not authenticated
    - Redirect to join page if not enrolled
    - _Requirements: 8.1, 8.3_

  - [ ]* 15.2 Write property test for session persistence
    - **Property 17: Session Persistence Across Navigation**
    - **Validates: Requirements 8.3**

  - [ ]* 15.3 Write unit tests for authentication integration
    - Test protected route access
    - Test enrollment verification
    - Test redirect behavior
    - _Requirements: 8.1, 8.3_

- [ ] 16. Final integration and testing
  - [ ]* 16.1 Test complete learner enrollment flow
    - Navigate to /join
    - Enter valid enrollment code
    - Verify redirect to programme page
    - Verify programme appears on dashboard
    - Navigate to lesson and verify content loads
    - _Requirements: 2.1, 2.2, 3.1, 4.1, 5.1_

  - [ ]* 16.2 Test complete content management flow
    - Create programme
    - Create cohort with enrollment code
    - Create weeks
    - Create lessons with various content types
    - Reorder lessons
    - Update lesson content
    - Verify learner can access all content
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.5_

  - [ ]* 16.3 Write integration tests for end-to-end flows
    - Test learner enrollment to content access flow
    - Test convener content creation to learner access flow
    - Test error scenarios (invalid codes, unauthorized access)
    - _Requirements: All_

- [x] 17. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: database → backend → API → frontend
- Mobile optimizations are implemented throughout but consolidated in task 14
- Authentication integration leverages existing Cohortle auth system
