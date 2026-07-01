'use client';

import { useEffect, useRef } from 'react';

interface SaveOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityTitle: string;
  /** If provided, stores this bookmark data to sessionStorage before redirecting to signup */
  pendingBookmark?: {
    id: number;
    name: string;
    organisation_name: string;
    apply_url: string | null;
  };
}

export function SaveOpportunityModal({ isOpen, onClose, opportunityTitle, pendingBookmark }: SaveOpportunityModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  function handleCreateAccount() {
    // Store the pending bookmark in sessionStorage so signup can restore it
    if (pendingBookmark) {
      try {
        sessionStorage.setItem('cohortle_pending_bookmark', JSON.stringify(pendingBookmark));
      } catch {
        // sessionStorage unavailable — silently ignore
      }
    }
    window.location.href = '/signup?saveOpportunity=1';
  }

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-2xl p-0 max-w-md w-full backdrop:bg-black/50"
      onClose={onClose}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-[#391D65]/10 flex items-center justify-center flex-none">
            <svg className="w-5 h-5 text-[#391D65]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-lg font-semibold text-gray-950 mb-2">Save this opportunity</h2>
        <p className="text-sm text-gray-600 mb-1 font-medium">{opportunityTitle}</p>
        <p className="text-sm text-gray-600 mb-5">
          Create a free account to save this opportunity and get notified before the deadline closes.
        </p>

        <button
          onClick={handleCreateAccount}
          className="block w-full text-center px-4 py-3 rounded-md bg-[#391D65] text-white text-sm font-semibold hover:bg-[#5B3A8F] transition-colors"
        >
          Create free account
        </button>

        <button
          onClick={onClose}
          className="mt-3 block w-full text-center px-4 py-2.5 rounded-md border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
        >
          Maybe later
        </button>
      </div>
    </dialog>
  );
}
