'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getEnrolledProgrammes, EnrolledProgramme } from '@/lib/api/programmes';
import { CommunityFeed } from '@/components/community/CommunityFeed';

export default function ProgrammeCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const programmeId = params.id as string;
  
  const [cohortId, setCohortId] = useState<number | null>(null);
  const [programmeName, setProgrammeName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch user's enrollment to get cohort ID
    const fetchEnrollment = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const enrolledProgrammes = await getEnrolledProgrammes();
        const enrollment = enrolledProgrammes.find(
          (p: EnrolledProgramme) => p.id.toString() === programmeId
        );

        if (!enrollment) {
          setError('You are not enrolled in this programme');
          return;
        }

        setCohortId(enrollment.cohortId);
        setProgrammeName(enrollment.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify enrollment');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEnrollment();
    }
  }, [user, authLoading, programmeId, router]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  if (!cohortId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/programmes/${programmeId}/learn`)}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Programme
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{programmeName}</h1>
          <p className="text-gray-600 mt-1">Community Discussion</p>
        </div>

        {/* Community Feed */}
        <CommunityFeed cohortId={cohortId} currentUserId={user?.id || ''} />
      </div>
    </div>
  );
}
