import type { IconWeight } from '@phosphor-icons/react';

/**
 * Single source of truth for the icon weight → semantic state mapping.
 * All components in the Visual_System MUST use this mapping to ensure
 * consistent icon weights across the entire UI (Requirement 1.5).
 *
 * | Semantic State        | Icon Weight | Example                          |
 * |-----------------------|-------------|----------------------------------|
 * | Locked / unavailable  | thin        | Locked lesson                    |
 * | Inactive / unstarted  | light       | Unstarted lesson type icon       |
 * | Default / active      | regular     | Nav icons, default state         |
 * | Emphasis / hover      | bold        | Hovered state                    |
 * | Completed / selected  | fill        | Completed lesson, active nav     |
 * | Special / decorative  | duotone     | Onboarding tips, epic badges     |
 */
export const ICON_WEIGHT_MAP = {
  locked: 'thin' as IconWeight,
  inactive: 'light' as IconWeight,
  default: 'regular' as IconWeight,
  emphasis: 'bold' as IconWeight,
  completed: 'fill' as IconWeight,
  decorative: 'duotone' as IconWeight,
} as const;

export type IconWeightState = keyof typeof ICON_WEIGHT_MAP;
