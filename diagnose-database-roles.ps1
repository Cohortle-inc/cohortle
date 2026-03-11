#!/usr/bin/env pwsh
# ============================================================
# Database Role System Diagnostic Runner
# ============================================================
# This script runs the comprehensive database diagnostic
# for the authentication and role system
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DATABASE ROLE SYSTEM DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "cohortle-api/diagnose-database-roles.js")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "Using Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path "cohortle-api/.env")) {
    Write-Host "Warning: .env file not found in cohortle-api/" -ForegroundColor Yellow
    Write-Host "Make sure database credentials are configured" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Running database diagnostics..." -ForegroundColor Cyan
Write-Host ""

# Run the diagnostic script
Push-Location cohortle-api
try {
    node diagnose-database-roles.js
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "Diagnostic completed successfully" -ForegroundColor Green
    } else {
        Write-Host "Diagnostic completed with errors (exit code: $exitCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error running diagnostic: $_" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If issues were found:" -ForegroundColor Yellow
Write-Host "  1. Review the diagnostic output above" -ForegroundColor White
Write-Host "  2. Run fix script if users without roles: node cohortle-api/scripts/fix-users-without-roles.js" -ForegroundColor White
Write-Host "  3. Document findings in MVP_AUTH_BUG_HUNT_FINDINGS.md" -ForegroundColor White
Write-Host ""
Write-Host "To run SQL diagnostics directly:" -ForegroundColor Yellow
Write-Host "  mysql -u [user] -p [database] < cohortle-api/diagnose-database-roles.sql" -ForegroundColor White
Write-Host ""
