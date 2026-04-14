# Requirements Document

## Introduction

This feature adds Google Drive integration to Cohortle, allowing conveners to browse their Google Drive from within the platform and select files to use as lesson content. Conveners connect their Google account with Drive access once from their settings page. When creating or editing a lesson, a "Browse Drive" button opens Google's native Picker dialog. After a file is selected, Cohortle automatically fills in the lesson URL, detects the file type, ensures the file is publicly accessible, and stores the result. Learners see the file embedded inline in the lesson viewer.

The feature extends the existing Google OAuth integration (which stores `google_id` but does not currently request Drive scopes or store refresh tokens) with a separate, opt-in Drive connection flow.

## Glossary

- **Drive_Connection**: The stored association between a Cohortle convener account and their Google Drive, represented by an encrypted refresh token in the `users` table
- **Drive_Service**: The backend service responsible for exchanging refresh tokens for access tokens and calling the Google Drive API
- **Picker_Endpoint**: The backend API endpoint (`GET /v1/api/drive/picker-token`) that issues a short-lived access token for the Google Picker API
- **Picker**: The Google Picker JavaScript API dialog that allows users to browse and select files from their Google Drive
- **Drive_File**: A file selected from Google Drive, identified by its file ID, name, MIME type, web view link, and embed link
- **Sharing_Service**: The backend service responsible for verifying and setting public sharing permissions on Drive files
- **Drive_URL_Detector**: The frontend utility that identifies Google Drive, Docs, Slides, and Sheets URLs and maps them to Cohortle lesson types
- **Embed_URL_Generator**: The frontend utility that converts Drive file metadata into the correct embed URL for the lesson viewer
- **Convener**: A Cohortle user with the `convener` role who creates and manages programmes, weeks, and lessons
- **Learner**: A Cohortle user with the `student` role who enrols in programmes and views lessons
- **Refresh_Token**: A long-lived OAuth token stored encrypted in the database, used to obtain short-lived access tokens without user interaction
- **Access_Token**: A short-lived OAuth token generated on demand from a Refresh_Token, never stored persistently
- **Drive_Audit_Log**: A server-side log entry recording every file sharing permission change made by the Drive_Service

---

## Requirements

### Requirement 1: Drive Connection — Opt-In from Settings

**User Story:** As a convener, I want to connect my Google account with Drive access from my settings page, so that I can browse my Drive files when creating lessons without affecting my regular login flow.

#### Acceptance Criteria

1. THE Drive_Connection SHALL be accessible from the convener settings page at `/convener/settings` as a distinct "Google Drive" section
2. WHEN a convener who has not connected Drive visits the settings page, THE Drive_Connection section SHALL display a "Connect Google Drive" button
3. WHEN a convener clicks "Connect Google Drive", THE Drive_Connection SHALL initiate a Google OAuth 2.0 authorisation flow requesting the `https://www.googleapis.com/auth/drive.readonly` and `https://www.googleapis.com/auth/drive.file` scopes
4. WHEN the OAuth flow completes successfully, THE Drive_Service SHALL store the received refresh token encrypted in the `users` table `drive_refresh_token` column
5. WHEN a convener has an active Drive_Connection, THE Drive_Connection section SHALL display a "Connected" status with the connected Google account email and a "Disconnect" button
6. WHEN a convener clicks "Disconnect", THE Drive_Service SHALL set the `drive_refresh_token` column to `NULL` for that user and revoke the token with Google's revocation endpoint
7. IF the OAuth flow is cancelled by the convener, THEN THE Drive_Connection SHALL return the convener to the settings page without displaying an error
8. IF the OAuth flow fails due to a Google error, THEN THE Drive_Connection SHALL display a descriptive error message on the settings page

---

### Requirement 2: Refresh Token Storage Security

**User Story:** As the system, I want refresh tokens to be encrypted at rest in the database, so that a database breach does not expose conveners' Google Drive access.

#### Acceptance Criteria

1. THE Drive_Service SHALL encrypt all refresh tokens using AES-256-GCM before writing them to the `drive_refresh_token` column
2. THE Drive_Service SHALL decrypt refresh tokens using the `DRIVE_TOKEN_ENCRYPTION_KEY` environment variable when reading them from the database
3. THE Drive_Service SHALL never write a plaintext refresh token to the database
4. THE Drive_Service SHALL never include a refresh token or access token in any API response body
5. IF `DRIVE_TOKEN_ENCRYPTION_KEY` is not set, THEN THE Drive_Service SHALL log an error at startup and return a 503 response for all Drive-related endpoints
6. THE Drive_Service SHALL generate access tokens on demand from the stored refresh token and discard them after use

---

### Requirement 3: Picker Token Endpoint

**User Story:** As the frontend, I want a backend endpoint that provides a short-lived access token for the Google Picker API, so that the Picker can be initialised without exposing the refresh token to the browser.

#### Acceptance Criteria

1. THE Picker_Endpoint SHALL expose a `GET /v1/api/drive/picker-token` endpoint
2. WHEN a request is received at `GET /v1/api/drive/picker-token`, THE Picker_Endpoint SHALL require a valid Cohortle JWT with the `convener` role
3. WHEN a convener with an active Drive_Connection requests a picker token, THE Picker_Endpoint SHALL use the stored refresh token to obtain a fresh access token from Google and return it in the response
4. WHEN returning a picker token, THE Picker_Endpoint SHALL also return the `NEXT_PUBLIC_GOOGLE_CLIENT_ID` value as `appId` for Picker initialisation
5. IF the requesting convener has no Drive_Connection (no stored refresh token), THEN THE Picker_Endpoint SHALL return a 403 response with a message indicating Drive is not connected
6. IF the refresh token is invalid or has been revoked, THEN THE Picker_Endpoint SHALL return a 401 response and clear the stored `drive_refresh_token` for that user
7. THE Picker_Endpoint SHALL never include the refresh token in any response

---

### Requirement 4: Google Picker Integration in Lesson Form

**User Story:** As a convener, I want a "Browse Drive" button in the lesson creation and editing form, so that I can select files from my Google Drive to use as lesson content.

#### Acceptance Criteria

1. THE LessonForm SHALL display a "Browse Drive" button adjacent to the content URL input field when the content type is `pdf`, `link`, or `video`
2. WHEN a convener clicks "Browse Drive", THE Picker SHALL load the Google Picker JavaScript library and open the Picker dialog
3. WHEN the Picker dialog opens, THE Picker SHALL filter selectable files to: PDFs (`application/pdf`), Google Docs (`application/vnd.google-apps.document`), Google Slides (`application/vnd.google-apps.presentation`), Google Sheets (`application/vnd.google-apps.spreadsheet`), and video files (`video/*`)
4. WHEN a convener selects a file in the Picker, THE LessonForm SHALL receive the file's ID, name, MIME type, web view link, and embed link
5. WHEN a file is selected, THE LessonForm SHALL populate the content URL field with the file's web view link
6. WHEN a file is selected, THE LessonForm SHALL automatically set the content type based on the MIME type mapping defined in Requirement 6
7. IF the convener has no Drive_Connection when clicking "Browse Drive", THEN THE LessonForm SHALL display a message directing the convener to connect Drive in settings
8. IF the Picker fails to load due to a network error, THEN THE LessonForm SHALL display an error message and allow the convener to enter a URL manually

---

### Requirement 5: File Sharing Verification and Permission Setting

**User Story:** As a convener, I want Cohortle to automatically ensure selected Drive files are publicly accessible, so that learners can view the content without needing individual sharing invitations.

#### Acceptance Criteria

1. WHEN a convener selects a file via the Picker, THE Sharing_Service SHALL verify whether the file has "anyone with the link can view" sharing permissions via the Drive API
2. IF the file does not have public sharing permissions, THEN THE Sharing_Service SHALL call the Drive API to set sharing to "anyone with the link can view" using the `drive.file` scope
3. WHEN a sharing permission change is made, THE Drive_Audit_Log SHALL record the file ID, file name, convener user ID, timestamp, and the permission change made
4. IF the sharing permission change fails because the convener does not have permission to modify sharing (e.g., file is in a shared drive they do not own), THEN THE Sharing_Service SHALL return a descriptive error to the frontend and SHALL NOT save the lesson URL
5. IF the sharing permission change fails for any other reason, THEN THE Sharing_Service SHALL return a descriptive error to the frontend
6. THE Sharing_Service SHALL expose a `POST /v1/api/drive/ensure-shared` endpoint that accepts a `fileId` and returns the sharing status and any errors

---

### Requirement 6: MIME Type to Lesson Type Mapping

**User Story:** As a convener, I want Cohortle to automatically detect the correct lesson type from a selected Drive file, so that I do not have to manually set the content type after picking a file.

#### Acceptance Criteria

1. WHEN a Drive file with MIME type `application/pdf` is selected, THE LessonForm SHALL set the content type to `pdf`
2. WHEN a Drive file with MIME type `application/vnd.google-apps.presentation` is selected, THE LessonForm SHALL set the content type to `pdf`
3. WHEN a Drive file with MIME type `application/vnd.google-apps.document` is selected, THE LessonForm SHALL set the content type to `link`
4. WHEN a Drive file with MIME type `application/vnd.google-apps.spreadsheet` is selected, THE LessonForm SHALL set the content type to `link`
5. WHEN a Drive file with a MIME type matching `video/*` is selected, THE LessonForm SHALL set the content type to `link`
6. THE Drive_URL_Detector SHALL identify URLs matching the patterns `drive.google.com`, `docs.google.com`, `slides.google.com`, and `sheets.google.com` as Google Drive content

---

### Requirement 7: Drive URL Detection and Embed URL Generation

**User Story:** As the system, I want to detect Google Drive URLs in lesson content and generate correct embed URLs, so that learners see Drive files rendered inline in the lesson viewer.

#### Acceptance Criteria

1. THE Drive_URL_Detector SHALL detect Google Drive file URLs of the form `https://drive.google.com/file/d/{fileId}/view`
2. THE Drive_URL_Detector SHALL detect Google Docs URLs of the form `https://docs.google.com/document/d/{docId}/edit`
3. THE Drive_URL_Detector SHALL detect Google Slides URLs of the form `https://docs.google.com/presentation/d/{presentationId}/edit`
4. THE Drive_URL_Detector SHALL detect Google Sheets URLs of the form `https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit`
5. THE Embed_URL_Generator SHALL convert a Drive PDF file URL to `https://drive.google.com/file/d/{fileId}/preview` for iframe embedding
6. THE Embed_URL_Generator SHALL convert a Google Slides URL to `https://docs.google.com/presentation/d/{presentationId}/embed` for iframe embedding
7. THE Embed_URL_Generator SHALL convert a Google Docs URL to `https://docs.google.com/document/d/{docId}/preview` for iframe embedding
8. WHEN a lesson URL is a Google Drive URL, THE PdfLessonContent component SHALL use the embed URL generated by the Embed_URL_Generator instead of the raw URL

---

### Requirement 8: Learner-Side Inline Rendering

**User Story:** As a learner, I want Drive files to be displayed inline in the lesson viewer, so that I can view PDFs, Slides, and Docs without leaving Cohortle.

#### Acceptance Criteria

1. WHEN a lesson has a `pdf` content type and a Google Drive embed URL, THE PdfLessonContent component SHALL render the file in an iframe using the Drive preview URL
2. WHEN a lesson has a `pdf` content type and a Google Slides embed URL, THE PdfLessonContent component SHALL render the presentation in an iframe using the Slides embed URL
3. WHEN a lesson has a `link` content type and a Google Drive URL, THE LessonViewer SHALL display the file as an embedded iframe where supported, with a fallback "Open in Google Drive" link
4. WHEN a Drive file cannot be embedded (e.g., video files), THE LessonViewer SHALL display a prominent "Open in Google Drive" link instead of an iframe
5. IF an embedded Drive iframe fails to load, THEN THE LessonViewer SHALL display a fallback "Open in Google Drive" link

---

### Requirement 9: Database Schema for Drive Integration

**User Story:** As the system, I want to store Drive connection data on user records, so that conveners' Drive connections persist across sessions.

#### Acceptance Criteria

1. THE Drive_Service SHALL add a `drive_refresh_token` column of type `TEXT` to the `users` table, nullable, with no unique index
2. THE Drive_Service SHALL add a `drive_connected_email` column of type `VARCHAR(255)` to the `users` table, nullable, to store the Google account email used for Drive connection
3. WHEN a migration is run, THE Drive_Service SHALL add both columns without modifying any existing user records
4. THE Drive_Service SHALL update the `users` Sequelize model to include both new fields

---

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want all Drive API credentials and encryption keys to be managed via environment variables, so that secrets are not hardcoded and can differ between environments.

#### Acceptance Criteria

1. THE Drive_Service SHALL read the encryption key from the `DRIVE_TOKEN_ENCRYPTION_KEY` environment variable (minimum 32 bytes, base64-encoded)
2. THE Drive_Service SHALL read the Google OAuth client secret from the `GOOGLE_CLIENT_SECRET` environment variable for token exchange
3. THE Drive_Service SHALL read the OAuth redirect URI from the `DRIVE_OAUTH_REDIRECT_URI` environment variable
4. THE LessonForm SHALL read the Google API key from the `NEXT_PUBLIC_GOOGLE_API_KEY` environment variable for Picker initialisation
5. IF any required environment variable is missing, THEN THE Drive_Service SHALL log a descriptive error at startup identifying the missing variable

---

### Requirement 11: Error Handling and Edge Cases

**User Story:** As a convener, I want clear error messages when Drive operations fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. IF a convener's Drive_Connection refresh token has expired or been revoked, THEN THE Drive_Service SHALL detect this during token exchange, clear the stored token, and return a 401 response directing the convener to reconnect Drive
2. IF the Google Drive API returns a rate limit error (429), THEN THE Drive_Service SHALL return a 429 response with a message asking the convener to try again shortly
3. IF the Google Drive API is unreachable, THEN THE Drive_Service SHALL return a 503 response with a descriptive error message
4. WHEN any Drive API error occurs, THE Drive_Service SHALL log the error with the convener's user ID, the file ID (if applicable), and the error details
5. IF a selected file's sharing cannot be set because it is in a shared drive the convener does not own, THEN THE Sharing_Service SHALL return a specific error message explaining the restriction and suggesting the convener share the file manually
