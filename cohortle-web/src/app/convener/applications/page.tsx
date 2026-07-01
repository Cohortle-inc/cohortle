'use client';

/**
 * Cross-Programme Applications View
 * Shows all applications across all of the convener's programmes.
 * Surfaces cross-programme applicant overlap.
 * Requirements: 13.9, 13.10
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCrossProgammeApplications } from '@/lib/api/applications';

interface CrossApplication {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: string;
  submitted_at: string;
  programme_id: number;
  programme_name: string;
}

export default function CrossProgrammeApplicationsPage() {
  const [applications, setApplications] = useState<CrossApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programmeFilter, setProgrammeFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getCrossProgammeApplications({});
        setApplications((data as any).applications ?? data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Detect cross-programme applicants (same email, multiple programmes)
  const emailCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.applicant_email] = (acc[a.applicant_email] || 0) + 1;
    return acc;
  }, {});

  const programmes = Array.from(
    new Map(applications.map((a) => [a.programme_id, a.programme_name])).entries()
  );

  const filtered = programmeFilter
    ? applications.filter((a) => String(a.programme_id) === programmeFilter)
    : applications;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
        <span className="text-sm text-gray-500">{applications.length} total</span>
      </div>

      {/* Programme filter */}
      <div className="mb-4">
        <select
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All programmes</option>
          {programmes.map(([id, name]) => (
            <option key={id} value={String(id)}>{name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No applications found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Programme</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((app) => {
                const isMulti = emailCounts[app.applicant_email] > 1;
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{app.applicant_name}</div>
                          <div className="text-xs text-gray-500">{app.applicant_email}</div>
                        </div>
                        {/* Cross-programme overlap indicator — Requirement 13.10 */}
                        {isMulti && (
                          <span
                            className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium"
                            title="This applicant has applied to multiple of your programmes"
                          >
                            Multi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{app.programme_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/convener/programmes/${app.programme_id}/applications/${app.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
