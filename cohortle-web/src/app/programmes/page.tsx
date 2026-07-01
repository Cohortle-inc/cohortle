'use client';

/**
 * My Programmes Page
 * Lists all programmes the learner is enrolled in
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getEnrolledProgrammes } from '@/lib/api/programmes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface EnrolledProgramme {
  id: number;
  name: string;
  description?: string;
  cohortId: number;
  cohortName: string;
}

export default function ProgrammesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [programmes, setProgrammes] = useState<EnrolledProgramme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgrammes() {
      if (authLoading) {
        return;
      }

      if (!isAuthenticated) {
        router.push('/login?returnUrl=/programmes');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getEnrolledProgrammes();
        setProgrammes(data);
      } catch (err) {
        console.error('Error fetching programmes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load programmes');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgrammes();
  }, [isAuthenticated, authLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-md hover:bg-blue-700 text-base"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Programmes</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            View and access your enrolled programmes
          </p>
        </div>

        {programmes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No programmes yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              You're not enrolled in any programmes yet. Use an enrolment code to join a programme.
            </p>
            <button
              onClick={() => router.push('/join')}
              className="px-6 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md hover:bg-[#391D65]/90 text-base font-medium"
            >
              Join a Programme
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((programme) => (
              <div
                key={programme.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/programmes/${programme.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {programme.name}
                </h3>
                {programme.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {programme.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Cohort: {programme.cohortName}
                  </span>
                  <svg
                    className="w-5 h-5 text-[#391D65]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
