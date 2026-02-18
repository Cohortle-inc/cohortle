/**
 * Assignment Form Validation Utilities
 * Extracted validation logic for easier testing
 */

export interface ValidationErrors {
  title?: string;
  instructions?: string;
  dueDate?: string;
}

export interface AssignmentFormData {
  title: string;
  instructions: string;
  dueDate: Date;
}

/**
 * Validates assignment form data
 * @param data - Form data to validate
 * @returns Object containing validation errors (empty if valid)
 */
export function validateAssignmentForm(data: AssignmentFormData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate title
  if (!data.title.trim()) {
    errors.title = 'Title is required';
  }

  // Validate instructions
  if (!data.instructions.trim()) {
    errors.instructions = 'Instructions are required';
  }

  // Validate due date (must be in the future)
  if (data.dueDate <= new Date()) {
    errors.dueDate = 'Due date must be in the future';
  }

  return errors;
}

/**
 * Checks if form data is valid
 * @param data - Form data to validate
 * @returns True if valid, false otherwise
 */
export function isValidAssignmentForm(data: AssignmentFormData): boolean {
  const errors = validateAssignmentForm(data);
  return Object.keys(errors).length === 0;
}

/**
 * Validates individual field
 * @param field - Field name
 * @param value - Field value
 * @returns Error message or empty string if valid
 */
export function validateField(field: keyof AssignmentFormData, value: any): string {
  switch (field) {
    case 'title':
      return typeof value === 'string' && !value.trim() ? 'Title is required' : '';
    
    case 'instructions':
      return typeof value === 'string' && !value.trim() ? 'Instructions are required' : '';
    
    case 'dueDate':
      return value instanceof Date && value <= new Date() ? 'Due date must be in the future' : '';
    
    default:
      return '';
  }
}
