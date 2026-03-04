# Run Production Migration from Local Machine
# This script connects to the production database and runs the migration

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Production Migration Runner (Local)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set production database environment variables
$env:DB_HOSTNAME = "107.175.94.134"
$env:DB_PORT = "3306"
$env:DB_USER = "root"
$env:DB_PASSWORD = "ergKTYj00ZjjTRb1iWC3BW79oPN6uFe9A34FrF409EwZAjaWwJUI6k5OcCV6w1um"
$env:DB_DATABASE = "cohortle"
$env:NODE_ENV = "production"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   Database: $env:DB_DATABASE"
Write-Host "   Host: $env:DB_HOSTNAME"
Write-Host "   Port: $env:DB_PORT"
Write-Host ""

Write-Host "WARNING: This will run migrations on PRODUCTION database!" -ForegroundColor Red
Write-Host ""
Write-Host "Press Ctrl+C within 5 seconds to cancel..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 5

Write-Host "Starting migration..." -ForegroundColor Green
Write-Host ""

# Change to API directory and run migration
Push-Location cohortle-api

try {
    npm run migrate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  1. Database connection failed (check firewall/network)"
        Write-Host "  2. Orphaned cohorts exist (cohorts with invalid programme_id)"
        Write-Host "  3. Foreign key constraint already exists"
        Write-Host "  4. Database permissions issue"
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "Error running migration: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    Pop-Location
}

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify migration in database"
Write-Host "  2. Test cohort creation in production"
Write-Host "  3. Monitor for any issues"
Write-Host ""
