'use client';

import React, { useState } from 'react';
import { TemplateQuestion } from '@/lib/api/applications';

interface ApplicationFormProps {
  questions: TemplateQuestion[];
  onSubmit: (values: { name: string; email: string; responses: Record<string, unknown> }) => Promise<void>;
  isSubmitting: boolean;
  initialResponses?: Record<string, unknown>;
  submitLabel?: string;
}

/**
 * Dynamic application form that renders questions based on their type.
 * Requirements: 2.1, 3.2
 */
export default function ApplicationForm({ questions, onSubmit, isSubmitting, initialResponses, submitLabel }: ApplicationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [responses, setResponses] = useState<Record<string, unknown>>(initialResponses || {});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required';
    if (!email.trim()) errors.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address';

    for (const q of questions) {
      if (q.is_required) {
        const val = responses[q.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[q.id] = 'This field is required';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), responses });
  };

  const setResponse = (questionId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => { const next = { ...prev }; delete next[questionId]; return next; });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="applicant-name" className="block text-sm font-medium text-gray-700 mb-1">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="applicant-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (validationErrors.name) setValidationErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${validationErrors.name ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Your full name"
        />
        {validationErrors.name && <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="applicant-email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address <span className="text-red-500">*</span>
        </label>
        <input
          id="applicant-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (validationErrors.email) setValidationErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${validationErrors.email ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="you@example.com"
        />
        {validationErrors.email && <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>}
      </div>

      {/* Dynamic questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <label htmlFor={`q-${q.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            {q.question_text}
            {q.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {q.question_type === 'text' && (
            <input
              id={`q-${q.id}`}
              type="text"
              value={(responses[q.id] as string) || ''}
              onChange={(e) => setResponse(q.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${validationErrors[q.id] ? 'border-red-400' : 'border-gray-300'}`}
            />
          )}

          {q.question_type === 'textarea' && (
            <textarea
              id={`q-${q.id}`}
              rows={4}
              value={(responses[q.id] as string) || ''}
              onChange={(e) => setResponse(q.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y ${validationErrors[q.id] ? 'border-red-400' : 'border-gray-300'}`}
            />
          )}

          {q.question_type === 'select' && q.options && (
            <select
              id={`q-${q.id}`}
              value={(responses[q.id] as string) || ''}
              onChange={(e) => setResponse(q.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${validationErrors[q.id] ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select an option</option>
              {q.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {q.question_type === 'multiselect' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = ((responses[q.id] as string[]) || []).includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = (responses[q.id] as string[]) || [];
                        setResponse(q.id, selected ? current.filter((v) => v !== opt) : [...current, opt]);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          )}

          {validationErrors[q.id] && <p className="mt-1 text-xs text-red-600">{validationErrors[q.id]}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving…' : (submitLabel || 'Submit application')}
      </button>
    </form>
  );
}
