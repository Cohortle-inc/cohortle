# Milestone 1: Migration Status & Deployment Guide

**Date Created:** June 30, 2026  
**Status:** ✅ COMPLETE — All migration files created and ready to deploy

## Migration Files Created

All files are located in `cohortle-api/migrations/`:

### 1. **20260701_extend_enrollments_for_operations.js**
- **Purpose:** Extend enrollments table with operational columns
- **Columns Added (14 total):**
  - `lifecycle_stage` - Tracks learner journey (onboarding→active→suspended→completed→removed→alumni)
  - `access_status_reason` - Reason for suspension/removal
  - `suspended_at`, `suspended_by`, `reactivated_at` - Suspension tracking
  - `removed_at`, `removed_by` - Removal tracking
  - `payment_status` - Payment state (pending, partial, paid, overdue, failed, refunded)
  - `payment_due_date` - Next payment deadline
  - `last_contacted_at` - Last communication timestamp
  - `onboarding_completed_at` - When learner completed onboarding
  - `graduation_status` - Learner completion state (active, graduated, incomplete, deferred)
  - `graduated_at` - Graduation date
  - `notes_count` - Denormalized count for performance

### 2. **20260701_create_learner_operational_tables.js**
- **Purpose:** Create tables for learner operational data
- **Tables Created:**
  - `learner_notes` - Support/intervention/engagement notes
  - `learner_communication_events` - Email/SMS/in-app message history
  - `learner_attendance` - Event attendance tracking (live sessions, workshops, etc.)

### 3. **20260701_create_payment_and_milestone_tables.js**
- **Purpose:** Create tables for payments and milestones
- **Tables Created:**
  - `learner_payments` - Individual payment transactions
  - `installment_plans` - Multi-payment plan configuration
  - `learner_milestones` - Milestone tracking for learner progress

### 4. **20260701_create_audit_events_table.js**
- **Purpose:** Create audit trail table for compliance
- **Tables Created:**
  - `audit_events` - All operational actions with actor, target, reason, before/after state

## Database Schema Summary

| Component | Type | Count |
|-----------|------|-------|
| New Tables | - | 7 |
| Extended Tables | - | 1 (enrollments) |
| New Columns | - | 14 (on enrollments) + ~90 (on new tables) |
| Performance Indexes | - | 25+ |

## How to Deploy Migrations

### Option 1: Deploy to Production via Sequelize CLI (Recommended)

```bash
# Navigate to backend directory
cd cohortle-api

# Run migrations against production database
npm run migrate

# Or explicitly:
npx sequelize-cli db:migrate --env production
```

### Option 2: Deploy to Development Environment

```bash
cd cohortle-api

# Run against development database
npx sequelize-cli db:migrate --env development
```

### Option 3: Deploy to Local MySQL Database

```bash
cd cohortle-api

# Ensure local MySQL is running (port 3306)
npx sequelize-cli db:migrate --env local
```

### Option 4: Manual SQL Deployment

If Sequelize CLI migration fails, export the SQL and run manually:

```sql
-- From 20260701_extend_enrollments_for_operations.js
ALTER TABLE enrollments 
ADD COLUMN lifecycle_stage ENUM(...) AFTER status,
ADD COLUMN access_status_reason TEXT AFTER lifecycle_stage,
-- ... additional columns ...
ADD INDEX idx_enrollments_lifecycle_cohort (lifecycle_stage, cohort_id),
ADD INDEX idx_enrollments_payment_status (payment_status, cohort_id),
ADD INDEX idx_enrollments_suspended_at (suspended_at);

-- From 20260701_create_learner_operational_tables.js
CREATE TABLE learner_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enrollment_id INT NOT NULL,
  note_type ENUM('support', 'intervention', 'engagement', 'achievement', 'issue', 'follow_up', 'general'),
  content TEXT NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  linked_entity_type VARCHAR(50),
  linked_entity_id INT,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
  INDEX (enrollment_id), INDEX (note_type), INDEX (created_by), INDEX (created_at)
);

-- ... additional tables ...
```

## Verification After Migration

### Check if Migrations Ran Successfully

```bash
# View migration status
npm run migrate:status
```

### Verify Tables Exist

```sql
-- Connect to database and verify tables
SHOW TABLES LIKE 'learner%';
SHOW TABLES LIKE 'audit%';
SHOW TABLES LIKE 'installment%';

-- Verify new columns on enrollments
DESCRIBE enrollments;

-- Check indexes
SHOW INDEX FROM enrollments;
SHOW INDEX FROM learner_notes;
```

### Test API Endpoints

Once migrations complete, test the new endpoints:

```bash
# Suspend a learner
curl -X PATCH http://localhost:3000/v1/api/enrollments/1/suspend \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Poor attendance"}'

# Add a note
curl -X POST http://localhost:3000/v1/api/enrollments/1/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note_type":"support","content":"Provided additional guidance on week 2 concepts"}'

# Record attendance
curl -X POST http://localhost:3000/v1/api/enrollments/1/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"live_session","event_date":"2026-06-30T10:00:00Z","status":"attended"}'
```

## Rollback Instructions

If migrations fail or need to be rolled back:

```bash
# Undo last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all
```

## Database Connection Issues

### Issue: "getaddrinfo ENOTFOUND"

**Cause:** Database hostname not resolving

**Solution:**
1. Verify `DB_HOSTNAME` in `.env` is correct
2. For Supabase: Use format `project-ref.supabase.co`
3. For self-hosted MySQL: Use IP or FQDN
4. Test connectivity: `ping DB_HOSTNAME`

### Issue: "ECONNREFUSED"

**Cause:** Database server not running or wrong port

**Solution:**
1. Verify `DB_PORT` in `.env`
2. Ensure database server is running
3. Test: `telnet DB_HOSTNAME DB_PORT`

### Issue: "Access denied for user"

**Cause:** Database credentials incorrect

**Solution:**
1. Verify `DB_USER` and `DB_PASSWORD` in `.env`
2. Test credentials directly with MySQL client:
   ```bash
   mysql -h DB_HOSTNAME -u DB_USER -p DB_PASSWORD
   ```

## API & Service Integration

### New Services Available After Migration

1. **LearnerLifecycleService** - State machine for learner journey
   - `suspendLearner()`, `reactivateLearner()`, `removeLearner()`
   - `markAtRisk()`, `withdrawLearner()`, `graduateLearner()`
   - `canPerformAction()` - Check if learner can access content

2. **AuditService** - Compliance logging
   - `logAction()` - Log operational events
   - `getEnrollmentAuditTrail()` - View audit history
   - `getActorActions()` - View user's actions

### New Controller Methods

All methods in `LearnerManagementController`:
- `suspendLearner()` - POST /v1/api/enrollments/:id/suspend
- `reactivateLearner()` - PATCH /v1/api/enrollments/:id/reactivate
- `removeLearner()` - PATCH /v1/api/enrollments/:id/remove
- `addNote()` - POST /v1/api/enrollments/:id/notes
- `getNotes()` - GET /v1/api/enrollments/:id/notes
- `sendCommunication()` - POST /v1/api/enrollments/:id/communicate
- `recordAttendance()` - POST /v1/api/enrollments/:id/attendance

### New Frontend Functions

All in `cohortle-web/src/lib/api/convener.ts`:
- `suspendLearner()` - Suspend with reason
- `reactivateLearner()` - Reactivate learner
- `removeLearner()` - Permanently remove
- `addLearnerNote()` - Add support note
- `getLearnerNotes()` - Retrieve notes
- `sendCommunicationToLearner()` - Send via email/SMS/in-app
- `recordLearnerAttendance()` - Track attendance

## What's Next (Milestone 1B)

Once migrations complete:

1. **Build UI Components** for Operations Center:
   - Learner list with action buttons
   - Suspension/removal modals
   - Notes panel with history
   - Communication panel
   - Attendance tracking interface

2. **Integration Testing**:
   - Test suspend/reactivate workflow
   - Verify audit logging
   - Test payment status updates

3. **Deployment**:
   - Deploy migrations to production
   - Deploy backend code
   - Deploy frontend code
   - Run smoke tests

## Support & Troubleshooting

- Check migration logs: `npm run migrate:status`
- Review error messages in terminal output
- Verify database connectivity before running migrations
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility: `node --version` (v16+ recommended)

---

**Created as part of:** Phase 3 Architecture Implementation  
**Files Modified:** 4 migration files, 1 backend controller, 1 routes file, 1 frontend API client, 8 models, 2 services  
**Total Implementation Time:** Milestone 1 (Data Foundation) - Complete
