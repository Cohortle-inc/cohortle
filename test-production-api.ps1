# Test Production API Configuration
# This script tests the production API to see if it's configured correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production API Configuration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://api.cohortle.com"

# Test 1: API Health Check
Write-Host "1. Testing API Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/api/health" -Method Get -ErrorAction Stop
    Write-Host "   Pass - API is responding" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   Fail - API health check failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if API returns proper error for unauthenticated request
Write-Host "2. Testing API Authentication..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/v1/api/programmes/enrolled" -Method Get -UseBasicParsing -ErrorAction Stop
    Write-Host "   Warning - API returned success without auth (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   Pass - API correctly requires authentication" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   Warning - API returned 400 Bad Request" -ForegroundColor Yellow
        Write-Host "   This might indicate a configuration issue" -ForegroundColor Yellow
    } else {
        Write-Host "   Fail - Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Check CORS headers
Write-Host "3. Testing CORS Configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/v1/api/health" -Method Get -UseBasicParsing -ErrorAction Stop
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "   Pass - CORS headers present" -ForegroundColor Green
        Write-Host "   Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Gray
    } else {
        Write-Host "   Warning - No CORS headers found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Fail - Could not check CORS headers" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check if API is using production database (indirect test)
Write-Host "4. Checking API Configuration Indicators..." -ForegroundColor Yellow
Write-Host "   Note: Cannot directly check environment variables" -ForegroundColor Gray
Write-Host "   But we can infer from API behavior:" -ForegroundColor Gray
Write-Host ""
Write-Host "   If you see these symptoms, DB config is likely wrong:" -ForegroundColor Yellow
Write-Host "   - 400 errors when loading programmes" -ForegroundColor Gray
Write-Host "   - Empty programme lists for enrolled users" -ForegroundColor Gray
Write-Host "   - Authentication works but data doesn't load" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WHAT TO CHECK IN YOUR DEPLOYMENT PLATFORM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to your deployment platform and verify:" -ForegroundColor Yellow
Write-Host ""
Write-Host "For cohortle-api service:" -ForegroundColor Cyan
Write-Host "  1. DB_HOSTNAME - should NOT be 127.0.0.1 or localhost" -ForegroundColor White
Write-Host "  2. DB_DATABASE - should NOT be cohortle_test" -ForegroundColor White
Write-Host "  3. NODE_ENV - should be 'production'" -ForegroundColor White
Write-Host "  4. JWT_SECRET - should NOT be the placeholder value" -ForegroundColor White
Write-Host ""
Write-Host "For cohortle-web service:" -ForegroundColor Cyan
Write-Host "  1. NEXT_PUBLIC_API_URL - should be https://api.cohortle.com" -ForegroundColor White
Write-Host "  2. Git commit - should be 068c709 or later" -ForegroundColor White
Write-Host ""
Write-Host "See PRODUCTION_ENV_CHECKLIST.md for detailed instructions" -ForegroundColor Green
Write-Host ""
