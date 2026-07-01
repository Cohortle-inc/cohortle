/**
 * Form validation utilities
 * Provides validation functions for email, password, and required fields
 */

/**
 * Email validation regex pattern
 * Validates standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password length
 * @param password - Password string to validate
 * @returns true if password meets minimum length requirement, false otherwise
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Validates that a field is not empty
 * @param value - Value to validate
 * @returns true if value is not empty, false otherwise
 */
export function validateRequired(value: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return false;
}

/**
 * Validates multiple required fields
 * @param fields - Object with field names as keys and values to validate
 * @returns Object with field names as keys and boolean validation results
 */
export function validateRequiredFields(
  fields: Record<string, string>
): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    results[fieldName] = validateRequired(value);
  }
  
  return results;
}

/**
 * Gets validation error message for email
 * @param email - Email to validate
 * @returns Error message if invalid, empty string if valid
 */
export function getEmailError(email: string): string {
  if (!validateRequired(email)) {
    return 'Email is required';
  }
  
  if (!validateEmail(email)) {
    return 'Invalid email format';
  }
  
  return '';
}

/**
 * Gets validation error message for password
 * @param password - Password to validate
 * @returns Error message if invalid, empty string if valid
 */
export function getPasswordError(password: string): string {
  if (!validateRequired(password)) {
    return 'Password is required';
  }
  
  if (!validatePassword(password)) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  
  return '';
}

/**
 * Gets validation error message for required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message if invalid, empty string if valid
 */
export function getRequiredError(value: string, fieldName: string): string {
  if (!validateRequired(value)) {
    return `${fieldName} is required`;
  }
  
  return '';
}

/**
 * Validates all fields in a form and returns errors
 * @param fields - Object with field names and values
 * @param validators - Object with field names and validator functions
 * @returns Object with field names and error messages
 */
export function validateForm(
  fields: Record<string, string>,
  validators: Record<string, (value: string) => string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const error = validator(value);
      if (error) {
        errors[fieldName] = error;
      }
    }
  }
  
  return errors;
}

/**
 * Enrolment code validation regex pattern
 * Validates format: WORD-YEAR or WORD-YEAR-SUFFIX (e.g., WLIMP-2026 or PROG-2026-ABC123)
 * Word: 1+ alphanumeric characters
 * Year: 4 digits
 * Suffix: Optional alphanumeric characters
 */
const ENROLLMENT_CODE_REGEX = /^[A-Z0-9]+-\d{4}(-[A-Z0-9]+)?$/i;

/**
 * Validates enrolment code format
 * @param code - Enrolment code to validate
 * @returns true if code format is valid (WORD-YEAR), false otherwise
 */
export function validateEnrollmentCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  return ENROLLMENT_CODE_REGEX.test(code.trim().toUpperCase());
}

/**
 * Gets validation error message for enrolment code
 * @param code - Enrolment code to validate
 * @returns Error message if invalid, empty string if valid
 */
export function getEnrollmentCodeError(code: string): string {
  if (!validateRequired(code)) {
    return 'Enrolment code is required';
  }
  
  if (!validateEnrollmentCode(code)) {
    return 'Invalid code format. Use format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX (e.g., WLIMP-2026 or PROG-2026-ABC)';
  }
  
  return '';
}
