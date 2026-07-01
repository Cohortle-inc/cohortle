'use client';

import React, { useState } from 'react';
import { ConvenerSubmission, gradeSubmission } from '@/lib/api/assignments';

interface AssignmentGradeModalProps {
  submission: ConvenerSubmission;
  onClose: () => void;
  onGraded: () => void;
}

export function AssignmentGradeModal({
  submission,
  onClose,
  onGraded,
}: AssignmentGradeModalProps) {
  const [gradingStatus, setGradingStatus] = useState<'passed' | 'failed' | null>(
    submission.grading_status !== 'pending' ? submission.grading_status as 'passed' | 'failed' : null
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGrade = async () => {
    if (!gradingStatus) {
      setError('Please select Pass or Fail before submitting.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await gradeSubmission(submission.submission_id, gradingStatus, feedback || undefined);
      onGraded();
    } catch (err: any) {
      setError(err.message || 'Failed to save grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 id="grade-modal-title" className="text-lg font-semibold text-gray-900">
              Review Submission
            </h2>
            <p className="text-sm text-gray-500">{submission.learner_name} · {submission.learner_email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Submission timestamp */}
          {submission.submitted_at && (
            <p className="text-xs text-gray-500">
              Submitted {new Date(submission.submitted_at).toLocaleString()}
            </p>
          )}

          {/* Text answer */}
          {submission.text_answer ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Written Answer</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {submission.text_answer}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No written answer provided.</p>
          )}

          {/* Files */}
          {submission.files && submission.files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h3>
              <ul className="space-y-1">
                {submission.files.map(f => (
                  <li key={f.id}>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grade selector */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Grade</h3>
            <div className="flex gap-3" role="radiogroup" aria-label="Select grade">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                gradingStatus === 'passed'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="grade"
                  value="passed"
                  checked={gradingStatus === 'passed'}
                  onChange={() => setGradingStatus('passed')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">✓ Pass</span>
              </label>

              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                gradingStatus === 'failed'
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="grade"
                  value="failed"
                  checked={gradingStatus === 'failed'}
                  onChange={() => setGradingStatus('failed')}
                  className="sr-only"
                />
                <span className="text-sm font-medium">✗ Needs Revision</span>
              </label>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="grade-feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Feedback <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="grade-feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Add feedback for the learner…"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleGrade}
            disabled={isSubmitting || !gradingStatus}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save Grade'}
          </button>
        </div>
      </div>
    </div>
  );
}
