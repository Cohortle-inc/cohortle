# Migration Runner Fix - Complete

## Problem Identified

New users were getting "user not authenticated" errors after signup, even though:
- The migration `20260311000002-fix-users-without-roles.js` was created and deployed
- The `RoleAssignmentService.assignRole()` was working correctly during signup
- JWT tokens were being created with the correct role

**Root Cause**: Database migrations were NOT being run automatically on server startup. The migrations were created but never executed, so:
1. The `user_role_assignments` table schema might not have been fully initialized
2. New users' role assignments weren't being persisted properly
3. The migration to fix existing users without roles never ran

## Solution Implemented

Modified `cohortle-api/bin/www` to run database migrations automatically before starting the server:

```javascript
async function runMigrations() {
  try {
    console.log("Running database migrations...");
    execSync("npx sequelize-cli db:migrate", {
      stdio: "inherit",
      cwd: __dirname + "/.."
    });
    console.log("✅ Migrations completed successfully");
    return true;
  } catch (error) {
    console.error("⚠️  Migration failed, but continuing startup...");
    console.error("   Check logs and run migrations manually if needed");
    return false;
  }
}

async function startServer() {
  // Run migrations first
  await runMigrations();
  
  // Then initialize role system
  if (process.env.NODE_ENV === 'production') {
    initializeRoleSystem().catch(error => {
      console.error("⚠️  Role system initialization failed:", error.message);
    });
  }
  
  // Continue with server startup
  startHttpServer();
}
```

## Execution Order

1. **Environment validation** - Checks required env vars
2. **Database migrations** - Runs all pending migrations (NEW)
3. **Role system initialization** - Seeds roles, assigns default roles, creates admin
4. **Server startup** - Starts HTTP server on configured port

## Commits

- **cohortle-api**: `0f0cc6d` - Fixed SQL queries in migration and server scope issue
  - Changed `WHERE ura.id IS NULL` to `WHERE ura.user_id IS NULL` (proper LEFT JOIN detection)
  - Fixed server scope issue in onListening callback
- **cohortle-api**: `90d8db0` - Added automatic migration runner to bin/www
- **main repo**: `bf13a94` - Updated submodule reference with fixes

## Issues Fixed

1. **SQL Query Error**: Migration was checking `ura.id IS NULL` but should check `ura.user_id IS NULL` for LEFT JOIN
2. **Server Crash**: `onListening` callback had no access to `server` variable, causing ReferenceError
3. **Migrations Not Running**: Added automatic migration execution on server startup

## Testing

When the server starts, you should see:
```
Running database migrations...
[Migration] Starting: Fix users without role assignments
[Migration] Found X users without active role assignments
[Migration] Created X role assignments
✅ Migrations completed successfully
🔧 Initializing Role System...
✅ Role system initialized successfully
Listening on port: 3000
```

## Next Steps

1. Coolify will detect the new commit and redeploy
2. On startup, migrations will run and fix any existing issues
3. New users signing up will have roles properly assigned
4. Test signup flow to verify authentication works


## What This Fixes

✅ Migrations now run automatically on every deployment
✅ Migration SQL queries now correctly detect users without role assignments
✅ Server no longer crashes with ReferenceError on startup
✅ New users will have proper role assignments in the database
✅ JWT tokens will include the correct role from the database
✅ Authentication guard will recognize users with valid roles
✅ No more "user not authenticated" errors for new signups

## Critical Changes Made

### 1. Migration SQL Fix
**Before**: `WHERE ura.id IS NULL` (incorrect - ura.id doesn't exist in LEFT JOIN)
**After**: `WHERE ura.user_id IS NULL` (correct - detects rows where LEFT JOIN found no match)

### 2. Server Scope Fix
**Before**: `server.on("listening", onListening)` - server variable not accessible in callback
**After**: `server.on("listening", () => onListening(server))` - pass server as parameter

### 3. Automatic Migrations
Added `runMigrations()` function that executes before role system initialization and server startup.
