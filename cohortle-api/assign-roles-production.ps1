# Assign Roles to Existing Users - Production
# This script should be run on the production server AFTER the seeder

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Assign Roles to Existing Users" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Assign 'student' role to all users without roles"
Write-Host "  2. Create role assignments"
Write-Host "  3. Log changes in role assignment history"
Write-Host ""
Write-Host "⚠️  Make sure you have run the seeder first!" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running role assignment script..." -ForegroundColor Cyan
node scripts/assign-roles-to-existing-users.js

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
