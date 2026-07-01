# Lesson Type Feature - Backend Implementation

## 🎯 Quick Start

The backend is ready to deploy! Follow these steps:

1. **Read**: `QUICK_DEPLOY.md` (5-minute deployment guide)
2. **Deploy**: Run migration and restart app
3. **Test**: Use `test_lesson_types.sh` or `test_lesson_types.bat`
4. **Verify**: Check all tests pass

## 📁 Files Overview

### Implementation Files
- `migrations/20260218000000-add-type-to-module-lessons.js` - Database migration
- `models/module_lessons.js` - Updated model with type field
- `routes/lesson.js` - Updated routes to handle type field

### Documentation Files
- `QUICK_DEPLOY.md` - Quick deployment guide (5 minutes)
- `LESSON_TYPE_DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `BACKEND_CHANGES_SUMMARY.md` - Summary of all changes
- `README_LESSON_TYPES.md` - This file

### Testing Files
- `test_lesson_types.sh` - API test script (Linux/Mac)
- `test_lesson_types.bat` - API test script (Windows)

## 🚀 Deployment

### Option 1: Quick Deploy (Recommended)
```bash
# See QUICK_DEPLOY.md for full instructions
cd /path/to/cohortle-api
git pull origin main
npm run migrate
# Restart your app (PM2/Docker/Coolify)
```

### Option 2: Detailed Deploy
See `LESSON_TYPE_DEPLOYMENT_GUIDE.md` for step-by-step instructions with verification steps.

## ✅ What's Implemented

### Database
- ✅ `type` column added to `module_lessons` table
- ✅ Default value: "video" (backward compatible)
- ✅ Performance index on `type` column
- ✅ Rollback support

### API Endpoints
- ✅ POST `/v1/api/modules/:module_id/lessons` - Accepts `type` field
- ✅ GET `/v1/api/modules/:module_id/lessons` - Returns `type` field
- ✅ GET `/v1/api/lessons/:lesson_id` - Returns `type` field
- ✅ PUT `/v1/api/lessons/:lesson_id` - Accepts `type` field for updates
- ✅ Swagger documentation updated

### Supported Lesson Types
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

## 🧪 Testing

### Automated Testing
```bash
# Linux/Mac
chmod +x test_lesson_types.sh
./test_lesson_types.sh

# Windows
test_lesson_types.bat
```

### Manual Testing
```bash
# Create a text lesson
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"text","order_number":1}'

# Get lessons (should include type field)
curl -X GET https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Backward Compatibility

✅ **Fully backward compatible**
- All existing lessons automatically get `type = 'video'`
- Frontend handles missing `type` field gracefully
- No breaking changes to existing API contracts
- Old Bunny.net video URLs still work

## 📊 Database Schema

### Before
```sql
CREATE TABLE module_lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_id INT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  ...
  status VARCHAR(100) NOT NULL DEFAULT 'draft'
);
```

### After
```sql
CREATE TABLE module_lessons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_id INT NOT NULL,
  name VARCHAR(255),
  description TEXT,
  ...
  status VARCHAR(100) NOT NULL DEFAULT 'draft',
  type VARCHAR(50) NOT NULL DEFAULT 'video',  -- NEW
  INDEX idx_module_lessons_type (type)        -- NEW
);
```

## 🔧 Troubleshooting

### Migration fails with "Column already exists"
The migration may have already run. Check with:
```sql
DESCRIBE module_lessons;
```

### API returns 500 error
Migration didn't run. Execute:
```bash
npm run migrate
```

### Type field not in response
1. Verify migration ran
2. Restart application
3. Check model includes `type` field

## 📝 Important Notes

### JSON in Description Field
For quiz, form, live_session, and link types, the frontend stores JSON in the `description` field. The backend should:
- NOT parse or validate this JSON
- Treat it as opaque text
- Ensure TEXT field can hold ~10,000 characters

### YouTube URLs
Video lessons now use YouTube URLs:
- Frontend sends: `"url": "https://www.youtube.com/watch?v=..."`
- Backend accepts and stores these URLs
- Old Bunny.net URLs remain supported

## 🔐 Security Considerations

- No new security concerns introduced
- Type field is validated by database constraint (optional)
- Description field accepts any text (including JSON)
- URL field accepts any valid URL (including YouTube)

## 📈 Performance

- Index added on `type` column for fast filtering
- No performance impact on existing queries
- Minimal storage overhead (50 bytes per lesson)

## 🎯 Next Steps After Deployment

1. ✅ Verify migration in database
2. ✅ Run test script
3. ✅ Check application logs
4. ✅ Test creating lessons of each type
5. ✅ Verify old lessons still work
6. ✅ Notify frontend team backend is ready
7. ✅ Monitor for 24 hours

## 📞 Support

For issues:
- Check logs: `pm2 logs cohortle-api`
- Check database: `mysql -u user -p database`
- Review migration status: `npx sequelize-cli db:migrate:status`
- See troubleshooting section in `LESSON_TYPE_DEPLOYMENT_GUIDE.md`

## 📚 Additional Resources

- Frontend changes: See `cohortz/BACKEND_SYNC_CHECKLIST.md`
- API documentation: Check Swagger at `/api-docs`
- Database schema: See `LESSON_TYPE_DEPLOYMENT_GUIDE.md`

---

**Status**: ✅ Ready for deployment
**Risk**: Low (backward compatible)
**Downtime**: < 1 minute
**Rollback**: < 2 minutes
