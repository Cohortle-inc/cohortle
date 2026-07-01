'use client';

import {
  CheckCircle,
  Fire,
  Users,
  Trophy,
  BookOpen,
  Lightning,
  CalendarCheck,
  Star,
  Medal,
} from '@phosphor-icons/react';
import type { Icon, IconWeight } from '@phosphor-icons/react';

interface AchievementBadgeIconProps {
  category?: string;
  rarity?: string;
  size?: number;
  className?: string;
}

const CATEGORY_ICON_MAP: Record<string, Icon> = {
  completion: CheckCircle,
  streak: Fire,
  community: Users,
  milestone: Trophy,
  learning: BookOpen,
  speed: Lightning,
  consistency: CalendarCheck,
  first: Star,
};

const RARITY_WEIGHT_MAP: Record<string, IconWeight> = {
  common: 'regular',
  rare: 'bold',
  epic: 'duotone',
  legendary: 'fill',
};

export default function AchievementBadgeIcon({
  category,
  rarity,
  size = 32,
  className,
}: AchievementBadgeIconProps) {
  const IconComponent = (category && CATEGORY_ICON_MAP[category]) || Medal;
  const weight: IconWeight = (rarity && RARITY_WEIGHT_MAP[rarity]) || 'regular';

  return (
    <IconComponent
      weight={weight}
      size={size}
      aria-hidden="true"
      className={className}
    />
  );
}
