'use client';

import React, { useState, useMemo } from 'react';
import { Learner } from '@/lib/api/convener';
import { SuspendLearnerModal } from './SuspendLearnerModal';
import { RemoveLearnerModal } from './RemoveLearnerModal';
import { ReactivateLearnerModal } from './ReactivateLearnerModal';
import { AddNoteModal } from './AddNoteModal';
import { SendCommunicationModal } from './SendCommunicationModal';

interface LearnerListWithActionsProps {
  learners: Learner[];
  isLoading?: boolean;
  onLearnerUpdated?: () => void;
}

/**
 * Enhanced learner list with action buttons
 * Shows learners with options to suspend, remove, reactivate, add notes, etc.
 */
export function LearnerListWithActions({
  learners,
  isLoading = false,
  onLearnerUpdated
}: LearnerListWithActionsProps) {
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);
  const [suspendModal, setSuspendModal] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const [reactivateModal, setReactivateModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [communicationModal, setCommunicationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLearners = useMemo(() => {
    if (!searchTerm.trim()) return learners;

    const term = searchTerm.toLowerCase();
    return learners.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term)
    );
  }, [learners, searchTerm]);

  const handleOpenAction = (learner: Learner, action: string) => {
    setSelectedLearner(learner);
    switch (action) {
      case 'suspend':
        setSuspendModal(true);
        break;
      case 'remove':
        setRemoveModal(true);
        break;
      case 'reactivate':
        setReactivateModal(true);
        break;
      case 'note':
        setNoteModal(true);
        break;
      case 'communicate':
        setCommunicationModal(true);
        break;
    }
  };

  const handleCloseModals = () => {
    setSelectedLearner(null);
    setSuspendModal(false);
    setRemoveModal(false);
    setReactivateModal(false);
    setNoteModal(false);
    setCommunicationModal(false);
  };

  const handleSuccess = () => {
    if (onLearnerUpdated) {
      onLearnerUpdated();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin">⏳</div>
        <span className="ml-2 text-gray-600">Loading learners...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchTerm('')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ✕ Clear
        </button>
      </div>

      {/* Learner List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrolled</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearners.map((learner) => (
              <tr
                key={learner.enrollmentId}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{learner.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{learner.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      learner.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : learner.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : learner.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {learner.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {learner.paymentStatus ? learner.paymentStatus.replace('_', ' ') : 'Not set'}
                </td>
                <td className="px-4 py-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition"
                      style={{ width: `${learner.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-1 block">
                    {learner.progress || 0}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(learner.enrolledAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {learner.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleOpenAction(learner, 'note')}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Add note"
                        >
                          📝
                        </button>
                        <button
                          onClick={() => handleOpenAction(learner, 'communicate')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Send message"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => handleOpenAction(learner, 'suspend')}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          title="Suspend learner"
                        >
                          ⏸
                        </button>
                        <button
                          onClick={() => handleOpenAction(learner, 'remove')}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Remove learner"
                        >
                          ✕
                        </button>
                      </>
                    )}

                    {learner.status === 'suspended' && (
                      <>
                        <button
                          onClick={() => handleOpenAction(learner, 'note')}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          title="Add note"
                        >
                          📝
                        </button>
                        <button
                          onClick={() => handleOpenAction(learner, 'reactivate')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Reactivate learner"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleOpenAction(learner, 'remove')}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Remove learner"
                        >
                          ✕
                        </button>
                      </>
                    )}

                    {learner.status === 'completed' && (
                      <button
                        onClick={() => handleOpenAction(learner, 'note')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Add note"
                      >
                        📝
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLearners.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No learners found</p>
        </div>
      )}

      {/* Modals */}
      {selectedLearner && (
        <>
          <SuspendLearnerModal
            isOpen={suspendModal}
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
          />
          <RemoveLearnerModal
            isOpen={removeModal}
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
          />
          <ReactivateLearnerModal
            isOpen={reactivateModal}
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
          />
          <AddNoteModal
            isOpen={noteModal}
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
          />
          <SendCommunicationModal
            isOpen={communicationModal}
            enrollmentId={selectedLearner.enrollmentId}
            learnerName={selectedLearner.name}
            onClose={handleCloseModals}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
