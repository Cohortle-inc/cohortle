'use client';

import React, { useState } from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';

interface RemoveLearnerModalProps {
  isOpen: boolean;
  enrollmentId: string;
  learnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal for permanently removing a learner
 * This is a destructive action and requires a reason
 */
export function RemoveLearnerModal({
  isOpen,
  enrollmentId,
  learnerName,
  onClose,
  onSuccess
}: RemoveLearnerModalProps) {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const { remove, isLoading, error, success } = useLearnerOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await remove(enrollmentId, reason);
    if (result) {
      setReason('');
      setConfirm(false);
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Remove Learner Permanently</h2>
          <p className="text-sm text-gray-600 mb-4">
            You are about to permanently remove <strong>{learnerName}</strong> from this programme.
            This action cannot be undone.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Removal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Violation of conduct policy, Request from learner..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <input
                type="checkbox"
                id="confirm"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-red-600"
              />
              <label htmlFor="confirm" className="text-sm text-red-700">
                I understand this is permanent and cannot be undone
              </label>
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
                disabled={isLoading || !reason.trim() || !confirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove Permanently'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
