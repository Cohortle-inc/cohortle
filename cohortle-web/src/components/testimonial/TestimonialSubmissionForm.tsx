'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { submitTestimonial } from '@/lib/api/testimonials';

interface Props {
  token: string;
  cohortName: string | null;
  programmeName: string | null;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  NOT_ENROLLED: "You're not enrolled in this cohort, so you can't submit a testimonial via this link.",
  ALREADY_SUBMITTED: "You've already submitted a testimonial via this link.",
  LINK_NOT_FOUND: 'This link is no longer valid.',
  LINK_EXPIRED: 'This link has expired.',
  VALIDATION_ERROR: 'Please check your quote (min 10 characters) and rating (1–5).',
  UNAUTHORIZED: 'Please log in to submit a testimonial.',
};

export default function TestimonialSubmissionForm({ token, cohortName, programmeName }: Props) {
  const { user } = useAuth();
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(0);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMsg('Please select a rating.');
      return;
    }
    if (quote.trim().length < 10) {
      setErrorMsg('Your testimonial must be at least 10 characters.');
      return;
    }

    setFormState('submitting');
    setErrorMsg(null);

    try {
      await submitTestimonial(token, {
        quote: quote.trim(),
        rating,
        displayName: displayName.trim() || undefined,
      });
      setFormState('success');
    } catch (err: unknown) {
      setFormState('error');
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      setErrorMsg(ERROR_MESSAGES[code ?? ''] ?? 'Something went wrong. Please try again.');
    }
  };

  if (formState === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-600">Your testimonial has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Context */}
      {(programmeName || cohortName) && (
        <div className="bg-indigo-50 rounded-lg px-4 py-3">
          <p className="text-sm text-indigo-800">
            {programmeName && <span className="font-semibold">{programmeName}</span>}
            {programmeName && cohortName && ' · '}
            {cohortName && <span>{cohortName}</span>}
          </p>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
          Your name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we display your name?"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Star rating */}
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Rating <span className="text-red-500">*</span></p>
        <div className="flex gap-1" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
            >
              <svg
                className={`w-8 h-8 transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div>
        <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-1">
          Your testimonial <span className="text-red-500">*</span>
        </label>
        <textarea
          id="quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={5}
          minLength={10}
          required
          placeholder="Share your experience with this programme…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="mt-1 text-xs text-gray-400">{quote.length} characters (minimum 10)</p>
      </div>

      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {formState === 'submitting' ? 'Submitting…' : 'Submit Testimonial'}
      </button>
    </form>
  );
}
