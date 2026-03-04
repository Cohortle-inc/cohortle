# Request Payload Validation Enhancement - Design

## Architecture Overview

### Validation Flow
```
Frontend Form → Frontend Validation → API Request → Backend Validation → Service Layer → Database
     ↓                                                      ↓
  User Feedback                                    Error Response (400)
```

### Key Principles
1. **Defense in Depth**: Validate at both frontend and backend
2. **Fail Fast**: Validate early to provide immediate feedback
3. **Single Source of Truth**: Validation rules defined once, reused everywhere
4. **Clear Communication**: User-friendly error messages with actionable guidance

## Component Design

### 1. Backend Validation Enhancement

#### 1.1 Enhanced ValidationService (cohortle-api/services/ValidationService.js)

**Current State:**
- Uses node-input-validator with basic rules
- Inconsistent validation patterns across routes
- Limited custom validation rules

**Proposed Enhancements:**

```javascript
// Add custom validation rules
extend("programmeId", async ({ value }, validator) => {
  // Validate programme exists and user has access
  const sdk = new BackendSDK();
  sdk.setTable("programmes");
  const programme = await sdk.get({ id: value });
  return programme && programme.length > 0;
});

extend("weekId", async ({ value }, validator) => {
  // Validate week exists (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) return false;
  
  const db = require('../models');
  const week = await db.weeks.findByPk(value);
  return week !== null;
});

extend("enrollmentCodeFormat", ({ value }) => {
  const pattern = /^[A-Z0-9]+-\d{4}$/i;
  return pattern.test(value);
});

extend("dateNotPast", ({ value }) => {
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
});

extend("dateAfter", ({ value, args }) => {
  const inputDate = new Date(value);
  const compareDate = new Date(args[0]);
  return inputDate > compareDate;
});

extend("uniqueEnrollmentCode", async ({ value }) => {
  const sdk = new BackendSDK();
  sdk.setTable("cohorts");
  const existing = await sdk.get({ enrollment_code: value });
  return existing.length === 0;
});
```

**Validation Schemas:**

```javascript
// Programme validation schema
const PROGRAMME_VALIDATION = {
  name: "required|string|minLength:3|maxLength:255",
  description: "string|maxLength:1000",
  start_date: "required|date|dateNotPast"
};

// Cohort validation schema
const COHORT_VALIDATION = {
  programme_id: "required|integer|programmeId",
  name: "required|string|minLength:3|maxLength:200",
  enrollment_code: "required|string|enrollmentCodeFormat|uniqueEnrollmentCode",
  start_date: "required|date|dateNotPast",
  end_date: "date|dateAfter:start_date"
};

// Week validation schema
const WEEK_VALIDATION = {
  programme_id: "required|integer|programmeId",
  week_number: "required|integer|min:1",
  title: "required|string|minLength:3|maxLength:200",
  start_date: "required|date"
};

// Lesson validation schema
const LESSON_VALIDATION = {
  week_id: "required|string|weekId",
  title: "required|string|minLength:3|maxLength:255",
  description: "string|maxLength:1000",
  content_type: "required|in:video,link,pdf,text",
  content_url: "requiredIf:content_type,video,link,pdf|url",
  content_text: "requiredIf:content_type,text",
  order_index: "required|integer|min:0"
};
```

#### 1.2 Standardized Error Response Format

```javascript
// Standard validation error response
{
  error: true,
  message: "Validation failed",
  validation_errors: [
    {
      field: "name",
      message: "Name must be between 3 and 255 characters",
      rule: "minLength"
    },
    {
      field: "start_date",
      message: "Start date cannot be in the past",
      rule: "dateNotPast"
    }
  ]
}
```

#### 1.3 Route-Level Validation Middleware

```javascript
// Apply validation middleware to routes
app.post(
  "/v1/api/programmes",
  [
    UrlMiddleware,
    TokenMiddleware({ role: "convener" }),
    ValidationMiddleware(PROGRAMME_VALIDATION)
  ],
  async function (req, res) {
    // Validation already passed, proceed with business logic
  }
);
```

### 2. Frontend Validation Enhancement

#### 2.1 Centralized Validation Schemas (cohortle-web/src/lib/validation/schemas.ts)

```typescript
import { z } from 'zod';

// Programme validation schema
export const programmeSchema = z.object({
  name: z.string()
    .min(3, 'Programme name must be at least 3 characters')
    .max(255, 'Programme name must not exceed 255 characters'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => new Date(date) >= new Date().setHours(0,0,0,0), {
      message: 'Start date cannot be in the past'
    })
});

// Cohort validation schema
export const cohortSchema = z.object({
  name: z.string()
    .min(3, 'Cohort name must be at least 3 characters')
    .max(200, 'Cohort name must not exceed 200 characters'),
  enrollmentCode: z.string()
    .regex(/^[A-Z0-9]+-\d{4}$/i, 'Invalid code format. Use: PROGRAMME-YEAR'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => new Date(date) >= new Date().setHours(0,0,0,0), {
      message: 'Start date cannot be in the past'
    })
}).refine((data) => {
  // Cross-field validation can be added here
  return true;
}, {
  message: 'Invalid cohort data'
});

// Week validation schema
export const weekSchema = z.object({
  weekNumber: z.number()
    .int('Week number must be an integer')
    .min(1, 'Week number must be at least 1'),
  title: z.string()
    .min(3, 'Week title must be at least 3 characters')
    .max(200, 'Week title must not exceed 200 characters'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
});

// Lesson validation schema
export const lessonSchema = z.object({
  title: z.string()
    .min(3, 'Lesson title must be at least 3 characters')
    .max(255, 'Lesson title must not exceed 255 characters'),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  contentType: z.enum(['video', 'link', 'pdf', 'text']),
  contentUrl: z.string().url('Invalid URL format').optional(),
  contentText: z.string().optional(),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative')
}).refine((data) => {
  // Conditional validation based on content type
  if (['video', 'link', 'pdf'].includes(data.contentType)) {
    return !!data.contentUrl;
  }
  if (data.contentType === 'text') {
    return !!data.contentText;
  }
  return true;
}, {
  message: 'Content URL or text is required based on content type',
  path: ['contentUrl']
});
```

#### 2.2 Validation Hook (cohortle-web/src/lib/hooks/useValidation.ts)

```typescript
import { useState, useCallback } from 'react';
import { z } from 'zod';

export function useValidation<T extends z.ZodType>(schema: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: unknown) => {
    try {
      schema.parse(data);
      setErrors({});
      return { success: true, data: data as z.infer<T> };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
        return { success: false, errors: fieldErrors };
      }
      return { success: false, errors: { _form: 'Validation failed' } };
    }
  }, [schema]);

  const validateField = useCallback((field: string, value: unknown) => {
    try {
      // Validate single field
      const fieldSchema = schema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [field]: error.errors[0].message
        }));
        return false;
      }
      return false;
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError
  };
}
```

#### 2.3 Enhanced Form Components

**Example: Enhanced CohortForm**

```typescript
import { useValidation } from '@/lib/hooks/useValidation';
import { cohortSchema } from '@/lib/validation/schemas';

export function CohortForm({ programmeId, onSubmit, onCancel }: CohortFormProps) {
  const { errors, validate, validateField } = useValidation(cohortSchema);
  const [formData, setFormData] = useState<CohortFormData>({
    name: '',
    enrollmentCode: '',
    startDate: ''
  });

  const handleFieldChange = (field: keyof CohortFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Validate on blur
    validateField(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = validate(formData);
    if (!result.success) {
      return; // Errors are already set in state
    }

    try {
      await onSubmit(result.data);
    } catch (error) {
      // Handle API errors
      const apiError = parseApiError(error);
      if (apiError.validation_errors) {
        // Map backend validation errors to form
        const backendErrors: Record<string, string> = {};
        apiError.validation_errors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
    </form>
  );
}
```

### 3. Payload Transformation Layer

#### 3.1 Case Transformation with Validation

```typescript
// Enhanced toSnakeCase with validation
export function toSnakeCaseWithValidation<T>(
  data: any,
  schema: z.ZodType<T>
): { success: boolean; data?: any; errors?: Record<string, string> } {
  // First validate
  const validation = schema.safeParse(data);
  if (!validation.success) {
    const errors: Record<string, string> = {};
    validation.error.errors.forEach((err) => {
      errors[err.path.join('.')] = err.message;
    });
    return { success: false, errors };
  }

  // Then transform
  const transformed = toSnakeCase(validation.data);
  return { success: true, data: transformed };
}
```

### 4. API Client Enhancement

#### 4.1 Request Interceptor with Validation

```typescript
// Add validation before sending requests
apiClient.interceptors.request.use((config) => {
  // Log outgoing requests for debugging
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    data: config.data
  });

  // Validate payload structure
  if (config.data && typeof config.data === 'object') {
    // Check for required fields based on endpoint
    const requiredFields = getRequiredFieldsForEndpoint(config.url);
    const missingFields = requiredFields.filter(field => !(field in config.data));
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  return config;
});
```

#### 4.2 Response Interceptor for Validation Errors

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 400) {
      // Parse validation errors
      const validationErrors = error.response.data.validation_errors || [];
      console.error('Validation errors:', validationErrors);
      
      // Transform to user-friendly format
      error.validationErrors = validationErrors.reduce((acc: any, err: any) => {
        acc[err.field] = err.message;
        return acc;
      }, {});
    }
    return Promise.reject(error);
  }
);
```

## Data Flow Diagrams

### Programme Creation Flow
```
User Input → Frontend Validation (Zod) → Transform to snake_case → 
API Request → Backend Validation (node-input-validator) → 
Service Layer → Database → Response → Transform to camelCase → UI Update
```

### Validation Error Flow
```
Invalid Input → Frontend Validation Fails → Display Inline Errors
                                          ↓
                                    User Corrects → Revalidate
                                          ↓
                                    Submit → Backend Validation
                                          ↓
                                    Backend Error → Parse → Display Errors
```

## Testing Strategy

### Unit Tests
- Test each validation rule independently
- Test validation schemas with valid and invalid data
- Test error message generation
- Test case transformation with validation

### Integration Tests
- Test complete form submission flow
- Test API request/response with validation
- Test error handling and display
- Test cross-field validation

### Property-Based Tests
- Generate random valid data and verify acceptance
- Generate random invalid data and verify rejection
- Test boundary conditions (min/max lengths, dates)
- Test format validation (URLs, dates, codes)

## Performance Considerations

### Frontend
- Debounce real-time validation (500ms)
- Memoize validation schemas
- Lazy load validation libraries
- Cache validation results for unchanged data

### Backend
- Use database indices for existence checks
- Cache validation results where appropriate
- Batch validation checks when possible
- Optimize regex patterns for performance

## Security Considerations

### Input Sanitization
- Escape HTML in text inputs
- Validate URL schemes (only http/https)
- Prevent SQL injection through parameterized queries
- Limit input lengths to prevent DoS

### Rate Limiting
- Limit enrollment code checking to 10 requests/minute
- Limit form submissions to 5 requests/minute
- Implement exponential backoff for repeated failures

## Migration Strategy

### Phase 1: Backend Enhancement
1. Add custom validation rules to ValidationService
2. Create validation schemas for all entities
3. Update routes to use validation middleware
4. Standardize error response format

### Phase 2: Frontend Enhancement
1. Install and configure Zod
2. Create validation schemas matching backend
3. Implement useValidation hook
4. Update forms to use new validation

### Phase 3: Integration
1. Test end-to-end validation flow
2. Update API client interceptors
3. Enhance error handling and display
4. Add comprehensive test coverage

### Phase 4: Monitoring
1. Log validation failures for analysis
2. Monitor validation error rates
3. Collect user feedback on error messages
4. Iterate on validation rules based on data

## Rollback Plan

If issues arise:
1. Feature flag to disable new validation
2. Fallback to existing validation logic
3. Gradual rollout by endpoint
4. Monitor error rates and user feedback

## Success Criteria

- All API endpoints have comprehensive validation
- Validation error rate < 5% of submissions
- Zero validation-related production bugs
- User satisfaction with error messages > 90%
- Test coverage for validation > 95%
- Response time impact < 50ms
