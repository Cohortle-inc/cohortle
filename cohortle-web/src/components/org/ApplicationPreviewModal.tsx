'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApplicationTemplate, TemplateQuestion } from '@/lib/api/applications';

interface Props {
  programmeId: number;
  programmeName: string;
  applyUrl: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Short answer',
  textarea: 'Long answer',
  select: 'Single choice',
  multiselect: 'Multiple choice',
};

export default function ApplicationPreviewModal({ programmeId, programmeName, applyUrl, onClose }: Props) {
  const [questions, setQuestions] = useState<TemplateQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getApplicationTemplate(programmeId)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setIsLoading(false));
  }, [programmeId]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Application preview for ${programmeName}`}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-[#391D65] uppercase tracking-wide mb-1">Application Preview</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{programmeName}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#391D65]" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">This programme uses a standard application form with no custom questions.</p>
              <p className="text-gray-400 text-xs mt-2">You'll be asked for your name and email address.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                This application has <span className="font-medium text-gray-700">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>. Here's what you'll be asked:
              </p>

              {/* Standard fields */}
              <div className="space-y-3">
                {[
                  { label: 'Full name', type: 'Short answer', required: true },
                  { label: 'Email address', type: 'Short answer', required: true },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.type} · Required</p>
                    </div>
                  </div>
                ))}

                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#391D65]/10 text-[#391D65] text-xs font-medium flex items-center justify-center mt-0.5">
                      {i + 3}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{q.question_text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_LABELS[q.question_type] || q.question_type}
                        {q.is_required ? ' · Required' : ' · Optional'}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {q.options.map((opt, oi) => (
                            <li key={oi} className="text-xs text-gray-500 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <Link
            href={applyUrl}
            className="flex-1 px-4 py-2.5 bg-[#391D65] text-white text-sm font-semibold rounded-lg hover:bg-[#5B3A8F] transition-colors text-center"
          >
            Apply Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
