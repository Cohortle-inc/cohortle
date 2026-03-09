# Convener Role Redirect Fix

## Problem
User with email `wecarefng@gmail.com` (user ID 24) was upgraded to convener role in the database, but after login was being redirected to the learner dashboard instead of the convener dashboard.

## Root Cause
The `ProfileService.getUserProfile()` method was querying the old `role` field directly from the `users` table instead of joining with the `roles` table to get the role name from the new role system.

### Evidence from Logs
```sql
-- Login query correctly joins with roles table
SELECT `users`.`id`, ..., `role`.`name` AS `role.name`, `role`.`role_id` AS `role.role_id` 
FROM `users` AS `users` 
LEFT OUTER JOIN `roles` AS `role` ON `users`.`role_id` = `role`.`role_id` 
WHERE `users`.`email` = 'wecarefng@gmail.com';

-- Profile query was missing the role join
SELECT `id`, `first_name`, `last_name`, `email`, `role`, `joined_at`, `profile_image`, `bio`, `linkedin_username` 
FROM `users` AS `users` 
WHERE `users`.`id` = 24;
```

The profile query was selecting the old `role` field (which is NULL or outdated) instead of joining with the `roles` table.

## Solution
Updated `ProfileService.js` to use the role system consistently:

### Changes Made

1. **getUserProfile() method** - Now joins with roles table:
```javascript
const user = await db.users.findByPk(userId, {
  attributes: ["id", "first_name", "last_name", "email", "role_id", "joined_at", "profile_image", "bio", "linkedin_username"],
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name', 'role_id'],
    required: false // LEFT JOIN - user might not have a role yet
  }]
});

const roleName = user.role ? user.role.name : 'unassigned';
```

2. **updateProfileImage() method** - Also updated to use role system when returning user profile

3. **updateProfile() method** - Also updated to use role system when returning user profile

## How the Redirect Works

1. User logs in → `/v1/api/auth/login` returns JWT with `role: 'convener'`
2. Frontend calls `/v1/api/profile` to get user details
3. Profile endpoint now correctly returns `role: 'convener'` from the roles table
4. Dashboard page checks user role:
   ```typescript
   useEffect(() => {
     if (!authLoading && user?.role === 'convener') {
       router.replace('/convener/dashboard');
     }
   }, [user, authLoading, router]);
   ```
5. User is redirected to `/convener/dashboard`

## Testing

### Manual Test
1. Log in with convener account: `wecarefng@gmail.com`
2. Verify redirect to `/convener/dashboard` (not `/dashboard`)
3. Check browser console for profile API response - should show `role: 'convener'`

### API Test
```powershell
# Get token
$loginResponse = Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"wecarefng@gmail.com","password":"YOUR_PASSWORD"}'

$token = $loginResponse.token

# Check profile
$profileResponse = Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/profile" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}

# Should show role: 'convener'
$profileResponse.user.role
```

## Files Modified
- `cohortle-api/services/ProfileService.js` - Updated all methods to use role system

## Deployment
This fix needs to be deployed to production for the convener account to work correctly.

## Related Issues
- Role system migration completed in previous sessions
- User `wecarefng@gmail.com` already upgraded to convener via migration script
- This fix ensures the profile endpoint returns the correct role from the new system
