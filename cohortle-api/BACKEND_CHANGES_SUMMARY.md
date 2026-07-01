# Backend Changes Summary - Lesson Type Feature

## Status: ✅ READY TO DEPLOY

All backend changes have been implemented and are ready for deployment.

## Files Modified

### 1. New Migration File
**File**: `migrations/20260218000000-add-type-to-module-lessons.js`
- Adds `type` column to `module_lessons` table
- Type: VARCHAR(50), NOT NULL, DEFAULT 'video'
- Adds performance index on `type` column
- Includes rollback functionality

### 2. Model Updated
**File**: `models/module_lessons.js`
- Added `type` field definition
- Matches migration schema exactly

### 3. API Routes Updated
**File**: `routes/lesson.js`

**Changes Made:**
- ✅ POST `/v1/api/modules/:module_id/lessons` - Accepts `type` field (defaults to "video")
- ✅ GET `/v1/api/modules/:module_id/lessons` - Returns `type` field in response
- ✅ GET `/v1/api/lessons/:lesson_id` - Returns `type` field in response
- ✅ PUT `/v1/api/lessons/:lesson_id` - Accepts `type` field for updates
- ✅ Swagger documentation updated with `type` field and valid enum values

### 4. Documentation Created
- `LESSON_TYPE_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `QUICK_DEPLOY.md` - Quick reference for deployment
- `BACKEND_CHANGES_SUMMARY.md` - This file

## What This Enables

The backend now supports 10 lesson types:
1. `text` - Text-based lessons
2. `video` - Video lessons (default)
3. `pdf` - PDF documents
4. `live_session` - Live sessions
5. `link` - External links
6. `assignment` - Assignments
7. `quiz` - Quizzes
8. `form` - Forms/surveys
9. `reflection` - Reflection prompts
10. `practical_task` - Practical tasks

## Backward Compatibility

✅ **Fully backward compatible**
- All existing lessons automatically get `type = 'video'`
- Frontend handles missing `type` field gracefully
- No breaking changes to existing API contracts

## Testing Status

### Unit Tests
- ⚠️ No unit tests added (existing codebase doesn't have test suite)
- Manual testing required after deployment

### Manual Testing Required
After deployment, test:
1. Create lesson with type "text"
2. Create lesson with type "quiz" and JSON description
3. Create lesson without type (should default to "video")
4. Get lessons (should include type field)
5. Update lesson type
6. Verify old lessons show type "video"

## Deployment Instructions

### Quick Deploy (5 minutes)
```bash
# 1. Backup database
mysqldump -u root -p cohortle_db > backup_$(date +%Y%m%d).sql

# 2. Pull code
cd /path/to/cohortle-api
git pull origin main

# 3. Run migration
npm run migrate

# 4. Restart app (Coolify/PM2/Docker)
# Coolify: Redeploy from dashboard
# PM2: pm2 restart cohortle-api
# Docker: docker-compose restart api

# 5. Test
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"text","order_number":1}'
```

See `QUICK_DEPLOY.md` for quick reference or `LESSON_TYPE_DEPLOYMENT_GUIDE.md` for detailed instructions.

## Rollback Plan

If issues occur:
```bash
# 1. Rollback migration
npx sequelize-cli db:migrate:undo

# 2. Revert code
git revert HEAD
git push origin main

# 3. Restart app
pm2 restart cohortle-api
```

## API Changes

### POST /v1/api/modules/:module_id/lessons

**Before:**
```json
{
  "name": "Lesson Name",
  "description": "...",
  "order_number": 1
}
```

**After (optional field):**
```json
{
  "name": "Lesson Name",
  "description": "...",
  "order_number": 1,
  "type": "text"  // Optional, defaults to "video"
}
```

### GET /v1/api/modules/:module_id/lessons

**Before:**
```json
{
  "lessons": [
    {
      "id": 1,
      "name": "Lesson",
      "description": "...",
      ...
    }
  ]
}
```

**After:**
```json
{
  "lessons": [
    {
      "id": 1,
      "name": "Lesson",
      "description": "...",
      "type": "video",  // NEW FIELD
      ...
    }
  ]
}
```

### PUT /v1/api/lessons/:lesson_id

**New capability:**
```json
{
  "type": "quiz"  // Can now update lesson type
}
```

## Database Schema Change

```sql
-- Before
CREATE TABLE module_lessons (
  ...
  status VARCHAR(100) NOT NULL DEFAULT 'draft'
);

-- After
CREATE TABLE module_lessons (
  ...
  status VARCHAR(100) NOT NULL DEFAULT 'draft',
  type VARCHAR(50) NOT NULL DEFAULT 'video',  -- NEW
  INDEX idx_module_lessons_type (type)        -- NEW
);
```

## Important Notes

### Description Field
For quiz, form, live_session, and link types, the frontend stores **JSON data** in the `description` field:

```json
// Quiz example
{
  "questions": [
    {
      "id": "q1",
      "question": "What is 2+2?",
      "options": [
        {"text": "4", "isCorrect": true}
      ]
    }
  ]
}
```

**Backend should:**
- NOT parse or validate this JSON
- Treat it as opaque text
- Ensure TEXT field can hold ~10,000 characters

### YouTube URLs
Video lessons now use YouTube URLs:
- Frontend sends: `"url": "https://www.youtube.com/watch?v=..."`
- Backend should accept and store these URLs
- Old Bunny.net URLs remain supported

## Next Steps

1. ✅ Backend changes complete
2. ⏳ Deploy backend to staging/production
3. ⏳ Test API endpoints
4. ⏳ Notify frontend team backend is ready
5. ⏳ Frontend team can build and test mobile app

## Questions?

- See `LESSON_TYPE_DEPLOYMENT_GUIDE.md` for detailed instructions
- See `QUICK_DEPLOY.md` for quick reference
- Check migration file: `migrations/20260218000000-add-type-to-module-lessons.js`
- Check model: `models/module_lessons.js`
- Check routes: `routes/lesson.js`

## Deployment Checklist

Before deploying:
- [ ] Review all changes
- [ ] Backup database
- [ ] Test in staging environment (if available)
- [ ] Notify team of deployment window

During deployment:
- [ ] Pull latest code
- [ ] Run migration
- [ ] Restart application
- [ ] Test API endpoints
- [ ] Check logs for errors

After deployment:
- [ ] Verify migration in database
- [ ] Test creating lessons of each type
- [ ] Verify old lessons still work
- [ ] Monitor logs for 24 hours
- [ ] Notify frontend team

---

**Status**: Ready for deployment
**Risk Level**: Low (backward compatible, non-breaking changes)
**Estimated Downtime**: < 1 minute (during restart)
**Rollback Time**: < 2 minutes
