/**
 * Tests for case transformation utilities
 */

import { snakeToCamel, camelToSnake, toCamelCase, toSnakeCase } from '../caseTransform';

describe('caseTransform', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
      expect(snakeToCamel('start_date')).toBe('startDate');
      expect(snakeToCamel('enrollment_code')).toBe('enrollmentCode');
      expect(snakeToCamel('created_at')).toBe('createdAt');
    });

    it('should handle strings without underscores', () => {
      expect(snakeToCamel('hello')).toBe('hello');
      expect(snakeToCamel('name')).toBe('name');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
      expect(camelToSnake('startDate')).toBe('start_date');
      expect(camelToSnake('enrollmentCode')).toBe('enrollment_code');
      expect(camelToSnake('createdAt')).toBe('created_at');
    });

    it('should handle strings without capitals', () => {
      expect(camelToSnake('hello')).toBe('hello');
      expect(camelToSnake('name')).toBe('name');
    });
  });

  describe('toCamelCase', () => {
    it('should transform object keys from snake_case to camelCase', () => {
      const input = {
        start_date: '2024-01-01',
        enrollment_code: 'PROG-2024-ABC123',
        created_at: '2024-01-01T00:00:00Z',
      };

      const expected = {
        startDate: '2024-01-01',
        enrollmentCode: 'PROG-2024-ABC123',
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = {
        programme_id: 1,
        cohort_data: {
          enrollment_code: 'TEST',
          start_date: '2024-01-01',
        },
      };

      const expected = {
        programmeId: 1,
        cohortData: {
          enrollmentCode: 'TEST',
          startDate: '2024-01-01',
        },
      };

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = [
        { start_date: '2024-01-01', enrollment_code: 'CODE1' },
        { start_date: '2024-01-02', enrollment_code: 'CODE2' },
      ];

      const expected = [
        { startDate: '2024-01-01', enrollmentCode: 'CODE1' },
        { startDate: '2024-01-02', enrollmentCode: 'CODE2' },
      ];

      expect(toCamelCase(input)).toEqual(expected);
    });

    it('should handle null and undefined', () => {
      expect(toCamelCase(null)).toBeNull();
      expect(toCamelCase(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(toCamelCase('string')).toBe('string');
      expect(toCamelCase(123)).toBe(123);
      expect(toCamelCase(true)).toBe(true);
    });
  });

  describe('toSnakeCase', () => {
    it('should transform object keys from camelCase to snake_case', () => {
      const input = {
        startDate: '2024-01-01',
        enrollmentCode: 'PROG-2024-ABC123',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const expected = {
        start_date: '2024-01-01',
        enrollment_code: 'PROG-2024-ABC123',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(toSnakeCase(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = {
        programmeId: 1,
        cohortData: {
          enrollmentCode: 'TEST',
          startDate: '2024-01-01',
        },
      };

      const expected = {
        programme_id: 1,
        cohort_data: {
          enrollment_code: 'TEST',
          start_date: '2024-01-01',
        },
      };

      expect(toSnakeCase(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = [
        { startDate: '2024-01-01', enrollmentCode: 'CODE1' },
        { startDate: '2024-01-02', enrollmentCode: 'CODE2' },
      ];

      const expected = [
        { start_date: '2024-01-01', enrollment_code: 'CODE1' },
        { start_date: '2024-01-02', enrollment_code: 'CODE2' },
      ];

      expect(toSnakeCase(input)).toEqual(expected);
    });

    it('should handle null and undefined', () => {
      expect(toSnakeCase(null)).toBeNull();
      expect(toSnakeCase(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(toSnakeCase('string')).toBe('string');
      expect(toSnakeCase(123)).toBe(123);
      expect(toSnakeCase(true)).toBe(true);
    });
  });

  describe('round-trip transformation', () => {
    it('should maintain data integrity through round-trip transformation', () => {
      const original = {
        startDate: '2024-01-01',
        enrollmentCode: 'PROG-2024-ABC123',
        weekNumber: 1,
        contentType: 'video',
        contentUrl: 'https://example.com',
        orderIndex: 0,
      };

      // Transform to snake_case and back to camelCase
      const snakeCase = toSnakeCase(original);
      const backToCamel = toCamelCase(snakeCase);

      expect(backToCamel).toEqual(original);
    });
  });
});
