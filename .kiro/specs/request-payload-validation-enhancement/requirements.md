# Request Payload Validation Enhancement - Requirements

## Overview
Enhance request payload validation across the Cohortle application to ensure the frontend sends all required fields in the correct format, and the backend properly validates all incoming data before processing.

## User Stories

### 1. Programme Creation Validation
**As a** convener  
**I want** the system to validate all programme data before submission  
**So that** I receive clear feedback about any data issues before the programme is created

**Acceptance Criteria:**
- 1.1 Programme name must be 3-255 characters
- 1.2 Programme description must be 0-1000 characters (optional)
- 1.3 Start date must be in YYYY-MM-DD format and not in the past
- 1.4 All required fields must be present in the request payload
- 1.5 Frontend validates data before sending to backend
- 1.6 Backend validates data before database insertion
- 1.7 Clear, user-friendly error messages are displayed for validation failures

### 2. Cohort Creation Validation
**As a** convener  
**I want** the system to validate all cohort data including programme ID  
**So that** cohorts are only created with valid, complete information

**Acceptance Criteria:**
- 2.1 Programme ID must be present and valid (exists in database)
- 2.2 Cohort name must be 3-200 characters
- 2.3 Enrollment code must follow format: WORD-YEAR (e.g., WLIMP-2026)
- 2.4 Enrollment code must be unique across all cohorts
- 2.5 Start date must be in YYYY-MM-DD format and not in the past
- 2.6 End date (if provided) must be after start date
- 2.7 Frontend validates all fields before submission
- 2.8 Backend validates programme ownership before allowing cohort creation
- 2.9 Real-time enrollment code availability checking works correctly

### 3. Week Creation Validation
**As a** convener  
**I want** the system to validate week data including programme ID  
**So that** weeks are created with correct sequencing and dates

**Acceptance Criteria:**
- 3.1 Programme ID must be present and valid
- 3.2 Week number must be a positive integer >= 1
- 3.3 Week number must be unique within the programme
- 3.4 Week title must be 3-200 characters
- 3.5 Start date must be in YYYY-MM-DD format
- 3.6 Start date should be after programme start date (warning, not error)
- 3.7 Week numbers should be sequential (warning if gaps detected)
- 3.8 Frontend validates all fields before submission
- 3.9 Backend validates programme ownership

### 4. Lesson Creation Validation
**As a** convener  
**I want** the system to validate lesson data including week ID  
**So that** lessons are created with valid content and proper associations

**Acceptance Criteria:**
- 4.1 Week ID must be present and valid (UUID format)
- 4.2 Lesson title must be 3-255 characters
- 4.3 Lesson description must be 0-1000 characters (optional)
- 4.4 Content type must be one of: video, link, pdf, text
- 4.5 Content URL must be valid URL format for video, link, pdf types
- 4.6 Content text must be present for text type lessons
- 4.7 Order index must be non-negative integer
- 4.8 Frontend validates all fields before submission
- 4.9 Backend validates week ownership through programme

### 5. Enrollment Validation
**As a** learner  
**I want** the system to validate enrollment codes properly  
**So that** I can only enroll with valid codes and receive clear error messages

**Acceptance Criteria:**
- 5.1 Enrollment code must be present
- 5.2 Enrollment code format must match WORD-YEAR pattern
- 5.3 Enrollment code must exist in database
- 5.4 Duplicate enrollment attempts are handled gracefully (idempotent)
- 5.5 Clear error messages for invalid format vs. non-existent code
- 5.6 Frontend validates format before submission
- 5.7 Backend validates code existence and cohort status

### 6. Cross-Field Validation
**As a** system administrator  
**I want** the system to validate relationships between fields  
**So that** data integrity is maintained across the application

**Acceptance Criteria:**
- 6.1 End dates must be after start dates
- 6.2 Week start dates should be after programme start date
- 6.3 Cohort start dates should align with programme start date
- 6.4 Lesson order indices should be unique within a week
- 6.5 Programme IDs in cohort creation must match URL parameter
- 6.6 Week IDs in lesson creation must match URL parameter

### 7. Standardized Error Responses
**As a** frontend developer  
**I want** consistent error response formats from the backend  
**So that** I can reliably parse and display validation errors to users

**Acceptance Criteria:**
- 7.1 All validation errors return 400 status code
- 7.2 Error response includes field-specific error messages
- 7.3 Error response format is consistent across all endpoints
- 7.4 Error messages are user-friendly and actionable
- 7.5 Multiple validation errors are returned together (not just first error)

### 8. Frontend Validation Framework
**As a** frontend developer  
**I want** a centralized validation framework  
**So that** validation logic is consistent and reusable across forms

**Acceptance Criteria:**
- 8.1 Validation schemas defined for all entity types
- 8.2 Validation functions are reusable across components
- 8.3 Validation happens on blur and on submit
- 8.4 Real-time validation feedback for critical fields
- 8.5 Validation rules match backend validation exactly
- 8.6 Clear visual indicators for validation states (valid, invalid, checking)

## Non-Functional Requirements

### Performance
- Validation should not add more than 50ms to request processing time
- Real-time validation checks should debounce user input (500ms)
- Frontend validation should prevent unnecessary API calls

### Security
- All user input must be validated on the backend (never trust frontend)
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization
- Rate limiting on validation endpoints (enrollment code checking)

### Usability
- Error messages must be clear and actionable
- Validation feedback should be immediate (< 100ms for frontend)
- Forms should preserve user input when validation fails
- Multi-field errors should be displayed together

### Maintainability
- Validation logic should be centralized and reusable
- Validation rules should be easy to update
- Frontend and backend validation should share common patterns
- Comprehensive test coverage for all validation scenarios

## Out of Scope
- File upload validation (handled separately)
- Image validation and processing
- Complex business rule validation (e.g., capacity limits)
- Internationalization of error messages (future enhancement)

## Dependencies
- Existing ValidationService in backend
- react-hook-form in frontend
- node-input-validator library
- Existing error handling utilities

## Success Metrics
- Zero validation-related bugs in production after implementation
- 100% of API endpoints have comprehensive validation
- < 5% of form submissions fail due to validation errors
- User satisfaction with error messaging > 90%
- Test coverage for validation logic > 95%
