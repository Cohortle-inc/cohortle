'use client';

import React, { useEffect, useState } from 'react';
import { getAdminConveners, AdminConvener } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';

export default function AdminConvenersPage() {
  const [conveners, setConveners] = useState<AdminConvener[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const router = useRouter();
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAdminConveners({ limit, offset })
      .then(result => {
        setConveners(result.conveners);
        setTotal(result.pagination.total);
      })
      .catch(() => setError('Failed to load conveners'))
      .finally(() => setLoading(false));
  }, [offset]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conveners</h1>
        <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} conveners on the platform</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : conveners.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No conveners found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Convener</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Programmes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Org Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conveners.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-gray-400 text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.organisation_name || <span className="text-gray-400 italic">Not set</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#391D65]/10 text-[#391D65] font-semibold text-xs">
                      {c.programme_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.joined_at ? new Date(c.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.organisation_slug ? (
                      <button
                        onClick={() => router.push(`/org/${c.organisation_slug}`)}
                        className="text-xs text-[#391D65] hover:underline"
                      >
                        View page →
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">No slug</span>
                    )}
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
