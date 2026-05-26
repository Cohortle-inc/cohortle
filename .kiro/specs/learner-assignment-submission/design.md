# Learner Assignment Submission — Design

## Architecture Overview

The assignment feature follows the same layered pattern as the quiz system already in the codebase:

```
DB migrations
  └── module_lessons (add assignment_data column)
  └── assignment_submissions (new table)
  └── assignment_submission_files (new table)

cohortle-api
  ├── models/
  │   ├── assignment_submissions.js
  │   └── assignment_submission_files.js
  ├── services/
  │   └── AssignmentService.js
  └── routes/
      └── assignment.js  (mounted in app.js)

cohortle-web
  ├── src/lib/api/
  │   └── assignments.ts
  ├── src/lib/hooks/
  │   └── useAssignment.ts
  ├── src/components/lessons/
  │   └── AssignmentLessonContent.tsx
  ├── src/components/convener/
  │   └── AssignmentSubmissionsView.tsx
  │   └── AssignmentGradeModal.tsx
  └── src/components/learning/
      └── LessonContentRenderer.tsx  (add 'assignment' case)
```

---

## Database Design

### Migration 1 — Add `assignment_data` to `module_lessons`

```sql
ALTER TABLE module_lessons
  ADD COLUMN assignment_data JSON NULL AFTER quiz_data;
```

`assignment_data` shape:
```json
{
  "instructions": "Write a 500-word reflection on...",
  "due_date": "2026-06-15T23:59:00Z",
  "allow_text_answer": true,
  "allow_file_uploads": true,
  "max_file_size_mb": 10,
  "allowed_file_types": ["pdf", "doc", "docx", "image"]
}
```

### Migration 2 — `assignment_submissions` table

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| lesson_id | INT FK → module_lessons | CASCADE delete |
| user_id | INT FK → users | CASCADE delete |
| cohort_id | INT FK → cohorts | CASCADE delete |
| text_answer | TEXT NULL | |
| status | ENUM('submitted','graded') | default 'submitted' |
| grading_status | ENUM('pending','passed','failed') | default 'pending' |
| feedback | TEXT NULL | |
| submitted_at | DATETIME | |
| graded_at | DATETIME NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

Unique constraint: `(lesson_id, user_id, cohort_id)` — one submission per learner per lesson per cohort. Upsert on re-submit.

### Migration 3 — `assignment_submission_files` table

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| submission_id | INT FK → assignment_submissions | CASCADE delete |
| file_name | VARCHAR(255) | |
| file_url | TEXT | |
| file_type | VARCHAR(100) | |
| file_size | INT | bytes |
| uploaded_at | DATETIME | |

---

## API Design

All routes are mounted under `/v1/api` in `app.js`.

### GET `/v1/api/lessons/:lesson_id/assignment`
Auth: learner (enrolled in cohort)

Returns assignment details + learner's own submission:
```json
{
  "lesson_id": 42,
  "assignment_data": { "instructions": "...", "due_date": "...", ... },
  "submission": {
    "id": 7,
    "status": "graded",
    "grading_status": "passed",
    "text_answer": "My reflection...",
    "feedback": "Great work!",
    "submitted_at": "2026-06-10T14:00:00Z",
    "graded_at": "2026-06-11T09:00:00Z",
    "files": [{ "id": 1, "file_name": "essay.pdf", "file_url": "https://...", "file_size": 204800 }]
  }
}
```
`submission` is `null` if not yet submitted.

### POST `/v1/api/lessons/:lesson_id/assignment/submit`
Auth: learner (enrolled in cohort)

Body: `{ cohort_id, text_answer? }`

Creates or updates (upsert) the submission. Returns the submission object.

On success: marks lesson complete via `ProgressService.markLessonComplete`, triggers streak + achievement recalculation (same pattern as QuizService).

### POST `/v1/api/lessons/:lesson_id/assignment/submit/files`
Auth: learner (enrolled in cohort)

Multipart form: `cohort_id` + file(s). Uses existing `upload` middleware from `bunnyStream` config.

Validates file size and type against `assignment_data` settings. Stores file records in `assignment_submission_files`.

### GET `/v1/api/lessons/:lesson_id/assignment/submissions`
Auth: convener (owns programme)

Returns all submissions for the lesson with learner info and files:
```json
[
  {
    "submission_id": 7,
    "learner_id": 12,
    "learner_name": "Jane Smith",
    "learner_email": "jane@example.com",
    "status": "graded",
    "grading_status": "passed",
    "submitted_at": "2026-06-10T14:00:00Z",
    "graded_at": "2026-06-11T09:00:00Z",
    "text_answer": "...",
    "files": [...]
  }
]
```

### POST `/v1/api/assignment-submissions/:submission_id/grade`
Auth: convener (owns programme via lesson ownership check)

Body: `{ status: "passed" | "failed", feedback? }`

Updates `grading_status`, `feedback`, `graded_at`. Sets `status` to `"graded"`.

---

## Service Design — `AssignmentService.js`

Mirrors `QuizService.js` structure:

```javascript
class AssignmentService {
  validateAssignmentData(data)       // validates instructions, due_date, toggles
  async getAssignmentForLearner(lessonId, userId, cohortId)
  async submitAssignment(userId, lessonId, cohortId, textAnswer)
  async attachFiles(submissionId, files)
  async getSubmissionsForLesson(lessonId, convenerUserId)
  async gradeSubmission(submissionId, convenerUserId, gradingStatus, feedback)
}
```

Key behaviours:
- `submitAssignment` uses INSERT ... ON DUPLICATE KEY UPDATE for idempotency
- After successful submit: calls `ProgressService.markLessonComplete`, `StreakService.recalculateStreak`, `AchievementService.evaluateAchievements`
- `gradeSubmission` verifies convener ownership via the same SQL join pattern used in `QuizService.getResultsForLesson`

---

## Frontend Design

### `AssignmentLessonContent.tsx`

The learner-facing component. Rendered by `LessonContentRenderer` when `type === 'assignment'`.

States:
1. **Loading** — skeleton while fetching assignment + submission
2. **Not submitted** — shows instructions, due date, submission form
3. **Submitted (pending grading)** — shows submitted content read-only, "Awaiting feedback" badge
4. **Graded** — shows submitted content + grade badge (Pass/Fail) + feedback

Submission form sections (conditional on `assignment_data` toggles):
- Text answer: `<textarea>` with character count, auto-saves draft to `localStorage`
- File upload: drag-and-drop zone + file list with remove buttons, client-side size/type validation

Draft auto-save: debounced 500ms write to `localStorage` key `assignment_draft_{lessonId}_{userId}`. Cleared on successful submission.

### `LessonContentRenderer.tsx` change

Add `'assignment'` to the type union and a new case:
```tsx
case 'assignment':
  return (
    <AssignmentLessonContent
      lessonId={lessonId}
      cohortId={cohortId}
      title={title}
    />
  );
```

The component fetches its own data internally (same pattern as `QuizLessonContent`).

### `LessonForm.tsx` change

Add `assignment` to the content type dropdown:
```tsx
{ value: 'assignment', label: 'Assignment', icon: '📋' }
```

When selected, render `AssignmentDataEditor` — a sub-form with the fields from Requirement 1.2. The editor's output is stored in a `assignmentData` state variable and passed to `onSubmit` as `assignment_data`.

### `AssignmentSubmissionsView.tsx`

Convener component. Shown as a tab on the lesson detail page (or accessible from the programme page).

- Table: learner name, email, status badge, submitted at, actions
- Filter bar: All / Not Submitted / Submitted / Graded
- Row action: "Review" → opens `AssignmentGradeModal`

### `AssignmentGradeModal.tsx`

Modal showing:
- Learner name + submission timestamp
- Text answer (scrollable)
- File list with download links
- Grade selector: Pass / Fail radio
- Feedback textarea (optional)
- Submit button → calls grade API → updates table row optimistically

### `useAssignment.ts` hook

```typescript
function useAssignment(lessonId: string, cohortId: string) {
  // fetches GET /lessons/:id/assignment
  // returns { assignment, submission, isLoading, error, submit, submitFiles }
}
```

---

## `LessonForm.tsx` — Assignment Data Editor

The `AssignmentDataEditor` sub-component renders inside `LessonForm` when type is `assignment`:

```
┌─────────────────────────────────────────────┐
│ Instructions *                               │
│ ┌─────────────────────────────────────────┐ │
│ │ <textarea rows=6>                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Due Date (optional)  [date/time picker]     │
│                                             │
│ ☑ Allow text answer                         │
│ ☑ Allow file uploads                        │
│   Max file size: [10] MB                    │
│   Allowed types: [PDF] [Word] [Image] [Any] │
└─────────────────────────────────────────────┘
```

---

## Status Badge Design

Consistent with existing badge patterns in the codebase:

| Status | Colour | Label |
|---|---|---|
| Not started | Grey | Not Started |
| Submitted | Blue | Submitted |
| Graded — Pass | Green | Passed |
| Graded — Fail | Red | Needs Revision |

---

## File Upload Strategy

For MVP, file uploads use the existing `upload` middleware from `cohortle-api/config/bunnyStream.js`. Files are uploaded to Bunny Stream storage and the returned URL is stored in `assignment_submission_files.file_url`.

If Bunny Stream is not appropriate for document files (it's primarily for video), the fallback is to store files as base64 in the DB or use a simple local disk upload — this is a deployment decision, not a code architecture decision. The service layer abstracts this.

---

## Completion Tracking Integration

Assignment submission triggers the same side-effect chain as a passing quiz attempt:

```
submitAssignment()
  → ProgressService.markLessonComplete(userId, lessonId, cohortId)
  → StreakService.recalculateStreak(userId)
  → AchievementService.evaluateAchievements(userId)
```

This means submitting an assignment counts toward streak and achievement progress, consistent with other lesson types.

---

## Error Handling

| Scenario | HTTP Status | Message |
|---|---|---|
| Lesson not found | 404 | "Lesson not found" |
| Not an assignment lesson | 400 | "Lesson is not an assignment" |
| Learner not enrolled | 403 | "You are not enrolled in this cohort" |
| File too large | 400 | "File exceeds maximum size of X MB" |
| Invalid file type | 400 | "File type not allowed for this assignment" |
| Submission not found (grade) | 404 | "Submission not found" |
| Convener doesn't own lesson | 403 | "Access denied" |
