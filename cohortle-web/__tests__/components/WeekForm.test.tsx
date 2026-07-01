/**
 * WeekForm Component Tests
 * Tests for week creation form with smart defaults
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekForm } from '@/components/convener/WeekForm';

describe('WeekForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const programmeId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Smart Defaults', () => {
    it('should suggest next sequential week number', () => {
      const suggestedWeekNumber = 3;
      
      render(
        <WeekForm
          programmeId={programmeId}
          suggestedWeekNumber={suggestedWeekNumber}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const weekNumberInput = screen.getByLabelText(/week number/i) as HTMLInputElement;
      expect(weekNumberInput.value).toBe('3');
    });

    it('should default to week 1 when no suggestion provided', () => {
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const weekNumberInput = screen.getByLabelText(/week number/i) as HTMLInputElement;
      expect(weekNumberInput.value).toBe('1');
    });

    it('should suggest start date 7 days after previous week', async () => {
      const previousWeekStartDate = '2024-01-01';
      const expectedDate = '2024-01-08'; // 7 days later
      
      render(
        <WeekForm
          programmeId={programmeId}
          previousWeekStartDate={previousWeekStartDate}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Wait for useEffect to set the value
      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
        expect(startDateInput.value).toBe(expectedDate);
      });
    });

    it('should handle month boundary correctly when calculating suggested date', async () => {
      const previousWeekStartDate = '2024-01-29';
      const expectedDate = '2024-02-05'; // 7 days later, crosses into February
      
      render(
        <WeekForm
          programmeId={programmeId}
          previousWeekStartDate={previousWeekStartDate}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
        expect(startDateInput.value).toBe(expectedDate);
      });
    });

    it('should handle year boundary correctly when calculating suggested date', async () => {
      const previousWeekStartDate = '2024-12-29';
      const expectedDate = '2025-01-05'; // 7 days later, crosses into new year
      
      render(
        <WeekForm
          programmeId={programmeId}
          previousWeekStartDate={previousWeekStartDate}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
        expect(startDateInput.value).toBe(expectedDate);
      });
    });

    it('should not auto-fill start date when no previous week exists', () => {
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      expect(startDateInput.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should require week number', async () => {
      const user = userEvent.setup();
      
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const weekNumberInput = screen.getByLabelText(/week number/i);
      await user.clear(weekNumberInput);
      
      const submitButton = screen.getByRole('button', { name: /create week/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/week number is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require title', async () => {
      const user = userEvent.setup();
      
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create week/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/week title is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require title to be between 3 and 200 characters', async () => {
      const user = userEvent.setup();
      
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/week title/i);
      await user.type(titleInput, 'ab'); // Too short
      
      const submitButton = screen.getByRole('button', { name: /create week/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/week title must be between 3 and 200 characters/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require start date', async () => {
      const user = userEvent.setup();
      
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/week title/i);
      await user.type(titleInput, 'Week 1: Introduction');
      
      const submitButton = screen.getByRole('button', { name: /create week/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <WeekForm
          programmeId={programmeId}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
