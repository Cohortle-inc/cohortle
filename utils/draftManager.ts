// Draft Management Utilities for Assignment Submission System
// This module handles saving, loading, and clearing draft submissions in AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DraftSubmission, LocalFile } from '@/types/assignments';

/**
 * Prefix for draft submission keys in AsyncStorage
 */
const DRAFT_KEY_PREFIX = 'draft_submission_';

/**
 * Saves a draft submission to AsyncStorage
 * @param assignmentId - The ID of the assignment
 * @param textAnswer - The text answer content
 * @param files - Array of selected files
 * @returns Promise that resolves when draft is saved
 */
export async function saveDraft(
  assignmentId: string,
  textAnswer: string,
  files: LocalFile[]
): Promise<void> {
  const draftData: DraftSubmission = {
    assignmentId,
    textAnswer,
    files,
    lastModified: new Date().toISOString(),
  };

  const key = `${DRAFT_KEY_PREFIX}${assignmentId}`;
  await AsyncStorage.setItem(key, JSON.stringify(draftData));
}

/**
 * Loads a draft submission from AsyncStorage
 * @param assignmentId - The ID of the assignment
 * @returns Promise that resolves with the draft data or null if not found
 */
export async function loadDraft(assignmentId: string): Promise<DraftSubmission | null> {
  try {
    const key = `${DRAFT_KEY_PREFIX}${assignmentId}`;
    const draftJson = await AsyncStorage.getItem(key);

    if (!draftJson) {
      return null;
    }

    const draft: DraftSubmission = JSON.parse(draftJson);
    return draft;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Clears a draft submission from AsyncStorage
 * @param assignmentId - The ID of the assignment
 * @returns Promise that resolves when draft is cleared
 */
export async function clearDraft(assignmentId: string): Promise<void> {
  const key = `${DRAFT_KEY_PREFIX}${assignmentId}`;
  await AsyncStorage.removeItem(key);
}

/**
 * Gets all draft submissions from AsyncStorage
 * Useful for cleanup or showing a list of drafts
 * @returns Promise that resolves with array of all drafts
 */
export async function getAllDrafts(): Promise<DraftSubmission[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter(key => key.startsWith(DRAFT_KEY_PREFIX));

    if (draftKeys.length === 0) {
      return [];
    }

    const drafts = await AsyncStorage.multiGet(draftKeys);

    return drafts
      .map(([_, value]) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as DraftSubmission;
        } catch {
          return null;
        }
      })
      .filter((draft): draft is DraftSubmission => draft !== null);
  } catch (error) {
    console.error('Error getting all drafts:', error);
    return [];
  }
}

/**
 * Clears all draft submissions from AsyncStorage
 * Useful for cleanup when user logs out
 * @returns Promise that resolves when all drafts are cleared
 */
export async function clearAllDrafts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter(key => key.startsWith(DRAFT_KEY_PREFIX));

    if (draftKeys.length > 0) {
      await AsyncStorage.multiRemove(draftKeys);
    }
  } catch (error) {
    console.error('Error clearing all drafts:', error);
  }
}

/**
 * Checks if a draft exists for an assignment
 * @param assignmentId - The ID of the assignment
 * @returns Promise that resolves with true if draft exists
 */
export async function hasDraft(assignmentId: string): Promise<boolean> {
  const key = `${DRAFT_KEY_PREFIX}${assignmentId}`;
  const value = await AsyncStorage.getItem(key);
  return value !== null;
}
