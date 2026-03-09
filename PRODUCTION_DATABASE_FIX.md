# Production Database Fix - Missing Columns

## Issue
Production database is missing `bio` and `linkedin_username` columns in the `users` table, causing the error:
```
Unknown column 'linkedin_username' in 'field list'
```

## Root Cause
The migration `20260309000000-add-bio-linkedin-to-users.js` was created and pushed to GitHub but hasn't been run on the production database yet.

## Solution

### Option 1: Run Migration Script (Recommended)
Use the provided migration script to add the missing columns:

**Windows (PowerShell):**
```powershell
.\run-bio-linkedin-migration.ps1
```

**Linux/Mac:**
```bash
node run-bio-linkedin-migration.js
```

### Option 2: Manual SQL
If you prefer to run SQL directly on the production database:

```sql
-- Add bio column
ALTER TABLE users 
ADD COLUMN bio TEXT NULL 
COMMENT 'User biography or about section';

-- Add linkedin_username column
ALTER TABLE users 
ADD COLUMN linkedin_username VARCHAR(255) NULL 
COMMENT 'LinkedIn username (not full URL, just the username)';
```

## What the Migration Does
1. Adds `bio` column (TEXT, nullable) - for user biography/about section
2. Adds `linkedin_username` column (VARCHAR(255), nullable) - for LinkedIn username

## Verification Steps
After running the migration:

1. **Check columns exist:**
   ```sql
   DESCRIBE users;
   ```
   You should see `bio` and `linkedin_username` in the column list.

2. **Test the profile endpoint:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.cohortle.com/v1/api/profile
   ```
   Should return without errors and include `bio` and `linkedinUsername` fields.

3. **Test profile update:**
   ```bash
   curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bio":"Test bio","linkedinUsername":"testuser"}' \
     https://api.cohortle.com/v1/api/profile
   ```

## Files Involved
- **Migration:** `cohortle-api/migrations/20260309000000-add-bio-linkedin-to-users.js`
- **Service:** `cohortle-api/services/ProfileService.js` (queries these columns)
- **Route:** `cohortle-api/routes/profile.js` (exposes profile endpoints)
- **Script:** `run-bio-linkedin-migration.js` (automated migration runner)

## Impact
- **Before fix:** Profile endpoints return 500 errors
- **After fix:** Profile endpoints work normally, users can set bio and LinkedIn username

## Related Features
This migration is part of the profile enhancement feature that includes:
- User biography field
- LinkedIn username integration
- Profile avatar generator (already deployed)

## Notes
- The migration is idempotent - safe to run multiple times
- Existing user data is not affected
- Both columns are nullable, so no default values needed
- The script checks if columns exist before attempting to add them
