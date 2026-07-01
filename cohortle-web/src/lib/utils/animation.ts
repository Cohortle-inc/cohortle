/**
 * Shared animation transition constants for the gamified learner visual experience.
 * All durations are in seconds (Motion convention).
 *
 * Duration constraints (Requirement 10):
 * - State-change animations: spring physics (no explicit duration cap needed, damping controls it)
 * - Navigational animations: 0.3s ease-out
 * - Reduced motion override: 0s (instantaneous)
 */

/** Spring physics transition — used for all state-change animations (lock/unlock, completion, badges). */
export const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

/** Ease-out transition — used for directional/navigational animations (page transitions). */
export const EASE_OUT_TRANSITION = {
  duration: 0.3,
  ease: 'easeOut' as const,
};

/** Reduced motion override — applied when `prefers-reduced-motion: reduce` is detected. */
export const REDUCED_MOTION_TRANSITION = {
  duration: 0,
};

/**
 * Returns the appropriate transition based on the user's reduced-motion preference.
 *
 * @param shouldReduceMotion - `true` when `prefers-reduced-motion: reduce` is active
 * @param type - `'spring'` for state-change animations, `'easeOut'` for navigational animations
 */
export function getTransition(
  shouldReduceMotion: boolean,
  type: 'spring' | 'easeOut'
): typeof SPRING_TRANSITION | typeof EASE_OUT_TRANSITION | typeof REDUCED_MOTION_TRANSITION {
  if (shouldReduceMotion) {
    return REDUCED_MOTION_TRANSITION;
  }
  return type === 'spring' ? SPRING_TRANSITION : EASE_OUT_TRANSITION;
}
