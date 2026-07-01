/**
 * Week locking utilities
 * Handles logic for determining if weeks are locked based on start dates
 */

/**
 * Check if a week is locked based on its start date
 * @param startDate - ISO 8601 date string
 * @returns true if the week is locked (start date is in the future)
 */
export function isWeekLocked(startDate: string): boolean {
  const now = new Date();
  const weekStart = new Date(startDate);
  return weekStart > now;
}

/**
 * Get the unlock date for a locked week
 * @param startDate - ISO 8601 date string
 * @returns formatted date string or null if already unlocked
 */
export function getUnlockDate(startDate: string): string | null {
  if (!isWeekLocked(startDate)) {
    return null;
  }

  const weekStart = new Date(startDate);
  return weekStart.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Check if a lesson is accessible based on week lock status
 * @param weekStartDate - ISO 8601 date string for the week
 * @returns true if the lesson can be accessed
 */
export function isLessonAccessible(weekStartDate: string): boolean {
  return !isWeekLocked(weekStartDate);
}

/**
 * Get days until a week unlocks
 * @param startDate - ISO 8601 date string
 * @returns number of days until unlock, or 0 if already unlocked
 */
export function getDaysUntilUnlock(startDate: string): number {
  if (!isWeekLocked(startDate)) {
    return 0;
  }

  const now = new Date();
  const weekStart = new Date(startDate);
  const diffTime = weekStart.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
