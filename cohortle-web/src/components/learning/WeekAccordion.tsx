'use client';

import { ChevronDownIcon, ChevronUpIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import LessonListItem from './LessonListItem';
import ProgressIndicator from './ProgressIndicator';
import type { WeekWithLessons } from './ProgrammeStructureView';

interface WeekAccordionProps {
  week: WeekWithLessons;
  isExpanded: boolean;
  onToggle: () => void;
  onLessonClick: (lessonId: string) => void;
}

export default function WeekAccordion({
  week,
  isExpanded,
  onToggle,
  onLessonClick,
}: WeekAccordionProps) {
  const completedLessons = week.lessons.filter((l) => l.isCompleted).length;
  const totalLessons = week.lessons.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Week Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`week-${week.id}-content`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0">
            {week.isLocked ? (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <LockClosedIcon className="w-5 h-5 text-gray-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{week.weekNumber}</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-gray-900">{week.title}</h3>
            {week.description && (
              <p className="text-sm text-gray-600 mt-1">{week.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Starts: {formatDate(week.startDate)}</span>
              {week.isLocked && <span className="text-orange-600 font-medium">Locked</span>}
            </div>
          </div>

          <div className="flex-shrink-0 w-48">
            <ProgressIndicator
              current={completedLessons}
              total={totalLessons}
              size="small"
            />
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Week Content */}
      {isExpanded && (
        <div
          id={`week-${week.id}-content`}
          className="border-t border-gray-200 bg-gray-50"
        >
          {week.isLocked ? (
            <div className="px-6 py-8 text-center">
              <LockClosedIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                This week will unlock on {formatDate(week.startDate)}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {week.lessons.map((lesson) => (
                <LessonListItem
                  key={lesson.id}
                  lesson={lesson}
                  isLocked={week.isLocked}
                  onClick={() => onLessonClick(lesson.id)}
                  assignmentStatus={lesson.type === 'assignment' ? (lesson.assignmentStatus ?? 'not_started') : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
