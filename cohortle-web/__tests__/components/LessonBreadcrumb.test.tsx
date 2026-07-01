/**
 * Unit tests for LessonBreadcrumb component
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonBreadcrumb } from '@/components/lessons/LessonBreadcrumb';
import * as apiClient from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('LessonBreadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display breadcrumb with Dashboard > Programme > Lesson', async () => {
    const mockModuleData = {
      id: 1,
      name: 'Module 1',
      programme_id: 10,
    };

    const mockProgrammeData = {
      id: 10,
      name: 'Test Programme',
    };

    (apiClient.default.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/modules/')) {
        return Promise.resolve({ data: mockModuleData });
      }
      if (url.includes('/api/programmes/')) {
        return Promise.resolve({ data: mockProgrammeData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <LessonBreadcrumb
        lessonId="1"
        lessonName="Introduction to Testing"
        moduleId="1"
        cohortId="5"
      />,
      { wrapper: createWrapper() }
    );

    // Wait for breadcrumb to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Programme')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
  });

  it('should display breadcrumb with Dashboard > Programme > Week > Lesson', async () => {
    const mockModuleData = {
      id: 1,
      name: 'Module 1',
      programme_id: 10,
      week_id: 3,
    };

    const mockProgrammeData = {
      id: 10,
      name: 'Test Programme',
    };

    const mockWeekData = {
      id: 3,
      name: 'Week 1',
    };

    (apiClient.default.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/modules/')) {
        return Promise.resolve({ data: mockModuleData });
      }
      if (url.includes('/api/programmes/')) {
        return Promise.resolve({ data: mockProgrammeData });
      }
      if (url.includes('/api/weeks/')) {
        return Promise.resolve({ data: mockWeekData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <LessonBreadcrumb
        lessonId="1"
        lessonName="Introduction to Testing"
        moduleId="1"
        cohortId="5"
      />,
      { wrapper: createWrapper() }
    );

    // Wait for breadcrumb to load
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Programme')).toBeInTheDocument();
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
  });

  it('should have correct navigation links', async () => {
    const mockModuleData = {
      id: 1,
      name: 'Module 1',
      programme_id: 10,
    };

    const mockProgrammeData = {
      id: 10,
      name: 'Test Programme',
    };

    (apiClient.default.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/modules/')) {
        return Promise.resolve({ data: mockModuleData });
      }
      if (url.includes('/api/programmes/')) {
        return Promise.resolve({ data: mockProgrammeData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <LessonBreadcrumb
        lessonId="1"
        lessonName="Introduction to Testing"
        moduleId="1"
        cohortId="5"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test Programme')).toBeInTheDocument();
    }, { timeout: 3000 });

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const programmeLink = screen.getByText('Test Programme').closest('a');
    expect(programmeLink).toHaveAttribute('href', '/programmes/10');
  });

  it('should display current lesson as non-clickable text', async () => {
    const mockModuleData = {
      id: 1,
      name: 'Module 1',
      programme_id: 10,
    };

    const mockProgrammeData = {
      id: 10,
      name: 'Test Programme',
    };

    (apiClient.default.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/modules/')) {
        return Promise.resolve({ data: mockModuleData });
      }
      if (url.includes('/api/programmes/')) {
        return Promise.resolve({ data: mockProgrammeData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <LessonBreadcrumb
        lessonId="1"
        lessonName="Introduction to Testing"
        moduleId="1"
        cohortId="5"
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
    });

    const lessonElement = screen.getByText('Introduction to Testing');
    expect(lessonElement.tagName).toBe('SPAN');
    expect(lessonElement).toHaveClass('font-medium');
  });
});
