'use client';

import React, { useState } from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';

interface SuspendLearnerModalProps {
  isOpen: boolean;
  enrollmentId: string;
  learnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for suspending a learner
 * Requires a reason for suspension for audit trail
 */
export function SuspendLearnerModal({
  isOpen,
  enrollmentId,
  learnerName,
  onClose,
  onSuccess
}: SuspendLearnerModalProps) {
  const [reason, setReason] = useState('');
  const { suspend, isLoading, error, success } = useLearnerOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await suspend(enrollmentId, reason);
    if (result) {
      setReason('');
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Suspend Learner</h2>
          <p className="text-sm text-gray-600 mb-4">
            You are about to suspend <strong>{learnerName}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Poor attendance, Non-participation, Payment issues..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                This reason will be recorded in the audit trail
              </p>
            </div>

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
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Suspending...' : 'Suspend Learner'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
