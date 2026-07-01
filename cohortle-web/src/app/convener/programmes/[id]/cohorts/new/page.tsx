'use client';

/**
 * Cohort Creation Page
 * Page for creating a new cohort for a programme
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CohortForm } from '@/components/convener/CohortForm';
import { createCohort, CohortFormData, getProgramme, getCohorts } from '@/lib/api/convener';

interface ExistingCohort {
  id: number | string;
  name: string;
  enrollmentCode: string;
  startDate: string;
}

export default function NewCohortPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  
  const [createdEnrolmentCode, setCreatedEnrolmentCode] = useState<string | null>(null);
  const [programmeName, setProgrammeName] = useState<string>('');
  const [existingCohorts, setExistingCohorts] = useState<ExistingCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch programme details and existing cohorts
  useEffect(() => {
    async function fetchData() {
      try {
        const [programme, cohorts] = await Promise.all([
          getProgramme(programmeId),
          getCohorts(programmeId),
        ]);
        
        setProgrammeName(programme.name);
        
        // Store existing cohorts for display
        setExistingCohorts(cohorts.map(c => ({
          id: c.id,
          name: c.name,
          enrollmentCode: c.enrollmentCode,
          startDate: c.startDate,
        })));
      } catch (err) {
        console.error('Failed to fetch programme data:', err);
        setError('Failed to load programme details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [programmeId]);

  const handleSubmit = async (data: CohortFormData) => {
    try {
      const cohort = await createCohort(programmeId, data);
      setCreatedEnrolmentCode(cohort.enrollmentCode);
    } catch (error) {
      console.error('Failed to create cohort:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/convener/programmes/${programmeId}`);
  };

  const handleDone = () => {
    router.push(`/convener/programmes/${programmeId}`);
  };

  // Success state - show enrolment code prominently
  if (createdEnrolmentCode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Cohort Created Successfully!
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Share this enrolment code with your learners so they can join the cohort.
            </p>

            {/* Enrolment Code Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enrolment Code
              </label>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-bold text-blue-900 tracking-wider">
                  {createdEnrolmentCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdEnrolmentCode);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                  aria-label="Copy enrolment code to clipboard"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center mt-3">
                Learners can use this code to enrol in the programme
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleDone}
              className="
                w-full px-6 py-3 min-h-[44px] bg-[#391D65] text-white rounded-lg
                font-medium hover:bg-[#391D65]/90
                focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2
                transition-colors duration-200
              "
            >
              Return to Programme
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form state - show cohort creation form
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#391D65]"></div>
              <span className="ml-3 text-gray-600">Loading programme details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
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
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Programme</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/convener/dashboard')}
                className="px-4 py-2 bg-[#391D65] text-white rounded-md hover:bg-[#391D65]/90"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleCancel}
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

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Cohort
          </h1>
          <p className="text-gray-600 mb-6">
            Create a cohort to organise learners and generate an enrolment code.
          </p>

          <CohortForm
            programmeId={programmeId}
            programmeName={programmeName}
            existingCohorts={existingCohorts}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
