# Implementation Plan: Convener Dashboard

## Overview

This implementation plan breaks down the convener dashboard feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout. The plan follows a phased approach: core infrastructure, content management, advanced features, and polish.

The dashboard enables conveners to create and manage learning programmes through a self-service web interface, eliminating the need for API scripts. It integrates with existing backend endpoints and follows established patterns from the student-facing web application.

## Tasks

- [x] 1. Set up convener routing and authentication
  - Create `/convener` route structure in Next.js app directory
  - Add middleware to verify convener role for all `/convener/*` routes
  - Create ConvenerLayout component with navigation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property test for convener-only access
  - **Property 1: Convener-Only Access**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 1.2 Write unit tests for convener middleware
  - Test convener role verification
  - Test redirect for non-convener users
  - Test successful authentication flow
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Create ConvenerAPI service layer
  - [x] 2.1 Implement ConvenerAPI class with programme methods
    - Create `src/lib/api/convener.ts`
    - Implement createProgramme, updateProgramme, getProgramme, getMyProgrammes, publishProgramme
    - Use existing apiClient for HTTP requests
    - _Requirements: 2.2, 8.1_
  
  - [x] 2.2 Add cohort management methods
    - Implement createCohort, getCohorts, checkEnrollmentCodeAvailability
    - _Requirements: 3.2_
  
  - [x] 2.3 Add week management methods
    - Implement createWeek, getWeeks
    - _Requirements: 4.2_
  
  - [x] 2.4 Add lesson management methods
    - Implement createLesson, updateLesson, reorderLessons
    - _Requirements: 5.6, 5.7, 6.3_

- [ ]* 2.5 Write property test for API call correctness
  - **Property 9: API Call Correctness**
  - **Validates: Requirements 2.2, 3.2, 4.2, 5.6, 5.7, 6.3, 8.1, 8.2**

- [ ] 3. Create custom hooks for data management
  - [x] 3.1 Implement useConvenerProgrammes hook
    - Create `src/lib/hooks/useConvenerProgrammes.ts`
    - Handle loading, error, and data states
    - Implement refetch and createProgramme methods
    - _Requirements: 2.3, 8.4_
  
  - [x] 3.2 Implement useProgrammeDetail hook
    - Create `src/lib/hooks/useProgrammeDetail.ts`
    - Fetch programme with cohorts, weeks, and lessons
    - Implement updateProgramme and publishProgramme methods
    - _Requirements: 2.4, 2.5, 8.1, 8.2_
  
  - [ ] 3.3 Implement useLessonReorder hook
    - Create `src/lib/hooks/useLessonReorder.ts`
    - Handle optimistic updates for lesson reordering
    - Implement rollback on API failure
    - _Requirements: 6.2, 6.3, 6.4_

- [ ]* 3.4 Write property test for data caching efficiency
  - **Property 11: Data Caching Efficiency**
  - **Validates: Requirements 8.5**

- [ ]* 3.5 Write unit tests for custom hooks
  - Test useConvenerProgrammes loading and error states
  - Test useProgrammeDetail data fetching
  - Test useLessonReorder optimistic updates and rollback
  - _Requirements: 2.3, 2.4, 6.2, 6.3, 8.4_

- [ ] 4. Create shared UI components
  - [ ] 4.1 Create FormSelect component
    - Create `src/components/ui/FormSelect.tsx`
    - Follow FormInput pattern with label, error, and validation states
    - _Requirements: 11.1, 11.3_
  
  - [ ] 4.2 Create FormTextarea component
    - Create `src/components/ui/FormTextarea.tsx`
    - Support character count and max length
    - _Requirements: 11.1, 11.3_
  
  - [ ] 4.3 Create FormDatePicker component
    - Create `src/components/ui/FormDatePicker.tsx`
    - Use native date input with fallback
    - _Requirements: 11.1, 11.3_
  
  - [ ] 4.4 Create Modal component
    - Create `src/components/ui/Modal.tsx`
    - Handle focus trapping and ESC key
    - Support different sizes
    - _Requirements: 11.5_
  
  - [ ] 4.5 Create Toast notification system
    - Create `src/components/ui/Toast.tsx` and `src/lib/contexts/ToastContext.tsx`
    - Support success, error, warning, info types
    - Auto-dismiss after timeout
    - _Requirements: 10.1, 10.5_
  
  - [ ] 4.6 Create ConfirmDialog component
    - Create `src/components/ui/ConfirmDialog.tsx`
    - Support custom title, message, and action buttons
    - _Requirements: 12.2_

- [ ]* 4.7 Write unit tests for shared UI components
  - Test FormSelect, FormTextarea, FormDatePicker rendering and interactions
  - Test Modal focus management and keyboard handling
  - Test Toast display and auto-dismiss
  - Test ConfirmDialog confirmation flow
  - _Requirements: 10.1, 11.3, 11.5_

- [ ] 5. Implement ConvenerDashboard page
  - [x] 5.1 Create dashboard page component
    - Create `src/app/convener/dashboard/page.tsx`
    - Use useConvenerProgrammes hook to fetch programmes
    - Display loading, error, and empty states
    - _Requirements: 2.3, 8.3, 8.4_
  
  - [x] 5.2 Create ProgrammeCard component
    - Create `src/components/convener/ProgrammeCard.tsx`
    - Display programme name, description, status, stats
    - Add "View Details" link
    - Show status badge (draft/published)
    - _Requirements: 11.4, 12.5_
  
  - [x] 5.3 Add "Create Programme" button and navigation
    - Add floating action button or header button
    - Navigate to programme creation form
    - _Requirements: 2.1, 11.5_

- [ ]* 5.4 Write property test for programme creation persistence
  - **Property 2: Programme Creation Persistence**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 5.5 Write unit tests for ConvenerDashboard
  - Test empty state display
  - Test programme list rendering
  - Test loading state
  - Test error handling
  - _Requirements: 2.3, 8.3, 8.4_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement ProgrammeForm component
  - [x] 7.1 Create ProgrammeForm component
    - Create `src/components/convener/ProgrammeForm.tsx`
    - Use React Hook Form for form management
    - Implement validation rules (name: 3-200 chars, description: max 1000 chars, startDate: required)
    - _Requirements: 2.1, 2.6, 10.4_
  
  - [x] 7.2 Add form validation and error display
    - Display inline validation errors
    - Highlight invalid fields
    - Prevent submission with invalid data
    - _Requirements: 2.6, 10.2, 10.4_
  
  - [x] 7.3 Create programme creation page
    - Create `src/app/convener/programmes/new/page.tsx`
    - Render ProgrammeForm in create mode
    - Handle form submission and navigation
    - _Requirements: 2.1, 2.2_
  
  - [ ] 7.4 Add programme edit functionality
    - Support edit mode in ProgrammeForm
    - Pre-populate form with existing programme data
    - Handle update API call
    - _Requirements: 2.5_

- [ ]* 7.5 Write property test for invalid data rejection
  - **Property 3: Invalid Data Rejection**
  - **Validates: Requirements 2.6, 3.5, 4.4, 5.8, 10.2, 10.4**

- [ ]* 7.6 Write unit tests for ProgrammeForm
  - Test validation for short/long names
  - Test required field validation
  - Test successful form submission
  - Test API error handling
  - Test edit mode pre-population
  - _Requirements: 2.1, 2.5, 2.6, 10.2_

- [ ] 8. Implement ProgrammeDetailView page
  - [x] 8.1 Create programme detail page
    - Create `src/app/convener/programmes/[id]/page.tsx`
    - Use useProgrammeDetail hook to fetch data
    - Display programme overview section
    - _Requirements: 2.4, 8.1, 8.4_
  
  - [ ] 8.2 Create CohortList component
    - Create `src/components/convener/CohortList.tsx`
    - Display all cohorts with enrollment codes
    - Show enrolled learner count
    - Add "Create Cohort" button
    - _Requirements: 3.3, 3.4, 11.4_
  
  - [ ] 8.3 Create WeekList component
    - Create `src/components/convener/WeekList.tsx`
    - Display weeks in sequential order
    - Show lesson count per week
    - Add "Create Week" button
    - _Requirements: 4.3, 11.4_
  
  - [ ] 8.4 Add programme action buttons
    - Add "Preview", "Edit", "Publish" buttons to header
    - Implement navigation to respective pages
    - _Requirements: 2.5, 7.1, 11.5, 12.2_

- [ ]* 8.5 Write property test for cohort display completeness
  - **Property 5: Cohort Display Completeness**
  - **Validates: Requirements 3.4**

- [ ]* 8.6 Write unit tests for ProgrammeDetailView
  - Test programme data display
  - Test cohort list rendering
  - Test week list rendering
  - Test action button visibility
  - _Requirements: 2.4, 3.4, 4.3, 8.1_

- [ ] 9. Implement CohortForm component
  - [x] 9.1 Create CohortForm component
    - Create `src/components/convener/CohortForm.tsx`
    - Implement form fields: name, enrollmentCode, startDate
    - Add enrollment code generator button
    - Implement real-time enrollment code availability check
    - _Requirements: 3.1, 3.2, 10.4_
  
  - [x] 9.2 Add enrollment code validation
    - Validate format (alphanumeric with hyphens)
    - Check uniqueness via API
    - Display availability status
    - _Requirements: 3.5, 10.2_
  
  - [x] 9.3 Create cohort creation modal/page
    - Create `src/app/convener/programmes/[id]/cohorts/new/page.tsx`
    - Render CohortForm in modal or dedicated page
    - Display enrollment code prominently after creation
    - _Requirements: 3.2, 3.3_

- [ ]* 9.4 Write property test for cohort creation with enrollment code
  - **Property 4: Cohort Creation with Enrollment Code**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 9.5 Write unit tests for CohortForm
  - Test enrollment code generation
  - Test enrollment code validation
  - Test uniqueness checking
  - Test successful cohort creation
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 10. Implement WeekForm component
  - [x] 10.1 Create WeekForm component
    - Create `src/components/convener/WeekForm.tsx`
    - Implement form fields: weekNumber, title, startDate
    - Auto-suggest next week number
    - Calculate suggested start date based on previous weeks
    - _Requirements: 4.1, 4.5, 10.4_
  
  - [x] 10.2 Add week number validation
    - Validate uniqueness within programme
    - Ensure positive integer
    - _Requirements: 4.4, 10.2_
  
  - [x] 10.3 Create week creation modal/page
    - Create `src/app/convener/programmes/[id]/weeks/new/page.tsx`
    - Render WeekForm in modal or dedicated page
    - Handle form submission and refresh programme detail
    - _Requirements: 4.2_

- [ ]* 10.4 Write property test for week sequential ordering
  - **Property 6: Week Sequential Ordering**
  - **Validates: Requirements 4.3, 4.5**

- [ ]* 10.5 Write unit tests for WeekForm
  - Test week number auto-suggestion
  - Test start date calculation
  - Test uniqueness validation
  - Test successful week creation
  - _Requirements: 4.1, 4.4, 4.5_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement LessonForm component
  - [x] 12.1 Create LessonForm component
    - Create `src/components/convener/LessonForm.tsx`
    - Implement form fields: title, description, contentType, orderIndex
    - Add dynamic content fields based on contentType
    - _Requirements: 5.1, 10.4_
  
  - [x] 12.2 Add content type specific fields
    - Video: URL input with YouTube/Vimeo validation
    - PDF: URL input with PDF validation
    - Link: URL input with general URL validation
    - Text: Rich text editor (use existing or simple textarea)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 12.3 Add content URL validation
    - Validate URL format
    - Check content type matches URL
    - Display preview when possible
    - _Requirements: 5.8, 10.2_
  
  - [x] 12.4 Create lesson creation modal/page
    - Create `src/app/convener/programmes/[id]/weeks/[weekId]/lessons/new/page.tsx`
    - Render LessonForm in modal or dedicated page
    - Handle form submission and refresh week lessons
    - _Requirements: 5.6_
  
  - [ ] 12.5 Add lesson edit functionality
    - Support edit mode in LessonForm
    - Pre-populate form with existing lesson data
    - Handle update API call
    - _Requirements: 5.7_

- [ ]* 12.6 Write property test for lesson content type validation
  - **Property 7: Lesson Content Type Validation**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ]* 12.7 Write unit tests for LessonForm
  - Test content type switching
  - Test URL validation for each type
  - Test form submission for each content type
  - Test edit mode pre-population
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

- [ ] 13. Implement lesson display in WeekList
  - [ ] 13.1 Create LessonListItem component
    - Create `src/components/convener/LessonListItem.tsx`
    - Display lesson title, content type icon, order
    - Add edit and delete buttons
    - _Requirements: 6.1, 11.4_
  
  - [ ] 13.2 Update WeekList to show lessons
    - Display lessons under each week
    - Show lessons in order by orderIndex
    - Add "Create Lesson" button per week
    - _Requirements: 4.3, 6.1, 11.4_

- [ ]* 13.3 Write unit tests for lesson display
  - Test LessonListItem rendering
  - Test lesson ordering in WeekList
  - Test edit and delete button functionality
  - _Requirements: 6.1_

- [ ] 14. Implement lesson reordering
  - [ ] 14.1 Install and configure @dnd-kit
    - Install @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
    - Create DndContext wrapper
    - _Requirements: 6.2_
  
  - [ ] 14.2 Create LessonReorderList component
    - Create `src/components/convener/LessonReorderList.tsx`
    - Implement drag-and-drop using @dnd-kit
    - Use useLessonReorder hook for state management
    - Add visual feedback during drag
    - _Requirements: 6.2_
  
  - [ ] 14.3 Add mobile-friendly reorder controls
    - Add up/down arrow buttons for each lesson
    - Implement keyboard navigation (arrow keys + Enter)
    - _Requirements: 6.5, 9.4_
  
  - [ ] 14.4 Implement optimistic updates and rollback
    - Update UI immediately on reorder
    - Call API to persist changes
    - Rollback on API failure with error message
    - _Requirements: 6.3, 6.4, 10.1_

- [ ]* 14.5 Write property test for lesson reordering persistence
  - **Property 8: Lesson Reordering Persistence**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ]* 14.6 Write unit tests for LessonReorderList
  - Test drag-and-drop interaction
  - Test up/down button functionality
  - Test optimistic update
  - Test rollback on API failure
  - Test keyboard navigation
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ] 15. Implement programme preview mode
  - [ ] 15.1 Create ProgrammePreview component
    - Create `src/components/convener/ProgrammePreview.tsx`
    - Reuse existing learner-facing components (WeekSection, LessonCard)
    - Add preview banner at top
    - _Requirements: 7.2, 7.3, 7.5_
  
  - [ ] 15.2 Create preview page
    - Create `src/app/convener/programmes/[id]/preview/page.tsx`
    - Render ProgrammePreview component
    - Add "Exit Preview" button to return to detail view
    - _Requirements: 7.1, 7.4_
  
  - [ ] 15.3 Add preview indicator banner
    - Display prominent banner: "Preview Mode - This is how learners will see your programme"
    - Style differently from learner view
    - _Requirements: 7.3_

- [ ]* 15.4 Write unit tests for ProgrammePreview
  - Test preview banner display
  - Test exit preview navigation
  - Test content rendering matches learner view
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 16. Implement programme publishing
  - [ ] 16.1 Create PublishProgrammeButton component
    - Create `src/components/convener/PublishProgrammeButton.tsx`
    - Show current status (draft/published)
    - Open confirmation dialog on click
    - _Requirements: 12.2, 12.5_
  
  - [ ] 16.2 Add publish validation
    - Check programme has at least one cohort
    - Check programme has at least one week
    - Display validation errors if checks fail
    - _Requirements: 12.2_
  
  - [ ] 16.3 Implement publish API call
    - Call publishProgramme method from useProgrammeDetail
    - Update programme status in UI
    - Show success message
    - _Requirements: 12.3_
  
  - [ ] 16.4 Handle draft and published states
    - Set new programmes to draft by default
    - Control learner visibility based on status
    - _Requirements: 12.1, 12.4_

- [ ]* 16.5 Write property test for draft status default
  - **Property 13: Draft Status Default**
  - **Validates: Requirements 12.1**

- [ ]* 16.6 Write property test for publication visibility control
  - **Property 14: Publication Visibility Control**
  - **Validates: Requirements 12.3, 12.4**

- [ ]* 16.7 Write unit tests for PublishProgrammeButton
  - Test status display
  - Test validation checks
  - Test confirmation dialog
  - Test successful publish
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement error handling and loading states
  - [ ] 18.1 Add error boundaries
    - Wrap convener routes with ErrorBoundary
    - Display user-friendly error pages
    - _Requirements: 10.1, 10.5_
  
  - [ ] 18.2 Add loading states to all data fetching
    - Display LoadingSpinner during API calls
    - Show skeleton loaders for lists
    - _Requirements: 8.4_
  
  - [ ] 18.3 Implement error message display
    - Use Toast for API errors
    - Display inline errors for validation
    - Add retry buttons for transient errors
    - _Requirements: 8.3, 10.1_
  
  - [ ] 18.4 Add network error handling
    - Detect offline state
    - Display offline indicator
    - Queue actions for retry when online
    - _Requirements: 10.3_

- [ ]* 18.5 Write property test for error message display
  - **Property 10: Error Message Display**
  - **Validates: Requirements 8.3, 10.1**

- [ ]* 18.6 Write unit tests for error handling
  - Test error boundary rendering
  - Test API error display
  - Test network error handling
  - Test retry functionality
  - _Requirements: 8.3, 10.1, 10.3_

- [ ] 19. Implement responsive design
  - [ ] 19.1 Add mobile layout for ConvenerDashboard
    - Stack programme cards vertically on mobile
    - Adjust spacing and font sizes
    - Ensure touch targets are 44x44px minimum
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ] 19.2 Add mobile layout for ProgrammeDetailView
    - Collapse sections with accordions on mobile
    - Stack cohorts and weeks vertically
    - Adjust action buttons for mobile
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ] 19.3 Add tablet layout optimizations
    - Use 2-column grid for programme cards
    - Adjust modal sizes for tablet
    - _Requirements: 9.2, 9.4_
  
  - [ ] 19.4 Test responsive breakpoints
    - Test at 320px (mobile), 768px (tablet), 1024px (desktop)
    - Verify all interactive elements are accessible
    - _Requirements: 9.3, 9.5_

- [ ]* 19.5 Write property test for responsive layout adaptation
  - **Property 12: Responsive Layout Adaptation**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ]* 19.6 Write unit tests for responsive design
  - Test mobile layout rendering
  - Test tablet layout rendering
  - Test desktop layout rendering
  - Test touch target sizes
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 20. Add accessibility improvements
  - [ ] 20.1 Add ARIA labels to all interactive elements
    - Label buttons, links, form inputs
    - Add aria-describedby for error messages
    - _Requirements: 11.5_
  
  - [ ] 20.2 Implement keyboard navigation
    - Ensure all actions accessible via keyboard
    - Add focus indicators
    - Implement focus trapping in modals
    - _Requirements: 6.5, 11.5_
  
  - [ ] 20.3 Add screen reader announcements
    - Announce form errors
    - Announce success messages
    - Announce loading states
    - _Requirements: 10.1, 10.2_
  
  - [ ] 20.4 Verify color contrast
    - Check all text meets WCAG AA standards
    - Adjust colors if needed
    - _Requirements: 11.2_

- [ ]* 20.5 Write accessibility tests
  - Test keyboard navigation
  - Test ARIA labels
  - Test focus management
  - Test color contrast
  - _Requirements: 6.5, 11.2, 11.5_

- [ ] 21. Optimize performance
  - [ ] 21.1 Implement code splitting
    - Lazy load lesson content viewers
    - Split routes with dynamic imports
    - _Requirements: 8.5_
  
  - [ ] 21.2 Add data caching
    - Implement SWR or React Query for API calls
    - Cache programme details
    - Invalidate cache on mutations
    - _Requirements: 8.5_
  
  - [ ] 21.3 Optimize bundle size
    - Analyze bundle with webpack-bundle-analyzer
    - Remove unused dependencies
    - Tree-shake imports
    - _Requirements: 8.5_
  
  - [ ] 21.4 Add virtual scrolling for large lists
    - Implement virtual scrolling for lesson lists with 50+ items
    - Use react-window or similar library
    - _Requirements: 8.5_

- [ ]* 21.5 Write performance tests
  - Test code splitting effectiveness
  - Test cache invalidation
  - Test virtual scrolling with large datasets
  - _Requirements: 8.5_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Integration testing and polish
  - [ ] 23.1 Test complete programme creation workflow
    - Create programme → Create cohort → Create week → Create lesson → Preview → Publish
    - Verify all data persists correctly
    - _Requirements: All_
  
  - [ ] 23.2 Test error recovery workflows
    - Test network failure during creation → Retry → Success
    - Test validation errors → Fix → Success
    - _Requirements: 10.1, 10.3_
  
  - [ ] 23.3 Add empty state components
    - Empty programme list
    - Empty cohort list
    - Empty week list
    - Empty lesson list
    - _Requirements: 11.5_
  
  - [ ] 23.4 Add loading skeletons
    - Skeleton for programme cards
    - Skeleton for detail view sections
    - _Requirements: 8.4_
  
  - [ ] 23.5 Polish UI and animations
    - Add smooth transitions
    - Polish hover states
    - Improve visual feedback
    - _Requirements: 11.2_

- [ ]* 23.6 Write integration tests
  - Test end-to-end programme creation workflow
  - Test error recovery workflows
  - Test navigation between pages
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations using fast-check library
- Unit tests validate specific examples, edge cases, and UI interactions
- The implementation follows a phased approach: infrastructure → content management → advanced features → polish
- All components should reuse existing UI patterns and styling from the codebase (FormInput, LoadingSpinner, etc.)
- Focus on mobile-responsive design from the start, not as an afterthought
- Implement accessibility features throughout (ARIA labels, keyboard navigation, screen reader support)
- Use existing authentication system and API proxy for all backend communication
- Follow Next.js 14 App Router conventions for routing and data fetching
- Leverage React Hook Form for complex form management with validation
- Use @dnd-kit for drag-and-drop functionality (lesson reordering)
- Implement optimistic UI updates with rollback for better user experience
- All error messages should be user-friendly and actionable
- Loading states should use skeletons for better perceived performance
- Empty states should guide users on next actions
- The dashboard integrates with existing backend endpoints from wlimp-programme-rollout spec
