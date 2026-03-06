# Authentication Role Field Fix - CRITICAL

## Issues Identified

1. **Learners can't log in** - Error: "User not authenticated"
2. **Can't signup new accounts** - Registration fails
3. **Profile page returns error** - Can't load user data

## Root Cause

The users table has `role_id` (UUID foreign key to roles table), but the authentication code is trying to access `user.role` (string field that doesn't exist).

### Database Schema:
```sql
users table:
- id (INT, primary key)
- email
- first_name
- last_name
- role_id (UUID, foreign key to roles.role_id)  ← This exists
- (NO 'role' column)

roles table:
- role_id (UUID, primary key)
- name (VARCHAR) - 'student', 'convener', 'administrator', etc.
```

### Code Expecting:
```javascript
const user = await sdk.get({ email })[0];
const token = await createTokenWithRole(
  user.id,
  user.email,
  user.role || 'unassigned',  // ❌ user.role doesn't exist!
  24 * 60 * 60 * 1000
);
```

## The Fix

We need to modify `cohortle-api/routes/auth.js` to:

1. Join with roles table to get role name from role_id
2. Use proper Sequelize queries instead of BackendSDK for user fetching
3. Handle the case where role_id is NULL (unassigned users)

### Files to Modify:

1. `cohortle-api/routes/auth.js` - Fix all user queries to include role
2. `cohortle-api/services/ProfileService.js` - Already handles this correctly!

## Implementation

The fix involves changing from:
```javascript
const sdk = new BackendSDK();
sdk.setTable("users");
const user = (await sdk.get({ email }))[0];
// user.role is undefined!
```

To:
```javascript
const user = await db.users.findOne({
  where: { email },
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name']
  }]
});
const roleName = user.role ? user.role.name : 'unassigned';
```

## Impact

This fix will resolve:
- ✅ Login authentication errors
- ✅ Signup failures
- ✅ Profile page errors
- ✅ Role-based access control
- ✅ JWT token generation with correct role

## Next Steps

1. Update auth.js to use Sequelize with role joins
2. Test login with existing users
3. Test signup with new users
4. Verify profile page loads correctly
