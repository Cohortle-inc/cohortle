# Deploy Backend with Auto-Migrations ✅

## What We Just Did

Enabled automatic database migrations that run on every deployment. No more manual migration steps!

## Changes Made

1. ✅ **Enabled auto-migrations** in `docker-entrypoint.sh`
2. ✅ **Added npm scripts** for manual migration control
3. ✅ **Committed and pushed** to GitHub
4. ✅ **Ready to deploy** in Coolify

## Next Step: Deploy in Coolify

### Instructions

1. **Open Coolify Dashboard**
   - Navigate to your Coolify URL
   - Log in

2. **Find Your Application**
   - Look for `cohortle-api`
   - Click on it

3. **Deploy**
   - Click the **"Deploy"** or **"Redeploy"** button
   - Wait for deployment to complete (2-3 minutes)

4. **Watch the Logs**
   - Look for these messages in the deployment logs:

   ```
   Running Sequelize migrations...
   == 20260218000000-add-type-to-module-lessons: migrating =======
   == 20260218000000-add-type-to-module-lessons: migrated (0.123s)
   == 20260220000000-add-post-visibility-scope: migrating =======
   == 20260220000000-add-post-visibility-scope: migrated (0.234s)
   Starting application...
   ```

5. **Verify Success**
   - Application status should be green/running
   - No error messages in logs
   - Server should show "Server running on port 3000"

## What Happens During Deployment

```
1. Coolify pulls latest code from GitHub
2. Docker builds new container
3. Container starts
4. docker-entrypoint.sh runs
5. Migrations execute automatically ← NEW!
6. Application starts
7. Ready to serve requests
```

## Expected Timeline

- **Pull code**: 10 seconds
- **Build container**: 1-2 minutes
- **Run migrations**: 5-10 seconds
- **Start app**: 5 seconds

**Total**: ~2-3 minutes

## Success Indicators

✅ **Deployment logs show**:
- "Running Sequelize migrations..."
- Both migrations listed as "migrated"
- "Starting application..."
- No error messages

✅ **Application status**: Green/Running

✅ **API responds**: https://api.cohortle.com should be accessible

## What Gets Migrated

### 1. Lesson Types Feature
- Adds `type` column to `module_lessons`
- All existing lessons get `type='video'`
- Backend ready for 10 lesson types

### 2. Post Access Control
- Adds `visibility_scope` to `posts` (community/cohort)
- Adds `cohort_id` to `posts` (nullable)
- All existing posts get `visibility_scope='community'`

## After Deployment

### Test the API

**Test 1: Check lesson type field**
```bash
curl https://api.cohortle.com/v1/api/modules/[MODULE_ID]/lessons \
  -H "Authorization: Bearer [TOKEN]"
```

Should return lessons with `type` field.

**Test 2: Check post filtering**
```bash
curl https://api.cohortle.com/v1/api/posts \
  -H "Authorization: Bearer [TOKEN]"
```

Should only return posts from your communities.

### Test with Mobile App

Your current mobile app should work immediately:
- ✅ Lessons load normally
- ✅ Posts filtered by membership
- ✅ Progress tracking works
- ✅ Comments work

## Troubleshooting

### Issue: Deployment fails

**Check logs for**:
- Database connection errors
- Migration syntax errors
- Missing environment variables

**Solution**: Share the error logs and we'll fix it

### Issue: Migrations don't run

**Check logs for**:
- "Running Sequelize migrations..." message
- If missing, entrypoint script may not have executed

**Solution**: Verify `docker-entrypoint.sh` has execute permissions

### Issue: "Column already exists"

**This is OK!** It means migrations already ran (maybe in a previous attempt).

Sequelize will skip them and continue. Look for:
```
No migrations were executed, database schema was already up to date.
```

## Future Deployments

From now on, every deployment will:
1. Pull latest code
2. Build container
3. **Run migrations automatically** ← No manual steps!
4. Start application

Just commit, push, and deploy in Coolify. Migrations happen automatically!

## Rollback (If Needed)

If something goes wrong, you can rollback:

**Via Coolify Terminal** (if working):
```bash
npm run migrate:undo
```

**Via SSH**:
```bash
ssh user@your-server
cd /path/to/cohortle-api
npm run migrate:undo
```

Then redeploy the previous version in Coolify.

## Summary

**What changed**: Auto-migrations enabled  
**What you need to do**: Deploy in Coolify  
**What happens**: Migrations run automatically  
**Result**: Database updated, app ready to test  

---

## Ready to Deploy?

1. Go to Coolify dashboard
2. Find `cohortle-api`
3. Click "Deploy"
4. Watch the logs
5. Verify migrations ran
6. Test the API

**Let me know when you start the deployment and I'll help you verify it worked!**
