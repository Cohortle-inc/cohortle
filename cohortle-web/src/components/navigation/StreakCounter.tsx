'use client';

import { Fire } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';

interface StreakCounterProps {
  streakDays: number;
}

interface StreakTier {
  weight: 'regular' | 'bold' | 'fill';
  colour: string;
  style?: React.CSSProperties;
}

function getStreakTier(streakDays: number): StreakTier {
  if (streakDays >= 30) {
    return {
      weight: 'fill',
      colour: '#391D65',
      style: { filter: 'drop-shadow(0 0 6px rgba(57, 29, 101, 0.6))' },
    };
  }
  if (streakDays >= 7) {
    return {
      weight: 'bold',
      colour: '#EA580C',
    };
  }
  // 0, 1–6 days
  return {
    weight: 'regular',
    colour: '#F97316',
  };
}

export function StreakCounter({ streakDays }: StreakCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const tier = getStreakTier(streakDays);

  return (
    <motion.div
      className="flex items-center gap-1 cursor-default select-none"
      whileHover={shouldReduceMotion ? {} : { scale: 1.05, filter: 'brightness(1.1)' }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      aria-label={`${streakDays}-day learning streak`}
    >
      <Fire
        weight={tier.weight}
        size={20}
        color={tier.colour}
        style={tier.style}
        aria-hidden="true"
      />
      <span className="text-sm font-medium" style={{ color: tier.colour }}>
        {streakDays}
      </span>
    </motion.div>
  );
}
