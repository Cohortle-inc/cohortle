# PowerShell script to upgrade wecarefng@gmail.com to convener role on production server
# Run this script on the production server where the API is deployed

Write-Host "🚀 Upgrading wecarefng@gmail.com to Convener Role" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to API directory
$apiPath = "cohortle-api"
if (Test-Path $apiPath) {
    Set-Location $apiPath
    Write-Host "✅ Found API directory" -ForegroundColor Green
} else {
    Write-Host "❌ API directory not found. Please run this from the project root." -ForegroundColor Red
    exit 1
}

# Run the upgrade script
Write-Host ""
Write-Host "🔄 Running upgrade script..." -ForegroundColor Yellow
node upgrade-user-to-convener.js wecarefng@gmail.com

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
