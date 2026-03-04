# Backend Requirements: Lesson Unit Type Selection

## Overview

This document specifies the minimal backend changes required to support the lesson unit type selection feature. The changes are designed to be backward compatible and can be implemented incrementally.

## Priority Unit Types

The frontend will initially support these 7 unit types:
1. Text lesson
2. Video lesson (existing)
3. Document (PDF)
4. Live session
5. Assignment (existing)
6. Quiz
7. Forms and survey

Additional types (Link/External resource, Reflection prompt, Practical task) can be added later.

## Database Changes

### Migration Script

```sql
-- Add type column to lessons table
ALTER TABLE lessons 
ADD COLUMN type VARCHAR(50) DEFAULT 'video';

-- Add index for filtering by type (optional, for performance)
CREATE INDEX idx_lessons_type ON lessons(type);

-- Add check constraint for valid types (optional, for data integrity)
ALTER TABLE lessons
ADD CONSTRAINT check_lesson_type 
CHECK (type IN (
  'text', 'video', 'pdf', 'live_session', 
  'assignment', 'quiz', 'form'
));
```

### Rollback Script

```sql
-- Remove constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_type;

-- Remove index
DROP INDEX IF EXISTS idx_lessons_type;

-- Remove column
ALTER TABLE lessons DROP COLUMN IF EXISTS type;
```

## API Changes

### POST /v1/api/modules/:moduleId/lessons

**Current Request Body:**
```json
{
  "module_id": 123,
  "name": "New Lesson",
  "description": "",
  "url": "",
  "order_number": 1
}
```

**Updated Request Body:**
```json
{
  "module_id": 123,
  "name": "New Video Lesson",
  "description": "",
  "url": "",
  "order_number": 1,
  "type": "video"  // NEW FIELD (optional)
}
```

**Valid Type Values:**
- `"text"` - Text-based lesson with rich content
- `"video"` - Video lesson (default)
- `"pdf"` - PDF document lesson
- `"live_session"` - Scheduled live session
- `"assignment"` - Assignment for students
- `"quiz"` - Quiz with questions
- `"form"` - Form or survey

**Response (Updated):**
```json
{
  "id": 456,
  "module_id": 123,
  "name": "New Video Lesson",
  "description": "",
  "url": "",
  "order_number": 1,
  "status": "draft",
  "type": "video",  // NEW FIELD
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### GET /v1/api/modules/:moduleId/lessons

**Current Response:**
```json
{
  "lessons": [
    {
      "id": 456,
      "module_id": 123,
      "name": "Introduction",
      "description": "...",
      "url": "https://...",
      "order_number": 1,
      "status": "published",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Updated Response:**
```json
{
  "lessons": [
    {
      "id": 456,
      "module_id": 123,
      "name": "Introduction",
      "description": "...",
      "url": "https://...",
      "order_number": 1,
      "status": "published",
      "type": "video",  // NEW FIELD
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### PUT /v1/api/lessons/:lessonId

**Request Body (Updated):**
```json
{
  "name": "Updated Lesson Name",
  "description": "...",
  "url": "https://...",
  "status": "published",
  "type": "video"  // NEW FIELD (optional)
}
```

## Backend Implementation Guidelines

### 1. Backward Compatibility

**CRITICAL:** The backend must remain backward compatible with existing frontend versions.

- If `type` field is not provided in POST request, default to `"video"`
- Existing lessons without a type should return `"video"` in GET responses
- Frontend will handle missing type fields gracefully

### 2. Validation Rules

**Type Field Validation:**
- Must be one of the valid type values listed above
- If invalid type is provided, return `400 Bad Request` with error message
- If type is missing, default to `"video"` (don't reject)

**Example Error Response:**
```json
{
  "error": true,
  "message": "Invalid lesson type. Must be one of: text, video, pdf, live_session, assignment, quiz, form"
}
```

### 3. Data Storage

**Description Field Usage:**
- For some lesson types (quiz, form, live_session), the frontend will store structured data as JSON in the `description` field
- Backend should treat `description` as a text field and not parse/validate the JSON
- Maximum length should accommodate JSON data (recommend at least 10,000 characters)

**Example Quiz Data in Description:**
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctIndex": 1
    }
  ]
}
```

### 4. Assignment Integration

**Special Case:** When `type` is `"assignment"`:
- The frontend will create both a lesson record AND an assignment record
- The assignment record will have a `lessonId` field linking to the lesson
- Backend should support this workflow (no special handling needed)
- When deleting a lesson with type "assignment", consider cascading delete to the assignment record (optional)

## Testing Checklist

### Backend Testing

- [ ] Create lesson with `type: "video"` - should succeed
- [ ] Create lesson with `type: "text"` - should succeed
- [ ] Create lesson with `type: "quiz"` - should succeed
- [ ] Create lesson without `type` field - should default to "video"
- [ ] Create lesson with invalid type - should return 400 error
- [ ] Get lessons - should return type field for all lessons
- [ ] Update lesson with new type - should succeed
- [ ] Legacy lessons (created before migration) - should return type "video"

### Integration Testing

- [ ] Frontend creates lesson with type → Backend stores it → Frontend retrieves it → Type matches
- [ ] Frontend creates quiz with JSON in description → Backend stores it → Frontend retrieves it → JSON is intact
- [ ] Frontend creates assignment-type lesson → Both lesson and assignment records exist
- [ ] Frontend deletes assignment-type lesson → Both records are deleted (if cascade implemented)

## Deployment Strategy

### Option 1: Backend-First (Recommended)

1. Deploy backend changes with type field support
2. Test with API client (Postman/curl)
3. Deploy frontend changes
4. Test end-to-end

### Option 2: Frontend-First (Faster)

1. Deploy frontend changes (sends type field)
2. Backend ignores unknown field (no breaking change)
3. Deploy backend changes to start storing type
4. Test end-to-end

### Option 3: Parallel (Riskier)

1. Deploy both simultaneously
2. Test end-to-end immediately
3. Rollback both if issues arise

## Rollback Plan

If issues arise after deployment:

1. **Frontend Rollback:** Revert to previous version, lessons will be created without type field
2. **Backend Rollback:** Run rollback SQL script to remove type column
3. **Data Integrity:** Existing lessons with type field will lose that data (but remain functional)

## Support and Questions

### Common Questions

**Q: What if we want to add more lesson types later?**
A: Simply add the new type to the validation constraint and update the frontend. No migration needed.

**Q: Can we change a lesson's type after creation?**
A: Yes, the PUT endpoint supports updating the type field. Frontend will handle routing to the new editor.

**Q: What about existing lessons?**
A: They will default to type "video" and continue working as before.

**Q: Do we need to validate the JSON in the description field?**
A: No, treat it as opaque text. Frontend handles JSON parsing and validation.

## Contact

For questions or clarification, please contact the frontend team or refer to the full spec documents:
- `.kiro/specs/lesson-unit-type-selection/requirements.md`
- `.kiro/specs/lesson-unit-type-selection/design.md`
- `.kiro/specs/lesson-unit-type-selection/tasks.md`
