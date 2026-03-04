# Production 502 Diagnosis Script
# Run this to test your production API

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Production 502 Diagnosis Tool" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://api.cohortle.com"

# Test 1: Check if API is reachable
Write-Host "Test 1: Checking API reachability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/v1/api/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Success: API is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Failed: API is NOT reachable" -ForegroundColor Red
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 502) {
        Write-Host ""
        Write-Host "502 Bad Gateway detected!" -ForegroundColor Red
        Write-Host "This means:" -ForegroundColor Yellow
        Write-Host "  - The reverse proxy (Coolify) is working" -ForegroundColor Yellow
        Write-Host "  - But it cannot reach your API container" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "  1. API container is not running" -ForegroundColor White
        Write-Host "  2. API crashed during startup (check logs)" -ForegroundColor White
        Write-Host "  3. Database connection failed" -ForegroundColor White
        Write-Host "  4. Environment variables are wrong" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

# Test 2: Check deployment endpoint
Write-Host "Test 2: Checking deployment endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/v1/api/deployment" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Success: Deployment endpoint reachable" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Failed: Deployment endpoint failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan

# Test 3: Check web frontend
Write-Host "Test 3: Checking web frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://cohortle.com" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Success: Web frontend is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Failed: Web frontend failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Diagnosis Complete" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check API container logs in Coolify" -ForegroundColor White
Write-Host "2. Verify environment variables are set correctly" -ForegroundColor White
Write-Host "3. Ensure MySQL service is running" -ForegroundColor White
Write-Host "4. Test database connectivity from API container" -ForegroundColor White
Write-Host ""
Write-Host "See PRODUCTION_502_DIAGNOSIS.md for detailed troubleshooting" -ForegroundColor Cyan
