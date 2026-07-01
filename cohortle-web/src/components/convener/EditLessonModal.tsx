'use client';

import { useState, useEffect, useRef } from 'react';
import { updateLesson, type LessonFormData } from '@/lib/api/convener';

interface EditLessonModalProps {
  lessonId: string;
  initialData: {
    title: string;
    description: string;
    contentType: 'video' | 'pdf' | 'link' | 'text' | 'live_session' | 'quiz' | 'assignment';
    contentUrl: string;
    contentText?: string;
    assignmentData?: LessonFormData['assignmentData'];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'video', label: 'Video (YouTube/Vimeo)' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'link', label: 'External Link' },
  { value: 'text', label: 'Text Content' },
  { value: 'live_session', label: 'Live Session' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
] as const;

/** Types that require a URL */
const URL_TYPES = ['video', 'pdf', 'link', 'live_session'];
/** Types that require text content */
const TEXT_TYPES = ['text'];
/** Types with no editable content field in this modal */
const NO_CONTENT_TYPES = ['quiz'];

export default function EditLessonModal({
  lessonId,
  initialData,
  onClose,
  onSuccess,
}: EditLessonModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description ?? '');
  const [contentType, setContentType] = useState<LessonFormData['contentType']>(initialData.contentType);
  const [contentUrl, setContentUrl] = useState(initialData.contentUrl ?? '');
  const [contentText, setContentText] = useState(initialData.contentText ?? '');
  const [assignmentData, setAssignmentData] = useState<LessonFormData['assignmentData']>(
    initialData.assignmentData ?? {
      instructions: '',
      due_date: null,
      allow_text_answer: true,
      allow_file_uploads: true,
      max_file_size_mb: 10,
      allowed_file_types: [],
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus first input on open
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const needsUrl = URL_TYPES.includes(contentType);
  const needsText = TEXT_TYPES.includes(contentType);
  const noContent = NO_CONTENT_TYPES.includes(contentType);
  const isAssignment = contentType === 'assignment';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required'); return; }
    if (needsUrl && !contentUrl.trim()) { setError('Content URL is required for this type'); return; }
    if (needsText && !contentText.trim()) { setError('Text content is required for text lessons'); return; }
    if (isAssignment && !assignmentData?.instructions?.trim()) { setError('Assignment instructions are required'); return; }

    setLoading(true);
    try {
      const payload: Partial<LessonFormData> = {
        title: title.trim(),
        description: description.trim(),
        contentType,
        ...(needsUrl && { contentUrl: contentUrl.trim() }),
        ...(needsText && { contentText: contentText.trim() }),
        ...(isAssignment && { assignmentData }),
      };
      await updateLesson(lessonId, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-lesson-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="edit-lesson-title" className="text-lg font-semibold text-gray-900">
            Edit Lesson
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            {/* Content Type */}
            <div>
              <label htmlFor="edit-content-type" className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                id="edit-content-type"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as LessonFormData['contentType'])}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:border-transparent bg-white"
                disabled={loading}
              >
                {CONTENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic content field */}
            {needsUrl && (
              <div>
                <label htmlFor="edit-content-url" className="block text-sm font-medium text-gray-700 mb-1">
                  {contentType === 'video' ? 'Video URL' :
                   contentType === 'pdf' ? 'PDF URL' :
                   contentType === 'live_session' ? 'Join URL' : 'Link URL'}
                  <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-content-url"
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:border-transparent"
                  placeholder={
                    contentType === 'video' ? 'https://www.youtube.com/watch?v=...' :
                    contentType === 'pdf' ? 'https://example.com/document.pdf' :
                    contentType === 'live_session' ? 'https://zoom.us/j/...' :
                    'https://example.com'
                  }
                  required
                  disabled={loading}
                />
              </div>
            )}

            {needsText && (
              <div>
                <label htmlFor="edit-content-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="edit-content-text"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:border-transparent resize-y"
                  placeholder="Enter the lesson text content..."
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 text-right">{contentText.length.toLocaleString()} / 50,000</p>
              </div>
            )}

            {noContent && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Quiz content is managed through the quiz builder. Only the title and description can be edited here.
              </div>
            )}

            {isAssignment && (
              <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-900">Assignment Settings</h3>

                <div>
                  <label htmlFor="edit-assignment-instructions" className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="edit-assignment-instructions"
                    value={assignmentData?.instructions ?? ''}
                    onChange={e => setAssignmentData(prev => ({ ...prev!, instructions: e.target.value }))}
                    rows={5}
                    maxLength={5000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="Describe what learners need to do…"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {(assignmentData?.instructions ?? '').length}/5000
                  </p>
                </div>

                <div>
                  <label htmlFor="edit-assignment-due-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="edit-assignment-due-date"
                    type="datetime-local"
                    value={assignmentData?.due_date ?? ''}
                    onChange={e => setAssignmentData(prev => ({ ...prev!, due_date: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignmentData?.allow_text_answer ?? true}
                      onChange={e => setAssignmentData(prev => ({ ...prev!, allow_text_answer: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Allow written text answer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignmentData?.allow_file_uploads ?? true}
                      onChange={e => setAssignmentData(prev => ({ ...prev!, allow_file_uploads: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Allow file uploads</span>
                  </label>
                </div>

                {assignmentData?.allow_file_uploads && (
                  <div>
                    <label htmlFor="edit-assignment-max-size" className="block text-sm font-medium text-gray-700 mb-1">
                      Max file size (MB)
                    </label>
                    <input
                      id="edit-assignment-max-size"
                      type="number"
                      min={1}
                      max={100}
                      value={assignmentData?.max_file_size_mb ?? 10}
                      onChange={e => setAssignmentData(prev => ({ ...prev!, max_file_size_mb: Number(e.target.value) }))}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#391D65] rounded-lg hover:bg-[#4a2680] focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
