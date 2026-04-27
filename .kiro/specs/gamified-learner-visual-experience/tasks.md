# Implementation Plan: Gamified Learner Visual Experience

## Overview

Replace emoji-based visual elements with Phosphor Icons and Motion animations across seven existing components. Each task builds on the previous, starting with the shared foundation (library install + hook) and ending with page transitions. Property-based tests are placed close to the implementation they validate.

## Tasks

- [x] 1. Install dependencies and create shared animation utilities
  - Install `@phosphor-icons/react` and verify `motion` is available (`npm install @phosphor-icons/react`)
  - Create `cohortle-web/src/lib/utils/animation.ts` exporting:
    - `SPRING_TRANSITION` — `{ type: 'spring', stiffness: 300, damping: 25 }` (state-change default)
    - `EASE_OUT_TRANSITION` — `{ duration: 0.3, ease: 'easeOut' }` (navigational default)
    - `REDUCED_MOTION_TRANSITION` — `{ duration: 0 }` (reduced motion override)
    - `getTransition(shouldReduceMotion: boolean, type: 'spring' | 'easeOut')` helper
  - Create `cohortle-web/src/lib/utils/iconWeights.ts` exporting the state→weight mapping constants
  - _Requirements: 1.5, 10.1, 10.5_

  - [x]* 1.1 Write property test for animation duration bounds
    - **Property 7: Animation durations are within bounds**
    - Assert all exported transition constants have `duration` values between 0.2s and 0.8s (or are spring type with no explicit duration exceeding bounds)
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 2. Update `LessonListItem.tsx` — lock/unlock animation
  - Replace `@heroicons/react` imports with Phosphor equivalents (`LockSimple`, `CheckCircle`, and lesson-type icons)
  - Wrap the status icon in `<motion.div layoutId={`lesson-icon-${lesson.id}`}>` with `AnimatePresence`
  - Apply `weight="thin"` when `isLocked`, `weight="fill"` when `isCompleted`, `weight="regular"` otherwise
  - Apply `opacity-50` class when `isLocked`, full opacity otherwise
  - Use `useReducedMotion()` from `motion/react` and pass `REDUCED_MOTION_TRANSITION` when true
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 2.1 Write property test for icon weight state mapping
    - **Property 1: Icon weight is determined by state, not by component**
    - Generate arbitrary `{ isLocked, isCompleted }` combinations; assert rendered weight matches mapping
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

  - [ ]* 2.2 Write property test for locked state opacity
    - **Property 10: Locked state opacity is a pure function of lock status**
    - Generate arbitrary lesson items with `isLocked` true/false; assert opacity class matches
    - **Validates: Requirements 2.6, 2.7**

- [x] 3. Create `ProgressRing` component and update `CompletionButton.tsx`
  - Create `cohortle-web/src/components/lessons/ProgressRing.tsx` with props `{ percentage, size?, strokeWidth?, colour? }`
  - Animate `strokeDashoffset` via `motion` from current to new value using `SPRING_TRANSITION`
  - In `CompletionButton.tsx`: import `ProgressRing`, replace inline SVG check with Phosphor `CheckCircle`
  - Add `motion.button` wrapper with scale pulse animation (`initial: 1.0 → 1.1 → 1.0`) on completion
  - Use `useReducedMotion()` and skip all animations when true
  - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 3.1 Write property test for ProgressRing strokeDashoffset
    - **Property 9: ProgressRing strokeDashoffset is a pure function of percentage**
    - Generate arbitrary percentages in [0, 100]; assert `strokeDashoffset = circumference * (1 - pct/100)`
    - **Validates: Requirements 3.2**

  - [ ]* 3.2 Write property test for reduced motion suppression
    - **Property 5: Reduced motion suppresses all animation durations**
    - Mock `useReducedMotion` to return `true`; render `CompletionButton` and `ProgressRing`; assert no non-zero transition duration is applied
    - **Validates: Requirements 2.5, 3.5, 9.2, 9.5**

  - [ ]* 3.3 Write property test for visual state preservation under reduced motion
    - **Property 6: Reduced motion preserves visual state changes**
    - For each state (incomplete, complete), render with reduced motion on and off; assert final className/icon weight is identical
    - **Validates: Requirements 9.3**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create `StreakCounter` component and add to `LearnerNavBar.tsx`
  - Create `cohortle-web/src/components/navigation/StreakCounter.tsx` with props `{ streakDays: number }`
  - Implement three visual tiers based on `streakDays` range (1–6: regular/orange, 7–29: bold/orange-600, 30+: fill/Brand_Purple + glow)
  - Use Phosphor `Fire` icon with the appropriate weight per tier
  - Add `motion.div` wrapper with `whileHover` and `whileTap` props; disable when `useReducedMotion()` is true
  - Add accessible label: `aria-label={`${streakDays}-day learning streak`}`
  - Import and render `StreakCounter` in `LearnerNavBar.tsx` in the right-side user menu area
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 5.1 Write property test for streak visual tier mapping
    - **Property 2: Streak visual tier is a pure function of streak count**
    - Generate arbitrary `streakDays` integers (0–365); assert rendered icon weight and colour class match the expected tier
    - **Validates: Requirements 4.4, 4.5, 4.6, 4.8**

  - [ ]* 5.2 Write unit tests for streak tier boundary values
    - Test exact boundary values: 0, 1, 6, 7, 29, 30, 365
    - Assert correct weight and colour at each boundary
    - _Requirements: 4.4, 4.5, 4.6_

- [x] 6. Update `AchievementsBadges.tsx` and `EnhancedAchievementsBadges.tsx` — badge system
  - Create `cohortle-web/src/components/profile/AchievementBadgeIcon.tsx` with props `{ category?: string, rarity?: string }`
  - Implement category→icon mapping (completion→CheckCircle, streak→Fire, community→Users, milestone→Trophy, learning→BookOpen, speed→Lightning, consistency→CalendarCheck, first→Star, _default→Medal)
  - Implement rarity→weight mapping (common→regular, rare→bold, epic→duotone, legendary→fill)
  - Wrap badge card in `motion.div` with entrance animation (`scale: 0.8→1.0, opacity: 0→1`) using `AnimatePresence`
  - Replace `{achievement.icon}` emoji rendering in both badge components with `<AchievementBadgeIcon>`
  - Use `useReducedMotion()` and skip entrance animation when true
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 6.1 Write property test for badge icon category mapping
    - **Property 3: Achievement badge icon is determined by category**
    - Generate arbitrary category strings (including unknown); assert icon component matches mapping, unknown falls back to Medal
    - **Validates: Requirements 5.2, 5.7**

  - [ ]* 6.2 Write property test for badge weight rarity mapping
    - **Property 4: Achievement badge weight is determined by rarity**
    - Generate arbitrary rarity values (including undefined); assert icon weight matches mapping
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6**

- [x] 7. Update `OnboardingTips.tsx` and `EnhancedEmptyState.tsx` — icon and illustration
  - Update `OnboardingTip` interface: change `icon: string` to `icon: Icon` (Phosphor Icon type)
  - Update `DEFAULT_ONBOARDING_TIPS` in `OnboardingTips.tsx`: replace emoji strings with Phosphor components (Target, BookOpen, TrendUp, Lightbulb) using `duotone` weight and Brand_Purple colour
  - Wrap tip icon in `<AnimatePresence mode="wait">` with `motion.div` for enter/exit animations
  - In `EnhancedEmptyState.tsx`: replace emoji in headings and encouragement messages with Phosphor icons
  - Add "path ahead" illustration to the no-programmes empty state using composed Phosphor icons (MapTrifold, Student, Flag)
  - Wrap illustration in `motion.div` with fade+translate-up entrance animation
  - Use `useReducedMotion()` throughout; skip all animations when true
  - _Requirements: 1.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.1 Write unit test for DEFAULT_ONBOARDING_TIPS icon type
    - **Property 8: Onboarding tip icon is a Phosphor component, not a string**
    - Assert each entry in DEFAULT_ONBOARDING_TIPS has `icon` as a function, not a string
    - **Validates: Requirements 7.1**

  - [ ]* 7.2 Write property test for onboarding icon colour
    - Assert OnboardingTips renders tip icons with Brand_Purple colour prop (`#391D65`) for any tip data
    - **Validates: Requirements 1.6, 7.2**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement page transitions on lesson pages
  - In `cohortle-web/src/app/lessons/[lessonId]/page.tsx`, wrap page content in `<AnimatePresence mode="wait">`
  - Add `motion.div` with directional slide animation: forward navigation slides left, backward slides right
  - Use `EASE_OUT_TRANSITION` (0.3s ease-out) for page transitions
  - Determine navigation direction by comparing lesson order index from the lesson list
  - Ensure `pointer-events` are not disabled during transition (no `pointer-events: none` on the incoming page)
  - Use `useReducedMotion()` and skip transition when true
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 9.1 Write unit test for page transition direction logic
    - Test that forward navigation (higher index) produces `x: '100%'` initial and backward produces `x: '-100%'`
    - _Requirements: 8.1, 8.3_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All property tests use `fast-check` (`npm install --save-dev fast-check`) with minimum 100 iterations
- `useReducedMotion()` is imported from `motion/react` — it reads `prefers-reduced-motion` automatically
- The `icon: string` field on `Achievement` is retained in the data model for API compatibility; the renderer ignores it and derives the icon from `category` instead
- Phosphor icon components must have `aria-hidden="true"` when decorative, or an `aria-label` when semantic
