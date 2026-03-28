# Requirements Document

## Introduction

The Cohortle learning platform currently uses emoji characters (🎯 📚 📈 💡 🎉 👋 🌟) as design elements across onboarding tips, empty states, achievement badges, and encouragement messages. This feature replaces that approach with an intentional visual design system built on Phosphor Icons (React) and Motion (Framer Motion) animations.

The core concept is "learning as a story arc" — the learner is the protagonist moving through chapters, not ticking a checklist. Every visual and interaction should reinforce that something is happening *to* them, not just *for* them.

## Glossary

- **Visual_System**: The complete set of icon, animation, and illustration conventions defined by this feature
- **Phosphor_Icons**: The `@phosphor-icons/react` library used for all iconography
- **Motion**: The `motion` package (Framer Motion) used for all animations and transitions
- **Icon_Weight**: A Phosphor icon rendering variant — one of: `thin`, `light`, `regular`, `bold`, `fill`, `duotone`
- **Locked_State**: A lesson or week that is not yet available to the learner
- **Unlocked_State**: A lesson or week that has become available to the learner
- **Completion_Moment**: The instant a learner marks a lesson as complete
- **Progress_Ring**: A circular SVG element that fills to represent lesson or week completion percentage
- **Streak**: The count of consecutive days a learner has engaged with the platform
- **Streak_Counter**: The persistent UI element in the navigation bar displaying the current streak
- **Achievement_Badge**: A visual representation of an earned achievement, composed of a Phosphor icon and rarity-tier styling
- **Rarity_Tier**: One of four achievement levels — `common`, `rare`, `epic`, `legendary`
- **Empty_State**: A UI view shown when a learner has no enrolled programmes or no content in a section
- **Onboarding_Modal**: The modal dialog shown to first-time or returning learners with platform tips
- **Page_Transition**: The animated handoff between lesson pages or major route changes
- **Reduced_Motion**: The `prefers-reduced-motion: reduce` CSS media query indicating the user has requested minimal animation
- **Brand_Purple**: The primary brand colour `#391D65`
- **Light_Accent**: The secondary brand colour `#ECDCFF`

---

## Requirements

### Requirement 1: Icon System — Replace Emojis with Phosphor Icons

**User Story:** As a learner, I want the platform to use consistent, purposeful icons instead of emojis, so that the visual language feels professional and intentional.

#### Acceptance Criteria

1. THE Visual_System SHALL use Phosphor_Icons exclusively for all iconographic elements, replacing all emoji characters in `OnboardingTips`, `EnhancedEmptyState`, `AchievementsBadges`, and `EnhancedAchievementsBadges`
2. WHEN an element represents a Locked_State, THE Visual_System SHALL render its icon using the `thin` or `light` Icon_Weight
3. WHEN an element represents an Unlocked_State or active state, THE Visual_System SHALL render its icon using the `regular` or `bold` Icon_Weight
4. WHEN an element represents a completed state, THE Visual_System SHALL render its icon using the `fill` Icon_Weight
5. THE Visual_System SHALL apply Icon_Weight variants consistently — the same semantic state SHALL always use the same weight across all components
6. WHERE an icon is used in the `OnboardingTips` component, THE Visual_System SHALL render it in Brand_Purple (`#391D65`)

---

### Requirement 2: Lesson Lock/Unlock Animation

**User Story:** As a learner, I want to see a satisfying visual transition when a lesson becomes available, so that unlocking feels like a meaningful moment in my journey.

#### Acceptance Criteria

1. WHEN a lesson transitions from Locked_State to Unlocked_State, THE Visual_System SHALL animate the transition using Motion's `layoutId` prop to morph the locked icon into the unlocked icon
2. WHEN the lock/unlock animation plays, THE Visual_System SHALL use a spring physics easing (not a linear or ease-in-out curve)
3. WHEN the lock/unlock animation plays, THE Visual_System SHALL complete within 400ms
4. WHEN the lock/unlock animation plays, THE Visual_System SHALL transition the icon weight from `thin` (locked) to `fill` (unlocked) as part of the animation
5. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL skip the morphing animation and apply the unlocked state immediately without motion
6. WHILE a lesson is in Locked_State, THE Visual_System SHALL render the lesson row with reduced opacity (0.5) and a `thin`-weight lock icon
7. WHILE a lesson is in Unlocked_State, THE Visual_System SHALL render the lesson row at full opacity with no lock icon visible

---

### Requirement 3: Lesson Completion Moment

**User Story:** As a learner, I want completing a lesson to feel rewarding, so that I get a satisfying "dopamine hit" that motivates me to continue.

#### Acceptance Criteria

1. WHEN a learner marks a lesson as complete, THE Visual_System SHALL trigger a spring-physics animation on the `CompletionButton` component lasting no more than 600ms
2. WHEN the Completion_Moment animation plays, THE Visual_System SHALL animate a Progress_Ring filling from its current percentage to the new percentage using spring easing
3. WHEN the Completion_Moment animation plays, THE Visual_System SHALL transform the completion button's icon from a `regular`-weight circle to a `fill`-weight check circle
4. WHEN the Completion_Moment animation plays, THE Visual_System SHALL apply a brief scale pulse (scale up to 1.1, then settle to 1.0) to the completion button
5. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL mark the lesson as complete and update the UI state without playing any animation
6. WHEN the Completion_Moment animation completes, THE Visual_System SHALL leave the button in a visually distinct "completed" state using the `fill` Icon_Weight

---

### Requirement 4: Streak Counter

**User Story:** As a learner, I want to see my learning streak in the navigation bar and have it react to my interactions, so that I feel motivated to maintain my daily habit.

#### Acceptance Criteria

1. THE Streak_Counter SHALL be persistently visible in the `LearnerNavBar` component on all learner-facing pages
2. WHEN a learner hovers over the Streak_Counter on desktop, THE Visual_System SHALL apply a Motion `whileHover` animation (scale: 1.05, slight brightness increase)
3. WHEN a learner taps the Streak_Counter on mobile, THE Visual_System SHALL apply a Motion `whileTap` animation (scale: 0.95)
4. WHEN the Streak count is between 1 and 6 days, THE Visual_System SHALL render the Streak_Counter using a `regular`-weight flame icon in a neutral warm colour
5. WHEN the Streak count is between 7 and 29 days, THE Visual_System SHALL render the Streak_Counter using a `bold`-weight flame icon in an orange colour
6. WHEN the Streak count is 30 or more days, THE Visual_System SHALL render the Streak_Counter using a `fill`-weight flame icon in Brand_Purple with a glow effect
7. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL display the Streak_Counter without hover or tap animations
8. THE Streak_Counter SHALL accurately reflect the streak value provided by the learner's data — it SHALL NOT display a streak count that differs from the data source

---

### Requirement 5: Achievement Badge Visual System

**User Story:** As a learner, I want my achievement badges to have distinct, meaningful visuals based on what I achieved and how rare it is, so that earning a badge feels significant.

#### Acceptance Criteria

1. THE Visual_System SHALL replace the `icon` string field (emoji) in `AchievementsBadges` and `EnhancedAchievementsBadges` with a Phosphor_Icons-based SVG badge
2. WHEN rendering an Achievement_Badge, THE Visual_System SHALL select a Phosphor icon that corresponds to the achievement's `category` field — each category SHALL map to a distinct icon
3. WHEN rendering an Achievement_Badge with `rarity` of `common`, THE Visual_System SHALL use the `regular` Icon_Weight with standard grey border styling
4. WHEN rendering an Achievement_Badge with `rarity` of `rare`, THE Visual_System SHALL use the `bold` Icon_Weight with blue accent styling
5. WHEN rendering an Achievement_Badge with `rarity` of `epic`, THE Visual_System SHALL use the `duotone` Icon_Weight with purple accent styling
6. WHEN rendering an Achievement_Badge with `rarity` of `legendary`, THE Visual_System SHALL use the `fill` Icon_Weight with a gold gradient border and glow effect
7. THE Visual_System SHALL ensure the icon rendered for an Achievement_Badge corresponds to the achievement's `category` — a badge with category "completion" SHALL NOT render the same icon as a badge with category "community"
8. WHEN an Achievement_Badge is first rendered after being earned, THE Visual_System SHALL play a brief entrance animation (scale from 0.8 to 1.0 with spring easing, duration ≤ 500ms)
9. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL render Achievement_Badges without entrance animations

---

### Requirement 6: Empty State Illustrations

**User Story:** As a learner seeing an empty dashboard for the first time, I want to see an illustration that frames my journey as something ahead of me, so that the empty state feels like a beginning rather than a failure.

#### Acceptance Criteria

1. THE Visual_System SHALL replace emoji characters in the `EnhancedEmptyState` component headings and encouragement messages with Phosphor_Icons-based SVG compositions
2. WHEN the `EnhancedEmptyState` is rendered for a learner with no enrolled programmes, THE Visual_System SHALL display a "path ahead" illustration composed of Phosphor icons — representing the learner at the start of a journey with a destination visible ahead
3. WHEN the `EnhancedEmptyState` illustration is rendered, THE Visual_System SHALL use Brand_Purple (`#391D65`) as the primary colour and Light_Accent (`#ECDCFF`) as the background fill
4. WHEN the `EnhancedEmptyState` component mounts, THE Visual_System SHALL animate the illustration into view using a Motion entrance animation (fade + translate-up, duration ≤ 400ms)
5. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL render the Empty_State illustration without entrance animation

---

### Requirement 7: Onboarding Tips Icon Animation

**User Story:** As a new learner seeing the onboarding modal, I want the tip icons to feel alive and welcoming, so that the platform makes a strong first impression.

#### Acceptance Criteria

1. THE Visual_System SHALL replace the emoji `icon` field in `OnboardingTip` objects within `OnboardingTips` and `EnhancedEmptyState` with Phosphor_Icons components
2. WHEN an onboarding tip is displayed, THE Visual_System SHALL render its icon in Brand_Purple (`#391D65`) using the `duotone` Icon_Weight
3. WHEN an onboarding tip enters the view (on mount or tip change), THE Visual_System SHALL animate the icon using a Motion entrance animation (scale from 0.7 to 1.0 with spring easing, duration ≤ 350ms)
4. WHEN the learner navigates to the next tip, THE Visual_System SHALL animate the outgoing icon out (scale to 0.7, fade out) and the incoming icon in (scale from 0.7 to 1.0, fade in)
5. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL display tip icons without entrance or transition animations

---

### Requirement 8: Page Transitions

**User Story:** As a learner navigating between lesson pages, I want the transition to feel like turning a page in a story, so that the sense of progression through content is reinforced.

#### Acceptance Criteria

1. WHEN a learner navigates from one lesson page to another, THE Visual_System SHALL apply a Motion page transition (slide-left for forward navigation, slide-right for backward navigation)
2. WHEN a page transition plays, THE Visual_System SHALL complete within 300ms
3. WHEN a page transition plays, THE Visual_System SHALL use an ease-out curve (not spring) to feel like physical momentum
4. IF the learner has Reduced_Motion enabled, THEN THE Visual_System SHALL perform route changes without any transition animation
5. THE Visual_System SHALL NOT block user interaction during a page transition — the incoming page SHALL be interactive as soon as it is visible

---

### Requirement 9: Accessibility — Reduced Motion

**User Story:** As a learner who has enabled reduced motion in their OS settings, I want all animations to be suppressed, so that I can use the platform without discomfort.

#### Acceptance Criteria

1. THE Visual_System SHALL detect the `prefers-reduced-motion: reduce` media query using a React hook or CSS media query
2. WHEN Reduced_Motion is detected, THE Visual_System SHALL disable all Motion animations across all components defined in this feature
3. WHEN Reduced_Motion is detected, THE Visual_System SHALL still apply all visual state changes (icon weight changes, colour changes, opacity changes) — only motion/animation SHALL be suppressed
4. THE Visual_System SHALL NOT use `setTimeout`-based animation fallbacks as a substitute for proper Reduced_Motion handling
5. WHEN Reduced_Motion is detected, THE Visual_System SHALL apply state changes instantaneously (0ms transition duration)

---

### Requirement 10: Animation Duration Constraints

**User Story:** As a learner, I want all animations to feel snappy and non-blocking, so that the visual polish never gets in the way of my learning.

#### Acceptance Criteria

1. THE Visual_System SHALL constrain all animation durations to between 200ms and 800ms
2. THE Visual_System SHALL NOT use animation durations below 200ms for state-change animations (too fast to perceive as intentional)
3. THE Visual_System SHALL NOT use animation durations above 800ms for any single animation (too slow, blocks interaction perception)
4. WHEN multiple animations play simultaneously (e.g., Completion_Moment), THE Visual_System SHALL stagger them so the total perceived duration does not exceed 800ms
5. THE Visual_System SHALL use spring physics (via Motion's `spring` transition type) for all state-change animations, and ease-out for directional/navigational animations
