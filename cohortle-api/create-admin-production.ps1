# Create Administrator User - Production
# This script promotes an existing user to administrator role

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$Reason = "Promoted to platform administrator"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Create Administrator User" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Reason: $Reason" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Promote this user to administrator? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating administrator..." -ForegroundColor Cyan
node scripts/create-admin-user.js $Email $Reason

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
