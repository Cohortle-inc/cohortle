// Offline Queue Management
// Handles queuing operations when offline and retrying when connection restored

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalFile } from '@/types/assignments';

/**
 * Types of operations that can be queued
 */
export type QueuedOperationType = 'submit_assignment' | 'update_submission' | 'grade_submission';

/**
 * Base interface for queued operations
 */
interface BaseQueuedOperation {
  id: string;
  type: QueuedOperationType;
  timestamp: string;
  retryCount: number;
}

/**
 * Queued submission operation
 */
export interface QueuedSubmission extends BaseQueuedOperation {
  type: 'submit_assignment';
  assignmentId: string;
  textAnswer: string | null;
  files: LocalFile[];
}

/**
 * Queued update operation
 */
export interface QueuedUpdate extends BaseQueuedOperation {
  type: 'update_submission';
  submissionId: string;
  assignmentId: string;
  textAnswer?: string | null;
  files?: LocalFile[];
}

/**
 * Queued grading operation
 */
export interface QueuedGrading extends BaseQueuedOperation {
  type: 'grade_submission';
  submissionId: string;
  assignmentId: string;
  status: 'passed' | 'failed';
  feedback?: string;
}

/**
 * Union type for all queued operations
 */
export type QueuedOperation = QueuedSubmission | QueuedUpdate | QueuedGrading;

const QUEUE_KEY = 'offline_operation_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Adds an operation to the offline queue
 */
export async function addToQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
  const queue = await getQueue();
  
  const queuedOperation: QueuedOperation = {
    ...operation,
    id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  } as QueuedOperation;
  
  queue.push(queuedOperation);
  await saveQueue(queue);
  
  return queuedOperation.id;
}

/**
 * Gets all operations from the queue
 */
export async function getQueue(): Promise<QueuedOperation[]> {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) {
      return [];
    }
    return JSON.parse(queueJson);
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

/**
 * Saves the queue to AsyncStorage
 */
async function saveQueue(queue: QueuedOperation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Removes an operation from the queue
 */
export async function removeFromQueue(operationId: string): Promise<void> {
  const queue = await getQueue();
  const filteredQueue = queue.filter(op => op.id !== operationId);
  await saveQueue(filteredQueue);
}

/**
 * Increments the retry count for an operation
 */
export async function incrementRetryCount(operationId: string): Promise<void> {
  const queue = await getQueue();
  const operation = queue.find(op => op.id === operationId);
  
  if (operation) {
    operation.retryCount += 1;
    
    // Remove if max retries exceeded
    if (operation.retryCount >= MAX_RETRY_COUNT) {
      await removeFromQueue(operationId);
    } else {
      await saveQueue(queue);
    }
  }
}

/**
 * Gets the count of pending operations
 */
export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Clears all operations from the queue
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/**
 * Gets operations by type
 */
export async function getOperationsByType(type: QueuedOperationType): Promise<QueuedOperation[]> {
  const queue = await getQueue();
  return queue.filter(op => op.type === type);
}

/**
 * Checks if an operation exists for a specific assignment
 */
export async function hasQueuedOperation(assignmentId: string): Promise<boolean> {
  const queue = await getQueue();
  return queue.some(op => 
    (op.type === 'submit_assignment' && op.assignmentId === assignmentId) ||
    (op.type === 'update_submission' && op.assignmentId === assignmentId)
  );
}
