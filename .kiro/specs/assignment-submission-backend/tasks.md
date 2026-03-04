# Implementation Plan: Assignment Submission Backend

## Overview

This implementation plan creates the complete backend API infrastructure for the Assignment Submission System. The backend follows existing Cohortle API patterns, using Express.js routes, BackendSDK for database operations, and TokenMiddleware for authentication. The implementation is organized into database setup, route handlers, validation, file handling, and testing.

## Tasks

- [ ] 1. Create database migration for assignment tables
  - Create migration file following the pattern in `migrations/20260220000000-add-post-visibility-scope.js`
  - Define assignments table with columns: id, lesson_id, title, instructions, due_date, created_at, updated_at
  - Define submissions table with columns: id, assignment_id, student_id, text_answer, status, grading_status, feedback, submitted_at, graded_at, created_at, updated_at
  - Define submission_files table with columns: id, submission_id, file_name, file_url, file_type, file_size, uploaded_at
  - Add foreign key constraints with CASCADE delete
  - Add indexes on lesson_id, assignment_id, student_id, submission_id
  - Add UNIQUE constraint on (assignment_id, student_id) in submissions table
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 2. Create assignment route handlers
  - [ ] 2.1 Create routes/assignment.js following the pattern in routes/lesson.js
    - Set up Express router with module.exports function
    - Import BackendSDK, TokenMiddleware, UrlMiddleware, ValidationService
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.2 Implement POST /v1/api/lessons/:lessonId/assignments
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Validate request body (title, instructions, due_date)
    - Check lesson exists using BackendSDK
    - Insert assignment record into assignments table
    - Return created assignment with HTTP 201
    - Handle errors: 400 (validation), 404 (lesson not found), 403 (not convener)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.3 Write property test for assignment creation round-trip
    - **Property 1: Assignment Creation Round-Trip**
    - **Validates: Requirements 1.2, 2.1**

  - [ ] 2.4 Implement GET /v1/api/lessons/:lessonId/assignments
    - Apply UrlMiddleware and TokenMiddleware with role 'convener|learner'
    - Fetch assignment by lesson_id using BackendSDK
    - If learner, include their submission using JOIN or separate query
    - Return assignment or null with HTTP 200
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.5 Write property test for learner assignments include submission status
    - **Property 8: Learner Assignments Include Submission Status**
    - **Validates: Requirements 2.4**

  - [ ] 2.6 Implement PUT /v1/api/assignments/:assignmentId
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Validate request body has at least one field
    - Check assignment exists
    - Update assignment record using BackendSDK
    - Return updated assignment with HTTP 200
    - Handle errors: 400 (validation), 404 (not found), 403 (not convener)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.7 Write property test for assignment update round-trip
    - **Property 10: Assignment Update Round-Trip**
    - **Validates: Requirements 3.2**

  - [ ] 2.8 Implement DELETE /v1/api/assignments/:assignmentId
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Check assignment exists
    - Delete assignment using BackendSDK (CASCADE will handle submissions and files)
    - Return success message with HTTP 200
    - Handle errors: 404 (not found), 403 (not convener)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.9 Write property test for cascade deletion
    - **Property 13: Cascade Deletion of Submissions**
    - **Validates: Requirements 4.2, 16.1**

  - [ ] 2.10 Implement GET /v1/api/students/assignments
    - Apply UrlMiddleware and TokenMiddleware with role 'learner'
    - Query cohorts where student is enrolled
    - Query lessons from those cohorts' modules
    - Query assignments for those lessons
    - Include student's submission status for each assignment
    - Return assignments array with HTTP 200
    - _Requirements: 2.3, 2.4_

  - [ ]* 2.11 Write property test for student assignments include enrollment
    - **Property 7: Student Assignments Include Enrollment**
    - **Validates: Requirements 2.3**

- [ ] 3. Checkpoint - Ensure assignment routes work
  - Test assignment creation, retrieval, update, and deletion manually or with unit tests
  - Verify database records are created correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create file upload configuration
  - [ ] 4.1 Create config/submissionUpload.js for file handling
    - Configure multer with diskStorage using os.tmpdir()
    - Set file size limit to 10MB
    - Add fileFilter for allowed extensions [.pdf, .png, .jpg, .jpeg, .doc, .docx]
    - Export upload middleware and validation functions
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 4.2 Create file upload service function
    - Implement uploadSubmissionFile(file) function
    - Support Bunny CDN upload if configured (follow bunnyStream.js pattern)
    - Fall back to local storage for development/testing
    - Return file URL after successful upload
    - Clean up temporary files after upload
    - _Requirements: 14.3, 14.4, 14.5_

  - [ ]* 4.3 Write property test for file type validation
    - **Property 16: File Type Validation**
    - **Validates: Requirements 5.2, 12.4**

  - [ ]* 4.4 Write property test for file size validation
    - **Property 17: File Size Validation**
    - **Validates: Requirements 5.3, 12.5**

- [ ] 5. Create submission route handlers
  - [ ] 5.1 Create routes/submission.js following the pattern in routes/assignment.js
    - Set up Express router with module.exports function
    - Import BackendSDK, TokenMiddleware, UrlMiddleware, ValidationService
    - Import upload middleware from config/submissionUpload.js
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.2 Implement POST /v1/api/assignments/:id/submissions
    - Apply UrlMiddleware, TokenMiddleware with role 'learner', and upload.array('files', 10)
    - Validate assignment exists and due date not passed
    - Validate uploaded files (type and size)
    - Upload files to storage and get URLs
    - Create submission record with status 'submitted'
    - Create submission_files records for each file
    - Return created submission with HTTP 201
    - Handle errors: 400 (validation), 404 (assignment not found), 403 (due date passed or not learner)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 16.2, 16.3_

  - [ ]* 5.3 Write property test for submission accepts multipart data
    - **Property 15: Submission Accepts Multipart Data**
    - **Validates: Requirements 5.1**

  - [ ]* 5.4 Write property test for file records created
    - **Property 19: File Records Created for Uploads**
    - **Validates: Requirements 5.5**

  - [ ] 5.5 Implement GET /v1/api/assignments/:id/submissions
    - Apply UrlMiddleware and TokenMiddleware with role 'convener|learner'
    - Check user role
    - If convener: fetch all submissions with student info using JOIN
    - If learner: fetch only their submission
    - Include submission_files for each submission
    - Return submissions array with HTTP 200
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 5.6 Write property test for convener sees all submissions
    - **Property 20: Convener Sees All Submissions**
    - **Validates: Requirements 6.1**

  - [ ]* 5.7 Write property test for learner sees only own submission
    - **Property 22: Learner Sees Only Own Submission**
    - **Validates: Requirements 6.3, 6.5, 11.4**

  - [ ] 5.8 Implement GET /v1/api/assignments/:id/submissions/:subId
    - Apply UrlMiddleware and TokenMiddleware with role 'convener|learner'
    - Fetch submission with submission_files
    - Check authorization (owner or convener managing cohort)
    - Return submission with HTTP 200
    - Handle errors: 404 (not found), 403 (not authorized)
    - _Requirements: 6.4_

  - [ ] 5.9 Implement PUT /v1/api/submissions/:submissionId
    - Apply UrlMiddleware, TokenMiddleware with role 'learner', and upload.array('files', 10)
    - Fetch submission and assignment
    - Check ownership (submission.student_id === req.user_id)
    - Check due date not passed
    - Validate and upload new files
    - Update submission record
    - Create new submission_files records
    - Return updated submission with HTTP 200
    - Handle errors: 400 (validation), 404 (not found), 403 (not owner or due date passed)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.10 Write property test for due date validation
    - **Property 24: Due Date Validation for Updates**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 5.11 Write property test for submission update round-trip
    - **Property 25: Submission Update Round-Trip**
    - **Validates: Requirements 7.3**

  - [ ] 5.12 Implement POST /v1/api/submissions/:submissionId/grade
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Validate request body (status: 'passed'|'failed', optional feedback)
    - Fetch submission
    - Verify submission exists and is in 'submitted' status
    - Update submission with gradingStatus, feedback, gradedAt, status='graded'
    - Return graded submission with HTTP 200
    - Handle errors: 400 (validation), 404 (not found), 403 (not convener)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 16.5_

  - [ ]* 5.13 Write property test for grading round-trip
    - **Property 29: Grading Round-Trip**
    - **Validates: Requirements 8.2**

  - [ ]* 5.14 Write property test for grade status validation
    - **Property 28: Grade Status Validation**
    - **Validates: Requirements 8.1**

- [ ] 6. Checkpoint - Ensure submission routes work
  - Test submission creation, retrieval, update, and grading manually or with unit tests
  - Verify file uploads work correctly
  - Verify authorization checks work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement download endpoints
  - [ ] 7.1 Install archiver package for ZIP creation
    - Run `npm install archiver` or `yarn add archiver`
    - _Requirements: 9.1, 9.2_

  - [ ] 7.2 Implement GET /v1/api/submissions/:submissionId/download
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Fetch submission with files
    - Create ZIP archive using archiver
    - Add all files to ZIP
    - If text_answer exists, create text file and add to ZIP
    - Stream ZIP to response with appropriate headers
    - Handle errors: 404 (not found), 403 (not convener), 500 (ZIP creation failed)
    - _Requirements: 9.1, 9.4, 9.5_

  - [ ] 7.3 Implement GET /v1/api/assignments/:id/download-all
    - Apply UrlMiddleware and TokenMiddleware with role 'convener'
    - Fetch all submissions for assignment with files and student info
    - Create ZIP archive with folders per student
    - For each submission: create student folder, add files, add text file if text_answer exists
    - Stream ZIP to response with appropriate headers
    - Handle errors: 404 (not found), 403 (not convener), 500 (ZIP creation failed)
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [ ]* 7.4 Write property test for download includes all files
    - **Property 32: Single Submission Download Includes Files**
    - **Validates: Requirements 9.1**

  - [ ]* 7.5 Write property test for bulk download includes all submissions
    - **Property 33: Bulk Download Includes All Submissions**
    - **Validates: Requirements 9.2**

- [ ] 8. Implement submission statistics
  - [ ] 8.1 Create helper function calculateSubmissionStats(assignmentId, sdk)
    - Query cohorts that have access to the assignment's lesson
    - Query enrolled students in those cohorts
    - Query submissions for the assignment
    - Calculate totalStudents, submittedCount, gradedCount, pendingCount, passedCount, failedCount
    - Build students array with submission status for each student
    - Return statistics object matching SubmissionStatistics interface
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 8.2 Integrate statistics into GET /v1/api/lessons/:lessonId/assignments for conveners
    - When user is convener, call calculateSubmissionStats
    - Include submissionStats in assignment response
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 8.3 Write property test for statistics calculations
    - **Property 48: Total Students Matches Enrollment**
    - **Property 49: Submission Status Counts Sum Correctly**
    - **Property 50: Grading Status Counts Sum Correctly**
    - **Validates: Requirements 15.1, 15.2, 15.3**

- [ ] 9. Add authorization helper functions
  - [ ] 9.1 Create utils/assignmentAuth.js with authorization helpers
    - Implement isConvenerForAssignment(userId, assignmentId, sdk)
    - Implement isSubmissionOwner(userId, submissionId, sdk)
    - Implement isStudentEnrolledForLesson(userId, lessonId, sdk)
    - Export helper functions
    - _Requirements: 11.3, 11.4, 11.5, 16.3_

  - [ ] 9.2 Integrate authorization helpers into route handlers
    - Use helpers in submission routes to verify access
    - Use helpers in download routes to verify convener manages cohort
    - _Requirements: 11.3, 11.4, 11.5_

  - [ ]* 9.3 Write property test for convener authorization
    - **Property 5: Convener Authorization**
    - **Validates: Requirements 1.5, 3.5, 4.5, 8.5, 9.5, 11.3**

  - [ ]* 9.4 Write property test for learner authorization
    - **Property 27: Learner Updates Only Own Submission**
    - **Validates: Requirements 7.5**

- [ ] 10. Add comprehensive validation
  - [ ] 10.1 Create validation rules for all endpoints
    - Add validation for title length (1-200 characters)
    - Add validation for instructions length (1-5000 characters)
    - Add validation for due_date format (ISO 8601)
    - Add validation for grading status ('passed'|'failed')
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 10.2 Write property tests for validation rules
    - **Property 38: Title Length Validation**
    - **Property 39: Instructions Length Validation**
    - **Property 40: Due Date Format Validation**
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ] 11. Implement error handling and logging
  - [ ] 11.1 Add consistent error handling to all routes
    - Wrap route handlers in try-catch blocks
    - Return consistent error response format { error: true, message: string }
    - Include descriptive error messages for all error types
    - Log errors with console.error including stack traces
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 19.1, 19.2, 19.3, 19.4_

  - [ ]* 11.2 Write property tests for error response formats
    - **Property 41: Error Response Format**
    - **Property 42: 404 Error Includes Message**
    - **Property 43: 403 Error Includes Message**
    - **Property 44: 401 Error Includes Message**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 18.2**

- [ ] 12. Implement response formatting
  - [ ] 12.1 Create utils/responseFormatter.js for consistent responses
    - Implement formatAssignment(assignment) to convert snake_case to camelCase
    - Implement formatSubmission(submission) to convert snake_case to camelCase
    - Implement formatDate(date) to ensure ISO 8601 format
    - Handle null values correctly (return null, not undefined or empty string)
    - Export formatter functions
    - _Requirements: 18.1, 18.3, 18.4, 18.5_

  - [ ] 12.2 Integrate formatters into all route responses
    - Apply formatters to all assignment and submission responses
    - Ensure all dates are formatted consistently
    - Ensure all null values are handled correctly
    - _Requirements: 18.1, 18.3, 18.4, 18.5_

  - [ ]* 12.3 Write property tests for response formatting
    - **Property 57: Success Response Format**
    - **Property 58: CamelCase Field Names**
    - **Property 59: ISO 8601 Date Format**
    - **Property 60: Null Values Are Null**
    - **Validates: Requirements 18.1, 18.3, 18.4, 18.5**

- [ ] 13. Register routes in main app
  - [ ] 13.1 Import and register assignment routes in app.js or index.js
    - Add `require('./routes/assignment')(app);`
    - Add `require('./routes/submission')(app);`
    - Ensure routes are registered after middleware setup
    - _Requirements: 1.1, 5.1_

- [ ] 14. Create integration tests
  - [ ]* 14.1 Write integration test for complete submission flow
    - Test: convener creates assignment → learner submits → convener grades → learner sees grade
    - Verify all steps work end-to-end
    - _Requirements: All requirements_

  - [ ]* 14.2 Write integration test for file upload flow
    - Test: learner uploads multiple files → files are stored → convener downloads all
    - Verify file handling works end-to-end
    - _Requirements: 5.2, 5.3, 5.5, 9.1, 9.2_

  - [ ]* 14.3 Write integration test for authorization flow
    - Test: learner cannot access other learner's submission
    - Test: non-convener cannot create assignment
    - Test: learner cannot grade submission
    - Verify all authorization checks work
    - _Requirements: 1.5, 6.3, 7.5, 8.5_

- [ ] 15. Final checkpoint - Complete testing and verification
  - Run all unit tests and property tests
  - Run all integration tests
  - Verify database migration works correctly
  - Test all endpoints manually with Postman or similar tool
  - Verify error handling works for all error cases
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Follow existing patterns from `routes/lesson.js` and `config/bunnyStream.js` for consistency
- Use BackendSDK for all database operations
- Use TokenMiddleware for all authentication
- Use ValidationService for all input validation
- Ensure all responses follow the consistent format { error: boolean, message: string, data?: object }
