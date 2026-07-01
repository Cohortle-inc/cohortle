'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SPRING_TRANSITION, REDUCED_MOTION_TRANSITION } from '@/lib/utils/animation';

interface ProgressRingProps {
  percentage: number; // 0–100
  size?: number;      // px, default 48
  strokeWidth?: number; // default 4
  colour?: string;    // hex, default '#391D65'
}

export function ProgressRing({
  percentage,
  size = 48,
  strokeWidth = 4,
  colour = '#391D65',
}: ProgressRingProps) {
  const shouldReduceMotion = useReducedMotion();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* Animated progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colour}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset }}
        transition={shouldReduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_TRANSITION}
        style={{ rotate: -90, transformOrigin: 'center' }}
      />
    </svg>
  );
}
