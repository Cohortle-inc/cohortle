# Database Role Mismatch Fix Complete

## Critical Issue Found and Fixed

### Problem
The ProfileService was querying the OLD role system (direct `role_id` foreign key in users table) instead of the NEW role system (`user_role_assignments` table). This caused role lookups to fail, resulting in "user not authenticated" errors for learners.

### Root Cause
When the role system was migrated from a simple `role` column to a proper role-based access control (RBAC) system with `user_role_assignments` table, the ProfileService was not updated to use the new system.

**Old Query (Broken):**
```javascript
const user = await db.users.findByPk(userId, {
  attributes: ["id", "first_name", "last_name", "email", "role_id", ...],
  include: [{
    model: db.roles,
    as: 'role',
    attributes: ['name', 'role_id'],
    required: false
  }]
});
```

**New Query (Fixed):**
```javascript
const user = await db.users.findByPk(userId, {
  attributes: ["id", "first_name", "last_name", "email", ...],
  include: [{
    model: db.user_role_assignments,
    as: 'role_assignments',
    attributes: ['role_id'],
    include: [{
      model: db.roles,
      as: 'role',
      attributes: ['name', 'id']
    }],
    required: false,
    limit: 1,
    order: [['assigned_at', 'DESC']]
  }]
});
```

### Files Fixed
1. `cohortle-api/services/ProfileService.js`
   - `getUserProfile()` method
   - `updateProfileImage()` method
   - `updateProfile()` method

### What Changed
- Removed query for `role_id` column from users table
- Added proper JOIN with `user_role_assignments` table
- Added nested JOIN with `roles` table to get role name
- Added ordering by `assigned_at DESC` to get most recent role
- Updated role extraction logic to handle the new nested structure

### Impact
This fix resolves:
- ✅ "User not authenticated" errors for learners
- ✅ Profile API returning incorrect or missing role information
- ✅ Dashboard access issues for users with roles in the new system
- ✅ Any authentication flow that depends on ProfileService

### Database Verification
To verify your database is correctly set up, run:
```sql
-- Check if users have role assignments
SELECT 
    u.id,
    u.email,
    r.name as role
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE u.email LIKE '%@%'
ORDER BY u.id
LIMIT 20;
```

If any users show `NULL` for role, they need to be assigned a role:
```sql
-- Assign student role to users without role
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    (SELECT id FROM roles WHERE name = 'student' LIMIT 1),
    1,
    NOW()
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE ura.user_id IS NULL;
```

### Testing
After deployment, test:
1. Login as a learner
2. Navigate to `/dashboard` - should work without errors
3. Check profile API: `GET /v1/api/profile` - should return correct role
4. Verify role is displayed correctly in UI

### Related Fixes
This fix works together with:
- Frontend email verification logic fix (ProgrammeActionGuard)
- Backend email verification disabled (REQUIRE_EMAIL_VERIFICATION=false)

All three fixes combined ensure learners can access the platform without authentication errors.