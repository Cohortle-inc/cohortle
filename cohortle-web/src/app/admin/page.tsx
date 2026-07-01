'use client';

import React, { useEffect, useState } from 'react';
import { getAdminStats, AdminStats } from '@/lib/api/admin';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setError('Failed to load platform stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error || 'Failed to load stats'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform Overview</h1>
      <p className="text-gray-500 mb-8">Real-time snapshot of the Cohortle platform.</p>

      {/* Users */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.users.total} />
          <StatCard label="Learners" value={stats.users.students} />
          <StatCard label="Conveners" value={stats.users.conveners} />
          <StatCard label="New (30 days)" value={stats.users.recentSignups} sub="recent signups" />
        </div>
      </section>

      {/* Programmes & Cohorts */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Programmes & Cohorts</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Programmes" value={stats.programmes.total} />
          <StatCard label="Active Programmes" value={stats.programmes.active} />
          <StatCard label="Total Cohorts" value={stats.cohorts.total} />
          <StatCard label="Total Enrolments" value={stats.enrollments.total} />
        </div>
      </section>

      {/* Learning */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Learning Activity</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Lessons Completed" value={stats.learning.totalLessonCompletions} />
          <StatCard label="Administrators" value={stats.users.administrators} />
        </div>
      </section>
    </div>
  );
}
