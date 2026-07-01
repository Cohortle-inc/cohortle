'use client';

import { useState } from 'react';
import WeekAccordion from './WeekAccordion';
import ProgressIndicator from '@/components/learning/ProgressIndicator';
import { Breadcrumb } from '../navigation/Breadcrumb';

export interface LessonSummary {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'link' | 'quiz' | 'live_session' | 'assignment';
  duration?: number;
  isCompleted: boolean;
  orderIndex: number;
  /** Submission status — only populated for assignment lessons */
  assignmentStatus?: 'not_started' | 'submitted' | 'passed' | 'needs_revision';
}

export interface WeekWithLessons {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  startDate: string;
  isLocked: boolean;
  progress: number;
  lessons: LessonSummary[];
}

export interface ProgrammeWithWeeks {
  id: number;
  name: string;
  description: string;
  progress: number;
  weeks: WeekWithLessons[];
}

interface ProgrammeStructureViewProps {
  programme: ProgrammeWithWeeks;
  cohortId: number;
  onLessonClick: (lessonId: string) => void;
}

export default function ProgrammeStructureView({
  programme,
  cohortId,
  onLessonClick,
}: ProgrammeStructureViewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set([programme.weeks[0]?.id]));

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) {
        next.delete(weekId);
      } else {
        next.add(weekId);
      }
      return next;
    });
  };

  const totalLessons = programme.weeks.reduce((sum, week) => sum + week.lessons.length, 0);
  const completedLessons = programme.weeks.reduce(
    (sum, week) => sum + week.lessons.filter((l) => l.isCompleted).length,
    0
  );

  return (
    <article className="max-w-4xl mx-auto">
      {/* Programme Header */}
      <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: programme.name },
          ]}
        />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{programme.name}</h1>
        <p className="text-gray-600 mb-6">{programme.description}</p>

        <ProgressIndicator
          current={completedLessons}
          total={totalLessons}
          label="Overall Progress"
          size="large"
        />
      </header>

      {/* Weeks List */}
      <section aria-labelledby="weeks-heading">
        <h2 id="weeks-heading" className="sr-only">Programme weeks and lessons</h2>
        <div className="space-y-4">
          {programme.weeks.map((week) => (
            <WeekAccordion
              key={week.id}
              week={week}
              isExpanded={expandedWeeks.has(week.id)}
              onToggle={() => toggleWeek(week.id)}
              onLessonClick={onLessonClick}
            />
          ))}
        </div>
      </section>

      {/* Empty State */}
      {programme.weeks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No content available yet.</p>
        </div>
      )}
    </article>
  );
}
