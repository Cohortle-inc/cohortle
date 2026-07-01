'use client';

import React from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';

interface ReactivateLearnerModalProps {
  isOpen: boolean;
  enrollmentId: string;
  learnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for reactivating a suspended learner
 * This allows previously suspended learners to regain access
 */
export function ReactivateLearnerModal({
  isOpen,
  enrollmentId,
  learnerName,
  onClose,
  onSuccess
}: ReactivateLearnerModalProps) {
  const { reactivate, isLoading, error, success } = useLearnerOperations();

  const handleSubmit = async () => {
    const result = await reactivate(
      enrollmentId,
      'Learner reactivated by convener'
    );
    if (result) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reactivate Learner</h2>
          <p className="text-sm text-gray-600 mb-4">
            You are about to reactivate <strong>{learnerName}</strong>. They will regain access to
            the programme and be able to submit work.
          </p>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Reactivating...' : 'Reactivate Learner'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
