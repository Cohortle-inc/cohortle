# Backend Deployment Checklist - Option 1 (Backend Only)

**Date**: February 20, 2026  
**Deployment Type**: Backend API Only (Backward Compatible)  
**Testing**: With existing mobile app

## Overview

This deployment pushes all backend changes to production while maintaining backward compatibility with the current mobile app. Users can test backend improvements without needing a new APK.

## What's Being Deployed

### 1. Lesson Type Feature
- ✅ Database migration adds `type` column to `module_lessons`
- ✅ API accepts and returns lesson type field
- ✅ Defaults to "video" for backward compatibility
- ✅ Supports 10 lesson types: text, video, pdf, live_session, link, assignment, quiz, form, reflection, practical_task

### 2. Community Post Access Control
- ✅ Database migration adds `visibility_scope` and `cohort_id` columns to `posts`
- ✅ Access control service validates user memberships
- ✅ API filters posts based on community/cohort membership
- ✅ Existing posts default to community-wide visibility

### 3. Progress Service Improvements
- ✅ Enhanced lesson progress tracking
- ✅ Better error handling and validation

## Pre-Deployment Checklist

- [ ] **Backup Database** (CRITICAL - Do this first!)
- [ ] Verify you have SSH/Coolify access to production server
- [ ] Confirm current production is stable
- [ ] Notify team of deployment window
- [ ] Have rollback plan ready

## Deployment Steps

### Step 1: Backup Database (5 minutes)

**Via SSH to your RackNerd VPS:**
```bash
# SSH into server
ssh user@your-racknerd-vps

# Create backup
mysqldump -u [db_user] -p cohortle_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backup_*.sql
```

**Store backup safely** - you'll need this if rollback is required.

### Step 2: Commit and Push Changes (2 minutes)

```bash
# Navigate to backend directory
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Check what's changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: lesson types, post access control, progress improvements"

# Push to GitHub
git push origin main
```

### Step 3: Deploy via Coolify (3 minutes)

1. Open Coolify dashboard on your VPS
2. Navigate to `cohortle-api` application
3. Click **"Deploy"** or **"Redeploy"** button
4. Wait for deployment to complete (watch the logs)

**Expected**: Build succeeds, application restarts successfully

### Step 4: Run Database Migrations (5 minutes)

**Via Coolify Terminal (Recommended):**

1. In Coolify dashboard, find `cohortle-api`
2. Click **"Terminal"** or **"Console"**
3. Run migrations:

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Expected output:
# == 20260218000000-add-type-to-module-lessons: migrating =======
# == 20260218000000-add-type-to-module-lessons: migrated (0.XXXs)
# == 20260220000000-add-post-visibility-scope: migrating =======
# == 20260220000000-add-post-visibility-scope: migrated (0.XXXs)
```

4. Verify migration status:

```bash
npx sequelize-cli db:migrate:status

# Should show both migrations as "up"
```

**Alternative - Via SSH:**
```bash
ssh user@your-racknerd-vps
cd /path/to/cohortle-api
npx sequelize-cli db:migrate
```

### Step 5: Verify Database Changes (3 minutes)

**Connect to MySQL and verify:**

```sql
-- Check lesson type column
DESCRIBE module_lessons;
-- Should show 'type' column: VARCHAR(50), default 'video'

-- Check post visibility columns
DESCRIBE posts;
-- Should show 'visibility_scope' ENUM and 'cohort_id' INT

-- Verify existing data migrated correctly
SELECT id, name, type FROM module_lessons LIMIT 5;
-- All should have type='video'

SELECT id, visibility_scope, cohort_id FROM posts LIMIT 5;
-- All should have visibility_scope='community', cohort_id=NULL
```

### Step 6: Test API Endpoints (10 minutes)

#### Test 1: Lesson Type Support

**Get existing lessons (should include type field):**
```bash
curl -X GET https://api.cohortle.com/v1/api/modules/[MODULE_ID]/lessons \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected Response:**
```json
{
  "error": false,
  "lessons": [
    {
      "id": 1,
      "name": "Introduction",
      "type": "video",  // <-- Should be present
      ...
    }
  ]
}
```

**Create new lesson with type:**
```bash
curl -X POST https://api.cohortle.com/v1/api/modules/[MODULE_ID]/lessons \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Text Lesson",
    "type": "text",
    "description": "Testing lesson types",
    "order_number": 999
  }'
```

**Expected**: Lesson created successfully with type="text"

#### Test 2: Post Access Control

**Get posts (should filter by membership):**
```bash
curl -X GET https://api.cohortle.com/v1/api/posts \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected**: Only posts from communities/cohorts you're a member of

**Create community-scoped post:**
```bash
curl -X POST https://api.cohortle.com/v1/api/posts \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test post",
    "visibility_scope": "community",
    "community_id": [COMMUNITY_ID],
    "can_reply": "everyone"
  }'
```

**Expected**: Post created successfully

#### Test 3: Progress Service

**Get lesson progress:**
```bash
curl -X GET https://api.cohortle.com/v1/api/lessons/[LESSON_ID]/progress \
  -H "Authorization: Bearer [YOUR_TOKEN]"
```

**Expected**: Progress data returned without errors

### Step 7: Test with Mobile App (15 minutes)

**Using your current mobile app (no new build needed):**

1. **Test Lesson Viewing**
   - Open any community
   - Navigate to lessons
   - Verify lessons load correctly
   - Check that existing video lessons still work

2. **Test Post Feed**
   - View community posts
   - Verify you only see posts from your communities
   - Try creating a new post
   - Verify post appears in feed

3. **Test Progress Tracking**
   - Mark a lesson as complete
   - Verify progress saves correctly
   - Check progress percentage updates

4. **Test Comments**
   - Comment on a post
   - Verify comment appears
   - Check you can only comment on accessible posts

### Step 8: Monitor Application (30 minutes)

**Check application logs:**

```bash
# Via Coolify dashboard - view logs
# Or via SSH:
pm2 logs cohortle-api
# or
tail -f /var/log/cohortle-api/error.log
```

**Watch for:**
- ❌ Database connection errors
- ❌ Migration errors
- ❌ 500 errors on API endpoints
- ❌ Access control violations
- ✅ Successful API requests
- ✅ Normal application behavior

## Post-Deployment Verification

### Database Verification
- [ ] `module_lessons.type` column exists with default 'video'
- [ ] `posts.visibility_scope` column exists with default 'community'
- [ ] `posts.cohort_id` column exists (nullable)
- [ ] Indexes created successfully
- [ ] Existing data migrated correctly

### API Verification
- [ ] GET /v1/api/modules/:id/lessons returns type field
- [ ] POST /v1/api/modules/:id/lessons accepts type field
- [ ] GET /v1/api/posts filters by membership
- [ ] POST /v1/api/posts accepts visibility_scope
- [ ] Progress endpoints working correctly
- [ ] No 500 errors in logs

### Mobile App Verification (Current App)
- [ ] Lessons load and display correctly
- [ ] Posts feed shows only accessible posts
- [ ] Can create new posts
- [ ] Can comment on posts
- [ ] Progress tracking works
- [ ] No crashes or errors

## Backward Compatibility Verification

**Critical**: These must work with the current mobile app:

- [ ] Existing lessons display correctly (all have type='video')
- [ ] Creating lessons without type field defaults to 'video'
- [ ] Existing posts visible to community members
- [ ] Posts created without visibility_scope default to 'community'
- [ ] Old API calls still work (no breaking changes)

## What Users Can Test Now

With the current mobile app, users can test:

✅ **Lesson viewing** - All existing lessons work normally  
✅ **Post access control** - Only see posts from their communities/cohorts  
✅ **Progress tracking** - Enhanced reliability  
✅ **Comments** - Access control enforced  

❌ **Cannot test yet** (requires new mobile build):
- Creating different lesson types (text, pdf, quiz, etc.)
- Selecting cohort-specific post visibility
- New UI components for lesson types
- Assignment submission system

## Rollback Procedure

If critical issues occur:

### Step 1: Rollback Migrations
```bash
# Via Coolify terminal or SSH
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate:undo
```

### Step 2: Restore Database Backup (if needed)
```bash
mysql -u [db_user] -p cohortle_db < backup_[timestamp].sql
```

### Step 3: Revert Code
```bash
git revert HEAD
git push origin main
```

### Step 4: Redeploy via Coolify
- Click "Deploy" in Coolify dashboard
- Wait for deployment to complete

## Troubleshooting

### Issue: Migration fails with "Column already exists"
**Solution**: Migration may have already run. Check with:
```bash
npx sequelize-cli db:migrate:status
```

### Issue: API returns 500 errors
**Solution**:
1. Check application logs in Coolify
2. Verify migrations completed successfully
3. Check database connection
4. Restart application

### Issue: Posts not filtering correctly
**Solution**:
1. Verify migration ran: `DESCRIBE posts;`
2. Check user memberships in `community_members` table
3. Review access control logs

### Issue: Lessons missing type field
**Solution**:
1. Verify migration ran: `DESCRIBE module_lessons;`
2. Restart application
3. Clear any API caches

## Success Criteria

Deployment is successful when:

- ✅ All migrations completed without errors
- ✅ Database schema updated correctly
- ✅ API endpoints respond successfully
- ✅ Current mobile app works without issues
- ✅ Post access control enforced correctly
- ✅ Lesson type field present in responses
- ✅ No errors in application logs
- ✅ Users can test with existing app

## Next Steps After Successful Deployment

1. **Monitor for 24 hours** - Watch logs and user reports
2. **Gather feedback** - Test with current app, note any issues
3. **Plan mobile build** - Once backend stable, build new APK with:
   - Lesson type selection UI
   - Post visibility scope selector
   - Assignment submission system
   - All new frontend features

4. **Document findings** - Note any issues or improvements needed

## Deployment Timeline

- **Backup**: 5 minutes
- **Commit & Push**: 2 minutes
- **Coolify Deploy**: 3 minutes
- **Run Migrations**: 5 minutes
- **Verify Database**: 3 minutes
- **Test API**: 10 minutes
- **Test Mobile App**: 15 minutes
- **Monitor**: 30 minutes

**Total**: ~75 minutes (1 hour 15 minutes)

## Support Contacts

If issues arise:
- Check Coolify dashboard logs
- Review database migration status
- Test API endpoints manually
- Check application error logs

## Notes

- This deployment is **backward compatible** - existing app continues to work
- New features are **backend-ready** but require mobile build to use fully
- Users can test **access control** and **stability improvements** immediately
- **Assignment system** backend is ready but needs frontend to be usable

---

**Ready to deploy?** Start with Step 1: Backup Database!
