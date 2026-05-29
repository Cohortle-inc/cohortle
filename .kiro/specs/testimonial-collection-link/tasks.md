# Implementation Plan: Testimonial Collection Link

## Overview

Implement a token-based testimonial collection flow. A convener generates a shareable link scoped to a cohort; enrolled learners follow the link, authenticate, and submit a testimonial that feeds into the existing `testimonials` table.

## Tasks

- [x] 1. Database migration and Sequelize models
  - Create migration `cohortle-api/migrations/YYYYMMDD-create-testimonial-collection-links.js` with the `testimonial_collection_links` table (id UUID PK, token VARCHAR(128) unique, cohort_id FK, convener_user_id FK, auto_approve BOOLEAN default false, expires_at DATETIME nullable, revoked_at DATETIME nullable, created_at, updated_at)
  - Create migration for `testimonial_submissions` table (id UUID PK, collection_link_id FK, learner_user_id FK, testimonial_id FK, submitted_at DATETIME; unique constraint on collection_link_id + learner_user_id)
  - Create `cohortle-api/models/testimonial_collection_links.js` Sequelize model
  - Create `cohortle-api/models/testimonial_submissions.js` Sequelize model
  - _Requirements: 1.1, 1.3, 3.5_

- [x] 2. CollectionLinkService — core business logic
  - [x] 2.1 Implement `cohortle-api/services/CollectionLinkService.js`
    - `generateToken()` — 32-byte crypto.randomBytes hex string
    - `getOrCreateLink(cohort_id, convener_user_id)` — idempotent: returns existing non-revoked link or creates new one
    - `revokeLink(cohort_id, convener_user_id)` — sets revoked_at
    - `regenerateLink(cohort_id, convener_user_id)` — revokes current, creates new token
    - `updateLinkSettings(cohort_id, convener_user_id, { auto_approve, expires_at })` — persists settings
    - `validateToken(token)` — returns link or throws LINK_NOT_FOUND / LINK_EXPIRED
    - `buildUrl(token)` — returns `${process.env.FRONTEND_URL}/testimonial/${token}`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4_

  - [x] 2.2 Write property test for token uniqueness
    - **Property 1: Token uniqueness**
    - **Validates: Requirements 1.1, 1.6**
    - File: `cohortle-api/__tests__/testimonial-collection-link/tokenUniqueness.pbt.js`

  - [x] 2.3 Write property test for idempotent link creation
    - **Property 2: Idempotent link creation**
    - **Validates: Requirements 1.3**
    - File: `cohortle-api/__tests__/testimonial-collection-link/idempotentLinkCreation.pbt.js`

  - [x] 2.4 Write property test for revoked/expired token rejection
    - **Property 3: Revoked token rejection** and **Property 4: Expired token rejection**
    - **Validates: Requirements 1.5, 2.4, 3.2, 3.3**
    - File: `cohortle-api/__tests__/testimonial-collection-link/tokenRejection.pbt.js`

- [x] 3. API routes — convener management endpoints
  - Create `cohortle-api/routes/testimonial_links.js` and register it in `cohortle-api/app.js`
  - `POST /v1/api/cohorts/:cohort_id/collection-link` — verify convener owns cohort, call `getOrCreateLink`, return link + URL
  - `PUT /v1/api/cohorts/:cohort_id/collection-link` — verify ownership, call `updateLinkSettings`
  - `DELETE /v1/api/cohorts/:cohort_id/collection-link` — verify ownership, call `revokeLink`
  - `POST /v1/api/cohorts/:cohort_id/collection-link/regenerate` — verify ownership, call `regenerateLink`
  - `GET /v1/api/convener/collection-links` — return all links for the authenticated convener with cohort name, programme name, submission count, status (active/expired/revoked)
  - All convener routes use `[UrlMiddleware, TokenMiddleware({ role: 'convener' })]`
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 2.4_

  - [x] 3.1 Write property test for ownership enforcement
    - **Property 10: Ownership enforcement**
    - **Validates: Requirements 1.2**
    - File: `cohortle-api/__tests__/testimonial-collection-link/ownershipEnforcement.pbt.js`

- [x] 4. API routes — public token validation and learner submission
  - `GET /v1/api/testimonial-links/:token` — public, no auth; call `validateToken`, return `{ cohort_name, programme_name, auto_approve }`; return 404 or 410 on invalid/expired
  - `POST /v1/api/testimonial-links/:token/submit` — requires learner JWT; validate token; check enrollment in `enrollments` table; check `testimonial_submissions` for duplicate (409); validate quote ≥ 10 chars and rating 1–5 (400); create `testimonials` record with `is_featured = auto_approve`; create `testimonial_submissions` record; return `{ error: false, testimonial_id }`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.1 Write property test for enrollment gate
    - **Property 5: Enrollment gate**
    - **Validates: Requirements 3.4**
    - File: `cohortle-api/__tests__/testimonial-collection-link/enrollmentGate.pbt.js`

  - [x] 4.2 Write property test for duplicate submission rejection
    - **Property 6: Duplicate submission rejection**
    - **Validates: Requirements 3.5**
    - File: `cohortle-api/__tests__/testimonial-collection-link/duplicateSubmission.pbt.js`

  - [x] 4.3 Write property test for auto-approve flag propagation
    - **Property 7: Auto-approve flag propagation**
    - **Validates: Requirements 4.2, 4.3**
    - File: `cohortle-api/__tests__/testimonial-collection-link/autoApproveFlag.pbt.js`

  - [x] 4.4 Write property test for testimonial field population
    - **Property 8: Testimonial field population**
    - **Validates: Requirements 4.4**
    - File: `cohortle-api/__tests__/testimonial-collection-link/testimonialFieldPopulation.pbt.js`

  - [x] 4.5 Write property test for quote and rating validation
    - **Property 9: Quote and rating validation**
    - **Validates: Requirements 4.5, 4.6**
    - File: `cohortle-api/__tests__/testimonial-collection-link/quoteRatingValidation.pbt.js`

- [x] 5. Checkpoint — Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend API client functions
  - Add to `cohortle-web/src/lib/api/convener.ts`:
    - `CollectionLink` interface (id, token, cohortId, cohortName, programmeName, autoApprove, expiresAt, revokedAt, submissionCount, status, url)
    - `getCollectionLink(cohortId)` — GET `/v1/api/cohorts/:cohortId/collection-link` (returns link or null)
    - `createCollectionLink(cohortId)` — POST
    - `updateCollectionLink(cohortId, settings)` — PUT
    - `revokeCollectionLink(cohortId)` — DELETE
    - `regenerateCollectionLink(cohortId)` — POST `.../regenerate`
    - `listCollectionLinks()` — GET `/v1/api/convener/collection-links`
  - Add to a new `cohortle-web/src/lib/api/testimonials.ts`:
    - `validateCollectionLink(token)` — GET `/v1/api/testimonial-links/:token`
    - `submitTestimonial(token, { quote, rating, displayName? })` — POST `.../submit`
  - _Requirements: 1.1, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 4.1_

- [x] 7. TestimonialCollectionLinkSection component (convener UI)
  - Create `cohortle-web/src/components/convener/TestimonialCollectionLinkSection.tsx`
  - Props: `cohortId: number`
  - On mount: call `getCollectionLink` to check for existing link
  - Show link status badge (active / expired / revoked / none)
  - Show submission count when link exists
  - "Generate Link" button → calls `createCollectionLink`, shows URL with copy-to-clipboard
  - "Regenerate" button → confirm dialog → calls `regenerateCollectionLink`
  - "Revoke" button → confirm dialog → calls `revokeCollectionLink`
  - Auto-approve toggle → calls `updateCollectionLink` on change
  - Optional expiry date picker → calls `updateCollectionLink` on change
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Embed TestimonialCollectionLinkSection in cohort detail page
  - Update `cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/page.tsx`
  - Import and render `<TestimonialCollectionLinkSection cohortId={cohortId} />` below the existing cohort info sections
  - _Requirements: 5.1_

- [x] 9. Public testimonial submission page
  - Create `cohortle-web/src/app/testimonial/[token]/page.tsx`
    - Server component: call `validateCollectionLink(token)` to get cohort/programme info (or render error state for 404/410)
    - Pass data to `TestimonialSubmissionForm`
  - Create `cohortle-web/src/components/testimonial/TestimonialSubmissionForm.tsx`
    - Quote textarea (required, min 10 chars client-side)
    - Star rating selector (1–5, required)
    - Optional display name field (pre-filled from auth context if logged in)
    - Submit button → calls `submitTestimonial(token, ...)`
    - Success state: confirmation message
    - Error states: not enrolled (403), already submitted (409), link expired (410), link not found (404)
  - The page is public-facing but submission requires a learner JWT (redirect to login if unauthenticated)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.7_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The `testimonial_submissions` table acts as a deduplication guard and audit trail
- No schema changes are needed to the existing `testimonials` table
- The public submission page at `/testimonial/[token]` requires no changes to `middleware.ts` since it is intentionally public; only the submit API call requires a learner JWT
