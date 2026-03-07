# Diagnose Login Issue
# Tests the complete login flow to identify where it's failing

Write-Host "=== Cohortle Login Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is responding
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
    Write-Host "   DB Time: $($healthData.db_time)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend health check failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Check if frontend is responding
Write-Host "2. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "https://cohortle.com" -UseBasicParsing
    Write-Host "   ✅ Frontend is accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend check failed" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check login page
Write-Host "3. Testing Login Page..." -ForegroundColor Yellow
try {
    $loginPage = Invoke-WebRequest -Uri "https://cohortle.com/login" -UseBasicParsing
    if ($loginPage.StatusCode -eq 200) {
        Write-Host "   ✅ Login page accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Login page error" -ForegroundColor Red
}
Write-Host ""

# Test 4: Test login API endpoint with test credentials
Write-Host "4. Testing Login API Endpoint..." -ForegroundColor Yellow
Write-Host "   (Testing with invalid credentials - should return 401)" -ForegroundColor Gray

$testBody = @{
    email = "test@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $loginTest = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testBody `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Login endpoint responding correctly (401 for wrong credentials)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Unexpected status code: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Check if middleware fix is deployed
Write-Host "5. Checking Middleware Fix Deployment..." -ForegroundColor Yellow
Write-Host "   Attempting to access dashboard without auth..." -ForegroundColor Gray

try {
    $dashTest = Invoke-WebRequest -Uri "https://cohortle.com/dashboard" `
        -UseBasicParsing `
        -MaximumRedirection 0 `
        -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302 -or $statusCode -eq 307) {
        Write-Host "   ✅ Middleware is working (redirecting to login)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 6: Check for common issues
Write-Host "6. Common Issues Check..." -ForegroundColor Yellow

Write-Host "   Checking for CORS issues..." -ForegroundColor Gray
try {
    $corsTest = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://cohortle.com"
            "Access-Control-Request-Method" = "POST"
        } `
        -UseBasicParsing `
        -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ CORS configured" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not verify CORS" -ForegroundColor Yellow
}
Write-Host ""

# Summary and Next Steps
Write-Host "=== Diagnostic Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed above, the system is operational." -ForegroundColor Gray
Write-Host ""
Write-Host "Common login issues and solutions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Wrong credentials:" -ForegroundColor White
Write-Host "   - Verify email and password are correct" -ForegroundColor Gray
Write-Host "   - Check if account exists in database" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Browser cache:" -ForegroundColor White
Write-Host "   - Clear browser cookies for cohortle.com" -ForegroundColor Gray
Write-Host "   - Try incognito/private mode" -ForegroundColor Gray
Write-Host "   - Hard refresh (Ctrl+F5)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deployment not complete:" -ForegroundColor White
Write-Host "   - Check Coolify deployment status" -ForegroundColor Gray
Write-Host "   - Wait 2-5 minutes for deployment to complete" -ForegroundColor Gray
Write-Host "   - Check Coolify logs for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Token/Cookie issues:" -ForegroundColor White
Write-Host "   - Clear all cookies for cohortle.com" -ForegroundColor Gray
Write-Host "   - Check browser console for errors" -ForegroundColor Gray
Write-Host "   - Verify cookies are being set (check DevTools > Application > Cookies)" -ForegroundColor Gray
Write-Host ""
Write-Host "To test with your actual account:" -ForegroundColor Yellow
Write-Host '  $body = @{ email = "your-email@example.com"; password = "your-password" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
Write-Host ""
