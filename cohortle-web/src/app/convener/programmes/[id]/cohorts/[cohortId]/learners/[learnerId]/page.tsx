'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
<<<<<<< HEAD
import {
  getLearnerDetail,
  getGlobalLearnerProfile,
  getLearnerActivity
} from '@/lib/api/convener';
=======
import { getLearnerDetail, getLearnerPayments, type LearnerDetail, type LearnerPaymentDetails } from '@/lib/api/convener';
>>>>>>> c1a9f69 (Wire cohort learner page to real cohort metadata and expose payment details)
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import LearnerProfileOverview from '@/components/convener/LearnerProfileOverview';
import LearnerActivityTimeline from '@/components/convener/LearnerActivityTimeline';
import LearnerProgrammeHistory from '@/components/convener/LearnerProgrammeHistory';

function LearnerDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programmeId = params.id as string;
  const cohortId = params.cohortId as string;
  const learnerId = params.learnerId as string;

  const tabParam = searchParams.get('tab') as 'overview' | 'activity' | 'history' | 'current-cohort';
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'history' | 'current-cohort'>(tabParam || 'overview');

  // Sync state with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  'use client';

  import { useParams, useRouter, useSearchParams } from 'next/navigation';
  import React, { useState, useEffect } from 'react';
  import { useQuery } from '@tanstack/react-query';
  import {
    getLearnerDetail,
    getLearnerPayments,
    getGlobalLearnerProfile,
    getLearnerActivity,
    type LearnerDetail,
    type LearnerPaymentDetails,
  } from '@/lib/api/convener';
  import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
  import LearnerProfileOverview from '@/components/convener/LearnerProfileOverview';
  import LearnerActivityTimeline from '@/components/convener/LearnerActivityTimeline';
  import LearnerProgrammeHistory from '@/components/convener/LearnerProgrammeHistory';

  export default function LearnerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const programmeId = params.id as string;
    const cohortId = params.cohortId as string;
    const learnerId = params.learnerId as string;

    const tabParam = searchParams?.get('tab') as 'overview' | 'activity' | 'history' | 'current-cohort' | null;
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'history' | 'current-cohort'>(tabParam || 'overview');

    useEffect(() => {
      if (tabParam && tabParam !== activeTab) setActiveTab(tabParam as any);
    }, [tabParam]);

    const { data: learner, isLoading: isCohortLoading } = useQuery({
      queryKey: ['learner-detail', cohortId, learnerId],
      queryFn: () => getLearnerDetail(cohortId, learnerId),
    });

    const { data: paymentDetails, isLoading: isPaymentsLoading } = useQuery({
      queryKey: ['learner-payments', cohortId, learnerId],
      queryFn: () => getLearnerPayments(cohortId, learnerId),
      enabled: !!learner,
    });

    const { data: globalProfile, isLoading: isGlobalLoading, error: globalError } = useQuery({
      queryKey: ['global-learner-profile', learnerId],
      queryFn: () => getGlobalLearnerProfile(learnerId),
    });

    const { data: activity = [], isLoading: isActivityLoading } = useQuery({
      queryKey: ['learner-activity', learnerId],
      queryFn: () => getLearnerActivity(learnerId),
      enabled: activeTab === 'activity',
    });

    const isLoading = isCohortLoading || isGlobalLoading || isPaymentsLoading;

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (globalError) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-1">Failed to load learner details</h3>
            <p className="text-sm text-red-700">{(globalError as Error).message}</p>
          </div>
        </div>
      );
    }

    if (!learner || !globalProfile) return null;

    const tabs = [
      { id: 'overview', name: 'Overview' },
      { id: 'activity', name: 'Timeline' },
      { id: 'history', name: 'History' },
      { id: 'current-cohort', name: 'Current Progress' },
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push(`/convener/programmes/${programmeId}/cohorts/${cohortId}/learners`)}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learners
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Payment Status</p>
              <p className="text-xl font-semibold text-gray-900">{paymentDetails?.enrollment.paymentStatus ?? 'Unknown'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Payment Due Date</p>
              <p className="text-xl font-semibold text-gray-900">
                {paymentDetails?.enrollment.paymentDueDate ? new Date(paymentDetails.enrollment.paymentDueDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Installment Plan</p>
              <p className="text-xl font-semibold text-gray-900">{paymentDetails?.installmentPlan ? 'Enabled' : 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); router.push(`?tab=${tab.id}`, { scroll: false }); }}
                className={`px-4 py-3 font-medium transition border-b-2 ${
                  activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'overview' && <LearnerProfileOverview profile={globalProfile} />}
          {activeTab === 'activity' && (isActivityLoading ? <div className="py-12 flex justify-center"><LoadingSpinner /></div> : <LearnerActivityTimeline activities={activity} />)}
          {activeTab === 'history' && <LearnerProgrammeHistory history={globalProfile.history} />}
          {activeTab === 'current-cohort' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{learner.completedLessons}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                      <p className="text-2xl font-bold text-gray-900">{learner.totalLessons}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(learner.completionPercentage)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {(learner.lessonProgress ?? []).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No lessons available</p>
                ) : (
                  <div className="space-y-2">
                    {(learner.lessonProgress ?? []).map((lesson) => (
                      <div key={lesson.lessonId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center flex-1">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${lesson.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {lesson.completed ? (
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-semibold text-gray-900">{lesson.lessonName}</p>
                            <p className="text-xs text-gray-500">{lesson.moduleName}</p>
                          </div>
                        </div>
                        {lesson.completed && lesson.completedAt && (
                          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">{new Date(lesson.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
                  </div>
