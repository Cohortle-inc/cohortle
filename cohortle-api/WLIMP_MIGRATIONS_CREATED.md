# WLIMP Programme Rollout - Database Migrations Created ✅

## Overview

Created database schema migrations for the WLIMP Programme Rollout feature. These migrations will run automatically on deployment via the existing auto-migration setup.

## Migration Files Created

### 1. `20260301000000-create-wlimp-weeks.js`
Creates the `weeks` table for organizing programme content into weekly groupings.

**Schema:**
- `id` (UUID, Primary Key)
- `programme_id` (INTEGER, Foreign Key → programmes.id)
- `week_number` (INTEGER)
- `title` (VARCHAR(255))
- `start_date` (DATE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_weeks_programme_id` on `programme_id`
- Unique constraint on `(programme_id, week_number)`

### 2. `20260301000001-create-wlimp-lessons.js`
Creates the `lessons` table for individual learning units within weeks.

**Schema:**
- `id` (UUID, Primary Key)
- `week_id` (UUID, Foreign Key → weeks.id)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `content_type` (VARCHAR(50)) - 'video', 'link', 'pdf'
- `content_url` (TEXT) - External URL to content
- `order_index` (INTEGER) - Order within the week
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_lessons_week_id` on `week_id`

### 3. `20260301000002-create-wlimp-enrollments.js`
Creates the `enrollments` table to track learner enrollment in programme cohorts.

**Schema:**
- `id` (UUID, Primary Key)
- `user_id` (INTEGER, Foreign Key → users.id)
- `cohort_id` (INTEGER, Foreign Key → cohorts.id)
- `enrolled_at` (TIMESTAMP)

**Indexes:**
- `idx_enrollments_user_id` on `user_id`
- `idx_enrollments_cohort_id` on `cohort_id`
- Unique constraint on `(user_id, cohort_id)` to prevent duplicate enrollments

### 4. `20260301000003-add-enrollment-code-to-cohorts.js`
Adds `enrollment_code` field to the existing `cohorts` table.

**Changes:**
- Adds `enrollment_code` (VARCHAR(50), UNIQUE, NULLABLE)
- Adds unique index `idx_cohorts_enrollment_code`

## Performance Optimizations

All required indexes have been added as specified in the task:
- ✅ `enrollment_code` index on cohorts table
- ✅ `user_id` index on enrollments table
- ✅ `cohort_id` index on enrollments table
- ✅ `programme_id` index on weeks table
- ✅ `week_id` index on lessons table

## Database Relationships

```
programmes (existing)
    ↓ (1:N)
cohorts (existing, enhanced with enrollment_code)
    ↓ (1:N)
enrollments (new)
    ↓ (N:1)
users (existing)

programmes (existing)
    ↓ (1:N)
weeks (new)
    ↓ (1:N)
lessons (new)
```

## Deployment

These migrations will run automatically when the API is deployed to production via the existing auto-migration setup in `docker-entrypoint.sh`.

### To Deploy:

1. Commit the migration files:
   ```bash
   git add cohortle-api/migrations/20260301*.js
   git commit -m "feat: add WLIMP database schema migrations"
   git push origin main
   ```

2. Deploy in Coolify - migrations will run automatically

3. Verify in deployment logs:
   ```
   == 20260301000000-create-wlimp-weeks: migrating =======
   == 20260301000000-create-wlimp-weeks: migrated
   == 20260301000001-create-wlimp-lessons: migrating =======
   == 20260301000001-create-wlimp-lessons: migrated
   == 20260301000002-create-wlimp-enrollments: migrating =======
   == 20260301000002-create-wlimp-enrollments: migrated
   == 20260301000003-add-enrollment-code-to-cohorts: migrating =======
   == 20260301000003-add-enrollment-code-to-cohorts: migrated
   ```

## Local Development

To run migrations locally (requires .env file with database credentials):

```bash
cd cohortle-api
npm run migrate
```

To check migration status:

```bash
npm run migrate:status
```

## Requirements Satisfied

This task satisfies the following requirements from the spec:
- ✅ Requirement 1.1: Programme creation support
- ✅ Requirement 1.2: Multiple cohorts per programme
- ✅ Requirement 1.3: Weekly lesson organization
- ✅ Requirement 1.4: Lesson assignment to weeks
- ✅ Requirement 2.1: Code-based enrollment

## Next Steps

After deployment, proceed to Task 2: Implement backend data models and services.

---

**Status:** ✅ Complete - Ready for deployment
