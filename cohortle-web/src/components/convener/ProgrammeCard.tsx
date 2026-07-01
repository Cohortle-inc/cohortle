'use client';

/**
 * ProgrammeCard Component
 * Displays a programme card with lifecycle status, pending applications,
 * enrolled learner count, and a contextual action button.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Programme } from '@/lib/api/convener';
import { getApplicationCounts } from '@/lib/api/applications';

interface ProgrammeCardProps {
  programme: Programme;
}

// Lifecycle status display config (backend may return lifecycle_status at runtime)
const LIFECYCLE_CONFIG: Record<string, { label: string; colour: string }> = {
  draft:      { label: 'Draft',      colour: 'bg-yellow-100 text-yellow-800' },
  recruiting: { label: 'Recruiting', colour: 'bg-blue-100 text-blue-800' },
  active:     { label: 'Active',     colour: 'bg-green-100 text-green-800' },
  completed:  { label: 'Completed',  colour: 'bg-gray-100 text-gray-700' },
  archived:   { label: 'Archived',   colour: 'bg-gray-100 text-gray-400' },
  published:  { label: 'Published',  colour: 'bg-green-100 text-green-800' },
};

export function ProgrammeCard({ programme }: ProgrammeCardProps) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Grab extra fields the backend returns but the type doesn't declare
  const p = programme as any;
  const lifecycleStatus: string = p.lifecycleStatus || p.lifecycle_status || programme.status || 'draft';
  const onboardingMode: string = p.onboardingMode || p.onboarding_mode || 'code';
  const enrolledCount: number = p.enrolledCount ?? p.enrolled_count ?? 0;
  const cohortCount: number = p.cohortCount ?? p.cohort_count ?? 0;

  const cfg = LIFECYCLE_CONFIG[lifecycleStatus] ?? LIFECYCLE_CONFIG.draft;
  const isApplicationMode = onboardingMode === 'application' || onboardingMode === 'hybrid';

  // Fetch pending application count for application-mode programmes
  useEffect(() => {
    if (!isApplicationMode) return;
    getApplicationCounts(programme.id)
      .then((counts) => {
        setPendingCount((counts.submitted ?? 0) + (counts.under_review ?? 0));
      })
      .catch(() => setPendingCount(0));
  }, [programme.id, isApplicationMode]);

  // Contextual action based on lifecycle state
  const getAction = () => {
    if (lifecycleStatus === 'recruiting' && isApplicationMode && pendingCount && pendingCount > 0) {
      return {
        label: `Review ${pendingCount} application${pendingCount !== 1 ? 's' : ''}`,
        href: `/convener/programmes/${programme.id}/applications`,
        colour: 'bg-indigo-600 text-white hover:bg-indigo-700',
      };
    }
    if (lifecycleStatus === 'draft') {
      return {
        label: 'Continue setup',
        href: `/convener/programmes/${programme.id}`,
        colour: 'bg-[#391D65] text-white hover:bg-[#391D65]/90',
      };
    }
    return null;
  };

  const action = getAction();

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-[#391D65]/40 hover:shadow-md transition-all flex flex-col">
      <Link
        href={`/convener/programmes/${programme.id}`}
        className="block p-5 flex-1"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1">
            {programme.name}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.colour}`}>
            {cfg.label}
          </span>
        </div>

        {/* Description */}
        {programme.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {programme.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {enrolledCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {enrolledCount} learner{enrolledCount !== 1 ? 's' : ''}
            </span>
          )}
          {cohortCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {cohortCount} cohort{cohortCount !== 1 ? 's' : ''}
            </span>
          )}
          {isApplicationMode && pendingCount !== null && pendingCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {pendingCount} pending
            </span>
          )}
          <span className="ml-auto">
            {new Date(programme.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </Link>

      {/* Contextual action button */}
      {action && (
        <div className="px-5 pb-4">
          <Link
            href={action.href}
            className={`block w-full text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${action.colour}`}
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
