import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuizLessonContent } from '@/components/lessons/QuizLessonContent';
import type { QuizData, QuizAttempt } from '@/types/quiz';

// Mock the API calls
jest.mock('@/lib/api/lessons', () => ({
  getLatestQuizAttempt: jest.fn().mockResolvedValue(null),
  submitQuizAttempt: jest.fn(),
}));

import { getLatestQuizAttempt, submitQuizAttempt } from '@/lib/api/lessons';

const mockGetLatest = getLatestQuizAttempt as jest.Mock;
const mockSubmit = submitQuizAttempt as jest.Mock;

const mockQuizData: QuizData = {
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      explanation: 'Basic arithmetic: 2 + 2 = 4',
    },
    {
      id: 'q2',
      type: 'true-false',
      question: 'The sky is blue.',
      correctAnswer: 'true',
      explanation: 'The sky appears blue due to Rayleigh scattering.',
    },
    {
      id: 'q3',
      type: 'text-input',
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
    },
  ],
  settings: {
    passing_score: 70,
    allow_retakes: true,
    time_limit: 30,
  },
};

const makeAttempt = (overrides: Partial<QuizAttempt> = {}): QuizAttempt => ({
  id: 1,
  lesson_id: 1,
  user_id: 1,
  cohort_id: 1,
  answers: { q1: 1, q2: 'true', q3: 'Paris' },
  score: 100,
  passed: true,
  submitted_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  lessonId: '1',
  cohortId: 1,
  title: 'Math Quiz',
  quizData: mockQuizData,
};

beforeEach(() => {
  mockGetLatest.mockResolvedValue(null);
  mockSubmit.mockResolvedValue(makeAttempt());
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('QuizLessonContent', () => {
  it('renders quiz title and basic info after loading', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    expect(screen.getByText('Math Quiz')).toBeInTheDocument();
    expect(screen.getByText('3 questions')).toBeInTheDocument();
    expect(screen.getByText('• 30 min')).toBeInTheDocument();
    expect(screen.getByText('• Passing score: 70%')).toBeInTheDocument();
  });

  it('renders all question types correctly', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('The sky is blue.')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your answer here…')).toBeInTheDocument();
  });

  it('shows error when submitting with unanswered questions', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByText('Submit Quiz'));

    expect(await screen.findByText('Please answer all questions before submitting.')).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits and displays score on success', async () => {
    const onQuizComplete = jest.fn();
    render(<QuizLessonContent {...defaultProps} onQuizComplete={onQuizComplete} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('true'));
    fireEvent.change(screen.getByPlaceholderText('Type your answer here…'), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Quiz'));

    expect(await screen.findByText('Your Score: 100%')).toBeInTheDocument();
    expect(screen.getByText('✓ Passed')).toBeInTheDocument();
    expect(onQuizComplete).toHaveBeenCalledWith(100);
  });

  it('shows retake button when allow_retakes is true', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('true'));
    fireEvent.change(screen.getByPlaceholderText('Type your answer here…'), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Quiz'));

    expect(await screen.findByText('Retake Quiz')).toBeInTheDocument();
  });

  it('does not show retake button when allow_retakes is false', async () => {
    const noRetakeData: QuizData = {
      ...mockQuizData,
      settings: { ...mockQuizData.settings, allow_retakes: false },
    };
    mockSubmit.mockResolvedValue(makeAttempt());

    render(<QuizLessonContent {...defaultProps} quizData={noRetakeData} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('true'));
    fireEvent.change(screen.getByPlaceholderText('Type your answer here…'), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Quiz'));

    await waitFor(() => expect(screen.getByText('Your Score: 100%')).toBeInTheDocument());
    expect(screen.queryByText('Retake Quiz')).not.toBeInTheDocument();
  });

  it('pre-populates answers from prior attempt on mount', async () => {
    const prior = makeAttempt({ answers: { q1: 1, q2: 'true', q3: 'Paris' }, score: 100, passed: true });
    mockGetLatest.mockResolvedValue(prior);

    render(<QuizLessonContent {...defaultProps} />);

    expect(await screen.findByText('Your Score: 100%')).toBeInTheDocument();
    expect(screen.getByText('✓ Passed')).toBeInTheDocument();
  });

  it('resets state when retake is clicked', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('true'));
    fireEvent.change(screen.getByPlaceholderText('Type your answer here…'), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Quiz'));

    await screen.findByText('Retake Quiz');
    fireEvent.click(screen.getByText('Retake Quiz'));

    expect(screen.queryByText('Your Score:')).not.toBeInTheDocument();
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument();
  });

  it('disables inputs after submission', async () => {
    render(<QuizLessonContent {...defaultProps} />);
    await waitFor(() => expect(screen.queryByText('Loading quiz…')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('true'));
    const textInput = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.change(textInput, { target: { value: 'Paris' } });
    fireEvent.click(screen.getByText('Submit Quiz'));

    await screen.findByText('Your Score: 100%');
    expect(screen.getByLabelText('4')).toBeDisabled();
    expect(textInput).toBeDisabled();
  });
});
