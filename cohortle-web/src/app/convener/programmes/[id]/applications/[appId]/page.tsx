'use client';

/**
 * Application Detail Page
 * Full review view: responses, applicant info, status history, reviewer notes, and decision actions.
 * Requirements: 4.2, 4.3, 4.4, 8.3
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getApplication,
  transitionApplicationStatus,
  addApplicationNotes,
} from '@/lib/api/applications';

type AppStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';

interface HistoryRecord {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: number | null;
  notes: string | null;
  created_at: string;
}

interface ApplicationDetail {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: AppStatus;
  responses: Record<string, unknown>;
  reviewer_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  decision_at: string | null;
  history: HistoryRecord[];
  cohorts?: { id: number; name: string }[];
}

const STATUS_COLOURS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-gray-100 text-gray-700',
  draft: 'bg-gray-100 text-gray-500',
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const appId = params.appId as string;

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [cohorts, setCohorts] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState<number | undefined>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [data, cohortList] = await Promise.all([
          getApplication(appId),
          import('@/lib/api/convener').then(m => m.getCohorts(String(programmeId))).catch(() => []),
        ]);
        const detail: ApplicationDetail = {
          ...(data.application as unknown as ApplicationDetail),
          history: data.history as HistoryRecord[],
        };
        setApp(detail);
        setNotes(detail.reviewer_notes || '');
        setCohorts((cohortList as { id: number; name: string }[]).map(c => ({ id: c.id, name: c.name })));
      } catch (err: any) {
        setError(err?.message || 'Failed to load application');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appId]);

  const handleTransition = async (newStatus: AppStatus) => {
    if (!app) return;
    setActionError(null);
    setIsPending(true);
    try {
      await transitionApplicationStatus(appId, {
        status: newStatus,
        cohortId: selectedCohortId,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
      });
      setApp((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err: any) {
      setActionError(err?.message || 'Action failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!app) return;
    setIsSavingNotes(true);
    try {
      await addApplicationNotes(appId, notes);
      setApp((prev) => prev ? { ...prev, reviewer_notes: notes } : prev);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">Loading…</div>;
  }

  if (error || !app) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'Application not found'}
        </div>
      </div>
    );
  }

  const canAct = app.status === 'submitted' || app.status === 'under_review' || app.status === 'waitlisted';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/convener/programmes/${programmeId}/applications`)}
        className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        ← Back to Applications
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{app.applicant_name}</h1>
            <p className="text-sm text-gray-500">{app.applicant_email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Submitted {new Date(app.submitted_at).toLocaleString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOURS[app.status]}`}>
            {app.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Responses */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Responses</h2>
        {Object.keys(app.responses).length === 0 ? (
          <p className="text-sm text-gray-500 italic">No responses recorded.</p>
        ) : (
          <dl className="space-y-4">
            {Object.entries(app.responses).map(([question, answer]) => (
              <div key={question}>
                <dt className="text-sm font-medium text-gray-700">{question}</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Reviewer notes — Requirement 4.4 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Reviewer Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add internal notes about this applicant…"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSaveNotes}
          disabled={isSavingNotes}
          className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSavingNotes ? 'Saving…' : 'Save Notes'}
        </button>
      </div>

      {/* Decision actions */}
      {canAct && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Decision</h2>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {actionError}
            </div>
          )}

          {/* Cohort selector for acceptance */}
          {cohorts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrol into cohort (required for acceptance)
              </label>
              <select
                value={selectedCohortId ?? ''}
                onChange={(e) => setSelectedCohortId(Number(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select cohort…</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rejection reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection reason <span className="text-gray-400 font-normal">(required to reject)</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              placeholder="Explain why this application is being rejected…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleTransition('accepted')}
              disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleTransition('rejected')}
              disabled={isPending || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
            {app.status !== 'waitlisted' && (
              <button
                onClick={() => handleTransition('waitlisted')}
                disabled={isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Waitlist
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status history — Requirement 8.3 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Status History</h2>
        {app.history.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No history yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {app.history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
                <p className="text-sm text-gray-900">
                  {h.from_status ? (
                    <><span className="font-medium">{h.from_status}</span> → <span className="font-medium">{h.to_status}</span></>
                  ) : (
                    <span className="font-medium">{h.to_status}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</p>
                {h.notes && <p className="text-xs text-gray-600 mt-0.5 italic">{h.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
