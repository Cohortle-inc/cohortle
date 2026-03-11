#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run Role Assignment Fix on Production Server

.DESCRIPTION
    This script executes the role assignment fix on the production server
    where the database is accessible. It should NOT be run from a local machine.

.NOTES
    Execute this script ON the production server via SSH or Coolify console
#>

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Role Assignment Fix - Production Execution" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "scripts/fix-users-without-roles.js")) {
    Write-Host "Error: This script must be run from the cohortle-api directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run:" -ForegroundColor Yellow
    Write-Host "  cd /app  # or wherever cohortle-api is deployed" -ForegroundColor White
    Write-Host "  pwsh run-role-assignment-fix.ps1" -ForegroundColor White
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found" -ForegroundColor Red
    Write-Host "Please ensure database credentials are configured" -ForegroundColor Yellow
    exit 1
}

# Test database connection
Write-Host "Step 1: Testing database connection..." -ForegroundColor Yellow
$testScript = @"
const db = require('./models');
db.sequelize.authenticate()
  .then(() => {
    console.log('✓ Database connected');
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });
"@

$testResult = node -e $testScript 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Cannot connect to database" -ForegroundColor Red
    Write-Host "Please check your database credentials in .env" -ForegroundColor Yellow
    Write-Host $testResult -ForegroundColor Red
    exit 1
}
Write-Host $testResult -ForegroundColor Green
Write-Host ""

# Run the fix script
Write-Host "Step 2: Running role assignment fix..." -ForegroundColor Yellow
Write-Host ""

node scripts/fix-users-without-roles.js

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "✓ Fix completed successfully!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test user login and dashboard access" -ForegroundColor White
    Write-Host "2. Monitor application logs for authentication errors" -ForegroundColor White
    Write-Host "3. Verify role-based routing works correctly" -ForegroundColor White
    Write-Host "4. Proceed to Task 1.4 (Verify database integrity)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "✗ Fix failed - please review the errors above" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}
