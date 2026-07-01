'use client';

/**
 * ApplicationTemplateEditor
 * Allows conveners to define, reorder, and delete application template questions.
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */

import React, { useState } from 'react';

export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect';

export interface TemplateQuestion {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  options?: string[];
  order_index: number;
}

interface ApplicationTemplateEditorProps {
  questions: TemplateQuestion[];
  onChange: (questions: TemplateQuestion[]) => void;
  disabled?: boolean;
}

const EMPTY_QUESTION: Omit<TemplateQuestion, 'order_index'> = {
  question_text: '',
  question_type: 'textarea',
  is_required: true,
  options: [],
};

export function ApplicationTemplateEditor({
  questions,
  onChange,
  disabled = false,
}: ApplicationTemplateEditorProps) {
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  const updateQuestion = (index: number, patch: Partial<TemplateQuestion>) => {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, ...patch } : q
    );
    onChange(updated);
  };

  const addQuestion = () => {
    onChange([
      ...questions,
      { ...EMPTY_QUESTION, options: [], order_index: questions.length },
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, order_index: i }));
    onChange(updated);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    onChange(updated.map((q, i) => ({ ...q, order_index: i })));
  };

  const addOption = (index: number) => {
    const raw = (optionInputs[index] || '').trim();
    if (!raw) return;
    const current = questions[index].options || [];
    if (!current.includes(raw)) {
      updateQuestion(index, { options: [...current, raw] });
    }
    setOptionInputs((prev) => ({ ...prev, [index]: '' }));
  };

  const removeOption = (qIndex: number, optValue: string) => {
    const current = questions[qIndex].options || [];
    updateQuestion(qIndex, { options: current.filter((o) => o !== optValue) });
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No questions yet. Add at least one question before setting the programme to recruiting.
        </p>
      )}

      {questions.map((q, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg p-4 bg-white space-y-3"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Question {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveQuestion(index, 'up')}
                disabled={disabled || index === 0}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                aria-label="Move question up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(index, 'down')}
                disabled={disabled || index === questions.length - 1}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                aria-label="Move question down"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                disabled={disabled}
                className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 ml-1"
                aria-label="Delete question"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Question text
            </label>
            <input
              type="text"
              value={q.question_text}
              onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
              disabled={disabled}
              placeholder="e.g. Why do you want to join this programme?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {/* Type + required row */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Type
              </label>
              <select
                value={q.question_type}
                onChange={(e) =>
                  updateQuestion(index, { question_type: e.target.value as QuestionType })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="text">Short text</option>
                <option value="textarea">Long text</option>
                <option value="select">Single select</option>
                <option value="multiselect">Multi-select</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                id={`required-${index}`}
                type="checkbox"
                checked={q.is_required}
                onChange={(e) => updateQuestion(index, { is_required: e.target.checked })}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor={`required-${index}`} className="text-sm text-gray-700">
                Required
              </label>
            </div>
          </div>

          {/* Options (for select/multiselect) */}
          {(q.question_type === 'select' || q.question_type === 'multiselect') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Options
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(q.options || []).map((opt) => (
                  <span
                    key={opt}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(index, opt)}
                      disabled={disabled}
                      className="text-indigo-400 hover:text-indigo-700"
                      aria-label={`Remove option ${opt}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={optionInputs[index] || ''}
                  onChange={(e) =>
                    setOptionInputs((prev) => ({ ...prev, [index]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption(index);
                    }
                  }}
                  disabled={disabled}
                  placeholder="Add option and press Enter"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => addOption(index)}
                  disabled={disabled}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        disabled={disabled}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 transition-colors"
      >
        + Add question
      </button>
    </div>
  );
}
