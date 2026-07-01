'use client';

import { QuizQuestion, QuestionType } from '@/types/quiz';

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  onChange: (question: QuizQuestion) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True / False' },
  { value: 'text-input', label: 'Text Input' },
];

/**
 * QuestionEditor — renders a single quiz question with type-specific fields.
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */
export function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: QuestionEditorProps) {
  const handleTypeChange = (type: QuestionType) => {
    const base: QuizQuestion = {
      id: question.id,
      type,
      question: question.question,
      correctAnswer: '',
      explanation: question.explanation,
    };
    if (type === 'multiple-choice') {
      base.options = ['', ''];
      base.correctAnswer = 0;
    } else if (type === 'true-false') {
      base.correctAnswer = 'true';
    }
    onChange(base);
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const options = [...(question.options ?? [])];
    options[optionIndex] = value;
    onChange({ ...question, options });
  };

  const addOption = () => {
    onChange({ ...question, options: [...(question.options ?? []), ''] });
  };

  const removeOption = (optionIndex: number) => {
    const options = (question.options ?? []).filter((_, i) => i !== optionIndex);
    // If the correct answer was this option or beyond, reset it
    const currentCorrect = Number(question.correctAnswer);
    const newCorrect = currentCorrect >= optionIndex && currentCorrect > 0
      ? currentCorrect - 1
      : currentCorrect;
    onChange({ ...question, options, correctAnswer: newCorrect });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Question {index + 1}
        </span>
        <div className="flex items-center gap-1">
          {!isFirst && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Move up"
            >
              ↑
            </button>
          )}
          {!isLast && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-600 ml-1"
            title="Delete question"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Question type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <select
          value={question.type}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65]"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
        <textarea
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          placeholder="Enter your question..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65] resize-none"
        />
      </div>

      {/* Multiple choice options */}
      {question.type === 'multiple-choice' && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">
            Options <span className="text-gray-400">(select the correct one)</span>
          </label>
          {(question.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={Number(question.correctAnswer) === i}
                onChange={() => onChange({ ...question, correctAnswer: i })}
                className="text-[#391D65] focus:ring-[#391D65]"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65]"
              />
              {(question.options ?? []).length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-[#391D65] hover:underline"
          >
            + Add option
          </button>
        </div>
      )}

      {/* True / False */}
      {question.type === 'true-false' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Correct answer
          </label>
          <div className="flex gap-4">
            {['true', 'false'].map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`tf-${question.id}`}
                  value={val}
                  checked={String(question.correctAnswer) === val}
                  onChange={() => onChange({ ...question, correctAnswer: val })}
                  className="text-[#391D65] focus:ring-[#391D65]"
                />
                <span className="text-sm capitalize">{val}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      {question.type === 'text-input' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Correct answer
          </label>
          <input
            type="text"
            value={String(question.correctAnswer)}
            onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
            placeholder="Expected answer (case-insensitive)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65]"
          />
        </div>
      )}

      {/* Explanation (optional) */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Explanation <span className="text-gray-400">optional — shown after submission</span>
        </label>
        <input
          type="text"
          value={question.explanation ?? ''}
          onChange={(e) =>
            onChange({ ...question, explanation: e.target.value || undefined })
          }
          placeholder="Why is this the correct answer?"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#391D65]"
        />
      </div>
    </div>
  );
}
