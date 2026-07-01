/**
 * Unit tests for LessonReorderList component
 * Tests drag-and-drop reordering, button-based reordering, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LessonReorderList } from '@/components/convener/LessonReorderList';
import * as convenerApi from '@/lib/api/convener';

// Mock the convener API
jest.mock('@/lib/api/convener');

const mockLessons = [
  {
    id: '1',
    title: 'Lesson 1',
    description: 'First lesson',
    contentType: 'video',
    contentUrl: 'https://example.com/video1',
    orderIndex: 0,
  },
  {
    id: '2',
    title: 'Lesson 2',
    description: 'Second lesson',
    contentType: 'text',
    contentUrl: '',
    orderIndex: 1,
  },
  {
    id: '3',
    title: 'Lesson 3',
    description: 'Third lesson',
    contentType: 'pdf',
    contentUrl: 'https://example.com/doc.pdf',
    orderIndex: 2,
  },
];

describe('LessonReorderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all lessons in order', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      expect(screen.getByText('Lesson 2')).toBeInTheDocument();
      expect(screen.getByText('Lesson 3')).toBeInTheDocument();
    });

    it('should display lesson numbers correctly', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const lessonNumbers = screen.getAllByText(/^[1-3]$/);
      expect(lessonNumbers).toHaveLength(3);
      expect(lessonNumbers[0]).toHaveTextContent('1');
      expect(lessonNumbers[1]).toHaveTextContent('2');
      expect(lessonNumbers[2]).toHaveTextContent('3');
    });

    it('should display empty state when no lessons', () => {
      render(<LessonReorderList weekId="week-1" lessons={[]} />);

      expect(screen.getByText(/No lessons yet/i)).toBeInTheDocument();
    });

    it('should display lesson descriptions when available', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      expect(screen.getByText('First lesson')).toBeInTheDocument();
      expect(screen.getByText('Second lesson')).toBeInTheDocument();
    });

    it('should display content type badges', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      expect(screen.getByText('video')).toBeInTheDocument();
      expect(screen.getByText('text')).toBeInTheDocument();
      expect(screen.getByText('pdf')).toBeInTheDocument();
    });
  });

  describe('Button-based reordering', () => {
    it('should move lesson up when up button is clicked', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockResolvedValue([
        { ...mockLessons[1], orderIndex: 0 },
        { ...mockLessons[0], orderIndex: 1 },
        { ...mockLessons[2], orderIndex: 2 },
      ]);

      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      // Find the up button for the second lesson
      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(mockReorderLessons).toHaveBeenCalledWith('week-1', ['2', '1', '3']);
      });
    });

    it('should move lesson down when down button is clicked', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockResolvedValue([
        { ...mockLessons[1], orderIndex: 0 },
        { ...mockLessons[0], orderIndex: 1 },
        { ...mockLessons[2], orderIndex: 2 },
      ]);

      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      // Find the down button for the first lesson
      const downButtons = screen.getAllByLabelText('Move lesson down');
      fireEvent.click(downButtons[0]);

      await waitFor(() => {
        expect(mockReorderLessons).toHaveBeenCalledWith('week-1', ['2', '1', '3']);
      });
    });

    it('should disable up button for first lesson', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const upButtons = screen.getAllByLabelText('Move lesson up');
      expect(upButtons[0]).toBeDisabled();
      expect(upButtons[1]).not.toBeDisabled();
    });

    it('should disable down button for last lesson', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const downButtons = screen.getAllByLabelText('Move lesson down');
      expect(downButtons[2]).toBeDisabled();
      expect(downButtons[0]).not.toBeDisabled();
    });

    it('should show loading state during reordering', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLessons), 100))
      );

      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Updating lesson order/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when reordering fails', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockRejectedValue(new Error('Network error'));

      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should rollback to original order on error', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockRejectedValue(new Error('Failed to reorder'));

      const { container } = render(
        <LessonReorderList weekId="week-1" lessons={mockLessons} />
      );

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Failed to reorder/i)).toBeInTheDocument();
      });

      // Verify lessons are in original order
      const lessonTitles = container.querySelectorAll('h3');
      expect(lessonTitles[0]).toHaveTextContent('Lesson 1');
      expect(lessonTitles[1]).toHaveTextContent('Lesson 2');
      expect(lessonTitles[2]).toHaveTextContent('Lesson 3');
    });

    it('should allow dismissing error message', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockRejectedValue(new Error('Network error'));

      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByText('Dismiss');
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call onReorderSuccess when reordering succeeds', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      const reorderedLessons = [
        { ...mockLessons[1], orderIndex: 0 },
        { ...mockLessons[0], orderIndex: 1 },
        { ...mockLessons[2], orderIndex: 2 },
      ];
      mockReorderLessons.mockResolvedValue(reorderedLessons);

      const onReorderSuccess = jest.fn();
      render(
        <LessonReorderList
          weekId="week-1"
          lessons={mockLessons}
          onReorderSuccess={onReorderSuccess}
        />
      );

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        expect(onReorderSuccess).toHaveBeenCalledWith(reorderedLessons);
      });
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = jest.fn();
      render(
        <LessonReorderList
          weekId="week-1"
          lessons={mockLessons}
          onEdit={onEdit}
        />
      );

      const editButtons = screen.getAllByLabelText('Edit lesson');
      fireEvent.click(editButtons[0]);

      expect(onEdit).toHaveBeenCalledWith('1');
    });

    it('should call onDelete when delete button is clicked', () => {
      const onDelete = jest.fn();
      render(
        <LessonReorderList
          weekId="week-1"
          lessons={mockLessons}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByLabelText('Delete lesson');
      fireEvent.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('should not render edit/delete buttons when callbacks not provided', () => {
      render(<LessonReorderList weekId="week-1" lessons={mockLessons} />);

      expect(screen.queryByLabelText('Edit lesson')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Delete lesson')).not.toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('should make lessons draggable', () => {
      const { container } = render(
        <LessonReorderList weekId="week-1" lessons={mockLessons} />
      );

      const draggableElements = container.querySelectorAll('[draggable="true"]');
      expect(draggableElements).toHaveLength(3);
    });

    it('should disable dragging during reordering', async () => {
      const mockReorderLessons = jest.spyOn(convenerApi, 'reorderLessons');
      mockReorderLessons.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLessons), 100))
      );

      const { container } = render(
        <LessonReorderList weekId="week-1" lessons={mockLessons} />
      );

      const upButtons = screen.getAllByLabelText('Move lesson up');
      fireEvent.click(upButtons[1]);

      await waitFor(() => {
        const draggableElements = container.querySelectorAll('[draggable="false"]');
        expect(draggableElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(
        <LessonReorderList
          weekId="week-1"
          lessons={mockLessons}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getAllByLabelText('Move lesson up')).toHaveLength(3);
      expect(screen.getAllByLabelText('Move lesson down')).toHaveLength(3);
      expect(screen.getAllByLabelText('Edit lesson')).toHaveLength(3);
      expect(screen.getAllByLabelText('Delete lesson')).toHaveLength(3);
    });

    it('should have proper title attributes for drag handles', () => {
      const { container } = render(
        <LessonReorderList weekId="week-1" lessons={mockLessons} />
      );

      const dragHandles = container.querySelectorAll('[title="Drag to reorder"]');
      expect(dragHandles).toHaveLength(3);
    });
  });
});
