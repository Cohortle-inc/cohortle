// Example Property-Based Test
// This file demonstrates how to write property tests with fast-check

import * as fc from 'fast-check';

describe('Example Property-Based Tests', () => {
  // Example 1: Simple property test
  it('should demonstrate basic property testing', () => {
    // Property: Adding zero to any number returns the same number
    fc.assert(
      fc.property(
        fc.integer(), // Generate random integers
        (num) => {
          expect(num + 0).toBe(num);
        }
      ),
      { numRuns: 100 } // Run 100 random test cases
    );
  });

  // Example 2: Testing with multiple inputs
  it('should demonstrate multiple input property testing', () => {
    // Property: Addition is commutative (a + b = b + a)
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer(),
        (a, b) => {
          expect(a + b).toBe(b + a);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example 3: Testing with constrained values
  it('should demonstrate constrained value testing', () => {
    // Property: Numbers between 0-10 are always less than 11
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (num) => {
          expect(num).toBeLessThan(11);
          expect(num).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example 4: Testing with complex objects
  it('should demonstrate object property testing', () => {
    // Property: Objects with name and age should have valid types
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          age: fc.integer({ min: 0, max: 120 }),
        }),
        (person) => {
          expect(typeof person.name).toBe('string');
          expect(typeof person.age).toBe('number');
          expect(person.age).toBeGreaterThanOrEqual(0);
          expect(person.age).toBeLessThanOrEqual(120);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example 5: Testing with arrays
  it('should demonstrate array property testing', () => {
    // Property: Reversing an array twice returns the original array
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        (arr) => {
          const reversed = [...arr].reverse();
          const doubleReversed = [...reversed].reverse();
          expect(doubleReversed).toEqual(arr);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Example 6: Testing with conditional logic
  it('should demonstrate conditional property testing', () => {
    // Property: File size validation logic
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 * 1024 * 1024 }), // 0 to 20MB
        (fileSize) => {
          const maxSize = 10 * 1024 * 1024; // 10MB

          if (fileSize <= maxSize) {
            // Files <= 10MB should pass validation
            expect(fileSize).toBeLessThanOrEqual(maxSize);
          } else {
            // Files > 10MB should fail validation
            expect(fileSize).toBeGreaterThan(maxSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// This example file can be deleted after you understand property-based testing
// Run this test with: npm test -- example.pbt.ts
