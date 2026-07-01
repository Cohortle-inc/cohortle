'use client';

import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  minutes: number;
  onExpire: () => void;
}

/**
 * Displays a MM:SS countdown timer.
 * Calls onExpire when the timer reaches zero.
 */
export function CountdownTimer({ minutes, onExpire }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const isLow = secondsLeft <= 60;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-semibold ${
        isLow ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
      }`}
      role="timer"
      aria-live="off"
      aria-label={`Time remaining: ${mm} minutes ${ss} seconds`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {mm}:{ss}
    </div>
  );
}
