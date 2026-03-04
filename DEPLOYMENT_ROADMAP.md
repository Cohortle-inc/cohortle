# Deployment Roadmap - Lesson Type Feature

## Current Status: Backend Ready ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ROADMAP                        │
└─────────────────────────────────────────────────────────────┘

Phase 1: Frontend Development          ✅ COMPLETE
├── Lesson type system                 ✅ Done
├── Type selection modal               ✅ Done
├── All lesson editors                 ✅ Done
├── YouTube integration                ✅ Done
└── Property-based tests               ✅ Done

Phase 2: Backend Development           ✅ COMPLETE
├── Database migration                 ✅ Done
├── Model updates                      ✅ Done
├── API route updates                  ✅ Done
├── Documentation                      ✅ Done
└── Test scripts                       ✅ Done

Phase 3: Backend Deployment            ⏳ NEXT STEP
├── Backup database                    ⏳ To do
├── Pull latest code                   ⏳ To do
├── Run migration                      ⏳ To do
├── Restart application                ⏳ To do
└── Run tests                          ⏳ To do

Phase 4: Frontend Build                ⏳ PENDING
├── Build with EAS                     ⏳ To do
├── Install on phone                   ⏳ To do
├── Test all features                  ⏳ To do
└── Deploy to stores (optional)        ⏳ To do
```

## Quick Action Plan

### Step 1: Deploy Backend (5 minutes)
```bash
# 1. Backup
mysqldump -u root -p cohortle_db > backup.sql

# 2. Deploy
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api
git pull origin main
npm run migrate

# 3. Restart (via Coolify dashboard or PM2)
# Coolify: Click "Redeploy" in dashboard
# PM2: pm2 restart cohortle-api

# 4. Test
test_lesson_types.bat
```

### Step 2: Build Frontend (10-15 minutes)
```bash
cd c:\Users\Sal\Desktop\CODEBASE\cohortz

# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android (development build)
eas build --profile development --platform android

# Or build for iOS
eas build --profile development --platform ios

# Download and install on phone when build completes
```

### Step 3: Test on Phone (5 minutes)
- Install the built app on your phone
- Login to your account
- Navigate to a module
- Try creating lessons of different types:
  - Text lesson
  - Video lesson (with YouTube URL)
  - Quiz
  - PDF
  - Live session
- Verify they save and display correctly

## Files Reference

### Backend Files (cohortle-api/)
```
📁 cohortle-api/
├── 📄 QUICK_DEPLOY.md                    ← Start here!
├── 📄 LESSON_TYPE_DEPLOYMENT_GUIDE.md    ← Detailed guide
├── 📄 BACKEND_CHANGES_SUMMARY.md         ← What changed
├── 📄 README_LESSON_TYPES.md             ← Overview
├── 🧪 test_lesson_types.bat              ← Test script (Windows)
├── 🧪 test_lesson_types.sh               ← Test script (Linux/Mac)
├── 📁 migrations/
│   └── 20260218000000-add-type-to-module-lessons.js
├── 📁 models/
│   └── module_lessons.js                 (modified)
└── 📁 routes/
    └── lesson.js                         (modified)
```

### Frontend Files (cohortz/)
```
📁 cohortz/
├── 📄 BACKEND_SYNC_CHECKLIST.md          ← Updated status
├── 📄 DATABASE_MIGRATION.sql             ← SQL reference
├── 📁 types/
│   └── lessonTypes.ts                    ← Type definitions
├── 📁 components/lessons/
│   ├── UnitTypeCard.tsx
│   └── UnitTypeSelectionModal.tsx
└── 📁 app/convener-screens/(cohorts)/community/
    ├── textLessonEditor.tsx
    ├── pdfLessonEditor.tsx
    ├── linkLessonEditor.tsx
    ├── liveSessionEditor.tsx
    └── quizEditor.tsx
```

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Frontend Development | 2 days | ✅ Complete |
| Backend Development | 1 hour | ✅ Complete |
| Backend Deployment | 5 minutes | ⏳ Next |
| Frontend Build | 15 minutes | ⏳ Pending |
| Testing on Phone | 5 minutes | ⏳ Pending |
| **Total** | **~2 days** | **90% Complete** |

## What's Working Now

### Frontend ✅
- Type selection modal with 10 lesson types
- All lesson editors (text, video, PDF, quiz, live session, link)
- YouTube video integration
- Type-specific icons in lesson lists
- Property-based tests for type validation

### Backend ✅
- Migration file ready to add `type` column
- Model updated with type field
- API routes accept and return `type` field
- Swagger documentation updated
- Test scripts ready

### What's Left ⏳
- Deploy backend (5 minutes)
- Build frontend app (15 minutes)
- Test on phone (5 minutes)

## Deployment Commands Cheat Sheet

### Backend Deployment
```bash
# Navigate to backend
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Backup database
mysqldump -u root -p cohortle_db > backup_$(date +%Y%m%d).sql

# Pull and deploy
git pull origin main
npm run migrate

# Restart (choose one)
# Option 1: Coolify - Use dashboard to redeploy
# Option 2: PM2
pm2 restart cohortle-api
# Option 3: Docker
docker-compose restart api

# Test
test_lesson_types.bat
```

### Frontend Build
```bash
# Navigate to frontend
cd c:\Users\Sal\Desktop\CODEBASE\cohortz

# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios

# Check build status
eas build:list
```

## Troubleshooting

### Backend Issues

**Migration fails**
```bash
# Check migration status
npx sequelize-cli db:migrate:status

# If already run, skip to restart
```

**API returns 500 error**
```bash
# Check logs
pm2 logs cohortle-api

# Verify migration ran
mysql -u root -p cohortle_db
DESCRIBE module_lessons;
# Should show 'type' column
```

**Tests fail**
```bash
# Check if backend is running
curl https://api.cohortle.com/health

# Check authentication token in test script
# Edit test_lesson_types.bat and update TOKEN variable
```

### Frontend Build Issues

**EAS not installed**
```bash
npm install -g eas-cli
```

**Not logged in**
```bash
eas login
```

**Build fails**
```bash
# Check build logs
eas build:list
eas build:view [BUILD_ID]
```

## Success Criteria

### Backend Deployment Success ✅
- [ ] Migration runs without errors
- [ ] `type` column exists in database
- [ ] API returns `type` field in GET requests
- [ ] Test script passes all tests
- [ ] No errors in application logs

### Frontend Build Success ✅
- [ ] EAS build completes successfully
- [ ] App installs on phone
- [ ] Can login to app
- [ ] Can create lessons of different types
- [ ] Lessons save and display correctly

## Support Resources

### Documentation
- Backend: `cohortle-api/QUICK_DEPLOY.md`
- Frontend: `cohortz/BACKEND_SYNC_CHECKLIST.md`
- Full guide: `cohortle-api/LESSON_TYPE_DEPLOYMENT_GUIDE.md`

### Testing
- Backend tests: `cohortle-api/test_lesson_types.bat`
- Frontend tests: `cohortz/__tests__/api/lessonTypes.pbt.ts`

### Logs
```bash
# Backend logs
pm2 logs cohortle-api

# Database check
mysql -u root -p cohortle_db
DESCRIBE module_lessons;

# Migration status
npx sequelize-cli db:migrate:status
```

---

## Ready to Deploy? 🚀

You're all set! The backend code is ready and waiting in your repository. Just follow Step 1 above to deploy the backend, then move on to building the frontend app.

**Next Action**: Open `cohortle-api/QUICK_DEPLOY.md` and follow the 5-minute deployment guide.
