# Design Document: Gamified Learner Visual Experience

## Overview

This design replaces the emoji-based visual language in Cohortle's learner-facing UI with a cohesive system built on two libraries: **Phosphor Icons** (`@phosphor-icons/react`) for iconography and **Motion** (`motion`) for animations. The guiding metaphor is "learning as a story arc" — every visual interaction should reinforce that the learner is a protagonist moving through chapters.

The implementation touches seven existing components and introduces one new utility hook. No new routes or API endpoints are required. All changes are purely presentational.

---

## Architecture

### Library Choices

**Phosphor Icons (`@phosphor-icons/react`)**
- Tree-shakeable React components, one import per icon
- Six weight variants per icon: `thin`, `light`, `regular`, `bold`, `fill`, `duotone`
- Weight variants are used semantically to convey state (locked = thin, completed = fill)
- Install: `npm install @phosphor-icons/react`

**Motion (`motion`)**
- The `motion` package is the current name for Framer Motion's standalone export
- Used for: `motion.div`, `motion.button`, `AnimatePresence`, `layoutId` morphing, `useReducedMotion`
- Install: `npm install motion` (already likely present as `framer-motion`; check `package.json`)
- Key APIs used:
  - `motion.div` / `motion.button` — animated HTML elements
  - `AnimatePresence` — handles mount/unmount animations
  - `layoutId` — shared layout animations for lock→unlock morphing
  - `useReducedMotion()` — hook that returns `true` when `prefers-reduced-motion: reduce` is set
  - `whileHover` / `whileTap` — gesture-driven animation states

### Reduced Motion Strategy

A single custom hook `useReducedMotion` (re-exported from Motion) is used across all animated components. When it returns `true`, all `transition` props are replaced with `{ duration: 0 }` and spring animations are skipped. Visual state changes (colour, weight, opacity) still apply — only motion is suppressed.

```typescript
// Pattern used throughout all animated components
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 };
```

### Icon Weight → State Mapping

This mapping is the single source of truth for the entire Visual_System. It MUST be consistent across all components.

| Semantic State | Icon Weight | Example |
|---|---|---|
| Locked / unavailable | `thin` | Locked lesson |
| Inactive / unstarted | `light` | Unstarted lesson type icon |
| Default / active | `regular` | Nav icons, default state |
| Emphasis / hover | `bold` | Hovered state |
| Completed / selected | `fill` | Completed lesson, active nav |
| Special / decorative | `duotone` | Onboarding tips, epic badges |

---

## Components and Interfaces

### 1. `useReducedMotion` hook

Re-exported from `motion`. Used in every animated component.

```typescript
import { useReducedMotion } from 'motion/react';
```

### 2. `LessonListItem.tsx` — Lock/Unlock Animation

Replace `@heroicons/react` imports with Phosphor equivalents. Add `motion` wrapper around the lock icon with `layoutId` for shared layout transition.

**Key changes:**
- Import `LockSimple`, `CheckCircle`, and lesson-type icons from `@phosphor-icons/react`
- Wrap the status icon container in `<motion.div layoutId={`lesson-status-${lesson.id}`}>`
- Use `AnimatePresence` to handle the locked→unlocked transition
- Apply `weight="thin"` when locked, `weight="fill"` when completed

```tsx
// Locked state
<motion.div layoutId={`lesson-icon-${lesson.id}`} key="locked">
  <LockSimple weight="thin" className="w-5 h-5 text-gray-300" />
</motion.div>

// Unlocked/completed state  
<motion.div layoutId={`lesson-icon-${lesson.id}`} key="unlocked">
  <CheckCircle weight="fill" className="w-6 h-6 text-[#391D65]" />
</motion.div>
```

### 3. `CompletionButton.tsx` — Completion Moment

Replace the inline SVG check with a Phosphor `CheckCircle` icon. Add spring animation on the button itself and a `ProgressRing` sub-component.

**New sub-component: `ProgressRing`**

```tsx
interface ProgressRingProps {
  percentage: number; // 0–100
  size?: number;      // px, default 48
  strokeWidth?: number; // default 4
}
```

SVG circle with `strokeDashoffset` animated via Motion from current to new value using spring easing.

**CompletionButton animation sequence (600ms total):**
1. `0ms` — Button scale pulse begins (1.0 → 1.1)
2. `100ms` — Progress ring starts filling
3. `300ms` — Button scale settles (1.1 → 1.0)
4. `300ms` — Icon morphs from `regular` circle to `fill` check
5. `600ms` — All animations complete

### 4. `LearnerNavBar.tsx` — Streak Counter

Add a `StreakCounter` component rendered in the nav bar's right section, before the user name.

**`StreakCounter` component interface:**

```tsx
interface StreakCounterProps {
  streakDays: number;
}
```

**Visual states:**

| Range | Icon | Weight | Colour |
|---|---|---|---|
| 1–6 days | `Fire` | `regular` | `#F97316` (orange-500) |
| 7–29 days | `Fire` | `bold` | `#EA580C` (orange-600) |
| 30+ days | `Fire` | `fill` | `#391D65` + CSS `drop-shadow` glow |

Motion props:
```tsx
<motion.div
  whileHover={shouldReduceMotion ? {} : { scale: 1.05, filter: 'brightness(1.1)' }}
  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
```

### 5. `AchievementsBadges.tsx` + `EnhancedAchievementsBadges.tsx` — Badge System

Replace the `icon: string` (emoji) field rendering with a `<AchievementBadgeIcon>` component.

**Category → Icon mapping:**

| Category | Phosphor Icon |
|---|---|
| `completion` | `CheckCircle` |
| `streak` | `Fire` |
| `community` | `Users` |
| `milestone` | `Trophy` |
| `learning` | `BookOpen` |
| `speed` | `Lightning` |
| `consistency` | `CalendarCheck` |
| `first` | `Star` |
| `_default` | `Medal` |

**Rarity → Weight + Style mapping:**

| Rarity | Weight | Border | Background |
|---|---|---|---|
| `common` | `regular` | `border-gray-300` | `bg-white` |
| `rare` | `bold` | `border-blue-400` | `bg-blue-50` |
| `epic` | `duotone` | `border-purple-400` | `bg-purple-50` |
| `legendary` | `fill` | `border-yellow-400` + glow | `bg-gradient-to-br from-yellow-50 to-orange-50` |

Entrance animation (on mount, via `AnimatePresence`):
```tsx
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 20, duration: 0.5 }}
```

### 6. `EnhancedEmptyState.tsx` — Empty State Illustration

Replace emoji in headings and the onboarding overlay with Phosphor icons. Add a composed SVG "path ahead" illustration for the no-programmes state.

**"Path ahead" illustration composition:**
- A `MapTrifold` icon (large, Brand_Purple) as the background element
- A `Student` icon (medium, Brand_Purple) positioned left — the learner
- A `Flag` icon (medium, Light_Accent fill) positioned right — the destination
- A dotted SVG path connecting them

This is composed as a single `<div>` with absolutely positioned Phosphor icons, not a custom SVG file.

**Entrance animation:**
```tsx
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
```

### 7. `OnboardingTips.tsx` — Tip Icon Animation

Replace the `icon: string` field rendering with a Phosphor icon component. The `OnboardingTip` interface's `icon` field changes from `string` (emoji) to a Phosphor icon component type.

**Updated `OnboardingTip` interface:**
```typescript
import type { Icon } from '@phosphor-icons/react';

interface OnboardingTip {
  id: string;
  title: string;
  content: string;
  icon: Icon; // Phosphor icon component, replaces emoji string
  action?: { label: string; href: string; };
}
```

**Default tips icon mapping:**
- `welcome` → `Target` (duotone, Brand_Purple)
- `join-programmes` → `BookOpen` (duotone, Brand_Purple)
- `track-progress` → `TrendUp` (duotone, Brand_Purple)
- `get-help` → `Lightbulb` (duotone, Brand_Purple)

**Tip transition animation (AnimatePresence with `mode="wait"`):**
```tsx
// Outgoing tip icon
exit={{ scale: 0.7, opacity: 0 }}

// Incoming tip icon
initial={{ scale: 0.7, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: 'spring', stiffness: 300, damping: 22, duration: 0.35 }}
```

### 8. Page Transitions

Wrap lesson page content in a `<motion.div>` with `AnimatePresence`. Direction (forward/backward) is determined by comparing lesson order indices.

```tsx
// Forward navigation (next lesson)
initial={{ x: '100%', opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
exit={{ x: '-100%', opacity: 0 }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Backward navigation (previous lesson)
initial={{ x: '-100%', opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
exit={{ x: '100%', opacity: 0 }}
transition={{ duration: 0.3, ease: 'easeOut' }}
```

The page content is interactive immediately on mount — no `pointer-events: none` during transition.

---

## Data Models

### Updated `OnboardingTip` interface

```typescript
import type { Icon } from '@phosphor-icons/react';

interface OnboardingTip {
  id: string;
  title: string;
  content: string;
  icon: Icon;           // Changed from string (emoji) to Phosphor Icon component
  action?: {
    label: string;
    href: string;
  };
}
```

### Updated `Achievement` interface (both badge components)

No schema change — the `icon: string` field is retained in the data model for backward compatibility but is **ignored** by the rendering layer. The Visual_System derives the icon from `category` and `rarity` instead.

```typescript
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;          // Retained for API compatibility, ignored by renderer
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;     // Used to select Phosphor icon
}
```

### `StreakData` (new, passed as prop to `StreakCounter`)

```typescript
interface StreakData {
  currentStreak: number;  // Days
  longestStreak: number;  // Days (for tooltip)
  lastActiveDate: string; // ISO date string
}
```

### `ProgressRingProps`

```typescript
interface ProgressRingProps {
  percentage: number;    // 0–100, current fill level
  size?: number;         // px diameter, default 48
  strokeWidth?: number;  // px, default 4
  colour?: string;       // hex, default '#391D65'
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Icon weight is determined by state, not by component

*For any* lesson item, the icon weight rendered SHALL be a pure function of its state (`locked`, `unlocked`, `completed`) — rendering the same component twice with the same state SHALL always produce the same icon weight.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

---

### Property 2: Streak visual tier is a pure function of streak count

*For any* streak count value `n`, the visual tier (icon weight + colour) rendered by `StreakCounter` SHALL be determined solely by `n` — the same count SHALL always produce the same visual output regardless of render order or timing.

**Validates: Requirements 4.4, 4.5, 4.6, 4.8**

---

### Property 3: Achievement badge icon is determined by category

*For any* achievement with a given `category`, the Phosphor icon rendered SHALL correspond to that category's mapping — two achievements with the same category SHALL render the same icon, and two achievements with different categories SHALL render different icons.

**Validates: Requirements 5.2, 5.7**

---

### Property 4: Achievement badge weight is determined by rarity

*For any* achievement with a given `rarity`, the icon weight rendered SHALL correspond to that rarity's mapping — two achievements with the same rarity SHALL render the same icon weight.

**Validates: Requirements 5.3, 5.4, 5.5, 5.6**

---

### Property 5: Reduced motion suppresses all animation durations

*For any* animated component in this feature, when `useReducedMotion()` returns `true`, the effective animation duration SHALL be 0ms — no component SHALL apply a non-zero `transition.duration` when reduced motion is active.

**Validates: Requirements 2.5, 3.5, 4.7, 5.9, 6.5, 7.5, 8.4, 9.2, 9.5**

---

### Property 6: Reduced motion preserves visual state changes

*For any* state change (locked→unlocked, incomplete→complete, streak tier change), when `useReducedMotion()` returns `true`, the final visual state (icon weight, colour, opacity) SHALL be identical to the state that would be reached after the animation completes with motion enabled.

**Validates: Requirements 9.3**

---

### Property 7: Animation durations are within bounds

*For any* single animation defined in this feature, its configured duration SHALL be ≥ 200ms and ≤ 800ms (excluding reduced-motion overrides which are 0ms).

**Validates: Requirements 10.1, 10.2, 10.3**

---

### Property 8: Onboarding tip icon is a Phosphor component, not a string

*For any* `OnboardingTip` object in `DEFAULT_ONBOARDING_TIPS`, the `icon` field SHALL be a valid Phosphor icon component (a React component function) — it SHALL NOT be a string or emoji character.

**Validates: Requirements 7.1**

---

### Property 9: ProgressRing strokeDashoffset is a pure function of percentage

*For any* `percentage` value between 0 and 100, the `strokeDashoffset` rendered by `ProgressRing` SHALL equal `circumference * (1 - percentage / 100)` — the same percentage SHALL always produce the same offset value.

**Validates: Requirements 3.2**

---

### Property 10: Locked state opacity is a pure function of lock status

*For any* lesson item, when `isLocked` is `true` the rendered element SHALL have reduced opacity (0.5), and when `isLocked` is `false` the rendered element SHALL have full opacity (1.0) — the opacity SHALL be determined solely by the lock status.

**Validates: Requirements 2.6, 2.7**

---

## Error Handling

**Missing `category` on Achievement**: Fall back to the `_default` icon (`Medal`, `regular` weight). Never throw or render nothing.

**Missing `rarity` on Achievement**: Treat as `common`. The existing `getRarityColor` logic already handles this.

**`streakDays` is 0 or undefined**: Render the `StreakCounter` with a `regular`-weight `Fire` icon and count "0" — do not hide the counter, as hiding it would be confusing.

**Motion library not available**: All Motion components degrade gracefully — if `motion` is not installed, the components should still render their final visual state without animation. This is handled by the `duration: 0` fallback pattern.

**`layoutId` collision**: Each `layoutId` MUST include the lesson's unique `id` to prevent cross-component collisions (e.g., `lesson-icon-${lesson.id}`).

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. Unit tests cover specific examples and edge cases; property tests verify universal correctness across all inputs.

### Property-Based Testing Library

Use **fast-check** (`npm install --save-dev fast-check`) for all property-based tests. Each property test runs a minimum of 100 iterations.

Tag format: `Feature: gamified-learner-visual-experience, Property {N}: {property_text}`

### Property Tests

Each correctness property above maps to one property-based test:

**Property 1** — Generate arbitrary `{ isLocked, isCompleted }` state combinations. Assert the rendered icon weight matches the expected mapping. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 1: icon weight is determined by state`

**Property 2** — Generate arbitrary `streakDays` integers (0–365). Assert the rendered tier (weight + colour class) matches the expected range mapping. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 2: streak visual tier is a pure function of streak count`

**Property 3** — Generate arbitrary `category` strings (including unknown categories). Assert the rendered icon component matches the category→icon mapping, with unknown categories falling back to `Medal`. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 3: achievement badge icon is determined by category`

**Property 4** — Generate arbitrary `rarity` values (including `undefined`). Assert the rendered icon weight matches the rarity→weight mapping. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 4: achievement badge weight is determined by rarity`

**Property 5** — For each animated component, render with `useReducedMotion` mocked to return `true`. Assert no `transition.duration` value exceeds 0. Run 100+ iterations with varied prop inputs.
`// Feature: gamified-learner-visual-experience, Property 5: reduced motion suppresses all animation durations`

**Property 6** — For each state transition, render with reduced motion enabled and disabled. Assert the final rendered visual state (className, icon weight) is identical in both cases. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 6: reduced motion preserves visual state changes`

**Property 7** — Statically assert all `transition` objects defined in component source have `duration` values between 0.2 and 0.8 (seconds). This can be a unit test that imports and inspects the transition constants.
`// Feature: gamified-learner-visual-experience, Property 7: animation durations are within bounds`

**Property 8** — Assert each entry in `DEFAULT_ONBOARDING_TIPS` has an `icon` field that is a function (React component), not a string. Run as a unit test (deterministic, no randomisation needed).
`// Feature: gamified-learner-visual-experience, Property 8: onboarding tip icon is a Phosphor component`

**Property 9** — Generate arbitrary `percentage` values in [0, 100]. Assert `ProgressRing`'s rendered `strokeDashoffset` equals `circumference * (1 - percentage / 100)`. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 9: ProgressRing strokeDashoffset is a pure function of percentage`

**Property 10** — Generate arbitrary lesson items with `isLocked` set to `true` or `false`. Assert the rendered opacity class is `opacity-50` when locked and no opacity reduction when unlocked. Run 100+ iterations.
`// Feature: gamified-learner-visual-experience, Property 10: locked state opacity is a pure function of lock status`

### Unit Tests

- `StreakCounter` renders correct tier for boundary values: 0, 1, 6, 7, 29, 30, 365
- `AchievementBadgeIcon` renders fallback icon for unknown category
- `CompletionButton` shows completed state after `markComplete` resolves
- `LessonListItem` renders lock icon when `isLocked=true`, no lock icon when `isLocked=false`
- `OnboardingTips` renders without crashing when `tips` array is empty
- `ProgressRing` renders correct `strokeDashoffset` for 0%, 50%, 100%

### Accessibility Tests

- All Phosphor icons used decoratively have `aria-hidden="true"`
- All Phosphor icons used semantically have an `aria-label`
- `StreakCounter` has an accessible label (e.g., "7-day learning streak")
- `CompletionButton` completed state has `role="status"` and `aria-live="polite"`
