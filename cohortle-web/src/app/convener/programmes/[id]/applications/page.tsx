'use client';

/**
 * Convener Applications Review Dashboard
 * Lists all applications for a programme with filter/sort controls and inline actions.
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProgrammeApplications,
  getApplicationCounts,
  transitionApplicationStatus,
  exportApplicationsCsv,
} from '@/lib/api/applications';
import { getCohorts } from '@/lib/api/convener';

type AppStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';

interface Application {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: AppStatus;
  submitted_at: string;
  cohort_id?: number;
}

interface Cohort {
  id: number;
  name: string;
  enrollmentCode: string;
}

interface StatusCounts {
  submitted: number;
  under_review: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
}

const STATUS_LABELS: Record<AppStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

const STATUS_COLOURS: Record<AppStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-gray-100 text-gray-700',
};

export default function ApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = Number(params.id);

  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [statusFilter, setStatusFilter] = useState<AppStatus | ''>('');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Accept modal state
  const [acceptingAppId, setAcceptingAppId] = useState<string | null>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<number | ''>('');

  // Reject modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apps, statusCounts, cohortList] = await Promise.all([
        getProgrammeApplications(programmeId, {
          status: statusFilter || undefined,
          sort,
        }),
        getApplicationCounts(programmeId),
        getCohorts(String(programmeId)),
      ]);
      setApplications((apps as any).applications ?? apps);
      setCounts(statusCounts as StatusCounts);
      setCohorts(cohortList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [programmeId, statusFilter, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInlineAction = async (
    appId: string,
    newStatus: AppStatus,
    extra?: { cohortId?: number; rejectionReason?: string }
  ) => {
    setActionError(null);
    setPendingAction(appId + newStatus);
    try {
      await transitionApplicationStatus(appId, {
        status: newStatus,
        cohortId: extra?.cohortId,
        rejectionReason: extra?.rejectionReason,
      });
      // Optimistic update
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      // Refresh counts
      const updated = await getApplicationCounts(programmeId);
      setCounts(updated as StatusCounts);
    } catch (err: any) {
      setActionError(err?.message || 'Action failed');
    } finally {
      setPendingAction(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportApplicationsCsv(programmeId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-programme-${programmeId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionError('Export failed');
    }
  };

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.push(`/convener/programmes/${programmeId}`)}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        ← Back to Programme
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Export CSV
        </button>
      </div>

      {/* Status count summary bar — Requirement 12.2 */}
      {counts && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                statusFilter === s
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{counts[s]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{STATUS_LABELS[s]}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filter / sort controls */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppStatus | '')}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Applications table — Requirement 12.3 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading applications…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No applications found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{app.applicant_name}</div>
                    <div className="text-xs text-gray-500">{app.applicant_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOURS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/convener/programmes/${programmeId}/applications/${app.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Review
                      </Link>
                      {/* Inline accept/reject — Requirement 12.4 */}
                      {(app.status === 'submitted' || app.status === 'under_review' || app.status === 'waitlisted') && (
                        <>
                          <button
                            onClick={() => {
                              setAcceptingAppId(app.id);
                              setSelectedCohortId(cohorts.length === 1 ? cohorts[0].id : '');
                              setActionError(null);
                            }}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setRejectionReason('');
                              setActionError(null);
                            }}
                            disabled={pendingAction === app.id + 'rejected'}
                            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {app.status !== 'waitlisted' && (
                            <button
                              onClick={() => handleInlineAction(app.id, 'waitlisted')}
                              disabled={pendingAction === app.id + 'waitlisted'}
                              className="text-xs text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                            >
                              Waitlist
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Accept modal — cohort picker */}
    {acceptingAppId && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Accept Application</h2>
          <p className="text-sm text-gray-500 mb-4">Select the cohort to enrol this applicant into.</p>

          {cohorts.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 mb-4">
              No cohorts found. Please create a cohort for this programme first.
            </div>
          ) : (
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] mb-4"
            >
              <option value="">Select a cohort…</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {actionError && (
            <p className="text-sm text-red-600 mb-3">{actionError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setAcceptingAppId(null); setSelectedCohortId(''); setActionError(null); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!selectedCohortId) { setActionError('Please select a cohort'); return; }
                const appId = acceptingAppId!;
                await handleInlineAction(appId, 'accepted', { cohortId: Number(selectedCohortId) });
                setAcceptingAppId(null);
                setSelectedCohortId('');
              }}
              disabled={!selectedCohortId || pendingAction === acceptingAppId + 'accepted'}
              className="flex-1 px-4 py-2 bg-[#391D65] text-white rounded-lg text-sm font-medium hover:bg-[#391D65]/90 disabled:opacity-50"
            >
              {pendingAction === acceptingAppId + 'accepted' ? 'Accepting…' : 'Confirm Accept'}
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Reject modal — Requirement 6.1 */}
    {rejectingAppId && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h2 id="reject-modal-title" className="text-lg font-semibold text-gray-900 mb-1">Reject Application</h2>
          <p className="text-sm text-gray-500 mb-4">Provide a reason for rejection. This will be included in the notification email to the applicant.</p>

          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            placeholder="e.g. We received many strong applications and were unable to offer you a place at this time."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
            autoFocus
          />

          {actionError && (
            <p className="text-sm text-red-600 mb-3">{actionError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setRejectingAppId(null); setRejectionReason(''); setActionError(null); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!rejectionReason.trim()) { setActionError('A rejection reason is required'); return; }
                const appId = rejectingAppId!;
                await handleInlineAction(appId, 'rejected', { rejectionReason: rejectionReason.trim() });
                setRejectingAppId(null);
                setRejectionReason('');
              }}
              disabled={!rejectionReason.trim() || pendingAction === rejectingAppId + 'rejected'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {pendingAction === rejectingAppId + 'rejected' ? 'Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
