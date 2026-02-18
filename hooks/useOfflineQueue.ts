// Offline Queue Processing Hook
// Automatically processes queued operations when connection is restored

import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import {
  getQueue,
  removeFromQueue,
  incrementRetryCount,
  QueuedOperation,
  QueuedSubmission,
  QueuedUpdate,
  QueuedGrading,
} from '@/utils/offlineQueue';
import { submitAssignment } from '@/api/submissions/submitAssignment';
import { updateSubmission } from '@/api/submissions/updateSubmission';
import { gradeSubmission } from '@/api/submissions/gradeSubmission';
import { clearDraft } from '@/utils/draftManager';
import { showMessage } from 'react-native-flash-message';

/**
 * Hook to process offline queue when connection is restored
 */
export const useOfflineQueue = () => {
  const { isConnected } = useNetworkStatus();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count when queue changes
  useEffect(() => {
    const updateCount = async () => {
      const queue = await getQueue();
      setPendingCount(queue.length);
    };

    updateCount();
    
    // Poll for changes every 5 seconds
    const interval = setInterval(updateCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Process queue when connection is restored
  useEffect(() => {
    if (isConnected && !isProcessing) {
      processQueue();
    }
  }, [isConnected]);

  /**
   * Processes all operations in the queue
   */
  const processQueue = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const queue = await getQueue();

      if (queue.length === 0) {
        setIsProcessing(false);
        return;
      }

      showMessage({
        message: 'Syncing',
        description: `Processing ${queue.length} pending operation(s)...`,
        type: 'info',
        duration: 2000,
      });

      let successCount = 0;
      let failureCount = 0;

      for (const operation of queue) {
        try {
          await processOperation(operation);
          await removeFromQueue(operation.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          await incrementRetryCount(operation.id);
          failureCount++;
        }
      }

      // Update pending count
      const remainingQueue = await getQueue();
      setPendingCount(remainingQueue.length);

      // Show result message
      if (successCount > 0) {
        showMessage({
          message: 'Sync Complete',
          description: `${successCount} operation(s) synced successfully`,
          type: 'success',
        });
      }

      if (failureCount > 0) {
        showMessage({
          message: 'Sync Issues',
          description: `${failureCount} operation(s) failed. Will retry later.`,
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Processes a single operation
   */
  const processOperation = async (operation: QueuedOperation): Promise<void> => {
    switch (operation.type) {
      case 'submit_assignment':
        await processSubmission(operation as QueuedSubmission);
        break;
      case 'update_submission':
        await processUpdate(operation as QueuedUpdate);
        break;
      case 'grade_submission':
        await processGrading(operation as QueuedGrading);
        break;
      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  };

  /**
   * Processes a submission operation
   */
  const processSubmission = async (operation: QueuedSubmission): Promise<void> => {
    await submitAssignment(operation.assignmentId, operation.textAnswer, operation.files);
    // Clear draft after successful submission
    await clearDraft(operation.assignmentId);
  };

  /**
   * Processes an update operation
   */
  const processUpdate = async (operation: QueuedUpdate): Promise<void> => {
    await updateSubmission(operation.submissionId, operation.textAnswer, operation.files);
  };

  /**
   * Processes a grading operation
   */
  const processGrading = async (operation: QueuedGrading): Promise<void> => {
    await gradeSubmission(operation.submissionId, {
      status: operation.status,
      feedback: operation.feedback,
    });
  };

  return {
    isProcessing,
    pendingCount,
    processQueue,
  };
};
