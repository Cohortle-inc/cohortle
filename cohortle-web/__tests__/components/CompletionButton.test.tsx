/**
 * Unit Tests for CompletionButton Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompletionButton } from '@/components/lessons/CompletionButton';
import * as lessonApi from '@/lib/api/lessons';

// Mock the API
jest.mock('@/lib/api/lessons');

// Create a wrapper with QueryClient for testing
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }, // Disable automatic retries for testing
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('CompletionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button rendering when not completed', () => {
    it('should render "Mark as Complete" button when not completed', () => {
      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('Mark as Complete')).toBeInTheDocument();
    });

    it('should render button as clickable element', () => {
      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.disabled).toBe(false);
    });
  });

  describe('Indicator rendering when completed', () => {
    it('should render "Completed" indicator when completed', () => {
      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={true}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should not render button when completed', () => {
      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={true}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      expect(button).toBeNull();
    });

    it('should display checkmark icon when completed', () => {
      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={true}
        />,
        { wrapper: Wrapper }
      );

      // Phosphor CheckCircle renders an SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('Button click triggers API call', () => {
    it('should call markLessonComplete when button is clicked', async () => {
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="123" 
          cohortId="456" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockMarkComplete).toHaveBeenCalledWith('123', '456');
      });
    });
  });

  describe('Loading state display', () => {
    it('should show loading state during API call', async () => {
      const mockMarkComplete = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText(/Marking as Complete/i)).toBeInTheDocument();
      });
    });

    it('should disable button during API call', async () => {
      const mockMarkComplete = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      if (button) {
        fireEvent.click(button);
      }

      await waitFor(() => {
        expect(button?.disabled).toBe(true);
      });
    });
  });

  describe('onComplete callback invocation', () => {
    it('should call onComplete callback on success', async () => {
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const onComplete = jest.fn();
      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          onComplete={onComplete}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling and retry', () => {
    it('should display user-friendly error for 401 unauthorized', async () => {
      const mockMarkComplete = jest.fn().mockRejectedValue({
        response: { status: 401 }
      });
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
      });
    });

    it('should display user-friendly error for 404 not found', async () => {
      const mockMarkComplete = jest.fn().mockRejectedValue({
        response: { status: 404 }
      });
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success state animation', () => {
    it('should show success message briefly after completion', async () => {
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Lesson Completed!')).toBeInTheDocument();
      });
    });

    it('should transition to regular completed state after animation', async () => {
      jest.useFakeTimers();
      
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
        />,
        { wrapper: Wrapper }
      );

      const button = screen.getByText('Mark as Complete');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Lesson Completed!')).toBeInTheDocument();
      });

      // Fast-forward time and wait for state update
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText('Lesson Completed!')).not.toBeInTheDocument();
      }, { timeout: 100 });

      jest.useRealTimers();
    });
  });

  describe('Preview mode restrictions', () => {
    it('should disable button in preview mode', () => {
      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          previewMode={true}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.disabled).toBe(true);
    });

    it('should show preview mode message when disabled', () => {
      const Wrapper = createWrapper();
      
      render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          previewMode={true}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText(/Completion actions are disabled in preview mode/i)).toBeInTheDocument();
    });

    it('should not call API when clicked in preview mode', async () => {
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;

      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          previewMode={true}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      if (button) {
        // Try to click (should be disabled but test anyway)
        fireEvent.click(button);
      }

      // Wait a bit to ensure no API call is made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockMarkComplete).not.toHaveBeenCalled();
    });

    it('should apply different styling in preview mode', () => {
      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          previewMode={true}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-gray-400');
      expect(button?.className).toContain('cursor-not-allowed');
    });

    it('should not call onComplete callback in preview mode', async () => {
      const mockMarkComplete = jest.fn().mockResolvedValue(undefined);
      (lessonApi.markLessonComplete as jest.Mock) = mockMarkComplete;
      const onComplete = jest.fn();

      const Wrapper = createWrapper();
      
      const { container } = render(
        <CompletionButton 
          lessonId="1" 
          cohortId="1" 
          isCompleted={false}
          previewMode={true}
          onComplete={onComplete}
        />,
        { wrapper: Wrapper }
      );

      const button = container.querySelector('button');
      if (button) {
        fireEvent.click(button);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});