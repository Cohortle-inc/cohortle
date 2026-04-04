# Implementation Plan: Programme Application Flow

## Overview

Implements the Apply → Review → Accept → Enroll lifecycle and the Organisation Page discovery layer. Work is ordered: database migrations → Sequelize models → service layer → API routes → frontend pages → property-based tests.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Create migration to add `onboarding_mode`, `application_deadline`, `application_form_slug` to `programmes`
    - File: `cohortle-api/migrations/20260401000000-add-application-fields-to-programmes.js`
    - `onboarding_mode` ENUM('code','application','hybrid') NOT NULL DEFAULT 'code'
    - `application_deadline` TIMESTAMP NULL
    - `application_form_slug` VARCHAR(255) NULL UNIQUE
    - _Requirements: 7.1, 7.6, 1.1_
  - [x] 1.2 Create migration to add `organisation_slug`, `organisation_name`, `organisation_description` to `users`
    - File: `cohortle-api/migrations/20260401000001-add-organisation-fields-to-users.js`
    - `organisation_slug` VARCHAR(50) NULL UNIQUE with index
    - _Requirements: 13.1, 13.7_
  - [x] 1.3 Create migration to add `enrollment_source` and `application_id` to `enrollments`
    - File: `cohortle-api/migrations/20260401000002-add-application-fields-to-enrollments.js`
    - `enrollment_source` ENUM('code','application') NOT NULL DEFAULT 'code'
    - `application_id` UUID NULL REFERENCES applications(id)
    - _Requirements: 5.6, 11.4_
  - [x] 1.4 Create migration for new `applications` table
    - File: `cohortle-api/migrations/20260401000003-create-applications.js`
    - All columns per design: id (UUID), programme_id, cohort_id, applicant_name, applicant_email, user_id, status ENUM, responses JSON, reviewer_id, reviewer_notes, rejection_reason, decision_at, submitted_at, created_at, updated_at
    - Indexes on programme_id, applicant_email, status
    - _Requirements: 2.2, 8.1_
  - [x] 1.5 Create migration for `application_history` table
    - File: `cohortle-api/migrations/20260401000004-create-application-history.js`
    - _Requirements: 8.1_
  - [x] 1.6 Create migration for `acceptance_tokens` table
    - File: `cohortle-api/migrations/20260401000005-create-acceptance-tokens.js`
    - _Requirements: 5.3_
  - [x] 1.7 Create migration for `application_template_questions` table
    - File: `cohortle-api/migrations/20260401000006-create-application-template-questions.js`
    - _Requirements: 3.2_
  - [x] 1.8 Create migration to add `manage_applications` permission to convener role
    - File: `cohortle-api/migrations/20260401000007-add-manage-applications-permission.js`
    - Insert permission row and link to convener role via role_permissions
    - _Requirements: 10.6_

- [x] 2. Sequelize models
  - [x] 2.1 Create `cohortle-api/models/applications.js`
    - Define all fields, associations: `belongsTo Programme`, `belongsTo Cohort`, `belongsTo User (as applicant)`, `belongsTo User (as reviewer)`, `hasMany ApplicationHistory`
    - _Requirements: 2.2, 4.1_
  - [x] 2.2 Create `cohortle-api/models/application_history.js`
    - Fields: id, application_id, from_status, to_status, changed_by, notes, created_at
    - Association: `belongsTo Application`
    - _Requirements: 8.1_
  - [x] 2.3 Create `cohortle-api/models/acceptance_tokens.js`
    - Fields: id, token, application_id, cohort_id, applicant_email, expires_at, used_at, created_at
    - _Requirements: 5.3_
  - [x] 2.4 Create `cohortle-api/models/application_template_questions.js`
    - Fields: id, programme_id, question_text, question_type ENUM, is_required, options JSON, order_index
    - Association: `belongsTo Programme`
    - _Requirements: 3.2_
  - [x] 2.5 Update `cohortle-api/models/enrollments.js` to include `enrollment_source` and `application_id` fields
    - _Requirements: 5.6, 11.4_
  - [x] 2.6 Update `cohortle-api/models/programmes.js` to include `onboarding_mode`, `application_deadline`, `application_form_slug`
    - _Requirements: 7.1_
  - [x] 2.7 Update `cohortle-api/models/users.js` to include `organisation_slug`, `organisation_name`, `organisation_description`
    - _Requirements: 13.1_

- [x] 3. ApplicationHistoryService
  - [x] 3.1 Create `cohortle-api/services/ApplicationHistoryService.js`
    - Implement `recordTransition(applicationId, { fromStatus, toStatus, changedBy, notes })`
    - Implement `getHistory(applicationId)` — returns records ordered by `created_at` ASC
    - _Requirements: 8.1, 8.3_
  - [ ]* 3.2 Write unit tests for ApplicationHistoryService
    - File: `cohortle-api/__tests__/services/ApplicationHistoryService.test.js`
    - Test history creation, chronological ordering, association with application
    - _Requirements: 8.1, 8.3_

- [x] 4. AcceptanceTokenService
  - [x] 4.1 Create `cohortle-api/services/AcceptanceTokenService.js`
    - Implement `createToken(applicationId, cohortId, applicantEmail)` — generates a 64-char random hex token, sets `expires_at = NOW() + 7 days`
    - Implement `validateToken(token)` — throws `TOKEN_EXPIRED` if past `expires_at`, throws `TOKEN_ALREADY_USED` if `used_at` is set
    - Implement `consumeToken(token)` — sets `used_at = NOW()`
    - _Requirements: 5.3, 5.8_
  - [ ]* 4.2 Write unit tests for AcceptanceTokenService
    - File: `cohortle-api/__tests__/services/AcceptanceTokenService.test.js`
    - Test token creation, expiry validation, consumption, double-use rejection
    - _Requirements: 5.3, 5.8_

- [x] 5. ApplicationService — core submission and query
  - [x] 5.1 Create `cohortle-api/services/ApplicationService.js` with submission logic
    - Implement `submitApplication(programmeId, { name, email, responses })`
    - Validate: programme exists, `lifecycle_status = 'recruiting'`, `onboarding_mode != 'code'`, deadline not passed, capacity not full, no duplicate pending application, all required template questions answered
    - Generate `application_form_slug` on programme if not already set (UUID-based slug)
    - Create application record with `status = 'submitted'`
    - Call `ApplicationHistoryService.recordTransition` for the initial `null → submitted` transition
    - Trigger confirmation email via `ResendService` to applicant and notification email to convener
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 1.1, 1.3, 1.4_
  - [x] 5.2 Add query methods to ApplicationService
    - Implement `getProgrammeApplications(programmeId, { status, sort, cohortId, page, limit })`
    - Implement `getStatusCounts(programmeId)` — returns counts grouped by status
    - Implement `getApplication(applicationId, requestingUserId)` — auto-transitions `submitted → under_review` via `transitionStatus`, records history
    - Implement `getLearnerApplications(userId)` — returns all applications linked to user's email or user_id
    - Implement `exportApplicationsCsv(programmeId, requestingUserId)` — returns CSV string
    - _Requirements: 4.1, 4.3, 9.1, 12.2, 12.5_
  - [x] 5.3 Add status transition methods to ApplicationService
    - Implement `transitionStatus(applicationId, newStatus, { reviewerId, cohortId, rejectionReason, notes })`
    - Enforce state machine using `VALID_TRANSITIONS` map; throw `INVALID_STATUS_TRANSITION` for invalid moves
    - On `accepted`: require `cohortId`, check cohort capacity, call `AcceptanceTokenService.createToken`, send acceptance email via `ResendService`, record history
    - On `rejected`: require `rejectionReason`, send rejection email, record history
    - On `waitlisted`: record history, no email required
    - Implement `bulkTransition(applicationIds, newStatus, { reviewerId, cohortId, rejectionReason })`
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 6.1, 6.2, 6.3, 4.7, 8.1, 8.5_
  - [x] 5.4 Add acceptance token redemption to ApplicationService
    - Implement `redeemAcceptanceToken(token, userId)`
    - Validate token via `AcceptanceTokenService.validateToken`
    - Create enrollment via `EnrollmentService` with `enrollment_source = 'application'` and `application_id` set
    - Consume token via `AcceptanceTokenService.consumeToken`
    - If `userId` is null (new user path), return cohort/programme info for pre-fill — enrollment created after signup
    - _Requirements: 5.4, 5.5, 5.6_
  - [ ]* 5.5 Write unit tests for ApplicationService
    - File: `cohortle-api/__tests__/services/ApplicationService.test.js`
    - Test each transition, duplicate rejection, capacity guard, deadline guard, CSV export shape
    - _Requirements: 2.1–2.6, 5.1–5.8, 6.1–6.5_

- [x] 6. Application template management in ApplicationService
  - [x] 6.1 Add template methods to ApplicationService (or a dedicated `ApplicationTemplateService`)
    - Implement `getTemplate(programmeId)` — returns questions ordered by `order_index`
    - Implement `saveTemplate(programmeId, questions)` — upserts questions, preserves existing application responses
    - Implement `reorderQuestions(programmeId, orderedIds)` — updates `order_index` values
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 6.2 Write unit tests for template management
    - Test that updating template does not mutate existing application `responses`
    - Test reorder preserves question content
    - _Requirements: 3.3, 3.4_

- [x] 7. Extend EnrollmentService for application-sourced enrollments
  - [x] 7.1 Update `cohortle-api/services/EnrollmentService.js`
    - Add optional `{ enrollmentSource, applicationId }` params to the enrollment creation method
    - Default `enrollmentSource` to `'code'` to preserve all existing behaviour
    - Add `onboarding_mode` check: if mode is `application`, reject enrollment-code join attempts
    - _Requirements: 7.3, 11.1, 11.4, 11.5_
  - [ ]* 7.2 Write property test for enrollment source invariants
    - File: `cohortle-api/__tests__/programme-application-flow/enrollmentSourceInvariants.pbt.js`
    - **Property 15: Application-sourced enrollment fields** — for any enrollment created via application acceptance, `enrollment_source = 'application'` and `application_id` is non-null
    - **Property 34: Acceptance-link signup assigns learner role** — new user created via acceptance link has role `learner`
    - **Property 35: Application enrollment does not change existing role** — existing user's role is unchanged after application-based enrollment
    - **Property 36: Content access equivalence** — code-enrolled and application-enrolled learners get identical responses from content endpoints
    - _Requirements: 5.6, 10.3, 10.4, 11.3, 11.4_

- [x] 8. API routes — applications
  - [x] 8.1 Create `cohortle-api/routes/applications.js`
    - `GET /v1/api/programmes/:id/application-form` — public, returns programme info + template questions
    - `POST /v1/api/programmes/:id/applications` — public, calls `ApplicationService.submitApplication`
    - `GET /v1/api/programmes/:id/applications` — convener (owner), with filter/sort/pagination query params
    - `GET /v1/api/programmes/:id/applications/counts` — convener (owner)
    - `GET /v1/api/programmes/:id/applications/export` — convener (owner), streams CSV
    - `GET /v1/api/applications/:id` — convener (owner), triggers auto under_review transition
    - `PATCH /v1/api/applications/:id/status` — convener (owner)
    - `PATCH /v1/api/applications/:id/notes` — convener (owner)
    - `POST /v1/api/applications/bulk-action` — convener (owner)
    - `GET /v1/api/me/applications` — authenticated learner
    - `PUT /v1/api/applications/:id` — authenticated learner (draft only)
    - `POST /v1/api/acceptance-tokens/:token/redeem` — public
    - `GET /v1/api/convener/applications` — convener, cross-programme view
    - Register in `cohortle-api/app.js`
    - _Requirements: 4.1–4.7, 5.1–5.8, 6.1–6.5, 9.1–9.5, 12.1–12.5_
  - [ ]* 8.2 Write integration tests for application routes
    - File: `cohortle-api/__tests__/routes/applications.test.js`
    - Test public submission, auth guards, status transitions, bulk action, CSV export
    - _Requirements: 2.1–2.6, 4.1–4.7, 10.1, 10.2_

- [x] 9. API routes — organisation page and programme template
  - [x] 9.1 Create `cohortle-api/routes/org.js`
    - `GET /v1/api/org/:slug` — public, returns convener info + open recruiting programmes
    - `GET /v1/api/org/:slug/check` — public, returns `{ available: boolean }`
    - Register in `cohortle-api/app.js`
    - _Requirements: 13.1, 13.2, 13.4, 13.7_
  - [x] 9.2 Add programme template and onboarding-mode endpoints to `cohortle-api/routes/programme.js`
    - `PATCH /v1/api/programmes/:id/onboarding-mode` — convener (owner)
    - `GET /v1/api/programmes/:id/application-template` — convener (owner)
    - `PUT /v1/api/programmes/:id/application-template` — convener (owner)
    - _Requirements: 7.1, 3.1, 3.2_
  - [ ]* 9.3 Write unit tests for org routes
    - File: `cohortle-api/__tests__/routes/org.test.js`
    - Test slug lookup, empty state, slug uniqueness conflict
    - _Requirements: 13.1, 13.4, 13.7_

- [x] 10. Checkpoint — API layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend API client
  - [x] 11.1 Create `cohortle-web/src/lib/api/applications.ts`
    - Export all functions listed in the design: `getOrganisationPage`, `checkOrganisationSlug`, `getApplicationForm`, `submitApplication`, `getProgrammeApplications`, `getApplicationCounts`, `getApplication`, `transitionApplicationStatus`, `addApplicationNotes`, `bulkTransitionApplications`, `getMyApplications`, `redeemAcceptanceToken`, `exportApplicationsCsv`, `getCrossProgammeApplications`
    - _Requirements: all frontend-facing requirements_

- [x] 12. Public Organisation Page
  - [x] 12.1 Create `cohortle-web/src/app/org/[slug]/page.tsx`
    - Fetch org data via `getOrganisationPage(slug)`
    - Render convener name, description, and a `ProgrammeCard` for each open programme
    - Show empty state when no recruiting programmes exist
    - Show "Applied" badge on cards for authenticated users who have already applied
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.8_
  - [x] 12.2 Create `cohortle-web/src/components/org/OrgProgrammeCard.tsx`
    - Props: programme name, description, deadline, application form URL, applied status
    - "Apply" button navigates to `/apply/[application_form_slug]`
    - _Requirements: 13.2, 13.3_

- [x] 13. Public Application Form Page
  - [x] 13.1 Create `cohortle-web/src/app/apply/[slug]/page.tsx`
    - Fetch form data via `getApplicationForm(slug)`
    - Render programme info, deadline, and all template questions
    - Show "closed" state if deadline passed or programme not recruiting
    - On submit, call `submitApplication` and redirect to `/apply/confirmation`
    - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.4_
  - [x] 13.2 Create `cohortle-web/src/components/application/ApplicationForm.tsx`
    - Renders dynamic question fields based on question type (text, textarea, select, multiselect)
    - Client-side validation for required fields before submission
    - _Requirements: 2.1, 3.2_

- [x] 14. Acceptance landing page
  - [x] 14.1 Create `cohortle-web/src/app/accept/[token]/page.tsx`
    - On load, call `redeemAcceptanceToken(token)`
    - If user is not authenticated: redirect to signup pre-filled with name/email from token data, then complete enrollment after signup
    - If user is authenticated: complete enrollment immediately, redirect to programme
    - Show expiry message with "request new link" option if token is expired
    - _Requirements: 5.4, 5.5, 5.8_

- [x] 15. Convener — Programme onboarding mode settings
  - [x] 15.1 Update `cohortle-web/src/components/convener/ProgrammeForm.tsx`
    - Add `onboarding_mode` radio/select field (code / application / hybrid)
    - Add `application_deadline` date picker (optional)
    - Show warning when switching away from `application` mode with pending applications
    - _Requirements: 7.1, 7.5, 7.6_
  - [x] 15.2 Create `cohortle-web/src/components/convener/ApplicationTemplateEditor.tsx`
    - Drag-and-drop question reordering (or up/down buttons)
    - Add/edit/delete questions with type selector and required toggle
    - Options field for select/multiselect types
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  - [x] 15.3 Add "Copy Application Form URL" and "Copy Org Page URL" buttons to convener programme dashboard
    - Reads `application_form_slug` from programme data and constructs the public URL
    - Reads `organisation_slug` from user profile
    - _Requirements: 1.5, 13.5_

- [x] 16. Convener — Applications review dashboard
  - [x] 16.1 Create `cohortle-web/src/app/convener/programmes/[id]/applications/page.tsx`
    - Fetch applications via `getProgrammeApplications` with filter/sort controls
    - Show status count summary bar via `getApplicationCounts`
    - Render applications table with inline Accept / Reject / Waitlist action buttons
    - Inline status update without full page reload
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [x] 16.2 Create `cohortle-web/src/app/convener/programmes/[id]/applications/[appId]/page.tsx`
    - Fetch single application detail
    - Display full responses, applicant info, status history in chronological order
    - Reviewer notes textarea with save button
    - Accept (with cohort selector) / Reject (with reason field) / Waitlist action buttons
    - _Requirements: 4.2, 4.3, 4.4, 8.3_
  - [x] 16.3 Create `cohortle-web/src/components/convener/ApplicationsTable.tsx`
    - Reusable table with checkbox selection for bulk actions
    - Status badge component
    - Filter bar (status, date range)
    - _Requirements: 4.1, 4.5, 4.6, 4.7_
  - [x] 16.4 Create `cohortle-web/src/app/convener/applications/page.tsx` (cross-programme view)
    - Fetch via `getCrossProgammeApplications` with programme filter
    - Show cross-programme applicant overlap indicator
    - _Requirements: 13.9, 13.10_

- [x] 17. Convener — Organisation slug settings
  - [x] 17.1 Update convener profile settings page to include `organisation_slug`, `organisation_name`, `organisation_description` fields
    - Slug availability check via `checkOrganisationSlug` on blur
    - Client-side format validation (lowercase alphanumeric + hyphens, 3–50 chars)
    - Prompt to set slug when org page feature is accessed without one
    - _Requirements: 13.6, 13.7_

- [x] 18. Learner — My Applications section
  - [x] 18.1 Add `MyApplicationsSection` component to `cohortle-web/src/app/dashboard/page.tsx`
    - Fetch via `getMyApplications()`
    - Show each application with programme name, status badge, and link to programme if accepted
    - Draft applications show an "Edit" link
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [x] 19. Checkpoint — Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Property-based tests — submission validation
  - [x]* 20.1 Write property tests for application submission validation
    - File: `cohortle-api/__tests__/programme-application-flow/applicationSubmissionValidation.pbt.js`
    - **Property 4: Required field validation** — for any submission missing name, email, or required question response, the submission SHALL be rejected
    - **Property 6: Duplicate application rejection** — for any email with a pending application (submitted/under_review/accepted), a second submission SHALL be rejected
    - **Property 7: Non-recruiting programme rejection** — for any programme not in `recruiting` status, submission SHALL be rejected
    - Tag: `Feature: programme-application-flow, Property 4/6/7`
    - _Requirements: 2.1, 2.3, 2.6_

- [x] 21. Property-based tests — status transition state machine
  - [-]* 21.1 Write property tests for the application status state machine
    - File: `cohortle-api/__tests__/programme-application-flow/statusTransitionMachine.pbt.js`
    - **Property 11: Submitted → under_review auto-transition** — for any submitted application, retrieving it via detail endpoint results in `under_review` status
    - **Property 14: Acceptance state transition invariants** — for any accepted application, `status = 'accepted'`, `reviewer_id` non-null, `decision_at` non-null
    - **Property 18: Rejection requires reason** — for any rejection without `rejection_reason`, request SHALL be rejected
    - **Property 19: Rejection state transition invariants** — for any rejected application, `status = 'rejected'` and `rejection_reason` non-null
    - **Property 27: Status transition creates history record** — for any status transition, an `application_history` record is created with correct fields
    - **Property 28: History is chronologically ordered** — for any application with multiple history records, `getHistory` returns them in ascending `created_at` order
    - **Property 29: Invalid state machine transitions are rejected** — for any transition not in `VALID_TRANSITIONS`, request SHALL be rejected with error
    - Tag: `Feature: programme-application-flow, Property 11/14/18/19/27/28/29`
    - _Requirements: 4.3, 5.1, 6.1, 6.2, 8.1, 8.3, 8.5_

- [x] 22. Property-based tests — onboarding mode guards
  - [x]* 22.1 Write property tests for onboarding mode enforcement
    - File: `cohortle-api/__tests__/programme-application-flow/onboardingModeGuards.pbt.js`
    - **Property 22: onboarding_mode persists correctly** — for any valid mode value, setting then retrieving returns the same value
    - **Property 23: code mode blocks application submission** — for any programme with `onboarding_mode = 'code'`, application submission SHALL be rejected
    - **Property 24: application mode blocks enrollment code join** — for any programme with `onboarding_mode = 'application'`, enrollment code join SHALL be rejected
    - **Property 25: hybrid mode allows both flows** — for any hybrid programme, both code enrollment and application submission SHALL succeed
    - **Property 26: New programmes default to code mode** — for any newly created programme without explicit mode, `onboarding_mode = 'code'`
    - Tag: `Feature: programme-application-flow, Property 22/23/24/25/26`
    - _Requirements: 7.1–7.4, 7.6, 11.1, 11.2_

- [x] 23. Property-based tests — capacity and deadline guards
  - [x]* 23.1 Write property tests for capacity and deadline enforcement
    - File: `cohortle-api/__tests__/programme-application-flow/capacityAndDeadlineGuards.pbt.js`
    - **Property 2: Deadline enforcement** — for any programme with `application_deadline` in the past, submission SHALL be rejected
    - **Property 3: Capacity enforcement** — for any programme where all cohorts are at `max_members`, submission SHALL be rejected
    - **Property 16: Cohort capacity guard on acceptance** — for any cohort at `max_members`, accepting an application into it SHALL be rejected
    - **Property 17: Acceptance token expiry (edge case)** — for any token with `expires_at` in the past, redemption SHALL return expiry error and NOT create enrollment
    - Tag: `Feature: programme-application-flow, Property 2/3/16/17`
    - _Requirements: 1.3, 1.4, 5.7, 5.8_

- [x] 24. Property-based tests — access control
  - [x]* 24.1 Write property tests for access control enforcement
    - File: `cohortle-api/__tests__/programme-application-flow/accessControlEnforcement.pbt.js`
    - **Property 32: Public submission requires no authentication** — for any valid submission to a recruiting programme, request succeeds without Authorization header
    - **Property 33: Only programme owner or admin can review** — for any convener who does not own the programme, review/accept/reject SHALL return 403
    - Tag: `Feature: programme-application-flow, Property 32/33`
    - _Requirements: 10.1, 10.2_

- [x] 25. Property-based tests — application list filtering and counts
  - [ ]* 25.1 Write property tests for filtering and counts
    - File: `cohortle-api/__tests__/programme-application-flow/applicationListFiltering.pbt.js`
    - **Property 10: Applications list filter correctness** — for any filter (status, date, cohort), all returned applications satisfy the filter and no matching application is omitted
    - **Property 30: Learner sees all their applications** — for any learner with N applications, `/v1/api/me/applications` returns exactly N records
    - **Property 37: Status counts are accurate** — counts from `/counts` endpoint equal direct DB counts per status
    - Tag: `Feature: programme-application-flow, Property 10/30/37`
    - _Requirements: 4.1, 4.5, 9.1, 12.2_

- [x] 26. Property-based tests — organisation page and slug
  - [x]* 26.1 Write property tests for organisation page and slug validation
    - File: `cohortle-api/__tests__/programme-application-flow/organisationPageProperties.pbt.js`
    - **Property 38: Organisation page only shows recruiting programmes** — for any convener, `/v1/api/org/:slug` returns only programmes with `onboarding_mode` in (application, hybrid) AND `lifecycle_status = 'recruiting'`
    - **Property 39: Organisation slug uniqueness** — for any two conveners, their slugs are distinct; setting a taken slug SHALL be rejected
    - **Property 40: Organisation slug format validation** — for any slug not matching `^[a-z0-9-]{3,50}$`, the update SHALL be rejected
    - **Property 41: Cross-programme applicant visibility** — for any applicant with N applications across a convener's programmes, the cross-programme endpoint returns all N
    - Tag: `Feature: programme-application-flow, Property 38/39/40/41`
    - _Requirements: 13.1, 13.7, 13.9, 13.10_

- [x] 27. Property-based tests — remaining properties
  - [ ]* 27.1 Write property tests for application form URL, template, and round-trip properties
    - File: `cohortle-api/__tests__/programme-application-flow/applicationFormAndTemplate.pbt.js`
    - **Property 1: Application form URL generated for application/hybrid modes** — for any programme with mode application or hybrid, `application_form_slug` is non-null
    - **Property 5: Application creation round-trip** — for any valid submission, querying by ID returns `status = 'submitted'`, correct email, and all responses
    - **Property 8: Template required before recruiting** — for any application/hybrid programme with zero template questions, setting `lifecycle_status = 'recruiting'` SHALL be rejected
    - **Property 9: Template update preserves existing responses** — for any existing application, updating the template does NOT modify its `responses` field
    - **Property 12: Reviewer notes round-trip** — for any note added, querying the application returns the note text, correct `reviewer_id`, and non-null `updated_at`
    - **Property 13: Bulk action completeness** — for any set of application IDs in a bulk action, all selected applications have the new status and `reviewer_id` set
    - **Property 20: Waitlist → accept follows same acceptance flow** — promoted waitlisted application has identical final state to direct under_review → accepted
    - **Property 21: Rejected applicant can reapply** — for any rejected application on a recruiting programme, a new submission from the same email SHALL succeed
    - **Property 31: Draft editable, submitted/under_review read-only** — PUT on draft succeeds; PUT on submitted or under_review is rejected
    - Tag: `Feature: programme-application-flow, Property 1/5/8/9/12/13/20/21/31`
    - _Requirements: 1.1, 2.2, 3.1, 3.3, 4.4, 4.7, 6.4, 6.5, 9.3, 9.4_

- [x] 28. Integration tests — full lifecycle flows
  - [ ]* 28.1 Write integration tests for end-to-end flows
    - File: `cohortle-api/__tests__/programme-application-flow/lifecycleIntegration.test.js`
    - Full Apply → Review → Accept → Enroll flow for a new user (no existing account)
    - Full Apply → Review → Accept → Enroll flow for an existing user
    - Hybrid mode: simultaneous code enrollment and application submission on same programme
    - Bulk accept with history verification (all selected applications have history records)
    - CSV export: verify column headers and row count match application count
    - _Requirements: 5.4, 5.5, 7.4, 4.7, 12.5_

- [x] 29. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Migration timestamps use `20260401` prefix — adjust if running after that date
- All property tests use **fast-check** (already in the codebase) with minimum 100 iterations
- The `EnrollmentService` changes (task 7.1) must preserve all existing tests — run `cohortle-api/__tests__/services/EnrollmentService.test.js` after that task
- The `application_form_slug` on programmes is auto-generated by `ApplicationService.submitApplication` if not already set; conveners can also trigger generation by setting `onboarding_mode`
- Acceptance token redemption for new users is a two-step flow: token validates and returns pre-fill data → user completes signup → enrollment is created; the token should not be consumed until enrollment is confirmed
