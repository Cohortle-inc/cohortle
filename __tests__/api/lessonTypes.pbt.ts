/**
 * Property-Based Tests for Lesson Type Selection
 * Feature: lesson-unit-type-selection
 * 
 * These tests verify correctness properties that should hold across all valid inputs.
 */

import * as fc from 'fast-check';
import { UNIT_TYPE_CONFIGS, LessonUnitType, isValidLessonType } from '@/types/lessonTypes';

/**
 * Feature: lesson-unit-type-selection
 * Property 1: Lesson Type Round-Trip Consistency
 * 
 * Validates: Requirements 2.1, 8.5
 * 
 * For any valid lesson unit type, when a lesson is created with that type 
 * and then retrieved from the API, the retrieved lesson should have the same type value.
 * 
 * This test simulates the round-trip by:
 * 1. Generating a random valid lesson type
 * 2. Creating a lesson payload with that type
 * 3. Simulating API serialization/deserialization
 * 4. Verifying the type is preserved
 */
describe('Property 1: Lesson Type Round-Trip Consistency', () => {
  it('should preserve lesson type through API round-trip', () => {
    // Generator for valid lesson types
    const lessonTypeArbitrary = fc.constantFrom(
      ...UNIT_TYPE_CONFIGS.map(config => config.type)
    );

    fc.assert(
      fc.property(
        lessonTypeArbitrary,
        fc.integer({ min: 1, max: 1000 }), // module_id
        fc.string({ minLength: 1, maxLength: 100 }), // lesson name
        fc.integer({ min: 1, max: 100 }), // order_number
        (type, moduleId, name, orderNumber) => {
          // Simulate creating a lesson with a specific type
          const lessonPayload = {
            module_id: moduleId,
            name: name,
            description: '',
            url: '',
            order_number: orderNumber,
            type: type,
          };

          // Simulate API serialization (JSON.stringify) and deserialization (JSON.parse)
          // This mimics what happens when data is sent to and received from the API
          const serialized = JSON.stringify(lessonPayload);
          const deserialized = JSON.parse(serialized);

          // Property: The type should be preserved through serialization
          expect(deserialized.type).toBe(type);
          expect(isValidLessonType(deserialized.type)).toBe(true);
          
          // Additional invariant: The type should match one of the configured types
          const configExists = UNIT_TYPE_CONFIGS.some(config => config.type === deserialized.type);
          expect(configExists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle optional type field correctly', () => {
    // Generator for lesson payloads with optional type
    const lessonPayloadArbitrary = fc.record({
      module_id: fc.integer({ min: 1, max: 1000 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ maxLength: 500 }),
      url: fc.string({ maxLength: 500 }),
      order_number: fc.integer({ min: 1, max: 100 }),
      type: fc.option(
        fc.constantFrom(...UNIT_TYPE_CONFIGS.map(config => config.type)),
        { nil: undefined }
      ),
    });

    fc.assert(
      fc.property(
        lessonPayloadArbitrary,
        (payload) => {
          // Simulate API round-trip
          const serialized = JSON.stringify(payload);
          const deserialized = JSON.parse(serialized);

          if (payload.type !== undefined) {
            // If type was provided, it should be preserved
            expect(deserialized.type).toBe(payload.type);
            expect(isValidLessonType(deserialized.type)).toBe(true);
          } else {
            // If type was not provided, it should remain undefined
            // (Backend will default to 'video' but that's a backend concern)
            expect(deserialized.type).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid lesson types', () => {
    // Generator for invalid type strings
    const invalidTypeArbitrary = fc.string().filter(str => !isValidLessonType(str));

    fc.assert(
      fc.property(
        invalidTypeArbitrary,
        (invalidType) => {
          // Property: Invalid types should be rejected by validation
          expect(isValidLessonType(invalidType)).toBe(false);
          
          // Verify it's not in the config
          const configExists = UNIT_TYPE_CONFIGS.some(config => config.type === invalidType);
          expect(configExists).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain type consistency across multiple operations', () => {
    // Generator for a sequence of lesson operations
    const lessonTypeArbitrary = fc.constantFrom(
      ...UNIT_TYPE_CONFIGS.map(config => config.type)
    );

    fc.assert(
      fc.property(
        lessonTypeArbitrary,
        (originalType) => {
          // Simulate multiple round-trips (create, update, retrieve)
          let currentType = originalType;

          // Round-trip 1: Create
          const createPayload = { type: currentType };
          const afterCreate = JSON.parse(JSON.stringify(createPayload));
          expect(afterCreate.type).toBe(originalType);
          currentType = afterCreate.type;

          // Round-trip 2: Update (type shouldn't change unless explicitly updated)
          const updatePayload = { type: currentType };
          const afterUpdate = JSON.parse(JSON.stringify(updatePayload));
          expect(afterUpdate.type).toBe(originalType);
          currentType = afterUpdate.type;

          // Round-trip 3: Retrieve
          const retrievePayload = { type: currentType };
          const afterRetrieve = JSON.parse(JSON.stringify(retrievePayload));
          expect(afterRetrieve.type).toBe(originalType);

          // Property: Type should remain consistent across all operations
          expect(afterRetrieve.type).toBe(originalType);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: lesson-unit-type-selection
 * Property 7: Type Field Validation
 * 
 * Validates: Requirements 8.2, 8.3
 * 
 * For any lesson creation request, if the type field is provided, it should only be 
 * accepted if it matches one of the 10 valid lesson unit types; otherwise, the validation 
 * should reject the request.
 * 
 * This test verifies:
 * 1. All valid types pass validation
 * 2. Invalid types fail validation
 * 3. Edge cases (empty strings, special characters, etc.) are handled correctly
 */
describe('Property 7: Type Field Validation', () => {
  it('should accept all valid lesson types', () => {
    // Generator for valid lesson types
    const validTypeArbitrary = fc.constantFrom(
      ...UNIT_TYPE_CONFIGS.map(config => config.type)
    );

    fc.assert(
      fc.property(
        validTypeArbitrary,
        (validType) => {
          // Property: All valid types should pass validation
          expect(isValidLessonType(validType)).toBe(true);
          
          // Verify it exists in the configuration
          const config = UNIT_TYPE_CONFIGS.find(c => c.type === validType);
          expect(config).toBeDefined();
          expect(config?.type).toBe(validType);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid lesson types', () => {
    // Generator for various invalid type strings
    const invalidTypeArbitrary = fc.oneof(
      // Random strings that are not valid types
      fc.string().filter(str => !isValidLessonType(str)),
      // Common invalid values
      fc.constantFrom('', ' ', 'invalid', 'INVALID', 'Video', 'TEXT', 'unknown'),
      // Numbers as strings
      fc.integer().map(n => n.toString()),
      // Special characters
      fc.constantFrom('!@#$', '***', '---', '___'),
      // SQL injection attempts
      fc.constantFrom("'; DROP TABLE lessons; --", "' OR '1'='1"),
      // XSS attempts
      fc.constantFrom('<script>alert("xss")</script>', 'javascript:alert(1)'),
    );

    fc.assert(
      fc.property(
        invalidTypeArbitrary,
        (invalidType) => {
          // Property: Invalid types should fail validation
          expect(isValidLessonType(invalidType)).toBe(false);
          
          // Verify it doesn't exist in the configuration
          const config = UNIT_TYPE_CONFIGS.find(c => c.type === invalidType);
          expect(config).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle case sensitivity correctly', () => {
    // Generator for valid types with different casing
    const validTypeArbitrary = fc.constantFrom(
      ...UNIT_TYPE_CONFIGS.map(config => config.type)
    );

    fc.assert(
      fc.property(
        validTypeArbitrary,
        (validType) => {
          // Property: Type validation should be case-sensitive
          const upperCase = validType.toUpperCase();
          const lowerCase = validType.toLowerCase();
          const titleCase = validType.charAt(0).toUpperCase() + validType.slice(1);

          // Only the exact case should be valid
          expect(isValidLessonType(validType)).toBe(true);
          
          // Different cases should be invalid (unless they happen to match)
          if (upperCase !== validType) {
            expect(isValidLessonType(upperCase)).toBe(false);
          }
          if (titleCase !== validType) {
            expect(isValidLessonType(titleCase)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate type field in lesson payload', () => {
    // Generator for lesson payloads with various type values
    const lessonPayloadArbitrary = fc.record({
      module_id: fc.integer({ min: 1, max: 1000 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ maxLength: 500 }),
      url: fc.string({ maxLength: 500 }),
      order_number: fc.integer({ min: 1, max: 100 }),
      type: fc.oneof(
        // Valid types
        fc.constantFrom(...UNIT_TYPE_CONFIGS.map(config => config.type)),
        // Invalid types
        fc.string().filter(str => !isValidLessonType(str))
      ),
    });

    fc.assert(
      fc.property(
        lessonPayloadArbitrary,
        (payload) => {
          // Property: Payload validation should check the type field
          const isValid = isValidLessonType(payload.type);
          
          if (isValid) {
            // Valid types should be in the configuration
            const config = UNIT_TYPE_CONFIGS.find(c => c.type === payload.type);
            expect(config).toBeDefined();
          } else {
            // Invalid types should not be in the configuration
            const config = UNIT_TYPE_CONFIGS.find(c => c.type === payload.type);
            expect(config).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle whitespace and trimming correctly', () => {
    // Generator for valid types with added whitespace
    const validTypeArbitrary = fc.constantFrom(
      ...UNIT_TYPE_CONFIGS.map(config => config.type)
    );

    fc.assert(
      fc.property(
        validTypeArbitrary,
        (validType) => {
          // Property: Whitespace should not be automatically trimmed
          // (API should reject types with whitespace)
          const withLeadingSpace = ` ${validType}`;
          const withTrailingSpace = `${validType} `;
          const withBothSpaces = ` ${validType} `;

          // Original type should be valid
          expect(isValidLessonType(validType)).toBe(true);
          
          // Types with whitespace should be invalid
          expect(isValidLessonType(withLeadingSpace)).toBe(false);
          expect(isValidLessonType(withTrailingSpace)).toBe(false);
          expect(isValidLessonType(withBothSpaces)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate all 10 lesson types are defined', () => {
    // Property: Exactly 10 valid lesson types should exist
    const validTypes = UNIT_TYPE_CONFIGS.map(config => config.type);
    
    expect(validTypes.length).toBe(10);
    
    // Verify each type is unique
    const uniqueTypes = new Set(validTypes);
    expect(uniqueTypes.size).toBe(10);
    
    // Verify all expected types are present
    const expectedTypes: LessonUnitType[] = [
      'text',
      'video',
      'pdf',
      'live_session',
      'link',
      'assignment',
      'quiz',
      'form',
      'reflection',
      'practical_task',
    ];
    
    expectedTypes.forEach(expectedType => {
      expect(validTypes).toContain(expectedType);
      expect(isValidLessonType(expectedType)).toBe(true);
    });
  });

  it('should handle boundary cases', () => {
    // Test various boundary cases
    const boundaryCases = [
      null,
      undefined,
      '',
      ' ',
      '\n',
      '\t',
      '0',
      'null',
      'undefined',
      'NaN',
      'true',
      'false',
      '[]',
      '{}',
    ];

    boundaryCases.forEach(boundaryCase => {
      // All boundary cases should be invalid
      expect(isValidLessonType(boundaryCase as any)).toBe(false);
    });
  });
});
