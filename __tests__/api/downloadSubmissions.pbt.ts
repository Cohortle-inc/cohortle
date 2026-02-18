// Property-Based Tests for Download Submissions
// Feature: assignment-submission-system

import fc from 'fast-check';
import { Submission, SubmissionFile } from '@/types/assignments';

/**
 * Property 14: Download Package Completeness
 * 
 * For any assignment with M submissions containing files, downloading all submissions 
 * should produce a package containing all files from all M submissions, organized by 
 * student identifier.
 * 
 * **Validates: Requirements 7.1, 7.2**
 * 
 * Note: This test validates the logical structure and completeness of download packages.
 * The actual ZIP file creation and download happens on the backend API.
 */

// Generator for submission files
const submissionFileArb = fc.record({
  id: fc.uuid(),
  submissionId: fc.uuid(),
  fileName: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.pdf`),
  fileUrl: fc.webUrl(),
  fileType: fc.constantFrom('application/pdf', 'image/png', 'image/jpeg'),
  fileSize: fc.integer({ min: 1024, max: 10 * 1024 * 1024 }), // 1KB to 10MB
  uploadedAt: fc.date().map(d => d.toISOString()),
});

// Generator for submissions with files
const submissionWithFilesArb = fc.record({
  id: fc.uuid(),
  assignmentId: fc.uuid(),
  studentId: fc.uuid(),
  textAnswer: fc.option(fc.lorem({ maxCount: 50 }), { nil: null }),
  files: fc.array(submissionFileArb, { minLength: 1, maxLength: 5 }),
  status: fc.constant('submitted' as const),
  gradingStatus: fc.constantFrom('pending' as const, 'passed' as const, 'failed' as const),
  feedback: fc.option(fc.lorem({ maxCount: 100 }), { nil: null }),
  submittedAt: fc.date().map(d => d.toISOString()),
  gradedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: null }),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString()),
  student: fc.record({
    id: fc.uuid(),
    name: fc.fullName(),
    email: fc.emailAddress(),
  }),
});

/**
 * Helper function to simulate organizing files by student for download package
 * This represents the expected structure of a download package
 */
function organizeFilesForDownload(submissions: Submission[]): Map<string, SubmissionFile[]> {
  const packageStructure = new Map<string, SubmissionFile[]>();

  for (const submission of submissions) {
    const studentIdentifier = submission.student?.id || submission.studentId;
    const existingFiles = packageStructure.get(studentIdentifier) || [];
    packageStructure.set(studentIdentifier, [...existingFiles, ...submission.files]);
  }

  return packageStructure;
}

/**
 * Helper function to count total files in submissions
 */
function countTotalFiles(submissions: Submission[]): number {
  return submissions.reduce((total, submission) => total + submission.files.length, 0);
}

/**
 * Helper function to get all unique student identifiers
 */
function getUniqueStudents(submissions: Submission[]): Set<string> {
  return new Set(
    submissions.map(s => s.student?.id || s.studentId)
  );
}

describe('Property 14: Download Package Completeness', () => {
  it('should include all files from all submissions in the download package', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissions);

          // Count total files in original submissions
          const totalFilesInSubmissions = countTotalFiles(submissions);

          // Count total files in package
          let totalFilesInPackage = 0;
          for (const files of packageStructure.values()) {
            totalFilesInPackage += files.length;
          }

          // Property: All files from all submissions should be in the package
          return totalFilesInPackage === totalFilesInSubmissions;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should organize files by student identifier', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissions);

          // Get unique students from submissions
          const uniqueStudents = getUniqueStudents(submissions);

          // Property: Package should have entries for all unique students
          return packageStructure.size === uniqueStudents.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all file metadata in the package', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissions);

          // Collect all files from package
          const packageFiles: SubmissionFile[] = [];
          for (const files of packageStructure.values()) {
            packageFiles.push(...files);
          }

          // Collect all files from submissions
          const submissionFiles: SubmissionFile[] = [];
          for (const submission of submissions) {
            submissionFiles.push(...submission.files);
          }

          // Property: Every file in submissions should have matching metadata in package
          return submissionFiles.every(originalFile => {
            const matchingFile = packageFiles.find(
              pf =>
                pf.id === originalFile.id &&
                pf.fileName === originalFile.fileName &&
                pf.fileUrl === originalFile.fileUrl &&
                pf.fileSize === originalFile.fileSize
            );
            return matchingFile !== undefined;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle submissions with varying numbers of files', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...submissionWithFilesArb.value,
            files: fc.array(submissionFileArb, { minLength: 0, maxLength: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (submissions) => {
          // Filter to only submissions with files (as per requirement)
          const submissionsWithFiles = submissions.filter(s => s.files.length > 0);

          if (submissionsWithFiles.length === 0) {
            // If no submissions have files, package should be empty
            return true;
          }

          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissionsWithFiles);

          // Count total files
          const totalFilesInSubmissions = countTotalFiles(submissionsWithFiles);
          let totalFilesInPackage = 0;
          for (const files of packageStructure.values()) {
            totalFilesInPackage += files.length;
          }

          // Property: Package should contain all files from submissions with files
          return totalFilesInPackage === totalFilesInSubmissions;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain student-file association in the package', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissions);

          // Property: Each file in package should belong to the correct student
          for (const submission of submissions) {
            const studentId = submission.student?.id || submission.studentId;
            const studentFiles = packageStructure.get(studentId) || [];

            // All files from this submission should be in the student's folder
            const allFilesPresent = submission.files.every(file =>
              studentFiles.some(sf => sf.id === file.id)
            );

            if (!allFilesPresent) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple submissions from the same student', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // Same student ID for all submissions
        fc.array(submissionWithFilesArb, { minLength: 2, maxLength: 5 }),
        (sharedStudentId, submissions) => {
          // Set all submissions to have the same student ID
          const submissionsFromSameStudent = submissions.map(s => ({
            ...s,
            studentId: sharedStudentId,
            student: {
              id: sharedStudentId,
              name: 'Test Student',
              email: 'test@example.com',
            },
          }));

          // Organize files as they would be in a download package
          const packageStructure = organizeFilesForDownload(submissionsFromSameStudent);

          // Property: Should have only one entry for the student
          if (packageStructure.size !== 1) {
            return false;
          }

          // Property: That entry should contain all files from all submissions
          const studentFiles = packageStructure.get(sharedStudentId) || [];
          const totalExpectedFiles = countTotalFiles(submissionsFromSameStudent);

          return studentFiles.length === totalExpectedFiles;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 15: Text Inclusion in Downloads
 * 
 * For any submission with non-empty text content, the download package should include 
 * that text content in a readable format.
 * 
 * **Validates: Requirements 7.3**
 */

/**
 * Helper function to simulate creating text files for download package
 * This represents how text answers would be included in the download
 */
function createTextFilesForDownload(submissions: Submission[]): Map<string, string> {
  const textFiles = new Map<string, string>();

  for (const submission of submissions) {
    if (submission.textAnswer && submission.textAnswer.trim().length > 0) {
      const studentIdentifier = submission.student?.id || submission.studentId;
      const fileName = `${studentIdentifier}_text_answer.txt`;
      textFiles.set(fileName, submission.textAnswer);
    }
  }

  return textFiles;
}

/**
 * Helper function to check if text is in a readable format
 */
function isReadableFormat(text: string): boolean {
  // Text should be non-empty and contain printable characters
  return text.trim().length > 0 && /[\w\s]/.test(text);
}

describe('Property 15: Text Inclusion in Downloads', () => {
  it('should include text answers for all submissions with non-empty text', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Count submissions with non-empty text
          const submissionsWithText = submissions.filter(
            s => s.textAnswer && s.textAnswer.trim().length > 0
          );

          // Property: Should have text file for each submission with text
          return textFiles.size === submissionsWithText.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve the exact text content in the download', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Each text file should contain the exact text from submission
          for (const submission of submissions) {
            if (submission.textAnswer && submission.textAnswer.trim().length > 0) {
              const studentId = submission.student?.id || submission.studentId;
              const fileName = `${studentId}_text_answer.txt`;
              const textContent = textFiles.get(fileName);

              if (textContent !== submission.textAnswer) {
                return false;
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should store text in a readable format', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: All text files should be in readable format
          for (const textContent of textFiles.values()) {
            if (!isReadableFormat(textContent)) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include text files for submissions without text answers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...submissionWithFilesArb.value,
            textAnswer: fc.constant(null), // Force no text answer
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Should have no text files when no submissions have text
          return textFiles.size === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include text files for submissions with only whitespace', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...submissionWithFilesArb.value,
            textAnswer: fc.constantFrom('   ', '\n\n', '\t\t', '  \n  '),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Should have no text files for whitespace-only text
          return textFiles.size === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should associate text files with correct student identifiers', () => {
    fc.assert(
      fc.property(
        fc.array(submissionWithFilesArb, { minLength: 1, maxLength: 10 }),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Each text file name should contain the correct student ID
          for (const submission of submissions) {
            if (submission.textAnswer && submission.textAnswer.trim().length > 0) {
              const studentId = submission.student?.id || submission.studentId;
              const expectedFileName = `${studentId}_text_answer.txt`;

              if (!textFiles.has(expectedFileName)) {
                return false;
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle text answers with special characters', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...submissionWithFilesArb.value,
            textAnswer: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Should preserve special characters in text content
          for (const submission of submissions) {
            if (submission.textAnswer && submission.textAnswer.trim().length > 0) {
              const studentId = submission.student?.id || submission.studentId;
              const fileName = `${studentId}_text_answer.txt`;
              const textContent = textFiles.get(fileName);

              // Text should be preserved exactly, including special characters
              if (textContent !== submission.textAnswer) {
                return false;
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle very long text answers', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...submissionWithFilesArb.value,
            textAnswer: fc.lorem({ maxCount: 1000 }), // Very long text
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (submissions) => {
          // Create text files as they would be in download package
          const textFiles = createTextFilesForDownload(submissions);

          // Property: Should include all text regardless of length
          const submissionsWithText = submissions.filter(
            s => s.textAnswer && s.textAnswer.trim().length > 0
          );

          if (textFiles.size !== submissionsWithText.length) {
            return false;
          }

          // Verify content is preserved
          for (const submission of submissionsWithText) {
            const studentId = submission.student?.id || submission.studentId;
            const fileName = `${studentId}_text_answer.txt`;
            const textContent = textFiles.get(fileName);

            if (textContent !== submission.textAnswer) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
