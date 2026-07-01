'use client';

import {
  PlayCircle,
  Article,
  FilePdf,
  ArrowSquareOut,
  GraduationCap,
  VideoCamera,
  LockSimple,
  CheckCircle,
} from '@phosphor-icons/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SPRING_TRANSITION, REDUCED_MOTION_TRANSITION } from '@/lib/utils/animation';
import { ICON_WEIGHT_MAP } from '@/lib/utils/iconWeights';
import type { LessonSummary } from './ProgrammeStructureView';

interface LessonListItemProps {
  lesson: LessonSummary;
  isLocked: boolean;
  onClick: () => void;
  /** Optional assignment submission status — only shown when lesson.type === 'assignment' */
  assignmentStatus?: 'not_started' | 'submitted' | 'passed' | 'needs_revision';
}

const lessonTypeIcons = {
  video: PlayCircle,
  text: Article,
  pdf: FilePdf,
  link: ArrowSquareOut,
  quiz: GraduationCap,
  live_session: VideoCamera,
  assignment: Article, // clipboard-style fallback; phosphor doesn't have a clipboard in this import set
};

const lessonTypeLabels = {
  video: 'Video',
  text: 'Reading',
  pdf: 'PDF',
  link: 'External Link',
  quiz: 'Quiz',
  live_session: 'Live Session',
  assignment: 'Assignment',
};

export default function LessonListItem({ lesson, isLocked, onClick, assignmentStatus }: LessonListItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion ? REDUCED_MOTION_TRANSITION : SPRING_TRANSITION;

  const TypeIcon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || Article;
  const typeLabel = lessonTypeLabels[lesson.type as keyof typeof lessonTypeLabels] || 'Lesson';

  // Determine icon weight based on state (ICON_WEIGHT_MAP is the single source of truth)
  const typeIconWeight = isLocked
    ? ICON_WEIGHT_MAP.locked
    : lesson.isCompleted
    ? ICON_WEIGHT_MAP.completed
    : ICON_WEIGHT_MAP.default;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        w-full px-6 py-4 flex items-center gap-4 text-left transition-colors
        ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-white cursor-pointer'}
      `}
      aria-label={`${lesson.title} - ${typeLabel}${lesson.isCompleted ? ' (Completed)' : ''}`}
      aria-disabled={isLocked}
    >
      {/* Lesson Type Icon */}
      <div className="flex-shrink-0">
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${lesson.isCompleted ? 'bg-[#ECDCFF]' : 'bg-gray-100'}
          `}
        >
          <TypeIcon
            weight={typeIconWeight}
            className={`w-5 h-5 ${lesson.isCompleted ? 'text-[#391D65]' : 'text-gray-600'}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium text-gray-900 truncate">{lesson.title}</h4>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>{typeLabel}</span>
          {lesson.duration && <span>{formatDuration(lesson.duration)}</span>}
          {lesson.type === 'assignment' && assignmentStatus && (
            <AssignmentStatusBadge status={assignmentStatus} />
          )}
        </div>
      </div>

      {/* Status Icon — animated lock/unlock transition */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {isLocked ? (
            <motion.div
              key="locked"
              layoutId={`lesson-icon-${lesson.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <LockSimple
                weight={ICON_WEIGHT_MAP.locked}
                className="w-5 h-5 text-gray-300"
                aria-hidden="true"
              />
            </motion.div>
          ) : lesson.isCompleted ? (
            <motion.div
              key="completed"
              layoutId={`lesson-icon-${lesson.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <CheckCircle
                weight={ICON_WEIGHT_MAP.completed}
                className="w-6 h-6 text-[#391D65]"
                aria-hidden="true"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </button>
  );
}

// ─── Assignment Status Badge ──────────────────────────────────────────────────

type AssignmentStatusBadgeProps = {
  status: 'not_started' | 'submitted' | 'passed' | 'needs_revision';
};

function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
  const config = {
    not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
    passed: { label: 'Passed', className: 'bg-green-100 text-green-700' },
    needs_revision: { label: 'Needs Revision', className: 'bg-red-100 text-red-700' },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      aria-label={`Assignment status: ${label}`}
    >
      {label}
    </span>
  );
}
