'use client';

import React, { useEffect, useState } from 'react';
import { getAssignmentSubmissions, ConvenerSubmission } from '@/lib/api/assignments';
import { AssignmentGradeModal } from './AssignmentGradeModal';

type FilterStatus = 'all' | 'submitted' | 'graded';

interface AssignmentSubmissionsViewProps {
  lessonId: string;
  totalEnrolled?: number;
}

export function AssignmentSubmissionsView({
  lessonId,
  totalEnrolled,
}: AssignmentSubmissionsViewProps) {
  const [submissions, setSubmissions] = useState<ConvenerSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ConvenerSubmission | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAssignmentSubmissions(lessonId)
      .then(setSubmissions)
      .catch(err => setError(err.message || 'Failed to load submissions'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [lessonId]);

  const filtered = submissions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'submitted') return s.status === 'submitted';
    if (filter === 'graded') return s.status === 'graded';
    return true;
  });

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submittedCount - gradedCount;

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: `All (${submittedCount})` },
    { key: 'submitted', label: `Awaiting Review (${pendingCount})` },
    { key: 'graded', label: `Graded (${gradedCount})` },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3" aria-busy="true" aria-label="Loading submissions">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
        <p className="text-red-700 text-sm">{error}</p>
        <button onClick={load} className="mt-2 text-sm text-red-600 underline">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap" role="tablist" aria-label="Filter submissions">
        {filters.map(f => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No submissions match this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Assignment submissions">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 pr-4 font-medium text-gray-600">Learner</th>
                <th className="pb-2 pr-4 font-medium text-gray-600">Status</th>
                <th className="pb-2 pr-4 font-medium text-gray-600">Submitted</th>
                <th className="pb-2 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.submission_id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{s.learner_name}</p>
                    <p className="text-gray-500 text-xs">{s.learner_email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <SubmissionStatusBadge submission={s} />
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {s.submitted_at
                      ? new Date(s.submitted_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedSubmission(s)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      aria-label={`Review submission from ${s.learner_name}`}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <AssignmentGradeModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onGraded={() => {
            setSelectedSubmission(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SubmissionStatusBadge({ submission }: { submission: ConvenerSubmission }) {
  if (submission.status === 'graded') {
    if (submission.grading_status === 'passed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Passed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Needs Revision
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      Submitted
    </span>
  );
}
