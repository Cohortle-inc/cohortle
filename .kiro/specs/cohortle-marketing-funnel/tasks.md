# Implementation Plan: Cohortle Marketing Funnel

## Overview

Implement the full marketing funnel across `cohortle-web` (Next.js) and `cohortle-api` (Express), covering the database layer, API routes, email templates, and all frontend pages and components. Tasks are ordered so each step produces working, integrated code before moving to the next.

## Tasks

- [x] 1. Database migration and Sequelize model for funnel leads
  - Create `cohortle-api/migrations/YYYYMMDD-create-funnel-leads.js` with the `funnel_leads` table schema (UUID PK, all columns, indexes on `email` and `status`, idempotent `IF NOT EXISTS` guards)
  - Create `cohortle-api/models/funnel_leads.js` Sequelize model with all fields, enums, and `timestamps: true`
  - Register the model in `cohortle-api/models/index.js` (or equivalent model loader)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 2. FunnelService and API routes
  - [x] 2.1 Create `cohortle-api/services/FunnelService.js` with `createLead(payload)`, `getLeads()`, `updateStatus(id, status)`, and `triggerClosingEmail(id)` methods
    - `createLead` validates required fields, persists to `funnel_leads`, and calls `ResendService.sendEmail` with type `demo_booking_confirmation`
    - `updateStatus` validates the status enum and returns 404 if the lead does not exist
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.4, 8.5, 8.6_

  - [ ]* 2.2 Write property test: valid lead is persisted (Property 1)
    - **Property 1: Valid lead submission is persisted**
    - **Validates: Requirements 4.1, 4.2**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/leadPersistence.pbt.js`
    - Use fast-check to generate valid lead payloads; assert HTTP 201 and DB record matches

  - [ ]* 2.3 Write property test: invalid payloads are rejected (Property 2)
    - **Property 2: Invalid lead payloads are rejected**
    - **Validates: Requirements 4.3, 4.4**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/leadValidation.pbt.js`
    - Generate payloads with missing required fields or invalid emails; assert HTTP 400 and no DB record created

  - [x] 2.4 Create `cohortle-api/routes/funnel.js` with four endpoints:
    - `POST /v1/api/funnel/leads` — public, calls `FunnelService.createLead`
    - `GET /v1/api/funnel/leads` — admin auth required, calls `FunnelService.getLeads`
    - `PATCH /v1/api/funnel/leads/:id/status` — admin auth required, calls `FunnelService.updateStatus`
    - `POST /v1/api/funnel/leads/:id/close` — admin auth required, calls `FunnelService.triggerClosingEmail`
    - _Requirements: 4.1, 4.6, 8.1, 8.4_

  - [ ]* 2.5 Write property test: status transitions (Property 3)
    - **Property 3: Status transition validity**
    - **Validates: Requirements 8.4, 8.5**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/statusTransition.pbt.js`

  - [ ]* 2.6 Write property test: unknown lead ID returns 404 (Property 6)
    - **Property 6: Unknown lead ID returns 404**
    - **Validates: Requirements 8.6**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/leadNotFound.pbt.js`

  - [x] 2.7 Register `funnelRoutes(app)` in `cohortle-api/app.js`
    - _Requirements: 4.1_

- [x] 3. Checkpoint — Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Email templates for funnel
  - [x] 4.1 Add `demo_booking_confirmation` template to `cohortle-api/services/ResendService.js`
    - Template data: `{ first_name, organisation_name, demo_date, confirmation_url }`
    - HTML includes greeting with `first_name` and `organisation_name`, demo agenda (3 points), and confirmation link
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 4.2 Add `demo_follow_up` template to `ResendService.js`
    - Template data: `{ first_name, organisation_name, onboarding_url }`
    - HTML includes thank-you, next step, and onboarding link
    - _Requirements: 8.2, 8.3_

  - [x] 4.3 Add `demo_reminder` template to `ResendService.js` (optional, can be triggered manually)
    - _Requirements: 6.4_

  - [x] 4.4 Update the `type` validation enum in `cohortle-api/routes/email.js` to include `demo_booking_confirmation`, `demo_follow_up`, `demo_reminder`
    - _Requirements: 6.3_

  - [ ]* 4.5 Write property test: email template data integrity (Property 5)
    - **Property 5: Email template round-trip data integrity**
    - **Validates: Requirements 6.5, 8.3**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/emailTemplateIntegrity.pbt.js`
    - For any `{ first_name, organisation_name }`, rendered HTML must contain both values

  - [ ]* 4.6 Write property test: email triggered on lead creation (Property 4)
    - **Property 4: Email is triggered on lead creation**
    - **Validates: Requirements 6.1, 4.5**
    - File: `cohortle-api/__tests__/cohortle-marketing-funnel/emailTrigger.pbt.js`
    - Mock ResendService; assert called exactly once with `demo_booking_confirmation` for any valid lead

- [x] 5. Frontend API client
  - Create `cohortle-web/src/lib/api/funnel.ts` with `submitLead(payload)` function that POSTs to `/v1/api/funnel/leads` via the existing proxy client
  - _Requirements: 3.7_

- [ ] 6. Marketing homepage sections
  - [x] 6.1 Create `cohortle-web/src/components/marketing/HeroSection.tsx`
    - Headline (outcome-focused), subheadline (target audience), primary CTA "Apply to Partner with Cohortle" → `/apply`, secondary CTA "Book a Demo" → `/apply/form`
    - _Requirements: 1.1, 1.8, 1.9_

  - [x] 6.2 Create `cohortle-web/src/components/marketing/ProblemSection.tsx`
    - Four pain points: WhatsApp/spreadsheet chaos, lack of structure, poor progress tracking, difficulty scaling
    - _Requirements: 1.2_

  - [x] 6.3 Create `cohortle-web/src/components/marketing/SolutionSection.tsx`
    - Cohortle as structured system: programme design, cohort management, progress tracking, outcome delivery
    - _Requirements: 1.3_

  - [x] 6.4 Create `cohortle-web/src/components/marketing/UseCasesSection.tsx`
    - Four organisation type cards: fellowship programmes, NGO training, bootcamps, community-led programmes
    - _Requirements: 1.4_

  - [x] 6.5 Create `cohortle-web/src/components/marketing/HowItWorksSection.tsx`
    - Three numbered steps: Create Programme, Invite Participants, Track Progress & Outcomes
    - _Requirements: 1.5_

  - [x] 6.6 Create `cohortle-web/src/components/marketing/SocialProofSection.tsx`
    - WLIMP partner reference and testimonial placeholder
    - _Requirements: 1.6_

  - [x] 6.7 Create `cohortle-web/src/components/marketing/FinalCtaSection.tsx`
    - Repeat primary CTA "Apply to Partner with Cohortle"
    - _Requirements: 1.7_

  - [x] 6.8 Update `cohortle-web/src/app/page.tsx` to compose all marketing section components in order
    - _Requirements: 1.1–1.9_

- [ ] 7. Funnel layout and pre-form landing page
  - [x] 7.1 Create `cohortle-web/src/components/marketing/FunnelLayout.tsx`
    - Stripped layout with no main nav header; wraps `/apply` and `/apply/confirmation` pages
    - _Requirements: 2.3, 5.3_

  - [x] 7.2 Create `cohortle-web/src/app/apply/page.tsx`
    - Uses `FunnelLayout`; displays headline, who it's for, what they get, 3-step process summary, and "Continue to Application" CTA → `/apply/form`
    - _Requirements: 2.1, 2.2_

- [ ] 8. Interest form page
  - [x] 8.1 Create `cohortle-web/src/components/funnel/FormSection.tsx`
    - Reusable labelled section wrapper with title and children
    - _Requirements: 3.1_

  - [x] 8.2 Create `cohortle-web/src/components/funnel/CalendlyEmbed.tsx`
    - Iframe wrapper for Calendly URL (read from env var `NEXT_PUBLIC_CALENDLY_URL`); fallback message if iframe fails to load
    - _Requirements: 3.6_

  - [x] 8.3 Create `cohortle-web/src/components/funnel/InterestForm.tsx`
    - Five sections: Basic Info (org name, contact name, email, phone, website), Programme Info (type select, participant count, current tools), Pain Points (textarea), Readiness (text/date), Demo Scheduling (CalendlyEmbed)
    - Client-side validation: required fields show inline errors on submit; form does not submit if Calendly slot not selected
    - On success: calls `submitLead`, sets sessionStorage flag `funnel_submitted=true`, redirects to `/apply/confirmation`
    - On API error: shows top-level error banner
    - _Requirements: 3.1–3.10_

  - [x] 8.4 Create `cohortle-web/src/app/apply/form/page.tsx`
    - Uses `FunnelLayout`; renders `InterestForm`
    - _Requirements: 3.1_

- [x] 9. Confirmation page
  - Create `cohortle-web/src/app/apply/confirmation/page.tsx`
    - Uses `FunnelLayout`
    - Reads `funnel_submitted` from sessionStorage; if absent, redirects to `/apply`
    - Displays confirmation message, demo date/time (from sessionStorage or query param), and preparation checklist (3 items)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Demo guide page (internal)
  - Create `cohortle-web/src/app/internal/demo-guide/page.tsx`
    - Protected by existing auth middleware — redirect to `/login` if unauthenticated or role is not `convener`/`admin`
    - Displays five-step demo script with suggested questions per step
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use **fast-check** with a minimum of 100 iterations
- The Calendly URL should be stored in `NEXT_PUBLIC_CALENDLY_URL` environment variable
- The `/apply` pages use `FunnelLayout` (no nav) to keep the funnel focused
- Admin-protected API endpoints reuse the existing `TokenMiddleware` + role check pattern from `cohortle-api/middleware/`
