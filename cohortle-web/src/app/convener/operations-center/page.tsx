'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useConvenerProgrammes } from '@/lib/hooks/useConvenerProgrammes';
import {
  getOrgAnalytics,
  getOrgStats,
  getProgramme,
  type OrgAnalytics,
  type OrgStats,
  type ProgrammeDetail,
} from '@/lib/api/convener';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="mt-2 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

export default function OperationsCenterOverviewPage() {
  const { programmes, isLoading: programmesLoading } = useConvenerProgrammes();

  const programmeId = programmes[0]?.id?.toString() ?? null;

  const {
    data: programmeDetail,
    isLoading: programmeDetailLoading,
  } = useQuery<ProgrammeDetail, Error>(
    ['programmeDetail', programmeId],
    () => getProgramme(programmeId!),
    {
      enabled: !!programmeId,
      staleTime: 60 * 1000,
    }
  );

  const cohortHealthShortcut = programmeDetail?.cohorts?.[0];

  const {
    data: orgAnalytics,
    isLoading: analyticsLoading,
  } = useQuery<OrgAnalytics, Error>({
    queryKey: ['orgAnalytics'],
    queryFn: getOrgAnalytics,
    staleTime: 60 * 1000,
  });

  const {
    data: orgStats,
    isLoading: statsLoading,
  } = useQuery<OrgStats, Error>({
    queryKey: ['orgStats'],
    queryFn: getOrgStats,
    staleTime: 60 * 1000,
  });

  const isLoading = programmesLoading || programmeDetailLoading || analyticsLoading || statsLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#391D65]/80">
            Operations Center
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Convener Operations Overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Monitor current programmes, review organisation analytics, and jump directly to cohort-level learner operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/convener/dashboard"
            className="rounded-full border border-[#391D65] px-4 py-2 text-sm font-medium text-[#391D65] transition hover:bg-[#391D65] hover:text-white"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/convener/org-analytics"
            className="rounded-full bg-[#391D65] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d1447]"
          >
            View Org Analytics
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[320px] flex items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          <SummaryCard
            label="Programmes"
            value={programmes.length}
            sub="Your current active programme count"
          />
          <SummaryCard
            label="Learners"
            value={orgStats?.total_learners ?? 0}
            sub="Total learners enrolled across organisation"
          />
          <SummaryCard
            label="Conversion rate"
            value={`${orgAnalytics?.conversion_rate ?? 0}%`}
            sub="Organisation-level conversion performance"
          />
          <SummaryCard
            label="Programmes completed"
            value={orgStats?.programmes_completed ?? 0}
            sub="Completed programmes across your organisation"
          />
        </div>
      )}

      <div className="mt-10 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Operations quick actions</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Jump to the most important convener workflows from one place.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/convener/dashboard"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:border-[#391D65] hover:bg-[#f8f4ff]"
              >
                <p className="text-sm font-semibold text-gray-900">Dashboard</p>
                <p className="mt-1 text-sm text-gray-500">Manage programmes, cohorts, and recent activity.</p>
              </Link>
              <Link
                href="/convener/applications"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:border-[#391D65] hover:bg-[#f8f4ff]"
              >
                <p className="text-sm font-semibold text-gray-900">Applications</p>
                <p className="mt-1 text-sm text-gray-500">Review pending learners and approve new applications.</p>
              </Link>
              <Link
                href="/convener/org-analytics"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:border-[#391D65] hover:bg-[#f8f4ff]"
              >
                <p className="text-sm font-semibold text-gray-900">Organisation analytics</p>
                <p className="mt-1 text-sm text-gray-500">See conversion, views, and performance for your organisation.</p>
              </Link>
              <Link
                href="/convener/settings"
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-left transition hover:border-[#391D65] hover:bg-[#f8f4ff]"
              >
                <p className="text-sm font-semibold text-gray-900">Settings</p>
                <p className="mt-1 text-sm text-gray-500">Update organisation profile and sync analytics data.</p>
              </Link>
            </div>
          </div>

          {cohortHealthShortcut && (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-yellow-900">Quick cohort health shortcut</h2>
                  <p className="mt-2 text-sm text-yellow-700">
                    Open the first programme's cohort analytics page to review health, completion, and alerts.
                  </p>
                  <p className="mt-3 text-sm text-yellow-700">
                    Programme: <strong>{programmeDetail?.name}</strong>
                    <br />
                    Cohort: <strong>{cohortHealthShortcut.name}</strong>
                  </p>
                </div>
                <Link
                  href={`/convener/programmes/${programmeId}/cohorts/${cohortHealthShortcut.id}/analytics`}
                  className="inline-flex items-center rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-700"
                >
                  Open cohort health
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Programme operations</h2>
            <p className="mt-2 text-sm text-gray-500">
              Open any programme to review cohort health, learner progress, and cohort operations.
            </p>

            {programmes.length === 0 ? (
              <div className="mt-6 rounded-3xl bg-[#f8f4ff] p-6 text-sm text-gray-700">
                No programmes have been created yet. Start by creating a programme from the dashboard.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {programmes.map(programme => (
                  <div key={programme.id} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{programme.name}</p>
                        <p className="text-sm text-gray-500">{programme.description}</p>
                      </div>
                      <Link
                        href={`/convener/programmes/${programme.id}`}
                        className="inline-flex items-center rounded-full bg-[#391D65] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d1447]"
                      >
                        Open programme
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Operations checklist</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• Review programme performance and cohort health weekly.</li>
              <li>• Open cohort learners to identify at-risk participants.</li>
              <li>• Use org analytics to track applicant and conversion performance.</li>
              <li>• Sync organisation stats from the settings page when data changes.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-[#f8f4ff] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Next step</h3>
            <p className="mt-2 text-sm text-gray-600">
              Navigate to a programme and select a cohort to access the cohort learner operations center.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
