# Testing Setup Guide

## Installation

The `fast-check` library has been added to `package.json`. To install it, run:

```bash
npm install
```

This will install:
- `fast-check@^3.15.0` - Property-based testing library
- All other dev dependencies

## Verify Installation

After installation, verify fast-check is installed:

```bash
npm list fast-check
```

You should see:
```
cohortle@1.0.0
└── fast-check@3.15.0
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests without watch mode (for CI)
npm test -- --watchAll=false

# Run specific test file
npm test -- fileValidation.test.ts

# Run property-based tests only
npm test -- *.pbt.ts

# Run with coverage
npm test -- --coverage
```

## Example Property-Based Test

Here's a simple example of a property-based test using fast-check:

```typescript
import fc from 'fast-check';
import { validateFileSize } from '@/utils/fileValidation';

describe('Property Test Example', () => {
  it('should validate file sizes correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 * 1024 * 1024 }), // 0 to 20MB
        (fileSize) => {
          const result = validateFileSize(fileSize);
          
          if (fileSize <= 10 * 1024 * 1024) {
            // Files <= 10MB should be valid
            expect(result.valid).toBe(true);
          } else {
            // Files > 10MB should be invalid
            expect(result.valid).toBe(false);
            expect(result.error).toContain('exceeds 10MB limit');
          }
        }
      ),
      { numRuns: 100 } // Run 100 random test cases
    );
  });
});
```

## Property-Based Testing Best Practices

1. **Use appropriate generators**: Choose fc generators that match your data types
2. **Set numRuns**: Always specify `{ numRuns: 100 }` or higher
3. **Test properties, not examples**: Focus on universal truths
4. **Clear assertions**: Make it obvious what property is being tested
5. **Document properties**: Reference the design document property number

## Common fast-check Generators

```typescript
// Primitives
fc.integer()              // Random integers
fc.string()               // Random strings
fc.boolean()              // Random booleans
fc.float()                // Random floats

// Constrained
fc.integer({ min: 0, max: 100 })
fc.string({ minLength: 1, maxLength: 50 })
fc.constantFrom('passed', 'failed')  // Pick from values

// Complex types
fc.array(fc.integer())    // Array of integers
fc.record({               // Object with specific shape
  name: fc.string(),
  age: fc.integer()
})

// Custom generators
const fileGenerator = fc.record({
  uri: fc.string(),
  name: fc.string(),
  type: fc.constantFrom('image/png', 'application/pdf'),
  size: fc.integer({ min: 0, max: 20 * 1024 * 1024 })
});
```

## Troubleshooting

### Test timeout errors
If property tests timeout, increase the Jest timeout:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Shrinking failures
When a property test fails, fast-check will "shrink" to find the minimal failing case. This helps identify the exact boundary condition that fails.

### Debugging property tests
Add `.verbose()` to see all generated values:
```typescript
fc.assert(
  fc.property(...).verbose(),
  { numRuns: 100 }
);
```

## Next Steps

1. Run `npm install` to install fast-check
2. Review the example tests in `__tests__/`
3. Start implementing property tests for Task 2
4. Refer to [fast-check documentation](https://github.com/dubzzz/fast-check) for more generators

## Resources

- [fast-check GitHub](https://github.com/dubzzz/fast-check)
- [fast-check Documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
