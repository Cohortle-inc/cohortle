'use client';

/**
 * Cohort Analytics Page
 * Shows cohort overview, health, and at-risk alerts for conveners.
 */

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCohortAnalytics,
  getCohortHealth,
  getAtRiskLearners,
  getCohortAlerts,
  type CohortAnalytics,
  type WeekAnalytics,
  type LessonAnalytics,
  type CohortHealth,
  type AtRiskLearnerResponse,
  type CohortAlertsResponse,
} from '@/lib/api/convener';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  colour,
}: {
  label: string;
  value: string | number;
  sub?: string;
  colour: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const bg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    amber: 'bg-amber-50',
  }[colour];
  const text = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    amber: 'text-amber-700',
  }[colour];

  return (
    <div className={`${bg} rounded-xl p-5`}>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function Bar({ pct, colour = 'bg-[#391D65]' }: { pct: number; colour?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${colour} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

// ─── Week accordion row ───────────────────────────────────────────────────────

function WeekRow({
  week,
  lessons,
  memberCount,
}: {
  week: WeekAnalytics;
  lessons: LessonAnalytics[];
  memberCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-14 shrink-0">
            Week {week.weekNumber}
          </span>
          <span className="font-medium text-gray-900 truncate">{week.weekTitle}</span>
        </div>
        <div className="flex items-center gap-4 ml-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 w-32">
            <Bar pct={week.completionRate} />
            <span className="text-sm font-semibold text-gray-700 w-10 text-right">
              {week.completionRate}%
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {week.totalLessons} lesson{week.totalLessons !== 1 ? 's' : ''}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {lessons.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No lessons in this week.</p>
          ) : (
            lessons.map(lesson => (
              <div key={lesson.lessonId} className="px-5 py-3 bg-gray-50 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                  {lesson.orderIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{lesson.lessonTitle}</p>
                  <p className="text-xs text-gray-400 capitalize">{lesson.contentType.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-24 hidden sm:block">
                    <Bar
                      pct={lesson.completionRate}
                      colour={
                        lesson.completionRate >= 75
                          ? 'bg-green-500'
                          : lesson.completionRate >= 40
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                    {lesson.completionRate}%
                  </span>
                  <span className="text-xs text-gray-400 w-16 text-right">
                    {lesson.completedCount}/{memberCount}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'health', label: 'Health' },
  { key: 'at-risk', label: 'At-risk learners' },
  { key: 'alerts', label: 'Alerts' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function CohortAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const cohortId = params.cohortId as string;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErrorObject,
  } = useQuery<CohortAnalytics, Error>(
    ['cohortAnalytics', cohortId],
    () => getCohortAnalytics(cohortId),
    {
      enabled: !!cohortId,
      staleTime: 30 * 1000,
    }
  );

  const {
    data: cohortHealth,
    isLoading: healthLoading,
    isError: healthError,
  } = useQuery<CohortHealth, Error>(
    ['cohortHealth', cohortId],
    () => getCohortHealth(cohortId),
    {
      enabled: activeTab === 'health' && !!cohortId,
      staleTime: 60 * 1000,
    }
  );

  const {
    data: atRiskResponse,
    isLoading: atRiskLoading,
    isError: atRiskError,
  } = useQuery<AtRiskLearnerResponse, Error>(
    ['atRiskLearners', cohortId],
    () => getAtRiskLearners(cohortId),
    {
      enabled: activeTab === 'at-risk' && !!cohortId,
      staleTime: 60 * 1000,
    }
  );

  const {
    data: alertsResponse,
    isLoading: alertsLoading,
    isError: alertsError,
  } = useQuery<CohortAlertsResponse, Error>(
    ['cohortAlerts', cohortId],
    () => getCohortAlerts(cohortId),
    {
      enabled: activeTab === 'alerts' && !!cohortId,
      staleTime: 60 * 1000,
    }
  );

  const isLoading =
    analyticsLoading ||
    (activeTab === 'health' && healthLoading) ||
    (activeTab === 'at-risk' && atRiskLoading) ||
    (activeTab === 'alerts' && alertsLoading);
  const error = analyticsError ? analyticsErrorObject?.message : null;

  const lessonsByWeek = useMemo(() => {
    if (!analytics) return {} as Record<string, LessonAnalytics[]>;
    return analytics.lessons.reduce<Record<string, LessonAnalytics[]>>((acc, l) => {
      const key = l.weekId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(l);
      return acc;
    }, {});
  }, [analytics]);

  const lowestLesson = analytics?.lessons.length
    ? analytics.lessons.reduce((min, l) => (l.completionRate < min.completionRate ? l : min), analytics.lessons[0])
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-medium mb-2">Failed to load analytics</p>
          <p className="text-sm text-red-600">{error || 'Unable to load cohort analytics.'}</p>
          <button
            onClick={() => router.push(`/convener/programmes/${programmeId}/cohorts/${cohortId}`)}
            className="mt-4 text-sm text-red-700 underline"
          >
            Back to cohort
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push(`/convener/programmes/${programmeId}/cohorts/${cohortId}`)}
        className="mb-5 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Cohort
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cohort Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data for {analytics.memberCount} learner{analytics.memberCount !== 1 ? 's' : ''} in this cohort.
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive ? 'bg-[#391D65] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Learners" value={analytics.memberCount} colour="blue" />
            <StatCard label="Completion" value={`${analytics.overallCompletionRate}%`} colour="green" />
            <StatCard
              label="Lessons Completed"
              value={analytics.totalCompletions}
              sub={`of ${analytics.totalLessons * analytics.memberCount} possible`}
              colour="purple"
            />
            <StatCard label="Total Lessons" value={analytics.totalLessons} colour="amber" />
          </div>

          {lowestLesson && analytics.memberCount > 0 && lowestLesson.completionRate < 50 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Biggest drop-off point</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  "{lowestLesson.lessonTitle}" (Week {lowestLesson.weekNumber}) has the lowest completion at{' '}
                  <strong>{lowestLesson.completionRate}%</strong>. Review this lesson for content clarity or pacing.
                </p>
              </div>
            </div>
          )}

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Week-by-week performance</h2>
            {analytics.weeks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">No weekly analytics data available yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.weeks.map(week => (
                  <WeekRow
                    key={week.weekId}
                    week={week}
                    lessons={lessonsByWeek[week.weekId] || []}
                    memberCount={analytics.memberCount}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lesson completion trends</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Lesson</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Week</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Type</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Completed</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.lessons.map(lesson => (
                      <tr key={lesson.lessonId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{lesson.lessonTitle}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">Week {lesson.weekNumber}</td>
                        <td className="px-4 py-3 text-gray-400 capitalize hidden md:table-cell">{lesson.contentType.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {lesson.completedCount}/{analytics.memberCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 hidden sm:block">
                              <Bar
                                pct={lesson.completionRate}
                                colour={
                                  lesson.completionRate >= 75
                                    ? 'bg-green-500'
                                    : lesson.completionRate >= 40
                                    ? 'bg-amber-400'
                                    : 'bg-red-400'
                                }
                              />
                            </div>
                            <span className={`text-sm font-semibold w-10 text-right ${lesson.completionRate >= 75 ? 'text-green-600' : lesson.completionRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {lesson.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Cohort Health" value={`${cohortHealth?.overallScore ?? 0}%`} colour="green" />
            <StatCard label="Completion Rate" value={`${cohortHealth?.completionRate ?? 0}%`} colour="blue" />
            <StatCard label="On-time Rate" value={`${cohortHealth?.onTimeRate ?? 0}%`} colour="purple" />
            <StatCard label="Engagement Score" value={cohortHealth?.engagementScore ?? 0} colour="amber" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Health distribution</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Healthy</span>
                  <span>{cohortHealth?.healthDistribution.healthy ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Monitor</span>
                  <span>{cohortHealth?.healthDistribution.monitor ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>At risk</span>
                  <span>{cohortHealth?.healthDistribution.atRisk ?? 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Critical</span>
                  <span>{cohortHealth?.healthDistribution.critical ?? 0}</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Key cohort health signals</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Trend</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{cohortHealth?.trend ?? 'stable'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Velocity</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">{cohortHealth?.progressVelocity ?? 'stable'}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3">Top issues</p>
                <ul className="space-y-2">
                  {cohortHealth?.topIssues.map(issue => (
                    <li key={issue.issue} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#391D65]" />
                      <span>{issue.issue} ({issue.count})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
            Calculated at: {cohortHealth?.calculatedAt ? new Date(cohortHealth.calculatedAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      )}

      {activeTab === 'at-risk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Learners at risk</h2>
            <p className="text-sm text-gray-500">
              Review learners with elevated risk scores and recommended support actions.
            </p>
          </div>

          {!atRiskResponse || atRiskResponse.learners.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm">No at-risk learners were detected in this cohort.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Learner</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Risk score</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Primary issues</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {atRiskResponse.learners.map(learner => (
                      <tr key={learner.enrollmentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{learner.learnerName}</td>
                        <td className="px-4 py-3 text-gray-700">{learner.riskScore}%</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{learner.healthStatus.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{learner.primaryIssues.join(', ')}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{learner.actionRecommended.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Recent alerts</h2>
            <p className="text-sm text-gray-500">Alerts are generated from behavioural patterns and cohort performance signals.</p>
          </div>

          {!alertsResponse || alertsResponse.alerts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm">No alerts were generated for this cohort in the selected window.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {alertsResponse.alerts.map(alert => (
                <div key={`${alert.enrollmentId}-${alert.type}-${alert.createdAt}`} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{alert.learnerName}</p>
                      <p className="text-sm text-gray-500">{alert.message}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Severity</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{alert.severity}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-700">Action</p>
                      <p>{alert.suggestedAction}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Created</p>
                      <p>{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {alertsResponse && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 text-sm text-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex justify-between gap-2">
                  <span>Total alerts:</span>
                  <strong>{alertsResponse.statistics.totalAlerts}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Critical:</span>
                  <strong>{alertsResponse.statistics.criticalCount}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Top alert:</span>
                  <strong>{alertsResponse.statistics.topAlertType || 'n/a'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
