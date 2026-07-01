'use client';

/**
 * Cohort Detail Page
 * Page for viewing and managing a specific cohort
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCohortDetail } from '@/lib/hooks/useCohortDetail';
import EditCohortModal from '@/components/convener/EditCohortModal';
import DeleteConfirmModal from '@/components/convener/DeleteConfirmModal';
import TestimonialCollectionLinkSection from '@/components/convener/TestimonialCollectionLinkSection';
import { deleteCohort, getCohortLearners, type Learner } from '@/lib/api/convener';
import { useQuery } from '@tanstack/react-query';

export default function CohortDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  const cohortId = params.cohortId as string;

  const { data: cohort, isLoading, error, refetch } = useCohortDetail(programmeId, cohortId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch learners separately
  const { data: learners = [], isLoading: learnersLoading } = useQuery<Learner[], Error>({
    queryKey: ['cohort-learners', cohortId],
    queryFn: () => getCohortLearners(cohortId),
    enabled: !!cohortId,
    staleTime: 30 * 1000,
  });

  const handleEditSuccess = () => {
    setShowEditModal(false);
    refetch();
  };

  const handleDeleteConfirm = async () => {
    await deleteCohort(cohortId);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                Failed to load cohort
              </h3>
              <p className="text-sm text-red-700">{error.message}</p>
              <button
                onClick={() => router.push(`/convener/programmes/${programmeId}`)}
                className="mt-4 text-sm text-red-800 underline hover:text-red-900"
              >
                Return to programme
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cohort) {
    return null;
  }

  const enrolledCount = cohort.metrics?.memberCount ?? cohort.enrolledCount ?? 0;
  const avgCompletion = cohort.metrics?.averageCompletionPercentage ?? 0;
  const totalCompleted = cohort.metrics?.totalCompletedLessons ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
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

      {/* Cohort Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {cohort.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Code: <span className="font-mono font-semibold ml-1">{cohort.enrollmentCode}</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Start Date: {new Date(cohort.startDate).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  cohort.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {cohort.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Cohort
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Cohort
          </button>
          {cohort.enrolledCount > 0 && (
            <Link
              href={`/convener/programmes/${programmeId}/cohorts/${cohortId}/learners`}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              View Learners
            </Link>
          )}
          <Link
            href={`/convener/programmes/${programmeId}/cohorts/${cohortId}/analytics`}
            className="px-4 py-2 bg-[#391D65] text-white font-medium rounded-lg hover:bg-[#391D65]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Enrollment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Learners</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Collection Link */}
      <TestimonialCollectionLinkSection cohortId={parseInt(cohortId, 10)} />

      {/* Enrolled Learners */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Learners</h2>

        {learnersLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : learners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">No learners enrolled yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Share the enrollment code <span className="font-mono font-semibold">{cohort.enrollmentCode}</span> with learners
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-600">Learner</th>
                  <th className="pb-3 font-medium text-gray-600">Email</th>
                  <th className="pb-3 font-medium text-gray-600">Enrolled</th>
                  <th className="pb-3 font-medium text-gray-600">Progress</th>
                  <th className="pb-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {learners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">
                      {learner.firstName} {learner.lastName}
                    </td>
                    <td className="py-3 text-gray-600">{learner.email}</td>
                    <td className="py-3 text-gray-600">
                      {learner.enrolledAt ? new Date(learner.enrolledAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${learner.completionPercentage ?? 0}%` }}
                          />
                        </div>
                        <span className="text-gray-600">{learner.completionPercentage ?? 0}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/convener/programmes/${programmeId}/cohorts/${cohortId}/learners/${learner.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && cohort && (
        <EditCohortModal
          cohortId={cohortId}
          initialData={{
            name: cohort.name,
            enrollmentCode: cohort.enrollmentCode,
            startDate: cohort.startDate,
          }}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showDeleteModal && cohort && (
        <DeleteConfirmModal
          title="Delete Cohort"
          message="Are you sure you want to delete this cohort?"
          itemName={cohort.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}