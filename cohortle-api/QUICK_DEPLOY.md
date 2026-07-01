# Quick Deploy - Lesson Type Feature

## TL;DR - Deploy in 5 Minutes

### 1. Backup Database (30 seconds)
```bash
mysqldump -u root -p cohortle_db > backup_$(date +%Y%m%d).sql
```

### 2. Pull Code (10 seconds)
```bash
cd /path/to/cohortle-api
git pull origin main
```

### 3. Run Migration (30 seconds)
```bash
npm run migrate
# or: npx sequelize-cli db:migrate
```

### 4. Restart App (30 seconds)
```bash
# Coolify: Redeploy from dashboard
# PM2: pm2 restart cohortle-api
# Docker: docker-compose restart api
```

### 5. Test (2 minutes)
```bash
# Test creating a lesson with type
curl -X POST https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"text","order_number":1}'

# Test getting lessons (should include type field)
curl -X GET https://api.cohortle.com/v1/api/modules/1/lessons \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What Changed?

- ✅ Added `type` column to `module_lessons` table (defaults to "video")
- ✅ Updated API to accept/return `type` field
- ✅ All existing lessons automatically get `type = 'video'`
- ✅ Backward compatible - no breaking changes

## Valid Types
`text`, `video`, `pdf`, `live_session`, `link`, `assignment`, `quiz`, `form`, `reflection`, `practical_task`

## Rollback (if needed)
```bash
npx sequelize-cli db:migrate:undo
git revert HEAD
pm2 restart cohortle-api
```

## Full Documentation
See `LESSON_TYPE_DEPLOYMENT_GUIDE.md` for detailed instructions.
