# Email Verification Database Setup

## Overview

This document describes the database setup for the Email Verification Flow Improvement feature. The setup includes creating the `verification_tokens` table and verifying the `email_verified` field exists in the `users` table.

## Database Schema

### verification_tokens Table

**Purpose:** Store email verification tokens with expiration tracking

**Schema:**
```sql
CREATE TABLE verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_verification_tokens_token (token),
  INDEX idx_verification_tokens_user_id (user_id),
  INDEX idx_verification_tokens_expires_at (expires_at)
);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table (CASCADE on delete)
- `token`: Unique verification token (64 character hex string)
- `expires_at`: Token expiration timestamp (24 hours from creation)
- `created_at`: Token creation timestamp
- `used_at`: Timestamp when token was successfully used (NULL if unused)

**Indexes:**
- `idx_verification_tokens_token`: Fast lookup during verification
- `idx_verification_tokens_user_id`: Fast lookup of user's tokens
- `idx_verification_tokens_expires_at`: Efficient cleanup of expired tokens

### users Table Update

**Required Field:** `email_verified`

The `email_verified` field should already exist from migration `20250425194222-add-email-to-users.js`:

```sql
ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;
```

## Migration Files

### Primary Migration
- **File:** `cohortle-api/migrations/20260306000000-create-verification-tokens.js`
- **Purpose:** Create verification_tokens table with indexes
- **Requirements:** 4.1, 7.1, 7.2

### Prerequisite Migration
- **File:** `cohortle-api/migrations/20250425194222-add-email-to-users.js`
- **Purpose:** Add email and email_verified fields to users table
- **Status:** Should already be applied

## Running the Migration

### Option 1: Using the Migration Script (Recommended)

The migration script provides detailed feedback and verification:

**On Windows (PowerShell):**
```powershell
.\run-verification-migration.ps1
```

**On Linux/Mac:**
```bash
chmod +x run-verification-migration.sh
./run-verification-migration.sh
```

**On Production Server:**
```bash
cd cohortle-api
node run-verification-tokens-migration.js
```

### Option 2: Using Sequelize CLI

```bash
cd cohortle-api
npx sequelize-cli db:migrate --to 20260306000000-create-verification-tokens.js
```

## Verification Steps

After running the migration, verify the setup:

### 1. Check Table Exists

```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'cohortle' 
  AND TABLE_NAME = 'verification_tokens';
```

Expected: 1 row returned

### 2. Check Table Structure

```sql
DESCRIBE verification_tokens;
```

Expected output:
```
+------------+--------------+------+-----+-------------------+----------------+
| Field      | Type         | Null | Key | Default           | Extra          |
+------------+--------------+------+-----+-------------------+----------------+
| id         | int          | NO   | PRI | NULL              | auto_increment |
| user_id    | int          | NO   | MUL | NULL              |                |
| token      | varchar(255) | NO   | UNI | NULL              |                |
| expires_at | datetime     | NO   | MUL | NULL              |                |
| created_at | datetime     | NO   |     | CURRENT_TIMESTAMP |                |
| used_at    | datetime     | YES  |     | NULL              |                |
+------------+--------------+------+-----+-------------------+----------------+
```

### 3. Check Indexes

```sql
SHOW INDEX FROM verification_tokens;
```

Expected indexes:
- PRIMARY (id)
- token (UNIQUE)
- idx_verification_tokens_token
- idx_verification_tokens_user_id
- idx_verification_tokens_expires_at

### 4. Check Foreign Key Constraint

```sql
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'cohortle'
  AND TABLE_NAME = 'verification_tokens'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

Expected: Foreign key from `user_id` to `users.id` with CASCADE on delete

### 5. Check email_verified Field in users Table

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cohortle'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'email_verified';
```

Expected: 1 row with TINYINT(1), NOT NULL, DEFAULT 0

## Migration Script Features

The `run-verification-tokens-migration.js` script provides:

1. **Connection Testing:** Verifies database connectivity before migration
2. **Prerequisite Checking:** Ensures email_verified field exists
3. **Idempotency:** Safely handles already-applied migrations
4. **Detailed Feedback:** Shows table structure and indexes after creation
5. **Error Handling:** Clear error messages with troubleshooting steps

## Troubleshooting

### Migration Already Applied

If the migration has already been applied, the script will:
- Detect the existing table
- Display current table structure
- Display current indexes
- Exit successfully

This is safe and expected behavior.

### Database Connection Failed

**Error:** `getaddrinfo ENOTFOUND` or connection timeout

**Solutions:**
1. Verify database credentials in `.env` file
2. Check database hostname is correct and accessible
3. Verify database port (default: 3306)
4. Check firewall rules allow database connections
5. Ensure database server is running

### email_verified Field Missing

**Error:** `email_verified field NOT found in users table`

**Solution:**
Run the prerequisite migration first:
```bash
npx sequelize-cli db:migrate --to 20250425194222-add-email-to-users.js
```

### Table Creation Failed

**Error:** Table creation fails with SQL error

**Solutions:**
1. Check database user has CREATE TABLE permissions
2. Verify users table exists (required for foreign key)
3. Check database has sufficient storage space
4. Review database error logs for specific issues

## Rollback

To rollback the migration (remove verification_tokens table):

```bash
cd cohortle-api
npx sequelize-cli db:migrate:undo --to 20260306000000-create-verification-tokens.js
```

**Warning:** This will delete all verification tokens. Only use in development or if you need to recreate the table.

## Next Steps

After successful migration:

1. ✅ verification_tokens table created
2. ✅ Indexes created for performance
3. ✅ Foreign key constraint to users table
4. ✅ email_verified field exists in users table

**Ready to proceed with:**
- Task 2: Backend Verification Token Service implementation
- Task 3: Auth routes enhancement
- Task 4: Access control middleware

## Database Maintenance

### Cleanup Expired Tokens

Expired tokens should be cleaned up periodically. This will be implemented in the VerificationTokenService:

```javascript
// Run daily via cron job
await VerificationTokenService.cleanupExpiredTokens();
```

Recommended: Set up a daily cron job to clean up expired tokens:

```sql
DELETE FROM verification_tokens 
WHERE expires_at < NOW() 
  AND used_at IS NULL;
```

### Monitor Token Usage

Track verification token metrics:

```sql
-- Total tokens
SELECT COUNT(*) as total_tokens FROM verification_tokens;

-- Unused tokens
SELECT COUNT(*) as unused_tokens 
FROM verification_tokens 
WHERE used_at IS NULL;

-- Expired tokens
SELECT COUNT(*) as expired_tokens 
FROM verification_tokens 
WHERE expires_at < NOW() AND used_at IS NULL;

-- Recently used tokens (last 24 hours)
SELECT COUNT(*) as recent_verifications 
FROM verification_tokens 
WHERE used_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## References

- **Spec:** `.kiro/specs/email-verification-flow-improvement/`
- **Requirements:** 4.1, 7.1, 7.2
- **Design:** See design.md for complete architecture
- **Migration File:** `cohortle-api/migrations/20260306000000-create-verification-tokens.js`
