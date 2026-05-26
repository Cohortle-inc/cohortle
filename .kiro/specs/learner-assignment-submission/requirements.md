# Learner Assignment Submission — Requirements

## Overview

Cohortle currently supports video, text, PDF, link, quiz, and live session lesson types. Assignments — where a learner submits written work or files for a convener to review and grade — are listed in the API Swagger enum but have zero implementation on the web platform. This spec covers the full end-to-end feature: convener creates an assignment lesson, learner submits a response, convener reviews and grades it.

## Requirements

### 1. Assignment Lesson Type — Convener Creation

**1.1** The convener lesson form MUST include `assignment` as a selectable content type alongside the existing types (video, pdf, link, text, live_session, quiz).

**1.2** When `assignment` is selected, the form MUST show assignment-specific fields:
- Instructions (rich text / textarea, required, max 5000 chars)
- Due date (optional date/time picker)
- Allow text answer (boolean toggle, default on)
- Allow file uploads (boolean toggle, default on)
- Max file size in MB (number, default 10, only shown when file uploads enabled)
- Allowed file types (multi-select: PDF, Word, Image, any; default: any)

**1.3** Assignment lessons MUST be saveable as draft or published, consistent with other lesson types.

**1.4** The convener MUST be able to edit assignment instructions and due date after creation.

**1.5** Assignment-specific fields MUST be stored as a JSON column `assignment_data` on `module_lessons`, following the same pattern as `quiz_data`.

### 2. Learner Submission — Web UI

**2.1** When a learner opens an assignment lesson, they MUST see:
- The assignment instructions rendered as formatted text
- Due date (if set), with a visual indicator if overdue
- Their current submission status (not submitted / submitted / graded)
- A submission form (if not yet submitted or if resubmission is allowed)

**2.2** The submission form MUST support:
- A text answer textarea (shown when `allow_text_answer` is true)
- File upload (shown when `allow_file_uploads` is true), accepting the configured file types, max size enforced client-side

**2.3** A learner MUST be able to save a draft submission (stored locally in browser storage) before final submission.

**2.4** On final submission, the learner MUST see a confirmation state and the submission MUST be persisted to the database.

**2.5** After submission, the learner MUST see their submitted content (read-only) and any feedback/grade from the convener.

**2.6** A submitted assignment MUST count as lesson completion for progress tracking purposes (consistent with quiz passing behaviour).

**2.7** The assignment lesson card in the week/module view MUST show a status badge: Not Started / Submitted / Graded.

### 3. Convener Grading — Web UI

**3.1** The convener programme page MUST include an "Assignments" tab or section showing all assignment lessons in the programme.

**3.2** For each assignment, the convener MUST see a list of enrolled learners with their submission status (not submitted / submitted / graded).

**3.3** The convener MUST be able to open a learner's submission and view:
- The text answer (if provided)
- Uploaded files with download links (if provided)
- Submission timestamp

**3.4** The convener MUST be able to grade a submission by selecting Pass or Fail and optionally adding written feedback.

**3.5** When a submission is graded, the learner MUST be able to see the grade and feedback on their assignment lesson page.

**3.6** The convener MUST be able to filter the submissions list by status (all / not submitted / submitted / graded).

### 4. API — Backend Routes

**4.1** `POST /v1/api/modules/:module_id/lessons` MUST accept `type: "assignment"` with an `assignment_data` JSON body field.

**4.2** `GET /v1/api/lessons/:lesson_id/assignment` MUST return the assignment details and the authenticated learner's current submission (if any).

**4.3** `POST /v1/api/lessons/:lesson_id/assignment/submit` MUST accept `{ text_answer, cohort_id }` and create or update a submission record. Requires learner auth.

**4.4** `POST /v1/api/lessons/:lesson_id/assignment/submit/files` MUST accept multipart file uploads attached to a submission. Requires learner auth.

**4.5** `GET /v1/api/lessons/:lesson_id/assignment/submissions` MUST return all submissions for a lesson (convener only, scoped to their programmes).

**4.6** `POST /v1/api/assignment-submissions/:submission_id/grade` MUST accept `{ status: "passed"|"failed", feedback }` and update the submission. Requires convener auth.

**4.7** All routes MUST enforce authentication. Learner routes MUST verify the learner is enrolled in the cohort. Convener routes MUST verify the lesson belongs to one of their programmes.

### 5. Database

**5.1** A migration MUST add `assignment_data` (JSON, nullable) to `module_lessons`.

**5.2** A migration MUST create an `assignment_submissions` table with columns:
- `id` (integer, PK, auto-increment)
- `lesson_id` (integer, FK → module_lessons)
- `user_id` (integer, FK → users)
- `cohort_id` (integer, FK → cohorts)
- `text_answer` (TEXT, nullable)
- `status` (ENUM: draft, submitted, graded; default: submitted)
- `grading_status` (ENUM: pending, passed, failed; default: pending)
- `feedback` (TEXT, nullable)
- `submitted_at` (DATETIME, nullable)
- `graded_at` (DATETIME, nullable)
- `created_at`, `updated_at` (timestamps)

**5.3** A migration MUST create an `assignment_submission_files` table with columns:
- `id` (integer, PK, auto-increment)
- `submission_id` (integer, FK → assignment_submissions)
- `file_name` (VARCHAR 255)
- `file_url` (TEXT)
- `file_type` (VARCHAR 100)
- `file_size` (integer, bytes)
- `uploaded_at` (DATETIME)

**5.4** Indexes MUST be added on `(lesson_id, user_id, cohort_id)` for fast per-learner lookups.

### 6. Access Control

**6.1** Only enrolled learners MAY submit to an assignment lesson.

**6.2** Only the convener who owns the programme MAY grade submissions.

**6.3** A learner MAY only view their own submission; they MUST NOT see other learners' submissions.

**6.4** Conveners MAY view all submissions for lessons in their programmes.

### 7. File Uploads

**7.1** File uploads MUST be handled via the existing Bunny Stream / storage infrastructure already used in the codebase, or a simple direct upload to a configured storage endpoint.

**7.2** File size MUST be validated server-side (reject files exceeding the assignment's configured max size).

**7.3** File type MUST be validated server-side against the assignment's allowed types.

**7.4** Uploaded file URLs MUST be stored in `assignment_submission_files` and returned to the learner for display.

### 8. Non-Functional

**8.1** The assignment submission UI MUST be accessible (WCAG 2.1 AA): proper labels, keyboard navigation, ARIA live regions for status updates.

**8.2** The submission form MUST show clear loading and error states.

**8.3** Draft saving MUST be debounced (500ms) to avoid excessive writes.
