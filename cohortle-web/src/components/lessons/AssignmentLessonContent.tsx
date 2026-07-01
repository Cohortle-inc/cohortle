'use client';

import React, { useRef, useState } from 'react';
import { useAssignment } from '@/lib/hooks/useAssignment';
import { SubmissionFile } from '@/lib/api/assignments';

interface AssignmentLessonContentProps {
  lessonId: string;
  cohortId: string;
  title: string;
}

export function AssignmentLessonContent({
  lessonId,
  cohortId,
  title,
}: AssignmentLessonContentProps) {
  const {
    assignment,
    submission,
    isLoading,
    error,
    isSubmitting,
    submit,
    submitFiles,
    draftAnswer,
    setDraftAnswer,
  } = useAssignment(lessonId, cohortId);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <AssignmentSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
          <p className="text-red-700 font-medium">Failed to load assignment</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!assignment?.assignment_data) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center" role="alert">
          <p className="text-yellow-800 font-medium">Assignment not configured</p>
          <p className="text-yellow-700 text-sm mt-1">Please contact your instructor.</p>
        </div>
      </div>
    );
  }

  const { assignment_data } = assignment;
  const isOverdue = assignment_data.due_date
    ? new Date(assignment_data.due_date) < new Date()
    : false;
  const hasSubmission = !!submission;
  const isGraded = submission?.status === 'graded';

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setFileError(null);
    const maxMb = assignment_data.max_file_size_mb ?? 10;
    const maxBytes = maxMb * 1024 * 1024;
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxBytes) {
        setFileError(`"${file.name}" exceeds the maximum size of ${maxMb} MB`);
        return;
      }
      valid.push(file);
    }
    setSelectedFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await submit(draftAnswer || undefined);
      if (selectedFiles.length > 0) {
        await submitFiles(selectedFiles);
        setSelectedFiles([]);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <StatusBadge submission={submission} />
        </div>

        {/* Due date */}
        {assignment_data.due_date && (
          <p
            className={`mt-2 text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}
            aria-label={`Due date: ${new Date(assignment_data.due_date).toLocaleString()}`}
          >
            {isOverdue ? '⚠️ Overdue — ' : '📅 Due: '}
            {new Date(assignment_data.due_date).toLocaleString()}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {assignment_data.instructions}
        </div>
      </div>

      {/* Graded view */}
      {isGraded && (
        <GradedView submission={submission!} />
      )}

      {/* Submitted (pending grading) view */}
      {hasSubmission && !isGraded && (
        <SubmittedView submission={submission!} />
      )}

      {/* Submission form — shown when not yet submitted */}
      {!hasSubmission && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Submission</h2>

          {/* Text answer */}
          {assignment_data.allow_text_answer !== false && (
            <div className="mb-5">
              <label
                htmlFor="assignment-text-answer"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Written Answer
              </label>
              <textarea
                id="assignment-text-answer"
                value={draftAnswer}
                onChange={e => setDraftAnswer(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="Type your answer here…"
                aria-describedby="draft-hint"
                disabled={isSubmitting}
              />
              <p id="draft-hint" className="mt-1 text-xs text-gray-500">
                Your answer is saved automatically as you type.
              </p>
            </div>
          )}

          {/* File upload */}
          {assignment_data.allow_file_uploads !== false && (
            <div className="mb-5">
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Attach Files
                {assignment_data.max_file_size_mb && (
                  <span className="text-gray-400 font-normal ml-1">
                    (max {assignment_data.max_file_size_mb} MB each)
                  </span>
                )}
              </p>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload files — click or drag and drop"
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileChange(e.dataTransfer.files);
                }}
              >
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-hidden="true"
                onChange={e => handleFileChange(e.target.files)}
              />

              {fileError && (
                <p className="mt-2 text-sm text-red-600" role="alert">{fileError}</p>
              )}

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <ul className="mt-3 space-y-2" aria-label="Selected files">
                  {selectedFiles.map((file, i) => (
                    <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs font-medium"
                        aria-label={`Remove ${file.name}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {submitError && (
            <p className="mb-4 text-sm text-red-600" role="alert">{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!draftAnswer.trim() && selectedFiles.length === 0)}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Assignment'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ submission }: { submission: ReturnType<typeof useAssignment>['submission'] }) {
  if (!submission) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Not Started
      </span>
    );
  }
  if (submission.status === 'graded') {
    if (submission.grading_status === 'passed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Passed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Needs Revision
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      Submitted
    </span>
  );
}

function SubmittedView({ submission }: { submission: NonNullable<ReturnType<typeof useAssignment>['submission']> }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6" aria-live="polite">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-base font-semibold text-blue-900">Submitted — Awaiting Feedback</h2>
      </div>
      {submission.submitted_at && (
        <p className="text-sm text-blue-700 mb-3">
          Submitted on {new Date(submission.submitted_at).toLocaleString()}
        </p>
      )}
      {submission.text_answer && (
        <div className="bg-white rounded border border-blue-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {submission.text_answer}
        </div>
      )}
      <FileList files={submission.files} />
    </div>
  );
}

function GradedView({ submission }: { submission: NonNullable<ReturnType<typeof useAssignment>['submission']> }) {
  const passed = submission.grading_status === 'passed';
  return (
    <div
      className={`border rounded-lg p-6 mb-6 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-2xl`} aria-hidden="true">{passed ? '✅' : '❌'}</span>
        <h2 className={`text-base font-semibold ${passed ? 'text-green-900' : 'text-red-900'}`}>
          {passed ? 'Passed' : 'Needs Revision'}
        </h2>
      </div>

      {submission.feedback && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Instructor Feedback</p>
          <div className="bg-white rounded border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {submission.feedback}
          </div>
        </div>
      )}

      {submission.text_answer && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Your Answer</p>
          <div className="bg-white rounded border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {submission.text_answer}
          </div>
        </div>
      )}

      <FileList files={submission.files} />
    </div>
  );
}

function FileList({ files }: { files: SubmissionFile[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Attached Files</p>
      <ul className="space-y-1">
        {files.map(f => (
          <li key={f.id}>
            <a
              href={f.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {f.file_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssignmentSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-pulse" aria-busy="true" aria-label="Loading assignment">
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-32 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
    </div>
  );
}
