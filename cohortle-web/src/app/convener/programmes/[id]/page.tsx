'use client';

/**
 * Programme Detail Page
 * Central hub for managing programme content - cohorts, weeks, and lessons
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useProgrammeDetail } from '@/lib/hooks/useProgrammeDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PreviewMode, PreviewModeButton } from '@/components/convener/PreviewMode';
import { useAuth } from '@/lib/contexts/AuthContext';
import apiClient from '@/lib/api/client';
import { ApplicationTemplateEditor, type TemplateQuestion } from '@/components/convener/ApplicationTemplateEditor';
import { getApplicationTemplate, saveApplicationTemplate, getApplicationCounts, type StatusCounts } from '@/lib/api/applications';

/** Small helper: copy a URL to clipboard with feedback */
function CopyUrlButton({
  label,
  url,
  placeholder,
}: {
  label: string;
  url: string | null;
  placeholder?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  if (!url) {
    return (
      <span className="px-4 py-2 text-sm text-gray-400 border border-dashed border-gray-300 rounded-lg cursor-not-allowed" title={placeholder}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
}

export default function ProgrammeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programmeId = params.id as string;
  const isNewSetup = searchParams.get('setup_form') === '1';
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { user } = useAuth();
  
  const { 
    programme, 
    isLoading, 
    error, 
    publishProgramme, 
    isPublishing, 
    publishError 
  } = useProgrammeDetail(programmeId);

  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  // Application template state
  const [templateQuestions, setTemplateQuestions] = useState<TemplateQuestion[]>([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);
  const [appCounts, setAppCounts] = useState<StatusCounts | null>(null);

  // Scroll to application form section when redirected from creation
  useEffect(() => {
    if (isNewSetup && !isLoading) {
      setTimeout(() => {
        document.getElementById('application-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isNewSetup, isLoading]);
  useEffect(() => {
    if (!programme) return;
    const mode = (programme as any).onboardingMode || (programme as any).onboarding_mode;
    if (mode !== 'application' && mode !== 'hybrid') return;
    getApplicationTemplate(programmeId)
      .then(qs => setTemplateQuestions(qs.map(q => ({ ...q, options: q.options ?? undefined }))))
      .catch(() => {});
    getApplicationCounts(Number(programmeId))
      .then(setAppCounts)
      .catch(() => {});
  }, [programme, programmeId]);

  const handleSaveTemplate = async () => {
    setTemplateSaving(true);
    setTemplateMsg(null);
    try {
      await saveApplicationTemplate(programmeId, templateQuestions);
      setTemplateMsg('Template saved.');
    } catch {
      setTemplateMsg('Failed to save template.');
    } finally {
      setTemplateSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await publishProgramme();
    } catch (err) {
      console.error('Failed to publish programme:', err);
    }
  };

  const handleLifecycleTransition = async (newState: string) => {
    setLifecycleLoading(true);
    setLifecycleError(null);
    try {
      await apiClient.post(`/v1/api/programmes/${programmeId}/lifecycle/transition`, {
        new_state: newState,
      });
      // Reload the page to reflect the new state
      window.location.reload();
    } catch (err: any) {
      setLifecycleError(
        err?.response?.data?.message || 'Failed to update programme status.'
      );
    } finally {
      setLifecycleLoading(false);
    }
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
    );
  }

  // Programme not found
  if (!programme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Programme not found
          </h3>
          <p className="text-gray-600 mb-4">
            The programme you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/convener/dashboard')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  // After toCamelCase transform, snake_case fields become camelCase
  const onboardingMode: string = (programme as any).onboardingMode || (programme as any).onboarding_mode || 'code';
  const applicationFormSlug: string | null = (programme as any).applicationFormSlug || (programme as any).application_form_slug || null;
  const lifecycleStatus = (programme as any).lifecycleStatus || (programme as any).lifecycle_status || programme.status || 'draft';

  // Lifecycle status display config
  const lifecycleConfig: Record<string, { label: string; colour: string }> = {
    draft:      { label: 'Draft',      colour: 'bg-yellow-100 text-yellow-800' },
    recruiting: { label: 'Recruiting', colour: 'bg-blue-100 text-blue-800' },
    active:     { label: 'Active',     colour: 'bg-green-100 text-green-800' },
    completed:  { label: 'Completed',  colour: 'bg-gray-100 text-gray-700' },
    archived:   { label: 'Archived',   colour: 'bg-gray-100 text-gray-500' },
    published:  { label: 'Published',  colour: 'bg-green-100 text-green-800' },
  };

  // Valid next transitions from current state
  const validTransitions: Record<string, string[]> = {
    draft:      ['recruiting', 'active', 'archived'],
    recruiting: ['active', 'draft', 'archived'],
    active:     ['completed', 'archived'],
    completed:  ['archived'],
    archived:   [],
    published:  ['archived'],
  };

  const nextStates = validTransitions[lifecycleStatus] ?? [];

  const transitionLabels: Record<string, string> = {
    recruiting: 'Open for Applications',
    active:     'Mark as Active',
    draft:      'Revert to Draft',
    completed:  'Mark as Completed',
    archived:   'Archive',
  };

  const transitionColours: Record<string, string> = {
    recruiting: 'bg-blue-600 hover:bg-blue-700 text-white',
    active:     'bg-green-600 hover:bg-green-700 text-white',
    draft:      'bg-gray-200 hover:bg-gray-300 text-gray-800',
    completed:  'bg-gray-600 hover:bg-gray-700 text-white',
    archived:   'bg-red-100 hover:bg-red-200 text-red-700',
  };

  const cfg = lifecycleConfig[lifecycleStatus] ?? lifecycleConfig.draft;

  // If in preview mode, show the preview interface
  if (isPreviewMode) {
    return (
      <PreviewMode
        programmeId={programmeId}
        programmeName={programme.name}
        programmeDescription={programme.description}
        onExit={() => setIsPreviewMode(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/convener/dashboard')}
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
        Back to Dashboard
      </button>

      {/* Programme Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {programme.name}
              </h1>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${cfg.colour}`}>
                {cfg.label}
              </span>
            </div>
            {programme.description && (
              <p className="text-gray-600">{programme.description}</p>
            )}
          </div>
        </div>

        {/* Programme Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
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
            Start Date: {new Date(programme.startDate).toLocaleDateString()}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Created: {new Date(programme.createdAt).toLocaleDateString()}
          </div>
          {/* Capacity usage — only shown when max_capacity is set */}
          {programme.max_capacity && appCounts && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Capacity: {appCounts.accepted}/{programme.max_capacity}
              {appCounts.accepted >= programme.max_capacity && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">Full</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/convener/programmes/${programmeId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Programme
          </Link>

          {/* Lifecycle transition buttons */}
          {nextStates.map(state => (
            <button
              key={state}
              onClick={() => handleLifecycleTransition(state)}
              disabled={lifecycleLoading}
              className={`px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${transitionColours[state] ?? 'bg-gray-200 text-gray-800'}`}
            >
              {lifecycleLoading ? 'Updating...' : transitionLabels[state] ?? state}
            </button>
          ))}

          {/* Legacy publish button for programmes that haven't migrated to lifecycle yet */}
          {lifecycleStatus === 'draft' && programme.status !== 'published' && nextStates.length === 0 && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </button>
          )}

          <PreviewModeButton
            onClick={() => setIsPreviewMode(true)}
            disabled={programme.weeks.length === 0}
          />

          {/* Lifecycle error */}
          {lifecycleError && (
            <p className="w-full text-sm text-red-600 mt-1">{lifecycleError}</p>
          )}
          {/* Copy Application Form URL — Requirements: 1.5 */}
          {(onboardingMode === 'application' || onboardingMode === 'hybrid') ? (
            <CopyUrlButton
              label="Copy Application Form URL"
              url={
                applicationFormSlug
                  ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${applicationFormSlug}`
                  : null
              }
            />
          ) : null}
          {/* Applications link — visible for application/hybrid modes */}
          {(onboardingMode === 'application' || onboardingMode === 'hybrid') && (
            <Link
              href={`/convener/programmes/${programmeId}/applications`}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              View Applications
            </Link>
          )}
          {/* Copy Org Page URL — Requirements: 13.5 */}
          <CopyUrlButton
            label="Copy Org Page URL"
            url={
              user?.organisationSlug
                ? `${typeof window !== 'undefined' ? window.location.origin : ''}/org/${user.organisationSlug}`
                : null
            }
            placeholder="Set organisation slug in profile settings first"
          />
        </div>
      </div>

      {/* Cohorts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cohorts</h2>
          <Link
            href={`/convener/programmes/${programmeId}/cohorts/new`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Cohort
          </Link>
        </div>

        {programme.cohorts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
            <p className="text-sm">No cohorts yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programme.cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/convener/programmes/${programmeId}/cohorts/${cohort.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{cohort.name}</h3>
                    <p className="text-sm text-gray-600">
                      Code: <span className="font-mono font-semibold">{cohort.enrollmentCode}</span>
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Start: {new Date(cohort.startDate).toLocaleDateString()}</div>
                    <div>{cohort.enrolledCount} enrolled</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Application Template — visible for application/hybrid modes */}
      {(onboardingMode === 'application' || onboardingMode === 'hybrid') && (
        <div id="application-form-section" className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Application Form</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Define the questions applicants must answer. At least one question is required before opening for applications.
              </p>
            </div>
          </div>

          {/* Setup prompt — shown when redirected from programme creation */}
          {isNewSetup && templateQuestions.length === 0 && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Set up your application form</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your programme uses application-based onboarding. Add at least one question below so applicants know what to fill in before you open for applications.
                </p>
              </div>
            </div>
          )}
          <ApplicationTemplateEditor
            questions={templateQuestions}
            onChange={setTemplateQuestions}
            disabled={templateSaving}
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveTemplate}
              disabled={templateSaving}
              className="px-4 py-2 bg-[#391D65] text-white text-sm font-medium rounded-lg hover:bg-[#391D65]/90 disabled:opacity-50 transition-colors"
            >
              {templateSaving ? 'Saving…' : 'Save Template'}
            </button>
            {templateMsg && (
              <p className={`text-sm ${templateMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>
                {templateMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Weeks Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Weeks</h2>
          <Link
            href={`/convener/programmes/${programmeId}/weeks/new`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Week
          </Link>
        </div>

        {programme.weeks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
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
            <p className="text-sm">No weeks yet. Create one to add lessons.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {programme.weeks
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map((week) => (
                <div
                  key={week.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Link
                        href={`/convener/programmes/${programmeId}/weeks/${week.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        Week {week.weekNumber}: {week.title}
                      </Link>
                      <p className="text-sm text-gray-600">
                        Start: {new Date(week.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {week.lessons.length} lesson{week.lessons.length !== 1 ? 's' : ''}
                      </span>
                      <Link
                        href={`/convener/programmes/${programmeId}/weeks/${week.id}/lessons/new`}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add Lesson
                      </Link>
                    </div>
                  </div>

                  {week.lessons.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {week.lessons
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                          >
                            <span className="text-xs text-gray-500">
                              {lesson.orderIndex + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-gray-600">
                                {lesson.contentType}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-center py-4 text-gray-500 text-sm">
                      No lessons yet. Click "Add Lesson" to create one.
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
