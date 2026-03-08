# Requirements Document

## Introduction

This document specifies the requirements for improving the email verification flow in the Cohortle learning platform. The current implementation has several UX issues: users are not informed about email verification requirements, verification links return 404 errors, and the messaging around verification status is unclear. This improvement will provide a clear, functional verification flow that allows users to explore their account while restricting certain actions until email verification is complete.

## Glossary

- **User**: Any person who has signed up for a Cohortle account (learner or convener)
- **Email_Verification_System**: The system component responsible for sending verification emails and validating verification tokens
- **Notification_Bar**: A persistent UI element that displays important account status messages
- **Verification_Link**: A unique URL sent via email that validates a user's email address
- **Authenticated_User**: A user who has successfully logged in with valid credentials
- **Verified_User**: An authenticated user whose email address has been confirmed
- **Programme**: A structured learning course on the Cohortle platform
- **Account_Exploration**: The ability to view account features and UI without full permissions

## Requirements

### Requirement 1: Post-Signup Account Access

**User Story:** As a new user, I want to access my account immediately after signup, so that I can explore the platform while waiting for email verification.

#### Acceptance Criteria

1. WHEN a user completes signup, THE Authentication_System SHALL create an authenticated session
2. WHEN a user completes signup, THE System SHALL redirect the user to their dashboard
3. WHEN an unverified user accesses their dashboard, THE System SHALL display account features in read-only mode
4. WHEN an unverified user attempts to view their profile, THE System SHALL allow access to profile viewing
5. WHEN an unverified user attempts to browse programmes, THE System SHALL allow access to programme browsing

### Requirement 2: Email Verification Notification

**User Story:** As an unverified user, I want to see a clear notification about email verification, so that I understand what actions I need to take.

#### Acceptance Criteria

1. WHEN an unverified user views any page, THE Notification_Bar SHALL display a verification reminder message
2. WHEN the verification reminder is displayed, THE Notification_Bar SHALL include the user's registered email address
3. WHEN the verification reminder is displayed, THE Notification_Bar SHALL include a "Resend verification email" action
4. WHEN a user clicks "Resend verification email", THE Email_Verification_System SHALL send a new verification email
5. WHEN a verification email is resent, THE System SHALL display a confirmation message to the user
6. WHEN a verified user views any page, THE Notification_Bar SHALL NOT display verification reminders

### Requirement 3: Programme Access Restrictions

**User Story:** As a platform administrator, I want to restrict programme creation and joining to verified users, so that we maintain data quality and prevent spam accounts.

#### Acceptance Criteria

1. WHEN an unverified user attempts to create a programme, THE System SHALL prevent the action and display a verification requirement message
2. WHEN an unverified user attempts to join a programme, THE System SHALL prevent the action and display a verification requirement message
3. WHEN a verified user attempts to create a programme, THE System SHALL allow the action to proceed
4. WHEN a verified user attempts to join a programme, THE System SHALL allow the action to proceed
5. WHEN displaying programme creation UI to an unverified user, THE System SHALL show a disabled state with verification requirement tooltip

### Requirement 4: Verification Link Functionality

**User Story:** As a user, I want the email verification link to work correctly, so that I can verify my email address without errors.

#### Acceptance Criteria

1. WHEN the Email_Verification_System generates a verification link, THE System SHALL create a valid, unique token
2. WHEN a user clicks a verification link, THE System SHALL route to a valid verification endpoint
3. WHEN the verification endpoint receives a valid token, THE System SHALL mark the user's email as verified
4. WHEN the verification endpoint receives a valid token, THE System SHALL update the user's session to reflect verified status
5. WHEN the verification endpoint receives an invalid token, THE System SHALL display a clear error message
6. WHEN the verification endpoint receives an expired token, THE System SHALL display an expiration message with resend option
7. WHEN email verification succeeds, THE System SHALL redirect the user to their dashboard with a success message

### Requirement 5: Clear Verification Messaging

**User Story:** As a user, I want clear messages throughout the verification flow, so that I understand my account status and next steps.

#### Acceptance Criteria

1. WHEN a user completes signup, THE System SHALL display a message indicating a verification email has been sent
2. WHEN a user completes signup, THE System SHALL display the email address where verification was sent
3. WHEN a user successfully verifies their email, THE System SHALL display a success message
4. WHEN a user successfully verifies their email, THE System SHALL explain what new capabilities are now available
5. WHEN a verification attempt fails, THE System SHALL display a specific error message explaining the failure reason
6. WHEN displaying verification requirements, THE System SHALL use consistent terminology across all pages

### Requirement 6: Verification Email Content

**User Story:** As a user, I want to receive a clear verification email, so that I understand what action to take and why.

#### Acceptance Criteria

1. WHEN a verification email is sent, THE Email_Verification_System SHALL include a clear subject line indicating email verification
2. WHEN a verification email is sent, THE Email_Verification_System SHALL include the user's name in the greeting
3. WHEN a verification email is sent, THE Email_Verification_System SHALL include a prominent verification button or link
4. WHEN a verification email is sent, THE Email_Verification_System SHALL explain why verification is required
5. WHEN a verification email is sent, THE Email_Verification_System SHALL include the verification link expiration time
6. WHEN a verification email is sent, THE Email_Verification_System SHALL include instructions for requesting a new link if needed

### Requirement 7: Verification Token Security

**User Story:** As a platform administrator, I want verification tokens to be secure, so that we prevent unauthorized account access.

#### Acceptance Criteria

1. WHEN generating a verification token, THE Email_Verification_System SHALL create a cryptographically secure random token
2. WHEN generating a verification token, THE Email_Verification_System SHALL set an expiration time of 24 hours
3. WHEN a verification token is used successfully, THE Email_Verification_System SHALL invalidate the token
4. WHEN validating a token, THE Email_Verification_System SHALL check token existence, expiration, and user association
5. WHEN a token validation fails, THE Email_Verification_System SHALL log the failure reason for security monitoring

### Requirement 8: User Session Management

**User Story:** As a user, I want my verification status to be reflected immediately in my session, so that I don't need to log out and back in.

#### Acceptance Criteria

1. WHEN a user verifies their email, THE Authentication_System SHALL update the user's session data
2. WHEN a user verifies their email, THE Authentication_System SHALL update the JWT token to include verified status
3. WHEN a user's verification status changes, THE System SHALL refresh the user's permissions in real-time
4. WHEN a user navigates after verification, THE Notification_Bar SHALL no longer display verification reminders
5. WHEN a user attempts restricted actions after verification, THE System SHALL allow those actions without requiring re-login
