# Requirements Document

## Introduction

This feature adds Google OAuth 2.0 sign-in and sign-up to the Cohortle platform alongside the existing email/password authentication. Users can authenticate with their Google account, which automatically assigns the `student` role. If a Google account email matches an existing email/password account, the accounts are linked. After successful Google authentication, users are redirected to the appropriate dashboard based on their role. Google-authenticated users are considered email-verified by default.

## Glossary

- **Auth_System**: The combined authentication system covering both email/password and Google OAuth flows
- **Google_OAuth**: The Google OAuth 2.0 authentication protocol used to verify user identity via Google
- **Google_Token**: The ID token issued by Google after a user authenticates with their Google account
- **OAuth_Handler**: The backend Express.js service responsible for validating Google tokens and issuing Cohortle JWTs
- **Account_Linker**: The backend logic that detects and links a Google identity to an existing email/password account
- **Auth_Cookie**: The httpOnly cookie (`auth_token`) used to store the Cohortle JWT on the frontend
- **JWT**: The JSON Web Token issued by the Cohortle backend containing `user_id`, `email`, `role`, `permissions`, and `email_verified`
- **RoleAssignmentService**: The existing backend service that assigns roles to users with an audit trail
- **AuthContext**: The existing Next.js React context (`cohortle-web/src/lib/contexts/AuthContext.tsx`) that manages frontend authentication state
- **Proxy_Route**: The existing Next.js API route at `/api/proxy/[...path]/route.ts` that forwards authenticated requests to the backend
- **Google_Button**: The "Continue with Google" UI element shown on the login and signup pages

---

## Requirements

### Requirement 1: Google OAuth Button on Login and Signup Pages

**User Story:** As a visitor, I want to see a "Continue with Google" button on the login and signup pages, so that I can authenticate with my Google account without creating a separate password.

#### Acceptance Criteria

1. THE Auth_System SHALL display a Google_Button on the login page below the existing email/password form
2. THE Auth_System SHALL display a Google_Button on the signup page below the existing registration form
3. WHEN a user clicks the Google_Button, THE Auth_System SHALL initiate the Google OAuth 2.0 authorisation flow
4. WHILE the Google OAuth flow is in progress, THE Auth_System SHALL display a loading indicator on the Google_Button
5. IF the user cancels the Google OAuth popup or flow, THEN THE Auth_System SHALL return the user to the login or signup page without displaying an error

---

### Requirement 2: Backend Google Token Validation Endpoint

**User Story:** As the system, I want a dedicated backend endpoint to receive and validate Google ID tokens, so that the backend can securely verify Google identities and issue Cohortle JWTs.

#### Acceptance Criteria

1. THE OAuth_Handler SHALL expose a POST endpoint at `/v1/api/auth/google`
2. WHEN a request is received at `/v1/api/auth/google`, THE OAuth_Handler SHALL accept a `google_id_token` field in the request body
3. WHEN a `google_id_token` is received, THE OAuth_Handler SHALL validate it against Google's public keys using the `GOOGLE_CLIENT_ID` environment variable
4. IF the `google_id_token` is missing from the request body, THEN THE OAuth_Handler SHALL return a 400 status with a descriptive error message
5. IF the `google_id_token` is invalid or expired, THEN THE OAuth_Handler SHALL return a 401 status with a descriptive error message
6. WHEN the `google_id_token` is valid, THE OAuth_Handler SHALL extract the user's `email`, `given_name`, `family_name`, and `sub` (Google user ID) from the token payload

---

### Requirement 3: New User Registration via Google

**User Story:** As a new user, I want to sign up using my Google account, so that I can join Cohortle without creating a separate password.

#### Acceptance Criteria

1. WHEN a valid Google_Token is received for an email that does not exist in the `users` table, THE OAuth_Handler SHALL create a new user record with `email`, `first_name`, `last_name`, `google_id`, `email_verified = 1`, `status = active`, and `joined_at` set to the current timestamp
2. WHEN creating a new Google-authenticated user, THE OAuth_Handler SHALL assign the `student` role using `RoleAssignmentService.assignRole()`
3. WHEN a new Google-authenticated user is created, THE OAuth_Handler SHALL set the user's `password` field to `NULL`
4. WHEN a new Google-authenticated user is created, THE OAuth_Handler SHALL issue a Cohortle JWT with `email_verified = true`
5. WHEN a new Google-authenticated user is created, THE OAuth_Handler SHALL return a 200 response containing the JWT and user object

---

### Requirement 4: Existing Google User Sign-In

**User Story:** As a returning user who previously signed up with Google, I want to sign in with my Google account, so that I can access my Cohortle account without a password.

#### Acceptance Criteria

1. WHEN a valid Google_Token is received for an email that already exists in the `users` table with a matching `google_id`, THE OAuth_Handler SHALL authenticate the user without creating a new record
2. WHEN an existing Google user signs in, THE OAuth_Handler SHALL issue a fresh Cohortle JWT containing the user's current `role` and `permissions`
3. WHEN an existing Google user signs in, THE OAuth_Handler SHALL return a 200 response containing the JWT and user object

---

### Requirement 5: Account Linking for Existing Email/Password Users

**User Story:** As an existing email/password user, I want to sign in with a Google account that shares my email, so that my accounts are linked and I can use either method to sign in.

#### Acceptance Criteria

1. WHEN a valid Google_Token is received for an email that already exists in the `users` table with `google_id = NULL`, THE Account_Linker SHALL update the existing user record by setting the `google_id` field to the Google `sub` value
2. WHEN an existing email/password account is linked to a Google identity, THE Account_Linker SHALL preserve the user's existing `role`, `password`, and all other profile fields unchanged
3. WHEN an existing email/password account is linked to a Google identity, THE Account_Linker SHALL set `email_verified = 1` on the user record if it was previously `0`
4. WHEN an existing email/password account is linked to a Google identity, THE OAuth_Handler SHALL issue a fresh Cohortle JWT and return a 200 response

---

### Requirement 6: Frontend Google OAuth Flow

**User Story:** As a user, I want the Google sign-in flow to complete seamlessly in the browser, so that I am redirected to my dashboard after authenticating with Google.

#### Acceptance Criteria

1. WHEN the Google OAuth flow completes successfully in the browser, THE Auth_System SHALL send the received `google_id_token` to the backend `/v1/api/auth/google` endpoint via the existing Proxy_Route
2. WHEN the backend returns a successful response, THE Auth_System SHALL store the Cohortle JWT in the Auth_Cookie via the existing `/api/auth/login` cookie-setting mechanism
3. WHEN the JWT is stored in the Auth_Cookie, THE AuthContext SHALL update the user state with the returned user object
4. WHEN the user state is updated, THE AuthContext SHALL redirect the user to `/dashboard` if their role is `student`, or `/convener/dashboard` if their role is `convener`
5. IF the backend returns an error response, THEN THE Auth_System SHALL display a descriptive error message on the login or signup page

---

### Requirement 7: Database Schema for Google Identity

**User Story:** As the system, I want to store Google identity information on user records, so that returning Google users can be identified and existing accounts can be linked.

#### Acceptance Criteria

1. THE Auth_System SHALL add a `google_id` column of type `VARCHAR(255)` to the `users` table, nullable, with a unique index
2. WHEN a migration is run, THE Auth_System SHALL add the `google_id` column without modifying any existing user records
3. THE Auth_System SHALL update the `users` Sequelize model to include the `google_id` field

---

### Requirement 8: Environment Configuration

**User Story:** As a developer, I want all Google OAuth credentials to be managed via environment variables, so that secrets are not hardcoded and can differ between environments.

#### Acceptance Criteria

1. THE Auth_System SHALL read the Google OAuth client ID from the `GOOGLE_CLIENT_ID` environment variable on the backend
2. THE Auth_System SHALL read the Google OAuth client ID from the `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable on the frontend
3. IF `GOOGLE_CLIENT_ID` is not set on the backend, THEN THE OAuth_Handler SHALL log a warning at startup and return a 503 response for any requests to `/v1/api/auth/google`
4. IF `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set on the frontend, THEN THE Auth_System SHALL hide the Google_Button and log a warning to the browser console

---

### Requirement 9: Error Handling and Edge Cases

**User Story:** As a user, I want clear error messages when Google sign-in fails, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. IF the Google OAuth flow fails due to a network error, THEN THE Auth_System SHALL display a user-facing error message on the login or signup page
2. IF the backend `/v1/api/auth/google` endpoint returns a 401, THEN THE Auth_System SHALL display a message indicating that Google sign-in failed and suggest trying again
3. IF the backend `/v1/api/auth/google` endpoint returns a 500, THEN THE Auth_System SHALL display a generic error message and suggest trying again later
4. WHEN any error occurs during the Google OAuth flow, THE Auth_System SHALL log the error details to the server console for debugging
