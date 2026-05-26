# Learner Assignment Submission — Tasks

## Task 1: Database Migrations

### 1.1 Add `assignment_data` column to `module_lessons`
- [ ] Create migration `20260527000000-add-assignment-data-to-module-lessons.js`
- [ ] Add `assignment_data` JSON column (nullable) to `module_lessons`
- [ ] Migration must be idempotent (check column exists before adding)

### 1.2 Create `assignment_submissions` table
- [ ] Create migration `20260527000001-create-assignment-submissions.js`
- [ ] Columns: id, lesson_id (FK), user_id (FK), cohort_id (FK), text_answer, status ENUM, grading_status ENUM, feedback, submitted_at, graded_at, created_at, updated_at
- [ ] Add unique index on `(lesson_id, user_id, cohort_id)`
- [ ] Add indexes on lesson_id, user_id
- [ ] Migration must be idempotent

### 1.3 Create `assignment_submission_files` table
- [ ] Create migration `20260527000002-create-assignment-submission-files.js`
- [ ] Columns: id, submission_id (FK → assignment_submissions CASCADE), file_name, file_url, file_type, file_size, uploaded_at
- [ ] Migration must be idempotent

---

## Task 2: Backend Models

### 2.1 Create `assignment_submissions` Sequelize model
- [ ] Create `cohortle-api/models/assignment_submissions.js`
- [ ] Define all columns matching the migration
- [ ] Set `timestamps: true, underscored: true`

### 2.2 Create `assignment_submission_files` Sequelize model
- [ ] Create `cohortle-api/models/assignment_submission_files.js`
- [ ] Define all columns matching the migration
- [ ] Set `timestamps: false` (uses `uploaded_at` directly)

---

## Task 3: `AssignmentService.js`

### 3.1 Create `cohortle-api/services/AssignmentService.js`
- [ ] Implement `validateAssignmentData(data)` — validates instructions (required, string), due_date (optional, ISO date string), allow_text_answer (boolean), allow_file_uploads (boolean), max_file_size_mb (positive integer), allowed_file_types (array)
- [ ] Implement `async getAssignmentForLearner(lessonId, userId, cohortId)` — fetches lesson, verifies type is 'assignment', fetches submission + files for this learner
- [ ] Implement `async submitAssignment(userId, lessonId, cohortId, textAnswer)` — upserts submission record, calls ProgressService/StreakService/AchievementService on success
- [ ] Implement `async attachFiles(submissionId, files)` — inserts file records into assignment_submission_files
- [ ] Implement `async getSubmissionsForLesson(lessonId, convenerUserId)` — verifies ownership, returns all submissions with learner info and files
- [ ] Implement `async gradeSubmission(submissionId, convenerUserId, gradingStatus, feedback)` — verifies ownership, updates submission

---

## Task 4: API Routes

### 4.1 Create `cohortle-api/routes/assignment.js`
- [ ] `GET /v1/api/lessons/:lesson_id/assignment` — learner auth, returns assignment + own submission
- [ ] `POST /v1/api/lessons/:lesson_id/assignment/submit` — learner auth, body: `{ cohort_id, text_answer? }`
- [ ] `POST /v1/api/lessons/:lesson_id/assignment/submit/files` — learner auth, multipart, body: `cohort_id` + files
- [ ] `GET /v1/api/lessons/:lesson_id/assignment/submissions` — convener auth, returns all submissions
- [ ] `POST /v1/api/assignment-submissions/:submission_id/grade` — convener auth, body: `{ status, feedback? }`
- [ ] All routes use `TokenMiddleware` and `multiLevelAccessControl` consistent with existing routes

### 4.2 Register routes in `cohortle-api/app.js`
- [ ] Add `require('./routes/assignment')(app)` in app.js alongside other route registrations

---

## Task 5: Convener Lesson Form — Assignment Type

### 5.1 Add `assignment` to `LessonForm.tsx` content type dropdown
- [ ] Add `{ value: 'assignment', label: 'Assignment', icon: '📋' }` to the types map in `getContentTypeInfo`
- [ ] Add `assignment` to the dropdown options rendered in the form

### 5.2 Create `AssignmentDataEditor` sub-component (inline in `LessonForm.tsx` or separate file)
- [ ] Instructions textarea (required, max 5000 chars, character counter)
- [ ] Due date datetime-local input (optional)
- [ ] Allow text answer toggle (default: true)
- [ ] Allow file uploads toggle (default: true)
- [ ] Max file size input (shown when file uploads enabled, default: 10)
- [ ] Allowed file types multi-select (shown when file uploads enabled)

### 5.3 Wire `assignment_data` into `LessonFormData` type and `onSubmit`
- [ ] Add `assignment_data?: AssignmentData` to `LessonFormData` in `cohortle-web/src/lib/api/convener.ts`
- [ ] Pass `assignment_data` in the submit payload when type is `assignment`

---

## Task 6: Learner Assignment Content Component

### 6.1 Create `cohortle-web/src/components/lessons/AssignmentLessonContent.tsx`
- [ ] Fetches assignment + submission via `useAssignment` hook
- [ ] Renders loading skeleton
- [ ] Renders instructions with due date badge (overdue styling if past due)
- [ ] Renders submission form when status is not yet submitted
  - [ ] Text answer textarea with draft auto-save to localStorage (debounced 500ms)
  - [ ] File upload zone (drag-and-drop + click) with file list and remove buttons
  - [ ] Client-side file size and type validation
  - [ ] Submit button with loading state
- [ ] Renders submitted view (read-only) when status is 'submitted'
- [ ] Renders graded view with Pass/Fail badge and feedback when status is 'graded'
- [ ] All interactive elements have proper ARIA labels and keyboard support

### 6.2 Create `cohortle-web/src/lib/hooks/useAssignment.ts`
- [ ] Fetches `GET /v1/api/lessons/:id/assignment`
- [ ] Exposes `submit(textAnswer)` function → calls submit API
- [ ] Exposes `submitFiles(files)` function → calls file upload API
- [ ] Returns `{ assignment, submission, isLoading, error, submit, submitFiles, isSubmitting }`

### 6.3 Create `cohortle-web/src/lib/api/assignments.ts`
- [ ] `getAssignment(lessonId: string, cohortId: string)` → GET
- [ ] `submitAssignment(lessonId: string, cohortId: string, textAnswer?: string)` → POST
- [ ] `submitAssignmentFiles(lessonId: string, cohortId: string, files: File[])` → POST multipart
- [ ] `gradeSubmission(submissionId: string, status: 'passed'|'failed', feedback?: string)` → POST

### 6.4 Add `assignment` case to `LessonContentRenderer.tsx`
- [ ] Add `'assignment'` to the `type` union in `LessonContentRendererProps`
- [ ] Add `case 'assignment':` in the switch statement rendering `<AssignmentLessonContent>`
- [ ] Normalise `assignment` type string (no underscore variant needed)

---

## Task 7: Convener Submissions View

### 7.1 Create `cohortle-web/src/components/convener/AssignmentSubmissionsView.tsx`
- [ ] Fetches `GET /v1/api/lessons/:lesson_id/assignment/submissions`
- [ ] Renders filter tabs: All / Not Submitted / Submitted / Graded
- [ ] Renders table: learner name, email, status badge, submitted at, "Review" button
- [ ] Empty state when no submissions match filter

### 7.2 Create `cohortle-web/src/components/convener/AssignmentGradeModal.tsx`
- [ ] Shows learner name, submission timestamp
- [ ] Shows text answer (scrollable, read-only)
- [ ] Shows file list with download links
- [ ] Pass / Fail radio buttons
- [ ] Feedback textarea (optional)
- [ ] Submit button → calls `gradeSubmission` API → closes modal, updates parent list

### 7.3 Add assignment submissions tab to convener lesson/week page
- [ ] On the convener programme week page (`/convener/programmes/[id]/weeks/[weekId]`), add an "Assignment Submissions" section/tab for assignment-type lessons
- [ ] Renders `AssignmentSubmissionsView` for the selected lesson

---

## Task 8: Status Badge in Lesson List

### 8.1 Update `LessonListItem.tsx` and `LessonCard.tsx` to show assignment status badge
- [ ] When lesson type is `assignment`, fetch/display submission status from the learner's progress data
- [ ] Badge states: Not Started (grey), Submitted (blue), Passed (green), Needs Revision (red)

---

## Task 9: Tests

### 9.1 API route tests — `cohortle-api/__tests__/assignment-submission/`
- [ ] `assignmentSubmit.test.js` — submit creates record, upserts on re-submit, marks lesson complete
- [ ] `assignmentGrade.test.js` — grade updates status, rejects non-owner convener
- [ ] `assignmentAccessControl.pbt.js` — property test: only enrolled learners can submit

### 9.2 Frontend component tests — `cohortle-web/__tests__/components/`
- [ ] `AssignmentLessonContent.test.tsx` — renders instructions, form, submitted state, graded state
- [ ] `AssignmentGradeModal.test.tsx` — renders submission, calls grade API on submit

### 9.3 Service tests — `cohortle-api/__tests__/services/AssignmentService.test.js`
- [ ] validateAssignmentData rejects missing instructions
- [ ] submitAssignment upserts correctly
- [ ] gradeSubmission rejects wrong convener
