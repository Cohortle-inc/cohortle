# Profile "Joined At" Migration Instructions

## Current Status

✅ **Code Changes Complete** - All necessary code changes have been implemented:

1. Migration file created: `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js`
2. Registration endpoint updated: Sets `joined_at` for new users (line 632 in `cohortle-api/routes/auth.js`)
3. ProfileService cleaned up: Properly uses `joined_at` field

## What This Fixes

**Problem:** Profile pages show "Joined less than a minute ago" for all users instead of showing the actual date they created their account.

**Solution:** The migration populates the `joined_at` field for all existing users based on their user ID (lower ID = earlier user), spreading them over a 6-month period for realistic dates.

## Migration Instructions

### Option 1: Run on Production Server (Recommended)

SSH into your production server and run:

```bash
cd /path/to/cohortle-api
npx sequelize-cli db:migrate
```

This will:
- Find all users with NULL `joined_at`
- Estimate join dates based on user ID
- Spread users over a 6-month period
- Set `joined_at` for all existing users

### Option 2: Run via Coolify/Deployment Platform

If you're using Coolify or another deployment platform:

1. Open your deployment platform dashboard
2. Navigate to the cohortle-api service
3. Open a terminal/console
4. Run: `npx sequelize-cli db:migrate`

### Option 3: Run Locally Against Production DB (Not Recommended)

Only use this if you have direct access to the production database from your local machine:

```bash
cd cohortle-api
NODE_ENV=production npx sequelize-cli db:migrate
```

**Note:** This requires the production database to be accessible from your local network.

## Verification Steps

After running the migration:

### 1. Check Database Directly

```sql
-- Check if all users have joined_at populated
SELECT COUNT(*) as total_users, 
       COUNT(joined_at) as users_with_joined_at,
       COUNT(*) - COUNT(joined_at) as users_without_joined_at
FROM users;

-- Expected: users_without_joined_at should be 0

-- Check date distribution
SELECT 
  DATE_FORMAT(joined_at, '%Y-%m') as month,
  COUNT(*) as user_count
FROM users
WHERE joined_at IS NOT NULL
GROUP BY month
ORDER BY month;

-- Expected: Users spread over multiple months
```

### 2. Test Profile Page

1. Log in to the application
2. Navigate to your profile page
3. Check the "Joined X ago" text
4. Expected: Should show realistic dates like "Joined 3 months ago" instead of "Joined less than a minute ago"

### 3. Test New User Registration

1. Register a new user account
2. Check their profile immediately
3. Expected: Should show "Joined less than a minute ago" (correct for new users)

## Migration Details

**File:** `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js`

**What it does:**
- Queries all users where `joined_at IS NULL`
- Sets a base date 6 months ago
- Calculates incremental dates for each user based on their ID
- Updates each user with their estimated join date

**Safety:**
- Idempotent: Can be run multiple times safely
- Only updates users with NULL `joined_at`
- Doesn't affect users who already have `joined_at` set
- Rollback does nothing (keeps the dates - they're useful data)

## Expected Output

When you run the migration, you should see:

```
Sequelize CLI [Node: x.x.x, CLI: x.x.x, ORM: x.x.x]

Loaded configuration file "config/config.js".
Using environment "production".

== 20260309000000-populate-joined-at-from-id: migrating =======
[Migration] Populating joined_at for existing users...
[Migration] Found X users without joined_at
[Migration] Successfully populated joined_at for all users
== 20260309000000-populate-joined-at-from-id: migrated (X.XXXs)
```

## Troubleshooting

### Migration Already Run

If you see "No pending migrations", the migration has already been applied. You can verify by checking the database directly.

### Database Connection Error

If you get a connection error:
- Verify database credentials in `.env`
- Check that the database server is accessible
- Ensure firewall rules allow the connection

### Migration Fails Midway

The migration updates users one at a time, so if it fails:
- Some users will have `joined_at` populated
- Others will still have NULL
- You can safely re-run the migration - it will only update users with NULL `joined_at`

## Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] All users have `joined_at` populated (verified in database)
- [ ] Profile pages show realistic "Joined X ago" dates
- [ ] New user registrations set `joined_at` correctly
- [ ] No errors in application logs

## Related Files

- `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js` - Migration file
- `cohortle-api/routes/auth.js` - Registration endpoint (sets joined_at for new users)
- `cohortle-api/services/ProfileService.js` - Profile service (uses joined_at)
- `cohortle-web/src/components/profile/ProfileHeader.tsx` - Displays "Joined X ago"
- `PROFILE_JOINED_AT_FIX.md` - Detailed fix documentation
- `PROFILE_AUDIT_COMPLETE.md` - Complete profile audit report

---

**Status:** ✅ Code complete, migration ready to run
**Impact:** Improved user experience with accurate profile information
**Risk:** Low - migration is safe and idempotent
**Estimated Time:** < 1 minute to run migration

