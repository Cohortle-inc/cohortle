# Usage Examples for WLIMP Types

This document provides examples of how to use the WLIMP TypeScript interfaces in your code.

## In Services (JavaScript with JSDoc)

### EnrollmentService Example

```javascript
/**
 * @typedef {import('../types').Enrollment} Enrollment
 * @typedef {import('../types').Cohort} Cohort
 * @typedef {import('../types').EnrollmentInput} EnrollmentInput
 * @typedef {import('../types').EnrollmentResponse} EnrollmentResponse
 */

class EnrollmentService {
  /**
   * Validate enrollment code and get cohort
   * @param {string} code - Enrollment code
   * @returns {Promise<Cohort>}
   */
  async validateCode(code) {
    // Implementation
  }

  /**
   * Check if user is already enrolled
   * @param {number} userId - User ID
   * @param {number} cohortId - Cohort ID
   * @returns {Promise<boolean>}
   */
  async checkExistingEnrollment(userId, cohortId) {
    // Implementation
  }

  /**
   * Enroll learner in cohort
   * @param {number} userId - User ID
   * @param {number} cohortId - Cohort ID
   * @returns {Promise<Enrollment>}
   */
  async enrollLearner(userId, cohortId) {
    // Implementation
  }
}
```

### ProgrammeService Example

```javascript
/**
 * @typedef {import('../types').Programme} Programme
 * @typedef {import('../types').ProgrammeMetadata} ProgrammeMetadata
 * @typedef {import('../types').Week} Week
 */

class ProgrammeService {
  /**
   * Get programme by ID
   * @param {number} id - Programme ID
   * @returns {Promise<Programme>}
   */
  async getProgrammeById(id) {
    // Implementation
  }

  /**
   * Calculate current week number
   * @param {number} programmeId - Programme ID
   * @returns {Promise<number>}
   */
  async getCurrentWeek(programmeId) {
    // Implementation
  }

  /**
   * Get programme weeks with filtering
   * @param {number} programmeId - Programme ID
   * @returns {Promise<Week[]>}
   */
  async getProgrammeWeeks(programmeId) {
    // Implementation
  }
}
```

### ContentService Example

```javascript
/**
 * @typedef {import('../types').Week} Week
 * @typedef {import('../types').Lesson} Lesson
 * @typedef {import('../types').CreateWeekInput} CreateWeekInput
 * @typedef {import('../types').CreateLessonInput} CreateLessonInput
 * @typedef {import('../types').UpdateLessonInput} UpdateLessonInput
 */

class ContentService {
  /**
   * Get lessons for a week
   * @param {string} weekId - Week UUID
   * @returns {Promise<Lesson[]>}
   */
  async getWeekLessons(weekId) {
    // Implementation
  }

  /**
   * Get lesson by ID
   * @param {string} id - Lesson UUID
   * @returns {Promise<Lesson>}
   */
  async getLessonById(id) {
    // Implementation
  }

  /**
   * Create a new week
   * @param {number} programmeId - Programme ID
   * @param {CreateWeekInput} weekData - Week data
   * @returns {Promise<Week>}
   */
  async createWeek(programmeId, weekData) {
    // Implementation
  }

  /**
   * Create a new lesson
   * @param {string} weekId - Week UUID
   * @param {CreateLessonInput} lessonData - Lesson data
   * @returns {Promise<Lesson>}
   */
  async createLesson(weekId, lessonData) {
    // Implementation
  }

  /**
   * Update lesson order
   * @param {string} weekId - Week UUID
   * @param {string[]} lessonIds - Array of lesson UUIDs in new order
   * @returns {Promise<void>}
   */
  async updateLessonOrder(weekId, lessonIds) {
    // Implementation
  }
}
```

## In Routes (JavaScript with JSDoc)

### Enrollment Endpoint

```javascript
const express = require('express');
const router = express.Router();
const { validateEnrollmentInput } = require('../types/validators');

/**
 * @typedef {import('../types').EnrollmentInput} EnrollmentInput
 * @typedef {import('../types').EnrollmentResponse} EnrollmentResponse
 * @typedef {import('../types').ErrorResponse} ErrorResponse
 */

/**
 * POST /api/v1/programmes/enroll
 * Enroll in a programme using enrollment code
 */
router.post('/enroll', async (req, res) => {
  /** @type {EnrollmentInput} */
  const input = req.body;

  // Validate input
  const errors = validateEnrollmentInput(input);
  if (errors.length > 0) {
    /** @type {ErrorResponse} */
    const response = {
      success: false,
      error: 'Validation failed',
      validation_errors: errors,
    };
    return res.status(400).json(response);
  }

  try {
    // Process enrollment
    const result = await enrollmentService.enroll(req.user.id, input.code);

    /** @type {EnrollmentResponse} */
    const response = {
      success: true,
      programme_id: result.programme_id,
      programme_name: result.programme_name,
      cohort_id: result.cohort_id,
    };

    res.json(response);
  } catch (error) {
    /** @type {ErrorResponse} */
    const response = {
      success: false,
      error: error.message,
    };
    res.status(500).json(response);
  }
});
```

### Programme Weeks Endpoint

```javascript
/**
 * @typedef {import('../types').WeekWithLessons} WeekWithLessons
 */

/**
 * GET /api/v1/programmes/:id/weeks
 * Get weeks and lessons for a programme
 */
router.get('/:id/weeks', async (req, res) => {
  try {
    const programmeId = parseInt(req.params.id);
    
    /** @type {WeekWithLessons[]} */
    const weeks = await programmeService.getProgrammeWeeks(programmeId);

    res.json({ weeks });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

## In TypeScript Files

If you're writing TypeScript code, you can import and use the types directly:

```typescript
import {
  Programme,
  Cohort,
  Week,
  Lesson,
  Enrollment,
  CreateLessonInput,
  validateCreateLessonInput,
} from '../types';

class ContentService {
  async createLesson(weekId: string, lessonData: CreateLessonInput): Promise<Lesson> {
    // Validate input
    const errors = validateCreateLessonInput(lessonData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Create lesson
    const lesson = await db.lessons.create({
      id: generateUUID(),
      week_id: weekId,
      ...lessonData,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return lesson;
  }

  async getWeekLessons(weekId: string): Promise<Lesson[]> {
    const lessons = await db.lessons.findAll({
      where: { week_id: weekId },
      order: [['order_index', 'ASC']],
    });

    return lessons;
  }
}
```

## Validation Examples

### Using Validators in Middleware

```javascript
const { validateCreateLessonInput } = require('../types/validators');

function validateLessonMiddleware(req, res, next) {
  const errors = validateCreateLessonInput(req.body);
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      validation_errors: errors,
    });
  }
  
  next();
}

router.post('/lessons', validateLessonMiddleware, async (req, res) => {
  // Request body is validated
  const lesson = await contentService.createLesson(req.body.week_id, req.body);
  res.json(lesson);
});
```

### Manual Validation

```javascript
const { isValidEnrollmentCode, isValidContentType } = require('../types/validators');

// Validate enrollment code
if (!isValidEnrollmentCode('WLIMP-2026')) {
  console.error('Invalid enrollment code format');
}

// Validate content type
if (!isValidContentType('video')) {
  console.error('Invalid content type');
}
```

## Benefits

1. **Type Safety**: Catch type errors early with IDE support
2. **Documentation**: Clear contracts for function inputs/outputs
3. **Autocomplete**: Better developer experience with IntelliSense
4. **Validation**: Runtime validation with type-safe validators
5. **Consistency**: Shared types across services and routes
