# Implementation Plan: Google Drive Integration

## Overview

Implement Google Drive integration for Cohortle in four incremental phases: database + backend services, Drive connection UI in settings, Picker integration in the lesson form, and learner-side rendering. Each phase builds on the previous and ends with working, tested code.

## Tasks

- [x] 1. Database migration and model updates
  - Create `cohortle-api/migrations/YYYYMMDD-add-drive-fields-to-users.js` adding `drive_refresh_token` (TEXT, nullable) and `drive_connected_email` (VARCHAR 255, nullable) columns to the `users` table
  - Update `cohortle-api/models/users.js` to include both new fields
  - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 1.1 Write property test for migration data preservation
    - **Property 8: Migration preserves existing user records**
    - Generate random user records, run migration, verify all pre-existing columns unchanged and new columns are null
    - **Validates: Requirements 9.3**

- [x] 2. Token encryption service
  - Create `cohortle-api/services/TokenEncryptionService.js` implementing AES-256-GCM encrypt/decrypt using `DRIVE_TOKEN_ENCRYPTION_KEY`
  - Throw a descriptive error at construction time if the env var is missing or too short
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 2.1 Write property test for encryption round-trip
    - **Property 1: Refresh token encryption round-trip**
    - Generate arbitrary token strings, encrypt then decrypt, verify equality with original
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 2.2 Write property test for encrypted tokens never containing plaintext
    - **Property 2: Encrypted tokens never contain plaintext**
    - Generate arbitrary token strings, verify encrypted output does not contain the plaintext as a substring
    - **Validates: Requirements 2.1, 2.3**

- [x] 3. Drive backend service and routes
  - Create `cohortle-api/services/DriveService.js` with `connectDrive()`, `disconnectDrive()`, `getPickerToken()`, and `ensureFileShared()` methods using the `googleapis` npm package
  - Create `cohortle-api/routes/drive.js` with `POST /connect`, `POST /disconnect`, `GET /picker-token`, and `POST /ensure-shared` endpoints, all requiring a valid convener JWT
  - Register the drive router in `cohortle-api/app.js` at `/v1/api/drive`
  - Implement Drive audit logging in `ensureFileShared()` using `console.log` with structured JSON
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 10.1, 10.2, 10.3_

  - [ ]* 3.1 Write property test for picker token endpoint access control
    - **Property 7: Picker token endpoint requires convener role**
    - Generate requests with no JWT, expired JWTs, and non-convener role JWTs; verify all return 401 or 403 and never include an access token
    - **Validates: Requirements 3.2**

  - [ ]* 3.2 Write property test for tokens never appearing in API responses
    - **Property 3: Tokens never appear in API responses**
    - For each Drive endpoint, verify response bodies never contain the stored refresh token string
    - **Validates: Requirements 2.4**

  - [ ]* 3.3 Write property test for audit log on sharing change
    - **Property 9: Audit log created on every sharing change**
    - For any call to ensureFileShared() that changes permissions, verify a log entry is created with userId, fileId, fileName, and timestamp
    - **Validates: Requirements 5.3**

  - [ ]* 3.4 Write property test for error logging
    - **Property 10: Error logging includes userId and fileId**
    - For any Drive API error in ensureFileShared() or getPickerToken(), verify the logged entry includes userId and fileId
    - **Validates: Requirements 11.4**

  - [ ]* 3.5 Write integration tests for Drive routes
    - Test POST /connect: valid code → 200 + email; missing code → 400
    - Test GET /picker-token: connected convener → 200; no connection → 403; non-convener → 403
    - Test POST /ensure-shared: already shared → 200 + alreadyShared:true; unshared → 200; permission error → 403
    - Test POST /disconnect: connected convener → 200 + token cleared
    - _Requirements: 3.1–3.7, 5.1–5.6, 11.1–11.5_

- [x] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Drive URL utilities (frontend)
  - Create `cohortle-web/src/lib/utils/driveUrlUtils.ts` implementing `isDriveUrl()`, `getDriveEmbedUrl()`, `mimeTypeToLessonType()`, and `extractDriveFileId()`
  - Cover all four URL patterns (drive.google.com/file, docs.google.com/document, docs.google.com/presentation, docs.google.com/spreadsheets)
  - Map MIME types: `application/pdf` → `pdf`; `application/vnd.google-apps.presentation` → `pdf`; `application/vnd.google-apps.document` → `link`; `application/vnd.google-apps.spreadsheet` → `link`; `video/*` → `link`
  - _Requirements: 6.1–6.6, 7.1–7.7_

  - [ ]* 5.1 Write property test for MIME type mapping
    - **Property 4: MIME type mapping is total and deterministic**
    - Generate arbitrary MIME type strings; verify mimeTypeToLessonType() always returns a valid lesson type and is deterministic
    - **Validates: Requirements 6.1–6.5**

  - [ ]* 5.2 Write property test for Drive URL detection
    - **Property 5: Drive URL detection correctness**
    - Generate Drive URLs with random file IDs; verify isDriveUrl() returns true. Generate non-Drive URLs; verify it returns false
    - **Validates: Requirements 7.1–7.4, 6.6**

  - [ ]* 5.3 Write property test for embed URL generation
    - **Property 6: Embed URL generation preserves file ID**
    - Generate Drive URLs with random file IDs; verify getDriveEmbedUrl() output contains the same file ID
    - **Validates: Requirements 7.5–7.7**

- [x] 6. Drive connection UI in convener settings
  - Create `cohortle-web/src/components/convener/DriveConnectionSection.tsx` showing connection status, "Connect Google Drive" button (when disconnected), and "Disconnect" button with connected email (when connected)
  - Create `cohortle-web/src/lib/hooks/useDriveConnection.ts` to manage connection state, calling `GET /api/proxy/drive/status`, `POST /api/proxy/drive/disconnect`
  - Create `cohortle-web/src/app/api/drive/callback/route.ts` to handle the OAuth redirect, exchange the code via `POST /v1/api/drive/connect`, and redirect back to settings
  - Add `DriveConnectionSection` to `cohortle-web/src/app/convener/settings/page.tsx`
  - _Requirements: 1.1–1.8, 10.4_

  - [ ]* 6.1 Write unit tests for DriveConnectionSection
    - Test renders "Connect" button when isConnected=false
    - Test renders "Connected" status and email when isConnected=true
    - Test renders error message on OAuth failure
    - _Requirements: 1.2, 1.5, 1.8_

- [x] 7. Drive Picker hook and button (frontend)
  - Create `cohortle-web/src/lib/hooks/useDrivePicker.ts` that fetches a picker token from `GET /api/proxy/drive/picker-token`, loads the Google Picker JS library, opens the Picker with MIME type filters, and returns the selected `DriveFile` or null
  - Create `cohortle-web/src/components/convener/DrivePickerButton.tsx` that calls `useDrivePicker`, then calls `POST /api/proxy/drive/ensure-shared`, then invokes a callback with the file metadata
  - _Requirements: 4.1–4.8, 10.4_

  - [ ]* 7.1 Write unit tests for DrivePickerButton
    - Test shows "not connected" message when Drive not connected (403 from picker-token)
    - Test shows loading state during picker token fetch
    - Test calls onFileSelected callback with correct data after file selection
    - _Requirements: 4.7, 4.4, 4.5_

- [x] 8. Integrate DrivePickerButton into LessonForm
  - Add `DrivePickerButton` to `cohortle-web/src/components/convener/LessonForm.tsx` adjacent to the content URL input for `pdf`, `link`, and `video` content types
  - On file selection, call `setValue('contentUrl', file.webViewLink)` and `setValue('contentType', mimeTypeToLessonType(file.mimeType))` via react-hook-form
  - _Requirements: 4.1, 4.5, 4.6, 6.1–6.5_

  - [ ]* 8.1 Write unit tests for LessonForm Drive integration
    - Test "Browse Drive" button appears for pdf, link, video content types
    - Test "Browse Drive" button does not appear for text, live_session, quiz content types
    - Test contentUrl and contentType are populated correctly after file selection
    - _Requirements: 4.1, 4.5, 4.6_

- [x] 9. Checkpoint — Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update PdfLessonContent for Drive embed URLs
  - Update `cohortle-web/src/components/lessons/PdfLessonContent.tsx` to call `getDriveEmbedUrl()` before rendering the iframe; use the embed URL as the iframe `src` when the input URL is a Drive URL
  - _Requirements: 7.8, 8.1, 8.2_

  - [ ]* 10.1 Write unit tests for PdfLessonContent Drive rendering
    - Test renders iframe with Drive preview URL when given a Drive PDF URL
    - Test renders iframe with Slides embed URL when given a Google Slides URL
    - Test falls back to original URL for non-Drive URLs
    - _Requirements: 8.1, 8.2_

- [x] 11. Update LessonViewer for Drive link lessons
  - Update `cohortle-web/src/components/lessons/LinkLessonContent.tsx` to detect Drive URLs in `link` content type lessons, render an embedded iframe where supported, and show a fallback "Open in Google Drive" link when embedding is not possible or the iframe fails to load
  - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 11.1 Write unit tests for LessonViewer Drive link rendering
    - Test renders embedded iframe for Drive link lessons
    - Test renders "Open in Google Drive" fallback for video MIME type Drive files
    - Test renders fallback link when iframe onError fires
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The `googleapis` npm package should be installed in `cohortle-api`: `npm install googleapis`
- The Google Picker JS library is loaded client-side from `https://apis.google.com/js/api.js` — no npm package needed
- `DRIVE_TOKEN_ENCRYPTION_KEY` must be a base64-encoded 32-byte key; generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_GOOGLE_API_KEY` is a browser API key (not the OAuth client secret) used to initialise the Picker
- The Drive OAuth callback route (`/api/drive/callback`) must be registered as an authorised redirect URI in the Google Cloud Console
- Property tests validate universal correctness; unit tests validate specific examples and edge cases
