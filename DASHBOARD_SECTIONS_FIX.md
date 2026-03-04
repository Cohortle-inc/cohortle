# Dashboard Live Sessions and Recent Activity Fix

## Issues Identified

### 1. Live Sessions Not Working
**Problem**: The live sessions endpoint was using incorrect logic to fetch and display sessions:
- Using `content_url` as the `dateTime` which is incorrect
- Not properly parsing session dates from lesson data
- Not filtering for future sessions only

**Fix Applied**: Updated `/v1/api/dashboard/upcoming-sessions` endpoint in `cohortle-api/routes/dashboard.js`:
- Now uses Sequelize with proper associations to fetch live session lessons
- Parses session dates from `content_text` field (expects JSON with `sessionDate` field or ISO date string)
- Filters to only show future sessions
- Properly sorts sessions chronologically

### 2. Recent Activity Not Working
**Problem**: The recent activity section may not be displaying due to:
- Missing lesson completions in the database
- Association issues between models
- Frontend not handling empty states properly

**Status**: The backend implementation looks correct. The `ProgressService.getRecentActivity()` method properly:
- Queries `lesson_completions` table
- Includes associations to lessons, weeks, and programmes
- Returns formatted activity data

## What to Check

### Frontend Checks
1. **Open browser DevTools** and go to the Network tab
2. **Navigate to the dashboard** and check for these API calls:
   - `/v1/api/dashboard/upcoming-sessions`
   - `/v1/api/dashboard/recent-activity`
3. **Check the responses**:
   - Are they returning 200 OK?
   - What data is in the response body?
   - Are there any errors?

### Backend Checks
1. **Check if live sessions exist** in the database:
   ```sql
   SELECT * FROM lessons WHERE type = 'live_session';
   ```

2. **Check if lesson completions exist**:
   ```sql
   SELECT * FROM lesson_completions ORDER BY completed_at DESC LIMIT 10;
   ```

3. **Check the lesson content_text format** for live sessions:
   - Should contain JSON: `{"sessionDate": "2026-03-10T14:00:00Z"}`
   - Or ISO date string: `"2026-03-10T14:00:00Z"`

### Testing the Fix

#### Test Live Sessions
1. Create a live session lesson with proper date:
   ```javascript
   // In the lesson creation, set:
   type: 'live_session'
   content_url: 'https://zoom.us/j/123456789' // Join URL
   content_text: '{"sessionDate": "2026-03-10T14:00:00Z"}' // Future date
   ```

2. Verify it appears in the dashboard

#### Test Recent Activity
1. Complete a lesson (click the "Mark as Complete" button)
2. Check if it appears in the Recent Activity section
3. If not, check the browser console for errors

## API Response Format

### Upcoming Sessions Response
```json
{
  "error": false,
  "message": "Upcoming sessions fetched successfully",
  "sessions": [
    {
      "id": "uuid",
      "title": "Live Q&A Session",
      "programmeName": "Programme Name",
      "programmeId": 1,
      "dateTime": "2026-03-10T14:00:00.000Z",
      "joinUrl": "https://zoom.us/j/123456789"
    }
  ]
}
```

### Recent Activity Response
```json
{
  "error": false,
  "message": "Recent activity fetched successfully",
  "activities": [
    {
      "id": "lesson-uuid",
      "title": "Lesson Title",
      "programmeName": "Programme Name",
      "completedAt": "2026-03-04T10:30:00.000Z"
    }
  ]
}
```

## Next Steps

1. **Start the backend server** if not running
2. **Open the dashboard** in the browser
3. **Check the Network tab** for API responses
4. **Check the Console tab** for any JavaScript errors
5. **Report back** with:
   - What you see in the Network tab
   - Any error messages
   - Whether you have live sessions or completed lessons in the database

## Quick Test Commands

### Check if backend is running:
```powershell
curl http://localhost:3000/v1/api/health
```

### Test the endpoints directly (replace TOKEN with your auth token):
```powershell
# Upcoming sessions
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/v1/api/dashboard/upcoming-sessions

# Recent activity
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/v1/api/dashboard/recent-activity?limit=5
```

## Files Modified
- `cohortle-api/routes/dashboard.js` - Fixed live sessions endpoint logic
