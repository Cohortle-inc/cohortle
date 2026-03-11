# Automated Migrations Summary

## Overview
All critical database operations have been converted to automated migrations that run on deployment. No manual scripts need to be executed.

## New Automated Migrations

### 1. Clean Test Users (20260311000000)
**File**: `cohortle-api/migrations/20260311000000-clean-test-users.js`

**Purpose**: Automatically removes test users on deployment while preserving production accounts

**Protected Accounts**:
- testaconvener@cohortle.com
- wecarefng@gmail.com

**What It Deletes**:
- User role assignments
- Role assignment history
- Enrollments
- Lesson completions
- Lesson comments
- Cohort posts
- Post comments
- User preferences
- Verification tokens
- User achievements
- Test user accounts

**Safety Features**:
- Uses transactions for atomicity
- Skips if no protected users found
- Respects foreign key constraints
- Provides detailed logging
- Cannot be reversed (data deletion is permanent)

### 2. Assign Roles to Users Without Roles (20260311000001)
**File**: `cohortle-api/migrations/20260311000001-assign-roles-to-users-without-roles.js`

**Purpose**: Ensures all users have proper role assignments in user_role_assignments table

**What It Does**:
- Finds users without active role assignments
- Assigns default 'student' role to users without roles
- Updates users.role_id if NULL
- Creates role assignment records
- Creates role assignment history entries
- Verifies all users have assignments

**Safety Features**:
- Uses transactions
- Idempotent (safe to run multiple times)
- Skips if all users already have roles
- Provides verification step
- Cannot be reversed (role assignments are permanent)

## Existing Automated Migrations

### 3. Upgrade wecarefng to Convener (20260309100000)
**File**: `cohortle-api/migrations/20260309100000-upgrade-wecarefng-to-convener.js`

**Purpose**: Automatically upgrades wecarefng@gmail.com to convener role

**Features**:
- Finds user by email
- Updates role_id to convener
- Creates role assignment history
- Skips if user already has convener role
- Reversible (can downgrade to student)

### 4. Populate Joined At Dates (20260309000000)
**File**: `cohortle-api/migrations/20260309000000-populate-joined-at-from-id.js`

**Purpose**: Populates joined_at field for existing users to fix "Joined less than a minute ago" issue

**Features**:
- Uses user ID to estimate join date
- Spreads users over 6-month period
- Only updates users with NULL joined_at
- Keeps dates on rollback (useful data)

## Migration Execution Order

Migrations run automatically on deployment in this order:
1. All existing migrations (role system, tables, etc.)
2. `20260309000000-populate-joined-at-from-id.js`
3. `20260309100000-upgrade-wecarefng-to-convener.js`
4. `20260311000000-clean-test-users.js`
5. `20260311000001-assign-roles-to-users-without-roles.js`

## Deprecated Scripts

The following scripts are now deprecated and replaced by migrations:

### ❌ `cohortle-api/scripts/clean-test-users.js`
**Replaced by**: Migration `20260311000000-clean-test-users.js`
**Status**: Keep for reference, but use migration instead

### ❌ `cohortle-api/scripts/fix-users-without-roles.js`
**Replaced by**: Migration `20260311000001-assign-roles-to-users-without-roles.js`
**Status**: Keep for reference, but use migration instead

### ❌ `cohortle-api/scripts/assign-roles-to-existing-users.js`
**Replaced by**: Migration `20260311000001-assign-roles-to-users-without-roles.js`
**Status**: Keep for reference, but use migration instead

## Deployment Process

### Automatic (Recommended)
Migrations run automatically when you deploy via Coolify:

1. Push code to main branch
2. Coolify detects changes
3. Builds and deploys backend
4. Runs all pending migrations automatically
5. Starts the application

### Manual (If Needed)
If you need to run migrations manually:

```bash
# SSH into production server
cd /path/to/cohortle-api

# Run all pending migrations
npx sequelize-cli db:migrate

# Or run specific migration
npx sequelize-cli db:migrate --name 20260311000000-clean-test-users.js
```

## Verification

After deployment, verify migrations ran successfully:

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Check users have roles
node cohortle-api/diagnose-database-roles.js

# Check test users were cleaned
# Should only show 2 users: testaconvener@cohortle.com and wecarefng@gmail.com
```

## Rollback

Most migrations cannot be reversed as they involve data deletion or role assignments:

- ❌ `clean-test-users` - Cannot reverse (data deleted)
- ❌ `assign-roles-to-users-without-roles` - Cannot reverse (would break system)
- ✅ `upgrade-wecarefng-to-convener` - Can reverse (downgrades to student)
- ⚠️  `populate-joined-at-from-id` - Keeps dates on rollback (useful data)

## Benefits

1. **No Manual Intervention**: Everything runs automatically on deployment
2. **Consistency**: Same process every time, no human error
3. **Audit Trail**: All changes logged in migration history
4. **Idempotent**: Safe to run multiple times
5. **Transactional**: All-or-nothing execution
6. **Logged**: Detailed console output for debugging

## Next Steps

1. ✅ Commit new migrations to repository
2. ✅ Push to main branch
3. ✅ Deploy via Coolify (migrations run automatically)
4. ✅ Verify migrations completed successfully
5. ✅ Check that only 2 users remain in database
6. ✅ Verify all users have role assignments

## Notes

- All migrations use transactions for safety
- Migrations are idempotent (safe to run multiple times)
- Protected accounts are hardcoded in clean-test-users migration
- Student role is the default for users without roles
- Migration order is controlled by timestamp in filename
