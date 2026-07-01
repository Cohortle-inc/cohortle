'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Opportunity {
  id: number;
  title: string;
  organisation: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  deadline: string | null;
  is_featured: number;
  created_at: string;
}

const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-amber-100 text-amber-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  fellowship: 'Fellowship',
  accelerator: 'Accelerator',
  incubator: 'Incubator',
  leadership: 'Leadership',
  bootcamp: 'Bootcamp',
  challenge: 'Challenge',
  scholarship: 'Scholarship',
  ngo_training: 'NGO Training',
  other: 'Other',
};

export default function AdminOpportunitiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      // Use the proxy — auth token is in the httpOnly cookie, not localStorage
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/proxy/v1/api/admin/opportunities${qs}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isLoading && user?.role === 'administrator') {
      fetchOpportunities();
    }
  }, [isLoading, user, fetchOpportunities]);

  async function updateStatus(id: number, status: 'published' | 'archived') {
    setActionLoading(id);
    try {
      await fetch(`/api/proxy/v1/api/admin/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchOpportunities();
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteOpportunity(id: number) {
    if (!confirm('Delete this opportunity? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/proxy/v1/api/admin/opportunities/${id}`, {
        method: 'DELETE',
      });
      await fetchOpportunities();
    } finally {
      setActionLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#391D65] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Manage curated external opportunities on the Discover page</p>
        </div>
        <button
          onClick={() => router.push('/admin/opportunities/new')}
          className="px-4 py-2 rounded-lg bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
        >
          + New opportunity
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {['', 'draft', 'published', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#391D65] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#391D65]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-[#391D65] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 text-sm">No opportunities yet. Create your first one.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Deadline</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Featured</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opportunities.map((opp) => (
                <tr key={opp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{opp.title}</td>
                  <td className="px-4 py-3 text-gray-600">{opp.organisation}</td>
                  <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[opp.category] || opp.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLOURS[opp.status]}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {opp.deadline
                      ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {opp.is_featured ? (
                      <span className="text-amber-500" title="Featured">★</span>
                    ) : (
                      <span className="text-gray-300">☆</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/opportunities/${opp.id}/edit`)}
                        className="text-xs text-[#391D65] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      {opp.status === 'draft' && (
                        <>
                          <button
                            onClick={() => updateStatus(opp.id, 'published')}
                            disabled={actionLoading === opp.id}
                            className="text-xs text-green-700 hover:underline font-medium disabled:opacity-50"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => deleteOpportunity(opp.id)}
                            disabled={actionLoading === opp.id}
                            className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {opp.status === 'published' && (
                        <button
                          onClick={() => updateStatus(opp.id, 'archived')}
                          disabled={actionLoading === opp.id}
                          className="text-xs text-amber-700 hover:underline font-medium disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                      {opp.status === 'archived' && (
                        <button
                          onClick={() => deleteOpportunity(opp.id)}
                          disabled={actionLoading === opp.id}
                          className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
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
  );
}
