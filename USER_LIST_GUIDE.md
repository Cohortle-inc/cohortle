# How to Get User Email Lists from Cohortle

## Quick Summary

I've created several tools to help you get a list of all registered users:

1. **Node.js Scripts** (run on production server)
2. **SQL Queries** (run in database tool)
3. **Direct Database Access** (via phpMyAdmin or similar)

## Method 1: Node.js Scripts (Recommended)

### Files Created:
- `cohortle-api/get-all-users.js` - Displays users in console
- `cohortle-api/export-users-csv.js` - Exports to CSV file

### How to Run:

#### Option A: Via Coolify
1. Log into Coolify
2. Navigate to `cohortle-api` service
3. Click "Execute Command" or "Terminal"
4. Run:
   ```bash
   cd /app
   node get-all-users.js
   ```
5. Or to export CSV:
   ```bash
   node export-users-csv.js
   ```

#### Option B: Via SSH
1. SSH into your production server:
   ```bash
   ssh root@u08gs4kgcogg8kc4k44s0ggk
   ```

2. Navigate to the API directory:
   ```bash
   cd /path/to/cohortle-api
   ```

3. Run the script:
   ```bash
   node get-all-users.js
   ```

4. Or export to CSV:
   ```bash
   node export-users-csv.js
   ```

### Output Format:

The script will display:
```
=== Cohortle Registered Users ===

Total Users: 25

📚 STUDENTS (20):
────────────────────────────────────────────────────────────────────────────────
1. student1@example.com
   Name: John Doe
   ID: 1
   Joined: 2026-03-01
   Status: active

2. student2@example.com
   ...

👨‍🏫 CONVENERS (5):
────────────────────────────────────────────────────────────────────────────────
1. convener1@example.com
   Name: Jane Smith
   ID: 15
   Joined: 2026-03-05
   Status: active

=== Summary ===
Students: 20
Conveners: 5
Total: 25
```

The CSV export creates a file like: `cohortle-users-2026-03-07.csv`

## Method 2: SQL Queries (Direct Database Access)

### File Created:
- `get-users.sql` - Contains multiple useful queries

### How to Run:

1. **Access your database** via:
   - phpMyAdmin
   - MySQL Workbench
   - Coolify database management
   - Command line MySQL client

2. **Select the `cohortle` database**

3. **Run one of these queries:**

#### Get All Users:
```sql
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(r.name, 'unassigned') as role,
    DATE_FORMAT(u.joined_at, '%Y-%m-%d %H:%i:%s') as joined_date,
    u.status
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
ORDER BY u.joined_at DESC;
```

#### Get Student Emails Only:
```sql
SELECT GROUP_CONCAT(u.email SEPARATOR ', ') as student_emails
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'student';
```

#### Get Convener Emails Only:
```sql
SELECT GROUP_CONCAT(u.email SEPARATOR ', ') as convener_emails
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'convener';
```

#### Get Summary by Role:
```sql
SELECT 
    COALESCE(r.name, 'unassigned') as role,
    COUNT(*) as count
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
GROUP BY r.name
ORDER BY count DESC;
```

## Method 3: Via Coolify Database Management

1. Log into Coolify
2. Find your MySQL database service
3. Click "Database Management" or "phpMyAdmin"
4. Select the `cohortle` database
5. Go to SQL tab
6. Paste and run any query from `get-users.sql`

## Method 4: Command Line (Production Server)

If you have SSH access:

```bash
# SSH into server
ssh root@u08gs4kgcogg8kc4k44s0ggk

# Connect to MySQL
mysql -u root -p cohortle

# Run query
SELECT u.email, r.name as role 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.role_id 
ORDER BY r.name, u.email;
```

## Export Options

### CSV Export (Node.js):
```bash
node export-users-csv.js
```
Creates: `cohortle-users-YYYY-MM-DD.csv`

### CSV Export (SQL):
In phpMyAdmin or MySQL Workbench:
1. Run the query
2. Click "Export" button
3. Choose CSV format
4. Download file

### Text File (Node.js):
```bash
node get-all-users.js > users.txt
```

## What You'll Get

### User Information Includes:
- User ID
- Email address
- First name
- Last name
- Role (student, convener, instructor, administrator, unassigned)
- Join date
- Account status

### Grouped By:
- Students (learners)
- Conveners
- Instructors
- Administrators
- Unassigned (users without a role)

## Troubleshooting

### "Cannot connect to database"
- Make sure you're running the script on the production server
- Check that the database is running
- Verify `.env` file has correct database credentials

### "No users found"
- Check you're connected to the correct database
- Verify the `users` table exists
- Check if there are actually users in the database

### "Permission denied"
- Make sure you have SSH access to the server
- Verify you have database access permissions
- Check file permissions on the scripts

## Security Note

⚠️ **Important**: User email lists contain personal information. Handle with care:
- Don't share publicly
- Store securely
- Delete when no longer needed
- Follow GDPR/data protection regulations

## Files Created

1. `cohortle-api/get-all-users.js` - Console display script
2. `cohortle-api/export-users-csv.js` - CSV export script
3. `get-users.sql` - SQL queries
4. `get-users-from-production.ps1` - Helper script
5. `USER_LIST_GUIDE.md` - This guide

## Need Help?

If you need assistance:
1. Check Coolify logs for errors
2. Verify database connection
3. Ensure scripts have correct permissions
4. Contact your system administrator

## Quick Commands Reference

```bash
# Display users in console
node get-all-users.js

# Export to CSV
node export-users-csv.js

# Save to text file
node get-all-users.js > users.txt

# Run SQL query
mysql -u root -p cohortle < get-users.sql
```
