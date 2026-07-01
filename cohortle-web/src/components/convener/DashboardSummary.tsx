'use client';

/**
 * ConvenerDashboardSummary
 * Aggregate stats bar shown at the top of the convener dashboard.
 * Derives most numbers from the already-loaded programmes array so there
 * are no extra API calls for the basic counts. Pending applications are
 * fetched separately since they live across all programmes.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Programme } from '@/lib/api/convener';
import { getPendingApplicationsCount } from '@/lib/api/applications';

interface Props {
  programmes: Programme[];
  isLoading: boolean;
}

interface Stat {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
  colour: string;
  icon: React.ReactNode;
}

function StatTile({ stat }: { stat: Stat }) {
  const inner = (
    <div
      className={`rounded-xl p-4 flex items-center gap-3 ${stat.colour} ${
        stat.href ? 'hover:opacity-90 transition-opacity cursor-pointer' : ''
      }`}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/40 flex items-center justify-center">
        {stat.icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
        <p className="text-xs text-gray-600 mt-0.5 truncate">{stat.label}</p>
        {stat.sub && <p className="text-xs text-gray-400 truncate">{stat.sub}</p>}
      </div>
    </div>
  );

  if (stat.href) {
    return <Link href={stat.href}>{inner}</Link>;
  }
  return inner;
}

export function ConvenerDashboardSummary({ programmes, isLoading }: Props) {
  const [pendingApplications, setPendingApplications] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading || programmes.length === 0) return;
    getPendingApplicationsCount().then(setPendingApplications).catch(() => setPendingApplications(0));
  }, [isLoading, programmes.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (programmes.length === 0) return null;

  // Derive stats from the programmes array — no extra API calls
  const totalProgrammes = programmes.length;

  const lifecycleStatus = (p: Programme) =>
    (p as any).lifecycleStatus || (p as any).lifecycle_status || p.status || 'draft';

  const activeProgrammes = programmes.filter((p) => {
    const s = lifecycleStatus(p);
    return s === 'active' || s === 'recruiting' || s === 'published';
  }).length;

  const totalLearners = programmes.reduce((sum, p) => {
    const enrolled = (p as any).enrolledCount ?? (p as any).enrolled_count ?? 0;
    return sum + Number(enrolled);
  }, 0);

  const stats: Stat[] = [
    {
      label: 'Programmes',
      value: totalProgrammes,
      sub: activeProgrammes > 0 ? `${activeProgrammes} active` : undefined,
      colour: 'bg-[#ECDCFF]',
      icon: (
        <svg className="w-5 h-5 text-[#391D65]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: 'Total Learners',
      value: totalLearners,
      colour: 'bg-blue-50',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Pending Applications',
      value: pendingApplications === null ? '—' : pendingApplications,
      sub: pendingApplications && pendingApplications > 0 ? 'needs review' : undefined,
      href: pendingApplications && pendingApplications > 0 ? '/convener/applications' : undefined,
      colour: pendingApplications && pendingApplications > 0 ? 'bg-amber-50' : 'bg-gray-50',
      icon: (
        <svg
          className={`w-5 h-5 ${pendingApplications && pendingApplications > 0 ? 'text-amber-600' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Recruiting',
      value: programmes.filter((p) => lifecycleStatus(p) === 'recruiting').length,
      sub: 'open for applications',
      colour: 'bg-green-50',
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
