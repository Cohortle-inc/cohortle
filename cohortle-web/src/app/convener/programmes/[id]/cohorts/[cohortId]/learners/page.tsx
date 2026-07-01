'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCohortLearners, type Learner } from '@/lib/api/convener';
import { useCohortDetail } from '@/lib/hooks/useCohortDetail';
import { OperationsCenter } from '@/components/operations-center';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CohortLearnersPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const cohortId = params.cohortId as string;

  const { data: cohort, isLoading: cohortLoading, error: cohortError } = useCohortDetail(programmeId, cohortId);

  const {
    data: learners = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cohort-learners', cohortId],
    queryFn: () => getCohortLearners(cohortId),
  });

  const cohortName = cohort?.name ?? 'Cohort';
  const programmeName = cohort?.programmeName ?? 'Programme';

  if (isLoading || cohortLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || cohortError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          ← Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-1">
            Failed to load learners
          </h3>
          <p className="text-sm text-red-700">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center"
      >
        ← Back to Cohort
      </button>

      {/* Operations Center */}
      <OperationsCenter
        learners={learners}
        cohortName={cohortName}
        programmeName={programmeName}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />
    </div>
  );
}
