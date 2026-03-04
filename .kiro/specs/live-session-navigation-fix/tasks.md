# Implementation Plan: Live Session Navigation Fix

## Overview

This implementation plan breaks down the fix for the Live Session Navigation Bug into discrete coding tasks. The approach is to first add type detection and validation, then implement live session rendering, add error handling, and finally integrate everything with comprehensive testing.

## Tasks

- [x] 1. Create utility functions for lesson type detection and session data parsing
  - Create `cohortz/utils/lessonTypeDetection.ts` with `detectLessonType()` function
  - Create `cohortz/utils/sessionDataParser.ts` with parsing and validation functions
  - Add TypeScript interfaces for LiveSessionData
  - Add error handling for malformed JSON
  - _Requirements: 7.1, 7.2, 1.2_

- [ ]* 1.1 Write property test for lesson type detection
  - **Property 1: Live Session Detection Accuracy**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 1.2 Write property test for session data parsing
  - **Property 2: Session Data Parsing Consistency**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2. Create LiveSessionDisplay component
  - Create `cohortz/components/lessons/LiveSessionDisplay.tsx`
  - Implement session info display (date, time, duration)
  - Add meeting link button with URL validation
  - Display session notes if available
  - Add proper styling to match app design
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 2.1 Write unit tests for LiveSessionDisplay component
  - Test rendering with complete session data
  - Test rendering with missing optional fields
  - Test meeting link button functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 2.2 Write property test for date formatting
  - **Property 8: Date Formatting Consistency**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 2.3 Write property test for URL validation
  - **Property 7: Meeting Link Validation**
  - **Validates: Requirements 5.2**

- [x] 3. Create ErrorFallback component
  - Create `cohortz/components/ui/ErrorFallback.tsx`
  - Implement error display with icon and message
  - Add "Try Again" button (conditional)
  - Add "Go Back" button
  - Style according to app design system
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 3.1 Write unit tests for ErrorFallback component
  - Test rendering with different error types
  - Test retry button functionality
  - Test back button functionality
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Add route parameter validation to Module screen
  - Modify `cohortz/app/student-screens/cohorts/module.tsx`
  - Add validation for lessonId and cohortId parameters
  - Add validation error state
  - Display ErrorFallback when validation fails
  - Prevent API calls with invalid parameters
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 4.1 Write property test for parameter validation
  - **Property 4: Parameter Validation Completeness**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 5. Integrate lesson type detection into Module screen
  - Add lessonType state to Module component
  - Add useEffect to detect lesson type from lessonData
  - Add sessionData state for live sessions
  - Add parseError state for handling parse failures
  - Parse session data when lesson type is 'live_session'
  - _Requirements: 7.1, 7.2, 7.3, 1.2_

- [ ]* 5.1 Write unit tests for lesson type integration
  - Test type detection with different lesson types
  - Test session data parsing in Module screen
  - Test parse error handling
  - _Requirements: 7.1, 7.2, 1.2_

- [x] 6. Add conditional rendering for live sessions in Module screen
  - Modify render logic to check lessonType
  - Render LiveSessionDisplay for 'live_session' type
  - Keep existing video/text rendering for other types
  - Handle case where sessionData is null (show fallback)
  - Ensure text content still renders for live sessions if present
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 5.5, 7.3_

- [ ]* 6.1 Write property test for partial content rendering
  - **Property 6: Partial Content Rendering**
  - **Validates: Requirements 1.4, 4.4**

- [x] 7. Wrap Module screen with Error Boundary
  - Modify `cohortz/app/student-screens/cohorts/module.tsx` export
  - Wrap Module component with existing ErrorBoundary
  - Configure ErrorBoundary to use ErrorFallback component
  - Add retry functionality that refetches lesson data
  - Add back navigation functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 7.1 Write property test for error boundary isolation
  - **Property 5: Error Boundary Isolation**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 8. Fix navigation stack handling
  - Review router.push calls in course.tsx
  - Ensure proper parameter passing to Module screen
  - Verify router.back() behavior in Module screen
  - Test that back navigation returns to course screen
  - Add fallback navigation if stack is corrupted
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ]* 8.1 Write property test for navigation stack preservation
  - **Property 3: Navigation Stack Preservation**
  - **Validates: Requirements 2.1, 2.2, 2.3, 3.2**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no TypeScript errors
  - Test navigation flow manually
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Add comprehensive error messages
  - Create `cohortz/constants/errorMessages.ts` with all error messages
  - Update ErrorFallback to use centralized messages
  - Update Module screen to use centralized messages
  - Ensure messages are user-friendly and actionable
  - _Requirements: 1.4, 4.2, 6.3_

- [ ]* 10.1 Write integration tests for error scenarios
  - Test missing route parameters flow
  - Test invalid route parameters flow
  - Test API fetch failure flow
  - Test session data parse failure flow
  - _Requirements: 1.4, 4.1, 4.2, 6.1, 6.2, 6.3_

- [x] 11. Final integration and cleanup
  - Remove any console.log statements used for debugging
  - Ensure all imports are correct
  - Verify styling is consistent with app design
  - Test complete flow: course → live session → back
  - Verify no blank screens occur
  - Verify back button returns to course screen
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 12. Final checkpoint - Comprehensive testing
  - Run full test suite
  - Test on both iOS and Android if possible
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: utilities → components → integration → testing
- Error handling is integrated throughout to prevent blank screens
- Navigation fixes ensure proper back button behavior
