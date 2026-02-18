// Property-Based Tests for Draft Manager
// Feature: assignment-submission-system
// Property 9: Draft Persistence Round-Trip
// Validates: Requirements 5.1, 5.2

import * as fc from 'fast-check';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  getAllDrafts,
  clearAllDrafts,
  hasDraft,
} from '@/utils/draftManager';
import { DraftSubmission, LocalFile } from '@/types/assignments';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Property 9: Draft Persistence Round-Trip', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await AsyncStorage.clear();
  });

  describe('saveDraft and loadDraft', () => {
    it('should persist and retrieve draft data correctly', () => {
      // Property: Any draft saved should be retrievable with identical data
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // assignmentId
          fc.string({ minLength: 0, maxLength: 5000 }), // textAnswer
          fc.array(
            fc.record({
              uri: fc.webUrl(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('application/pdf', 'image/png', 'image/jpeg'),
              size: fc.integer({ min: 0, max: 10 * 1024 * 1024 }),
            }),
            { maxLength: 5 }
          ), // files
          async (assignmentId, textAnswer, files: LocalFile[]) => {
            // Save the draft
            await saveDraft(assignmentId, textAnswer, files);

            // Load the draft
            const loadedDraft = await loadDraft(assignmentId);

            // Verify the draft was loaded
            expect(loadedDraft).not.toBeNull();
            expect(loadedDraft!.assignmentId).toBe(assignmentId);
            expect(loadedDraft!.textAnswer).toBe(textAnswer);
            expect(loadedDraft!.files).toHaveLength(files.length);

            // Verify each file
            files.forEach((file, index) => {
              expect(loadedDraft!.files[index].uri).toBe(file.uri);
              expect(loadedDraft!.files[index].name).toBe(file.name);
              expect(loadedDraft!.files[index].type).toBe(file.type);
              expect(loadedDraft!.files[index].size).toBe(file.size);
            });

            // Verify lastModified is a valid ISO date string
            expect(loadedDraft!.lastModified).toBeDefined();
            expect(new Date(loadedDraft!.lastModified).toISOString()).toBe(
              loadedDraft!.lastModified
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for non-existent drafts', () => {
      // Property: Loading a draft that doesn't exist should return null
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (assignmentId) => {
            const draft = await loadDraft(assignmentId);
            expect(draft).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should overwrite existing drafts with same assignmentId', () => {
      // Property: Saving a new draft with the same assignmentId should replace the old one
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          async (assignmentId, firstText, secondText) => {
            // Ensure texts are different
            fc.pre(firstText !== secondText);

            // Save first draft
            await saveDraft(assignmentId, firstText, []);

            // Save second draft with same ID
            await saveDraft(assignmentId, secondText, []);

            // Load draft
            const draft = await loadDraft(assignmentId);

            // Should have the second text, not the first
            expect(draft).not.toBeNull();
            expect(draft!.textAnswer).toBe(secondText);
            expect(draft!.textAnswer).not.toBe(firstText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('clearDraft', () => {
    it('should remove draft after clearing', () => {
      // Property: After clearing a draft, it should not be loadable
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          async (assignmentId, textAnswer) => {
            // Save a draft
            await saveDraft(assignmentId, textAnswer, []);

            // Verify it exists
            const beforeClear = await loadDraft(assignmentId);
            expect(beforeClear).not.toBeNull();

            // Clear the draft
            await clearDraft(assignmentId);

            // Verify it's gone
            const afterClear = await loadDraft(assignmentId);
            expect(afterClear).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not affect other drafts when clearing one', () => {
      // Property: Clearing one draft should not affect other drafts
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          async (id1, id2, text1, text2) => {
            // Ensure IDs are different
            fc.pre(id1 !== id2);

            // Save two drafts
            await saveDraft(id1, text1, []);
            await saveDraft(id2, text2, []);

            // Clear first draft
            await clearDraft(id1);

            // First should be gone
            const draft1 = await loadDraft(id1);
            expect(draft1).toBeNull();

            // Second should still exist
            const draft2 = await loadDraft(id2);
            expect(draft2).not.toBeNull();
            expect(draft2!.textAnswer).toBe(text2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('hasDraft', () => {
    it('should return true for existing drafts', () => {
      // Property: hasDraft should return true after saving a draft
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          async (assignmentId, textAnswer) => {
            // Save a draft
            await saveDraft(assignmentId, textAnswer, []);

            // Check if it exists
            const exists = await hasDraft(assignmentId);
            expect(exists).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false for non-existent drafts', () => {
      // Property: hasDraft should return false for drafts that don't exist
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (assignmentId) => {
            const exists = await hasDraft(assignmentId);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false after clearing a draft', () => {
      // Property: hasDraft should return false after clearing
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 1000 }),
          async (assignmentId, textAnswer) => {
            // Save and clear
            await saveDraft(assignmentId, textAnswer, []);
            await clearDraft(assignmentId);

            // Should not exist
            const exists = await hasDraft(assignmentId);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getAllDrafts', () => {
    it('should return all saved drafts', () => {
      // Property: getAllDrafts should return all drafts that were saved
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              assignmentId: fc.string({ minLength: 1, maxLength: 50 }),
              textAnswer: fc.string({ minLength: 0, maxLength: 1000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (draftsToSave) => {
            // Ensure unique assignment IDs
            const uniqueDrafts = Array.from(
              new Map(draftsToSave.map(d => [d.assignmentId, d])).values()
            );

            // Save all drafts
            for (const draft of uniqueDrafts) {
              await saveDraft(draft.assignmentId, draft.textAnswer, []);
            }

            // Get all drafts
            const allDrafts = await getAllDrafts();

            // Should have the same number
            expect(allDrafts).toHaveLength(uniqueDrafts.length);

            // Each saved draft should be in the result
            for (const saved of uniqueDrafts) {
              const found = allDrafts.find(d => d.assignmentId === saved.assignmentId);
              expect(found).toBeDefined();
              expect(found!.textAnswer).toBe(saved.textAnswer);
            }
          }
        ),
        { numRuns: 50 } // Fewer runs since this is more expensive
      );
    });

    it('should return empty array when no drafts exist', async () => {
      // Property: getAllDrafts should return empty array when no drafts exist
      const drafts = await getAllDrafts();
      expect(drafts).toEqual([]);
    });
  });

  describe('clearAllDrafts', () => {
    it('should remove all drafts', () => {
      // Property: After clearAllDrafts, getAllDrafts should return empty array
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              assignmentId: fc.string({ minLength: 1, maxLength: 50 }),
              textAnswer: fc.string({ minLength: 0, maxLength: 1000 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (draftsToSave) => {
            // Ensure unique assignment IDs
            const uniqueDrafts = Array.from(
              new Map(draftsToSave.map(d => [d.assignmentId, d])).values()
            );

            // Save all drafts
            for (const draft of uniqueDrafts) {
              await saveDraft(draft.assignmentId, draft.textAnswer, []);
            }

            // Verify they exist
            const beforeClear = await getAllDrafts();
            expect(beforeClear.length).toBeGreaterThan(0);

            // Clear all
            await clearAllDrafts();

            // Verify all are gone
            const afterClear = await getAllDrafts();
            expect(afterClear).toEqual([]);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Draft data integrity', () => {
    it('should preserve file data structure through save/load cycle', () => {
      // Property: File objects should maintain their structure through persistence
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(
            fc.record({
              uri: fc.webUrl(),
              name: fc.tuple(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.constantFrom('.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx')
              ).map(([base, ext]) => `${base}${ext}`),
              type: fc.constantFrom(
                'application/pdf',
                'image/png',
                'image/jpeg',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              ),
              size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (assignmentId, files: LocalFile[]) => {
            // Save draft with files
            await saveDraft(assignmentId, 'test', files);

            // Load draft
            const draft = await loadDraft(assignmentId);

            // Verify file structure is preserved
            expect(draft).not.toBeNull();
            expect(draft!.files).toHaveLength(files.length);

            files.forEach((originalFile, index) => {
              const loadedFile = draft!.files[index];
              expect(loadedFile).toMatchObject({
                uri: originalFile.uri,
                name: originalFile.name,
                type: originalFile.type,
                size: originalFile.size,
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty text and empty files', () => {
      // Property: Drafts with empty text and no files should persist correctly
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (assignmentId) => {
            // Save draft with empty data
            await saveDraft(assignmentId, '', []);

            // Load draft
            const draft = await loadDraft(assignmentId);

            // Should still exist with empty values
            expect(draft).not.toBeNull();
            expect(draft!.textAnswer).toBe('');
            expect(draft!.files).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
