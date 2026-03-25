# Implementation Plan: Google Auth Integration

## Overview

Implement Google OAuth 2.0 sign-in alongside the existing email/password flow. The backend validates Google ID tokens server-side using `google-auth-library` and issues Cohortle JWTs; the frontend uses the Google Identity Services (GIS) library to obtain tokens and passes them through the existing proxy/cookie infrastructure. No new auth infrastructure is introduced — the existing JWT, cookie, and role systems are reused.

## Tasks

- [x] 1. Database migration and model update
  - [x] 1.1 Create Sequelize migration `cohortle-api/migrations/20260325000000-add-google-id-to-users.js`
    - Add nullable `VARCHAR(255)` column `google_id` to the `users` table (after `password`)
    - Add a partial unique index on `google_id` (excluding NULL values)
    - _Requirements: 7.1, 7.2_
  - [x] 1.2 Update `cohortle-api/models/users.js` to include the `google_id` field definition
    - Add `google_id: { type: DataTypes.STRING(255), allowNull: true }` to the model
    - _Requirements: 7.3_
  - [x]* 1.3 Write property test for migration data preservation
    - **Property 6: Migration preserves existing user records**
    - Generate random user records, run migration, verify all pre-existing columns are unchanged and `google_id` is `null`
    - **Validates: Requirements 7.2**

- [x] 2. Implement `GoogleAuthService` on the backend
  - [x] 2.1 Install `google-auth-library` in `cohortle-api`
    - Run `npm install google-auth-library` in `cohortle-api/`
    - _Requirements: 2.3_
  - [x] 2.2 Create `cohortle-api/services/GoogleAuthService.js`
    - Implement `verifyIdToken(idToken)` using `google-auth-library` `OAuth2Client`
    - Read client ID from `process.env.GOOGLE_CLIENT_ID`
    - Return `{ email, sub, given_name, family_name, email_verified }` from the token payload
    - Throw descriptive errors for invalid/expired tokens and missing configuration
    - _Requirements: 2.3, 2.6, 8.1, 8.3_
  - [x]* 2.3 Write property test for Google token validation
    - **Property 1: Invalid Google tokens are always rejected**
    - Use `fast-check` to generate arbitrary strings and verify `verifyIdToken()` always rejects them (min 100 iterations)
    - **Validates: Requirements 2.3, 2.5**

- [x] 3. Implement `findOrCreateGoogleUser` helper and the `/v1/api/auth/google` endpoint
  - [x] 3.1 Add `findOrCreateGoogleUser(payload)` helper in `cohortle-api/routes/auth.js`
    - Look up user by email
    - If not found: create new user with `google_id=sub`, `password=null`, `email_verified=1`, `status=active`, `joined_at=now`; assign `student` role via `RoleAssignmentService.assignRole()`
    - If found with matching `google_id`: return existing user unchanged
    - If found with `google_id=null`: update `google_id=sub` and set `email_verified=1`; return updated user
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 5.1, 5.2, 5.3_
  - [x]* 3.2 Write property test for new user creation invariants
    - **Property 2: New Google user creation invariants**
    - Use `fast-check` to generate random `{ email, sub, given_name, family_name }` payloads and verify the resulting user has `google_id=sub`, `password=null`, `email_verified=1`, `role=student`
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  - [x]* 3.3 Write property test for idempotency
    - **Property 3: Google authentication is idempotent (no duplicate users)**
    - Call `findOrCreateGoogleUser()` twice with the same payload; verify exactly one user record exists for that email
    - **Validates: Requirements 3.1, 4.1**
  - [x]* 3.4 Write property test for account linking
    - **Property 4: Account linking preserves existing user data**
    - Generate random existing users with `google_id=null`; call `findOrCreateGoogleUser()` with a matching email; verify `role` and `password` are unchanged, `google_id` is set, `email_verified=1`
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [x] 3.5 Add `POST /v1/api/auth/google` route handler in `cohortle-api/routes/auth.js`
    - Validate request body — return 400 if `google_id_token` is missing
    - Return 503 if `GOOGLE_CLIENT_ID` is not configured
    - Call `GoogleAuthService.verifyIdToken()` — return 401 on failure
    - Call `findOrCreateGoogleUser()` with the token payload
    - Issue Cohortle JWT via existing `createTokenWithRole()` helper
    - Return `{ error: false, token, user }` on success; log all errors server-side
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.5, 4.3, 8.3, 9.4_
  - [x]* 3.6 Write integration tests for `POST /v1/api/auth/google`
    - Mock `GoogleAuthService`; test new user (200 + student role), returning user (200), account linking (200 + existing role preserved), missing token (400), invalid token (401)
    - _Requirements: 2.1, 2.4, 2.5, 3.5, 4.3_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add the Next.js Google callback API route
  - [x] 5.1 Create `cohortle-web/src/app/api/auth/google-callback/route.ts`
    - Accept `POST { google_id_token }` from the browser
    - Forward to backend `POST /v1/api/auth/google` (direct fetch, same pattern as `/api/auth/login/route.ts`)
    - On success: set `auth_token` httpOnly cookie with the same settings as the existing login route; return `{ user }`
    - On error: return the appropriate HTTP status and error message
    - _Requirements: 6.1, 6.2, 8.2_

- [x] 6. Implement the `GoogleAuthButton` frontend component
  - [x] 6.1 Create `cohortle-web/src/components/auth/GoogleAuthButton.tsx`
    - Load the GIS script (`https://accounts.google.com/gsi/client`) via Next.js `<Script strategy="afterInteractive">`
    - On script load, call `google.accounts.id.initialize({ client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID, callback })`
    - Render a styled "Continue with Google" button (white background, Google logo, brand-consistent)
    - On click, trigger the OAuth popup via `google.accounts.id.prompt()`
    - In the GIS callback, `POST /api/auth/google-callback` with the received `credential`
    - Show a loading indicator while the request is in flight
    - Call `onSuccess(user)` or `onError(message)` props based on the result
    - Hide the button entirely if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not set; log a console warning
    - Handle user cancellation silently (no error shown)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 8.2, 8.4, 9.1, 9.2, 9.3_
  - [x]* 6.2 Write unit tests for `GoogleAuthButton`
    - Renders when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set; does not render when missing
    - Shows loading state during auth flow
    - Calls `onError` when the backend returns an error response
    - _Requirements: 1.1, 1.4, 8.4_

- [x] 7. Wire `GoogleAuthButton` into `AuthContext` and auth forms
  - [x] 7.1 Add `loginWithGoogle(googleIdToken: string): Promise<void>` to `AuthContext` (`cohortle-web/src/lib/contexts/AuthContext.tsx`)
    - Call `POST /api/auth/google-callback`
    - Set user state from the response
    - Redirect to `/dashboard` for `student` role or `/convener/dashboard` for `convener` role
    - _Requirements: 6.2, 6.3, 6.4_
  - [x]* 7.2 Write property test for role-based redirect
    - **Property 5: Role-based redirect is deterministic**
    - Generate random role values (`student`, `convener`) and verify the redirect URL is always correct with no other outcomes
    - **Validates: Requirements 6.4**
  - [x] 7.3 Update `cohortle-web/src/components/auth/LoginForm.tsx`
    - Add an "or" divider below the submit button
    - Add `<GoogleAuthButton onSuccess={...} onError={...} />` below the divider
    - On `onSuccess`, call `loginWithGoogle` from `AuthContext`
    - On `onError`, display the error message in the form's existing error state
    - _Requirements: 1.1, 6.5, 9.1, 9.2, 9.3_
  - [x] 7.4 Update `cohortle-web/src/components/auth/SignupForm.tsx`
    - Add an "or" divider below the submit button
    - Add `<GoogleAuthButton onSuccess={...} onError={...} />` below the divider
    - On `onSuccess`, handle the returned user and redirect (same logic as login)
    - On `onError`, display the error message in the form's existing error state
    - _Requirements: 1.2, 6.5, 9.1, 9.2, 9.3_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `GOOGLE_CLIENT_ID` must be added to `cohortle-api/.env` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `cohortle-web/.env.local` before testing
- The GIS library uses a popup/One Tap flow — no redirect URI configuration is needed for the ID token flow
- Property tests use `fast-check` (already installed in both packages) with a minimum of 100 iterations each
- The migration file already exists at `cohortle-api/migrations/20260325000000-add-google-id-to-users.js`
