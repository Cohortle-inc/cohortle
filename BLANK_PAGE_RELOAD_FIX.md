# Blank Page on Reload Fix

## Problem
When logged in users reload the page, they see a blank page. They have to clear cookies, visit home, or logout and login again for it to work.

## Root Cause
The issue was caused by a mismatch between the data returned by the login endpoint and the profile endpoint:

1. **Login endpoint** (`/v1/api/auth/login`) returns:
   ```json
   {
     "error": false,
     "message": "login successfully",
     "token": "...",
     "user": { "id": 1, "email": "user@example.com", "role": "learner" }
   }
   ```

2. **Profile endpoint** (`/v1/api/profile`) was returning:
   ```json
   {
     "error": false,
     "message": "Profile fetched successfully",
     "user": { "id": 1, "name": "John Doe", "email": "user@example.com" },
     "stats": { ... }
   }
   ```
   
   **Missing: The `role` field!**

3. When the page reloads, `AuthContext` tries to restore the user session by:
   - Checking if auth token exists
   - Fetching user profile via `/api/proxy/v1/api/profile`
   - Setting user state with the profile data

4. Without the `role` field, the dashboard couldn't determine which dashboard to show (learner vs convener), resulting in a blank page.

## Solution

### 1. Backend Fix - ProfileService.js
Added `role` to the user attributes fetched from the database:

```javascript
// Before
attributes: ["id", "first_name", "last_name", "email", "joined_at"]

// After
attributes: ["id", "first_name", "last_name", "email", "role", "joined_at"]
```

And included it in the returned user object:

```javascript
return {
  user: {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    role: user.role,  // Added this
    profilePicture: null,
    joinedAt: user.joined_at ? user.joined_at.toISOString() : ...
  },
  stats,
};
```

### 2. Frontend Fix - AuthContext.tsx
Updated the profile data parsing to correctly extract user data from the response:

```typescript
// Before - was looking for userData.message (incorrect)
if (!userData.error && userData.message) {
  const user = userData.message;
  // ...
}

// After - correctly extracts from userData.user
if (!profileData.error && profileData.user) {
  const user = profileData.user;
  setUser({
    id: user.id.toString(),
    email: user.email,
    username: user.email.split('@')[0],
    name: user.name || user.email,
    role: user.role,  // Now properly included
    profilePicture: user.profilePicture,
  });
}
```

Also added better error handling to clear invalid tokens when profile fetch fails.

## Testing
To verify the fix:

1. Login as a learner or convener
2. Reload the page (F5 or Ctrl+R)
3. The page should load correctly without showing a blank screen
4. The correct dashboard should be displayed based on the user's role

## Files Changed
- `cohortle-api/services/ProfileService.js` - Added role field to profile response
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Fixed profile data parsing and added error handling
