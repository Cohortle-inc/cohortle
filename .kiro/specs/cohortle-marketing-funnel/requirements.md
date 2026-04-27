# Requirements Document

## Introduction

The Cohortle Marketing Funnel is a full-funnel web experience designed to attract, qualify, and convert organisations (NGOs, fellowship programmes, training institutions, community-led programmes) into demo bookings and early partners. The funnel spans seven stages: a homepage, a pre-form landing page, an interest form with demo booking, a confirmation page, automated email follow-ups, a demo experience guide, and a post-demo closing flow. It integrates with the existing Next.js (App Router) frontend in `cohortle-web/` and the Node.js/Express API in `cohortle-api/`, using the existing Resend email service for all transactional and follow-up emails.

## Glossary

- **Funnel**: The end-to-end sequence of pages and touchpoints that moves a visitor from awareness to partnership.
- **Lead**: An organisation that has submitted the interest form and booked a demo.
- **Demo_Booking**: A scheduled video call between a Cohortle team member and a qualified lead.
- **Interest_Form**: The multi-section qualification form that collects organisation details, programme context, pain points, and a demo time slot.
- **Confirmation_Page**: The page shown immediately after a successful form submission and demo booking.
- **Follow_Up_Email**: An automated email sent via Resend after a demo is booked.
- **Closing_Flow**: The post-demo sequence of emails and next-step guidance that converts a demo attendee into an onboarding partner.
- **Funnel_API**: The new Express route module (`cohortle-api/routes/funnel.js`) that handles lead storage and email triggers.
- **Lead_Store**: The database table (`funnel_leads`) that persists submitted interest form data.
- **Resend_Service**: The existing `ResendService` in `cohortle-api/services/ResendService.js`.

---

## Requirements

### Requirement 1: Homepage — Value Communication and Primary CTA

**User Story:** As a potential partner visiting the Cohortle website, I want to immediately understand what Cohortle does and who it is for, so that I can decide whether to apply.

#### Acceptance Criteria

1. WHEN a visitor loads the homepage (`/`), THE Homepage SHALL display a hero section containing a headline focused on outcomes, a subheadline identifying the target audience, a primary CTA button labelled "Apply to Partner with Cohortle", and a secondary CTA button labelled "Book a Demo".
2. THE Homepage SHALL display a problem section that names at least four specific pain points: managing programmes via WhatsApp or spreadsheets, lack of programme structure, poor participant progress tracking, and difficulty scaling programmes.
3. THE Homepage SHALL display a solution section that presents Cohortle as a structured system covering programme design, cohort management, progress tracking, and outcome delivery.
4. THE Homepage SHALL display a use-cases section listing at least four organisation types: fellowship programmes, NGO training programmes, bootcamps, and community-led programmes.
5. THE Homepage SHALL display a "How It Works" section with exactly three numbered steps: Create Programme, Invite Participants, and Track Progress & Outcomes.
6. THE Homepage SHALL display a social proof section referencing at least one early partner (WLIMP) and a placeholder for testimonials.
7. THE Homepage SHALL display a final CTA section that repeats the primary "Apply to Partner with Cohortle" call to action.
8. WHEN a visitor clicks the primary CTA, THE Homepage SHALL navigate the visitor to the pre-form landing page (`/apply`).
9. WHEN a visitor clicks the secondary CTA, THE Homepage SHALL navigate the visitor to the interest form page (`/apply/form`).

---

### Requirement 2: Pre-Form Landing Page — Qualification Framing

**User Story:** As a potential partner, I want to understand exactly what applying means and what happens next, so that I feel confident continuing to the form.

#### Acceptance Criteria

1. WHEN a visitor loads `/apply`, THE Pre_Form_Page SHALL display a headline, a description of who Cohortle is for, a list of what the applicant will receive, and a three-step process summary (Submit Form → Review → Demo Session).
2. THE Pre_Form_Page SHALL display a single CTA button labelled "Continue to Application" that navigates to `/apply/form`.
3. THE Pre_Form_Page SHALL NOT display the main site navigation header, so that the visitor remains focused on the funnel.

---

### Requirement 3: Interest Form — Lead Qualification and Demo Booking

**User Story:** As a potential partner, I want to submit my organisation's details and book a demo in one flow, so that I can secure a time to learn more about Cohortle.

#### Acceptance Criteria

1. WHEN a visitor loads `/apply/form`, THE Interest_Form SHALL display five sections: Basic Info, Programme Info, Pain Points, Readiness, and Demo Scheduling.
2. THE Interest_Form SHALL require the following Basic Info fields: organisation name, contact person full name, email address, phone number, and website or social media link.
3. THE Interest_Form SHALL require the following Programme Info fields: programme type (fellowship, training, bootcamp, community, or other), estimated number of participants, and current tools used.
4. THE Interest_Form SHALL include an open-text Pain Points field labelled "What challenges are you currently facing with your programme?".
5. THE Interest_Form SHALL include a Readiness field asking "When is your next cohort starting?" accepting a date or free-text response.
6. THE Interest_Form SHALL embed a Calendly widget (or equivalent iframe-based scheduler) in the Demo Scheduling section so the visitor can select a demo time slot without leaving the page.
7. WHEN a visitor submits the form with all required fields completed and a demo slot selected, THE Interest_Form SHALL POST the lead data to `POST /v1/api/funnel/leads`.
8. IF a visitor submits the form with one or more required fields missing, THEN THE Interest_Form SHALL display inline validation errors identifying each missing field and SHALL NOT submit the form.
9. IF a visitor submits the form without selecting a demo slot, THEN THE Interest_Form SHALL display an error message prompting the visitor to select a time and SHALL NOT submit the form.
10. WHEN the API returns a success response, THE Interest_Form SHALL redirect the visitor to `/apply/confirmation`.

---

### Requirement 4: Backend — Lead Storage

**User Story:** As a Cohortle team member, I want all submitted interest form data to be stored in the database, so that I can review leads before and after demo calls.

#### Acceptance Criteria

1. THE Funnel_API SHALL expose `POST /v1/api/funnel/leads` that accepts a JSON body containing organisation name, contact name, email, phone, website, programme type, participant count, current tools, pain points, cohort start date, and demo scheduled time.
2. WHEN a valid lead payload is received, THE Funnel_API SHALL persist the lead to the Lead_Store and return HTTP 201 with the created lead's ID.
3. IF the lead payload is missing any required field (organisation name, contact name, email, programme type), THEN THE Funnel_API SHALL return HTTP 400 with a descriptive error message.
4. IF the email field contains an invalid email address, THEN THE Funnel_API SHALL return HTTP 400 with a descriptive error message.
5. WHEN a lead is successfully stored, THE Funnel_API SHALL trigger the booking confirmation email sequence via the Resend_Service.
6. THE Funnel_API SHALL expose `GET /v1/api/funnel/leads` protected by admin authentication, returning all stored leads ordered by creation date descending.

---

### Requirement 5: Confirmation Page

**User Story:** As a potential partner who has just booked a demo, I want to see a clear confirmation with the demo details, so that I feel confident the booking was received.

#### Acceptance Criteria

1. WHEN a visitor loads `/apply/confirmation`, THE Confirmation_Page SHALL display a confirmation message, the booked demo date and time (passed via query parameter or session), and a summary of what to expect during the demo.
2. THE Confirmation_Page SHALL display a list of at least three things the visitor should prepare before the demo: a description of their current programme, their biggest operational challenge, and their goals for the next cohort.
3. THE Confirmation_Page SHALL NOT display the main site navigation header.
4. IF a visitor navigates directly to `/apply/confirmation` without a prior form submission, THE Confirmation_Page SHALL redirect the visitor to `/apply`.

---

### Requirement 6: Email Follow-Up — Booking Confirmation and Reminder

**User Story:** As a potential partner who has booked a demo, I want to receive an immediate confirmation email with the demo agenda, so that I know what to expect and am less likely to miss the call.

#### Acceptance Criteria

1. WHEN a lead is successfully stored, THE Resend_Service SHALL send a booking confirmation email to the lead's email address within 60 seconds.
2. THE booking confirmation email SHALL include: the demo date and time, a three-point demo agenda (Understand your programme, Walk through Cohortle, Define next steps), and a link back to the confirmation page.
3. THE Resend_Service SHALL support a new email type `demo_booking_confirmation` with a dedicated HTML template.
4. WHERE an optional reminder email is configured, THE Resend_Service SHALL support a `demo_reminder` email type that can be triggered manually or via a scheduled job.
5. THE `demo_booking_confirmation` email template SHALL include the organisation name and contact person's first name in the greeting.

---

### Requirement 7: Demo Experience — Structured Guide

**User Story:** As a Cohortle team member running a demo, I want a structured guide page, so that I can consistently deliver a high-quality demo experience.

#### Acceptance Criteria

1. THE Demo_Guide_Page at `/internal/demo-guide` SHALL be accessible only to authenticated users with the `convener` or `admin` role.
2. THE Demo_Guide_Page SHALL display a five-step demo script: Understand Their Programme, Show How Cohortle Fits, Walk Through the Platform, Position Benefits, and Invite Partnership.
3. THE Demo_Guide_Page SHALL display suggested questions for each step.
4. WHEN an unauthenticated user attempts to access `/internal/demo-guide`, THE Demo_Guide_Page SHALL redirect the user to `/login`.

---

### Requirement 8: Closing Flow — Post-Demo Conversion

**User Story:** As a Cohortle team member, I want to send a structured post-demo follow-up email to a lead, so that I can convert demo attendees into onboarding partners.

#### Acceptance Criteria

1. THE Funnel_API SHALL expose `POST /v1/api/funnel/leads/:id/close` protected by admin authentication, which triggers the closing follow-up email to the lead.
2. WHEN the closing endpoint is called, THE Resend_Service SHALL send a `demo_follow_up` email to the lead containing: a thank-you message, a clear next step (start onboarding or pilot programme setup), and a link to begin onboarding.
3. THE `demo_follow_up` email template SHALL include the organisation name and contact person's first name.
4. THE Funnel_API SHALL expose `PATCH /v1/api/funnel/leads/:id/status` protected by admin authentication, accepting a status value of `new`, `contacted`, `demo_scheduled`, `demo_completed`, or `partner`, and updating the lead record accordingly.
5. WHEN a lead status is updated, THE Funnel_API SHALL return HTTP 200 with the updated lead record.
6. IF a lead ID does not exist, THEN THE Funnel_API SHALL return HTTP 404.

---

### Requirement 9: Database — Lead Store Schema

**User Story:** As a developer, I want a well-structured database migration for the funnel leads table, so that lead data is stored reliably and queryable.

#### Acceptance Criteria

1. THE Lead_Store migration SHALL create a `funnel_leads` table with columns: `id` (UUID primary key), `organisation_name` (string, not null), `contact_name` (string, not null), `email` (string, not null), `phone` (string), `website` (string), `programme_type` (enum: fellowship, training, bootcamp, community, other), `participant_count` (integer), `current_tools` (text), `pain_points` (text), `cohort_start_date` (string), `demo_scheduled_at` (timestamp), `status` (enum: new, contacted, demo_scheduled, demo_completed, partner, default: new), `created_at` (timestamp), `updated_at` (timestamp).
2. THE Lead_Store migration SHALL be idempotent — running it twice SHALL NOT produce an error.
3. THE Lead_Store migration SHALL create an index on the `email` column.
4. THE Lead_Store migration SHALL create an index on the `status` column.
