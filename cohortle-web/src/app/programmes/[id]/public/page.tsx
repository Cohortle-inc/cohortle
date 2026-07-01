'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getProgrammeDetail, ProgrammeDetail } from '@/lib/api/programmes';

export default function PublicProgrammeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [programme, setProgramme] = useState<ProgrammeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const programmeId = params?.id as string;

  useEffect(() => {
    if (!programmeId) {
      setError('Programme ID is missing');
      setIsLoading(false);
      return;
    }
    getProgrammeDetail(Number(programmeId))
      .then(setProgramme)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load programme'))
      .finally(() => setIsLoading(false));
  }, [programmeId]);

  const handleEnroll = () => {
    router.push(`/join?programme=${programmeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#391D65] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !programme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Programme</h3>
          <p className="text-red-800 mb-4">{error || 'Programme not found'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
            <a href="/discover" className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50">
              Discover Programmes
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {programme.thumbnail && (
            <img src={programme.thumbnail} alt={programme.name} className="w-full h-56 object-cover" />
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{programme.name}</h1>
            {programme.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{programme.description}</p>
            )}
            <button
              onClick={handleEnroll}
              className="px-6 py-3 bg-[#391D65] text-white rounded-lg font-medium hover:bg-[#391D65]/90 transition-colors"
            >
              {user ? 'Enrol Now' : 'Join Programme'}
            </button>
          </div>
        </div>

        {/* Weeks / Structure */}
        {programme.weeks && programme.weeks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Programme Structure</h2>
            <div className="space-y-3">
              {programme.weeks.map((week: { id: number; week_number: number; title: string }) => (
                <div key={week.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-8 h-8 flex items-center justify-center bg-[#391D65]/10 text-[#391D65] rounded-full text-sm font-semibold">
                    {week.week_number}
                  </span>
                  <span className="text-gray-700 font-medium">{week.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
