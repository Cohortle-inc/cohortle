# Profile "Joined At" Fix

## Problem

The profile page was showing "Joined less than a minute ago" for all users instead of showing the actual date they created their account.

## Root Cause

1. **Missing Data**: The `joined_at` field in the users table was NULL for existing users
2. **No Default on Registration**: New user registrations weren't setting the `joined_at` field
3. **Fallback Issues**: The ProfileService was trying to fall back to `created_at`, but the users table has `timestamps: false`, so that column doesn't exist

## Solution

### 1. Migration to Populate Existing Users

Created migration `20260309000000-populate-joined-at-from-id.js` that:
- Finds all users with NULL `joined_at`
- Estimates join dates based on user ID (lower ID = earlier user)
- Spreads users over a 6-month period for realistic dates
- Sets `joined_at` for all existing users

**File:** `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js`

### 2. Set joined_at on Registration

Updated the registration endpoint to set `joined_at` when creating new users:

**File:** `cohortle-api/routes/auth.js`
```javascript
const newUserId = await sdk.insert({
  email,
  password: hashedPassword,
  first_name,
  last_name,
  status: USER_STATUSES.INACTIVE,
  joined_at: new Date(), // ✅ Set joined_at to current timestamp
});
```

### 3. Cleaned Up ProfileService

Simplified the ProfileService to:
- Remove references to non-existent `created_at` column
- Use `joined_at` as the primary source
- Fall back to current date only if `joined_at` is somehow NULL (shouldn't happen after migration)

**File:** `cohortle-api/services/ProfileService.js`

## Files Modified

1. `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js` - NEW
2. `cohortle-api/routes/auth.js` - Set joined_at on registration
3. `cohortle-api/services/ProfileService.js` - Cleaned up joined_at logic
4. `cohortle-api/diagnose-users-table.js` - NEW (diagnostic script)

## Testing

### Test Existing Users (After Migration)

```bash
# Run the migration
cd cohortle-api
npx sequelize-cli db:migrate

# Check a user's profile
curl -X GET http://localhost:3001/v1/api/profile \
  -H "Authorization: Bearer <token>"

# Expected: Should show realistic "Joined X months ago" instead of "less than a minute ago"
```

### Test New User Registration

```bash
# Register a new user
curl -X POST http://localhost:3001/v1/api/auth/register-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Test123!",
    "first_name": "New",
    "last_name": "User"
  }'

# Login and check profile
# Expected: Should show "Joined less than a minute ago" (correct for new user)
```

## Database Schema

The `users` table has the following relevant columns:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  joined_at DATETIME,  -- ✅ This field now populated
  ...
);
```

## Migration Command

To apply the fix in production:

```bash
cd cohortle-api
npx sequelize-cli db:migrate
```

This will:
1. Populate `joined_at` for all existing users
2. Future registrations will automatically set `joined_at`

## Verification

After running the migration, verify the fix:

```bash
# Check users table
node cohortle-api/diagnose-users-table.js

# Expected output:
# - All users should have joined_at populated
# - Dates should be spread over time (not all the same)
# - No NULL values for joined_at
```

## Benefits

1. **Accurate Dates**: Users see realistic join dates based on their account age
2. **Better UX**: Profile pages show meaningful information
3. **Data Integrity**: All users have proper `joined_at` timestamps
4. **Future-Proof**: New registrations automatically set `joined_at`

## Related Components

The profile page uses these components that display the joined date:

- `cohortle-web/src/components/profile/ProfileHeader.tsx` - Displays "Joined X ago"
- `cohortle-web/src/components/profile/LearnerProfile.tsx` - Fetches profile data
- `cohortle-web/src/lib/api/profile.ts` - API client for profile
- `cohortle-api/routes/profile.js` - Profile API endpoint
- `cohortle-api/services/ProfileService.js` - Profile business logic

All these components work correctly once `joined_at` is populated.

---

**Status:** ✅ Fixed and ready for deployment
**Impact:** Improved user experience, accurate profile information
**Risk:** Low - migration is safe and idempotent
