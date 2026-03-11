#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Fix role assignments for users in production database

.DESCRIPTION
    This script checks for users without role assignments and assigns them the student role.
    It also provides diagnostic information about the role system.

.NOTES
    Run this script on the production server with database access
#>

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Production Role Assignment Fix Script" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Database connection details (from .env)
$dbHost = $env:DB_HOSTNAME
$dbUser = $env:DB_USER
$dbPassword = $env:DB_PASSWORD
$dbName = $env:DB_DATABASE

if (-not $dbHost -or -not $dbUser -or -not $dbPassword -or -not $dbName) {
    Write-Host "Error: Database environment variables not set" -ForegroundColor Red
    Write-Host "Please ensure DB_HOSTNAME, DB_USER, DB_PASSWORD, and DB_DATABASE are set" -ForegroundColor Red
    exit 1
}

Write-Host "Database: $dbName @ $dbHost" -ForegroundColor Gray
Write-Host ""

# Function to run MySQL query
function Invoke-MySqlQuery {
    param(
        [string]$Query,
        [switch]$Silent = $false
    )
    
    if ($Verbose -and -not $Silent) {
        Write-Host "Executing query:" -ForegroundColor Gray
        Write-Host $Query -ForegroundColor DarkGray
        Write-Host ""
    }
    
    $result = mysql -h $dbHost -u $dbUser -p$dbPassword $dbName -e $Query 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error executing query: $result" -ForegroundColor Red
        return $null
    }
    
    return $result
}

# Test database connection
Write-Host "Step 1: Testing database connection..." -ForegroundColor Yellow
$testResult = Invoke-MySqlQuery -Query "SELECT 1 as test;" -Silent
if ($null -eq $testResult) {
    Write-Host "✗ Database connection failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database connection successful" -ForegroundColor Green
Write-Host ""

# Check roles table
Write-Host "Step 2: Checking roles table..." -ForegroundColor Yellow
$rolesQuery = @"
SELECT role_id, name, description FROM roles;
"@
$roles = Invoke-MySqlQuery -Query $rolesQuery
Write-Host $roles
Write-Host ""

# Check for users without role assignments
Write-Host "Step 3: Checking for users without role assignments..." -ForegroundColor Yellow
$usersWithoutRolesQuery = @"
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL
ORDER BY u.created_at DESC;
"@
$usersWithoutRoles = Invoke-MySqlQuery -Query $usersWithoutRolesQuery

if ($usersWithoutRoles -match "Empty set") {
    Write-Host "✓ All users have role assignments" -ForegroundColor Green
    Write-Host ""
    Write-Host "No fixes needed!" -ForegroundColor Green
    exit 0
}

Write-Host $usersWithoutRoles
Write-Host ""

# Count users without roles
$countQuery = @"
SELECT COUNT(*) as count
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
"@
$count = Invoke-MySqlQuery -Query $countQuery
Write-Host "Found users without role assignments" -ForegroundColor Yellow
Write-Host $count
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN: Would assign student role to these users" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to apply fixes" -ForegroundColor Yellow
    exit 0
}

# Confirm before proceeding
Write-Host "Do you want to assign the 'student' role to these users? (Y/N)" -ForegroundColor Yellow
$confirmation = Read-Host
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "Operation cancelled" -ForegroundColor Yellow
    exit 0
}

# Get student role ID
Write-Host ""
Write-Host "Step 4: Getting student role ID..." -ForegroundColor Yellow
$studentRoleQuery = @"
SELECT role_id FROM roles WHERE name = 'student' LIMIT 1;
"@
$studentRoleId = Invoke-MySqlQuery -Query $studentRoleQuery
$studentRoleId = ($studentRoleId -split "`n")[1].Trim()
Write-Host "Student role ID: $studentRoleId" -ForegroundColor Gray
Write-Host ""

# Assign student role to users without roles
Write-Host "Step 5: Assigning student role to users..." -ForegroundColor Yellow
$assignRolesQuery = @"
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
  u.id,
  '$studentRoleId',
  1,
  NOW(),
  'active'
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
"@

$assignResult = Invoke-MySqlQuery -Query $assignRolesQuery
if ($null -eq $assignResult) {
    Write-Host "✗ Failed to assign roles" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Roles assigned successfully" -ForegroundColor Green
Write-Host $assignResult
Write-Host ""

# Verify fix
Write-Host "Step 6: Verifying fix..." -ForegroundColor Yellow
$verifyQuery = @"
SELECT COUNT(*) as count
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
"@
$remainingCount = Invoke-MySqlQuery -Query $verifyQuery
Write-Host $remainingCount
Write-Host ""

if ($remainingCount -match "0") {
    Write-Host "✓ All users now have role assignments!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some users still don't have role assignments" -ForegroundColor Yellow
    Write-Host "Please review the database manually" -ForegroundColor Yellow
}

# Show role distribution
Write-Host ""
Write-Host "Step 7: Role distribution after fix..." -ForegroundColor Yellow
$distributionQuery = @"
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name
ORDER BY user_count DESC;
"@
$distribution = Invoke-MySqlQuery -Query $distributionQuery
Write-Host $distribution
Write-Host ""

Write-Host "===========================================================" -ForegroundColor Green
Write-Host "Fix completed successfully!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test user login and dashboard access" -ForegroundColor White
Write-Host "2. Monitor application logs for authentication errors" -ForegroundColor White
Write-Host "3. Verify role-based routing works correctly" -ForegroundColor White
