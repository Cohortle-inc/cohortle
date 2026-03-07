# Production Status Test Script
# Tests all critical endpoints to identify network issues

Write-Host "=== Cohortle Production Status Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" -Method GET -UseBasicParsing
    $healthData = $healthResponse.Content | ConvertFrom-Json
    if ($healthData.error -eq $false) {
        Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
        Write-Host "   Database time: $($healthData.db_time)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Backend returned error" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Frontend Health
Write-Host "2. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://cohortle.com" -Method GET -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Frontend returned status: $($frontendResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Frontend check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login Endpoint
Write-Host "3. Testing Login Endpoint..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@example.com"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    # We expect 401 for wrong credentials, which means endpoint is working
    if ($loginResponse.StatusCode -eq 401) {
        Write-Host "   ✅ Login endpoint is responding (401 as expected)" -ForegroundColor Green
    } elseif ($loginResponse.StatusCode -eq 200) {
        Write-Host "   ⚠ Login succeeded (unexpected with test credentials)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Login endpoint is responding (401 as expected)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Login endpoint error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Programmes Endpoint (requires auth)
Write-Host "4. Testing Programmes Endpoint..." -ForegroundColor Yellow
try {
    $progResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/programmes/my" `
        -Method GET `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    if ($progResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Programmes endpoint responding" -ForegroundColor Green
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Programmes endpoint responding (401 - auth required)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Programmes endpoint error: Status $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: CORS Headers
Write-Host "5. Testing CORS Configuration..." -ForegroundColor Yellow
try {
    $corsResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://cohortle.com"
            "Access-Control-Request-Method" = "POST"
        } `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    if ($allowOrigin) {
        Write-Host "   ✅ CORS configured: $allowOrigin" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ CORS headers not found in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠ Could not test CORS: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed, the system is operational." -ForegroundColor Gray
Write-Host "If you're experiencing network errors, check:" -ForegroundColor Gray
Write-Host "  1. Browser console for specific error messages" -ForegroundColor Gray
Write-Host "  2. Coolify logs for both frontend and backend" -ForegroundColor Gray
Write-Host "  3. Environment variables in Coolify" -ForegroundColor Gray
Write-Host ""
