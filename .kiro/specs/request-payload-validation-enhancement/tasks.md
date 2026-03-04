# Request Payload Validation Enhancement - Tasks

## Phase 1: Backend Validation Enhancement

### 1. Enhance ValidationService with Custom Rules
**Requirements:** 1.1-1.7, 2.1-2.9, 3.1-3.9, 4.1-4.9, 5.1-5.7, 6.1-6.6

- [x] 1.1 Add custom validation rule: `programmeId` (validates programme exists)
- [x] 1.2 Add custom validation rule: `weekId` (validates UUID format and existence)
- [x] 1.3 Add custom validation rule: `enrollmentCodeFormat` (validates WORD-YEAR pattern)
- [x] 1.4 Add custom validation rule: `dateNotPast` (validates date is not in the past)
- [x] 1.5 Add custom validation rule: `dateAfter` (validates date is after another date)
- [x] 1.6 Add custom validation rule: `uniqueEnrollmentCode` (validates code uniqueness)
- [x] 1.7 Add custom validation rule: `urlScheme` (validates only http/https URLs)
- [x] 1.8 Add custom validation rule: `contentTypeConditional` (validates content_url/text based on type)

### 2. Create Validation Schemas for All Entities
**Requirements:** 1.1-1.7, 2.1-2.9, 3.1-3.9, 4.1-4.9

- [x] 2.1 Create `PROGRAMME_VALIDATION` schema with all field rules
- [x] 2.2 Create `COHORT_VALIDATION` schema with programme_id and cross-field validation
- [x] 2.3 Create `WEEK_VALIDATION` schema with programme_id validation
- [x] 2.4 Create `LESSON_VALIDATION` schema with week_id and conditional content validation
- [x] 2.5 Create `ENROLLMENT_VALIDATION` schema with code format validation
- [x] 2.6 Export validation schemas from ValidationService for reuse

### 3. Standardize Error Response Format
**Requirements:** 7.1-7.5

- [x] 3.1 Update `formatValidationError` to return standardized format with field, message, rule
- [x] 3.2 Ensure all validation errors return 400 status code consistently
- [x] 3.3 Update `validateObject` to return multiple errors (not just first)
- [x] 3.4 Add error aggregation for cross-field validation
- [x] 3.5 Create helper function `createValidationErrorResponse` for consistent responses

### 4. Update Programme Routes with Enhanced Validation
**Requirements:** 1.1-1.7, 6.5

- [x] 4.1 Update POST `/v1/api/programmes` to use `PROGRAMME_VALIDATION` schema
- [x] 4.2 Add validation for programme name length (3-255 characters)
- [x] 4.3 Add validation for description length (0-1000 characters)
- [x] 4.4 Add validation for start_date format and past date check
- [x] 4.5 Update error responses to use standardized format
- [x] 4.6 Add logging for validation failures

### 5. Update Cohort Routes with Enhanced Validation
**Requirements:** 2.1-2.9, 6.1, 6.5

- [x] 5.1 Update POST `/v1/api/programmes/:programme_id/cohorts` to use `COHORT_VALIDATION`
- [x] 5.2 Add validation for programme_id existence and ownership
- [x] 5.3 Add validation for cohort name length (3-200 characters)
- [x] 5.4 Add validation for enrollment code format and uniqueness
- [x] 5.5 Add cross-field validation for end_date > start_date
- [x] 5.6 Verify programme_id in URL matches validation context
- [x] 5.7 Update error responses to use standardized format

### 6. Update Week Routes with Enhanced Validation
**Requirements:** 3.1-3.9, 6.2, 6.5

- [x] 6.1 Update POST `/v1/api/programmes/:programme_id/weeks` to use `WEEK_VALIDATION`
- [x] 6.2 Add validation for programme_id existence and ownership
- [x] 6.3 Add validation for week_number uniqueness within programme
- [x] 6.4 Add validation for week title length (3-200 characters)
- [x] 6.5 Add validation for start_date format
- [x] 6.6 Add warning (not error) if week start_date is before programme start_date
- [x] 6.7 Update error responses to use standardized format

### 7. Update Lesson Routes with Enhanced Validation
**Requirements:** 4.1-4.9, 6.4, 6.6

- [x] 7.1 Update POST `/v1/api/weeks/:week_id/lessons` to use `LESSON_VALIDATION`
- [x] 7.2 Add validation for week_id UUID format and existence
- [x] 7.3 Add validation for lesson title length (3-255 characters)
- [x] 7.4 Add validation for description length (0-1000 characters)
- [x] 7.5 Add conditional validation for content_url based on content_type
- [x] 7.6 Add validation for URL format (video, link, pdf types)
- [x] 7.7 Add validation for order_index uniqueness within week
- [x] 7.8 Update error responses to use standardized format

### 8. Update Enrollment Routes with Enhanced Validation
**Requirements:** 5.1-5.7

- [x] 8.1 Update POST `/v1/api/programmes/enroll` to use `ENROLLMENT_VALIDATION`
- [x] 8.2 Add validation for enrollment code format (WORD-YEAR)
- [x] 8.3 Add validation for code existence in database
- [x] 8.4 Add validation for cohort active status
- [x] 8.5 Improve error messages to distinguish format vs. existence errors
- [x] 8.6 Update error responses to use standardized format

### 9. Add Backend Unit Tests for Validation
**Requirements:** All

- [x] 9.1 Write unit tests for all custom validation rules
- [x] 9.2 Write unit tests for validation schemas with valid data
- [x] 9.3 Write unit tests for validation schemas with invalid data
- [x] 9.4 Write unit tests for cross-field validation
- [x] 9.5 Write unit tests for error response formatting
- [x] 9.6 Write integration tests for each route with validation

## Phase 2: Frontend Validation Enhancement

### 10. Install and Configure Zod
**Requirements:** 8.1-8.6

- [ ] 10.1 Install zod package in cohortle-web
- [ ] 10.2 Create validation directory structure: `src/lib/validation/`
- [ ] 10.3 Configure TypeScript for Zod integration
- [ ] 10.4 Create index file to export all schemas

### 11. Create Frontend Validation Schemas
**Requirements:** 1.1-1.7, 2.1-2.9, 3.1-3.9, 4.1-4.9, 8.5

- [ ] 11.1 Create `programmeSchema` in `src/lib/validation/schemas.ts`
- [ ] 11.2 Create `cohortSchema` with enrollment code validation
- [ ] 11.3 Create `weekSchema` with week number validation
- [ ] 11.4 Create `lessonSchema` with conditional content validation
- [ ] 11.5 Create `enrollmentSchema` with code format validation
- [ ] 11.6 Ensure all schemas match backend validation rules exactly
- [ ] 11.7 Add JSDoc comments explaining each validation rule

### 12. Create useValidation Hook
**Requirements:** 8.1-8.6

- [ ] 12.1 Create `useValidation` hook in `src/lib/hooks/useValidation.ts`
- [ ] 12.2 Implement `validate` function for full form validation
- [ ] 12.3 Implement `validateField` function for single field validation
- [ ] 12.4 Implement `clearErrors` function
- [ ] 12.5 Implement `clearFieldError` function
- [ ] 12.6 Add error state management
- [ ] 12.7 Add TypeScript generics for type safety

### 13. Enhance ProgrammeForm with Validation
**Requirements:** 1.1-1.7, 8.1-8.6

- [ ] 13.1 Update ProgrammeForm to use `useValidation` hook
- [ ] 13.2 Add validation on field blur
- [x] 13.3 Add validation on form submit
- [x] 13.4 Display inline error messages for each field
- [x] 13.5 Prevent submission if validation fails
- [ ] 13.6 Map backend validation errors to form fields
- [ ] 13.7 Add visual indicators for validation states

### 14. Enhance CohortForm with Validation
**Requirements:** 2.1-2.9, 8.1-8.6

- [ ] 14.1 Update CohortForm to use `useValidation` hook
- [ ] 14.2 Add validation for all fields including programme_id
- [ ] 14.3 Integrate with existing enrollment code availability check
- [ ] 14.4 Add cross-field validation for dates
- [ ] 14.5 Display inline error messages
- [ ] 14.6 Map backend validation errors to form fields
- [ ] 14.7 Improve error display for enrollment code conflicts

### 15. Enhance WeekForm with Validation
**Requirements:** 3.1-3.9, 8.1-8.6

- [ ] 15.1 Update WeekForm to use `useValidation` hook
- [ ] 15.2 Add validation for week number (positive integer)
- [ ] 15.3 Add validation for title length
- [ ] 15.4 Add validation for start date format
- [ ] 15.5 Display inline error messages
- [ ] 15.6 Map backend validation errors to form fields
- [ ] 15.7 Add warning display for date inconsistencies

### 16. Enhance LessonForm with Validation
**Requirements:** 4.1-4.9, 8.1-8.6

- [ ] 16.1 Update LessonForm to use `useValidation` hook
- [ ] 16.2 Add conditional validation based on content_type
- [ ] 16.3 Add URL format validation for video/link/pdf types
- [ ] 16.4 Add validation for title and description lengths
- [ ] 16.5 Display inline error messages
- [ ] 16.6 Map backend validation errors to form fields
- [ ] 16.7 Add dynamic validation when content_type changes

### 17. Create Payload Transformation with Validation
**Requirements:** 8.5

- [ ] 17.1 Create `toSnakeCaseWithValidation` function in `src/lib/utils/caseTransform.ts`
- [ ] 17.2 Integrate Zod validation before transformation
- [ ] 17.3 Return validation errors in consistent format
- [ ] 17.4 Update API functions to use validated transformation
- [ ] 17.5 Add TypeScript types for transformation results

### 18. Enhance API Client with Validation Interceptors
**Requirements:** 7.1-7.5, 8.5

- [ ] 18.1 Add request interceptor to validate payload structure
- [ ] 18.2 Add request interceptor to check required fields
- [ ] 18.3 Add request interceptor to log outgoing requests
- [ ] 18.4 Add response interceptor to parse validation errors
- [ ] 18.5 Add response interceptor to transform error format
- [ ] 18.6 Add error logging for debugging

### 19. Add Frontend Unit Tests for Validation
**Requirements:** All

- [ ] 19.1 Write unit tests for all validation schemas
- [ ] 19.2 Write unit tests for `useValidation` hook
- [ ] 19.3 Write unit tests for validation in each form component
- [ ] 19.4 Write unit tests for payload transformation with validation
- [ ] 19.5 Write unit tests for API client interceptors
- [ ] 19.6 Write integration tests for form submission flow

## Phase 3: Integration and Testing

### 20. End-to-End Validation Testing
**Requirements:** All

- [ ] 20.1 Test programme creation with valid data
- [ ] 20.2 Test programme creation with invalid data (each field)
- [ ] 20.3 Test cohort creation with valid data and programme_id
- [ ] 20.4 Test cohort creation with invalid programme_id
- [ ] 20.5 Test cohort creation with duplicate enrollment code
- [ ] 20.6 Test week creation with valid data
- [ ] 20.7 Test week creation with duplicate week number
- [ ] 20.8 Test lesson creation with valid data
- [ ] 20.9 Test lesson creation with invalid week_id
- [ ] 20.10 Test enrollment with valid and invalid codes

### 21. Property-Based Testing for Validation
**Requirements:** All

- [ ] 21.1 Write PBT for programme validation with random valid data
- [ ] 21.2 Write PBT for programme validation with random invalid data
- [ ] 21.3 Write PBT for cohort validation with boundary conditions
- [ ] 21.4 Write PBT for enrollment code format validation
- [ ] 21.5 Write PBT for date validation (past, future, ranges)
- [ ] 21.6 Write PBT for URL validation
- [ ] 21.7 Write PBT for cross-field validation

### 22. Error Message Improvement
**Requirements:** 7.4, 8.4

- [ ] 22.1 Review all validation error messages for clarity
- [ ] 22.2 Ensure error messages are actionable
- [ ] 22.3 Add examples to error messages where helpful
- [ ] 22.4 Ensure consistent tone across all messages
- [ ] 22.5 Test error messages with real users for comprehension
- [ ] 22.6 Update error messages based on feedback

### 23. Performance Optimization
**Requirements:** Non-functional

- [ ] 23.1 Add debouncing to real-time validation (500ms)
- [ ] 23.2 Memoize validation schemas
- [ ] 23.3 Optimize database queries for existence checks
- [ ] 23.4 Add caching for validation results where appropriate
- [ ] 23.5 Measure and optimize validation performance
- [ ] 23.6 Ensure validation adds < 50ms to request processing

### 24. Security Hardening
**Requirements:** Non-functional

- [ ] 24.1 Add input sanitization for all text fields
- [ ] 24.2 Validate URL schemes (only http/https)
- [ ] 24.3 Add rate limiting to enrollment code checking endpoint
- [ ] 24.4 Add rate limiting to form submission endpoints
- [ ] 24.5 Implement exponential backoff for repeated failures
- [ ] 24.6 Add logging for suspicious validation patterns

## Phase 4: Documentation and Monitoring

### 25. Update API Documentation
**Requirements:** All

- [ ] 25.1 Update Swagger/OpenAPI specs with validation rules
- [ ] 25.2 Document all validation error responses
- [ ] 25.3 Add examples of valid and invalid payloads
- [ ] 25.4 Document error response format
- [ ] 25.5 Create validation guide for API consumers

### 26. Create Developer Documentation
**Requirements:** All

- [ ] 26.1 Document validation architecture and flow
- [ ] 26.2 Create guide for adding new validation rules
- [ ] 26.3 Document validation schemas and their usage
- [ ] 26.4 Create troubleshooting guide for validation issues
- [ ] 26.5 Document testing strategy for validation

### 27. Add Monitoring and Logging
**Requirements:** Non-functional

- [ ] 27.1 Add logging for all validation failures
- [ ] 27.2 Create dashboard for validation error rates
- [ ] 27.3 Set up alerts for high validation error rates
- [ ] 27.4 Add metrics for validation performance
- [ ] 27.5 Create reports for common validation errors
- [ ] 27.6 Use data to iterate on validation rules

### 28. User Feedback and Iteration
**Requirements:** Non-functional

- [ ] 28.1 Collect user feedback on error messages
- [ ] 28.2 Analyze validation error patterns
- [ ] 28.3 Identify areas for improvement
- [ ] 28.4 Iterate on validation rules based on data
- [ ] 28.5 Update error messages based on user feedback
- [ ] 28.6 Measure user satisfaction with validation

## Phase 5: Deployment and Rollback

### 29. Gradual Rollout
**Requirements:** All

- [ ] 29.1 Deploy backend validation to staging environment
- [ ] 29.2 Test all endpoints in staging
- [ ] 29.3 Deploy frontend validation to staging
- [ ] 29.4 Perform end-to-end testing in staging
- [ ] 29.5 Deploy to production with feature flag
- [ ] 29.6 Gradually enable for percentage of users
- [ ] 29.7 Monitor error rates and user feedback
- [ ] 29.8 Enable for all users once stable

### 30. Rollback Plan Implementation
**Requirements:** Non-functional

- [ ] 30.1 Create feature flag for new validation
- [ ] 30.2 Implement fallback to old validation logic
- [ ] 30.3 Test rollback procedure in staging
- [ ] 30.4 Document rollback steps
- [ ] 30.5 Set up monitoring for rollback triggers
- [ ] 30.6 Create runbook for emergency rollback

## Success Criteria Verification

### 31. Verify Success Metrics
**Requirements:** All

- [ ] 31.1 Verify all API endpoints have comprehensive validation
- [ ] 31.2 Measure validation error rate (target: < 5%)
- [ ] 31.3 Verify zero validation-related production bugs
- [ ] 31.4 Measure user satisfaction with error messages (target: > 90%)
- [ ] 31.5 Verify test coverage for validation (target: > 95%)
- [ ] 31.6 Measure response time impact (target: < 50ms)
- [ ] 31.7 Create final report on validation enhancement

## Notes

- Tasks are organized by phase for logical implementation order
- Each task references the requirements it addresses
- Backend validation should be completed before frontend to ensure consistency
- Testing should be comprehensive at each phase
- Monitoring and iteration are ongoing activities
- Rollback capability is critical for safe deployment
