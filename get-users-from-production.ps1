# Get Users from Production Database
# This script connects to the production server and retrieves all users

Write-Host "=== Cohortle User List Retrieval ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will retrieve all registered users from the production database." -ForegroundColor Yellow
Write-Host ""

# Server details
$serverHost = "u08gs4kgcogg8kc4k44s0ggk"
$serverUser = "root"  # or your SSH username

Write-Host "Server: $serverHost" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 1: Run via SSH" -ForegroundColor Yellow
Write-Host "─".PadRight(80, '─') -ForegroundColor Gray
Write-Host ""
Write-Host "1. SSH into the production server:" -ForegroundColor White
Write-Host "   ssh $serverUser@$serverHost" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to the API directory:" -ForegroundColor White
Write-Host "   cd /path/to/cohortle-api" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run the user list script:" -ForegroundColor White
Write-Host "   node get-all-users.js" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Or export to CSV:" -ForegroundColor White
Write-Host "   node export-users-csv.js" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Direct Database Query" -ForegroundColor Yellow
Write-Host "─".PadRight(80, '─') -ForegroundColor Gray
Write-Host ""
Write-Host "If you have direct database access, run this SQL query:" -ForegroundColor White
Write-Host ""
Write-Host @"
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role,
    u.joined_at,
    u.status
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
ORDER BY u.joined_at DESC;
"@ -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 3: Via Coolify" -ForegroundColor Yellow
Write-Host "─".PadRight(80, '─') -ForegroundColor Gray
Write-Host ""
Write-Host "1. Log into Coolify" -ForegroundColor White
Write-Host "2. Go to cohortle-api service" -ForegroundColor White
Write-Host "3. Click 'Execute Command'" -ForegroundColor White
Write-Host "4. Run: node get-all-users.js" -ForegroundColor White
Write-Host ""

Write-Host "The scripts have been created in cohortle-api/:" -ForegroundColor Green
Write-Host "  - get-all-users.js (displays in console)" -ForegroundColor Gray
Write-Host "  - export-users-csv.js (creates CSV file)" -ForegroundColor Gray
Write-Host ""
