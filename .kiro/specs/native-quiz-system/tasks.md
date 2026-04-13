# Implementation Plan: Native Quiz System

## Overview

Implement the native quiz system end-to-end: database migrations, backend API (QuizService + routes), frontend convener quiz builder, frontend learner quiz experience with persistence, and convener results view. Each task builds on the previous and ends with everything wired together.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Add `quiz_data` JSON column to `module_lessons` table
    - Create `cohortle-api/migrations/20260501000000-add-quiz-data-to-module-lessons.js`
    - Column: `quiz_data JSON NULL DEFAULT NULL`
    - Include idempotency check (skip if column already exists)
    - _Requirements: 3.1_

  - [x] 1.2 Create `quiz_attempts` table
    - Create `cohortle-api/migrations/20260501000001-create-quiz-attempts.js`
    - Fields: id (PK autoincrement), lesson_id (FK → module_lessons), user_id (FK → users), cohort_id (FK → cohorts), answers (JSON), score (INT), passed (BOOLEAN), submitted_at (DATETIME)
    - Add indexes on (lesson_id, user_id, cohort_id), lesson_id, user_id
    - Include idempotency check
    - _Requirements: 7.1_

- [x] 2. TypeScript types and API client
  - [x] 2.1 Create shared quiz types
    - Create `cohortle-web/src/types/quiz.ts` with `QuizQuestion`, `QuizSettings`, `QuizData`, `QuizAttempt` interfaces as defined in design.md
    - Export all types; update `@/types/lesson` to re-export `QuizData` for backward compatibility
    - _Requirements: 3.1, 4.7_

  - [x] 2.2 Add quiz API functions to the lessons API client
    - In `cohortle-web/src/lib/api/lessons.ts`, add:
      - `submitQuizAttempt(lessonId, cohortId, answers)` → POST `/v1/api/lessons/:id/quiz-attempt`
      - `getLatestQuizAttempt(lessonId, cohortId)` → GET `/v1/api/lessons/:id/quiz-attempt/latest`
      - `getQuizResults(lessonId)` → GET `/v1/api/lessons/:id/quiz-results`
    - _Requirements: 4.7, 7.4, 8.1_

- [x] 3. Backend QuizService
  - [x] 3.1 Create `cohortle-api/services/QuizService.js`
    - Implement `validateQuizData(quizData)` — validates structure, question types, options, correctAnswer presence
    - Implement `calculateScore(questions, answers)` — pure function: `round((correct / total) * 100)`
    - Implement `isPassing(score, passingScore)` — returns true if passingScore is null or score >= passingScore
    - _Requirements: 1.3, 1.4, 1.5, 1.10, 2.1, 2.2, 4.6_

  - [ ]* 3.2 Write property tests for QuizService score calculation and validation
    - Create `cohortle-api/__tests__/native-quiz-system/scoreCalculation.pbt.js`
    - **Property 9: Score calculation formula** — for any questions/answers, score = round((correct/total)*100)
    - **Validates: Requirements 4.6**
    - Create `cohortle-api/__tests__/native-quiz-system/questionValidation.pbt.js`
    - **Property 2: Multiple-choice requires ≥2 options and 1 correct answer**
    - **Property 3: True/false always has exactly 2 options**
    - **Property 4: Text-input requires non-empty correctAnswer**
    - **Validates: Requirements 1.3, 1.4, 1.5**
    - Create `cohortle-api/__tests__/native-quiz-system/settingsValidation.pbt.js`
    - **Property 7: Passing score must be in [1, 100]**
    - **Property 8: Time limit must be positive integer**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.5**

  - [x] 3.3 Create `cohortle-api/models/quiz_attempts.js` Sequelize model
    - Define model matching the migration schema
    - No timestamps (use submitted_at manually)
    - _Requirements: 7.1_

  - [x] 3.4 Implement `submitAttempt(userId, lessonId, cohortId, answers)` in QuizService
    - Fetch lesson, verify type === 'quiz', parse quiz_data
    - Call `calculateScore`, call `isPassing`
    - Insert into quiz_attempts
    - If passing: call `ProgressService.markLessonComplete`, then `StreakService.recalculateStreak`, then `AchievementService.evaluateAchievements`
    - Return `{ attempt, alreadyCompleted }`
    - _Requirements: 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.5 Write property tests for attempt submission and completion logic
    - Create `cohortle-api/__tests__/native-quiz-system/completionLogic.pbt.js`
    - **Property 11: Completion iff (no passing_score OR score >= passing_score)**
    - **Validates: Requirements 5.1, 5.2, 5.3, 7.2, 7.3**
    - Create `cohortle-api/__tests__/native-quiz-system/retakeAttemptCount.pbt.js`
    - **Property 12: K submissions → K quiz_attempt records**
    - **Validates: Requirements 6.5, 7.5**

  - [x] 3.6 Implement `getLatestAttempt(userId, lessonId, cohortId)` and `getResultsForLesson(lessonId, convenerUserId)` in QuizService
    - `getLatestAttempt`: query quiz_attempts ORDER BY submitted_at DESC LIMIT 1
    - `getResultsForLesson`: join with users table, verify lesson belongs to convener's programme, group by user to return latest attempt per learner plus attempt count
    - _Requirements: 7.4, 8.1, 8.2, 8.3, 8.5, 9.3_

  - [ ]* 3.7 Write property tests for round-trip and results access control
    - Create `cohortle-api/__tests__/native-quiz-system/attemptRoundTrip.pbt.js`
    - **Property 10: Submit attempt → fetch latest → data matches**
    - **Validates: Requirements 4.7, 7.1, 7.4**
    - Create `cohortle-api/__tests__/native-quiz-system/resultsAccessControl.pbt.js`
    - **Property 14: Results only include enrolled learners' attempts**
    - **Validates: Requirements 8.5**

- [x] 4. Backend routes
  - [x] 4.1 Update lesson create/update routes to accept and persist `quiz_data`
    - In `cohortle-api/routes/lesson.js`, update `POST /v1/api/modules/:module_id/lessons` and `PUT /v1/api/lessons/:lesson_id`
    - Extract `quiz_data` from request body
    - If `type === 'quiz'` and `quiz_data` is provided, call `QuizService.validateQuizData` before persisting
    - Include `quiz_data` in the lesson response object
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 1.10_

  - [ ]* 4.2 Write property test for quiz_data round-trip via API
    - Create `cohortle-api/__tests__/native-quiz-system/quizDataRoundTrip.pbt.js`
    - **Property 1: Save quiz_data → fetch lesson → quiz_data deeply equals saved value**
    - **Validates: Requirements 1.6, 1.7, 2.6, 3.1, 3.2, 3.3, 3.4**

  - [x] 4.3 Add quiz attempt routes to `cohortle-api/routes/lesson.js`
    - `POST /v1/api/lessons/:lesson_id/quiz-attempt` — TokenMiddleware student, call `QuizService.submitAttempt`
    - `GET /v1/api/lessons/:lesson_id/quiz-attempt/latest` — TokenMiddleware student, call `QuizService.getLatestAttempt`, pass `cohort_id` from query param
    - `GET /v1/api/lessons/:lesson_id/quiz-results` — TokenMiddleware convener + multiLevelAccessControl, call `QuizService.getResultsForLesson`
    - _Requirements: 4.7, 7.4, 8.1, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 4.4 Write unit tests for quiz routes
    - Create `cohortle-api/__tests__/native-quiz-system/quizRoutes.test.js`
    - Test 401/403 for unauthenticated and wrong-role requests
    - Test 400 for invalid quiz_data
    - Test 404 for non-existent lesson
    - _Requirements: 9.1, 9.2, 3.5_

- [x] 5. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 6. Frontend — Convener Quiz Builder
  - [x] 6.1 Create `QuizSettings` sub-component
    - Create `cohortle-web/src/components/convener/QuizSettings.tsx`
    - Fields: passing score (optional number 1-100), time limit (optional positive integer minutes), allow retakes (toggle, default true)
    - Inline validation matching backend rules
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Create `QuestionEditor` sub-component
    - Create `cohortle-web/src/components/convener/QuestionEditor.tsx`
    - Renders a single question with: type selector, question text input, type-specific fields (options for MC, correctAnswer for all)
    - For multiple-choice: dynamic option list (add/remove), radio to mark correct answer
    - For true/false: static True/False display, radio to mark correct
    - For text-input: single correct answer text field
    - Optional explanation field for all types
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 6.3 Create `QuizBuilder` component
    - Create `cohortle-web/src/components/convener/QuizBuilder.tsx`
    - Renders `QuizSettings` at top
    - Renders list of `QuestionEditor` instances
    - Add Question button (appends new question with generated UUID id)
    - Delete question button per question
    - Drag-to-reorder or up/down arrow reorder buttons
    - Validates: at least 1 question before allowing save (shows error if 0)
    - Calls `onChange(quizData)` on any change
    - _Requirements: 1.1, 1.2, 1.8, 1.9, 1.10_

  - [x] 6.4 Wire `QuizBuilder` into `LessonForm`
    - In `cohortle-web/src/components/convener/LessonForm.tsx`, replace the quiz URL input block with `<QuizBuilder>` when `contentType === 'quiz'`
    - Store quiz data in form state; include in submission payload as `quiz_data`
    - On edit mode, pass `initialData.quiz_data` to `QuizBuilder`
    - _Requirements: 1.1, 1.6, 1.7_

  - [ ]* 6.5 Write property tests for QuizBuilder
    - Create `cohortle-web/__tests__/components/QuizBuilder.pbt.tsx`
    - **Property 5: Delete question reduces count by 1**
    - **Property 6: Reorder preserves all question ids**
    - **Validates: Requirements 1.8, 1.9**

- [x] 7. Frontend — Learner Quiz Experience
  - [x] 7.1 Update `QuizLessonContent` to fetch and display prior attempt on mount
    - In `cohortle-web/src/components/lessons/QuizLessonContent.tsx`, add `lessonId` and `cohortId` props
    - On mount, call `getLatestQuizAttempt(lessonId, cohortId)`
    - If attempt exists: pre-populate answers and show results view (score, feedback, retake button if allowed)
    - If no attempt: show blank quiz
    - _Requirements: 4.1, 4.8, 6.1, 6.3, 6.4_

  - [x] 7.2 Create `CountdownTimer` sub-component
    - Create `cohortle-web/src/components/lessons/CountdownTimer.tsx`
    - Props: `minutes: number`, `onExpire: () => void`
    - Displays MM:SS countdown; calls `onExpire` when reaches 0
    - _Requirements: 4.2_

  - [x] 7.3 Wire submission to backend in `QuizLessonContent`
    - Replace local `calculateScore` with a call to `submitQuizAttempt(lessonId, cohortId, answers)`
    - On success: update state with returned attempt (score, passed, per-question feedback)
    - Call `onQuizComplete(score)` if provided
    - Handle retake: reset state and allow new submission (creates new attempt)
    - Integrate `CountdownTimer` when `quizData.settings.time_limit` is set
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 6.1, 6.2, 6.5_

  - [x] 7.4 Update `LessonContentRenderer` to pass `lessonId` and `cohortId` to `QuizLessonContent`
    - In `cohortle-web/src/components/learning/LessonContentRenderer.tsx`, pass `lessonId` and `cohortId` when rendering quiz type
    - _Requirements: 4.1_

  - [ ]* 7.5 Write property tests for QuizLessonContent
    - Create `cohortle-web/__tests__/components/QuizLessonContent.pbt.tsx` (update existing file)
    - **Property 13: Retake button visible iff allow_retakes = true**
    - **Property 15: Unanswered questions block submission**
    - **Property 16: All N questions rendered for any quiz_data with N questions**
    - **Validates: Requirements 4.1, 4.9, 6.1, 6.3, 6.4**

- [x] 8. Frontend — Convener Quiz Results View
  - [x] 8.1 Create `QuizResultsView` component
    - Create `cohortle-web/src/components/convener/QuizResultsView.tsx`
    - Fetches results via `getQuizResults(lessonId)` on mount
    - Renders table: learner name, most recent score, passed badge, attempt count, last submitted timestamp
    - Expandable row: per-question breakdown (learner answer vs correct answer)
    - Empty state when no attempts
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 8.2 Add `QuizResultsView` to the convener week/lesson page
    - In `cohortle-web/src/app/convener/programmes/[id]/weeks/[weekId]/page.tsx`, render `<QuizResultsView lessonId={...} />` below the lesson editor when the selected lesson type is `quiz`
    - _Requirements: 8.1_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `module_lessons.id` is an integer; `quiz_attempts.lesson_id` references this integer PK (not the UUID `lessons.id` used by the WLIMP system)
- The existing `QuizLessonContent` component already has local score calculation logic — Task 7.3 replaces this with backend persistence
- Property tests use **fast-check** consistent with the rest of the codebase
- Each property test must run a minimum of 100 iterations
