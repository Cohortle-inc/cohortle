# PowerShell script to run verification_tokens migration on production
# Run this script on the production server where the database is accessible

Write-Host "🔄 Running verification_tokens migration on production..." -ForegroundColor Cyan
Write-Host ""

# Navigate to API directory
Set-Location cohortle-api

# Run the migration script
Write-Host "📡 Connecting to database and running migration..." -ForegroundColor Yellow
node run-verification-tokens-migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify the verification_tokens table exists in the database"
    Write-Host "2. Check that all indexes are created (token, user_id, expires_at)"
    Write-Host "3. Proceed with implementing the VerificationTokenService"
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify database credentials in .env file"
    Write-Host "2. Check database connectivity"
    Write-Host "3. Ensure the users table has the email_verified field"
    exit 1
}
