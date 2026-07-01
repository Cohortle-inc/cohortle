'use client';

import { useState } from 'react';
import { generateAvatar } from '@/lib/api/profile';

interface GenerateAvatarButtonProps {
  currentAvatarUrl?: string;
  onAvatarGenerated: (newAvatarUrl: string) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * GenerateAvatarButton Component
 *
 * Generates a new DiceBear avatar and notifies the parent.
 * Shows a visible success message and a screen-reader live region.
 */
export default function GenerateAvatarButton({
  currentAvatarUrl,
  onAvatarGenerated,
  disabled = false,
}: GenerateAvatarButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateAvatar = async () => {
    setError(null);
    setSuccess(false);

    try {
      setIsGenerating(true);

      const newAvatarUrl = await generateAvatar();

      // Notify parent and wait for it to save before showing success
      await onAvatarGenerated(newAvatarUrl);

      setSuccess(true);

      // Auto-dismiss success after 4 s
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate avatar. Please try again.';
      setError(message);
      console.error('Avatar generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || isGenerating;

  return (
    <div className="space-y-3">
      {/* Button */}
      <button
        type="button"
        onClick={handleGenerateAvatar}
        disabled={isDisabled}
        aria-label="Generate new profile avatar"
        aria-busy={isGenerating}
        className="w-full sm:w-auto px-4 py-2 min-h-[44px] bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Generate Avatar</span>
          </>
        )}
      </button>

      {/* Screen-reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isGenerating && 'Generating avatar...'}
        {success && 'Avatar generated and saved successfully.'}
        {error && `Error: ${error}`}
      </div>

      {/* Visible success message */}
      {success && (
        <div
          role="status"
          className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-800 text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Avatar updated successfully!
        </div>
      )}

      {/* Visible error message */}
      {error && (
        <div role="alert" aria-live="assertive" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-800 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Click to generate a unique avatar. You can regenerate as many times as you like.
      </p>
    </div>
  );
}
