# WLIMP Programme Rollout - Deployment Execution

## ✅ Automated Steps Completed

### Backend (cohortle-api)
- ✅ All changes committed to Git
- ✅ Pushed to GitHub (commit: 7e027da)
- ✅ 40 files changed, 14,635 insertions
- ✅ Migrations ready: 20260301000000-*.js (4 files)
- ✅ Services implemented: EnrollmentService, ProgrammeService, ContentService
- ✅ 84 passing tests

### Frontend (cohortle-web)
- ✅ All changes committed to Git
- ✅ Pushed to GitHub (commit: 337fc13)
- ✅ 22 files changed, 2,179 insertions
- ✅ Pages implemented: /join, /programmes/[id], /lessons/[lessonId]
- ✅ 27 passing tests
- ✅ Bundle optimizations applied

---

## 🚀 MANUAL DEPLOYMENT STEPS (Required)

### Phase 1: Deploy Backend (5-7 minutes)

#### Step 1.1: Open Coolify Dashboard
1. Navigate to your Coolify dashboard
2. Find the **cohortle-api** application

#### Step 1.2: Deploy Backend
1. Click the **"Deploy"** button
2. Wait for deployment to complete (2-3 minutes)
3. Monitor the build logs

#### Step 1.3: Verify Migrations Ran
Look for these lines in the deployment logs:

```
Running Sequelize migrations...
== 20260301000000-create-wlimp-weeks: migrating =======
== 20260301000000-create-wlimp-weeks: migrated (0.XXXs)
== 20260301000001-create-wlimp-lessons: migrating =======
== 20260301000001-create-wlimp-lessons: migrated (0.XXXs)
== 20260301000002-create-wlimp-enrollments: migrating =======
== 20260301000002-create-wlimp-enrollments: migrated (0.XXXs)
== 20260301000003-add-enrollment-code-to-cohorts: migrating =======
== 20260301000003-add-enrollment-code-to-cohorts: migrated (0.XXXs)
Starting application...
Server running on port 3000
```

✅ **Success Indicator**: All 4 migrations show "migrated" status

❌ **If migrations fail**: Check the troubleshooting section in WLIMP_DEPLOYMENT_GUIDE.md

---

### Phase 2: Deploy Frontend (5-7 minutes)

#### Step 2.1: Open Coolify Dashboard
1. Navigate to your Coolify dashboard
2. Find the **cohortle-web** application

#### Step 2.2: Verify Environment Variables
Ensure these are set in Coolify:
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `PORT=3000`
- `HOST=0.0.0.0`
- `NEXT_PUBLIC_API_URL=https://api.cohortle.com`

#### Step 2.3: Deploy Frontend
1. Click the **"Deploy"** button
2. Wait for deployment to complete (3-5 minutes)
3. Monitor the build logs

#### Step 2.4: Verify Build Success
Look for these lines in the deployment logs:

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
├ ○ /join                                3.8 kB         91.2 kB
├ ○ /programmes/[id]                     4.1 kB        111 kB
├ ○ /lessons/[lessonId]                  3.9 kB        89.3 kB
└ ○ /dashboard                           4.5 kB        123 kB
```

✅ **Success Indicator**: Build completes without errors, bundle sizes match expectations

---

### Phase 3: Create Test Data (10 minutes)

You need to create test programme data to verify the deployment. Choose one method:

#### Option A: Using Database Client (Recommended)

Connect to your production database and run:

```sql
-- 1. Create test programme
INSERT INTO programmes (name, description, start_date, created_by, type, status)
VALUES (
  'WLIMP – Workforce Leadership & Impact Mentorship Programme',
  'A comprehensive leadership development programme for emerging leaders',
  '2026-03-01',
  1, -- Replace with actual convener user ID
  'structured',
  'active'
);

SET @programme_id = LAST_INSERT_ID();

-- 2. Create cohort with enrollment code
INSERT INTO cohorts (programme_id, name, enrollment_code, start_date, status)
VALUES (
  @programme_id,
  'WLIMP 2026 Cohort 1',
  'WLIMP-2026',
  '2026-03-01',
  'active'
);

SET @cohort_id = LAST_INSERT_ID();

-- 3. Create Week 1
INSERT INTO weeks (programme_id, week_number, title, start_date)
VALUES (
  @programme_id,
  1,
  'Week 1: Introduction to Leadership',
  '2026-03-01'
);

SET @week_id = LAST_INSERT_ID();

-- 4. Create test lesson
INSERT INTO lessons (week_id, title, description, content_type, content_url, order_index)
VALUES (
  @week_id,
  'Welcome to WLIMP',
  'An introduction to the programme and what to expect',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  0
);
```

#### Option B: Using API Endpoints

If you have convener access, use these curl commands:

```bash
API_URL="https://api.cohortle.com"
CONVENER_TOKEN="your-convener-token"

# 1. Create programme
curl -X POST "$API_URL/v1/api/programmes" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP – Workforce Leadership & Impact Mentorship Programme",
    "description": "A comprehensive leadership development programme",
    "start_date": "2026-03-01"
  }'

# Save the programme_id from response, then:

# 2. Create cohort (replace PROGRAMME_ID)
curl -X POST "$API_URL/v1/api/programmes/PROGRAMME_ID/cohorts" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP 2026 Cohort 1",
    "enrollment_code": "WLIMP-2026",
    "start_date": "2026-03-01"
  }'

# 3. Create week (replace PROGRAMME_ID)
curl -X POST "$API_URL/v1/api/programmes/PROGRAMME_ID/weeks" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "week_number": 1,
    "title": "Week 1: Introduction to Leadership",
    "start_date": "2026-03-01"
  }'

# Save the week_id from response, then:

# 4. Create lesson (replace WEEK_ID)
curl -X POST "$API_URL/v1/api/weeks/WEEK_ID/lessons" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Welcome to WLIMP",
    "description": "An introduction to the programme",
    "content_type": "video",
    "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "order_index": 0
  }'
```

---

### Phase 4: End-to-End Testing (10 minutes)

#### Test 1: Join Page
1. Visit: `https://cohortle.com/join`
2. ✅ Page loads without errors
3. ✅ Form displays with code input field

#### Test 2: Enrollment Flow
1. Enter enrollment code: `WLIMP-2026`
2. Click "Join Programme"
3. ✅ Redirects to programme page
4. ✅ Programme title displays
5. ✅ Week 1 section shows
6. ✅ Lesson card displays

#### Test 3: Lesson Viewing
1. Click on lesson card
2. ✅ Redirects to lesson page
3. ✅ Lesson title and description display
4. ✅ YouTube video embeds correctly
5. ✅ Back link works

#### Test 4: Dashboard
1. Navigate to: `https://cohortle.com/dashboard`
2. ✅ Programme card displays
3. ✅ Shows "Week 1 of X"
4. ✅ Click card navigates to programme page

#### Test 5: Error Scenarios
1. Go to `/join` and enter invalid code: `INVALID-CODE`
2. ✅ Shows error message
3. Log out and try to access `/programmes/1`
4. ✅ Redirects to login page

#### Test 6: Mobile Experience
1. Open on mobile device or use browser DevTools
2. ✅ Responsive layout works
3. ✅ Touch targets are adequate
4. ✅ Navigation works smoothly

---

### Phase 5: Post-Deployment Verification (5 minutes)

#### Check 1: Backend Health
```bash
curl -I https://api.cohortle.com/health
# Should return: HTTP/1.1 200 OK
```

#### Check 2: Database Tables
Connect to database and verify:

```sql
-- Check tables exist
SHOW TABLES LIKE 'weeks';
SHOW TABLES LIKE 'lessons';
SHOW TABLES LIKE 'enrollments';

-- Check cohorts have enrollment_code column
DESCRIBE cohorts;

-- Check migration tracking
SELECT * FROM SequelizeMeta WHERE name LIKE '202603010000%';
```

#### Check 3: Application Logs
- Backend logs show: "Server running on port 3000"
- Frontend logs show: "Ready in XXXms"
- No critical errors in logs

---

## 📊 Success Criteria

Deployment is successful when ALL of these are true:

- ✅ Backend deployed without errors
- ✅ All 4 database migrations ran successfully
- ✅ Frontend deployed without errors
- ✅ Bundle sizes match expectations (~89-123 kB)
- ✅ Test data created (programme, cohort, week, lesson)
- ✅ Learner can enroll with code `WLIMP-2026`
- ✅ Programme page displays correctly
- ✅ Lesson page embeds YouTube video
- ✅ Dashboard shows enrolled programme
- ✅ Mobile experience works smoothly
- ✅ No critical errors in logs

---

## 🚨 Troubleshooting

### Issue: Migrations Don't Run
**Solution**: Check Coolify logs for errors. Run manually if needed:
```bash
# Via Coolify terminal
npm run migrate
```

### Issue: Frontend Can't Connect to Backend
**Solution**: Verify `NEXT_PUBLIC_API_URL` is set correctly in Coolify environment variables

### Issue: Enrollment Code Not Working
**Solution**: Verify cohort was created with `enrollment_code` column populated

### Issue: YouTube Video Not Embedding
**Solution**: Verify URL is valid and video is not private/restricted

For more troubleshooting, see: `WLIMP_DEPLOYMENT_GUIDE.md`

---

## 📝 Deployment Checklist

Use this checklist to track your progress:

- [ ] Phase 1: Backend deployed in Coolify
- [ ] Phase 1: Migrations verified in logs
- [ ] Phase 2: Frontend deployed in Coolify
- [ ] Phase 2: Build verified in logs
- [ ] Phase 3: Test data created
- [ ] Phase 4: Join page tested
- [ ] Phase 4: Enrollment flow tested
- [ ] Phase 4: Lesson viewing tested
- [ ] Phase 4: Dashboard tested
- [ ] Phase 4: Error scenarios tested
- [ ] Phase 4: Mobile experience tested
- [ ] Phase 5: Backend health checked
- [ ] Phase 5: Database verified
- [ ] Phase 5: Logs checked

---

## 🎉 Next Steps After Successful Deployment

1. **Announce to team** that WLIMP feature is live
2. **Share enrollment code** `WLIMP-2026` for testing
3. **Monitor logs** closely for first 24 hours
4. **Gather feedback** from early users
5. **Plan next iteration** (review optional tasks in tasks.md)

---

## 📞 Need Help?

- Review full deployment guide: `WLIMP_DEPLOYMENT_GUIDE.md`
- Check backend auto-migration setup: `cohortle-api/AUTO_MIGRATION_SETUP.md`
- Check frontend deployment checklist: `cohortle-web/DEPLOYMENT_CHECKLIST.md`

---

**Estimated Total Time**: 35-45 minutes

**Ready to deploy?** Start with Phase 1 above!
