'use client';

import React, { useState } from 'react';
import { useLearnerOperations } from '@/hooks/useLearnerOperations';

interface SendCommunicationModalProps {
  isOpen: boolean;
  enrollmentId: string;
  learnerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANNELS = [
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'in_app', label: 'In-app', icon: '📱' },
  { value: 'notification', label: 'Notification', icon: '🔔' }
];

/**
 * Modal for sending communication to a learner
 */
export function SendCommunicationModal({
  isOpen,
  enrollmentId,
  learnerName,
  onClose,
  onSuccess
}: SendCommunicationModalProps) {
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { sendCommunication, isLoading, error, success } = useLearnerOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await sendCommunication(enrollmentId, channel, subject, message);
    if (result) {
      setChannel('email');
      setSubject('');
      setMessage('');
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">Send Message</h2>
          <p className="text-sm text-gray-600 mb-4">
            Send a message to <strong>{learnerName}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    disabled={isLoading}
                    className={`p-3 rounded-md border-2 text-center transition ${
                      channel === ch.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } disabled:opacity-50`}
                  >
                    <div className="text-lg">{ch.icon}</div>
                    <div className="text-xs font-medium">{ch.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject / Title <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`e.g., ${channel === 'email' ? 'Week 2 Assignment Feedback' : 'Quick Update'}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {message.length} characters
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
                disabled={isLoading || !subject.trim() || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
