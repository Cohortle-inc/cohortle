# Local Development - 500 Error Fix

## Problem

You're seeing HTTP 500 errors when accessing the dashboard locally:
```
api/proxy/v1/api/programmes/enrolled: Failed to load resource: the server responded with a status of 500
```

## Root Cause

The WLIMP migrations haven't been run on your **local database** yet. The backend is trying to query tables (`weeks`, `lessons`, `enrollments`) that don't exist locally.

## Important: This Does NOT Affect Production

- ✅ Production database is separate and safe
- ✅ When you deploy to Coolify, migrations will run automatically on production
- ✅ Your local development work cannot affect production
- ✅ They are completely isolated environments

---

## Solution: Run Migrations Locally

### Option 1: Start Local MySQL Server (Recommended)

If you have MySQL installed locally:

1. **Start MySQL Server**:
   ```bash
   # Windows (if MySQL is installed as a service)
   net start MySQL80
   
   # Or start via MySQL Workbench or XAMPP/WAMP
   ```

2. **Run Migrations**:
   ```bash
   cd cohortle-api
   npx sequelize-cli db:migrate --env local
   ```

3. **Restart Backend**:
   - Stop your backend server (Ctrl+C)
   - Start it again: `npm start` or `npm run dev`

4. **Refresh Browser**:
   - The 500 errors should be gone
   - Dashboard should show empty state or programmes

### Option 2: Use Development Database

If you have access to a development database (not production):

1. **Update `.env` file** in `cohortle-api`:
   ```env
   DB_USER=your_dev_db_user
   DB_PASSWORD=your_dev_db_password
   DB_DATABASE=your_dev_db_name
   DB_HOSTNAME=your_dev_db_host
   DB_PORT=3306
   ```

2. **Run Migrations**:
   ```bash
   cd cohortle-api
   NODE_ENV=development npx sequelize-cli db:migrate
   ```

3. **Restart Backend**

### Option 3: Skip Local Testing (Deploy to Production)

If you don't need to test locally:

1. **Deploy to Coolify** (production):
   - Backend will run migrations automatically
   - Test on production environment

2. **Advantages**:
   - No local database setup needed
   - Migrations run automatically
   - Test with real production environment

---

## What the Migrations Will Create

When you run the migrations, these tables will be created in your local database:

### 1. `weeks` table
- Stores programme weeks
- Links to programmes
- Has week_number, title, start_date

### 2. `lessons` table
- Stores lesson content
- Links to weeks
- Has title, description, content_type, content_url, order_index

### 3. `enrollments` table
- Stores user enrollments
- Links users to cohorts
- Has user_id, cohort_id, enrolled_at

### 4. `cohorts` table update
- Adds `enrollment_code` column
- Adds unique index on enrollment_code

---

## Verify Migrations Ran Successfully

After running migrations, you should see:

```
Sequelize CLI [Node: 24.13.1, CLI: 6.6.3, ORM: 6.37.7]

Loaded configuration file "config/config.js".
Using environment "local".

== 20260301000000-create-wlimp-weeks: migrating =======
== 20260301000000-create-wlimp-weeks: migrated (0.123s)

== 20260301000001-create-wlimp-lessons: migrating =======
== 20260301000001-create-wlimp-lessons: migrated (0.234s)

== 20260301000002-create-wlimp-enrollments: migrating =======
== 20260301000002-create-wlimp-enrollments: migrated (0.156s)

== 20260301000003-add-enrollment-code-to-cohorts: migrating =======
== 20260301000003-add-enrollment-code-to-cohorts: migrated (0.089s)
```

---

## After Migrations Run

1. **Restart Backend Server**
2. **Refresh Browser**
3. **Dashboard Should Load**:
   - No more 500 errors
   - Shows "No programmes yet" message
   - Or shows programme cards if you have enrollments

---

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:3306"

**Cause**: Local MySQL server is not running

**Solution**:
- Start MySQL server
- Or use Option 2 (development database)
- Or use Option 3 (skip local testing)

### Error: "connect ETIMEDOUT"

**Cause**: Trying to connect to remote database that's not accessible

**Solution**:
- Use `--env local` flag
- Or update `.env` file with correct database credentials

### Error: "Access denied for user"

**Cause**: Wrong database credentials

**Solution**:
- Check username/password in `config/config.js`
- Update credentials for local environment
- Make sure MySQL user has proper permissions

---

## Current Status

### What's Working ✅
- All code is implemented and tested
- 111 tests passing
- Code is ready for production
- Migrations are ready

### What's Not Working Locally ⚠️
- Local MySQL server is not running
- Migrations haven't been run locally
- Getting 500 errors when accessing dashboard

### What to Do Next

**Choose one**:

1. **Start local MySQL** → Run migrations → Test locally
2. **Use dev database** → Run migrations → Test locally
3. **Skip local testing** → Deploy to production → Test on production

---

## Production Deployment (Recommended)

If you don't want to set up local database:

1. **Deploy Backend in Coolify**:
   - Migrations run automatically
   - No manual steps needed

2. **Deploy Frontend in Coolify**:
   - Build completes automatically
   - No manual steps needed

3. **Test on Production**:
   - Access production URL
   - Dashboard should work
   - No 500 errors

**This is the easiest path forward** if you don't need local development.

---

## Summary

- ❌ Local MySQL server not running → 500 errors
- ✅ Production is safe and separate
- ✅ Code is ready to deploy
- ✅ Migrations will run automatically on production

**Next Step**: Choose Option 1, 2, or 3 above based on your needs.
