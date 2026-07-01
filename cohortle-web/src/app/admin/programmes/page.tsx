'use client';

import React, { useEffect, useState } from 'react';
import { getAdminProgrammes, AdminProgramme } from '@/lib/api/admin';

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  recruiting: 'bg-blue-100 text-blue-700',
  draft: 'bg-gray-100 text-gray-500',
  completed: 'bg-purple-100 text-purple-700',
  archived: 'bg-orange-100 text-orange-600',
};

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<AdminProgramme[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminProgrammes({ limit, offset })
      .then(result => {
        setProgrammes(result.programmes);
        setTotal(result.pagination.total);
      })
      .catch(() => setError('Failed to load programmes'))
      .finally(() => setLoading(false));
  }, [offset]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Programmes</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} programmes on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : programmes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No programmes found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Programme</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Convener</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mode</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Enrolments</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programmes.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-gray-400 text-xs">ID: {p.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    {p.convener ? (
                      <div>
                        <div className="text-gray-700">{p.convener.name}</div>
                        {p.convener.organisation && (
                          <div className="text-gray-400 text-xs">{p.convener.organisation}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadge[p.lifecycle_status] || 'bg-gray-100 text-gray-500'}`}>
                      {p.lifecycle_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {p.onboarding_mode || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[#391D65]/10 text-[#391D65] font-semibold text-xs">
                      {p.enrollment_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
