'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getOrgAnalytics, syncOrgStats, getOrgStats, updateOrgStats, OrgAnalytics, OrgStats } from '@/lib/api/convener';

export default function OrgAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!user) return;
    Promise.all([getOrgAnalytics(), getOrgStats()])
      .then(([a, s]) => { setAnalytics(a); setStats(s); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user, authLoading, router]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const updated = await syncOrgStats();
      setStats(updated);
      setSyncMsg('Stats synced from real data.');
    } catch {
      setSyncMsg('Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#391D65]" />
      </div>
    );
  }

  const maxViews = analytics?.daily?.length
    ? Math.max(...analytics.daily.map(d => Number(d.views)), 1)
    : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/convener/dashboard')}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-3"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Organisation Page Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track how your organisation page is performing</p>
      </div>

      <div className="space-y-6">
        {/* Overview stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Views', value: analytics?.total_views ?? 0 },
            { label: 'Views (30d)', value: analytics?.views_30d ?? 0 },
            { label: 'Views (7d)', value: analytics?.views_7d ?? 0 },
            { label: 'Applications (30d)', value: analytics?.applications_30d ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-[#391D65]">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Conversion rate */}
        {analytics && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Conversion Rate (30d)</h2>
            <p className="text-sm text-gray-500 mb-3">Applications submitted ÷ page views in the last 30 days</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#391D65]">{analytics.conversion_rate}%</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className="bg-[#391D65] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(parseFloat(analytics.conversion_rate), 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Daily views chart */}
        {analytics && analytics.daily.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Views (Last 30 Days)</h2>
            <div className="flex items-end gap-1 h-32">
              {analytics.daily.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-[#391D65]/20 hover:bg-[#391D65]/40 rounded-t transition-colors cursor-default"
                    style={{ height: `${(Number(d.views) / maxViews) * 100}%`, minHeight: '2px' }}
                    title={`${d.date}: ${d.views} views`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {d.date}: {d.views}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{analytics.daily[0]?.date}</span>
              <span>{analytics.daily[analytics.daily.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Stats sync */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Organisation Stats</h2>
          <p className="text-sm text-gray-500 mb-4">
            These are shown as social proof on your organisation page. You can sync them from real data or edit manually in Settings.
          </p>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Total Learners', value: stats.total_learners },
                { label: 'Programmes Completed', value: stats.programmes_completed },
                { label: 'Success Rate', value: `${stats.success_rate}%` },
                { label: 'Years Experience', value: stats.years_experience },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
          {syncMsg && (
            <p className={`text-sm mb-3 ${syncMsg.includes('synced') ? 'text-green-600' : 'text-red-600'}`}>
              {syncMsg}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 bg-[#391D65] text-white text-sm font-medium rounded-md hover:bg-[#391D65]/90 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync from Real Data'}
            </button>
            <button
              onClick={() => router.push('/convener/settings')}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Edit Manually
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sync calculates total learners and programmes from your actual enrollment data. Success rate and years experience must be set manually.
          </p>
        </div>
      </div>
    </div>
  );
}
