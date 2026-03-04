# Implementation Plan: Programme Creation Workflow Fixes

## Overview

This implementation plan systematically addresses all issues preventing the Programme Creation Workflow from functioning correctly in production. The approach follows a layered strategy: infrastructure fixes first (deployment and environment), then validation improvements, API consistency fixes, and finally comprehensive diagnostic tooling.

## Tasks

- [x] 1. Set up deployment verification and cache management
  - Create deployment verification endpoint that returns current commit hash
  - Add unique code markers (comments with commit hash) to key files
  - Set up GitHub Actions workflow to purge Cloudflare cache on deployment
  - Create verification script to check deployed code matches expected version
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7_

- [x]* 1.1 Write property test for deployment verification
  - **Property 1: Deployment verification consistency**
  - **Validates: Requirements 1.7**

- [ ] 2. Validate and fix environment configuration
  - [x] 2.1 Create environment validation script for backend
    - Check NODE_ENV is "production" in production
    - Check DB_DATABASE is actual database name (not "cohortle.com")
    - Verify all required environment variables are present
    - Log configuration (without sensitive values) for debugging
    - _Requirements: 2.1, 2.2, 2.5, 2.6_
  
  - [x] 2.2 Create environment validation script for frontend
    - Verify NEXT_PUBLIC_API_URL is available at build time and runtime
    - Check API URL points to correct production endpoint
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.3 Add startup validation to backend
    - Run environment validation on server startup
    - Fail fast with clear error messages if configuration is invalid
    - _Requirements: 2.4, 2.5_

- [x]* 2.4 Write property test for environment validation
  - **Property 2: Environment variable completeness**
  - **Validates: Requirements 2.5**

- [ ] 3. Fix form validation issues
  - [x] 3.1 Fix date validation to use local timezone
    - Update all date validation functions to use local timezone instead of UTC
    - Implement correct date string generation (YYYY-MM-DD in local time)
    - Update ProgrammeForm, CohortForm, and WeekForm date validation
    - _Requirements: 3.1, 3.6_
  
  - [x] 3.2 Update validation trigger behavior
    - Change validation to trigger only on form submission (not on blur)
    - Keep real-time validation for enrollment code availability check
    - _Requirements: 3.2_
  
  - [x] 3.3 Improve validation error messages
    - Make all error messages specific and actionable
    - Add field-specific error display in forms
    - _Requirements: 3.3_
  
  - [x] 3.4 Implement comprehensive field validation
    - Programme name: 3-200 characters
    - Description: max 1000 characters
    - Week title: 3-200 characters
    - Lesson title: 3-200 characters
    - Text content: max 50000 characters
    - _Requirements: 3.4, 3.5_
  
  - [x] 3.5 Add form submission state management
    - Disable submit button while validation is in progress
    - Show loading state during submission
    - _Requirements: 3.7_

- [x]* 3.6 Write property test for date validation
  - **Property 3: Date validation uses local timezone**
  - **Validates: Requirements 3.1**

- [x]* 3.7 Write property test for field length validation
  - **Property 4: Field length validation consistency**
  - **Validates: Requirements 3.4, 3.5**

- [ ] 4. Implement enrollment code management
  - [x] 4.1 Create enrollment code generation function
    - Generate codes in format "PROG-YYYY-XXXXXX"
    - Use current year and random alphanumeric string
    - Add "Generate" button to CohortForm
    - _Requirements: 4.5_
  
  - [x] 4.2 Create backend endpoint for code availability check
    - Implement GET /v1/api/enrollment-codes/check?code=XXX
    - Return {available: boolean}
    - Handle missing code parameter with 400 error
    - _Requirements: 4.2, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 4.3 Implement real-time code availability checking
    - Add debounced (500ms) availability check in CohortForm
    - Display "Checking availability..." while checking
    - Show "This code is available" in green when available
    - Show "This code is already in use" in red when taken
    - Prevent form submission if code is not available
    - _Requirements: 4.2, 4.3, 4.4, 11.5, 11.6, 11.7_
  
  - [x] 4.4 Update backend cohort creation to handle enrollment codes
    - Accept enrollment_code field in request body
    - Validate code uniqueness before database insert
    - Store enrollment_code in cohorts table
    - Return complete cohort object including enrollment_code
    - Return specific error message if code is duplicate
    - _Requirements: 4.1, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x]* 4.5 Write property test for enrollment code generation
  - **Property 5: Enrollment code format consistency**
  - **Validates: Requirements 4.5**

- [x]* 4.6 Write property test for enrollment code uniqueness
  - **Property 6: Enrollment code uniqueness enforcement**
  - **Validates: Requirements 4.1, 4.6**

- [ ] 5. Fix week creation functionality
  - [x] 5.1 Update WeekForm with smart defaults
    - Suggest next sequential week number
    - Suggest start date 7 days after previous week
    - _Requirements: 5.2, 5.3_
  
  - [x] 5.2 Update backend week creation validation
    - Validate all required fields (week_number, title, start_date)
    - Accept week_number as integer >= 1
    - Validate title length 3-200 characters
    - Return complete week object with all fields
    - Return specific error messages for validation failures
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x]* 5.3 Write property test for week creation validation
  - **Property 7: Week creation field validation**
  - **Validates: Requirements 5.1, 5.4, 5.5, 5.6**

- [ ] 6. Fix lesson creation with content types
  - [x] 6.1 Update LessonForm to handle all content types
    - Support content types: video, pdf, link, text
    - Show URL input for video, pdf, link
    - Show text area for text content type
    - Conditionally require URL or text based on content type
    - _Requirements: 6.1, 6.6_
  
  - [x] 6.2 Implement content type validation
    - Video: validate URL is from YouTube or Vimeo
    - PDF: validate URL ends with .pdf or contains /pdf/
    - Link: validate URL is valid web address
    - Text: validate content length up to 50000 characters
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 6.3 Update backend lesson creation
    - Accept content_type values: video, pdf, link, text
    - Store text content in content_url field when content_type is "text"
    - Validate URL format only for non-text content types
    - Return complete lesson object with all fields
    - _Requirements: 6.7, 6.8, 6.9, 6.10_

- [x]* 6.4 Write property test for content type validation
  - **Property 8: Content type validation rules**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

- [ ] 7. Standardize API responses
  - [x] 7.1 Update programme endpoints
    - Ensure GET /programmes/:id returns cohorts and weeks arrays
    - Standardize response format: {error: boolean, message: string, data: {...}}
    - _Requirements: 7.1, 7.6, 7.7_
  
  - [x] 7.2 Update cohort endpoints
    - Ensure POST returns complete cohort object including enrollment_code
    - Standardize error responses
    - _Requirements: 7.2, 7.6, 7.7_
  
  - [x] 7.3 Update week endpoints
    - Ensure POST returns complete week object
    - Standardize error responses
    - _Requirements: 7.3, 7.6, 7.7_
  
  - [x] 7.4 Update lesson endpoints
    - Ensure POST returns complete lesson object
    - Standardize error responses
    - _Requirements: 7.4, 7.6, 7.7_
  
  - [x] 7.5 Implement consistent field naming transformation
    - Ensure backend uses snake_case consistently
    - Ensure frontend transforms to camelCase
    - _Requirements: 7.5_

- [x]* 7.6 Write property test for API response completeness
  - **Property 9: API response completeness**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x]* 7.7 Write property test for error response format
  - **Property 10: Error response format consistency**
  - **Validates: Requirements 7.6, 9.1, 9.2, 9.3**

- [x] 8. Verify and fix database schema
  - [x] 8.1 Create database schema verification script
    - Check cohorts table has enrollment_code column (VARCHAR(50), UNIQUE, NOT NULL)
    - Check weeks table has all required columns
    - Check lessons table has all required columns
    - Check all required indexes exist
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 8.2 Create migration for missing columns
    - Add enrollment_code column to cohorts table if missing
    - Add any other missing columns identified by verification script
    - _Requirements: 8.1, 8.4_
  
  - [x] 8.3 Set up automatic migration execution
    - Configure migrations to run automatically on deployment
    - Add error handling and logging for migration failures
    - Prevent application startup if migrations fail
    - _Requirements: 8.6, 8.7_

- [x] 9. Improve error handling and user feedback
  - [x] 9.1 Update frontend error handling
    - Display specific validation errors from backend (400 errors)
    - Display generic error message for server errors (500 errors)
    - Display network error message for connection failures
    - Keep form data when submission fails
    - Disable submit button while request is in progress
    - _Requirements: 9.1, 9.2, 9.3, 9.6, 9.7_
  
  - [x] 9.2 Update backend error logging
    - Log all API errors with request details
    - Log validation failures with specific field errors
    - Log all errors with stack traces
    - _Requirements: 9.5_
  
  - [x] 9.3 Add frontend error logging
    - Log all form submissions with data being sent
    - Log all API responses (success and error)
    - Log full error details to console
    - _Requirements: 9.4_

- [x] 10. Implement data transformation layer
  - [x] 10.1 Create data transformation utilities
    - Implement toSnakeCase function for frontend → backend
    - Implement toCamelCase function for backend → frontend
    - Handle all field mappings (startDate/start_date, enrollmentCode/enrollment_code, etc.)
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 10.2 Update API client to use transformations
    - Apply toSnakeCase to all outgoing requests
    - Apply toCamelCase to all incoming responses
    - Add error logging for transformation failures
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [x] 10.3 Validate transformed data
    - Add schema validation after transformation
    - Log validation errors with field names
    - _Requirements: 10.5_

- [x]* 10.4 Write property test for data transformation
  - **Property 11: Data transformation round-trip consistency**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 11. Add programme publishing functionality
  - [x] 11.1 Create publish button in programme detail page
    - Add "Publish" button to UI
    - Show current status (draft/published)
    - _Requirements: 12.1_
  
  - [x] 11.2 Implement backend publish endpoint
    - Create POST /v1/api/programmes/:id/publish
    - Update programme status to "published"
    - Return updated programme object
    - _Requirements: 12.4_
  
  - [x] 11.3 Update frontend to handle publish action
    - Call publish endpoint when button clicked
    - Update UI to show "Published" status on success
    - Display error message on failure
    - _Requirements: 12.2, 12.3, 12.5, 12.6_

- [x] 12. Implement edit and delete functionality
  - [x] 12.1 Add edit functionality for all resources
    - Add edit buttons for programmes, cohorts, weeks, lessons
    - Show forms pre-filled with current data
    - Update resources via PUT requests
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 12.2 Add delete functionality for all resources
    - Add delete buttons for programmes, cohorts, weeks, lessons
    - Show confirmation modal before deletion
    - Delete resources via DELETE requests
    - Remove items from UI on successful deletion
    - Display error message on failure
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 13. Add comprehensive logging throughout workflow
  - [x] 13.1 Add frontend logging
    - Log all form submissions with data
    - Log all API responses
    - Log all errors with full details
    - _Requirements: 14.1, 14.2_
  
  - [x] 13.2 Add backend logging
    - Log all incoming requests with user_id and body
    - Log all database operations
    - Log all validation failures
    - Log all errors with stack traces
    - _Requirements: 14.3, 14.4, 14.5, 14.6_
  
  - [x] 13.3 Implement request ID tracing
    - Generate request IDs for all API calls
    - Include request IDs in all logs
    - Pass request IDs from frontend to backend
    - _Requirements: 14.7_

- [ ] 14. Create workflow diagnostic system
  - [ ] 14.1 Create diagnostic script for programme creation
    - Test programme creation with valid data
    - Test with invalid name (too short, too long)
    - Test with invalid date (past date)
    - Test with missing required fields
    - _Requirements: 20.1, 20.2_
  
  - [ ] 14.2 Create diagnostic script for cohort creation
    - Test cohort creation with valid data and unique code
    - Test with duplicate enrollment code
    - Test with invalid code format
    - Test with missing required fields
    - _Requirements: 20.1, 20.3_
  
  - [ ] 14.3 Create diagnostic script for week creation
    - Test week creation with valid data
    - Test with invalid week number (< 1)
    - Test with invalid date
    - Test with missing required fields
    - _Requirements: 20.1, 20.4_
  
  - [ ] 14.4 Create diagnostic script for lesson creation
    - Test video content with valid YouTube URL
    - Test PDF content with valid PDF URL
    - Test link content with valid URL
    - Test text content with plain text
    - Test invalid URLs for each type
    - Test missing required fields
    - _Requirements: 20.1, 20.5_
  
  - [ ] 14.5 Create comprehensive workflow test
    - Test complete workflow: programme → cohort → week → lesson
    - Verify data persistence at each step
    - Verify data consistency across steps
    - Check for orphaned data on failures
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ] 14.6 Create diagnostic report generator
    - Verify API endpoints return expected data structures
    - Check database schema for required columns
    - Verify environment variables are set correctly
    - Test deployment by checking code markers
    - Generate report with all issues found and severity levels
    - _Requirements: 20.6, 20.7, 20.8, 20.9, 20.10_

- [ ]* 14.7 Write property test for workflow data consistency
  - **Property 12: Workflow data consistency**
  - **Validates: Requirements 15.4**

- [ ] 15. Add data persistence and recovery features
  - [ ] 15.1 Implement form data preservation on error
    - Keep all entered data when submission fails
    - Prevent form reset on error
    - _Requirements: 19.1_
  
  - [ ] 15.2 Add unsaved changes warning
    - Detect when form has unsaved changes
    - Show warning when user navigates away
    - _Requirements: 19.2_
  
  - [ ] 15.3 Implement auto-save to local storage
    - Auto-save draft data every 30 seconds
    - Offer to restore draft data when returning to form
    - Clear draft data on successful submission
    - _Requirements: 19.3, 19.4, 19.5_

- [ ] 16. Ensure browser compatibility
  - [ ] 16.1 Test and fix date input handling
    - Ensure date inputs work consistently across Chrome, Firefox, Safari, Edge
    - Provide fallback for browsers without native date picker
    - _Requirements: 16.1, 16.2_
  
  - [ ] 16.2 Test responsive design
    - Verify forms display correctly on desktop and tablet
    - Test all workflows on different screen sizes
    - _Requirements: 16.3_
  
  - [ ] 16.3 Add feature detection and fallbacks
    - Detect unsupported features
    - Provide fallbacks or clear error messages
    - _Requirements: 16.4_

- [ ] 17. Optimize performance and responsiveness
  - [ ] 17.1 Optimize form input responsiveness
    - Ensure form inputs respond within 100ms
    - Show loading state immediately on submission
    - Update UI within 200ms after API response
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [ ] 17.2 Implement debouncing for real-time checks
    - Debounce enrollment code availability check (500ms)
    - Show "Checking availability..." during check
    - _Requirements: 17.4, 17.5_

- [ ] 18. Implement accessibility features
  - [ ] 18.1 Add keyboard navigation support
    - Ensure full keyboard navigation (Tab, Enter, Escape)
    - Provide focus indicators for all interactive elements
    - _Requirements: 18.1, 18.4_
  
  - [ ] 18.2 Add ARIA labels and semantic HTML
    - Add aria-labels for all form inputs
    - Use semantic HTML for forms and buttons
    - _Requirements: 18.2, 18.5_
  
  - [ ] 18.3 Implement screen reader support
    - Announce validation errors to screen readers
    - Move focus to first error on validation failure
    - _Requirements: 18.3, 18.6_

- [ ] 19. Final integration and testing
  - [ ] 19.1 Run complete workflow diagnostic
    - Execute full diagnostic suite
    - Verify all issues are resolved
    - Generate final report
    - _Requirements: 20.1-20.10_
  
  - [ ] 19.2 Test in production environment
    - Deploy all fixes to production
    - Run workflow test script against production
    - Verify deployment verification works
    - Verify cache purging works
    - _Requirements: 1.1-1.7_
  
  - [ ] 19.3 Create workflow test script for conveners
    - Provide script that creates complete programme with all components
    - Verify all created data is accessible via API
    - _Requirements: 15.6, 15.7_

- [ ] 20. Checkpoint - Ensure all tests pass and workflow is functional
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation follows a layered approach: infrastructure → validation → API → diagnostics
- Comprehensive logging is added throughout to aid debugging
- The diagnostic system provides systematic verification of all fixes
- All fixes are designed to work together as a cohesive solution
