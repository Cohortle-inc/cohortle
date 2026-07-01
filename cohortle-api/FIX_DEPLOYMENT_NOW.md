# Fix Backend Deployment - Step by Step

## Current Issue
- Coolify deployment is stuck in migration loop
- API is not responding
- Need to run migration manually

## Solution: 3 Simple Steps

### Step 1: Push the Fixed Entrypoint (Already Done ✅)

The docker-entrypoint.sh has been updated to skip auto-migration. Now push it:

```bash
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api
git add docker-entrypoint.sh
git commit -m "Fix: Disable auto-migration to stop deployment loop"
git push origin main
```

### Step 2: Redeploy in Coolify

1. Open Coolify dashboard
2. Go to your `cohortle-api` application
3. Click "Redeploy" button
4. Wait for deployment to complete (should be fast now)
5. Check if API responds: https://api.cohortle.com/health

### Step 3: Run Migration Manually on Database

You have 2 options:

#### Option A: Using MySQL Client (Recommended)

If you have MySQL Workbench, phpMyAdmin, or command-line mysql client:

1. Connect to: `db.cohortle.com`
2. Select your database (probably `cohortle_db`)
3. Copy and paste the SQL from `MANUAL_MIGRATION.sql`
4. Execute it

#### Option B: Using Coolify Console

1. In Coolify, go to your database container
2. Click "Console" or "Terminal"
3. Run:
```bash
mysql -u root -p
# Enter password when prompted
USE cohortle_db;  # or your database name

# Then paste the SQL from MANUAL_MIGRATION.sql
```

## The SQL to Run

```sql
-- Add the type column
ALTER TABLE module_lessons 
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'video';

-- Add index for performance
CREATE INDEX idx_module_lessons_type ON module_lessons(type);

-- Mark migration as complete in Sequelize
INSERT INTO SequelizeMeta (name) 
VALUES ('20260218000000-add-type-to-module-lessons.js');
```

## Verify It Worked

### 1. Check Database
```sql
DESCRIBE module_lessons;
-- Should show 'type' column
```

### 2. Check API
```bash
# Test health endpoint
curl https://api.cohortle.com/health

# Test lesson endpoint (if you have a valid token)
curl https://api.cohortle.com/api/lessons
```

### 3. Check Migration Status
In Coolify console:
```bash
cd /app
npx sequelize-cli db:migrate:status
# Should show the migration as completed
```

## Troubleshooting

### If SQL fails with "Column already exists"
The column might already be there from a previous attempt. Just run:
```sql
-- Mark migration as complete
INSERT INTO SequelizeMeta (name) 
VALUES ('20260218000000-add-type-to-module-lessons.js');
```

### If API still doesn't respond
1. Check Coolify application logs
2. Verify environment variables are set:
   - DB_HOST=db.cohortle.com
   - DB_USER=your_user
   - DB_PASSWORD=your_password
   - DB_NAME=cohortle_db
   - NODE_ENV=production

### If you need to rollback
```sql
-- Remove the column
ALTER TABLE module_lessons DROP COLUMN type;

-- Remove the index
DROP INDEX idx_module_lessons_type ON module_lessons;

-- Remove from SequelizeMeta
DELETE FROM SequelizeMeta 
WHERE name = '20260218000000-add-type-to-module-lessons.js';
```

## What's Next?

Once the API is running:

1. ✅ Backend is deployed
2. ⏳ Build preview app: `eas build --profile preview --platform android`
3. ⏳ Test on phone

## Need Help?

If you get stuck, share:
- The exact error message from SQL execution
- Coolify application logs
- Response from https://api.cohortle.com/health
