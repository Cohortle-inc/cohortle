'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import apiClient from '@/lib/api/client';

interface Lead {
  id: string;
  organisation_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  programme_type: string;
  participant_count?: number;
  current_tools?: string;
  pain_points?: string;
  cohort_start_date?: string;
  status: string;
  created_at: string;
}

const STATUS_COLOURS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  demo_scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function LeadsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'administrator') {
        router.replace('/unauthorized');
      }
    }
  }, [user, isLoading, router]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<Lead[]>('/v1/api/funnel/leads');
      setLeads(res.data);
    } catch {
      setError('Failed to load leads. Make sure you are logged in as an administrator.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'administrator') {
      fetchLeads();
    }
  }, [user, fetchLeads]);

  if (isLoading || !user) return null;
  if (user.role !== 'administrator') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-[#391D65] text-white rounded mb-3">
              Internal
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Partner Leads</h1>
            <p className="text-slate-500 text-sm">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={fetchLeads}
            className="text-sm text-[#391D65] border border-[#391D65] rounded-lg px-4 py-2 hover:bg-[#F8F1FF] transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-400 text-sm">Loading leads…</div>
        )}

        {/* Empty */}
        {!loading && !error && leads.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            No leads yet. They will appear here once someone submits the partner application form.
          </div>
        )}

        {/* Leads list */}
        {!loading && leads.length > 0 && (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Row */}
                <button
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                >
                  {/* Org initial */}
                  <div className="h-10 w-10 rounded-full bg-[#391D65] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {lead.organisation_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {lead.organisation_name}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {lead.contact_name} · {lead.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        STATUS_COLOURS[lead.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lead.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(lead.created_at)}</span>
                    <span className="text-slate-400 text-sm">{expanded === lead.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === lead.id && (
                  <div className="border-t border-slate-100 px-6 py-5 grid sm:grid-cols-2 gap-4 text-sm">
                    <Detail label="Programme Type" value={lead.programme_type} />
                    <Detail label="Participants" value={lead.participant_count?.toString() ?? '—'} />
                    <Detail label="Phone" value={lead.phone ?? '—'} />
                    <Detail label="Website" value={lead.website ?? '—'} link={lead.website} />
                    <Detail label="Cohort Start" value={lead.cohort_start_date ?? '—'} />
                    <Detail label="Submitted" value={formatDate(lead.created_at)} />
                    {lead.current_tools && (
                      <Detail label="Current Tools" value={lead.current_tools} wide />
                    )}
                    {lead.pain_points && (
                      <Detail label="Pain Points" value={lead.pain_points} wide />
                    )}

                    {/* Quick actions */}
                    <div className="sm:col-span-2 flex gap-3 pt-2 border-t border-slate-100 mt-1">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-xs font-medium text-[#391D65] border border-[#391D65] rounded-lg px-3 py-1.5 hover:bg-[#F8F1FF] transition-colors"
                      >
                        Email {lead.contact_name.split(' ')[0]}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  link,
  wide,
}: {
  label: string;
  value: string;
  link?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#391D65] underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-slate-700 break-words">{value}</p>
      )}
    </div>
  );
}
