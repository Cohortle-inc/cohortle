# Lesson Completion Tracking Fix

## Issue
The "mark as complete" button and progress tracking are not working across pages (dashboard, my programmes, profile) because the completion endpoints are using the wrong database tables.

## Root Cause

The system has TWO different lesson/completion table structures:

### Old System (Module-based)
- Tables: `module_lessons`, `lesson_progress`, `programme_modules`
- Used by: Legacy endpoints in `/v1/api/lessons/:lesson_id/complete`

### WLIMP System (Week-based)  
- Tables: `lessons`, `lesson_completions`, `weeks`, `programmes`
- Used by: Current programme structure, ProgressService
- **Problem**: No API endpoints are calling ProgressService methods!

## The Problem

1. **Frontend** calls `/v1/api/lessons/:lesson_id/complete` (POST/DELETE)
2. **Backend endpoint** tries to update `lesson_progress` table (old structure)
3. **WLIMP lessons** are stored in `lessons` table with completions in `lesson_completions`
4. **Result**: Completion is saved to wrong table, progress doesn't update

## Solution

We need to update the completion endpoints to use ProgressService which correctly handles WLIMP tables.

### Files to Modify

#### 1. `cohortle-api/routes/lesson.js`

**Current POST endpoint** (lines ~447-560):
```javascript
app.post(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
        // ... uses lesson_progress table (WRONG)
    }
);
```

**Should be**:
```javascript
app.post(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
        try {
            const { lesson_id } = req.params;
            const { cohort_id } = req.body;
            const ProgressService = require("../services/ProgressService");

            const validationResult = await ValidationService.validateObject(
                {
                    lesson_id: "required|string", // UUID for WLIMP lessons
                    cohort_id: "required|integer",
                },
                { lesson_id, cohort_id }
            );

            if (validationResult.error) {
                return res.status(400).json(validationResult);
            }

            // Use ProgressService for WLIMP lessons
            await ProgressService.markLessonComplete(
                req.user_id,
                lesson_id,
                parseInt(cohort_id)
            );

            return res.status(200).json({
                error: false,
                message: "Lesson marked as completed",
                success: true,
            });
        } catch (err) {
            console.error("Error marking lesson complete:", err);
            res.status(500).json({
                error: true,
                message: "Failed to mark lesson as complete",
            });
        }
    }
);
```

**Current DELETE endpoint** (lines ~780-820):
```javascript
app.delete(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "learner" })],
    async function (req, res) {
        // ... already uses ProgressService (CORRECT!)
    }
);
```
✅ This one is already correct!

**Current GET endpoint** (lines ~580-740):
```javascript
app.get(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
        // ... uses lesson_progress table (WRONG)
    }
);
```

**Should be**:
```javascript
app.get(
    "/v1/api/lessons/:lesson_id/complete",
    [UrlMiddleware, TokenMiddleware({ role: "convener|learner" })],
    async function (req, res) {
        try {
            const { lesson_id } = req.params;
            const { cohort_id } = req.query;
            const ProgressService = require("../services/ProgressService");

            const validationResult = await ValidationService.validateObject(
                {
                    lesson_id: "required|string", // UUID for WLIMP lessons
                    cohort_id: "required|integer"
                },
                { lesson_id, cohort_id }
            );

            if (validationResult.error) {
                return res.status(400).json(validationResult);
            }

            // Use ProgressService for WLIMP lessons
            await ProgressService.markLessonComplete(
                req.user_id,
                lesson_id,
                parseInt(cohort_id)
            );

            return res.status(200).json({
                error: false,
                message: "Lesson marked as completed",
                success: true,
            });
        } catch (err) {
            console.error("Error marking lesson complete:", err);
            res.status(500).json({
                error: true,
                message: "Failed to mark lesson as complete",
            });
        }
    }
);
```

## Key Changes

1. **Validation**: Change `lesson_id` from `integer` to `string` (WLIMP uses UUIDs)
2. **Service**: Use `ProgressService.markLessonComplete()` instead of direct DB queries
3. **Tables**: ProgressService correctly uses `lesson_completions` table
4. **Progress Calculation**: ProgressService handles progress updates automatically

## Testing

After applying the fix:

1. **Mark lesson as complete**:
   ```bash
   POST /v1/api/lessons/{uuid}/complete
   Body: { "cohort_id": 1 }
   ```

2. **Check completion status**:
   ```sql
   SELECT * FROM lesson_completions 
   WHERE user_id = ? AND lesson_id = ? AND cohort_id = ?;
   ```

3. **Verify progress updates**:
   - Dashboard should show updated progress
   - Programme page should show correct completion count
   - Profile should reflect completed lessons

## Impact

✅ Fixes completion tracking for WLIMP lessons
✅ Progress bars will update correctly
✅ Dashboard will show accurate progress
✅ "Continue Learning" will work properly
✅ Maintains backward compatibility (DELETE endpoint already correct)

## Deployment

1. Update `cohortle-api/routes/lesson.js`
2. Deploy to production
3. Test completion on a WLIMP lesson
4. Verify progress updates across all pages

## Related Files

- `cohortle-api/services/ProgressService.js` - Already correct ✅
- `cohortle-api/models/lesson_completions.js` - WLIMP completion table ✅
- `cohortle-api/routes/lesson.js` - Needs updates ❌
- `cohortle-web/src/lib/api/lessons.ts` - Frontend API calls (should work after backend fix) ✅
