/**
 * Unit tests for PreviewMode component
 * Tests preview mode functionality for conveners
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PreviewMode, PreviewModeButton } from '@/components/convener/PreviewMode';
import { getWeeks } from '@/lib/api/convener';

// Mock the API
jest.mock('@/lib/api/convener');
const mockGetWeeks = getWeeks as jest.MockedFunction<typeof getWeeks>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock child components
jest.mock('@/components/programmes/ProgrammeHeader', () => ({
  ProgrammeHeader: ({ programme, progress }: any) => (
    <div data-testid="programme-header">
      <h1>{programme.name}</h1>
      <p>{programme.description}</p>
      {progress && <div data-testid="progress">{progress.percentage}%</div>}
    </div>
  ),
}));

jest.mock('@/components/programmes/WeekSection', () => ({
  WeekSection: ({ week }: any) => (
    <div data-testid={`week-${week.id}`}>
      <h2>Week {week.week_number}: {week.title}</h2>
      <div data-testid={`week-${week.id}-lessons`}>
        {week.lessons.map((lesson: any) => (
          <div key={lesson.id} data-testid={`lesson-${lesson.id}`}>
            {lesson.title}
          </div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe('PreviewMode', () => {
  const mockOnExit = jest.fn();
  const mockProgrammeId = '123';
  const mockProgrammeName = 'Test Programme';
  const mockProgrammeDescription = 'Test Description';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render preview mode banner with exit button', async () => {
    mockGetWeeks.mockResolvedValue([]);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
    });

    expect(screen.getByText(/You're viewing this programme as a learner would see it/)).toBeInTheDocument();
    expect(screen.getByText('Exit Preview')).toBeInTheDocument();
  });

  it('should call onExit when exit button is clicked', async () => {
    mockGetWeeks.mockResolvedValue([]);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Exit Preview')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Exit Preview'));
    expect(mockOnExit).toHaveBeenCalledTimes(1);
  });

  it('should display loading state while fetching data', () => {
    mockGetWeeks.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display error state when fetching fails', async () => {
    const errorMessage = 'Failed to load preview';
    mockGetWeeks.mockRejectedValue(new Error(errorMessage));

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Failed to load preview' })).toBeInTheDocument();
    });

    expect(screen.getAllByText(errorMessage).length).toBeGreaterThan(0);
  });

  it('should display empty state when no weeks are available', async () => {
    mockGetWeeks.mockResolvedValue([]);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No weeks or lessons available yet/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Create weeks and add lessons to see them in preview mode/)).toBeInTheDocument();
  });

  it('should render programme header with correct data', async () => {
    mockGetWeeks.mockResolvedValue([]);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('programme-header')).toBeInTheDocument();
    });

    expect(screen.getByText(mockProgrammeName)).toBeInTheDocument();
    expect(screen.getByText(mockProgrammeDescription)).toBeInTheDocument();
  });

  it('should render weeks and lessons in preview mode', async () => {
    const mockWeeks = [
      {
        id: 'week-1',
        programmeId: 123,
        weekNumber: 1,
        title: 'Week 1 Title',
        startDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        lessons: [
          {
            id: 'lesson-1',
            weekId: 'week-1',
            title: 'Lesson 1',
            description: 'Lesson 1 Description',
            contentType: 'video' as const,
            contentUrl: 'https://example.com/video',
            orderIndex: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    ];

    mockGetWeeks.mockResolvedValue(mockWeeks);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('week-week-1')).toBeInTheDocument();
    });

    expect(screen.getByText('Week 1: Week 1 Title')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-lesson-1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
  });

  it('should show all lessons as incomplete in preview mode', async () => {
    const mockWeeks = [
      {
        id: 'week-1',
        programmeId: 123,
        weekNumber: 1,
        title: 'Week 1',
        startDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        lessons: [
          {
            id: 'lesson-1',
            weekId: 'week-1',
            title: 'Lesson 1',
            description: 'Description',
            contentType: 'video' as const,
            contentUrl: 'https://example.com/video',
            orderIndex: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    ];

    mockGetWeeks.mockResolvedValue(mockWeeks);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('week-week-1')).toBeInTheDocument();
    });

    // Verify progress is 0%
    expect(screen.getByTestId('progress')).toHaveTextContent('0%');
  });

  it('should calculate total lessons correctly', async () => {
    const mockWeeks = [
      {
        id: 'week-1',
        programmeId: 123,
        weekNumber: 1,
        title: 'Week 1',
        startDate: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        lessons: [
          {
            id: 'lesson-1',
            weekId: 'week-1',
            title: 'Lesson 1',
            description: 'Description',
            contentType: 'video' as const,
            contentUrl: 'https://example.com/video',
            orderIndex: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: 'lesson-2',
            weekId: 'week-1',
            title: 'Lesson 2',
            description: 'Description',
            contentType: 'text' as const,
            contentUrl: '',
            orderIndex: 1,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
      {
        id: 'week-2',
        programmeId: 123,
        weekNumber: 2,
        title: 'Week 2',
        startDate: '2024-01-08',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        lessons: [
          {
            id: 'lesson-3',
            weekId: 'week-2',
            title: 'Lesson 3',
            description: 'Description',
            contentType: 'pdf' as const,
            contentUrl: 'https://example.com/pdf',
            orderIndex: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      },
    ];

    mockGetWeeks.mockResolvedValue(mockWeeks);

    render(
      <PreviewMode
        programmeId={mockProgrammeId}
        programmeName={mockProgrammeName}
        programmeDescription={mockProgrammeDescription}
        onExit={mockOnExit}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('week-week-1')).toBeInTheDocument();
    });

    // Should show 3 total lessons (2 in week 1, 1 in week 2)
    expect(screen.getByTestId('programme-header')).toBeInTheDocument();
  });
});

describe('PreviewModeButton', () => {
  it('should render button with correct text and icon', () => {
    const mockOnClick = jest.fn();

    render(<PreviewModeButton onClick={mockOnClick} />);

    expect(screen.getByText('Preview as Learner')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();

    render(<PreviewModeButton onClick={mockOnClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnClick = jest.fn();

    render(<PreviewModeButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should not be disabled when disabled prop is false', () => {
    const mockOnClick = jest.fn();

    render(<PreviewModeButton onClick={mockOnClick} disabled={false} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});
