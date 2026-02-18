# Backend Sync Checklist - Lesson Type Selection Feature

## Overview
This document outlines the frontend changes made and the corresponding backend changes required to ensure full compatibility.

---

## Frontend Changes Summary

### 1. **Lesson Type System** ✅ IMPLEMENTED
- Added `LessonUnitType` enum with 10 lesson types
- Created type configuration system with icons, labels, and routes
- Location: `cohortz/types/lessonTypes.ts`

### 2. **API Layer Updates** ✅ IMPLEMENTED
- Updated `LessonProp` interface to include optional `type?: LessonUnitType` field
- POST requests now send `type` field when creating lessons
- Location: `cohortz/api/communities/lessons/postLessons.tsx`

### 3. **New Lesson Editors Created** ✅ IMPLEMENTED
- Text Lesson Editor (`textLessonEditor.tsx`)
- PDF Lesson Editor (`pdfLessonEditor.tsx`)
- Link/External Resource Editor (`linkLessonEditor.tsx`)
- Live Session Editor (`liveSessionEditor.tsx`)
- Quiz Editor (`quizEditor.tsx`)

### 4. **YouTube Integration** ✅ IMPLEMENTED
- Replaced Bunny.net video uploads with YouTube URL input
- Video lessons now accept YouTube URLs instead of file uploads
- Location: `cohortz/app/convener-screens/(cohorts)/community/uploadLesson.tsx`

### 5. **Onboarding Flow Fix** ✅ IMPLEMENTED
- Fixed duplicate name collection in onboarding
- Names now collected once and passed through route params

---

## Required Backend Changes

### ✅ COMPLETE: Database Migration

**Status:** ✅ IMPLEMENTED

The backend database needs a new `type` column in the `lessons` table:

```sql
-- Add type column to lessons table
ALTER TABLE lessons 
ADD COLUMN type VARCHAR(50) DEFAULT 'video';

-- Optional: Add index for performance
CREATE INDEX idx_lessons_type ON lessons(type);

-- Optional: Add constraint for data integrity
ALTER TABLE lessons
ADD CONSTRAINT check_lesson_type 
CHECK (type IN (
  'text', 'video', 'pdf', 'live_session', 
  'link', 'assignment', 'quiz', 'form',
  'reflection', 'practical_task'
));
```

**Backend Implementation:**
- ✅ Migration file created: `cohortle-api/migrations/20260218000000-add-type-to-module-lessons.js`
- ✅ Adds `type` column: VARCHAR(50), NOT NULL, DEFAULT 'video'
- ✅ Adds performance index on `type` column
- ✅ Includes rollback functionality

**Deployment Status:**
- ⏳ Migration needs to be run on production database
- ⏳ Application needs to be restarted

---

### ✅ COMPLETE: API Endpoint Updates

**Status:** ✅ IMPLEMENTED

#### 1. POST `/v1/api/modules/:moduleId/lessons`

**Current Frontend Sends:**
```json
{
  "module_id": 123,
  "name": "New Lesson",
  "description": "",
  "url": "",
  "order_number": 1,
  "type": "video"  // ← NEW FIELD
}
```

**Backend Implementation:**
- ✅ POST endpoint accepts `type` field
- ✅ Stores `type` in database
- ✅ Defaults to "video" if `type` is missing
- ✅ Model updated: `cohortle-api/models/module_lessons.js`
- ✅ Routes updated: `cohortle-api/routes/lesson.js`

#### 2. GET `/v1/api/modules/:moduleId/lessons`

**Frontend Expects Response:**
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
      "type": "video",  // ← MUST BE INCLUDED
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Backend Implementation:**
- ✅ GET endpoints return `type` field
- ✅ Old lessons will show `type: "video"` (database default)

#### 3. PUT `/v1/api/lessons/:lessonId`

**Frontend May Send:**
```json
{
  "name": "Updated Lesson",
  "description": "...",
  "url": "https://...",
  "type": "quiz"  // ← Can be updated
}
```

**Backend Implementation:**
- ✅ PUT endpoint accepts `type` field
- ✅ Lesson type can be changed after creation

---

### ✅ VERIFIED: Description Field Usage

**Status:** ✅ COMPATIBLE

For certain lesson types (Quiz, Form, Live Session, Link), the frontend stores **structured JSON data** in the `description` field.

**Example Quiz Data:**
```json
{
  "questions": [
    {
      "id": "q_123",
      "question": "What is 2+2?",
      "options": [
        {"text": "3", "isCorrect": false},
        {"text": "4", "isCorrect": true},
        {"text": "5", "isCorrect": false},
        {"text": "6", "isCorrect": false}
      ]
    }
  ]
}
```

**Example Live Session Data:**
```json
{
  "sessionDate": "2024-02-20T14:00:00Z",
  "duration": 60,
  "meetingLink": "https://zoom.us/j/123456789",
  "notes": "Bring your questions!"
}
```

**Backend Implementation:**
- ✅ Description field is TEXT type (can hold large JSON)
- ✅ Backend treats description as opaque text (no parsing)
- ✅ Can accommodate JSON strings of 10,000+ characters

---

### ✅ VERIFIED: YouTube URL Support

**Status:** ✅ COMPATIBLE

Video lessons now use YouTube URLs instead of uploaded video files.

**Frontend Sends:**
```json
{
  "type": "video",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "description": ""
}
```

**Backend Implementation:**
- ✅ Backend accepts YouTube URLs in `url` field
- ✅ No URL validation that would reject YouTube URLs
- ✅ Old Bunny.net URLs remain supported

---

## Testing Checklist

### Backend API Testing (Use Postman/curl)

- [ ] **Create lesson with type "video"**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {"name": "Test Video", "type": "video", "url": "", "order_number": 1}
  Expected: Success, returns lesson with type "video"
  ```

- [ ] **Create lesson with type "text"**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {"name": "Test Text", "type": "text", "url": "", "order_number": 2}
  Expected: Success, returns lesson with type "text"
  ```

- [ ] **Create lesson with type "quiz" and JSON description**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {
    "name": "Test Quiz",
    "type": "quiz",
    "description": "{\"questions\":[{\"id\":\"q1\",\"question\":\"Test?\",\"options\":[{\"text\":\"A\",\"isCorrect\":true}]}]}",
    "url": "",
    "order_number": 3
  }
  Expected: Success, JSON stored intact
  ```

- [ ] **Create lesson without type field**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {"name": "Test Default", "url": "", "order_number": 4}
  Expected: Success, defaults to type "video"
  ```

- [ ] **Create lesson with invalid type**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {"name": "Test Invalid", "type": "invalid_type", "url": "", "order_number": 5}
  Expected: 400 Bad Request error
  ```

- [ ] **Get lessons - verify type field is returned**
  ```bash
  GET /v1/api/modules/123/lessons
  Expected: All lessons include "type" field
  ```

- [ ] **Get lessons - verify old lessons default to "video"**
  ```bash
  GET /v1/api/modules/123/lessons
  Expected: Lessons created before migration show type "video"
  ```

- [ ] **Create lesson with YouTube URL**
  ```bash
  POST /v1/api/modules/123/lessons
  Body: {
    "name": "YouTube Video",
    "type": "video",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "order_number": 6
  }
  Expected: Success, YouTube URL stored
  ```

### Frontend-Backend Integration Testing

- [ ] **Create text lesson from app**
  - Open app → Navigate to module → Add lesson → Select "Text"
  - Enter content → Save
  - Verify: Lesson appears in list with document icon
  - Verify: Backend has lesson with type "text"

- [ ] **Create quiz from app**
  - Add lesson → Select "Quiz" → Add questions → Save
  - Verify: Quiz data stored in description field as JSON
  - Verify: Can retrieve and edit quiz later

- [ ] **Create video lesson with YouTube URL**
  - Add lesson → Select "Video" → Paste YouTube URL → Save
  - Verify: Video plays in student view
  - Verify: Backend has YouTube URL in url field

- [ ] **Create live session**
  - Add lesson → Select "Live Session" → Set date/time → Save
  - Verify: Session data stored as JSON in description
  - Verify: Can retrieve session details later

- [ ] **Verify backward compatibility**
  - Old lessons (created before this feature) should:
    - Display with video icon
    - Be editable
    - Not break the app

---

## Deployment Coordination

### Recommended Deployment Order

1. **Backend First (Safest)**
   - Deploy backend changes (add type column, update API)
   - Test with Postman/curl
   - Verify all endpoints work
   - Then deploy frontend

2. **Verify After Deployment**
   - Create one lesson of each type from the app
   - Verify they save correctly
   - Verify they display correctly
   - Verify old lessons still work

### Rollback Plan

If issues occur:
1. **Frontend Rollback**: Revert to previous version (lessons created without type)
2. **Backend Rollback**: Run SQL rollback script (remove type column)
3. **Data Loss**: Lessons created with new types will lose type information but remain functional

---

## Backend Implementation Complete ✅

All backend changes have been implemented and are ready for deployment.

### Files Created/Modified in Backend:
1. ✅ `cohortle-api/migrations/20260218000000-add-type-to-module-lessons.js` - Migration file
2. ✅ `cohortle-api/models/module_lessons.js` - Model updated with type field
3. ✅ `cohortle-api/routes/lesson.js` - Routes updated to handle type field
4. ✅ `cohortle-api/LESSON_TYPE_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
5. ✅ `cohortle-api/QUICK_DEPLOY.md` - Quick deployment reference
6. ✅ `cohortle-api/BACKEND_CHANGES_SUMMARY.md` - Summary of all changes
7. ✅ `cohortle-api/test_lesson_types.sh` - Test script (Linux/Mac)
8. ✅ `cohortle-api/test_lesson_types.bat` - Test script (Windows)

### Next Steps:
1. ⏳ Deploy backend changes to production
2. ⏳ Run migration: `npm run migrate`
3. ⏳ Restart application
4. ⏳ Run test script to verify
5. ⏳ Build and test frontend mobile app

### Deployment Instructions:
See `cohortle-api/QUICK_DEPLOY.md` for quick deployment or `cohortle-api/LESSON_TYPE_DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Changes | ✅ Complete | All editors and UI implemented |
| Database Migration | ✅ Implemented | Migration file created, ready to run |
| API Updates | ✅ Implemented | All routes updated to handle type field |
| Backend Testing | ⏳ Pending | Test scripts created, ready to run after deployment |
| Backend Deployment | ⏳ Pending | Ready to deploy - see QUICK_DEPLOY.md |
| Frontend Build | ⏳ Pending | Can proceed after backend deployment |

**Next Steps:**
1. ✅ Backend code changes complete
2. ⏳ Deploy backend to production (see `cohortle-api/QUICK_DEPLOY.md`)
3. ⏳ Run test script to verify backend
4. ⏳ Build frontend mobile app with EAS Build
5. ⏳ Test complete flow on mobile device

