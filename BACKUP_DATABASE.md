# Database Backup Instructions

## Step 1: Connect to Your Server

Open a terminal (PowerShell or Command Prompt) and SSH into your RackNerd VPS:

```bash
ssh your-username@your-vps-ip-address
```

Replace:
- `your-username` with your VPS username (usually `root` or a custom user)
- `your-vps-ip-address` with your RackNerd VPS IP

## Step 2: Create Backup Directory (Optional)

```bash
# Create a backups directory if it doesn't exist
mkdir -p ~/backups
cd ~/backups
```

## Step 3: Run Database Backup

You'll need your database credentials. These are usually in your Coolify environment variables or `.env` file.

```bash
# Basic backup command
mysqldump -u [DB_USERNAME] -p[DB_PASSWORD] cohortle_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Example (replace with your actual credentials):
# mysqldump -u cohortle_user -pYourPassword123 cohortle_db > backup_20260220_143000.sql
```

**Important Notes:**
- There's NO SPACE between `-p` and your password
- If your password has special characters, wrap it in quotes: `-p'Your$Pass123'`
- The backup file will be named with current date/time (e.g., `backup_20260220_143000.sql`)

## Step 4: Verify Backup Created

```bash
# List backup files
ls -lh backup_*.sql

# Check file size (should be several MB, not 0 bytes)
du -h backup_*.sql
```

**Expected Output:**
```
-rw-r--r-- 1 root root 15M Feb 20 14:30 backup_20260220_143000.sql
```

If the file size is 0 bytes or very small (< 1MB), the backup failed.

## Step 5: Download Backup to Your Local Machine (Recommended)

From your **local Windows machine**, open a new PowerShell window:

```powershell
# Download backup to your local machine
scp your-username@your-vps-ip:~/backups/backup_*.sql C:\Users\Sal\Desktop\CODEBASE\backups\

# Example:
# scp root@123.45.67.89:~/backups/backup_20260220_143000.sql C:\Users\Sal\Desktop\CODEBASE\backups\
```

This creates a local copy in case you need to restore later.

## Alternative: Via Coolify Database Terminal

If Coolify provides direct database access:

1. Open Coolify dashboard
2. Navigate to your MySQL/Database service
3. Click "Terminal" or "Console"
4. Run:
   ```bash
   mysqldump -u root -p cohortle_db > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
   ```
5. Download the file from `/tmp/` directory

## Troubleshooting

### Issue: "Access denied for user"
**Solution**: Check your database credentials in Coolify environment variables or `.env` file

### Issue: "mysqldump: command not found"
**Solution**: Install MySQL client:
```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# CentOS/RHEL
sudo yum install mysql
```

### Issue: "Can't connect to MySQL server"
**Solution**: 
- Check if MySQL is running: `systemctl status mysql`
- Verify database host (might be `localhost`, `127.0.0.1`, or a container name)

### Issue: Backup file is 0 bytes
**Solution**: 
- Check database name is correct: `mysql -u [user] -p -e "SHOW DATABASES;"`
- Verify user has permissions: `mysql -u [user] -p -e "SHOW GRANTS;"`

## Finding Your Database Credentials

### Method 1: Check Coolify Environment Variables
1. Open Coolify dashboard
2. Go to your `cohortle-api` application
3. Click "Environment Variables"
4. Look for:
   - `DB_USER` or `DATABASE_USER`
   - `DB_PASSWORD` or `DATABASE_PASSWORD`
   - `DB_NAME` or `DATABASE_NAME`

### Method 2: Check .env file on server
```bash
# SSH into server
cd /path/to/cohortle-api
cat .env | grep DB_
```

### Method 3: Check Coolify Database Service
1. In Coolify, find your MySQL/Database service
2. Check service details for credentials
3. Usually shows username, password, and database name

## Next Steps

Once backup is complete and verified:
- ✅ Backup file created and has reasonable size (> 1MB)
- ✅ Backup downloaded to local machine (recommended)
- ✅ Ready to proceed to Step 2: Commit and Push Changes

---

**Backup Location**: `~/backups/backup_YYYYMMDD_HHMMSS.sql` on server  
**Local Copy**: `C:\Users\Sal\Desktop\CODEBASE\backups\` (if downloaded)

**IMPORTANT**: Keep this backup safe until deployment is verified successful!
