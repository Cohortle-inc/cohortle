# Implementation Plan: Email Verification Flow Improvement

## Overview

This implementation plan addresses critical UX issues in the Cohortle email verification flow by fixing broken verification endpoints, adding clear user notifications, implementing proper access control, and enabling real-time session updates. The implementation follows a requirements-first approach, building incrementally from database setup through backend services to frontend components.

## Tasks

- [x] 1. Database setup and migrations
  - [x] 1.1 Create verification_tokens table migration
    - Create migration file with schema: id, user_id, token, expires_at, created_at, used_at
    - Add foreign key constraint to users table
    - Add indexes on token, user_id, and expires_at columns
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Verify email_verified field exists in users table
    - Check existing migrations for email_verified field
    - If missing, create migration to add email_verified TINYINT(1) DEFAULT 0
    - _Requirements: 4.3, 8.1_

  - [x] 1.3 Run migrations and verify database schema
    - Execute migrations in development environment
    - Verify table structure and indexes are created correctly
    - _Requirements: 7.1_

- [ ] 2. Backend: Verification Token Service
  - [ ] 2.1 Implement VerificationTokenService.generateToken()
    - Use crypto.randomBytes(32) to generate secure token
    - Store token with user_id and 24-hour expiration
    - Invalidate any existing unused tokens for the user
    - Return hex-encoded token string
    - _Requirements: 4.1, 7.1, 7.2_

  - [~] 2.2 Write property test for token uniqueness
    - **Property 7: Verification Token Uniqueness**
    - **Validates: Requirements 4.1, 7.1**

  - [~] 2.3 Write property test for token expiration
    - **Property 8: Verification Token Expiration**
    - **Validates: Requirements 7.2**

  - [~] 2.4 Implement VerificationTokenService.validateToken()
    - Check token exists in database
    - Check token is not expired (expires_at > now)
    - Check token has not been used (used_at IS NULL)
    - Check associated user exists
    - Return validation result with userId or specific error
    - _Requirements: 4.5, 4.6, 7.4_

  - [~] 2.5 Write property test for token validation
    - **Property 10: Token Validation Comprehensive Checks**
    - **Validates: Requirements 4.5, 4.6, 7.4**

  - [~] 2.6 Implement VerificationTokenService.invalidateToken()
    - Update token record to set used_at = current timestamp
    - Ensure idempotency (already used tokens don't error)
    - _Requirements: 7.3_

  - [~] 2.7 Write property test for token invalidation
    - **Property 11: Token Invalidation After Use**
    - **Validates: Requirements 7.3**

  - [~] 2.8 Implement VerificationTokenService.cleanupExpiredTokens()
    - Delete tokens where expires_at < current time
    - Return count of deleted tokens
    - _Requirements: 7.2_

  - [~] 2.9 Write unit tests for VerificationTokenService
    - Test error cases: invalid user_id, database errors
    - Test edge cases: expired tokens, already used tokens
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 3. Backend: Auth routes for verification
  - [~] 3.1 Implement POST /v1/api/auth/verify-email endpoint
    - Extract token from request body
    - Call VerificationTokenService.validateToken()
    - If valid: update user.email_verified = 1, invalidate token
    - Generate new JWT with email_verified: true
    - Return success response with new JWT and user data
    - Handle all error cases with specific messages
    - Log all verification attempts (success and failure)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 7.5_

  - [~] 3.2 Write property test for verification success updates
    - **Property 9: Successful Verification Updates**
    - **Validates: Requirements 4.3, 4.4, 8.1, 8.2**

  - [~] 3.3 Write property test for verification failure logging
    - **Property 12: Verification Failure Logging**
    - **Validates: Requirements 7.5**

  - [~] 3.4 Implement POST /v1/api/auth/resend-verification endpoint
    - Require authentication (check JWT)
    - Check user is not already verified
    - Implement rate limiting (max 3 per hour per user)
    - Generate new verification token
    - Send verification email via ResendService
    - Return success message
    - _Requirements: 2.4, 2.5_

  - [~] 3.5 Write property test for verification email resend
    - **Property 4: Verification Email Resend**
    - **Validates: Requirements 2.4**

  - [~] 3.6 Write unit tests for auth endpoints
    - Test all error scenarios: invalid token, expired token, already verified
    - Test rate limiting on resend endpoint
    - Test JWT generation includes email_verified field
    - _Requirements: 4.5, 4.6, 7.5_

- [ ] 4. Backend: Access control middleware
  - [~] 4.1 Implement requireEmailVerification middleware
    - Check req.user.email_verified from JWT payload
    - If false, return 403 with clear error message
    - If true, call next()
    - _Requirements: 3.1, 3.2_

  - [~] 4.2 Apply middleware to protected routes
    - Add to POST /v1/api/programmes (create programme)
    - Add to POST /v1/api/enrollments (join programme)
    - Add to POST /v1/api/cohorts (create cohort)
    - _Requirements: 3.1, 3.2_

  - [~] 4.3 Write property test for programme action access control
    - **Property 5: Programme Action Access Control**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [~] 4.4 Write unit tests for access control middleware
    - Test verified users can access protected routes
    - Test unverified users receive 403 errors
    - Test error message content
    - _Requirements: 3.1, 3.2_

- [ ] 5. Backend: Update signup flow
  - [~] 5.1 Update signup endpoint to generate verification token
    - After creating user, call VerificationTokenService.generateToken()
    - Send welcome email with verification link
    - Include verification instructions in response
    - _Requirements: 1.1, 5.1, 5.2_

  - [~] 5.2 Update welcome email template
    - Add clear subject line: "Verify your email address"
    - Include user's first name in greeting
    - Add prominent verification button/link
    - Explain why verification is required
    - Include 24-hour expiration notice
    - Include instructions for requesting new link
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [~] 5.3 Write property test for signup success message
    - **Property 15: Signup Success Message Content**
    - **Validates: Requirements 5.2**

  - [~] 5.4 Write property test for verification email personalization
    - **Property 16: Verification Email Personalization**
    - **Validates: Requirements 6.2**

- [ ] 6. Checkpoint - Backend verification flow complete
  - Ensure all backend tests pass
  - Test verification flow manually with Postman/curl
  - Verify database records are created correctly
  - Ask the user if questions arise

- [x] 7. Frontend: AuthContext enhancement
  - [x] 7.1 Add emailVerified field to User interface
    - Update User type to include emailVerified: boolean
    - Parse email_verified from JWT payload
    - _Requirements: 8.1, 8.2_

  - [x] 7.2 Implement resendVerificationEmail method
    - Call POST /v1/api/auth/resend-verification
    - Handle success and error responses
    - Show toast notification on success
    - Handle rate limiting errors
    - _Requirements: 2.4, 2.5_

  - [x] 7.3 Implement refreshVerificationStatus method
    - Fetch current user data from backend
    - Update user state with new verification status
    - Trigger re-render of components
    - _Requirements: 8.3, 8.4_

  - [x] 7.4 Update login/signup to store emailVerified
    - Parse email_verified from JWT on login
    - Parse email_verified from JWT on signup
    - Store in user state
    - _Requirements: 1.1, 8.1_

- [x] 8. Frontend: Email verification notification bar
  - [x] 8.1 Create EmailVerificationBanner component
    - Display warning banner with email address
    - Include "Resend verification email" button
    - Call AuthContext.resendVerificationEmail on click
    - Show loading state during resend
    - Show success toast after resend
    - Handle rate limiting errors
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 8.2 Add banner to main layout
    - Show banner on all pages when user is authenticated and unverified
    - Hide banner when user is verified
    - Position below navigation bar
    - _Requirements: 2.1, 2.6, 8.4_

  - [~] 8.3 Write property test for notification visibility
    - **Property 3: Verification Notification Visibility**
    - **Validates: Requirements 2.1, 2.2, 2.6, 8.4**

  - [~] 8.4 Write unit tests for EmailVerificationBanner
    - Test rendering with email address
    - Test resend button click
    - Test loading and success states
    - Test rate limiting error display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Frontend: Email verification page
  - [x] 9.1 Create /verify-email page component
    - Extract token from URL query parameter
    - Call POST /v1/api/auth/verify-email on mount
    - Show loading state: "Verifying your email..."
    - Show success state with redirect countdown
    - Show error states with specific messages
    - Provide "Request new link" button on error
    - Update AuthContext after successful verification
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 9.2 Handle all verification error states
    - Invalid token: "This verification link is invalid"
    - Expired token: "This verification link has expired"
    - Already verified: "Your email is already verified"
    - User not found: "User account not found"
    - Provide appropriate actions for each error
    - _Requirements: 4.5, 4.6, 5.5_

  - [~] 9.3 Write property test for error message specificity
    - **Property 14: Error Message Specificity**
    - **Validates: Requirements 5.5**

  - [~] 9.4 Write unit tests for verify-email page
    - Test all state transitions: loading → success/error
    - Test redirect after success
    - Test "Request new link" button
    - Test AuthContext update
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 10. Frontend: Programme action guards
  - [x] 10.1 Create ProgrammeActionGuard component
    - Check user.emailVerified from AuthContext
    - If verified: render children
    - If unverified: render fallback message
    - Include "Verify now" link in fallback
    - _Requirements: 3.5_

  - [x] 10.2 Apply guards to programme actions
    - Wrap create programme button with guard
    - Wrap join programme button with guard
    - Show disabled state with tooltip for unverified users
    - _Requirements: 3.1, 3.2, 3.5_

  - [~] 10.3 Write property test for programme UI state
    - **Property 6: Programme UI State Based on Verification**
    - **Validates: Requirements 3.5**

  - [~] 10.4 Write property test for real-time permission updates
    - **Property 13: Real-time Permission Updates**
    - **Validates: Requirements 8.3, 8.5**

  - [~] 10.5 Write unit tests for ProgrammeActionGuard
    - Test rendering for verified users
    - Test rendering for unverified users
    - Test fallback message content
    - _Requirements: 3.5_

- [x] 11. Frontend: Signup flow enhancement
  - [x] 11.1 Update SignupForm success messaging
    - Show success message with email address
    - Explain verification email has been sent
    - Explain account exploration is available
    - Explain verification is needed for programme actions
    - Redirect to dashboard (not login page)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.2 Ensure JWT is stored before redirect
    - Verify httpOnly cookie is set
    - Verify AuthContext is updated
    - Verify user state includes emailVerified: false
    - _Requirements: 1.1, 1.2_

  - [~] 11.3 Write property test for authenticated session creation
    - **Property 1: Authenticated Session Creation on Signup**
    - **Validates: Requirements 1.1**

  - [~] 11.4 Write property test for unverified user access permissions
    - **Property 2: Unverified User Access Permissions**
    - **Validates: Requirements 1.3, 1.4, 1.5**

- [ ] 12. Integration and end-to-end testing
  - [~] 12.1 Test complete verification flow
    - Sign up new user
    - Verify notification bar appears
    - Click verification link from email
    - Verify success message and redirect
    - Verify notification bar disappears
    - Verify programme actions are now enabled
    - _Requirements: 1.1, 2.1, 4.2, 4.3, 4.7, 8.4_

  - [~] 12.2 Test resend verification flow
    - Sign up new user
    - Click "Resend verification email"
    - Verify new email is sent
    - Verify old token is invalidated
    - Verify new token works
    - _Requirements: 2.4, 2.5, 7.3_

  - [~] 12.3 Test access control enforcement
    - Sign up unverified user
    - Attempt to create programme → blocked
    - Attempt to join programme → blocked
    - Verify email
    - Attempt to create programme → succeeds
    - Attempt to join programme → succeeds
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3, 8.5_

  - [~] 12.4 Test error scenarios
    - Test expired token handling
    - Test invalid token handling
    - Test already verified handling
    - Test rate limiting on resend
    - Verify all error messages are clear and actionable
    - _Requirements: 4.5, 4.6, 5.5_

- [ ] 13. Final checkpoint - All tests pass and feature complete
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure all integration tests pass
  - Test manually in development environment
  - Verify email delivery works correctly
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation builds incrementally: database → backend services → backend routes → frontend context → frontend components
- All verification tokens use cryptographically secure random generation
- Rate limiting prevents abuse of resend functionality
- All error messages are user-friendly and actionable
