'use client';

import React from 'react';
import { GlobalLearnerProfile } from '@/lib/api/convener';

interface LearnerProfileOverviewProps {
  profile: GlobalLearnerProfile;
}

export default function LearnerProfileOverview({ profile }: LearnerProfileOverviewProps) {
  // Return empty state or placeholder if no profile provided
  if (!profile) {
    return <div className="p-8 text-center text-gray-500 italic">Learner profile information is unavailable.</div>;
  }

  // Defensive check for stats object
  const stats = profile.stats || {
    overallCompletionRate: 0,
    averageProgress: 0,
    programmesEnrolled: 0,
    programmesCompleted: 0,
    activeProgrammesCount: 0,
    totalLessonsCompleted: 0,
    assignmentsSubmitted: 0,
    communityContributions: 0,
    learningStreak: 0
  };

  const statCards = [
    {
      label: 'Overall Completion',
      value: `${Math.round(stats.overallCompletionRate || 0)}%`,
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-green-50',
    },
    {
      label: 'Avg. Progress',
      value: `${Math.round(stats.averageProgress || 0)}%`,
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bg: 'bg-blue-50',
    },
    {
      label: 'Programmes Completed',
      value: `${stats.programmesCompleted || 0} / ${stats.programmesEnrolled || 0}`,
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      bg: 'bg-purple-50',
    },
    {
      label: 'Active Programmes',
      value: stats.activeProgrammesCount || 0,
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-amber-50',
    },
  ];

  const secondaryStats = [
    { label: 'Lessons Completed', value: stats.totalLessonsCompleted || 0 },
    { label: 'Assignments Submitted', value: stats.assignmentsSubmitted || 0 },
    { label: 'Community Posts', value: stats.communityContributions || 0 },
    { label: 'Learning Streak', value: stats.learningStreak ? `${stats.learningStreak} days` : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Summary Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            {profile.profilePicture ? (
              <img
                className="h-24 w-24 rounded-full border-4 border-gray-50 shadow-sm"
                src={profile.profilePicture}
                alt={profile.firstName}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[#ECDCFF] flex items-center justify-center border-4 border-gray-50 shadow-sm">
                <span className="text-[#391D65] font-bold text-3xl">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-gray-500 mb-2">{profile.email}</p>
            <div className="flex gap-2">
              {profile.enrolledAt && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#391D65] text-white">
                  Member since {new Date(profile.enrolledAt).getFullYear()}
                </span>
              )}
              {(stats.overallCompletionRate || 0) > 80 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  Top Learner
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/60 rounded-lg">
                {card.icon}
              </div>
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Engagement Snapshot</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {secondaryStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Last Activity</h3>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {profile.lastActivityAt
                  ? new Date(profile.lastActivityAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No activity yet'}
              </p>
              <p className="text-xs text-gray-500">
                {profile.lastActivityAt ? 'Recently active' : 'Has not started yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
