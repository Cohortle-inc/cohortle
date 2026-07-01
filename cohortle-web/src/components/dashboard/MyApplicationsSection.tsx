'use client';

/**
 * MyApplicationsSection
 * Shows a learner's applications with status badges and links.
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyApplications } from '@/lib/api/applications';

interface Application {
  id: string;
  programme_name: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';
  submitted_at: string;
  programme_id?: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-gray-100 text-gray-700',
};

export function MyApplicationsSection() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then((data) => setApplications(data as unknown as Application[]))
      .catch(() => setApplications([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return null;
  if (applications.length === 0) return null;

  return (
    <section aria-labelledby="my-applications-heading">
      <h2 id="my-applications-heading" className="text-lg font-semibold text-gray-900 mb-3">
        My Applications
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {applications.map((app) => (
          <div key={app.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{app.programme_name}</p>
              <p className="text-xs text-gray-500">
                {new Date(app.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOURS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
              {/* Draft: show Edit link — Requirement 9.3 */}
              {app.status === 'draft' && (
                <Link
                  href={`/apply/edit/${app.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Edit
                </Link>
              )}
              {/* Accepted: show link to programme — Requirement 9.5 */}
              {app.status === 'accepted' && app.programme_id && (
                <Link
                  href={`/programmes/${app.programme_id}`}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  Go to Programme →
                </Link>
              )}
              {/* Pending/under review: reassure learner */}
              {(app.status === 'submitted' || app.status === 'under_review') && (
                <span className="text-xs text-gray-400">Awaiting decision</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
