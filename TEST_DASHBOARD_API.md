# Testing Dashboard API Endpoints

## Quick Browser Console Test

Open your browser console on the dashboard page and run these commands:

### Test 1: Check if API calls are being made
```javascript
// Monitor network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch called:', args[0]);
  return originalFetch.apply(this, args);
};
```

### Test 2: Manually call the API endpoints
```javascript
// Test upcoming sessions
fetch('/api/proxy/v1/api/dashboard/upcoming-sessions')
  .then(r => r.json())
  .then(data => console.log('Upcoming sessions:', data))
  .catch(err => console.error('Error:', err));

// Test recent activity
fetch('/api/proxy/v1/api/dashboard/recent-activity?limit=5')
  .then(r => r.json())
  .then(data => console.log('Recent activity:', data))
  .catch(err => console.error('Error:', err));
```

### Test 3: Check component state
```javascript
// In React DevTools, find the DashboardPage component and check:
// - upcomingSessions state
// - recentActivity state
// - dashboardLoading state
// - dashboardError state
```

## Expected Responses

### If working correctly:
```json
// Upcoming sessions
{
  "error": false,
  "message": "Upcoming sessions fetched successfully",
  "sessions": [...]
}

// Recent activity
{
  "error": false,
  "message": "Recent activity fetched successfully",
  "activities": [...]
}
```

### If no data:
```json
// Upcoming sessions
{
  "error": false,
  "message": "No upcoming sessions",
  "sessions": []
}

// Recent activity
{
  "error": false,
  "message": "Recent activity fetched successfully",
  "activities": []
}
```

### If error:
```json
{
  "error": true,
  "message": "Error message here"
}
```

## Common Issues and Solutions

### Issue 1: Empty arrays returned
**Cause**: No data in database
**Solution**: 
1. Create a live session lesson with future date
2. Complete some lessons to generate activity

### Issue 2: 401 Unauthorized
**Cause**: Not logged in or token expired
**Solution**: Log out and log back in

### Issue 3: 500 Internal Server Error
**Cause**: Backend error (check server logs)
**Solution**: Check `cohortle-api` console for error messages

### Issue 4: Network error / CORS
**Cause**: Backend not running or proxy misconfigured
**Solution**: 
1. Ensure backend is running on correct port
2. Check `NEXT_PUBLIC_API_URL` in `.env`

### Issue 5: Components not rendering
**Cause**: Frontend state not updating
**Solution**: Check React DevTools for component state

## Debugging Steps

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Run the manual API tests** above
4. **Check the responses**:
   - Are they successful (200 OK)?
   - What data is returned?
   - Are there any errors?
5. **Go to Network tab**
6. **Refresh the page**
7. **Look for these requests**:
   - `/api/proxy/v1/api/dashboard/upcoming-sessions`
   - `/api/proxy/v1/api/dashboard/recent-activity`
8. **Click on each request** and check:
   - Status code
   - Response body
   - Request headers (is auth token present?)

## What to Report

Please provide:
1. **Console output** from the manual API tests
2. **Network tab screenshots** showing the API requests
3. **Response bodies** from both endpoints
4. **Any error messages** in the console
5. **Backend logs** if you see 500 errors

This will help identify exactly what's not working.
