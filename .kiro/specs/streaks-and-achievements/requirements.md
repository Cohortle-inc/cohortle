# Requirements Document

## Introduction

The Cohortle platform has frontend components for displaying learning streaks and achievement badges (`StreakCounter`, `LearningStats`, `AchievementsBadges`, `EnhancedAchievementsBadges`), but the backend does not calculate or persist streak data, and the achievements system has no `rarity` or `category` fields, no seeding of achievement definitions, and no logic to automatically award achievements to learners. As a result, streaks always display as 0 and achievements are never earned.

This feature makes streaks and achievements fully functional end-to-end: calculating real streak values from lesson completion data, awarding achievements automatically when criteria are met, and surfacing both through the existing API and UI components.

## Glossary

- **Streak_Service**: The backend service responsible for calculating and persisting streak data
- **Achievement_Service**: The backend service responsible for evaluating achievement criteria and awarding achievements
- **Streak**: The count of consecutive calendar days on which a learner completed at least one lesson
- **Current_Streak**: The number of consecutive days ending on today (or yesterday) on which the learner completed at least one lesson
- **Longest_Streak**: The highest consecutive-day count the learner has ever achieved
- **Streak_Freeze**: A grace period of one missed day that does not break the current streak (not in scope for this feature)
- **Achievement**: A named badge with a description, category, rarity tier, and criteria that a learner can earn
- **Achievement_Criteria**: A JSON object stored on the `achievements` table that defines the condition required to earn the achievement
- **Rarity_Tier**: One of four levels — `common`, `rare`, `epic`, `legendary` — that determines the visual weight of an achievement badge
- **Achievement_Category**: A string tag on an achievement that maps to a Phosphor icon in the frontend (e.g., `completion`, `streak`, `community`, `milestone`, `learning`, `speed`, `consistency`, `first`)
- **Lesson_Completion**: A record in the `lesson_completions` table recording that a user completed a lesson at a specific timestamp
- **Streak_Snapshot**: A record in the `user_streaks` table storing the current and longest streak for a user, updated whenever a lesson is completed
- **Award_Event**: The moment the Achievement_Service detects that a learner has newly met the criteria for an achievement and inserts a `user_achievements` row

---

## Requirements

### Requirement 1: Streak Calculation

**User Story:** As a learner, I want my streak counter to reflect the actual number of consecutive days I have completed lessons, so that I can see my real learning habit.

#### Acceptance Criteria

1. WHEN a learner completes a lesson, THE Streak_Service SHALL recalculate the learner's Current_Streak and Longest_Streak based on the `lesson_completions` table
2. THE Streak_Service SHALL define a streak day as any calendar day (in UTC) on which the learner has at least one `lesson_completions` record
3. WHEN calculating Current_Streak, THE Streak_Service SHALL count the number of consecutive days ending on today or yesterday that have at least one completion
4. WHEN today has no completions and yesterday has no completions, THE Streak_Service SHALL set Current_Streak to 0
5. WHEN the newly calculated Current_Streak exceeds the stored Longest_Streak, THE Streak_Service SHALL update Longest_Streak to equal Current_Streak
6. THE Streak_Service SHALL persist Current_Streak and Longest_Streak in a `user_streaks` table keyed by `user_id`
7. WHEN a learner has no lesson completions, THE Streak_Service SHALL return Current_Streak of 0 and Longest_Streak of 0

---

### Requirement 2: Streak API

**User Story:** As a learner, I want the profile and dashboard APIs to return my real streak values, so that the frontend displays accurate data.

#### Acceptance Criteria

1. WHEN the `/v1/api/profile` endpoint is called, THE Profile_API SHALL return `currentStreak` and `longestStreak` values sourced from the `user_streaks` table rather than hardcoded zeros
2. WHEN a learner has no `user_streaks` row, THE Profile_API SHALL return `currentStreak: 0` and `longestStreak: 0`
3. WHEN the `/v1/api/lessons/:lessonId/complete` endpoint successfully marks a lesson complete, THE Lesson_API SHALL trigger a streak recalculation for the completing user
4. THE Streak_Service SHALL expose a `getStreak(userId)` method that returns `{ currentStreak, longestStreak }`
5. THE Streak_Service SHALL expose a `recalculateStreak(userId)` method that recomputes and persists streak values from the `lesson_completions` table

---

### Requirement 3: Streak Counter Display

**User Story:** As a learner, I want the streak counter in the navigation bar to show my real streak, so that I am motivated to maintain my daily habit.

#### Acceptance Criteria

1. WHEN the `LearnerNavBar` component renders, THE Streak_Counter SHALL display the `currentStreak` value fetched from the profile API rather than the hardcoded value of 0
2. WHEN the profile API returns `currentStreak: 0`, THE Streak_Counter SHALL display 0 with a `regular`-weight flame icon
3. WHEN the profile API is loading, THE Streak_Counter SHALL display a skeleton or neutral state rather than a stale value
4. THE `LearnerNavBar` SHALL fetch streak data using the existing `/v1/api/profile` endpoint and pass `currentStreak` to the `StreakCounter` component

---

### Requirement 4: Achievement Schema

**User Story:** As a developer, I want the achievements table to include `rarity` and `category` fields, so that the frontend badge components can render the correct icon and visual tier.

#### Acceptance Criteria

1. THE `achievements` table SHALL include a `rarity` column of type `ENUM('common', 'rare', 'epic', 'legendary')` with a default of `common`
2. THE `achievements` table SHALL include a `category` column of type `VARCHAR(100)` that maps to a frontend icon category (e.g., `completion`, `streak`, `community`, `milestone`, `learning`, `speed`, `consistency`, `first`)
3. WHEN the `/v1/api/profile/achievements` endpoint returns achievements, THE Achievement_API SHALL include `rarity` and `category` fields on each achievement object
4. THE `getUserAchievements` method in `ProfileService` SHALL map the `achievements.rarity` and `achievements.category` database columns to the response object

---

### Requirement 5: Achievement Seeding

**User Story:** As a platform operator, I want a set of default achievement definitions to exist in the database, so that learners can earn badges without manual data entry.

#### Acceptance Criteria

1. THE system SHALL provide a database seeder that inserts a set of default achievement definitions into the `achievements` table
2. THE seeder SHALL be idempotent — running it multiple times SHALL NOT create duplicate achievement rows
3. THE default achievement set SHALL include at least one achievement for each of the following categories: `first`, `completion`, `streak`, `consistency`, `milestone`
4. WHEN the seeder runs, THE system SHALL insert achievements with appropriate `rarity`, `category`, `name`, `description`, and `criteria` fields
5. THE `criteria` JSON field SHALL use a consistent schema: `{ "type": "<criterion_type>", "threshold": <number> }` where `criterion_type` is one of: `first_lesson`, `lessons_completed`, `streak_days`, `programmes_completed`, `days_active`

---

### Requirement 6: Achievement Awarding

**User Story:** As a learner, I want to automatically earn achievement badges when I reach milestones, so that my progress is recognised without manual intervention.

#### Acceptance Criteria

1. WHEN a learner completes a lesson, THE Achievement_Service SHALL evaluate all achievement criteria for that learner and award any newly met achievements
2. THE Achievement_Service SHALL award an achievement by inserting a row into `user_achievements` with the `user_id` and `achievement_id`
3. WHEN an achievement has already been awarded to a learner, THE Achievement_Service SHALL NOT award it again (idempotent awarding)
4. THE Achievement_Service SHALL evaluate the following criterion types:
   - `first_lesson`: awarded when the learner's total lesson completions equals 1
   - `lessons_completed`: awarded when the learner's total lesson completions reaches the `threshold`
   - `streak_days`: awarded when the learner's Current_Streak reaches the `threshold`
   - `programmes_completed`: awarded when the learner's completed programme count reaches the `threshold`
   - `days_active`: awarded when the learner's total distinct active days reaches the `threshold`
5. IF an error occurs while evaluating or awarding an achievement, THEN THE Achievement_Service SHALL log the error and continue processing remaining achievements without throwing
6. WHEN the `/v1/api/lessons/:lessonId/complete` endpoint is called, THE Lesson_API SHALL invoke achievement evaluation after the streak recalculation

---

### Requirement 7: Achievement API Response

**User Story:** As a learner, I want the achievements API to return my earned badges with all the fields the frontend needs, so that the badge components render correctly.

#### Acceptance Criteria

1. WHEN the `/v1/api/profile/achievements` endpoint is called, THE Achievement_API SHALL return an array of achievement objects each containing: `id`, `title`, `description`, `icon`, `earnedAt`, `rarity`, `category`
2. WHEN a learner has no earned achievements, THE Achievement_API SHALL return an empty array with a 200 status
3. THE Achievement_API SHALL return achievements ordered by `earned_at` descending (most recently earned first)
4. WHEN the `achievements` table has no rows (seeder not yet run), THE Achievement_API SHALL return an empty array rather than an error

---

### Requirement 8: Frontend Achievement Display

**User Story:** As a learner, I want my profile page to show my earned achievements with the correct icons and rarity styling, so that my badges look meaningful.

#### Acceptance Criteria

1. WHEN the profile page loads, THE Achievement_Display SHALL fetch achievements from `/v1/api/profile/achievements` and pass them to the `EnhancedAchievementsBadges` component
2. WHEN the API returns achievements with `rarity` and `category` fields, THE `EnhancedAchievementsBadges` component SHALL render the correct Phosphor icon and rarity border styling for each badge
3. WHEN the API returns achievements without `rarity` (legacy data), THE `EnhancedAchievementsBadges` component SHALL default to `common` rarity styling
4. WHEN the API returns achievements without `category` (legacy data), THE `EnhancedAchievementsBadges` component SHALL render the default `Medal` icon

---

### Requirement 9: Learning Stats Display

**User Story:** As a learner, I want the Learning Statistics section on my profile to show my real streak values, so that I can track my learning habit accurately.

#### Acceptance Criteria

1. WHEN the profile page loads, THE Learning_Stats_Display SHALL render `currentStreak` and `longestStreak` values sourced from the profile API response
2. WHEN `currentStreak` is 0, THE Learning_Stats_Display SHALL display "0 days" rather than hiding the streak stat
3. THE `LearningStats` and `EnhancedLearningStats` components SHALL accept `currentStreak` and `longestStreak` as props and render them without modification
