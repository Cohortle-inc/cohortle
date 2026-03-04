# WLIMP Programme Rollout - Deployment Guide

## 🎯 Overview

This guide covers deploying the WLIMP Programme Rollout feature to production. The feature enables learners to join the Workforce Leadership & Impact Mentorship Programme through code-based enrollment and access weekly structured content.

## ✅ Pre-Deployment Status

### Backend (cohortle-api)
- ✅ Database migrations created and ready
- ✅ All services implemented (EnrollmentService, ProgrammeService, ContentService)
- ✅ All API endpoints implemented and tested
- ✅ 84 passing tests (54 programme tests + 30 lesson tests)
- ✅ Auto-migration enabled (runs on deployment)

### Frontend (cohortle-web)
- ✅ All pages implemented (Join, Programme, Lesson, Dashboard)
- ✅ All components implemented and tested
- ✅ Authentication and enrollment checks in place
- ✅ Mobile optimizations complete (37.6% bundle size reduction)
- ✅ Lazy loading implemented for embedded content
- ✅ 27 passing frontend tests

## 📋 Deployment Checklist

### Phase 1: Backend Deployment (cohortle-api)

#### Step 1.1: Verify Database Migrations
The following migrations will run automatically on deployment:

1. **20260301000000-create-wlimp-weeks.js**
   - Creates `weeks` table for programme week organization
   - Adds indexes for performance

2. **20260301000001-create-wlimp-lessons.js**
   - Creates `lessons` table for lesson content
   - Links lessons to weeks via foreign key

3. **20260301000002-create-wlimp-enrollments.js**
   - Creates `enrollments` table for learner enrollments
   - Adds unique constraint on (user_id, cohort_id)

4. **20260301000003-add-enrollment-code-to-cohorts.js**
   - Adds `enrollment_code` column to cohorts table
   - Adds unique index on enrollment_code

#### Step 1.2: Deploy Backend

```bash
# 1. Ensure you're on the main branch with latest changes
cd cohortle-api
git status
git pull origin main

# 2. Verify migrations are present
ls -la migrations/2026030100000*

# 3. Deploy in Coolify
# - Open Coolify dashboard
# - Navigate to cohortle-api application
# - Click "Deploy" button
# - Wait for deployment to complete (2-3 minutes)
```

#### Step 1.3: Verify Backend Deployment

Check Coolify logs for successful migration:

```
Running Sequelize migrations...
== 20260301000000-create-wlimp-weeks: migrating =======
== 20260301000000-create-wlimp-weeks: migrated (0.123s)
== 20260301000001-create-wlimp-lessons: migrating =======
== 20260301000001-create-wlimp-lessons: migrated (0.234s)
== 20260301000002-create-wlimp-enrollments: migrating =======
== 20260301000002-create-wlimp-enrollments: migrated (0.156s)
== 20260301000003-add-enrollment-code-to-cohorts: migrating =======
== 20260301000003-add-enrollment-code-to-cohorts: migrated (0.089s)
Starting application...
Server running on port 3000
```

#### Step 1.4: Test Backend Endpoints

```bash
# Set your API URL and auth token
API_URL="https://api.cohortle.com"
TOKEN="your-auth-token"

# Test 1: Get enrolled programmes (should return empty array initially)
curl -X GET "$API_URL/v1/api/programmes/enrolled" \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"error":false,"message":"Enrolled programmes fetched successfully","programmes":[]}

# Test 2: Try to enroll with invalid code (should fail gracefully)
curl -X POST "$API_URL/v1/api/programmes/enroll" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST-2026"}'

# Expected: {"error":true,"message":"Enrollment code not found..."}
```

### Phase 2: Frontend Deployment (cohortle-web)

#### Step 2.1: Verify Environment Variables

Ensure these are set in Coolify for cohortle-web:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

#### Step 2.2: Deploy Frontend

```bash
# 1. Ensure you're on the main branch with latest changes
cd cohortle-web
git status
git pull origin main

# 2. Verify build configuration
cat next.config.mjs | grep "output"
# Should show: output: "standalone"

# 3. Deploy in Coolify
# - Open Coolify dashboard
# - Navigate to cohortle-web application
# - Click "Deploy" button
# - Wait for deployment to complete (3-5 minutes)
```

#### Step 2.3: Verify Frontend Deployment

Check Coolify logs for successful build:

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         87.4 kB
├ ○ /join                                3.8 kB         91.2 kB
├ ○ /programmes/[id]                     4.1 kB        111 kB
├ ○ /lessons/[lessonId]                  3.9 kB        89.3 kB
└ ○ /dashboard                           4.5 kB        123 kB

○  (Static)  prerendered as static content
```

#### Step 2.4: Test Frontend Pages

Visit these URLs and verify they load correctly:

1. **Homepage**: https://cohortle.com
   - ✅ Loads without errors
   - ✅ SSL certificate valid

2. **Join Page**: https://cohortle.com/join
   - ✅ Form displays correctly
   - ✅ Input field for enrollment code
   - ✅ Submit button present

3. **Dashboard**: https://cohortle.com/dashboard
   - ✅ Requires authentication (redirects to login if not logged in)
   - ✅ Shows empty state with "Join with Code" button

4. **Login**: https://cohortle.com/login
   - ✅ Login form displays
   - ✅ Can authenticate successfully

### Phase 3: Create Test Data

#### Step 3.1: Create Test Programme

Use a database client or API to create test data:

```sql
-- 1. Create a test programme
INSERT INTO programmes (name, description, start_date, created_by, type, status)
VALUES (
  'WLIMP – Workforce Leadership & Impact Mentorship Programme',
  'A comprehensive leadership development programme for emerging leaders',
  '2026-03-01',
  1, -- Replace with actual convener user ID
  'structured',
  'active'
);

-- Get the programme_id from the insert
SET @programme_id = LAST_INSERT_ID();

-- 2. Create a test cohort with enrollment code
INSERT INTO cohorts (programme_id, name, enrollment_code, start_date, status)
VALUES (
  @programme_id,
  'WLIMP 2026 Cohort 1',
  'WLIMP-2026',
  '2026-03-01',
  'active'
);

-- Get the cohort_id
SET @cohort_id = LAST_INSERT_ID();

-- 3. Create Week 1
INSERT INTO weeks (programme_id, week_number, title, start_date)
VALUES (
  @programme_id,
  1,
  'Week 1: Introduction to Leadership',
  '2026-03-01'
);

-- Get the week_id
SET @week_id = LAST_INSERT_ID();

-- 4. Create a test lesson
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

#### Step 3.2: Alternative - Use API Endpoints

If you have convener access, use the API:

```bash
# 1. Create programme
curl -X POST "$API_URL/v1/api/programmes" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP – Workforce Leadership & Impact Mentorship Programme",
    "description": "A comprehensive leadership development programme",
    "start_date": "2026-03-01"
  }'

# Save the programme_id from response

# 2. Create cohort
curl -X POST "$API_URL/v1/api/programmes/1/cohorts" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WLIMP 2026 Cohort 1",
    "enrollment_code": "WLIMP-2026",
    "start_date": "2026-03-01"
  }'

# 3. Create week
curl -X POST "$API_URL/v1/api/programmes/1/weeks" \
  -H "Authorization: Bearer $CONVENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "week_number": 1,
    "title": "Week 1: Introduction to Leadership",
    "start_date": "2026-03-01"
  }'

# Save the week_id from response

# 4. Create lesson
curl -X POST "$API_URL/v1/api/weeks/WEEK_UUID/lessons" \
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

### Phase 4: End-to-End Testing

#### Step 4.1: Test Learner Enrollment Flow

1. **Navigate to Join Page**
   - Visit: https://cohortle.com/join
   - ✅ Page loads correctly

2. **Enter Enrollment Code**
   - Enter: `WLIMP-2026`
   - Click "Join Programme"
   - ✅ Redirects to programme page

3. **View Programme Page**
   - URL: https://cohortle.com/programmes/1
   - ✅ Programme title displays
   - ✅ Week 1 section shows
   - ✅ Lesson card displays
   - ✅ "Current Week" badge shows on Week 1

4. **View Lesson**
   - Click on lesson card
   - ✅ Redirects to lesson page
   - ✅ Lesson title and description display
   - ✅ YouTube video embeds correctly
   - ✅ Back link works

5. **Check Dashboard**
   - Navigate to: https://cohortle.com/dashboard
   - ✅ Programme card displays
   - ✅ Shows "Week 1 of X"
   - ✅ Click card navigates to programme page

#### Step 4.2: Test Error Scenarios

1. **Invalid Enrollment Code**
   - Go to /join
   - Enter: `INVALID-CODE`
   - ✅ Shows error message: "Enrollment code not found"

2. **Duplicate Enrollment**
   - Try to enroll again with same code
   - ✅ Redirects to programme page (idempotent)

3. **Unauthorized Access**
   - Log out
   - Try to access: /programmes/1
   - ✅ Redirects to login page

4. **Not Enrolled Access**
   - Log in as different user
   - Try to access: /programmes/1
   - ✅ Redirects to /join page

#### Step 4.3: Test Mobile Experience

1. **Open on Mobile Device**
   - Visit: https://cohortle.com/join
   - ✅ Responsive layout works
   - ✅ Touch targets are 44x44px minimum
   - ✅ Text is readable without zooming

2. **Test Programme Page on Mobile**
   - ✅ Week sections stack vertically
   - ✅ Lesson cards display in grid
   - ✅ Navigation works smoothly

3. **Test Lesson Page on Mobile**
   - ✅ YouTube video embeds properly
   - ✅ Video controls work
   - ✅ Back link is easily tappable

#### Step 4.4: Test Performance

1. **Run Lighthouse Audit**
   ```bash
   # Install Lighthouse CLI if needed
   npm install -g lighthouse

   # Run audit
   lighthouse https://cohortle.com/join --view
   ```

   Target scores:
   - ✅ Performance: > 90
   - ✅ Accessibility: > 90
   - ✅ Best Practices: > 90
   - ✅ SEO: > 90

2. **Check Bundle Sizes**
   - Lesson page: ~89 kB First Load JS ✅
   - Programme page: ~111 kB First Load JS ✅
   - Dashboard: ~123 kB First Load JS ✅

3. **Test Load Times**
   - Homepage: < 2 seconds ✅
   - Join page: < 2 seconds ✅
   - Programme page: < 3 seconds ✅
   - Lesson page: < 3 seconds ✅

### Phase 5: Post-Deployment Verification

#### Step 5.1: Monitor Application Logs

Check for any errors in Coolify logs:

**Backend logs should show**:
```
Server running on port 3000
Database connected successfully
```

**Frontend logs should show**:
```
▲ Next.js 14.2.13
- Local:        http://0.0.0.0:3000
✓ Ready in XXXms
```

#### Step 5.2: Database Verification

Connect to database and verify tables exist:

```sql
-- Check weeks table
SELECT COUNT(*) FROM weeks;

-- Check lessons table
SELECT COUNT(*) FROM lessons;

-- Check enrollments table
SELECT COUNT(*) FROM enrollments;

-- Check cohorts have enrollment_code
SELECT id, name, enrollment_code FROM cohorts LIMIT 5;
```

#### Step 5.3: API Health Check

```bash
# Test API is responding
curl -I https://api.cohortle.com/health

# Should return: HTTP/1.1 200 OK
```

## 🚨 Troubleshooting

### Issue: Migrations Don't Run

**Symptoms**: Tables not created, columns missing

**Solution**:
1. Check Coolify logs for migration errors
2. Verify database credentials are correct
3. Run migrations manually if needed:
   ```bash
   # Via Coolify terminal
   npm run migrate
   ```

### Issue: Frontend Can't Connect to Backend

**Symptoms**: API calls fail, CORS errors

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Coolify
2. Check backend CORS configuration allows frontend domain
3. Verify backend is running and accessible

### Issue: Enrollment Code Not Working

**Symptoms**: "Code not found" error for valid code

**Solution**:
1. Verify cohort was created with enrollment_code
2. Check database: `SELECT * FROM cohorts WHERE enrollment_code = 'WLIMP-2026'`
3. Ensure migration 20260301000003 ran successfully

### Issue: Lesson Page Shows 404

**Symptoms**: Lesson page not found

**Solution**:
1. Verify lesson UUID is correct
2. Check lesson exists in database
3. Verify user is enrolled in the programme
4. Check browser console for errors

### Issue: YouTube Video Not Embedding

**Symptoms**: Video doesn't load, shows error

**Solution**:
1. Verify URL is valid YouTube URL
2. Check video is not private/restricted
3. Verify iframe is allowed (CSP headers)
4. Test with different video URL

## 📊 Success Criteria

Deployment is successful when:

- ✅ All 4 database migrations ran successfully
- ✅ Backend API responds to health checks
- ✅ Frontend loads without errors
- ✅ Learner can enroll with code
- ✅ Programme page displays correctly
- ✅ Lesson page embeds YouTube videos
- ✅ Dashboard shows enrolled programmes
- ✅ Mobile experience works smoothly
- ✅ Performance metrics meet targets
- ✅ No critical errors in logs

## 🎉 Post-Deployment Tasks

### 1. Announce to Team
- Notify team that WLIMP feature is live
- Share enrollment code for testing
- Provide feedback channels

### 2. Monitor Closely
- Watch logs for first 24 hours
- Monitor error rates
- Track user enrollments
- Check performance metrics

### 3. Gather Feedback
- Collect user feedback
- Note any issues or bugs
- Track feature usage

### 4. Plan Next Iteration
- Review optional tasks in tasks.md
- Plan for enhanced features
- Schedule follow-up improvements

## 📝 Deployment Record

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Backend Version**: _______________  
**Frontend Version**: _______________  
**Status**: ⬜ Success ⬜ Failed ⬜ Rolled Back  

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

## 🚀 Ready to Deploy!

Follow the phases above in order. The entire deployment should take 15-20 minutes.

**Questions or issues?** Check the troubleshooting section or reach out to the team.
