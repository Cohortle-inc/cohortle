'use client';

/**
 * Empty State Component
 * Role-aware empty states for dashboard
 */

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  role: 'student' | 'convener';
  type: 'programmes' | 'cohorts' | 'learners';
}

export function EmptyState({ role, type }: EmptyStateProps) {
  if (role === 'student' && type === 'programmes') {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ECDCFF] mb-4">
          <svg
            className="w-8 h-8 text-[#391D65]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You&apos;re not enrolled in any programmes yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Join a programme using an enrolment code from your instructor to start learning.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/join"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium text-base"
          >
            Join with Code
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
          >
            Explore Programmes
          </Link>
        </div>
      </div>
    );
  }

  if (role === 'convener' && type === 'programmes') {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ECDCFF] mb-4">
          <svg
            className="w-8 h-8 text-[#391D65]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You haven&apos;t created any programmes yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Create your first programme to start building cohort-based learning experiences for your organisation.
        </p>
        <Link
          href="/convener/programmes/create"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium text-base"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Your First Programme
        </Link>
      </div>
    );
  }

  if (role === 'convener' && type === 'cohorts') {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ECDCFF] mb-4">
          <svg
            className="w-8 h-8 text-[#391D65]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No cohorts yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Create a programme first, then you can create cohorts to organize your learners.
        </p>
        <Link
          href="/convener/programmes/create"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium text-base"
        >
          Create Programme
        </Link>
      </div>
    );
  }

  // Default empty state
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Nothing here yet
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        Check back later for updates.
      </p>
    </div>
  );
}
