# Requirements Document

## Introduction

The Native Quiz System replaces the existing external-URL-based quiz lesson type in Cohortle with a fully native quiz authoring and delivery experience. Conveners can build quizzes directly inside Cohortle using multiple question types, configure quiz settings (passing score, time limit, retake policy), and view per-learner attempt results. Learners take quizzes natively, receive immediate scored feedback, and have their lesson completion automatically tracked based on quiz outcomes.

## Glossary

- **Quiz**: A lesson of type `quiz` whose content is stored natively in Cohortle rather than as an external URL.
- **Quiz_Data**: The JSON structure stored on a lesson record that describes questions and quiz-level settings.
- **Question**: A single item within a quiz, belonging to one of three types: multiple-choice, true/false, or text-input.
- **Option**: One of the selectable answer choices for a multiple-choice question.
- **Correct_Answer**: The expected answer value for a question, used to calculate the score.
- **Quiz_Attempt**: A single submission of answers by a learner for a quiz lesson, stored in the `quiz_attempts` table.
- **Score**: The percentage of questions answered correctly in a Quiz_Attempt, calculated as `(correct_count / total_questions) × 100`, rounded to the nearest integer.
- **Passing_Score**: An optional integer percentage (0–100) set by the convener; a learner must achieve at least this Score to pass.
- **Time_Limit**: An optional integer number of minutes within which a learner must submit a quiz.
- **Quiz_Builder**: The convener-facing UI component for creating and editing quiz questions and settings.
- **QuizLessonContent**: The learner-facing UI component for taking a quiz.
- **Quiz_Results_View**: The convener-facing UI component for viewing per-learner attempt data.
- **Convener**: A user with the `convener` role who creates and manages programmes, weeks, and lessons.
- **Learner**: A user with the `student` role who is enrolled in a cohort and consumes lesson content.
- **ProgressService**: The backend service responsible for marking lessons complete and checking completion status.

---

## Requirements

### Requirement 1: Quiz Lesson Authoring — Question Management

**User Story:** As a convener, I want to add, edit, reorder, and delete questions in a quiz lesson, so that I can build a complete quiz directly inside Cohortle without using an external tool.

#### Acceptance Criteria

1. WHEN a convener selects the `quiz` content type for a lesson, THE Quiz_Builder SHALL replace the external URL field with a native question editor interface.
2. WHEN a convener adds a question, THE Quiz_Builder SHALL support three question types: multiple-choice, true/false, and text-input.
3. WHEN a convener creates a multiple-choice question, THE Quiz_Builder SHALL require at least two options and exactly one correct answer to be designated.
4. WHEN a convener creates a true/false question, THE Quiz_Builder SHALL present exactly two options ("True" and "False") and require one to be designated as the correct answer.
5. WHEN a convener creates a text-input question, THE Quiz_Builder SHALL require a correct answer string to be provided.
6. WHEN a convener saves a quiz lesson, THE System SHALL persist the Quiz_Data as a JSON column on the `module_lessons` record.
7. WHEN a convener edits an existing quiz lesson, THE Quiz_Builder SHALL load the previously saved Quiz_Data and allow modification of any question or setting.
8. WHEN a convener deletes a question, THE Quiz_Builder SHALL remove it from the question list and update the saved Quiz_Data on the next save.
9. WHEN a convener reorders questions, THE Quiz_Builder SHALL update the question order in the Quiz_Data on the next save.
10. IF a convener attempts to save a quiz with zero questions, THEN THE System SHALL reject the save and display a validation error.

---

### Requirement 2: Quiz Lesson Authoring — Settings

**User Story:** As a convener, I want to configure quiz-level settings such as passing score, time limit, and retake policy, so that I can control how learners experience the quiz.

#### Acceptance Criteria

1. WHEN a convener configures a quiz, THE Quiz_Builder SHALL provide an optional passing score field accepting an integer between 1 and 100 (inclusive).
2. WHEN a convener configures a quiz, THE Quiz_Builder SHALL provide an optional time limit field accepting a positive integer number of minutes.
3. WHEN a convener configures a quiz, THE Quiz_Builder SHALL provide an allow-retakes toggle that defaults to `true`.
4. IF a convener enters a passing score outside the range 1–100, THEN THE System SHALL reject the value and display a validation error.
5. IF a convener enters a time limit of zero or a negative number, THEN THE System SHALL reject the value and display a validation error.
6. WHEN a convener saves quiz settings, THE System SHALL persist the passing score, time limit, and allow-retakes flag within the Quiz_Data JSON.

---

### Requirement 3: Quiz Data Persistence

**User Story:** As a convener, I want quiz content to be stored reliably in the database, so that quiz data is not lost and can be retrieved consistently.

#### Acceptance Criteria

1. THE System SHALL store Quiz_Data as a JSON column named `quiz_data` on the `module_lessons` table.
2. WHEN a lesson of type `quiz` is fetched via the API, THE System SHALL include the `quiz_data` field in the response.
3. WHEN a lesson of type `quiz` is updated via the API, THE System SHALL accept a `quiz_data` field in the request body and persist it.
4. WHEN a lesson of type `quiz` is created via the API, THE System SHALL accept a `quiz_data` field in the request body and persist it.
5. IF a `quiz_data` value is provided that is not valid JSON, THEN THE System SHALL reject the request with a 400 error.

---

### Requirement 4: Learner Quiz Taking

**User Story:** As a learner, I want to take a quiz natively inside Cohortle, so that I can complete quiz lessons without leaving the platform.

#### Acceptance Criteria

1. WHEN a learner opens a quiz lesson, THE QuizLessonContent SHALL render all questions from the Quiz_Data.
2. WHEN a learner opens a quiz lesson that has a time limit, THE QuizLessonContent SHALL display a countdown timer and submit the quiz automatically when the timer reaches zero.
3. WHEN a learner answers a multiple-choice question, THE QuizLessonContent SHALL record the selected option index.
4. WHEN a learner answers a true/false question, THE QuizLessonContent SHALL record the selected value ("true" or "false").
5. WHEN a learner answers a text-input question, THE QuizLessonContent SHALL record the entered string.
6. WHEN a learner submits a quiz, THE System SHALL calculate the Score as `round((correct_count / total_questions) × 100)`.
7. WHEN a learner submits a quiz, THE System SHALL persist a Quiz_Attempt record containing the learner's answers, the Score, and the submission timestamp.
8. WHEN a learner submits a quiz, THE QuizLessonContent SHALL display the Score and per-question feedback (correct/incorrect with the correct answer shown for wrong answers).
9. IF a learner attempts to submit a quiz with unanswered questions, THEN THE QuizLessonContent SHALL prevent submission and indicate which questions are unanswered.

---

### Requirement 5: Lesson Completion via Quiz

**User Story:** As a learner, I want my quiz lesson to be marked complete automatically based on my submission, so that my progress is tracked correctly.

#### Acceptance Criteria

1. WHEN a learner submits a quiz that has no Passing_Score configured, THE System SHALL mark the lesson complete immediately upon submission.
2. WHEN a learner submits a quiz that has a Passing_Score configured and the Score meets or exceeds the Passing_Score, THE System SHALL mark the lesson complete.
3. WHEN a learner submits a quiz that has a Passing_Score configured and the Score is below the Passing_Score, THE System SHALL NOT mark the lesson complete.
4. WHEN a lesson is marked complete via a quiz submission, THE System SHALL invoke ProgressService.markLessonComplete with the learner's user_id, lesson_id, and cohort_id.
5. WHEN a lesson is marked complete via a quiz submission, THE System SHALL invoke StreakService.recalculateStreak and AchievementService.evaluateAchievements for the learner.

---

### Requirement 6: Retake Policy

**User Story:** As a learner, I want to retake a quiz if the convener allows it, so that I can improve my score and pass the quiz.

#### Acceptance Criteria

1. WHEN a learner views a submitted quiz and the allow-retakes setting is `true`, THE QuizLessonContent SHALL display a "Retake Quiz" button.
2. WHEN a learner clicks "Retake Quiz", THE QuizLessonContent SHALL reset all answers and the timer (if applicable) and allow a new submission.
3. WHEN a learner views a submitted quiz and the allow-retakes setting is `false` and the learner has already passed (or no Passing_Score is set), THE QuizLessonContent SHALL display the quiz in read-only mode with no retake option.
4. WHEN a learner views a submitted quiz and the allow-retakes setting is `false` and the learner has not yet passed, THE QuizLessonContent SHALL display the quiz in read-only mode with no retake option.
5. WHEN a learner retakes a quiz, THE System SHALL create a new Quiz_Attempt record rather than overwriting the previous attempt.
6. WHEN a learner retakes a quiz and passes, THE System SHALL mark the lesson complete (if not already complete).

---

### Requirement 7: Quiz Attempt Persistence

**User Story:** As a system, I want all quiz attempts to be stored in the database, so that results are available for conveners to review and for completion logic to reference.

#### Acceptance Criteria

1. THE System SHALL store each Quiz_Attempt in a `quiz_attempts` table with fields: id, lesson_id, user_id, cohort_id, answers (JSON), score (integer), passed (boolean), submitted_at (timestamp).
2. WHEN a Quiz_Attempt is created, THE System SHALL set `passed` to `true` if the Score meets or exceeds the Passing_Score, or if no Passing_Score is configured.
3. WHEN a Quiz_Attempt is created, THE System SHALL set `passed` to `false` if the Score is below the Passing_Score.
4. WHEN a learner loads a quiz lesson they have previously attempted, THE System SHALL return the most recent Quiz_Attempt so the UI can display prior results.
5. THE System SHALL allow multiple Quiz_Attempt records per (lesson_id, user_id, cohort_id) combination to support retakes.

---

### Requirement 8: Convener Results View

**User Story:** As a convener, I want to view quiz attempt results per learner for a given quiz lesson, so that I can assess learner understanding and identify who has passed or failed.

#### Acceptance Criteria

1. WHEN a convener views a quiz lesson in the convener dashboard, THE Quiz_Results_View SHALL display a list of all learners who have attempted the quiz.
2. WHEN displaying the results list, THE Quiz_Results_View SHALL show each learner's name, most recent score, passed/failed status, number of attempts, and most recent submission timestamp.
3. WHEN a convener selects a specific learner's attempt, THE Quiz_Results_View SHALL display the learner's individual answers alongside the correct answers for each question.
4. WHEN no learners have attempted the quiz, THE Quiz_Results_View SHALL display an empty state message.
5. WHEN a convener views results, THE System SHALL return only attempts belonging to learners enrolled in cohorts associated with the convener's programme.

---

### Requirement 9: API Access Control

**User Story:** As a system, I want quiz endpoints to enforce role-based access control, so that only authorised users can read or write quiz data.

#### Acceptance Criteria

1. WHEN a request to create or update quiz data is received without a valid convener token, THE System SHALL return a 401 or 403 response.
2. WHEN a request to submit a quiz attempt is received without a valid student token, THE System SHALL return a 401 or 403 response.
3. WHEN a convener requests quiz results for a lesson, THE System SHALL verify the lesson belongs to a programme owned by that convener before returning data.
4. WHEN a learner requests their own quiz attempt, THE System SHALL verify the learner is enrolled in a cohort associated with that lesson's programme.
5. WHEN a learner requests another learner's quiz attempt, THE System SHALL return a 403 response.
