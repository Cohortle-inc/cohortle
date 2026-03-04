# Step 4: Run Database Migrations

## Instructions

You need to run the migrations via Coolify terminal. Here's how:

### Option A: Via Coolify Terminal (Recommended)

1. **Open Coolify Dashboard**
2. **Navigate to** `cohortle-api` application
3. **Click** "Terminal" or "Console" button
4. **Run this command**:
   ```bash
   npx sequelize-cli db:migrate
   ```

### Expected Output

You should see something like:

```
Sequelize CLI [Node: 20.20.0, CLI: 6.x.x, ORM: 6.x.x]

Loaded configuration file "config/config.js".
Using environment "production".
== 20260218000000-add-type-to-module-lessons: migrating =======
== 20260218000000-add-type-to-module-lessons: migrated (0.123s)

== 20260220000000-add-post-visibility-scope: migrating =======
== 20260220000000-add-post-visibility-scope: migrated (0.234s)
```

### Verify Migrations Ran

After running, verify with:

```bash
npx sequelize-cli db:migrate:status
```

Should show:
```
up 20260218000000-add-type-to-module-lessons.js
up 20260220000000-add-post-visibility-scope.js
```

## If Migrations Fail

### Error: "Column already exists"
**Solution**: Migration may have already run. Check status with:
```bash
npx sequelize-cli db:migrate:status
```

### Error: "Cannot connect to database"
**Solution**: Check database credentials in environment variables

### Error: "SequelizeMeta table doesn't exist"
**Solution**: This is normal for first-time setup. The command will create it.

## After Migrations Complete

Once you see the success messages, the database is ready!

**Next**: Test the API endpoints to verify everything works.

---

**Run the migration command now and let me know the output!**
