# Implementation Plan: Resend Email Integration

## Overview

This implementation plan breaks down the Resend email integration into discrete, incremental tasks. The approach follows a phased strategy: first establish the core infrastructure (Resend client and service), then create the API endpoint, add comprehensive testing, and finally migrate existing email functionality. Each task builds on previous work and includes validation through tests.

## Tasks

- [x] 1. Install Resend SDK and create client utility
  - Install resend npm package as a dependency
  - Create `lib/resend.js` utility file
  - Implement Resend client initialization with API key from environment
  - Add error handling for missing API key
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 1.1 Write unit tests for Resend client initialization
  - Test successful initialization with valid API key
  - Test error thrown when API key is missing
  - Test error message is descriptive
  - _Requirements: 2.3_

- [x] 2. Create ResendService with template management
  - [x] 2.1 Create `services/ResendService.js` file
    - Implement sendEmail function with template support
    - Define EMAIL_TEMPLATES object with all four template types
    - Implement email validation function (isValidEmail)
    - Add error logging for send failures
    - Add success logging for sent emails
    - _Requirements: 3.3, 3.7, 5.1, 6.1, 6.2, 6.3, 7.1, 7.2_

  - [x] 2.2 Implement welcome email template
    - Create template with welcome message and getting started info
    - Support first_name and verification_link data fields
    - _Requirements: 7.3_

  - [x] 2.3 Implement password reset email template
    - Create template with reset link and security instructions
    - Support first_name and reset_link data fields
    - _Requirements: 7.4_

  - [x] 2.4 Implement enrollment confirmation email template
    - Create template with enrollment details and next steps
    - Support first_name, programme_name, cohort_name, start_date fields
    - _Requirements: 7.5_

  - [x] 2.5 Implement notification email template
    - Create template with flexible notification message
    - Support title, message, action_link, action_text, customHtml fields
    - _Requirements: 7.6_

- [x] 2.6 Write unit tests for ResendService
  - Test sendEmail with each template type
  - Test email validation function with valid and invalid emails
  - Test error handling when Resend API fails
  - Test logging output for success and failure
  - Test sender address is always noreply@mail.cohortle.com
  - _Requirements: 3.7, 5.1, 6.1, 6.2, 6.3_

- [x] 2.7 Write property test for email validation
  - **Property 1: Email validation rejects invalid formats**
  - **Validates: Requirements 5.1**

- [x] 2.8 Write property test for sender address consistency
  - **Property 6: Sender address consistency**
  - **Validates: Requirements 3.7**

- [x] 3. Create email API route with authentication and validation
  - [x] 3.1 Create `routes/email.js` file
    - Implement POST /v1/api/email/send endpoint
    - Add TokenMiddleware for authentication
    - Add UrlMiddleware for request processing
    - Implement request validation for required fields
    - Implement subject length validation (max 200 characters)
    - Call ResendService.sendEmail with validated data
    - Return appropriate status codes (200, 400, 401, 500)
    - Add Swagger documentation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 5.2, 5.4_

  - [x] 3.2 Register email route in main app
    - Import email route in `routes/index.js` or `app.js`
    - Register route with Express app
    - _Requirements: 3.1_

- [x] 3.3 Write unit tests for email route
  - Test successful email sending returns 200
  - Test missing required fields returns 400
  - Test invalid email format returns 400
  - Test subject too long returns 400
  - Test missing authentication returns 401
  - Test Resend service failure returns 500
  - Test error messages are descriptive
  - _Requirements: 3.2, 3.4, 3.5, 3.6, 4.2, 5.2, 5.4_

- [x] 3.4 Write property test for request validation
  - **Property 4: Request validation rejects missing required fields**
  - **Validates: Requirements 3.2, 3.5**

- [x] 3.5 Write property test for authentication requirement
  - **Property 5: Authentication requirement for all email requests**
  - **Validates: Requirements 4.1, 4.2**

- [x] 3.6 Write property test for subject validation
  - **Property 2: Subject validation enforces length constraints**
  - **Validates: Requirements 5.2**

- [x] 3.7 Write property test for content validation
  - **Property 3: Content validation rejects empty content**
  - **Validates: Requirements 5.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify no regressions in existing functionality
  - Ask the user if questions arise

- [x] 5. Add environment validation for RESEND_API_KEY
  - [x] 5.1 Update `utils/validateEnvironment.js`
    - Add check for RESEND_API_KEY presence
    - Log warning if missing (don't fail startup)
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Add email service status to health check
    - Update health check endpoint to include email service status
    - Check if RESEND_API_KEY is configured
    - Return status: "healthy" or "degraded"
    - _Requirements: 8.3_

- [x] 5.3 Write unit tests for environment validation
  - Test validation passes when RESEND_API_KEY is present
  - Test warning is logged when RESEND_API_KEY is missing
  - Test health check includes email service status
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 6. Update existing auth routes to use ResendService
  - [x] 6.1 Update forgot-password route in `routes/auth.js`
    - Replace MailService.send with ResendService.sendEmail
    - Use password_reset email type
    - Pass first_name and reset_link in data
    - Remove MailService.initialize call
    - _Requirements: 7.4_

  - [x] 6.2 Update register-email route in `routes/auth.js` (if verification email is re-enabled)
    - Replace MailService.send with ResendService.sendEmail
    - Use welcome email type
    - Pass first_name and verification_link in data
    - Remove MailService.initialize call
    - _Requirements: 7.3_

- [x] 6.3 Write integration tests for updated auth routes
  - Test forgot-password sends email via ResendService
  - Test register-email sends email via ResendService (if enabled)
  - Test email content includes correct data
  - _Requirements: 7.3, 7.4_

- [x] 7. Update MailService for backward compatibility
  - [x] 7.1 Modify `services/MailService.js`
    - Update send method to use ResendService internally
    - Keep existing template constants
    - Add deprecation warning to initialize method
    - Maintain existing interface for backward compatibility
    - _Requirements: 3.3, 3.7_

- [x] 7.2 Write unit tests for updated MailService
  - Test send method uses ResendService
  - Test backward compatibility with existing interface
  - Test deprecation warning is logged
  - _Requirements: 3.3_

- [x] 8. Final checkpoint and documentation
  - Ensure all tests pass
  - Update API documentation with new endpoint
  - Create deployment checklist
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a phased approach: infrastructure → API → testing → migration
- Backward compatibility is maintained throughout to avoid breaking existing functionality
