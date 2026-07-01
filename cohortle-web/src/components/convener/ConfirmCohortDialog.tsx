'use client';

/**
 * Confirm Cohort Creation Dialog
 * Shows a confirmation dialog before creating a cohort to prevent mistakes
 */

import React from 'react';

interface ConfirmCohortDialogProps {
  isOpen: boolean;
  programmeName: string;
  cohortName: string;
  enrollmentCode: string;
  startDate: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCohortDialog({
  isOpen,
  programmeName,
  cohortName,
  enrollmentCode,
  startDate,
  onConfirm,
  onCancel,
}: ConfirmCohortDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold text-gray-900 text-center mb-2"
        >
          Confirm Cohort Creation
        </h2>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          Please verify the details below. This cohort will be permanently associated with the selected programme.
        </p>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Programme</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{programmeName}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Cohort Name</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{cohortName}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Enrolment Code</p>
            <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{enrollmentCode}</p>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase">Start Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {new Date(startDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> Once created, this cohort cannot be moved to a different programme. Make sure you're creating it under the correct programme.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              flex-1 px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-md
              font-medium hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-gray-500
              transition-colors duration-200
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              flex-1 px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
              font-medium hover:bg-[#391D65]/90
              focus:outline-none focus:ring-2 focus:ring-[#391D65]
              transition-colors duration-200
            "
          >
            Create Cohort
          </button>
        </div>
      </div>
    </div>
  );
}
