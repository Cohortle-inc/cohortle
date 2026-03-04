# Implementation Plan: Learning Units Repositioning

## Overview

This implementation plan converts the "Module" terminology to "Learning Unit" throughout the Cohortle application (frontend and backend) while maintaining backward compatibility. The approach includes adding unit-level progress tracking and display. All changes are deployed together in a "Big Bang" approach to maintain consistency.

## Tasks

- [ ] 1. Backend: Create progress calculation service
  - [ ] 1.1 Create progressService.js with calculateUnitProgress method
    - Implement progress calculation: (completed_lessons / total_lessons * 100)
    - Handle edge case: zero lessons returns 0% progress
    - Handle edge case: no progress data returns 0% progress
    - Return object with completed_lessons, total_lessons, percentage
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 1.2 Write unit tests for progress calculation service
    - Test progress calculation accuracy for various scenarios
    - Test edge cases (zero lessons, no progress data)
    - **Property 2: Progress Accuracy**
    - **Property 4: Progress Bounds**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 2. Backend: Enhance API responses with display fields and progress
  - [ ] 2.1 Update module API endpoints to include display fields
    - Add display_type field with value "learning_unit"
    - Add display_name field formatted as "Learning Unit {order}"
    - Add progress object with completed_lessons, total_lessons, percentage
    - Maintain all existing fields for backward compatibility
    - Update GET /api/programmes/:id/modules endpoint
    - Update GET /api/modules/:id endpoint
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1_
  
  - [ ]* 2.2 Write integration tests for API response format
    - Test API responses include display_type, display_name, and progress fields
    - Test backward compatibility (all original fields present)
    - **Property 3: Backward Compatibility**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 4.3**

- [ ] 3. Backend: Update code comments and documentation
  - [ ] 3.1 Update comments in model files
    - Update comments in models/programme_modules.js to reference "Learning Unit"
    - Update comments in models/module_lessons.js to reference "Learning Unit"
    - Retain database table name references for clarity
    - _Requirements: 8.2, 8.4_
  
  - [ ] 3.2 Update comments in route files
    - Update comments in module route handlers to reference "Learning Unit"
    - Update API documentation comments
    - _Requirements: 8.2, 8.3_

- [ ] 4. Frontend: Create progress display components
  - [ ] 4.1 Create ProgressBar component
    - Display visual progress bar with completion percentage
    - Show "X/Y lessons complete (Z%)" text
    - Include ARIA labels for accessibility
    - Add TypeScript interface for progress data
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 4.2 Create CompletionIndicator component
    - Display checkmark icon for completed lessons
    - Display pending icon for incomplete lessons
    - Include ARIA labels for accessibility
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 4.3 Write unit tests for progress components
    - Test ProgressBar renders correctly with various progress values
    - Test CompletionIndicator shows correct state
    - Test accessibility features

- [ ] 5. Checkpoint - Ensure backend and components are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Frontend: Update student module screen
  - [ ] 6.1 Update screen title and terminology
    - Change screen title to "Learning Unit"
    - Update all text references from "Module" to "Learning Unit"
    - Update error messages to reference "Learning Unit"
    - File: cohortz/app/student-screens/cohorts/module.tsx
    - _Requirements: 1.1, 1.5, 11.1_
  
  - [ ] 6.2 Add progress display to student screen
    - Add ProgressBar component at top of screen
    - Add CompletionIndicator for each lesson
    - Display "X/Y lessons complete (Z%)"
    - Handle zero lessons case: "0/0 lessons complete (0%)"
    - Display visual completion indicator when 100% complete
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2_
  
  - [ ] 6.3 Wire progress updates to lesson completion
    - Update lesson completion indicator when lesson is marked complete
    - Update Learning Unit progress display when lesson is marked complete
    - _Requirements: 7.3, 7.4_

- [ ] 7. Frontend: Update convener module screen
  - [ ] 7.1 Update screen title and button labels
    - Change screen title to "Learning Unit"
    - Update "Add Module" button to "Add Learning Unit"
    - Update "Edit Module" button to "Edit Learning Unit"
    - Update "Delete Module" button to "Delete Learning Unit"
    - Update "Rename Module" action to "Rename Learning Unit"
    - File: cohortz/app/convener-screens/(cohorts)/community/(course)/[id].tsx
    - _Requirements: 1.1, 1.3, 10.1, 10.2, 10.3, 10.5_
  
  - [ ] 7.2 Add progress display for learner tracking
    - Display progress information showing learner completion stats
    - _Requirements: 10.4_
  
  - [ ] 7.3 Update all text references and error messages
    - Update all text from "Module" to "Learning Unit"
    - Update error messages to reference "Learning Unit"
    - _Requirements: 1.1, 11.2, 11.3_

- [ ] 8. Frontend: Update navigation, forms, and breadcrumbs
  - [ ] 8.1 Update navigation labels
    - Update tab labels to "Learning Units"
    - Update side menu items to "Learning Units"
    - _Requirements: 1.2, 1.6_
  
  - [ ] 8.2 Update form field labels
    - Update "Module Name" to "Learning Unit Name"
    - Update "Module Description" to "Learning Unit Description"
    - Update all form labels referencing "Module"
    - _Requirements: 1.4_
  
  - [ ] 8.3 Update breadcrumb navigation
    - Update breadcrumb text to show "Learning Unit"
    - _Requirements: 1.6_

- [ ] 9. Frontend: Update search, filter, and error messages
  - [ ] 9.1 Update search and filter interfaces
    - Update search placeholder text to "Search Learning Units"
    - Update filter labels to "Filter by Learning Unit"
    - Update sort labels to "Sort Learning Units"
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [ ] 9.2 Update error messages throughout the app
    - Update error messages for Learning Unit load failures
    - Update error messages for Learning Unit creation failures
    - Update error messages for Learning Unit deletion failures
    - _Requirements: 1.5, 11.1, 11.2, 11.3, 11.4_

- [ ] 10. Frontend: Systematic search and replace for display text
  - [ ] 10.1 Search and replace "Module" in all .tsx files
    - Search for "Module" in all .tsx files
    - Replace in string literals shown to users
    - Replace in placeholder text
    - Replace in alert messages and toast notifications
    - DO NOT replace: import statements, node_modules, module.exports
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 10.2 Verify no code keywords were modified
    - Verify node_modules directory references unchanged
    - Verify module.exports statements unchanged
    - Verify import statements unchanged
    - **Property 1: Terminology Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 11. Checkpoint - Ensure all frontend changes are complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 12. Testing: End-to-end verification
  - [ ]* 12.1 Test learner experience
    - Verify learner views Learning Unit and sees progress
    - Verify learner completes lesson and progress updates
    - Verify all screens show "Learning Unit" terminology
    - **Property 5: Completion Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.3, 7.4**
  
  - [ ]* 12.2 Test convener experience
    - Verify convener views Learning Unit and sees learner progress
    - Verify convener creates new Learning Unit with new terminology
    - Verify all management interfaces use consistent terminology
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  
  - [ ]* 12.3 Test backward compatibility
    - Verify existing data continues to work without migration
    - Verify API responses include all original fields
    - **Property 3: Backward Compatibility**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 13. Documentation: Update API documentation
  - [ ] 13.1 Document new API response format
    - Document display_type, display_name, and progress fields
    - Provide example API responses
    - Explain progress calculation logic
    - Note backward compatibility guarantees
    - _Requirements: 3.1, 3.2, 5.1, 8.3_
  
  - [ ] 13.2 Create migration guide for API consumers
    - Explain changes to API responses
    - Provide code examples for consuming new fields
    - Note that no breaking changes were introduced
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 14. Final checkpoint - Verify complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- This is a "Big Bang" deployment - all changes go live together
- No database migrations required (backward compatible)
- Focus on display changes, not structural changes
- Preserve all code keywords (module.exports, node_modules, import statements)
