# PowerShell script to run the bio and linkedin_username migration
# This adds the missing columns to the production database

Write-Host "=== Bio & LinkedIn Migration Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if the migration script exists
if (-not (Test-Path "run-bio-linkedin-migration.js")) {
    Write-Host "Error: run-bio-linkedin-migration.js not found" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path "cohortle-api/.env")) {
    Write-Host "Error: cohortle-api/.env file not found" -ForegroundColor Red
    Write-Host "Please ensure your database credentials are configured" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running migration..." -ForegroundColor Yellow
Write-Host ""

# Run the migration script
node run-bio-linkedin-migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the profile endpoint to verify it works" -ForegroundColor White
    Write-Host "2. Check that bio and linkedin_username fields are accessible" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Migration failed. Please check the error messages above." -ForegroundColor Red
    exit 1
}
