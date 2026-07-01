/**
 * Progress Calculation Utilities
 * Provides functions for calculating progress percentages for programmes and weeks
 */

/**
 * Calculate progress percentage from completed and total counts
 * @param completed - Number of completed items
 * @param total - Total number of items
 * @returns Progress percentage (0-100), rounded to nearest integer
 */
export function calculateProgressPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  if (completed < 0 || total < 0) return 0;
  if (completed > total) return 100;
  
  return Math.round((completed / total) * 100);
}

/**
 * Week progress data
 */
export interface WeekProgress {
  weekId: string;
  weekName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

/**
 * Programme progress data
 */
export interface ProgrammeProgress {
  programmeId: string;
  programmeName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  weeks: WeekProgress[];
}

/**
 * Calculate progress for a single week
 * @param weekId - Week identifier
 * @param weekName - Week name/title
 * @param lessons - Array of lessons with completion status
 * @returns Week progress data
 */
export function calculateWeekProgress(
  weekId: string,
  weekName: string,
  lessons: Array<{ id: string; isCompleted: boolean }>
): WeekProgress {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(lesson => lesson.isCompleted).length;
  const progressPercentage = calculateProgressPercentage(completedLessons, totalLessons);

  return {
    weekId,
    weekName,
    totalLessons,
    completedLessons,
    progressPercentage,
  };
}

/**
 * Calculate progress for a programme from week data
 * @param programmeId - Programme identifier
 * @param programmeName - Programme name
 * @param weeks - Array of week progress data
 * @returns Programme progress data
 */
export function calculateProgrammeProgress(
  programmeId: string,
  programmeName: string,
  weeks: WeekProgress[]
): ProgrammeProgress {
  const totalLessons = weeks.reduce((sum, week) => sum + week.totalLessons, 0);
  const completedLessons = weeks.reduce((sum, week) => sum + week.completedLessons, 0);
  const progressPercentage = calculateProgressPercentage(completedLessons, totalLessons);

  return {
    programmeId,
    programmeName,
    totalLessons,
    completedLessons,
    progressPercentage,
    weeks,
  };
}

/**
 * Calculate progress for a module
 * @param moduleId - Module identifier
 * @param moduleName - Module name
 * @param lessons - Array of lessons with completion status
 * @returns Module progress data
 */
export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export function calculateModuleProgress(
  moduleId: string,
  moduleName: string,
  lessons: Array<{ id: string; isCompleted: boolean }>
): ModuleProgress {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(lesson => lesson.isCompleted).length;
  const progressPercentage = calculateProgressPercentage(completedLessons, totalLessons);

  return {
    moduleId,
    moduleName,
    totalLessons,
    completedLessons,
    progressPercentage,
  };
}

/**
 * Update progress after a lesson completion
 * Recalculates progress for the affected week and programme
 * @param currentProgress - Current programme progress
 * @param weekId - ID of the week containing the completed lesson
 * @param lessonId - ID of the completed lesson
 * @returns Updated programme progress
 */
export function updateProgressAfterCompletion(
  currentProgress: ProgrammeProgress,
  weekId: string,
  lessonId: string
): ProgrammeProgress {
  // Find the week and update its progress
  const updatedWeeks = currentProgress.weeks.map(week => {
    if (week.weekId === weekId) {
      // Increment completed lessons count
      const newCompletedLessons = Math.min(
        week.completedLessons + 1,
        week.totalLessons
      );
      const newProgressPercentage = calculateProgressPercentage(
        newCompletedLessons,
        week.totalLessons
      );

      return {
        ...week,
        completedLessons: newCompletedLessons,
        progressPercentage: newProgressPercentage,
      };
    }
    return week;
  });

  // Recalculate programme-level progress
  const totalLessons = updatedWeeks.reduce((sum, week) => sum + week.totalLessons, 0);
  const completedLessons = updatedWeeks.reduce((sum, week) => sum + week.completedLessons, 0);
  const progressPercentage = calculateProgressPercentage(completedLessons, totalLessons);

  return {
    ...currentProgress,
    totalLessons,
    completedLessons,
    progressPercentage,
    weeks: updatedWeeks,
  };
}
