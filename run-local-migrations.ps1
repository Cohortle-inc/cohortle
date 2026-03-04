# Run migrations on local database
# This script sets NODE_ENV to 'local' and runs migrations

Write-Host "🔄 Running migrations on local database..." -ForegroundColor Cyan
Write-Host ""

# Save current directory
$originalDir = Get-Location

try {
    # Navigate to API directory
    Set-Location "cohortle-api"
    
    # Set environment to local
    $env:NODE_ENV = "local"
    
    Write-Host "Environment: local" -ForegroundColor Yellow
    Write-Host "Database: cohortle@127.0.0.1" -ForegroundColor Yellow
    Write-Host ""
    
    # Run migrations
    npx sequelize-cli db:migrate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    # Return to original directory
    Set-Location $originalDir
}
