/**
 * Unit Tests for Assignment Form Validation Logic
 * Tests form validation without rendering components
 * Requirements: 1.1, 1.2, 1.4
 */

import {
  validateAssignmentForm,
  isValidAssignmentForm,
  validateField,
  AssignmentFormData,
} from '@/utils/assignmentFormValidation';

describe('Assignment Form Validation - Empty Fields', () => {
  it('should return error for empty title', () => {
    const formData: AssignmentFormData = {
      title: '',
      instructions: 'Valid instructions',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.title).toBe('Title is required');
    expect(errors.instructions).toBeUndefined();
    expect(errors.dueDate).toBeUndefined();
  });

  it('should return error for whitespace-only title', () => {
    const formData: AssignmentFormData = {
      title: '   ',
      instructions: 'Valid instructions',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.title).toBe('Title is required');
  });

  it('should return error for empty instructions', () => {
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.title).toBeUndefined();
    expect(errors.instructions).toBe('Instructions are required');
    expect(errors.dueDate).toBeUndefined();
  });

  it('should return error for whitespace-only instructions', () => {
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: '   ',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.instructions).toBe('Instructions are required');
  });

  it('should return multiple errors for multiple empty fields', () => {
    const formData: AssignmentFormData = {
      title: '',
      instructions: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.title).toBe('Title is required');
    expect(errors.instructions).toBe('Instructions are required');
    expect(errors.dueDate).toBeUndefined();
  });
});

describe('Assignment Form Validation - Past Due Dates', () => {
  it('should return error for past due date', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: 'Valid instructions',
      dueDate: pastDate,
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.dueDate).toBe('Due date must be in the future');
  });

  it('should return error for current time (not future)', () => {
    const now = new Date();
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: 'Valid instructions',
      dueDate: now,
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.dueDate).toBe('Due date must be in the future');
  });

  it('should accept future due date', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: 'Valid instructions',
      dueDate: futureDate,
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.dueDate).toBeUndefined();
  });
});

describe('Assignment Form Validation - Valid Forms', () => {
  it('should return no errors for valid form data', () => {
    const formData: AssignmentFormData = {
      title: 'Test Assignment',
      instructions: 'Complete the following tasks',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should return true for isValidAssignmentForm with valid data', () => {
    const formData: AssignmentFormData = {
      title: 'Test Assignment',
      instructions: 'Complete the following tasks',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    expect(isValidAssignmentForm(formData)).toBe(true);
  });

  it('should return false for isValidAssignmentForm with invalid data', () => {
    const formData: AssignmentFormData = {
      title: '',
      instructions: 'Valid instructions',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    expect(isValidAssignmentForm(formData)).toBe(false);
  });
});

describe('Assignment Form Validation - Individual Fields', () => {
  it('should validate title field', () => {
    expect(validateField('title', '')).toBe('Title is required');
    expect(validateField('title', '   ')).toBe('Title is required');
    expect(validateField('title', 'Valid Title')).toBe('');
  });

  it('should validate instructions field', () => {
    expect(validateField('instructions', '')).toBe('Instructions are required');
    expect(validateField('instructions', '   ')).toBe('Instructions are required');
    expect(validateField('instructions', 'Valid instructions')).toBe('');
  });

  it('should validate dueDate field', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    expect(validateField('dueDate', pastDate)).toBe('Due date must be in the future');
    expect(validateField('dueDate', futureDate)).toBe('');
  });
});

describe('Assignment Form Validation - Edge Cases', () => {
  it('should handle very long title', () => {
    const longTitle = 'A'.repeat(1000);
    const formData: AssignmentFormData = {
      title: longTitle,
      instructions: 'Valid instructions',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.title).toBeUndefined(); // No max length validation currently
  });

  it('should handle very long instructions', () => {
    const longInstructions = 'A'.repeat(10000);
    const formData: AssignmentFormData = {
      title: 'Valid Title',
      instructions: longInstructions,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(errors.instructions).toBeUndefined(); // No max length validation currently
  });

  it('should handle special characters in title and instructions', () => {
    const formData: AssignmentFormData = {
      title: 'Test <>&"\'',
      instructions: 'Instructions with special chars: <>&"\'',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const errors = validateAssignmentForm(formData);
    expect(Object.keys(errors).length).toBe(0);
  });
});
