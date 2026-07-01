'use client';

/**
 * Edit Programme Page
 * Page for editing an existing programme
 */

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProgrammeForm } from '@/components/convener/ProgrammeForm';
import { useProgrammeDetail } from '@/lib/hooks/useProgrammeDetail';
import { updateProgramme, ProgrammeFormData } from '@/lib/api/convener';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EditProgrammePage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  
  const { programme, isLoading, error } = useProgrammeDetail(programmeId);

  const handleSubmit = async (data: ProgrammeFormData) => {
    await updateProgramme(programmeId, data);
    // Navigate back to the programme detail page after successful update
    router.push(`/convener/programmes/${programmeId}`);
  };

  const handleCancel = () => {
    router.push(`/convener/programmes/${programmeId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-1">
                  Failed to load programme
                </h3>
                <p className="text-sm text-red-700">{error.message}</p>
                <button
                  onClick={() => router.push('/convener/dashboard')}
                  className="mt-4 text-sm text-red-800 underline hover:text-red-900"
                >
                  Return to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Programme not found
  if (!programme) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Programme not found
            </h3>
            <p className="text-gray-600 mb-4">
              The programme you're trying to edit doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => router.push('/convener/dashboard')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/convener/programmes/${programmeId}`)}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
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
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Programme</h1>
          <p className="mt-2 text-gray-600">
            Update the details of "{programme.name}"
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <ProgrammeForm 
            mode="edit" 
            initialData={{
              name: programme.name,
              description: programme.description,
              startDate: programme.startDate,
              onboarding_mode: programme.onboarding_mode,
              application_deadline: programme.application_deadline ?? undefined,
              max_capacity: programme.max_capacity ?? undefined,
              // Enrichment fields
              format: (programme as any).format ?? undefined,
              duration: (programme as any).duration ?? undefined,
              price_info: (programme as any).priceInfo ?? (programme as any).price_info ?? undefined,
              prerequisites: (programme as any).prerequisites ?? undefined,
              intro_video_url: (programme as any).introVideoUrl ?? (programme as any).intro_video_url ?? undefined,
              thumbnail_url: (programme as any).thumbnailUrl ?? (programme as any).thumbnail_url ?? undefined,
              // Convert JSON arrays back to newline-separated text for textareas
              highlights_text: (() => {
                const h = (programme as any).highlights ?? (programme as any).highlights;
                if (!h) return '';
                if (Array.isArray(h)) return h.join('\n');
                if (typeof h === 'string') {
                  try { const p = JSON.parse(h); return Array.isArray(p) ? p.join('\n') : h; } catch { return h; }
                }
                return '';
              })(),
              learning_outcomes_text: (() => {
                const lo = (programme as any).learningOutcomes ?? (programme as any).learning_outcomes;
                if (!lo) return '';
                if (Array.isArray(lo)) return lo.join('\n');
                if (typeof lo === 'string') {
                  try { const p = JSON.parse(lo); return Array.isArray(p) ? p.join('\n') : lo; } catch { return lo; }
                }
                return '';
              })(),
            }}
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </div>
  );
}