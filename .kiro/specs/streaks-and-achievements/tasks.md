# Implementation Plan: Streaks and Achievements

## Overview

Implement streak calculation, achievement awarding, schema migrations, and frontend wiring. Tasks are ordered so each step is immediately integrated — no orphaned code.

## Tasks

- [x] 1. Database migrations — user_streaks table and achievements schema update
  - Create migration `cohortle-api/migrations/20260410000000-create-user-streaks.js` to add the `user_streaks` table (columns: `id`, `user_id` UNIQUE, `current_streak`, `longest_streak`, `last_activity_date`, `updated_at`)
  - Create migration `cohortle-api/migrations/20260410000001-add-rarity-category-to-achievements.js` to add `rarity ENUM('common','rare','epic','legendary') DEFAULT 'common'` and `category VARCHAR(100)` columns to the `achievements` table
  - Add the `user_streaks` Sequelize model at `cohortle-api/models/user_streaks.js` with the correct field definitions and a `belongsTo users` association
  - Register the model and association in `cohortle-api/models/init-models.js`
  - _Requirements: 1.6, 4.1, 4.2_

- [x] 2. Implement StreakService
  - Create `cohortle-api/services/StreakService.js` with three methods:
    - `computeStreakFromDates(dates)` — pure function, takes array of UTC date strings, returns `{ currentStreak, longestStreak }`
    - `getStreak(userId)` — reads from `user_streaks`, returns `{ currentStreak: 0, longestStreak: 0 }` if no row
    - `recalculateStreak(userId)` — queries `lesson_completions`, calls `computeStreakFromDates`, upserts `user_streaks`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.4, 2.5_

  - [-]* 2.1 Write property test for streak pure function (Property 1)
    - **Property 1: Streak is a pure function of completion dates**
    - Generate arbitrary arrays of ISO date strings (with duplicates, out of order); assert result is identical regardless of input order
    - **Validates: Requirements 1.2, 1.3**

  - [-]* 2.2 Write property test for currentStreak <= longestStreak invariant (Property 2)
    - **Property 2: Current streak is bounded by longest streak**
    - Generate arbitrary date arrays; assert `currentStreak <= longestStreak` always holds
    - **Validates: Requirements 1.5**

  - [ ]* 2.3 Write property test for streak recalculation idempotency (Property 6)
    - **Property 6: Streak recalculation is idempotent**
    - Call `recalculateStreak` twice without adding completions; assert stored values are identical
    - **Validates: Requirements 1.6, 2.5**

  - [-]* 2.4 Write unit tests for streak edge cases
    - Empty dates → `{ currentStreak: 0, longestStreak: 0 }` (edge case for Requirement 1.7)
    - Single date today → `{ currentStreak: 1, longestStreak: 1 }`
    - 7 consecutive days ending today → `{ currentStreak: 7, longestStreak: 7 }`
    - Gap two days ago → `currentStreak: 0`
    - Completions only yesterday → `currentStreak: 1`
    - _Requirements: 1.3, 1.4, 1.7_

- [x] 3. Integrate StreakService into ProfileService and lesson completion route
  - In `cohortle-api/services/ProfileService.js`, replace the hardcoded `currentStreak = 0` / `longestStreak = 0` in `_calculateLearningStats` with a call to `StreakService.getStreak(userId)`
  - Find the lesson completion route (search for `markLessonComplete` in routes) and add post-completion calls to `StreakService.recalculateStreak(userId)` wrapped in a try/catch that logs but does not re-throw
  - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.1 Write integration test for profile API streak values
    - Seed a `user_streaks` row for a test user; call `GET /v1/api/profile`; assert response `stats.currentStreak` matches the seeded value
    - **Validates: Requirements 2.1, 2.2**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Achievement schema seeder
  - Create `cohortle-api/seeders/20260410000000-seed-default-achievements.js` that inserts the 12 default achievement definitions from the design document
  - Use `findOrCreate` (or `INSERT IGNORE`) keyed on `name` to ensure idempotency
  - Each row must include `name`, `description`, `icon` (empty string for now), `criteria` (JSON), `rarity`, `category`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.1 Write property test for seeder idempotency (Property 8 — seeder idempotency)
    - Run the seeder twice; assert the `achievements` table row count is the same after both runs
    - **Validates: Requirements 5.2**

  - [ ]* 5.2 Write unit test for seeder coverage
    - After running the seeder, assert at least one achievement exists for each required category: `first`, `completion`, `streak`, `consistency`, `milestone`
    - _Requirements: 5.3_

- [x] 6. Implement AchievementService
  - Create `cohortle-api/services/AchievementService.js` with:
    - `isCriteriaMet(criteria, stats)` — pure function returning boolean
    - `awardAchievement(userId, achievementId)` — uses `findOrCreate` on `user_achievements`
    - `evaluateAchievements(userId)` — fetches all achievements, fetches already-awarded IDs, computes user stats, calls `isCriteriaMet` for each, awards newly met ones; catches per-achievement errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 6.1 Write property test for isCriteriaMet pure function (Property 4)
    - **Property 4: Achievement criteria evaluation is a pure function**
    - Generate arbitrary criteria and stats objects; assert repeated calls return the same boolean
    - **Validates: Requirements 6.4**

  - [ ]* 6.2 Write property test for awardAchievement idempotency (Property 5)
    - **Property 5: Achievement awarding is idempotent**
    - Call `awardAchievement` twice for the same user/achievement pair; assert exactly one `user_achievements` row exists
    - **Validates: Requirements 6.3**

  - [ ]* 6.3 Write unit test for evaluateAchievements fault tolerance
    - Inject an error for one achievement evaluation; assert the method does not throw and other achievements are still processed
    - _Requirements: 6.5_

  - [x]* 6.4 Write unit tests for each criterion type boundary
    - For each of `first_lesson`, `lessons_completed`, `streak_days`, `programmes_completed`, `days_active`: assert `isCriteriaMet` returns false at threshold-1 and true at threshold
    - _Requirements: 6.4_

- [x] 7. Integrate AchievementService into lesson completion route
  - In the lesson completion route (after the `StreakService.recalculateStreak` call), add `await AchievementService.evaluateAchievements(userId)` inside the same try/catch block
  - _Requirements: 6.1, 6.6_

- [x] 8. Update ProfileService.getUserAchievements to include rarity and category
  - In `cohortle-api/services/ProfileService.js`, update the `getUserAchievements` method to map `ua.achievement.rarity` and `ua.achievement.category` into the returned object
  - Update the `Achievement` type in `cohortle-web/src/lib/api/profile.ts` to add optional `rarity` and `category` fields
  - _Requirements: 4.3, 4.4, 7.1, 7.2, 7.3_

  - [ ]* 8.1 Write property test for achievement response shape (Property 7)
    - **Property 7: Achievement response includes rarity and category**
    - For any achievement returned by `getUserAchievements`, assert the response object contains `rarity` (valid enum value) and `category` (non-empty string)
    - **Validates: Requirements 4.3, 7.1**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Wire StreakCounter in LearnerNavBar to real data
  - In `cohortle-web/src/components/navigation/LearnerNavBar.tsx`, replace the hardcoded `streakDays={0}` with a value sourced from the profile API
  - Create a lightweight hook `cohortle-web/src/lib/hooks/useStreakData.ts` that calls `getUserProfile()` and returns `{ currentStreak, isLoading }`, with a fallback of 0 while loading
  - Pass `currentStreak` from the hook to `<StreakCounter streakDays={currentStreak} />`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 10.1 Write unit test for LearnerNavBar streak wiring
    - Mock `getUserProfile` to return `currentStreak: 5`; render `LearnerNavBar`; assert `StreakCounter` receives `streakDays={5}`
    - _Requirements: 3.1_

- [x] 11. Verify profile page passes rarity and category to badge components
  - Inspect `cohortle-web/src/components/profile/LearnerProfile.tsx` (or `EnhancedLearnerProfile.tsx`) to confirm achievements are fetched and passed to `EnhancedAchievementsBadges`
  - If the fetch is missing, add a call to `getUserAchievements()` and pass the result as the `achievements` prop
  - Confirm `EnhancedAchievementsBadges` already handles missing `rarity`/`category` gracefully (it does — defaults to `common` and `Medal` icon)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use `fast-check` with minimum 100 iterations
- The lesson completion route is likely in `cohortle-api/routes/lesson.js` — search for `markLessonComplete` to confirm the exact file
- The `user_streaks` model must be registered in `init-models.js` before `StreakService` can use it
- Run migrations with `npx sequelize-cli db:migrate` and the seeder with `npx sequelize-cli db:seed --seed 20260410000000-seed-default-achievements.js`
