/**
 * Property-Based Test: Animation Duration Bounds
 *
 * Feature: gamified-learner-visual-experience
 * Property 7: Animation durations are within bounds
 *
 * Validates: Requirements 10.1, 10.2, 10.3
 *
 * All transition constants exported from animation.ts must have duration values
 * between 0.2s and 0.8s (inclusive), OR be spring-type transitions (which are
 * governed by physics, not explicit duration). The REDUCED_MOTION_TRANSITION
 * is exempt as it is intentionally 0s.
 */

import * as fc from 'fast-check';
import {
  SPRING_TRANSITION,
  EASE_OUT_TRANSITION,
  REDUCED_MOTION_TRANSITION,
  getTransition,
} from '../../src/lib/utils/animation';

const MIN_DURATION_S = 0.2;
const MAX_DURATION_S = 0.8;

describe('Animation Duration Bounds — Property 7', () => {
  // Unit assertions on the exported constants themselves

  it('SPRING_TRANSITION is a spring type (no explicit duration constraint applies)', () => {
    expect(SPRING_TRANSITION.type).toBe('spring');
  });

  it('EASE_OUT_TRANSITION duration is within [0.2, 0.8] seconds', () => {
    expect(EASE_OUT_TRANSITION.duration).toBeGreaterThanOrEqual(MIN_DURATION_S);
    expect(EASE_OUT_TRANSITION.duration).toBeLessThanOrEqual(MAX_DURATION_S);
  });

  it('REDUCED_MOTION_TRANSITION duration is 0 (intentional exemption)', () => {
    expect(REDUCED_MOTION_TRANSITION.duration).toBe(0);
  });

  // Property: getTransition with shouldReduceMotion=false always returns a valid transition
  it('getTransition(false, "easeOut") returns EASE_OUT_TRANSITION with duration in bounds', () => {
    const t = getTransition(false, 'easeOut') as typeof EASE_OUT_TRANSITION;
    expect(t.duration).toBeGreaterThanOrEqual(MIN_DURATION_S);
    expect(t.duration).toBeLessThanOrEqual(MAX_DURATION_S);
  });

  it('getTransition(false, "spring") returns SPRING_TRANSITION (spring type)', () => {
    const t = getTransition(false, 'spring') as typeof SPRING_TRANSITION;
    expect(t.type).toBe('spring');
  });

  it('getTransition(true, ...) always returns REDUCED_MOTION_TRANSITION with duration 0', () => {
    // Property: for any transition type, reduced motion always yields duration 0
    // Feature: gamified-learner-visual-experience, Property 7: animation durations are within bounds
    fc.assert(
      fc.property(
        fc.constantFrom('spring' as const, 'easeOut' as const),
        (type) => {
          const t = getTransition(true, type) as typeof REDUCED_MOTION_TRANSITION;
          return t.duration === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getTransition(false, type) never returns a transition with explicit duration outside [0.2, 0.8]', () => {
    // Property: non-reduced-motion transitions either have no explicit duration (spring)
    // or have a duration within the allowed range.
    // Feature: gamified-learner-visual-experience, Property 7: animation durations are within bounds
    fc.assert(
      fc.property(
        fc.constantFrom('spring' as const, 'easeOut' as const),
        (type) => {
          const t = getTransition(false, type) as Record<string, unknown>;
          if ('duration' in t && typeof t.duration === 'number') {
            return t.duration >= MIN_DURATION_S && t.duration <= MAX_DURATION_S;
          }
          // Spring transitions have no explicit duration — governed by physics
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
