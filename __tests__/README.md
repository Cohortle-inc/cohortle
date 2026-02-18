# Assignment Submission System Tests

This directory contains tests for the Assignment Submission System feature.

## Test Structure

```
__tests__/
├── setup.ts                          # Test configuration and mocks
├── assignments/                      # Assignment-related tests
│   ├── api/                         # API layer tests
│   │   ├── createAssignment.test.ts
│   │   ├── getAssignments.test.ts
│   │   └── ...
│   ├── hooks/                       # React Query hooks tests
│   │   ├── useAssignments.test.ts
│   │   └── useSubmissions.test.ts
│   └── components/                  # Component tests
│       ├── AssignmentCard.test.tsx
│       └── ...
├── submissions/                      # Submission-related tests
│   ├── api/
│   ├── hooks/
│   └── components/
└── utils/                           # Utility function tests
    ├── fileValidation.test.ts
    ├── fileValidation.pbt.ts       # Property-based test
    └── draftManager.test.ts
```

## Test Types

### Unit Tests
- Test specific examples and edge cases
- Verify error handling
- Test component rendering and interactions
- File naming: `*.test.ts` or `*.test.tsx`

### Property-Based Tests
- Verify universal properties across all inputs
- Use fast-check library for randomized testing
- Minimum 100 iterations per property
- File naming: `*.pbt.ts` or `*.pbt.tsx`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- fileValidation.test.ts

# Run property-based tests only
npm test -- *.pbt.ts

# Run with coverage
npm test -- --coverage
```

## Property-Based Testing

Property tests validate correctness properties defined in the design document. Each property test must:

1. Reference the property number from design.md
2. Run minimum 100 iterations
3. Use appropriate generators for test data
4. Include clear failure messages

Example:
```typescript
import fc from 'fast-check';

// Property 6: File Validation
// Validates: Requirements 3.1, 3.2, 3.3
describe('Property 6: File Validation', () => {
  it('should reject files with invalid extensions or size > 10MB', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          size: fc.integer(),
        }),
        (file) => {
          // Test logic here
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Test Coverage Goals

- Minimum 80% code coverage
- 100% coverage for critical paths (file validation, grading, submission)
- All 22 correctness properties must have passing tests

## Mocking Strategy

- AsyncStorage: Mocked for draft management tests
- API calls: Use MSW (Mock Service Worker) for API mocking
- File system: Mocked expo-file-system
- Navigation: Mocked expo-router

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# View test coverage report
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```
