# Implementation Plan: Lesson Save Failure Fix

## Overview

This implementation plan fixes the critical bug where lesson save operations fail due to missing or improperly handled lessonId. The fix ensures proper lessonId lifecycle management across backend and frontend, with clear error handling and validation at each step.

The implementation follows this sequence:
1. Backend validation and error handling improvements
2. Frontend API layer updates for proper lessonId handling
3. Editor screen updates to validate and use lessonId
4. Lesson type selection flow updates
5. Testing and validation

## Tasks

- [x] 1. Backend: Add lessonId validation middleware
  - Create validation middleware to check lessonId presence and format
  - Add middleware to check lessonId exists in database
  - Apply middleware to PUT /v1/api/lessons/:lessonId route
  - _Requirements: 2.1, 2.2, 2.3, 10.5_

- [ ]* 1.1 Write property test for lessonId validation
  - **Property 6: Update Requires LessonId**
  - **Validates: Requirements 2.1, 10.5**

- [ ]* 1.2 Write unit tests for validation error messages
  - Test missing lessonId returns 400 with "Lesson ID is required"
  - Test invalid lessonId format returns 400
  - Test non-existent lessonId returns 404 with "Lesson not found"
  - _Requirements: 2.2, 2.3_

- [x] 2. Backend: Improve lesson creation response
  - Ensure lesson creation returns lesson_id in response
  - Include error: false and success message in response
  - Return complete lesson object with all fields
  - _Requirements: 1.2, 8.1, 8.2, 8.3_

- [ ]* 2.1 Write property test for creation response structure
  - **Property 2: LessonId in Creation Response**
  - **Validates: Requirements 1.2, 8.1, 8.2, 8.3**

- [ ]* 2.2 Write property test for unique lessonId generation
  - **Property 1: Unique LessonId Generation**
  - **Validates: Requirements 1.1**

- [x] 3. Backend: Add required field validation
  - Validate name, module_id, order_number are present
  - Return 400 with validation details if fields missing
  - Set default status to 'draft' if not provided
  - _Requirements: 1.4, 1.5_

- [ ]* 3.1 Write property test for required field validation
  - **Property 4: Required Field Validation**
  - **Validates: Requirements 1.4**

- [ ]* 3.2 Write property test for default status assignment
  - **Property 5: Default Status Assignment**
  - **Validates: Requirements 1.5**

- [x] 4. Backend: Improve error responses
  - Return descriptive error messages for all failure scenarios
  - Include validation details in 400 responses
  - Ensure consistent error response format
  - _Requirements: 1.3, 10.3, 10.4_

- [ ]* 4.1 Write property test for creation error messages
  - **Property 3: Creation Error Messages**
  - **Validates: Requirements 1.3**

- [ ]* 4.2 Write property test for server-side validation
  - **Property 8: Server-Side Validation**
  - **Validates: Requirements 10.3, 10.4**

- [ ] 5. Checkpoint - Backend validation complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 6. Frontend: Update postLesson API to extract lessonId
  - Parse lesson_id from response
  - Handle both lesson_id and id field names for backward compatibility
  - Throw descriptive error if lessonId not returned
  - Return complete response including lessonId
  - _Requirements: 3.2, 8.4, 8.5_
  - _File: cohortz/api/communities/lessons/postLessons.tsx_

- [ ]* 6.1 Write property test for lessonId extraction
  - **Property 9: LessonId Extraction from Creation Response**
  - **Validates: Requirements 3.2, 8.4, 8.5**

- [x] 7. Frontend: Update uploadLessonMedia to validate lessonId
  - Add lessonId validation at function start
  - Throw error if lessonId is missing: "Lesson ID is missing. Cannot update lesson."
  - Ensure lessonId is in URL path, not request body
  - Include authentication token in headers
  - _Requirements: 4.3, 9.1, 9.2, 9.3_
  - _File: cohortz/api/communities/lessons/uploadMedia.ts_

- [ ]* 7.1 Write property test for lessonId in update requests
  - **Property 14: LessonId in Update Requests**
  - **Validates: Requirements 4.3, 5.2, 5.4, 9.1, 9.2**

- [ ]* 7.2 Write property test for request authentication
  - **Property 19: Request Authentication**
  - **Validates: Requirements 9.3**

- [ ]* 7.3 Write property test for multipart form data
  - **Property 20: Multipart Form Data for Media**
  - **Validates: Requirements 9.4**

- [x] 8. Frontend: Update uploadLesson.tsx editor
  - Extract lessonId from route parameters using useLocalSearchParams
  - Add useEffect to validate lessonId on mount
  - Display error alert and navigate back if lessonId missing
  - Disable save button if lessonId is missing
  - Pass lessonId to uploadLessonMedia
  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_
  - _File: cohortz/app/convener-screens/(cohorts)/community/uploadLesson.tsx_

- [ ]* 8.1 Write property test for lessonId validation on editor load
  - **Property 13: LessonId in Route Parameters**
  - **Validates: Requirements 4.1, 5.1**

- [ ]* 8.2 Write property test for save disabled without lessonId
  - **Property 12: Save Disabled Without LessonId**
  - **Validates: Requirements 3.5, 4.2, 5.3**

- [x] 9. Frontend: Update textLessonEditor.tsx
  - Apply same lessonId validation pattern as uploadLesson.tsx
  - Extract lessonId from route parameters
  - Validate lessonId on mount
  - Disable save if lessonId missing
  - _Requirements: 7.6_
  - _File: cohortz/app/convener-screens/(cohorts)/community/textLessonEditor.tsx_

- [x] 10. Frontend: Update pdfLessonEditor.tsx
  - Apply same lessonId validation pattern
  - _Requirements: 7.5_
  - _File: cohortz/app/convener-screens/(cohorts)/community/pdfLessonEditor.tsx_

- [x] 11. Frontend: Update linkLessonEditor.tsx
  - Apply same lessonId validation pattern
  - _Requirements: 7.7_
  - _File: cohortz/app/convener-screens/(cohorts)/community/linkLessonEditor.tsx_

- [x] 12. Frontend: Update quizEditor.tsx
  - Apply same lessonId validation pattern
  - _Requirements: 7.8_
  - _File: cohortz/app/convener-screens/(cohorts)/community/quizEditor.tsx_

- [x] 13. Frontend: Update liveSessionEditor.tsx
  - Apply same lessonId validation pattern
  - _Requirements: 7.3_
  - _File: cohortz/app/convener-screens/(cohorts)/community/liveSessionEditor.tsx_

- [x] 14. Frontend: Update remaining lesson editors
  - Update assignment editor (if exists)
  - Update form editor (if exists)
  - Update reflection editor (if exists)
  - Update practical task editor (if exists)
  - Apply same lessonId validation pattern to all
  - _Requirements: 7.2, 7.4, 7.9, 7.10_

- [ ]* 14.1 Write property test for universal lesson type support
  - **Property 18: Universal Lesson Type Support**
  - **Validates: Requirements 7.1-7.10**

- [ ] 15. Checkpoint - Editor screens updated
  - Ensure all editor screens properly handle lessonId, ask the user if questions arise.

- [ ] 16. Frontend: Update lesson type selection flow
  - Call postLesson when lesson type is selected
  - Extract lessonId from response (handle both lesson_id and id)
  - Validate lessonId was returned
  - Navigate to editor with lessonId in route params
  - Display error if creation fails
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _File: cohortz/components/lessons/UnitTypeSelectionModal.tsx_

- [ ]* 16.1 Write property test for navigation with lessonId
  - **Property 10: Navigation with LessonId**
  - **Validates: Requirements 3.3**

- [ ]* 16.2 Write property test for creation error handling
  - **Property 11: Creation Error Handling**
  - **Validates: Requirements 3.4**

- [ ] 17. Frontend: Add error handling for save operations
  - Implement handleSaveError function with specific messages
  - Display "Cannot save: Lesson ID is missing" if lessonId missing
  - Display "Save failed: Please check your connection" for network errors
  - Display server error message for API errors
  - Log detailed error information to console
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ]* 17.1 Write unit tests for error message display
  - Test missing lessonId error message
  - Test network error message
  - Test server error message propagation
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 17.2 Write property test for error logging
  - **Property 16: Update Error Feedback**
  - **Validates: Requirements 4.5, 6.3, 6.5**

- [ ] 18. Frontend: Add success feedback
  - Display "Lesson saved successfully" on successful save
  - Update local state after successful save
  - _Requirements: 4.4, 9.5_

- [ ]* 18.1 Write property test for success feedback
  - **Property 15: Update Success Feedback**
  - **Validates: Requirements 4.4**

- [ ]* 18.2 Write property test for state update after save
  - **Property 21: State Update After Save**
  - **Validates: Requirements 9.5**

- [ ] 19. Frontend: Add client-side validation
  - Validate required fields before save
  - Display field-specific error messages
  - Prevent save if validation fails
  - _Requirements: 10.1, 10.2_

- [ ]* 19.1 Write property test for client-side validation
  - **Property 22: Client-Side Validation**
  - **Validates: Requirements 10.1**

- [ ]* 19.2 Write property test for field-specific errors
  - **Property 23: Field-Specific Validation Errors**
  - **Validates: Requirements 10.2**

- [ ] 20. Frontend: Ensure lessonId preservation in navigation
  - Verify lessonId is preserved when navigating between editors
  - Test navigation flows maintain lessonId in route params
  - _Requirements: 5.5_

- [ ]* 20.1 Write property test for lessonId preservation
  - **Property 17: LessonId Preservation in Navigation**
  - **Validates: Requirements 5.5**

- [ ] 21. Backend: Write property test for valid lessonId enables update
  - **Property 7: Valid LessonId Enables Update**
  - **Validates: Requirements 2.4, 2.5**

- [ ] 22. Integration testing
  - Test complete lesson creation flow (type selection → creation → editor)
  - Test lesson update flow (editor load → edit → save)
  - Test error recovery scenarios
  - Test all 10 lesson types
  - Verify lessonId is properly handled throughout

- [ ] 23. Final checkpoint - All tests pass
  - Ensure all unit tests and property tests pass
  - Verify manual testing of all lesson types
  - Confirm error messages are user-friendly
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Backend changes should be deployed before frontend changes
- All 10 lesson types must be updated with the same pattern
- Error messages should be clear and actionable for users
- Console logging should include detailed error information for debugging

