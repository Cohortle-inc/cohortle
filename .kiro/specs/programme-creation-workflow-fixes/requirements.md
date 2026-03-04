# Requirements Document

## Introduction

This specification addresses the systematic identification and resolution of all issues preventing the Programme Creation Workflow from functioning correctly in production. The workflow encompasses the complete convener self-service journey: Programme → Cohort → Week → Lesson creation, along with all supporting features like enrollment code management, form validation, and data persistence.

## Glossary

- **System**: The Cohortle web application (frontend and backend)
- **Convener**: A user with permission to create and manage programmes
- **Programme**: A learning programme containing cohorts, weeks, and lessons
- **Cohort**: A group of learners enrolled in a programme with a unique enrollment code
- **Week**: A time-based module within a programme containing lessons
- **Lesson**: Individual learning content (video, PDF, link, or text)
- **Workflow**: The complete sequence of creating a programme and its components
- **Deployment**: The process of making code changes live in production
- **Form_Validation**: Client-side and server-side validation of user input
- **API_Endpoint**: Backend route that handles specific operations
- **Data_Structure**: The format and schema of data exchanged between frontend and backend

## Requirements

### Requirement 1: Deployment and Cache Management

**User Story:** As a developer, I want code changes to be deployed to production reliably, so that bug fixes and new features reach users immediately.

#### Acceptance Criteria

1. WHEN code is pushed to the main branch, THE System SHALL trigger automatic deployment via Coolify
2. WHEN deployment completes successfully, THE System SHALL serve the new code to all users
3. WHEN frontend code changes, THE System SHALL clear Cloudflare cache automatically
4. WHEN backend code changes, THE System SHALL restart the API server with new code
5. IF deployment fails, THEN THE System SHALL log detailed error messages and maintain the previous working version
6. WHEN environment variables are changed, THE System SHALL rebuild and redeploy affected services
7. THE System SHALL verify deployment success by checking for specific code markers in production

### Requirement 2: Environment Configuration

**User Story:** As a system administrator, I want all environment variables configured correctly, so that the application connects to the right services and operates in the correct mode.

#### Acceptance Criteria

1. THE Backend SHALL have NODE_ENV set to "production" in production environment
2. THE Backend SHALL have DB_DATABASE set to the actual database name (not "cohortle.com")
3. THE Frontend SHALL have NEXT_PUBLIC_API_URL available at both build time and runtime
4. WHEN environment variables are missing or incorrect, THEN THE System SHALL fail fast with clear error messages
5. THE System SHALL validate all required environment variables on startup
6. THE System SHALL log environment configuration (without sensitive values) for debugging

### Requirement 3: Programme Form Validation

**User Story:** As a convener, I want programme creation forms to validate my input correctly, so that I can create programmes without encountering false validation errors.

#### Acceptance Criteria

1. WHEN a convener enters a start date, THE System SHALL validate it using local timezone (not UTC)
2. WHEN a convener fills out a form, THE System SHALL only show validation errors after form submission (not on blur)
3. WHEN validation fails, THE System SHALL display specific, actionable error messages
4. WHEN a convener enters a programme name, THE System SHALL require at least 3 characters and maximum 200 characters
5. WHEN a convener enters a description, THE System SHALL allow up to 1000 characters
6. WHEN a convener selects a start date in the past, THE System SHALL reject it with message "Start date cannot be in the past"
7. THE System SHALL prevent form submission while validation is in progress

### Requirement 4: Cohort Creation with Enrollment Codes

**User Story:** As a convener, I want to create cohorts with unique enrollment codes, so that learners can join my programme.

#### Acceptance Criteria

1. WHEN a convener creates a cohort, THE System SHALL require a unique enrollment code
2. WHEN a convener types an enrollment code, THE System SHALL check availability in real-time (debounced by 500ms)
3. WHEN an enrollment code is already in use, THE System SHALL display "This code is already in use" and prevent submission
4. WHEN an enrollment code is available, THE System SHALL display "This code is available" in green
5. WHEN a convener clicks "Generate", THE System SHALL create a code in format "PROG-YYYY-XXXXXX" where YYYY is current year and XXXXXX is random alphanumeric
6. THE Backend SHALL validate enrollment code uniqueness before inserting into database
7. WHEN enrollment code check fails, THE Backend SHALL return 400 with specific error message
8. THE Backend SHALL accept enrollment_code field in cohort creation request
9. THE Backend SHALL store enrollment_code in the cohorts table
10. THE Backend SHALL return the created cohort object including enrollment_code

### Requirement 5: Week Creation

**User Story:** As a convener, I want to create weeks for my programme, so that I can organize lessons into time-based modules.

#### Acceptance Criteria

1. WHEN a convener creates a week, THE System SHALL require week_number, title, and start_date
2. WHEN a convener creates a week, THE System SHALL suggest the next sequential week number
3. WHEN a previous week exists, THE System SHALL suggest a start date 7 days after the previous week
4. THE Backend SHALL validate all required fields (week_number, title, start_date)
5. THE Backend SHALL accept week_number as an integer >= 1
6. THE Backend SHALL accept title with length 3-200 characters
7. THE Backend SHALL return the created week object with all fields
8. WHEN week creation fails, THE Backend SHALL return specific error messages with 400 or 500 status

### Requirement 6: Lesson Creation with Content Types

**User Story:** As a convener, I want to create lessons with different content types, so that I can provide varied learning materials.

#### Acceptance Criteria

1. WHEN a convener creates a lesson, THE System SHALL support content types: video, pdf, link, text
2. WHEN content type is "video", THE System SHALL validate URL is from YouTube or Vimeo
3. WHEN content type is "pdf", THE System SHALL validate URL ends with .pdf or contains /pdf/
4. WHEN content type is "link", THE System SHALL validate URL is a valid web address
5. WHEN content type is "text", THE System SHALL accept plain text content up to 50000 characters
6. WHEN content type is "text", THE System SHALL NOT require a URL
7. THE Backend SHALL accept content_type values: video, pdf, link, text
8. THE Backend SHALL store text content in the content_url field when content_type is "text"
9. THE Backend SHALL validate URL format only for non-text content types
10. THE Backend SHALL return the created lesson object with all fields

### Requirement 7: API Response Consistency

**User Story:** As a frontend developer, I want API responses to match expected data structures, so that the UI can display data correctly.

#### Acceptance Criteria

1. WHEN a programme is fetched, THE Backend SHALL return cohorts array and weeks array
2. WHEN a cohort is created, THE Backend SHALL return the complete cohort object including enrollment_code
3. WHEN a week is created, THE Backend SHALL return the complete week object including all fields
4. WHEN a lesson is created, THE Backend SHALL return the complete lesson object including all fields
5. THE Backend SHALL use consistent field naming (snake_case in API, transformed to camelCase in frontend)
6. WHEN an error occurs, THE Backend SHALL return {error: true, message: "specific error"}
7. WHEN an operation succeeds, THE Backend SHALL return {error: false, message: "success message", data: {...}}

### Requirement 8: Database Schema Completeness

**User Story:** As a system administrator, I want all required database columns to exist, so that data can be stored without errors.

#### Acceptance Criteria

1. THE cohorts table SHALL have an enrollment_code column (VARCHAR(50), UNIQUE, NOT NULL)
2. THE weeks table SHALL have all required columns (id, programme_id, week_number, title, start_date)
3. THE lessons table SHALL have all required columns (id, week_id, title, content_type, content_url, order_index)
4. WHEN migrations run, THE System SHALL create all missing columns
5. WHEN migrations run, THE System SHALL create all required indexes
6. THE System SHALL run migrations automatically on deployment
7. WHEN a migration fails, THE System SHALL log the error and prevent application startup

### Requirement 9: Form Submission Error Handling

**User Story:** As a convener, I want clear error messages when form submission fails, so that I can understand and fix the problem.

#### Acceptance Criteria

1. WHEN form submission fails with 400 error, THE System SHALL display the specific validation error from backend
2. WHEN form submission fails with 500 error, THE System SHALL display "An error occurred. Please try again or contact support."
3. WHEN network request fails, THE System SHALL display "Network error. Please check your connection."
4. THE System SHALL log all form submission errors to browser console with full details
5. THE System SHALL log all API errors to backend logs with request details
6. WHEN an error occurs, THE System SHALL keep form data so user doesn't lose their input
7. THE System SHALL disable submit button while request is in progress

### Requirement 10: Data Transformation Consistency

**User Story:** As a developer, I want consistent data transformation between frontend and backend, so that field names match expectations.

#### Acceptance Criteria

1. WHEN frontend sends data to backend, THE System SHALL transform camelCase to snake_case
2. WHEN backend returns data to frontend, THE System SHALL transform snake_case to camelCase
3. THE System SHALL handle these transformations for all fields: startDate/start_date, enrollmentCode/enrollment_code, weekNumber/week_number, contentType/content_type, contentUrl/content_url, orderIndex/order_index
4. WHEN transformation fails, THE System SHALL log the error with field names
5. THE System SHALL validate transformed data matches expected schema

### Requirement 11: Enrollment Code Availability Check

**User Story:** As a convener, I want to check if an enrollment code is available before submitting the form, so that I don't waste time with codes that are already taken.

#### Acceptance Criteria

1. THE Backend SHALL provide endpoint GET /v1/api/enrollment-codes/check?code=XXX
2. WHEN code parameter is missing, THE Backend SHALL return 400 with "Enrollment code is required"
3. WHEN code is available, THE Backend SHALL return {available: true}
4. WHEN code is already in use, THE Backend SHALL return {available: false}
5. THE Frontend SHALL call this endpoint when enrollment code changes (debounced 500ms)
6. THE Frontend SHALL display availability status in real-time
7. THE Frontend SHALL prevent form submission if code is not available

### Requirement 12: Programme Publishing

**User Story:** As a convener, I want to publish my programme, so that learners can enroll and access content.

#### Acceptance Criteria

1. THE System SHALL provide a "Publish" button on programme detail page
2. WHEN a convener clicks "Publish", THE System SHALL change programme status to "published"
3. WHEN a programme is published, THE System SHALL make it visible to learners
4. THE Backend SHALL provide endpoint POST /v1/api/programmes/:id/publish
5. WHEN publish succeeds, THE System SHALL update the UI to show "Published" status
6. WHEN publish fails, THE System SHALL display error message and keep status as "draft"

### Requirement 13: Edit and Delete Functionality

**User Story:** As a convener, I want to edit and delete programmes, cohorts, weeks, and lessons, so that I can manage my content.

#### Acceptance Criteria

1. THE System SHALL provide edit buttons for programmes, cohorts, weeks, and lessons
2. WHEN a convener clicks edit, THE System SHALL show a form pre-filled with current data
3. WHEN a convener saves changes, THE System SHALL update the resource via PUT request
4. THE System SHALL provide delete buttons for programmes, cohorts, weeks, and lessons
5. WHEN a convener clicks delete, THE System SHALL show a confirmation modal
6. WHEN a convener confirms deletion, THE System SHALL delete the resource via DELETE request
7. WHEN deletion succeeds, THE System SHALL remove the item from the UI
8. WHEN deletion fails, THE System SHALL display error message and keep the item

### Requirement 14: Comprehensive Logging

**User Story:** As a developer, I want detailed logging throughout the workflow, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. THE Frontend SHALL log all form submissions with data being sent
2. THE Frontend SHALL log all API responses (success and error)
3. THE Backend SHALL log all incoming requests with user_id and request body
4. THE Backend SHALL log all database operations (insert, update, delete)
5. THE Backend SHALL log all validation failures with specific field errors
6. THE Backend SHALL log all errors with stack traces
7. THE System SHALL include request IDs in logs for tracing requests across frontend and backend

### Requirement 15: Workflow Integration Testing

**User Story:** As a quality assurance engineer, I want to test the complete workflow end-to-end, so that I can verify all components work together.

#### Acceptance Criteria

1. THE System SHALL support creating a programme, cohort, week, and lesson in sequence without errors
2. WHEN each step completes, THE System SHALL persist data to database
3. WHEN each step completes, THE System SHALL return user to appropriate page
4. THE System SHALL maintain data consistency across all steps
5. WHEN a step fails, THE System SHALL not leave orphaned data in database
6. THE System SHALL provide a test script that creates a complete programme with all components
7. THE System SHALL verify all created data is accessible via API endpoints

### Requirement 16: Browser Compatibility

**User Story:** As a convener, I want the workflow to work in all modern browsers, so that I can use my preferred browser.

#### Acceptance Criteria

1. THE System SHALL work correctly in Chrome, Firefox, Safari, and Edge (latest versions)
2. THE System SHALL handle date inputs consistently across browsers
3. THE System SHALL display forms correctly on desktop and tablet devices
4. WHEN browser doesn't support a feature, THE System SHALL provide a fallback or clear error message

### Requirement 17: Performance and Responsiveness

**User Story:** As a convener, I want forms to respond quickly, so that I can create content efficiently.

#### Acceptance Criteria

1. WHEN a convener types in a form, THE System SHALL respond within 100ms
2. WHEN a convener submits a form, THE System SHALL show loading state immediately
3. WHEN API request completes, THE System SHALL update UI within 200ms
4. THE System SHALL debounce real-time validation checks to avoid excessive API calls
5. WHEN enrollment code check is in progress, THE System SHALL show "Checking availability..." message

### Requirement 18: Accessibility

**User Story:** As a convener with accessibility needs, I want forms to be keyboard navigable and screen reader friendly, so that I can create programmes independently.

#### Acceptance Criteria

1. THE System SHALL support full keyboard navigation (Tab, Enter, Escape)
2. THE System SHALL provide aria-labels for all form inputs
3. THE System SHALL announce validation errors to screen readers
4. THE System SHALL provide focus indicators for all interactive elements
5. THE System SHALL use semantic HTML for forms and buttons
6. WHEN validation fails, THE System SHALL move focus to the first error

### Requirement 19: Data Persistence and Recovery

**User Story:** As a convener, I want my form data to be preserved if something goes wrong, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN form submission fails, THE System SHALL keep all entered data in the form
2. WHEN a convener navigates away accidentally, THE System SHALL warn about unsaved changes
3. THE System SHALL auto-save draft data to local storage every 30 seconds
4. WHEN a convener returns to a form, THE System SHALL offer to restore draft data
5. WHEN form submission succeeds, THE System SHALL clear draft data from local storage

### Requirement 20: Systematic Issue Identification

**User Story:** As a developer, I want a systematic approach to identify all workflow issues, so that nothing is missed.

#### Acceptance Criteria

1. THE System SHALL provide a diagnostic script that tests each workflow step
2. THE Diagnostic_Script SHALL test programme creation with valid and invalid data
3. THE Diagnostic_Script SHALL test cohort creation with enrollment code validation
4. THE Diagnostic_Script SHALL test week creation with date validation
5. THE Diagnostic_Script SHALL test lesson creation for all content types
6. THE Diagnostic_Script SHALL verify API endpoints return expected data structures
7. THE Diagnostic_Script SHALL check database schema for all required columns
8. THE Diagnostic_Script SHALL verify environment variables are set correctly
9. THE Diagnostic_Script SHALL test deployment by checking for code markers
10. THE Diagnostic_Script SHALL generate a report of all issues found with severity levels
