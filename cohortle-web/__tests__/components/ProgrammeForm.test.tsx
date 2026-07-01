/**
 * Unit tests for ProgrammeForm component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgrammeForm } from '@/components/convener/ProgrammeForm';

describe('ProgrammeForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should display validation error for short programme name', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const submitButton = screen.getByText('Create Programme');

      // Enter short name (less than 3 characters)
      await user.type(nameInput, 'AB');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/must be between 3 and 200 characters/i)
        ).toBeInTheDocument();
      });

      // Verify onSubmit not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for long programme name', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const submitButton = screen.getByText('Create Programme');

      // Enter name longer than 200 characters
      const longName = 'A'.repeat(201);
      await user.type(nameInput, longName);
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/must be between 3 and 200 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for missing programme name', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('Create Programme');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/programme name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for missing start date', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const submitButton = screen.getByText('Create Programme');

      await user.type(nameInput, 'Test Programme');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for past start date', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      await user.type(nameInput, 'Test Programme');
      await user.type(startDateInput, '2020-01-01');
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/start date cannot be in the past/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should display validation error for long description', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByText('Create Programme');

      // Enter description longer than 1000 characters
      const longDescription = 'A'.repeat(1001);
      await user.type(descriptionInput, longDescription);
      await user.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(
          screen.getByText(/description must be 1000 characters or less/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const descriptionInput = screen.getByLabelText(/description/i);
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      // Fill in valid data
      await user.type(nameInput, 'Test Programme');
      await user.type(descriptionInput, 'Test Description');
      await user.type(startDateInput, '2026-12-31');

      await user.click(submitButton);

      // Verify onSubmit called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Programme',
          description: 'Test Description',
          startDate: '2026-12-31',
        });
      });
    });

    it('should submit form without optional description', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      // Fill in required fields only
      await user.type(nameInput, 'Test Programme');
      await user.type(startDateInput, '2026-12-31');

      await user.click(submitButton);

      // Verify onSubmit called
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Programme',
          description: '',
          startDate: '2026-12-31',
        });
      });
    });
  });
  describe('Error Handling', () => {
    it('should display API error message', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create programme';
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));

      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      // Fill in valid data
      await user.type(nameInput, 'Test Programme');
      await user.type(startDateInput, '2026-12-31');

      await user.click(submitButton);

      // Verify error message displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue('Unknown error');

      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      // Fill in valid data
      await user.type(nameInput, 'Test Programme');
      await user.type(startDateInput, '2026-12-31');

      await user.click(submitButton);

      // Verify generic error message displayed
      await waitFor(() => {
        expect(
          screen.getByText(/failed to save programme/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should pre-populate form with initial data', () => {
      const initialData = {
        name: 'Existing Programme',
        description: 'Existing Description',
        startDate: '2026-12-31',
      };

      render(
        <ProgrammeForm
          mode="edit"
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify fields are pre-populated
      expect(screen.getByLabelText('Programme Name')).toHaveValue(
        'Existing Programme'
      );
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Existing Description'
      );
      expect(screen.getByLabelText('Start Date')).toHaveValue('2026-12-31');

      // Verify button text is correct for edit mode
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable form inputs during submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <ProgrammeForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Programme Name');
      const startDateInput = screen.getByLabelText('Start Date') as HTMLInputElement;
      const submitButton = screen.getByText('Create Programme');

      // Fill in valid data
      await user.type(nameInput, 'Test Programme');
      await user.type(startDateInput, '2026-12-31');

      await user.click(submitButton);

      // Verify inputs are disabled during submission
      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(startDateInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });
  });
});
