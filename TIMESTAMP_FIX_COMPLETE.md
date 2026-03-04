# Sequelize Timestamp Column Fix - Complete

## Problem
Sequelize models were looking for camelCase timestamp columns (`createdAt`, `updatedAt`) but the MySQL database has snake_case columns (`created_at`, `updated_at`). This caused errors:
```
Error: Unknown column 'createdAt' in 'field list'
```

## Root Cause
The WLIMP feature models (weeks, lessons, cohorts) were created with `timestamps: true` but without the `underscored: true` option. This made Sequelize use its default camelCase naming convention for timestamps, which didn't match the database schema.

## Solution
Added `underscored: true` option to three Sequelize models:

### 1. weeks.js (Commit: 6930e8f)
```javascript
{
  sequelize,
  tableName: "weeks",
  timestamps: true,
  underscored: true,  // ← Added this
  indexes: [...]
}
```

### 2. lessons.js (Commit: 6930e8f)
```javascript
{
  sequelize,
  tableName: "lessons",
  timestamps: true,
  underscored: true,  // ← Added this
  indexes: [...]
}
```

### 3. cohorts.js (Commit: 0b2cb4d)
```javascript
{
  sequelize,
  tableName: "cohorts",
  timestamps: true,
  underscored: true,  // ← Added this
  indexes: [...]
}
```

## What `underscored: true` Does
This option tells Sequelize to:
- Use snake_case for ALL column names (not just timestamps)
- Convert `createdAt` → `created_at`
- Convert `updatedAt` → `updated_at`
- Convert any other camelCase field names to snake_case

## Impact on WLIMP Features

### ✅ Week Creation
- `ContentService.createWeek()` uses `weeks.create()` - will now work correctly
- `ProgrammeService.getProgrammeWeeks()` queries weeks table - will now work correctly
- GET `/v1/api/programmes/:id/weeks` endpoint - will now work correctly

### ✅ Lesson Creation
- `ContentService.createLesson()` uses `lessons.create()` - will now work correctly
- `ContentService.getWeekLessons()` queries lessons table - will now work correctly
- POST `/v1/api/programmes/:id/weeks/:weekId/lessons` endpoint - will now work correctly

### ✅ Cohort Creation
- Cohort queries that include timestamps - will now work correctly
- POST `/v1/api/programmes/:id/cohorts` endpoint - will now work correctly

## Verification Needed
After API restart in Coolify, test:

1. **Week Creation**
   - Navigate to `/convener/programmes/10/weeks/new`
   - Page should load without 500 error
   - Create a new week
   - Verify it saves successfully

2. **Lesson Creation**
   - Navigate to `/convener/programmes/10/weeks/:weekId/lessons/new`
   - Create a new lesson
   - Verify it saves successfully

3. **Cohort Creation**
   - Navigate to `/convener/programmes/10/cohorts/new`
   - Create a new cohort
   - Verify it saves successfully

## Files Changed
- `cohortle-api/models/weeks.js`
- `cohortle-api/models/lessons.js`
- `cohortle-api/models/cohorts.js`

## Commits
- 6930e8f - Fix weeks and lessons models timestamp column names
- 0b2cb4d - Fix cohorts model timestamp column names with underscored option

## Status
✅ Code changes complete and pushed to production
⏳ Awaiting API restart in Coolify to apply changes
