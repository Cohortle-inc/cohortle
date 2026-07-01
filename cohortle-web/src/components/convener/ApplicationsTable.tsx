'use client';

/**
 * ApplicationsTable
 * Reusable table with checkbox selection for bulk actions, status badges, and filter bar.
 * Requirements: 4.1, 4.5, 4.6, 4.7
 */

import React, { useState } from 'react';
import Link from 'next/link';

export type AppStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';

export interface ApplicationRow {
  id: string;
  applicant_name: string;
  applicant_email: string;
  status: AppStatus;
  submitted_at: string;
}

interface ApplicationsTableProps {
  programmeId: string | number;
  applications: ApplicationRow[];
  onBulkAction?: (ids: string[], action: 'accepted' | 'rejected') => void;
  disabled?: boolean;
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

export function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOURS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ApplicationsTable({
  programmeId,
  applications,
  onBulkAction,
  disabled = false,
}: ApplicationsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<AppStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = applications.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (dateFrom && a.submitted_at < dateFrom) return false;
    if (dateTo && a.submitted_at > dateTo + 'T23:59:59') return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAction = (action: 'accepted' | 'rejected') => {
    if (onBulkAction && selected.size > 0) {
      onBulkAction(Array.from(selected), action);
      setSelected(new Set());
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar — Requirements 4.5, 4.6 */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            {(Object.keys(STATUS_LABELS) as AppStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Bulk action bar — Requirement 4.7 */}
      {selected.size > 0 && onBulkAction && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <span className="text-sm text-indigo-700 font-medium">{selected.size} selected</span>
          <button
            onClick={() => handleBulkAction('accepted')}
            disabled={disabled}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
          >
            Bulk Accept
          </button>
          <button
            onClick={() => handleBulkAction('rejected')}
            disabled={disabled}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50"
          >
            Bulk Reject
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No applications match the current filters.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Applicant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(app.id)}
                      onChange={() => toggleOne(app.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      aria-label={`Select ${app.applicant_name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{app.applicant_name}</div>
                    <div className="text-xs text-gray-500">{app.applicant_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(app.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/convener/programmes/${programmeId}/applications/${app.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
