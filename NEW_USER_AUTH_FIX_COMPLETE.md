# New User Authentication Issue - Root Cause & Fix

## Problem Summary

New users were experiencing "user not authenticated" errors after signup, even though:
- They successfully received welcome emails
- They could see the signup confirmation
- Old accounts worked fine

When they tried to log in, they got "invalid email and password" response.

## Root Cause Analysis

The issue was in the **role retrieval logic** during login:

### The Flow That Failed:

1. **Signup**: User creates account → `RoleAssignmentService.assignRole()` is called
2. **Token Creation**: JWT token is created with the assigned role (e.g., `'student'`)
3. **Welcome Email**: Sent successfully (doesn't depend on role)
4. **User Logs In**: Calls login endpoint
5. **Role Lookup Fails**: `getUserWithRole()` function does a LEFT JOIN with roles table
6. **Missing role_id**: If `role_id` field in users table is NULL or mismatched, JOIN returns NULL
7. **Default to 'unassigned'**: Role defaults to `'unassigned'` instead of actual role
8. **JWT Token**: Created with `role: 'unassigned'`
9. **Frontend Rejects**: Frontend treats `'unassigned'` as unauthenticated

### Why Old Accounts Worked:

- Old accounts were created before the new role system
- They had `role_id` properly set (either manually or through migrations)
- The LEFT JOIN succeeded, returning the correct role
- Login worked normally

### Why Welcome Emails Still Worked:

- Email sending happens **before** role validation
- It doesn't depend on the role assignment success
- Email is sent regardless of role issues

## The Fix

### 1. Enhanced `getUserWithRole()` Function

**File**: `cohortle-api/routes/auth.js`

The function now uses a **multi-level fallback strategy**:

```javascript
// Level 1: Try denormalized role_id field (fastest)
if (user.role && user.role.name) {
  roleName = user.role.name;
}

// Level 2: If role_id is set but JOIN failed, query directly
else if (user.role_id) {
  const role = await db.roles.findByPk(user.role_id);
  if (role) {
    roleName = role.name;
  }
}

// Level 3: Check user_role_assignments table (source of truth)
if (roleName === 'unassigned') {
  const activeAssignment = await db.user_role_assignments.findOne({...});
  if (activeAssignment && activeAssignment.role) {
    roleName = activeAssignment.role.name;
    // Update denormalized field for future queries
    await db.users.update({ role_id: activeAssignment.role_id }, {...});
  }
}
```

**Benefits**:
- Checks the source of truth (`user_role_assignments` table)
- Auto-repairs denormalized `role_id` field when found
- Handles all edge cases (NULL role_id, JOIN failures, etc.)

### 2. Improved Signup Error Handling

**File**: `cohortle-api/routes/auth.js`

Added fallback mechanism if `RoleAssignmentService.assignRole()` fails:

```javascript
if (!roleAssignment.success) {
  // Try to manually set role_id as fallback
  try {
    const role = await db.roles.findOne({ where: { name: assignedRole } });
    if (role) {
      await db.users.update(
        { role_id: role.role_id },
        { where: { id: newUserId } }
      );
    }
  } catch (fallbackError) {
    console.error('Fallback role assignment also failed:', fallbackError);
  }
}
```

**Benefits**:
- Ensures `role_id` is set even if the full role assignment fails
- Provides a safety net for edge cases
- Logs failures for debugging

## Repair Scripts

### 1. Diagnostic Script: `diagnose-new-user-auth.js`

Identifies users with role assignment issues:

```bash
node diagnose-new-user-auth.js
```

**Output**:
- Lists recent users and their role status
- Shows mismatches between `role_id` and `user_role_assignments`
- Identifies users with NULL roles

### 2. Fix Script: `fix-new-user-roles.js`

Repairs existing users with missing role assignments:

```bash
node fix-new-user-roles.js
```

**What it does**:
- Finds users created in last 24 hours
- Checks for active role assignments
- Updates `role_id` field if mismatched
- Auto-assigns 'student' role if completely missing
- Provides summary of fixes applied

## How to Deploy

### Step 1: Deploy Code Changes

```bash
# Push the updated auth.js file
git add cohortle-api/routes/auth.js
git commit -m "Fix: Improve role retrieval logic for new users"
git push
```

### Step 2: Run Diagnostic (Optional but Recommended)

```bash
cd cohortle-api
node ../diagnose-new-user-auth.js
```

This shows you the current state of user roles.

### Step 3: Fix Existing Users (If Needed)

```bash
cd cohortle-api
node ../fix-new-user-roles.js
```

This repairs any users who have role assignment issues.

### Step 4: Test with New Signup

1. Create a new test account
2. Verify welcome email is received
3. Log out and log back in
4. Verify you can access the dashboard (not "user not authenticated")

## Verification

### For New Users Going Forward:

1. **Signup**: User creates account
2. **Check Database**: 
   - `users.role_id` should be set
   - `user_role_assignments` should have active entry
3. **Login**: Should work without "user not authenticated" error
4. **Dashboard**: Should load normally

### For Existing Affected Users:

Run the fix script to repair their role assignments:

```bash
node fix-new-user-roles.js
```

Then have them log in again.

## Technical Details

### Database Tables Involved:

1. **users**: 
   - `role_id` (denormalized field for performance)
   - `email_verified` (for MVP mode)

2. **user_role_assignments**: 
   - Source of truth for active role assignments
   - `status: 'active'`
   - `effective_from` and `effective_until` for time-based assignments

3. **roles**: 
   - Lookup table for role names

### Key Functions:

- `getUserWithRole()`: Enhanced to check all three sources
- `RoleAssignmentService.assignRole()`: Creates assignment and updates `role_id`
- Signup endpoint: Now has fallback if role assignment fails

## Monitoring

### Watch for These Logs:

```
// Good - role found via denormalized field
"User role retrieved from role_id field"

// Good - role found via user_role_assignments
"User role retrieved from active assignment"

// Warning - fallback was needed
"Fallback: Manually set role_id for user"

// Error - role assignment failed
"Failed to assign role during registration"
```

### Check These Metrics:

- Number of users with `role_id = NULL`
- Number of users with mismatched `role_id` vs `user_role_assignments`
- Login success rate for new users

## FAQ

**Q: Will this affect existing users?**
A: No. The fix is backward compatible and only improves role lookup logic.

**Q: Do I need to run the fix script?**
A: Only if you have users created before this fix who are experiencing issues. New users will work correctly with the code changes alone.

**Q: What if a user still gets "user not authenticated"?**
A: Run the diagnostic script to check their role status, then run the fix script to repair.

**Q: Why does the fix script assign 'student' role by default?**
A: Because most new users are students. If they need a different role, admins can change it via the role management system.

## Related Files

- `cohortle-api/routes/auth.js` - Main auth endpoints
- `cohortle-api/services/RoleAssignmentService.js` - Role assignment logic
- `cohortle-api/models/user_role_assignments.js` - Role assignment model
- `cohortle-web/src/middleware.ts` - Frontend auth middleware
- `cohortle-web/src/lib/contexts/AuthContext.tsx` - Frontend auth context

## Rollback Plan

If issues occur, revert the auth.js changes:

```bash
git revert <commit-hash>
git push
```

The system will fall back to the original (less robust) role lookup logic.
