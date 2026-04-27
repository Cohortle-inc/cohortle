# PowerShell script to diagnose specific users
# Usage: .\diagnose-specific-users.ps1

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "DIAGNOSING AUTHENTICATION ISSUE FOR SPECIFIC USERS" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if diagnostic script exists
if (-not (Test-Path "diagnose-specific-users.js")) {
    Write-Host "ERROR: diagnose-specific-users.js not found" -ForegroundColor Red
    exit 1
}

# Run diagnostic
Write-Host "Running diagnostic script..." -ForegroundColor Yellow
Write-Host ""

node diagnose-specific-users.js

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "DIAGNOSTIC COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Review the diagnostic output above" -ForegroundColor White
    Write-Host "2. If a user is missing role assignments, run:" -ForegroundColor White
    Write-Host "   node fix-specific-user.js <email>" -ForegroundColor Cyan
    Write-Host "   Example: node fix-specific-user.js learner5@cohortle.com" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "==============================================================================" -ForegroundColor Red
    Write-Host "DIAGNOSTIC FAILED" -ForegroundColor Red
    Write-Host "==============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
}

exit $exitCode
