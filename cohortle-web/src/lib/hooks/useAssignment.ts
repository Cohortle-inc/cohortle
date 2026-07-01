'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAssignment,
  submitAssignment,
  submitAssignmentFiles,
  AssignmentResponse,
  AssignmentSubmission,
} from '@/lib/api/assignments';

const DRAFT_KEY_PREFIX = 'assignment_draft_';

interface UseAssignmentReturn {
  assignment: AssignmentResponse | null;
  submission: AssignmentSubmission | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submit: (textAnswer?: string) => Promise<void>;
  submitFiles: (files: File[]) => Promise<void>;
  draftAnswer: string;
  setDraftAnswer: (value: string) => void;
  clearDraft: () => void;
}

export function useAssignment(lessonId: string, cohortId: string): UseAssignmentReturn {
  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftAnswer, setDraftAnswerState] = useState('');

  const draftKey = `${DRAFT_KEY_PREFIX}${lessonId}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(draftKey);
      if (saved) setDraftAnswerState(saved);
    }
  }, [draftKey]);

  // Debounced draft save
  useEffect(() => {
    if (!draftAnswer) return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(draftKey, draftAnswer);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [draftAnswer, draftKey]);

  const setDraftAnswer = useCallback((value: string) => {
    setDraftAnswerState(value);
  }, []);

  const clearDraft = useCallback(() => {
    setDraftAnswerState('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  // Fetch assignment data
  useEffect(() => {
    if (!lessonId || !cohortId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAssignment(lessonId, cohortId)
      .then(data => {
        if (!cancelled) {
          setAssignment(data);
          // Pre-fill draft with existing text answer if not yet submitted
          if (data.submission?.text_answer && !localStorage.getItem(draftKey)) {
            setDraftAnswerState(data.submission.text_answer);
          }
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to load assignment');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [lessonId, cohortId, draftKey]);

  const submit = useCallback(async (textAnswer?: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const submission = await submitAssignment(lessonId, cohortId, textAnswer ?? draftAnswer);
      setAssignment(prev => prev ? { ...prev, submission } : prev);
      clearDraft();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [lessonId, cohortId, draftAnswer, clearDraft]);

  const submitFiles = useCallback(async (files: File[]) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const uploadedFiles = await submitAssignmentFiles(lessonId, cohortId, files);
      // Merge uploaded files into current submission
      setAssignment(prev => {
        if (!prev) return prev;
        const existingSubmission = prev.submission;
        if (!existingSubmission) return prev;
        return {
          ...prev,
          submission: {
            ...existingSubmission,
            files: [...(existingSubmission.files || []), ...uploadedFiles],
          },
        };
      });
    } catch (err: any) {
      setError(err.message || 'File upload failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [lessonId, cohortId]);

  return {
    assignment,
    submission: assignment?.submission ?? null,
    isLoading,
    error,
    isSubmitting,
    submit,
    submitFiles,
    draftAnswer,
    setDraftAnswer,
    clearDraft,
  };
}
