# Requirements Document: Assignment Submission Backend

## Introduction

The Assignment Submission Backend provides the API endpoints and database infrastructure required by the frontend Assignment Submission System. The frontend is production-ready and expects specific API endpoints that currently do not exist. This backend implementation is a CRITICAL BLOCKER for production deployment of the assignment submission feature.

The backend must follow existing Cohortle API patterns, use BackendSDK for database operations, implement proper authentication and authorization, support file uploads, and provide comprehensive error handling.

## Glossary

- **Assignment_API**: The backend API endpoints for assignment management
- **Submission_API**: The backend API endpoints for submission management
- **BackendSDK**: The database abstraction layer used throughout the Cohortle API
- **TokenMiddleware**: Authentication middleware that validates JWT tokens and extracts user information
- **ValidationService**: Service for validating request payloads
- **File_Upload_Handler**: Component responsible for handling multipart/form-data file uploads
- **Database_Migration**: Script that creates or modifies database tables
- **Authorization_Check**: Logic that verifies a user has permission to perform an action
- **Convener**: An educator who creates assignments and grades submissions
- **Learner**: A student who submits assignments
- **Assignment_Record**: A database record in the assignments table
- **Submission_Record**: A database record in the submissions table
- **Submission_File_Record**: A database record in the submission_files table

## Requirements

### Requirement 1: Assignment Creation Endpoint

**User Story:** As a convener, I want to create an assignment for a lesson via API, so that students can see and submit the assignment.

#### Acceptance Criteria

1. WHEN a convener sends a POST request to /v1/api/lessons/:lessonId/assignments, THE Assignment_API SHALL validate the request contains title, instructions, and dueDate
2. WHEN the request is valid, THE Assignment_API SHALL create an Assignment_Record in the database with the provided data
3. WHEN the assignment is created, THE Assignment_API SHALL return the created assignment with HTTP status 201
4. IF the lesson does not exist, THEN THE Assignment_API SHALL return an error with HTTP status 404
5. IF the user is not a convener, THEN THE Assignment_API SHALL return an error with HTTP status 403

### Requirement 2: Assignment Retrieval Endpoints

**User Story:** As a user, I want to retrieve assignment information via API, so that I can display assignments in the frontend.

#### Acceptance Criteria

1. WHEN a user sends a GET request to /v1/api/lessons/:lessonId/assignments, THE Assignment_API SHALL return the assignment for that lesson if it exists
2. IF no assignment exists for the lesson, THEN THE Assignment_API SHALL return null with HTTP status 200
3. WHEN a learner sends a GET request to /v1/api/students/assignments, THE Assignment_API SHALL return all assignments from cohorts the learner is enrolled in
4. WHEN returning assignments to a learner, THE Assignment_API SHALL include the learner's submission status for each assignment
5. THE Assignment_API SHALL include authentication tokens in all requests

### Requirement 3: Assignment Update Endpoint

**User Story:** As a convener, I want to update an existing assignment via API, so that I can correct mistakes or adjust requirements.

#### Acceptance Criteria

1. WHEN a convener sends a PUT request to /v1/api/assignments/:assignmentId, THE Assignment_API SHALL validate the request contains at least one field to update
2. WHEN the request is valid, THE Assignment_API SHALL update the Assignment_Record with the provided data
3. WHEN the assignment is updated, THE Assignment_API SHALL return the updated assignment with HTTP status 200
4. IF the assignment does not exist, THEN THE Assignment_API SHALL return an error with HTTP status 404
5. IF the user is not a convener, THEN THE Assignment_API SHALL return an error with HTTP status 403

### Requirement 4: Assignment Deletion Endpoint

**User Story:** As a convener, I want to delete an assignment via API, so that I can remove assignments that are no longer needed.

#### Acceptance Criteria

1. WHEN a convener sends a DELETE request to /v1/api/assignments/:assignmentId, THE Assignment_API SHALL delete the Assignment_Record from the database
2. WHEN the assignment is deleted, THE Assignment_API SHALL also delete all associated Submission_Records and Submission_File_Records
3. WHEN the deletion is successful, THE Assignment_API SHALL return a success message with HTTP status 200
4. IF the assignment does not exist, THEN THE Assignment_API SHALL return an error with HTTP status 404
5. IF the user is not a convener, THEN THE Assignment_API SHALL return an error with HTTP status 403

### Requirement 5: Submission Creation Endpoint

**User Story:** As a learner, I want to submit an assignment via API with files and text, so that my work is recorded.

#### Acceptance Criteria

1. WHEN a learner sends a POST request to /v1/api/assignments/:id/submissions with multipart/form-data, THE Submission_API SHALL accept textAnswer and file uploads
2. WHEN the request contains files, THE File_Upload_Handler SHALL validate each file type is in [.pdf, .png, .jpg, .jpeg, .doc, .docx]
3. WHEN the request contains files, THE File_Upload_Handler SHALL validate each file size does not exceed 10MB
4. WHEN validation passes, THE Submission_API SHALL create a Submission_Record with status 'submitted'
5. WHEN files are uploaded, THE Submission_API SHALL create Submission_File_Records for each file with fileName, fileUrl, fileType, and fileSize

### Requirement 6: Submission Retrieval Endpoints

**User Story:** As a user, I want to retrieve submission information via API, so that I can display submissions in the frontend.

#### Acceptance Criteria

1. WHEN a convener sends a GET request to /v1/api/assignments/:id/submissions, THE Submission_API SHALL return all submissions for that assignment
2. WHEN returning submissions to a convener, THE Submission_API SHALL include student information (name, email, avatar) for each submission
3. WHEN a learner sends a GET request to /v1/api/assignments/:id/submissions, THE Submission_API SHALL return only their own submission
4. WHEN a user sends a GET request to /v1/api/assignments/:id/submissions/:subId, THE Submission_API SHALL return the specific submission if authorized
5. THE Submission_API SHALL enforce authorization so learners can only view their own submissions

### Requirement 7: Submission Update Endpoint

**User Story:** As a learner, I want to update my submission via API before the due date, so that I can improve my work.

#### Acceptance Criteria

1. WHEN a learner sends a PUT request to /v1/api/submissions/:submissionId, THE Submission_API SHALL validate the current date is before the assignment due date
2. IF the due date has passed, THEN THE Submission_API SHALL return an error with HTTP status 403
3. WHEN the request is valid, THE Submission_API SHALL update the Submission_Record with the provided data
4. WHEN files are added, THE Submission_API SHALL create new Submission_File_Records
5. THE Submission_API SHALL enforce authorization so learners can only update their own submissions

### Requirement 8: Grading Endpoint

**User Story:** As a convener, I want to grade a submission via API, so that students receive feedback.

#### Acceptance Criteria

1. WHEN a convener sends a POST request to /v1/api/submissions/:submissionId/grade, THE Submission_API SHALL validate the request contains status ('passed' or 'failed')
2. WHEN the request is valid, THE Submission_API SHALL update the Submission_Record with gradingStatus and optional feedback
3. WHEN the submission is graded, THE Submission_API SHALL set gradedAt to the current timestamp
4. WHEN the submission is graded, THE Submission_API SHALL change the submission status to 'graded'
5. IF the user is not a convener, THEN THE Submission_API SHALL return an error with HTTP status 403

### Requirement 9: Submission Download Endpoints

**User Story:** As a convener, I want to download submissions via API, so that I can review work offline.

#### Acceptance Criteria

1. WHEN a convener sends a GET request to /v1/api/submissions/:submissionId/download, THE Submission_API SHALL return the submission files as a downloadable package
2. WHEN a convener sends a GET request to /v1/api/assignments/:id/download-all, THE Submission_API SHALL return all submission files for that assignment
3. WHEN packaging files, THE Submission_API SHALL organize files by student name or ID
4. WHEN a submission contains text answers, THE Submission_API SHALL include the text in a readable format
5. IF the user is not a convener, THEN THE Submission_API SHALL return an error with HTTP status 403

### Requirement 10: Database Schema

**User Story:** As a system administrator, I want proper database tables for assignments and submissions, so that data is stored reliably.

#### Acceptance Criteria

1. THE Database_Migration SHALL create an assignments table with columns: id, lesson_id, title, instructions, due_date, created_at, updated_at
2. THE Database_Migration SHALL create a submissions table with columns: id, assignment_id, student_id, text_answer, status, grading_status, feedback, submitted_at, graded_at, created_at, updated_at
3. THE Database_Migration SHALL create a submission_files table with columns: id, submission_id, file_name, file_url, file_type, file_size, uploaded_at
4. THE Database_Migration SHALL create foreign key constraints: assignments.lesson_id → module_lessons.id, submissions.assignment_id → assignments.id, submissions.student_id → users.id, submission_files.submission_id → submissions.id
5. THE Database_Migration SHALL create indexes on foreign key columns for query performance

### Requirement 11: Authentication and Authorization

**User Story:** As a system administrator, I want proper authentication and authorization, so that users can only access data they're permitted to see.

#### Acceptance Criteria

1. WHEN any API request is received, THE TokenMiddleware SHALL validate the JWT token from the Authorization header
2. WHEN the token is invalid or missing, THE TokenMiddleware SHALL return an error with HTTP status 401
3. WHEN a convener-only endpoint is accessed, THE Authorization_Check SHALL verify the user has role 'convener'
4. WHEN a learner accesses their own submission, THE Authorization_Check SHALL verify the submission belongs to that learner
5. WHEN a convener accesses submissions, THE Authorization_Check SHALL verify the convener manages the cohort containing the assignment

### Requirement 12: Input Validation

**User Story:** As a system administrator, I want comprehensive input validation, so that invalid data is rejected before database operations.

#### Acceptance Criteria

1. WHEN creating an assignment, THE ValidationService SHALL validate title is a non-empty string with max length 200
2. WHEN creating an assignment, THE ValidationService SHALL validate instructions is a non-empty string with max length 5000
3. WHEN creating an assignment, THE ValidationService SHALL validate dueDate is a valid ISO 8601 date string
4. WHEN uploading files, THE ValidationService SHALL validate file extensions are in the allowed list
5. WHEN uploading files, THE ValidationService SHALL validate file sizes do not exceed 10MB

### Requirement 13: Error Handling

**User Story:** As a developer, I want consistent error responses, so that the frontend can display appropriate messages.

#### Acceptance Criteria

1. WHEN validation fails, THE API SHALL return an error response with structure { error: true, message: string }
2. WHEN a resource is not found, THE API SHALL return HTTP status 404 with a descriptive message
3. WHEN authorization fails, THE API SHALL return HTTP status 403 with a descriptive message
4. WHEN authentication fails, THE API SHALL return HTTP status 401 with a descriptive message
5. WHEN an unexpected error occurs, THE API SHALL return HTTP status 500 and log the error details

### Requirement 14: File Upload Handling

**User Story:** As a developer, I want robust file upload handling, so that files are stored reliably.

#### Acceptance Criteria

1. WHEN files are uploaded, THE File_Upload_Handler SHALL use multer to parse multipart/form-data
2. WHEN files are uploaded, THE File_Upload_Handler SHALL store files temporarily on disk before processing
3. WHEN files are processed, THE File_Upload_Handler SHALL upload them to the configured storage service (Bunny CDN or local storage)
4. WHEN file upload fails, THE File_Upload_Handler SHALL return a specific error message indicating which file failed
5. WHEN file upload succeeds, THE File_Upload_Handler SHALL return the file URL for database storage

### Requirement 15: Submission Statistics

**User Story:** As a convener, I want submission statistics via API, so that I can track student progress.

#### Acceptance Criteria

1. WHEN a convener requests submissions for an assignment, THE Submission_API SHALL calculate totalStudents from cohort enrollment
2. WHEN calculating statistics, THE Submission_API SHALL count submissions by status (submitted, graded, pending)
3. WHEN calculating statistics, THE Submission_API SHALL count submissions by gradingStatus (passed, failed)
4. WHEN returning statistics, THE Submission_API SHALL include a breakdown showing each student's submission status
5. THE Submission_API SHALL return statistics in the format expected by the frontend SubmissionStatistics interface

### Requirement 16: Data Consistency

**User Story:** As a system administrator, I want data consistency guarantees, so that the database remains in a valid state.

#### Acceptance Criteria

1. WHEN an assignment is deleted, THE API SHALL use CASCADE delete to remove all associated submissions and files
2. WHEN a submission is created, THE API SHALL verify the assignment exists before creating the submission
3. WHEN a submission is created, THE API SHALL verify the student is enrolled in a cohort that has access to the lesson
4. WHEN updating a submission, THE API SHALL use database transactions to ensure atomicity
5. WHEN grading a submission, THE API SHALL verify the submission exists and is in 'submitted' status

### Requirement 17: Performance Optimization

**User Story:** As a developer, I want optimized database queries, so that the API responds quickly.

#### Acceptance Criteria

1. WHEN fetching assignments with submissions, THE API SHALL use JOIN queries to minimize database round trips
2. WHEN fetching submission lists, THE API SHALL use pagination if the result set exceeds 100 records
3. WHEN fetching student information, THE API SHALL batch user queries to avoid N+1 query problems
4. THE Database_Migration SHALL create indexes on frequently queried columns (lesson_id, assignment_id, student_id)
5. WHEN returning large file lists, THE API SHALL return file metadata without loading file contents into memory

### Requirement 18: API Response Format

**User Story:** As a frontend developer, I want consistent API response formats, so that I can reliably parse responses.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE API SHALL return { error: false, message: string, data: object }
2. WHEN an API request fails, THE API SHALL return { error: true, message: string }
3. WHEN returning assignments, THE API SHALL use camelCase for field names to match TypeScript interfaces
4. WHEN returning dates, THE API SHALL format them as ISO 8601 strings
5. WHEN returning null values, THE API SHALL use null instead of undefined or empty strings

### Requirement 19: Logging and Monitoring

**User Story:** As a system administrator, I want comprehensive logging, so that I can troubleshoot issues.

#### Acceptance Criteria

1. WHEN an error occurs, THE API SHALL log the error message, stack trace, and request context
2. WHEN a file upload fails, THE API SHALL log the file name, size, and error reason
3. WHEN authorization fails, THE API SHALL log the user ID and attempted action
4. WHEN database queries fail, THE API SHALL log the query and error message
5. THE API SHALL use console.error for errors and console.log for informational messages

### Requirement 20: Testing Support

**User Story:** As a developer, I want the backend to support testing, so that I can verify correctness.

#### Acceptance Criteria

1. THE API SHALL support test database connections for running integration tests
2. THE API SHALL provide seed data scripts for creating test assignments and submissions
3. THE API SHALL support mocking file uploads for testing without actual file storage
4. THE API SHALL provide utility functions for creating test users with different roles
5. THE API SHALL support running migrations in test environments without affecting production data
