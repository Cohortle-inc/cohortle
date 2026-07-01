'use client';

import { useCallback } from 'react';
import { QuizData, QuizQuestion, QuizSettings as QuizSettingsType } from '@/types/quiz';
import { QuizSettings } from './QuizSettings';
import { QuestionEditor } from './QuestionEditor';

interface QuizBuilderProps {
  initialData?: QuizData;
  onChange: (data: QuizData) => void;
}

const DEFAULT_SETTINGS: QuizSettingsType = {
  passing_score: null,
  time_limit: null,
  allow_retakes: true,
};

const DEFAULT_QUIZ_DATA: QuizData = {
  questions: [],
  settings: DEFAULT_SETTINGS,
};

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * QuizBuilder — convener component for building a native quiz.
 * Requirements: 1.1, 1.2, 1.8, 1.9, 1.10
 */
export function QuizBuilder({ initialData, onChange }: QuizBuilderProps) {
  const data: QuizData = initialData ?? DEFAULT_QUIZ_DATA;

  const updateSettings = useCallback(
    (settings: QuizSettingsType) => {
      onChange({ ...data, settings });
    },
    [data, onChange]
  );

  const updateQuestion = useCallback(
    (index: number, question: QuizQuestion) => {
      const questions = [...data.questions];
      questions[index] = question;
      onChange({ ...data, questions });
    },
    [data, onChange]
  );

  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      type: 'multiple-choice',
      question: '',
      options: ['', ''],
      correctAnswer: 0,
    };
    onChange({ ...data, questions: [...data.questions, newQuestion] });
  }, [data, onChange]);

  const deleteQuestion = useCallback(
    (index: number) => {
      const questions = data.questions.filter((_, i) => i !== index);
      onChange({ ...data, questions });
    },
    [data, onChange]
  );

  const moveQuestion = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const questions = [...data.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= questions.length) return;
      [questions[index], questions[targetIndex]] = [questions[targetIndex], questions[index]];
      onChange({ ...data, questions });
    },
    [data, onChange]
  );

  const hasValidationError = data.questions.length === 0;

  return (
    <div className="space-y-4">
      {/* Settings */}
      <QuizSettings settings={data.settings} onChange={updateSettings} />

      {/* Questions */}
      <div className="space-y-3">
        {data.questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            onChange={(q) => updateQuestion(index, q)}
            onDelete={() => deleteQuestion(index)}
            onMoveUp={() => moveQuestion(index, 'up')}
            onMoveDown={() => moveQuestion(index, 'down')}
            isFirst={index === 0}
            isLast={index === data.questions.length - 1}
          />
        ))}
      </div>

      {/* Empty state / validation */}
      {hasValidationError && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Add at least one question before saving.
        </p>
      )}

      {/* Add question button */}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#391D65] hover:text-[#391D65] transition-colors"
      >
        + Add Question
      </button>
    </div>
  );
}
