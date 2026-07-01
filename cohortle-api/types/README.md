# TypeScript Type Definitions

This directory contains TypeScript interfaces and type definitions for the Cohortle API.

## Purpose

While the API is written in JavaScript, these TypeScript definitions provide:

1. **Type Safety**: Enable type checking in TypeScript-based services and tests
2. **Documentation**: Serve as clear documentation of data structures
3. **IDE Support**: Provide autocomplete and IntelliSense in modern editors
4. **Validation**: Define expected shapes for input and output data

## Usage

### In TypeScript Files

```typescript
import { Programme, Cohort, Week, Lesson, Enrollment } from '../types';

// Use interfaces for type annotations
function getProgramme(id: number): Promise<Programme> {
  // ...
}
```

### In JavaScript Files (with JSDoc)

```javascript
/**
 * @typedef {import('../types').Programme} Programme
 * @typedef {import('../types').CreateProgrammeInput} CreateProgrammeInput
 */

/**
 * Get programme by ID
 * @param {number} id - Programme ID
 * @returns {Promise<Programme>}
 */
async function getProgramme(id) {
  // ...
}
```

## Files

### wlimp.ts

Contains all type definitions for the WLIMP Programme Rollout feature:

- **Core Entities**: Programme, Cohort, Week, Lesson, Enrollment
- **Input Types**: CreateProgrammeInput, CreateCohortInput, etc.
- **Response Types**: EnrollmentResponse, ProgrammeMetadata, etc.
- **API Types**: WeekWithLessons, LessonDetail, ProgrammeCard, etc.

## Adding New Types

When adding new features:

1. Create a new file for the feature (e.g., `feature-name.ts`)
2. Define interfaces matching the database schema
3. Add input validation types
4. Add API response types
5. Export from `index.ts`

## Conventions

- Use PascalCase for interface names
- Use camelCase for property names (matching JavaScript conventions)
- Mark optional fields with `?` or `| null`
- Document complex types with JSDoc comments
- Keep types close to database schema for consistency
