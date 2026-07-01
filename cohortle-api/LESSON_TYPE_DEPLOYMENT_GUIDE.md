# Lesson Type Feature - Backend Deployment Guide

## Overview
This guide covers deploying the lesson type selection feature to the backend. The changes add support for 10 different lesson types (text, video, pdf, live_session, link, assignment, quiz, form, reflection, practical_task).

## Changes Summary

### 1. Database Migration
- **File**: `migrations/20260218000000-add-type-to-module-lessons.js`
- **Action**: Adds `type` column to `module_lessons` table
- **Default**: All existing lessons will default to "video" type
- **Index**: Adds performance index on `type` column

### 2. Model Update
- **File**: `models/module_lessons.js`
- **Action**: Adds `type` field definition to Sequelize model

### 3. API Route Updates
- **File**: `routes/lesson.js`
- **Actions**:
  - POST endpoint accepts `type` field (defaults to "video")
  - PUT endpoint accepts `type` field for updates
  - GET endpoints return `type` field in responses
  - Swagger documentation updated

## Deployment Steps

### Step 1: Backup Database
```bash
# Create a backup before running migrations
mysqldump -u [username] -p [database_name] > backup_before_lesson_types_$(date +%Y%m%d).sql
```

### Step 2: Pull Latest Code
```bash
cd /path/to/cohortle-api
git pull origin main
```

### Step 3: Install Dependencies (if needed)
```bash
npm install
```

### Step 4: Run Migration
```bash
# Run the migration to add the type column
npm run migrate

# Or if using sequelize-cli directly:
npx sequelize-cli db:migrate
```

**Expected Output:**
```
== 20260218000000-add-type-to-module-lessons: migrating =======
== 20260218000000-add-type-to-module-lessons: migrated (0.123s)
```

### Step 5: Verify Migration
```bash
# Connect to MySQL and verify the column was added
mysql -u [username] -p [database_name]
```

```sql
-- Check the column exists
DESCRIBE module_lessons;

-- Should show a 'type' column with VARCHAR(50), default 'video'

-- Check the index was created
SHOW INDEX FROM module_lessons WHERE Key_name = 'idx_module_lessons_type';

-- Verify existing lessons have default type
SELECT id, name, type FROM module_lessons LIMIT 10;
```

### Step 6: Restart Application
```bash
# If using PM2
pm2 restart cohortle-api

# If using systemd
sudo systemctl restart cohortle-api

# If using Docker
docker-compose restart api

# If using Coolify
# Trigger a redeploy from the Coolify dashboard
```

### Step 7: Test API Endpoints

#### Test 1: Create Lesson with Type
```bash
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Text Lesson",
    "type": "text",
    "description": "This is a text lesson",
    "order_number": 1
  }'
```

**Expected Response:**
```json
{
  "error": false,
  "message": "Lesson created successfully",
  "lesson_id": 123
}
```

#### Test 2: Get Lessons (Verify Type Field)
```bash
curl -X GET https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "error": false,
  "message": "Lessons fetched successfully",
  "lessons": [
    {
      "id": 123,
      "module_id": 1,
      "name": "Test Text Lesson",
      "type": "text",
      "description": "This is a text lesson",
      "order_number": 1,
      ...
    }
  ]
}
```

#### Test 3: Create Lesson Without Type (Should Default to Video)
```bash
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Default Type",
    "description": "No type specified",
    "order_number": 2
  }'
```

**Expected**: Lesson created with `type: "video"`

#### Test 4: Update Lesson Type
```bash
curl -X PUT https://api.cohortle.com/v1/api/lessons/123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quiz"
  }'
```

**Expected**: Lesson type updated successfully

#### Test 5: Create Quiz with JSON Description
```bash
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Quiz",
    "type": "quiz",
    "description": "{\"questions\":[{\"id\":\"q1\",\"question\":\"What is 2+2?\",\"options\":[{\"text\":\"3\",\"isCorrect\":false},{\"text\":\"4\",\"isCorrect\":true}]}]}",
    "order_number": 3
  }'
```

**Expected**: Quiz created with JSON stored in description

### Step 8: Monitor Logs
```bash
# Check for any errors
tail -f /var/log/cohortle-api/error.log

# Or if using PM2
pm2 logs cohortle-api
```

## Rollback Procedure

If issues occur, you can rollback the migration:

### Step 1: Rollback Migration
```bash
npx sequelize-cli db:migrate:undo
```

### Step 2: Revert Code Changes
```bash
git revert HEAD
git push origin main
```

### Step 3: Restart Application
```bash
pm2 restart cohortle-api
# or your restart command
```

## Validation Checklist

After deployment, verify:

- [ ] Migration ran successfully
- [ ] `type` column exists in `module_lessons` table
- [ ] Index `idx_module_lessons_type` was created
- [ ] Existing lessons have `type = 'video'`
- [ ] POST endpoint accepts `type` field
- [ ] GET endpoint returns `type` field
- [ ] PUT endpoint can update `type` field
- [ ] Creating lesson without `type` defaults to "video"
- [ ] JSON data can be stored in `description` field (for quizzes, forms, etc.)
- [ ] YouTube URLs work in `url` field
- [ ] No errors in application logs
- [ ] Frontend can create and display all lesson types

## Database Schema Changes

### Before Migration
```sql
CREATE TABLE `module_lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `media` text,
  `text` text,
  `video_guid` varchar(255) DEFAULT NULL,
  `order_number` int NOT NULL,
  `estimated_duration` int DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(100) NOT NULL DEFAULT 'draft',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`)
);
```

### After Migration
```sql
CREATE TABLE `module_lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  `media` text,
  `text` text,
  `video_guid` varchar(255) DEFAULT NULL,
  `order_number` int NOT NULL,
  `estimated_duration` int DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(100) NOT NULL DEFAULT 'draft',
  `type` varchar(50) NOT NULL DEFAULT 'video',  -- NEW FIELD
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  KEY `idx_module_lessons_type` (`type`)  -- NEW INDEX
);
```

## Valid Lesson Types

The following lesson types are supported:

1. `text` - Text-based lesson with rich content
2. `video` - Video lesson (default for backward compatibility)
3. `pdf` - PDF document lesson
4. `live_session` - Scheduled live session
5. `link` - External link/resource
6. `assignment` - Assignment for students
7. `quiz` - Quiz with questions
8. `form` - Form or survey
9. `reflection` - Reflection prompt
10. `practical_task` - Practical task with file submission

## Important Notes

### Description Field Usage
For certain lesson types (quiz, form, live_session, link), the frontend stores **structured JSON data** in the `description` field. The backend should:
- **NOT parse or validate** the JSON
- Treat it as opaque text
- Ensure the field can accommodate ~10,000 characters

### YouTube URL Support
Video lessons now use YouTube URLs instead of uploaded files:
- Frontend sends YouTube URLs in the `url` field
- Backend should accept and store these URLs
- Old Bunny.net URLs remain supported for backward compatibility

### Backward Compatibility
- All existing lessons automatically get `type = 'video'`
- Frontend handles lessons without a type field
- No breaking changes to existing functionality

## Troubleshooting

### Issue: Migration Fails
**Error**: `Column 'type' already exists`
**Solution**: The migration may have already run. Check with `DESCRIBE module_lessons;`

### Issue: API Returns 500 Error
**Error**: `Unknown column 'type' in 'field list'`
**Solution**: Migration didn't run. Execute `npm run migrate`

### Issue: Lessons Not Showing Type
**Error**: GET response missing `type` field
**Solution**: 
1. Verify migration ran: `DESCRIBE module_lessons;`
2. Restart application
3. Check model file includes `type` field

### Issue: Cannot Store JSON in Description
**Error**: Description truncated or corrupted
**Solution**: Check `description` field type is `TEXT` (not VARCHAR)

## Support

For issues or questions:
- Check application logs: `pm2 logs cohortle-api`
- Check database: `mysql -u [user] -p [database]`
- Review migration status: `npx sequelize-cli db:migrate:status`

## Deployment Checklist

- [ ] Database backed up
- [ ] Code pulled from repository
- [ ] Dependencies installed
- [ ] Migration executed successfully
- [ ] Migration verified in database
- [ ] Application restarted
- [ ] API endpoints tested
- [ ] Logs checked for errors
- [ ] Frontend tested with backend
- [ ] Team notified of deployment

## Next Steps

After successful deployment:
1. Monitor application logs for 24 hours
2. Test creating lessons of each type from the mobile app
3. Verify old lessons still work correctly
4. Update API documentation if needed
5. Notify frontend team that backend is ready
