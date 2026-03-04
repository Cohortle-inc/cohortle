# Implementation Plan: Assignment Submission System

## Overview

This implementation plan breaks down the Assignment Submission System into discrete, manageable tasks that build incrementally. Each task focuses on a specific component or feature, with testing integrated throughout. The plan follows a bottom-up approach: core API layer → data hooks → UI components → integration.

## Current Status

Tasks 1-8 have been completed. The core API layer (assignments, submissions, grading), TanStack Query hooks, and utility functions (file validation, draft management) are implemented with comprehensive tests. The next phase focuses on building UI components and integrating them into the application.

## Tasks

- [x] 1. Set up project structure and core types
  - Create directory structure: `api/assignments/`, `api/submissions/`, `hooks/api/`, `utils/`, `components/assignments/`
  - Define TypeScript interfaces for Assignment, Submission, SubmissionFile, and related types in `types/assignments.ts`
  - Set up test configuration for property-based testing with fast-check
  - _Requirements: All requirements (foundational)_

- [x] 2. Implement file validation utilities
  - [x] 2.1 Create file validation functions in `utils/fileValidation.ts`
    - Implement `validateFileType()` to check file extensions against allowed list
    - Implement `validateFileSize()` to enforce 10MB limit
    - Implement `validateFile()` that combines both validations
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x]* 2.2 Write property test for file validation
    - **Property 6: File Validation**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [x]* 2.3 Write unit tests for file validation edge cases
    - Test boundary conditions (exactly 10MB, 10MB + 1 byte)
    - Test various file extensions (uppercase, mixed case)
    - Test error message specificity
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Implement draft management system
  - [x] 3.1 Create draft manager in `utils/draftManager.ts`
    - Implement `saveDraft()` to store submissions in AsyncStorage
    - Implement `loadDraft()` to retrieve saved drafts
    - Implement `clearDraft()` to remove drafts after submission
    - Implement `getAllDrafts()` for cleanup and overview
    - _Requirements: 5.1, 5.2, 10.3_
  
  - [x]* 3.2 Write property test for draft persistence
    - **Property 9: Draft Persistence Round-Trip**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x]* 3.3 Write unit tests for draft manager
    - Test draft expiration and cleanup
    - Test handling of corrupted draft data
    - Test concurrent draft operations
    - _Requirements: 5.1, 5.2_

- [x] 4. Implement Assignment API layer
  - [x] 4.1 Create assignment API functions in `api/assignments/`
    - Implement `createAssignment()` in `createAssignment.ts`
    - Implement `getAssignmentByLesson()` in `getAssignments.ts`
    - Implement `getStudentAssignments()` in `getAssignments.ts`
    - Implement `updateAssignment()` in `updateAssignment.ts`
    - Implement `deleteAssignment()` in `deleteAssignment.ts`
    - Follow existing error handling patterns from `uploadMedia.ts`
    - Include auth token from AsyncStorage in all requests
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1_
  
  - [x]* 4.2 Write property test for assignment creation round-trip
    - **Property 1: Assignment Creation Round-Trip**
    - **Validates: Requirements 1.1, 1.5**
  
  - [x]* 4.3 Write property test for due date validation
    - **Property 2: Due Date Validation**
    - **Validates: Requirements 1.2**
  
  - [x]* 4.4 Write property test for assignment-lesson association
    - **Property 3: Assignment-Lesson Association**
    - **Validates: Requirements 1.3**
  
  - [x]* 4.5 Write property test for assignment update persistence
    - **Property 4: Assignment Update Persistence**
    - **Validates: Requirements 1.4**
  
  - [x]* 4.6 Write unit tests for assignment API error handling
    - Test 401 authentication errors
    - Test 400 validation errors
    - Test network timeout scenarios
    - _Requirements: 10.1, 11.2_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Submission API layer
  - [x] 6.1 Create submission API functions in `api/submissions/`
    - Implement `submitAssignment()` in `submitAssignment.ts` with multipart/form-data
    - Implement `getSubmissionsByAssignment()` in `getSubmissions.ts`
    - Implement `getMySubmission()` in `getSubmissions.ts`
    - Implement `getSubmissionById()` in `getSubmissions.ts`
    - Implement `updateSubmission()` in `updateSubmission.ts`
    - Use FormData for file uploads similar to `uploadMedia.ts` pattern
    - _Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 5.3_
  
  - [ ]* 6.2 Write property test for submission content validation
    - **Property 8: Submission Content Validation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  
  - [ ]* 6.3 Write property test for multiple file upload support
    - **Property 7: Multiple File Upload Support**
    - **Validates: Requirements 3.6**
  
  - [ ]* 6.4 Write property test for submission status transition
    - **Property 10: Submission Status Transition**
    - **Validates: Requirements 5.3**
  
  - [ ]* 6.5 Write unit tests for file upload error handling
    - Test individual file upload failures
    - Test partial upload success scenarios
    - Test upload progress tracking
    - _Requirements: 3.4, 3.5, 10.5_

- [x] 7. Implement grading API functions
  - [x] 7.1 Create grading functions in `api/submissions/`
    - Implement `gradeSubmission()` in `gradeSubmission.ts`
    - Implement `downloadSubmission()` in `downloadSubmissions.ts`
    - Implement `downloadAllSubmissions()` in `downloadSubmissions.ts`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.1, 7.2, 7.3_
  
  - [ ]* 7.2 Write property test for grade value validation
    - **Property 16: Grade Value Validation**
    - **Validates: Requirements 8.1**
  
  - [ ]* 7.3 Write property test for feedback length acceptance
    - **Property 17: Feedback Length Acceptance**
    - **Validates: Requirements 8.2**
  
  - [ ]* 7.4 Write property test for grading round-trip
    - **Property 18: Grading Round-Trip**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ]* 7.5 Write unit tests for download functionality
    - Test empty submission list handling
    - Test download progress indicators
    - Test file organization in download package
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 8. Implement TanStack Query hooks for assignments
  - [x] 8.1 Create assignment hooks in `hooks/api/useAssignments.ts`
    - Implement `useGetAssignment()` query hook
    - Implement `useGetStudentAssignments()` query hook
    - Implement `useCreateAssignment()` mutation hook with cache invalidation
    - Implement `useUpdateAssignment()` mutation hook with cache invalidation
    - Implement `useDeleteAssignment()` mutation hook with cache invalidation
    - Configure appropriate staleTime and cacheTime values
    - _Requirements: 1.1, 1.4, 2.1, 9.1, 12.5_
  
  - [x] 8.2 Write unit tests for assignment hooks
    - Test cache invalidation on mutations
    - Test optimistic updates
    - Test error handling in hooks
    - _Requirements: 10.1, 12.5_

- [-] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement TanStack Query hooks for submissions
  - [x] 10.1 Create submission hooks in `hooks/api/useSubmissions.ts`
    - Implement `useGetSubmissions()` query hook for convener view
    - Implement `useGetMySubmission()` query hook for student view
    - Implement `useGetSubmission()` query hook for details
    - Implement `useSubmitAssignment()` mutation hook with draft clearing
    - Implement `useUpdateSubmission()` mutation hook
    - Implement `useGradeSubmission()` mutation hook
    - Configure cache invalidation across related queries
    - _Requirements: 5.3, 6.1, 6.2, 8.3, 8.4_
  
  - [ ]* 10.2 Write property test for edit permission based on status and date
    - **Property 11: Edit Permission Based on Status and Date**
    - **Validates: Requirements 5.4, 5.5**
  
  - [ ]* 10.3 Write unit tests for submission hooks
    - Test draft clearing after successful submission
    - Test cache updates across multiple queries
    - Test offline behavior with cached data
    - _Requirements: 5.1, 5.2, 10.2, 10.3_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create assignment form components (convener)
  - [x] 12.1 Build CreateAssignmentForm component in `components/assignments/CreateAssignmentForm.tsx`
    - Create form with title, instructions, and due date fields
    - Implement date picker for due date selection using @react-native-community/datetimepicker
    - Add client-side validation for all fields (title required, instructions required, due date must be future)
    - Integrate with `useCreateAssignment()` hook
    - Show loading states during submission
    - Display success/error messages using react-native-flash-message
    - Follow existing form patterns from `components/Form/`
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 12.2 Build EditAssignmentForm component in `components/assignments/EditAssignmentForm.tsx`
    - Pre-populate form with existing assignment data
    - Integrate with `useUpdateAssignment()` hook
    - Reuse validation logic from create form
    - Allow updating title, instructions, and due date
    - _Requirements: 1.4_
  
  - [x]* 12.3 Write unit tests for assignment forms
    - Test form validation (empty fields, past due dates)
    - Test successful submission flow
    - Test error handling and display
    - Test pre-population in edit form
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 13. Create assignment display component (student)
  - [x] 13.1 Build AssignmentCard component in `components/assignments/AssignmentCard.tsx`
    - Display assignment title, instructions (truncated), and due date
    - Show overdue indicator when current date > due date (use red badge or warning icon)
    - Display submission status badge (not submitted, submitted, graded)
    - Show grade (passed/failed) and feedback preview if available
    - Make card tappable to navigate to assignment detail screen
    - Use existing UI components from `components/ui/` for consistency
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x]* 13.2 Write property test for assignment display completeness
    - **Property 5: Assignment Display Completeness**
    - **Validates: Requirements 2.2**
  
  - [ ]* 13.3 Write unit tests for assignment card
    - Test overdue indicator display logic
    - Test grade display when graded vs pending
    - Test submission status badges
    - Test navigation on tap
    - _Requirements: 2.3, 2.4_

- [x] 14. Create file upload component
  - [x] 14.1 Build FileUploadInput component in `components/assignments/FileUploadInput.tsx`
    - Integrate expo-document-picker for file selection
    - Display selected files with names, sizes, and remove buttons
    - Show validation errors for invalid files (use validateFile from utils/fileValidation.ts)
    - Allow removing selected files before upload
    - Display upload progress bars for each file during submission
    - Support multiple file selection (copyToCacheDirectory: false for better performance)
    - Show file type icons for different file types (PDF, image, doc)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 14.2 Write unit tests for file upload component
    - Test file selection and display
    - Test validation error display for invalid files
    - Test file removal functionality
    - Test multiple file handling
    - Test file size display formatting
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [x] 15. Create submission form component (student)
  - [x] 15.1 Build SubmitAssignmentForm component in `components/assignments/`
    - Add text input field for text answers
    - Integrate FileUploadInput component
    - Implement auto-save to drafts every 30 seconds
    - Load existing draft on component mount
    - Validate that submission has text OR files before allowing submit
    - Integrate with `useSubmitAssignment()` hook
    - Clear draft after successful submission
    - Show loading states during submission
    - Disable form when past due date
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.5_
  
  - [ ]* 15.2 Write unit tests for submission form
    - Test draft auto-save functionality
    - Test draft loading on mount
    - Test submission validation
    - Test due date enforcement
    - Test draft clearing after submission
    - _Requirements: 4.4, 5.1, 5.2, 5.3, 5.5_

- [x] 16. Create submission list component (convener)
  - [x] 16.1 Build SubmissionList component in `components/assignments/`
    - Display list of all enrolled students
    - Show submission status for each student
    - Display submission timestamp when submitted
    - Show grading status badges (pending, passed, failed)
    - Implement filter by submission status
    - Display summary statistics at top
    - Make each item tappable to view submission details
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x]* 16.2 Write property test for submission tracker completeness
    - **Property 12: Submission Tracker Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x]* 16.3 Write property test for submission filtering
    - **Property 13: Submission Filtering**
    - **Validates: Requirements 6.5**
  
  - [ ]* 16.4 Write unit tests for submission list
    - Test statistics calculation
    - Test filtering functionality
    - Test empty state display
    - _Requirements: 6.4, 6.5_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Create grading interface component (convener)
  - [x] 18.1 Build GradeSubmissionForm component in `components/assignments/`
    - Display student submission (text and files)
    - Add pass/fail radio buttons or toggle
    - Add optional feedback text area
    - Integrate with `useGradeSubmission()` hook
    - Show loading states during grading
    - Display success message after grading
    - Navigate back to submission list after successful grading
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 18.2 Write unit tests for grading form
    - Test grade selection
    - Test feedback input
    - Test successful grading flow
    - Test error handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 19. Create download functionality component (convener)
  - [x] 19.1 Build DownloadSubmissionsButton component in `components/assignments/`
    - Add download button to submission list header
    - Show loading indicator during download preparation
    - Handle empty submission list gracefully
    - Integrate with device file system for saving downloads
    - Display success message with file location
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x]* 19.2 Write property test for download package completeness
    - **Property 14: Download Package Completeness**
    - **Validates: Requirements 7.1, 7.2**
  
  - [x]* 19.3 Write property test for text inclusion in downloads
    - **Property 15: Text Inclusion in Downloads**
    - **Validates: Requirements 7.3**
  
  - [ ]* 19.4 Write unit tests for download functionality
    - Test empty submission handling
    - Test download progress display
    - Test error handling
    - _Requirements: 7.4, 7.5_

- [x] 20. Create student assignment overview screen
  - [x] 20.1 Build StudentAssignmentsScreen in `app/(tabs)/assignments/`
    - Fetch all student assignments using `useGetStudentAssignments()`
    - Display assignments in a scrollable list using AssignmentCard
    - Implement filter by grading status
    - Sort assignments by due date (nearest first)
    - Show overdue indicators for unsubmitted past-due assignments
    - Add pull-to-refresh functionality
    - Handle loading and error states
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x]* 20.2 Write property test for student assignment overview completeness
    - **Property 19: Student Assignment Overview Completeness**
    - **Validates: Requirements 9.1, 9.2**
  
  - [x]* 20.3 Write property test for assignment sorting by due date
    - **Property 20: Assignment Sorting by Due Date**
    - **Validates: Requirements 9.3**
  
  - [x]* 20.4 Write property test for assignment overview filtering
    - **Property 21: Assignment Overview Filtering**
    - **Validates: Requirements 9.5**
  
  - [ ]* 20.5 Write unit tests for student assignments screen
    - Test loading states
    - Test error states
    - Test empty state
    - Test pull-to-refresh
    - _Requirements: 9.1, 9.3, 9.5, 12.1_

- [x] 21. Create assignment detail screen (student)
  - [x] 21.1 Build AssignmentDetailScreen in `app/assignments/[id]/`
    - Display full assignment details using assignment ID from route params
    - Show SubmitAssignmentForm if not yet submitted or before due date
    - Show submission status and grade if submitted
    - Display feedback from convener if graded
    - Handle loading and error states
    - Add navigation back to assignment list
    - _Requirements: 2.2, 2.4, 4.1, 4.2, 4.3, 4.4, 5.4, 5.5, 8.5_
  
  - [ ]* 21.2 Write integration tests for assignment detail screen
    - Test full submission flow
    - Test draft saving and loading
    - Test viewing graded submission
    - _Requirements: 4.1, 5.1, 5.2, 8.5_

- [x] 22. Create convener assignment management screen
  - [x] 22.1 Build ConvenerAssignmentScreen in `app/lessons/[id]/assignment/`
    - Show CreateAssignmentForm if no assignment exists
    - Show EditAssignmentForm and SubmissionList if assignment exists
    - Add delete assignment button with confirmation
    - Display assignment statistics
    - Add navigation to individual submission details
    - Handle loading and error states
    - _Requirements: 1.1, 1.4, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 22.2 Write integration tests for convener assignment screen
    - Test assignment creation flow
    - Test assignment editing flow
    - Test viewing submissions
    - Test assignment deletion
    - _Requirements: 1.1, 1.4, 6.1_

- [x] 23. Create submission detail screen (convener)
  - [x] 23.1 Build SubmissionDetailScreen in `app/submissions/[id]/`
    - Display student information
    - Show submission text answer if provided
    - Display list of submitted files with download links
    - Show GradeSubmissionForm if not yet graded
    - Display existing grade and feedback if graded
    - Allow re-grading if needed
    - Handle loading and error states
    - _Requirements: 6.2, 6.3, 7.1, 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 23.2 Write integration tests for submission detail screen
    - Test viewing submission details
    - Test grading flow
    - Test re-grading flow
    - Test file download
    - _Requirements: 7.1, 8.3, 8.4_

- [x] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Integrate assignment indicator in lesson screen
  - [x] 25.1 Update lesson screen to show assignment indicator
    - Add assignment badge/icon to lesson card when assignment exists
    - Make indicator tappable to navigate to assignment
    - Fetch assignment data using `useGetAssignment(lessonId)`
    - Show submission status on indicator for students
    - _Requirements: 2.1_
  
  - [ ]* 25.2 Write unit tests for lesson assignment indicator
    - Test indicator display when assignment exists
    - Test indicator absence when no assignment
    - Test navigation to assignment
    - _Requirements: 2.1_

- [x] 26. Implement offline support and error handling
  - [x] 26.1 Add network status detection
    - Integrate @react-native-community/netinfo
    - Create useNetworkStatus hook to track connectivity
    - Display offline banner when disconnected
    - _Requirements: 10.2, 10.3_
  
  - [x] 26.2 Implement offline queue for submissions
    - Queue submission operations when offline
    - Automatically retry when connection restored
    - Show pending operations indicator
    - _Requirements: 10.3, 10.4_
  
  - [x] 26.3 Add comprehensive error boundaries
    - Create error boundary component for assignment screens
    - Implement fallback UI for errors
    - Add error logging for debugging
    - _Requirements: 10.1_
  
  - [x]* 26.4 Write property test for authentication token inclusion
    - **Property 22: Authentication Token Inclusion**
    - **Validates: Requirements 11.1**
  
  - [ ]* 26.5 Write unit tests for offline support
    - Test offline detection
    - Test draft saving when offline
    - Test operation queuing
    - Test automatic retry on reconnection
    - _Requirements: 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 26.6 Write unit tests for error handling
    - Test authentication error handling
    - Test authorization error handling
    - Test network error handling
    - Test server error handling
    - _Requirements: 10.1, 11.2, 11.3, 11.4_

- [x] 27. Add performance optimizations
  - [x] 27.1 Implement image lazy loading
    - Add lazy loading for submission file previews
    - Use thumbnail generation for images
    - Implement progressive image loading
    - _Requirements: 12.4_
  
  - [x] 27.2 Add pagination for large lists
    - Implement pagination for submission lists
    - Add infinite scroll for student assignment overview
    - Optimize query performance with proper page sizes
    - _Requirements: 12.3_
  
  - [x] 27.3 Optimize TanStack Query cache configuration
    - Fine-tune staleTime and cacheTime values
    - Implement cache persistence for offline support
    - Add query prefetching for common navigation paths
    - _Requirements: 12.5_
  
  - [ ]* 27.4 Write performance tests
    - Test list rendering performance with large datasets
    - Test cache hit rates
    - Test memory usage
    - _Requirements: 12.3, 12.5_

- [x] 28. Final integration and testing
  - [x] 28.1 Run full test suite
    - Execute all unit tests
    - Execute all property tests (minimum 100 iterations each)
    - Verify all 22 correctness properties pass
    - Check test coverage meets 80% minimum
    - _Requirements: All requirements_
  
  - [x] 28.2 Perform end-to-end testing
    - Test complete convener workflow (create → view submissions → grade)
    - Test complete student workflow (view → submit → check grade)
    - Test offline scenarios
    - Test error recovery scenarios
    - _Requirements: All requirements_
  
  - [x] 28.3 Verify requirements coverage
    - Ensure all 12 requirements are implemented
    - Verify all acceptance criteria are met
    - Check that all correctness properties are tested
    - _Requirements: All requirements_

- [x] 29. Final checkpoint - Production readiness check
  - Ensure all tests pass, ask the user if questions arise.
  - Verify error handling is comprehensive
  - Confirm offline support works correctly
  - Check that all loading states are implemented
  - Validate that user-friendly error messages are displayed

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests verify end-to-end user flows
- The implementation follows existing Cohortle patterns for consistency
- All API calls include authentication tokens and proper error handling
- Offline support is built-in from the start with draft management
- Performance optimizations are included to ensure smooth mobile experience
