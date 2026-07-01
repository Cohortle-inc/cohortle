'use client';

import React, { useState } from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';

interface AddNoteModalProps {
  isOpen: boolean;
  enrollmentId: string;
  learnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const NOTE_TYPES = [
  { value: 'support', label: 'Support', color: 'bg-blue-100 text-blue-800' },
  { value: 'intervention', label: 'Intervention', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'engagement', label: 'Engagement', color: 'bg-green-100 text-green-800' },
  { value: 'achievement', label: 'Achievement', color: 'bg-purple-100 text-purple-800' },
  { value: 'issue', label: 'Issue', color: 'bg-red-100 text-red-800' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-orange-100 text-orange-800' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' }
];

/**
 * Modal for adding notes to a learner
 */
export function AddNoteModal({
  isOpen,
  enrollmentId,
  learnerName,
  onClose,
  onSuccess
}: AddNoteModalProps) {
  const [noteType, setNoteType] = useState('general');
  const [content, setContent] = useState('');
  const { addNote, isLoading, error, success } = useLearnerOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await addNote(enrollmentId, noteType, content);
    if (result) {
      setNoteType('general');
      setContent('');
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">Add Note</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add a note for <strong>{learnerName}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="noteType" className="block text-sm font-medium text-gray-700 mb-2">
                Note Type
              </label>
              <select
                id="noteType"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 flex flex-wrap gap-2">
                {NOTE_TYPES.map((type) => (
                  <span key={type.value} className={`px-2 py-1 text-xs rounded ${type.color}`}>
                    {type.label}
                  </span>
                ))}
              </p>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Note Content <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
                disabled={isLoading}
              />
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
                disabled={isLoading || !content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
