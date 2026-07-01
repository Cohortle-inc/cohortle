'use client';

import { useState, useEffect } from 'react';
import { QuizData, QuizQuestion, QuizAttempt } from '@/types/quiz';
import { submitQuizAttempt, getLatestQuizAttempt } from '@/lib/api/lessons';
import { CountdownTimer } from './CountdownTimer';

interface QuizLessonContentProps {
  lessonId: string;
  cohortId: number;
  title: string;
  quizData: QuizData;
  onQuizComplete?: (score: number) => void;
}

export function QuizLessonContent({
  lessonId,
  cohortId,
  title,
  quizData,
  onQuizComplete,
}: QuizLessonContentProps) {
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingPrior, setLoadingPrior] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  // Fetch prior attempt on mount
  useEffect(() => {
    getLatestQuizAttempt(lessonId, cohortId)
      .then((prior) => {
        if (prior) {
          setAttempt(prior);
          setAnswers(new Map(Object.entries(prior.answers)));
          setSubmitted(true);
        }
      })
      .catch(() => {/* ignore — show blank quiz */})
      .finally(() => setLoadingPrior(false));
  }, [lessonId, cohortId]);

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    const next = new Map(answers);
    next.set(questionId, answer);
    setAnswers(next);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const allAnswered = quizData.questions.every((q) => answers.has(q.id));
      if (!allAnswered) {
        setSubmitError('Please answer all questions before submitting.');
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const answersObj = Object.fromEntries(answers);
      const result = await submitQuizAttempt(lessonId, cohortId, answersObj);
      setAttempt(result);
      setSubmitted(true);
      if (onQuizComplete) onQuizComplete(result.score);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers(new Map());
    setAttempt(null);
    setSubmitted(false);
    setSubmitError(null);
    setTimedOut(false);
  };

  const handleTimerExpire = () => {
    setTimedOut(true);
    handleSubmit(true);
  };

  const isAnswerCorrect = (question: QuizQuestion): boolean => {
    const userAnswer = answers.get(question.id);
    if (userAnswer === undefined) return false;
    return (
      String(userAnswer).trim().toLowerCase() ===
      String(question.correctAnswer).trim().toLowerCase()
    );
  };

  if (loadingPrior) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading quiz…
      </div>
    );
  }

  const settings = quizData.settings;
  const allowRetakes = settings?.allow_retakes !== false;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" data-testid="quiz-lesson">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        {!submitted && settings?.time_limit && (
          <CountdownTimer minutes={settings.time_limit} onExpire={handleTimerExpire} />
        )}
      </div>

      {/* Quiz meta */}
      <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span>{quizData.questions.length} questions</span>
        {settings?.time_limit && <span>• {settings.time_limit} min</span>}
        {settings?.passing_score && <span>• Passing score: {settings.passing_score}%</span>}
      </div>

      {/* Submission error banner */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
          {submitError}
          <button
            onClick={() => setSubmitError(null)}
            className="ml-3 text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Score display after submission */}
      {submitted && attempt && (
        <div className={`mb-8 p-6 rounded-lg border-2 ${
          attempt.passed ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Your Score: {attempt.score}%
              </h2>
              <p className="text-gray-700">
                {quizData.questions.filter((q) => isAnswerCorrect(q)).length} of{' '}
                {quizData.questions.length} correct
              </p>
              <p className={`mt-2 font-medium ${attempt.passed ? 'text-green-700' : 'text-red-700'}`}>
                {attempt.passed ? '✓ Passed' : '✗ Did not pass'}
              </p>
              {timedOut && (
                <p className="mt-1 text-sm text-orange-600">Quiz was auto-submitted when time ran out.</p>
              )}
            </div>
            {allowRetakes && (
              <button
                onClick={handleRetake}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {quizData.questions.map((question, index) =>
          renderQuestion(question, index, answers, submitted, isAnswerCorrect, handleAnswerChange)
        )}
      </div>

      {/* Submit button */}
      {!submitted && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderQuestion(
  question: QuizQuestion,
  index: number,
  answers: Map<string, string | number>,
  submitted: boolean,
  isAnswerCorrect: (q: QuizQuestion) => boolean,
  handleAnswerChange: (id: string, val: string | number) => void
) {
  const userAnswer = answers.get(question.id);
  const isCorrect = submitted ? isAnswerCorrect(question) : null;

  return (
    <div key={question.id} className="mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="mb-4">
        <span className="text-sm font-semibold text-blue-600 mb-2 block">
          Question {index + 1}
        </span>
        <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
      </div>

      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-3">
          {question.options.map((option, optIdx) => {
            const optVal = String(optIdx);
            const isSelected = String(userAnswer) === optVal;
            const showCorrect = submitted && String(question.correctAnswer) === optVal;
            const showIncorrect = submitted && isSelected && !isCorrect;
            return (
              <label
                key={optIdx}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  submitted
                    ? showCorrect ? 'border-green-500 bg-green-50'
                    : showIncorrect ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                    : isSelected ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={optIdx}
                  checked={isSelected}
                  onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                  disabled={submitted}
                  className="mt-1 mr-3"
                />
                <span className="flex-1 text-gray-800">{option}</span>
                {submitted && showCorrect && <CheckIcon />}
                {submitted && showIncorrect && <CrossIcon />}
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'true-false' && (
        <div className="space-y-3">
          {['true', 'false'].map((opt) => {
            const isSelected = String(userAnswer) === opt;
            const showCorrect = submitted && String(question.correctAnswer).toLowerCase() === opt;
            const showIncorrect = submitted && isSelected && !isCorrect;
            return (
              <label
                key={opt}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  submitted
                    ? showCorrect ? 'border-green-500 bg-green-50'
                    : showIncorrect ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                    : isSelected ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={isSelected}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitted}
                  className="mr-3"
                />
                <span className="flex-1 text-gray-800 capitalize">{opt}</span>
                {submitted && showCorrect && <CheckIcon />}
                {submitted && showIncorrect && <CrossIcon />}
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'text-input' && (
        <input
          type="text"
          value={String(userAnswer || '')}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          disabled={submitted}
          placeholder="Type your answer here…"
          className={`w-full p-3 border-2 rounded-lg ${
            submitted
              ? isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              : 'border-gray-300 focus:border-blue-500 focus:outline-none'
          }`}
        />
      )}

      {/* Per-question feedback */}
      {submitted && (
        <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start">
            {isCorrect ? <CheckIcon className="mr-2 mt-0.5 text-green-700" /> : <CrossIcon className="mr-2 mt-0.5 text-red-600" />}
            <div className="flex-1">
              <p className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {!isCorrect && (
                <p className="text-sm text-gray-700 mt-1">
                  Correct answer:{' '}
                  {question.type === 'multiple-choice' && question.options
                    ? question.options[Number(question.correctAnswer)]
                    : String(question.correctAnswer)}
                </p>
              )}
              {question.explanation && (
                <p className="text-sm text-gray-700 mt-2">{question.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ className = 'w-5 h-5 text-green-700 ml-2' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function CrossIcon({ className = 'w-5 h-5 text-red-600 ml-2' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}
