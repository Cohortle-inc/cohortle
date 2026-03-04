# Fix Dashboard Sections - Quick Start Guide

## What Was Fixed

The live sessions and recent activity sections on the dashboard were not working due to:
1. Incorrect logic in the backend API for fetching live sessions
2. Missing error handling in the frontend

Both issues have been fixed.

## Quick Test (3 Steps)

### Step 1: Start Your Servers
```powershell
# Terminal 1 - Backend
cd cohortle-api
npm start

# Terminal 2 - Frontend  
cd cohortle-web
npm run dev
```

### Step 2: Open Dashboard and Check Console
1. Open http://localhost:3000/dashboard in your browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for messages starting with `[Dashboard]`

You should see:
```
[Dashboard] Fetching dashboard data...
[Dashboard] Data fetched successfully: { sessionsCount: 0, activitiesCount: 0 }
```

### Step 3: Create Test Data (Optional)
If you want to see the sections with data:

```powershell
# In the root directory
cd cohortle-api
node ../create-test-dashboard-data.js
```

This will create:
- 1 upcoming live session (7 days from now)
- 1 completed lesson

Then refresh your dashboard!

## What You Should See

### If No Data (Normal for New System)
- **Live Sessions**: "No upcoming live sessions scheduled."
- **Recent Activity**: "No completed lessons yet. Start learning to see your progress here!"

This is EXPECTED and CORRECT if you haven't:
- Created any live session lessons
- Completed any lessons

### If Data Exists
- **Live Sessions**: Cards showing session title, programme, date/time, and "Join" button
- **Recent Activity**: Cards showing completed lessons with relative timestamps

## Troubleshooting

### Problem: Console shows errors
**Check**:
1. Are both servers running?
2. Is the database running?
3. What's the exact error message?

**Common errors**:
- `ECONNREFUSED`: Backend not running
- `401 Unauthorized`: Not logged in
- `500 Internal Server Error`: Check backend console

### Problem: Sections are empty but should have data
**Check**:
1. Do you have live sessions in the database?
   ```sql
   SELECT * FROM lessons WHERE type = 'live_session';
   ```
2. Do you have lesson completions?
   ```sql
   SELECT * FROM lesson_completions ORDER BY completed_at DESC LIMIT 5;
   ```
3. Are the live session dates in the future?

### Problem: API calls not showing in Network tab
**Check**:
1. Are you logged in?
2. Is the user a learner (not convener)?
3. Does the user have any programme enrollments?

## Manual API Test

Open browser console on the dashboard and run:

```javascript
// Test upcoming sessions
fetch('/api/proxy/v1/api/dashboard/upcoming-sessions')
  .then(r => r.json())
  .then(data => console.log('✓ Sessions:', data))
  .catch(err => console.error('✗ Error:', err));

// Test recent activity  
fetch('/api/proxy/v1/api/dashboard/recent-activity?limit=5')
  .then(r => r.json())
  .then(data => console.log('✓ Activity:', data))
  .catch(err => console.error('✗ Error:', err));
```

Expected response:
```json
{
  "error": false,
  "message": "...",
  "sessions": [...] // or "activities": [...]
}
```

## Creating Live Sessions Manually

If you want to create live sessions through the UI:

1. Log in as a convener
2. Go to a programme
3. Create a week
4. Create a lesson with:
   - Type: "Live Session"
   - Content URL: Your Zoom/Meet link
   - Content Text: `{"sessionDate": "2026-03-15T14:00:00Z"}` (future date)

## Files Changed

1. `cohortle-api/routes/dashboard.js` - Fixed live sessions logic
2. `cohortle-web/src/app/dashboard/page.tsx` - Improved error handling

## Need More Help?

See these detailed guides:
- `DASHBOARD_FIX_SUMMARY.md` - Complete technical details
- `TEST_DASHBOARD_API.md` - Detailed testing instructions
- `DASHBOARD_SECTIONS_FIX.md` - API documentation

## Quick Checklist

- [ ] Both servers are running
- [ ] Logged in as a learner
- [ ] Enrolled in at least one programme
- [ ] Checked browser console for `[Dashboard]` logs
- [ ] Checked Network tab for API calls
- [ ] Verified API responses are successful (200 OK)

If all checkboxes are ticked and sections are empty, that's normal - you just need to create data!

---

**Bottom line**: The code is fixed. If the sections appear empty, it's because there's no data yet, which is expected for a new system. Use the test data script to populate some data and verify everything works!
