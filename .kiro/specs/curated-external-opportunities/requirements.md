# Curated External Opportunities — Requirements

## Overview

Learners on Cohortle are participants in structured programmes — fellowships, accelerators, capacity-building initiatives. These programmes often have a natural next step: applying for a grant, joining a fellowship, attending an event, or taking up a job opportunity. Currently there is no mechanism for conveners to surface relevant external opportunities to their learners.

This spec covers a curated opportunities board where conveners can post external links (jobs, grants, fellowships, events, scholarships, competitions) relevant to their cohort, and learners can browse and act on them from their dashboard.

---

## Requirements

### 1. Opportunity Model

**1.1** An opportunity MUST have the following fields:
- Title (VARCHAR 255, required)
- Description (TEXT, required, max 2000 chars)
- Type (ENUM: job, grant, fellowship, scholarship, event, competition, other; required)
- External URL (TEXT, required, must be a valid URL)
- Organisation / Source name (VARCHAR 255, optional — e.g. "Tony Elumelu Foundation")
- Deadline (DATE, optional)
- Location (VARCHAR 255, optional — e.g. "Remote", "Lagos, Nigeria")
- is_active (BOOLEAN, default true)
- created_by (FK → users)
- created_at, updated_at (timestamps)

**1.2** An opportunity MUST be scoped to either:
- A specific programme (visible only to learners enrolled in that programme), OR
- The entire platform (visible to all authenticated learners — admin-posted only)

**1.3** The scoping MUST be captured as:
- `scope` (ENUM: programme, platform)
- `programme_id` (FK → programmes, nullable — required when scope is `programme`)

---

### 2. Convener — Creating & Managing Opportunities

**2.1** A convener MUST be able to create an opportunity from within their programme management area (e.g. a new "Opportunities" tab on the programme detail page).

**2.2** The opportunity creation form MUST include all fields listed in requirement 1.1, with the scope fixed to `programme` and the `programme_id` pre-set to the current programme.

**2.3** A convener MUST only be able to create, edit, and delete opportunities for programmes they own.

**2.4** A convener MUST be able to mark an opportunity as inactive (is_active = false) to hide it from learners without deleting it.

**2.5** The convener opportunities list MUST show all opportunities for their programme with status indicators (active / inactive / deadline passed).

**2.6** A convener MUST be able to edit any field on an opportunity after creation.

**2.7** A convener MUST be able to delete an opportunity, with a confirmation prompt before deletion.

---

### 3. Admin — Platform-Wide Opportunities

**3.1** An admin MUST be able to create platform-scoped opportunities visible to all learners across all programmes.

**3.2** The admin dashboard MUST include an "Opportunities" section for managing platform-level opportunities.

**3.3** Admin-created opportunities MUST behave identically to programme-scoped ones in terms of fields, status, and display — except they are not tied to a programme.

---

### 4. Learner — Viewing Opportunities

**4.1** Authenticated learners MUST be able to access an "Opportunities" page (e.g. `/opportunities` or as a section in the dashboard).

**4.2** The opportunities page MUST show:
- All active opportunities from programmes the learner is enrolled in
- All active platform-scoped opportunities

**4.3** Opportunities MUST be displayed as cards showing: title, type badge, organisation/source (if set), deadline (if set, with a visual "closing soon" indicator for deadlines within 7 days), location, and a short excerpt of the description.

**4.4** Clicking an opportunity card MUST show a detail view with the full description and a clearly labelled "Apply / Learn More" button that opens the external URL in a new tab.

**4.5** Opportunities MUST be sorted by: deadline ascending (opportunities with no deadline appearing last), then creation date descending.

**4.6** Learners MUST be able to filter the list by type (all / job / grant / fellowship / scholarship / event / competition / other).

**4.7** Expired opportunities (deadline is in the past) MUST be hidden from the learner view by default. An optional toggle MAY be provided to show past opportunities.

**4.8** If the learner has no relevant active opportunities, an informative empty state MUST be displayed (not a blank page).

---

### 5. Learner — Saving Opportunities

**5.1** A learner MUST be able to save (bookmark) an opportunity for later reference.

**5.2** Saved opportunities MUST be accessible from a "Saved" filter or tab on the opportunities page.

**5.3** A learner MUST be able to unsave an opportunity.

**5.4** Saved state MUST persist across sessions.

---

### 6. API — Backend Routes

**6.1** `POST /v1/api/programmes/:programme_id/opportunities` — Create an opportunity for a programme. Requires convener auth and programme ownership.

**6.2** `GET /v1/api/programmes/:programme_id/opportunities` — List all opportunities for a programme. Requires convener auth and programme ownership (returns active + inactive).

**6.3** `PUT /v1/api/opportunities/:id` — Update an opportunity. Requires convener auth and ownership, OR admin auth.

**6.4** `DELETE /v1/api/opportunities/:id` — Delete an opportunity. Requires convener auth and ownership, OR admin auth.

**6.5** `PATCH /v1/api/opportunities/:id/status` — Toggle is_active. Accepts `{ is_active: boolean }`. Requires convener auth and ownership, OR admin auth.

**6.6** `GET /v1/api/opportunities` — Fetch all active opportunities visible to the authenticated learner (programme-scoped from their enrolments + platform-scoped). Supports query params: `type`, `include_expired`.

**6.7** `POST /v1/api/opportunities/:id/save` — Save an opportunity for the authenticated learner.

**6.8** `DELETE /v1/api/opportunities/:id/save` — Remove a saved opportunity for the authenticated learner.

**6.9** `GET /v1/api/opportunities/saved` — Fetch the authenticated learner's saved opportunities.

**6.10** `POST /v1/api/admin/opportunities` — Create a platform-scoped opportunity. Requires admin auth.

**6.11** `GET /v1/api/admin/opportunities` — List all platform-scoped opportunities. Requires admin auth.

**6.12** All routes MUST enforce authentication. Learner routes MUST return only opportunities the learner is authorised to see.

---

### 7. Database

**7.1** A migration MUST create an `opportunities` table with columns:
- `id` (integer, PK, auto-increment)
- `title` (VARCHAR 255, not null)
- `description` (TEXT, not null)
- `type` (ENUM: job, grant, fellowship, scholarship, event, competition, other; not null)
- `external_url` (TEXT, not null)
- `source_name` (VARCHAR 255, nullable)
- `deadline` (DATE, nullable)
- `location` (VARCHAR 255, nullable)
- `scope` (ENUM: programme, platform; not null, default: programme)
- `programme_id` (integer, FK → programmes, nullable)
- `is_active` (BOOLEAN, not null, default: true)
- `created_by` (integer, FK → users, not null)
- `created_at`, `updated_at` (timestamps)

**7.2** A migration MUST create a `saved_opportunities` table with columns:
- `id` (integer, PK, auto-increment)
- `user_id` (integer, FK → users, not null)
- `opportunity_id` (integer, FK → opportunities, not null)
- `created_at` (timestamp)
- UNIQUE constraint on `(user_id, opportunity_id)`

**7.3** Indexes MUST be added on:
- `opportunities.programme_id`
- `opportunities.scope`
- `opportunities.is_active`
- `opportunities.deadline`
- `saved_opportunities.user_id`

---

### 8. Access Control

**8.1** Learners MUST only see programme-scoped opportunities for programmes they are actively enrolled in.

**8.2** Conveners MUST only manage opportunities for programmes they created.

**8.3** Admins MAY create, edit, and delete any opportunity (programme-scoped or platform).

**8.4** Unauthenticated users MUST NOT be able to access any opportunity data.

---

### 9. Non-Functional

**9.1** The opportunities page MUST be responsive and render correctly on mobile.

**9.2** The UI MUST be accessible (WCAG 2.1 AA): all interactive elements keyboard-navigable, type badges have sufficient colour contrast, external links clearly labelled.

**9.3** External URLs MUST be validated server-side (must begin with `https://`).

**9.4** The description field MUST be sanitised on output to prevent XSS, consistent with the existing sanitise utility (`cohortle-web/src/lib/utils/sanitize.ts`).

**9.5** The opportunities list MUST load with a skeleton loader while fetching, and display a clear error state on failure.
