import { useState, useCallback } from 'react';
import {
  suspendLearner,
  reactivateLearner,
  removeLearner,
  addLearnerNote,
  getLearnerNotes,
  sendCommunicationToLearner,
  recordLearnerAttendance,
  LearnerNote,
  CommunicationEvent,
  AttendanceRecord
} from '@/lib/api/convener';

/**
 * Hook for managing learner operations
 * Handles suspend, reactivate, remove, notes, communications, and attendance
 */
export function useLearnerOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  /**
   * Suspend a learner
   */
  const suspend = useCallback(
    async (enrollmentId: number, reason: string) => {
      try {
        setIsLoading(true);
        clearMessages();

        if (!reason.trim()) {
          setError('Suspension reason is required');
          return null;
        }

        const result = await suspendLearner(enrollmentId, reason);
        setSuccess(`Learner suspended successfully`);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to suspend learner';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Reactivate a suspended learner
   */
  const reactivate = useCallback(
    async (enrollmentId: number, reason?: string) => {
      try {
        setIsLoading(true);
        clearMessages();

        const result = await reactivateLearner(enrollmentId, reason);
        setSuccess('Learner reactivated successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reactivate learner';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Remove a learner permanently
   */
  const remove = useCallback(
    async (enrollmentId: number, reason: string) => {
      try {
        setIsLoading(true);
        clearMessages();

        if (!reason.trim()) {
          setError('Removal reason is required');
          return null;
        }

        const result = await removeLearner(enrollmentId, reason);
        setSuccess('Learner removed successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove learner';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Add a note for a learner
   */
  const addNote = useCallback(
    async (
      enrollmentId: number,
      noteType: string,
      content: string,
      linkedEntityType?: string,
      linkedEntityId?: number
    ): Promise<LearnerNote | null> => {
      try {
        setIsLoading(true);
        clearMessages();

        if (!content.trim()) {
          setError('Note content is required');
          return null;
        }

        const result = await addLearnerNote(
          enrollmentId,
          noteType,
          content,
          linkedEntityType,
          linkedEntityId
        );
        setSuccess('Note added successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add note';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Get notes for a learner
   */
  const getNotes = useCallback(
    async (
      enrollmentId: number,
      noteType?: string,
      limit?: number,
      offset?: number
    ) => {
      try {
        setIsLoading(true);
        clearMessages();

        const result = await getLearnerNotes(enrollmentId, noteType, limit, offset);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notes';
        setError(message);
        return { notes: [], total: 0 };
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Send communication to a learner
   */
  const sendCommunication = useCallback(
    async (
      enrollmentId: number,
      channel: string,
      subject: string,
      bodyPreview: string,
      templateId?: number
    ): Promise<CommunicationEvent | null> => {
      try {
        setIsLoading(true);
        clearMessages();

        if (!channel) {
          setError('Communication channel is required');
          return null;
        }

        if (!subject.trim() || !bodyPreview.trim()) {
          setError('Subject and message are required');
          return null;
        }

        const result = await sendCommunicationToLearner(
          enrollmentId,
          channel,
          subject,
          bodyPreview,
          templateId
        );
        setSuccess(`Message sent via ${channel}`);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send communication';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Record attendance for a learner
   */
  const recordAttendance = useCallback(
    async (
      enrollmentId: number,
      eventType: string,
      eventDate: string,
      status: string,
      notes?: string
    ): Promise<AttendanceRecord | null> => {
      try {
        setIsLoading(true);
        clearMessages();

        const result = await recordLearnerAttendance(
          enrollmentId,
          eventType,
          eventDate,
          status,
          notes
        );
        setSuccess('Attendance recorded successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to record attendance';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearMessages]
  );

  return {
    isLoading,
    error,
    success,
    clearMessages,
    suspend,
    reactivate,
    remove,
    addNote,
    getNotes,
    sendCommunication,
    recordAttendance
  };
}
