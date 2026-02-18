// Unit Tests for Draft Manager Edge Cases
// Feature: assignment-submission-system
// Validates: Requirements 5.1, 5.2

import {
  saveDraft,
  loadDraft,
  clearDraft,
  getAllDrafts,
  clearAllDrafts,
  hasDraft,
} from '@/utils/draftManager';
import { LocalFile } from '@/types/assignments';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Draft Manager - Edge Cases', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Draft expiration and cleanup', () => {
    it('should save draft with current timestamp', async () => {
      const beforeSave = new Date().toISOString();
      await saveDraft('assignment-1', 'test content', []);
      const afterSave = new Date().toISOString();

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.lastModified).toBeDefined();

      // Timestamp should be between before and after
      expect(draft!.lastModified >= beforeSave).toBe(true);
      expect(draft!.lastModified <= afterSave).toBe(true);
    });

    it('should update timestamp when draft is re-saved', async () => {
      // Save initial draft
      await saveDraft('assignment-1', 'first save', []);
      const firstDraft = await loadDraft('assignment-1');
      const firstTimestamp = firstDraft!.lastModified;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Save again
      await saveDraft('assignment-1', 'second save', []);
      const secondDraft = await loadDraft('assignment-1');
      const secondTimestamp = secondDraft!.lastModified;

      // Second timestamp should be later
      expect(secondTimestamp > firstTimestamp).toBe(true);
    });

    it('should handle multiple drafts with different timestamps', async () => {
      await saveDraft('assignment-1', 'first', []);
      await new Promise(resolve => setTimeout(resolve, 10));
      await saveDraft('assignment-2', 'second', []);
      await new Promise(resolve => setTimeout(resolve, 10));
      await saveDraft('assignment-3', 'third', []);

      const drafts = await getAllDrafts();
      expect(drafts).toHaveLength(3);

      // All should have different timestamps
      const timestamps = drafts.map(d => d.lastModified);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(3);
    });
  });

  describe('Handling corrupted draft data', () => {
    it('should return null for corrupted JSON', async () => {
      // Manually insert corrupted data
      await AsyncStorage.setItem('draft_submission_corrupted', 'not valid json {{{');

      const draft = await loadDraft('corrupted');
      expect(draft).toBeNull();
    });

    it('should handle missing fields in stored data', async () => {
      // Store incomplete draft data
      const incompleteData = JSON.stringify({
        assignmentId: 'test',
        // Missing textAnswer and files
      });
      await AsyncStorage.setItem('draft_submission_incomplete', incompleteData);

      const draft = await loadDraft('incomplete');
      // Should still load but with undefined fields
      expect(draft).not.toBeNull();
      expect(draft!.assignmentId).toBe('test');
    });

    it('should filter out corrupted drafts in getAllDrafts', async () => {
      // Save valid draft
      await saveDraft('valid-1', 'content', []);

      // Add corrupted draft
      await AsyncStorage.setItem('draft_submission_corrupted', 'invalid json');

      // Save another valid draft
      await saveDraft('valid-2', 'more content', []);

      const drafts = await getAllDrafts();

      // Should only return valid drafts
      expect(drafts).toHaveLength(2);
      expect(drafts.find(d => d.assignmentId === 'valid-1')).toBeDefined();
      expect(drafts.find(d => d.assignmentId === 'valid-2')).toBeDefined();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      // Mock AsyncStorage to throw error
      const originalGetItem = AsyncStorage.getItem;
      AsyncStorage.getItem = jest.fn().mockRejectedValue(new Error('Storage error'));

      const draft = await loadDraft('test');
      expect(draft).toBeNull();

      // Restore
      AsyncStorage.getItem = originalGetItem;
    });
  });

  describe('Concurrent draft operations', () => {
    it('should handle multiple saves to same draft concurrently', async () => {
      // Save multiple times concurrently
      const saves = [
        saveDraft('assignment-1', 'save 1', []),
        saveDraft('assignment-1', 'save 2', []),
        saveDraft('assignment-1', 'save 3', []),
      ];

      await Promise.all(saves);

      // Should have one draft (last one wins)
      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      // Content should be one of the saves
      expect(['save 1', 'save 2', 'save 3']).toContain(draft!.textAnswer);
    });

    it('should handle concurrent saves to different drafts', async () => {
      // Save multiple drafts concurrently
      const saves = [
        saveDraft('assignment-1', 'content 1', []),
        saveDraft('assignment-2', 'content 2', []),
        saveDraft('assignment-3', 'content 3', []),
      ];

      await Promise.all(saves);

      // All should exist
      const draft1 = await loadDraft('assignment-1');
      const draft2 = await loadDraft('assignment-2');
      const draft3 = await loadDraft('assignment-3');

      expect(draft1!.textAnswer).toBe('content 1');
      expect(draft2!.textAnswer).toBe('content 2');
      expect(draft3!.textAnswer).toBe('content 3');
    });

    it('should handle concurrent load and save operations', async () => {
      // Initial save
      await saveDraft('assignment-1', 'initial', []);

      // Concurrent load and save
      const operations = [
        loadDraft('assignment-1'),
        saveDraft('assignment-1', 'updated', []),
        loadDraft('assignment-1'),
      ];

      const results = await Promise.all(operations);

      // All loads should succeed (may have different values)
      expect(results[0]).not.toBeNull();
      expect(results[2]).not.toBeNull();
    });

    it('should handle concurrent clear operations', async () => {
      // Save draft
      await saveDraft('assignment-1', 'content', []);

      // Clear multiple times concurrently
      const clears = [
        clearDraft('assignment-1'),
        clearDraft('assignment-1'),
        clearDraft('assignment-1'),
      ];

      await Promise.all(clears);

      // Should be gone
      const draft = await loadDraft('assignment-1');
      expect(draft).toBeNull();
    });
  });

  describe('Special characters and edge cases', () => {
    it('should handle assignment IDs with special characters', async () => {
      const specialIds = [
        'assignment-with-dashes',
        'assignment_with_underscores',
        'assignment.with.dots',
        'assignment123',
      ];

      for (const id of specialIds) {
        await saveDraft(id, `content for ${id}`, []);
        const draft = await loadDraft(id);
        expect(draft).not.toBeNull();
        expect(draft!.assignmentId).toBe(id);
      }
    });

    it('should handle very long text content', async () => {
      const longText = 'a'.repeat(50000); // 50KB of text
      await saveDraft('assignment-1', longText, []);

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.textAnswer).toBe(longText);
      expect(draft!.textAnswer.length).toBe(50000);
    });

    it('should handle text with special characters', async () => {
      const specialText = 'Text with\nnewlines\tand\ttabs and "quotes" and \'apostrophes\'';
      await saveDraft('assignment-1', specialText, []);

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.textAnswer).toBe(specialText);
    });

    it('should handle unicode characters', async () => {
      const unicodeText = 'Hello 世界 🌍 مرحبا';
      await saveDraft('assignment-1', unicodeText, []);

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.textAnswer).toBe(unicodeText);
    });

    it('should handle maximum number of files', async () => {
      const files: LocalFile[] = Array.from({ length: 10 }, (_, i) => ({
        uri: `file://path/to/file${i}.pdf`,
        name: `file${i}.pdf`,
        type: 'application/pdf',
        size: 1024 * i,
      }));

      await saveDraft('assignment-1', 'content', files);

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.files).toHaveLength(10);
    });

    it('should handle files with long names', async () => {
      const longFileName = 'a'.repeat(200) + '.pdf';
      const files: LocalFile[] = [
        {
          uri: 'file://path/to/file.pdf',
          name: longFileName,
          type: 'application/pdf',
          size: 1024,
        },
      ];

      await saveDraft('assignment-1', 'content', files);

      const draft = await loadDraft('assignment-1');
      expect(draft).not.toBeNull();
      expect(draft!.files[0].name).toBe(longFileName);
    });
  });

  describe('getAllDrafts edge cases', () => {
    it('should not return non-draft keys from AsyncStorage', async () => {
      // Add some non-draft keys
      await AsyncStorage.setItem('user_profile', JSON.stringify({ name: 'Test' }));
      await AsyncStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

      // Add draft
      await saveDraft('assignment-1', 'content', []);

      const drafts = await getAllDrafts();

      // Should only return the draft
      expect(drafts).toHaveLength(1);
      expect(drafts[0].assignmentId).toBe('assignment-1');
    });

    it('should handle empty AsyncStorage', async () => {
      const drafts = await getAllDrafts();
      expect(drafts).toEqual([]);
    });

    it('should handle AsyncStorage with only non-draft keys', async () => {
      await AsyncStorage.setItem('user_profile', JSON.stringify({ name: 'Test' }));
      await AsyncStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

      const drafts = await getAllDrafts();
      expect(drafts).toEqual([]);
    });
  });

  describe('clearAllDrafts edge cases', () => {
    it('should not clear non-draft keys', async () => {
      // Add non-draft keys
      await AsyncStorage.setItem('user_profile', JSON.stringify({ name: 'Test' }));
      await AsyncStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

      // Add drafts
      await saveDraft('assignment-1', 'content 1', []);
      await saveDraft('assignment-2', 'content 2', []);

      // Clear all drafts
      await clearAllDrafts();

      // Drafts should be gone
      const drafts = await getAllDrafts();
      expect(drafts).toEqual([]);

      // Non-draft keys should still exist
      const profile = await AsyncStorage.getItem('user_profile');
      const settings = await AsyncStorage.getItem('settings');
      expect(profile).not.toBeNull();
      expect(settings).not.toBeNull();
    });

    it('should handle clearing when no drafts exist', async () => {
      // Should not throw
      await expect(clearAllDrafts()).resolves.not.toThrow();
    });

    it('should handle AsyncStorage errors during clearAll', async () => {
      // Save some drafts
      await saveDraft('assignment-1', 'content', []);

      // Mock error
      const originalMultiRemove = AsyncStorage.multiRemove;
      AsyncStorage.multiRemove = jest.fn().mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(clearAllDrafts()).resolves.not.toThrow();

      // Restore
      AsyncStorage.multiRemove = originalMultiRemove;
    });
  });

  describe('hasDraft edge cases', () => {
    it('should return false for empty string assignment ID', async () => {
      const exists = await hasDraft('');
      expect(exists).toBe(false);
    });

    it('should distinguish between similar assignment IDs', async () => {
      await saveDraft('assignment-1', 'content', []);

      expect(await hasDraft('assignment-1')).toBe(true);
      expect(await hasDraft('assignment-2')).toBe(false);
      expect(await hasDraft('assignment-11')).toBe(false);
      expect(await hasDraft('assignment')).toBe(false);
    });
  });
});
