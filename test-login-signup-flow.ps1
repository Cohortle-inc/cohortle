# Test Login and Signup Flow
# Comprehensive test to identify where the issue is

Write-Host "=== Cohortle Login/Signup Flow Test ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "https://api.cohortle.com"
$frontendUrl = "https://cohortle.com"

# Test 1: Backend Health
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$apiUrl/v1/api/health" -UseBasicParsing
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend is healthy" -ForegroundColor Green
    Write-Host "   Response: $($healthData | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend health check failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Frontend Health
Write-Host "2. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
    Write-Host "   ✅ Frontend is accessible (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login Page
Write-Host "3. Testing Login Page..." -ForegroundColor Yellow
try {
    $loginPage = Invoke-WebRequest -Uri "$frontendUrl/login" -UseBasicParsing
    Write-Host "   ✅ Login page accessible (Status: $($loginPage.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login page error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Signup Page
Write-Host "4. Testing Signup Page..." -ForegroundColor Yellow
try {
    $signupPage = Invoke-WebRequest -Uri "$frontendUrl/signup" -UseBasicParsing
    Write-Host "   ✅ Signup page accessible (Status: $($signupPage.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Signup page error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Backend Login Endpoint (with wrong credentials)
Write-Host "5. Testing Backend Login Endpoint..." -ForegroundColor Yellow
Write-Host "   (Using invalid credentials - should return 401)" -ForegroundColor Gray

$loginBody = @{
    email = "nonexistent@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $loginTest = Invoke-WebRequest -Uri "$apiUrl/v1/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing
    
    Write-Host "   ⚠ Unexpected success (should fail with 401)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ Login endpoint working correctly (401 for invalid credentials)" -ForegroundColor Green
        
        # Try to get response body
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $responseData = $responseBody | ConvertFrom-Json
            Write-Host "   Response: $($responseData.message)" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not read response body" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Unexpected status code: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Backend Signup Endpoint (with test data)
Write-Host "6. Testing Backend Signup Endpoint..." -ForegroundColor Yellow
Write-Host "   (Using test email - may fail if already exists)" -ForegroundColor Gray

$signupBody = @{
    email = "test-$(Get-Random)@example.com"
    password = "TestPassword123"
    first_name = "Test"
    last_name = "User"
    role = "student"
} | ConvertTo-Json

try {
    $signupTest = Invoke-WebRequest -Uri "$apiUrl/v1/api/auth/register-email" `
        -Method POST `
        -ContentType "application/json" `
        -Body $signupBody `
        -UseBasicParsing
    
    $signupData = $signupTest.Content | ConvertFrom-Json
    
    if ($signupData.error -eq $false) {
        Write-Host "   ✅ Signup endpoint working (Status: $($signupTest.StatusCode))" -ForegroundColor Green
        Write-Host "   User created with role: $($signupData.user.role)" -ForegroundColor Gray
        Write-Host "   Token received: $(if($signupData.token) { 'Yes' } else { 'No' })" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ Signup returned error: $($signupData.message)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   ❌ Signup endpoint error (Status: $statusCode)" -ForegroundColor Red
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "   Response: $responseBody" -ForegroundColor Gray
    } catch {
        Write-Host "   Could not read response body" -ForegroundColor Gray
    }
}
Write-Host ""

# Test 7: Middleware Protection
Write-Host "7. Testing Middleware Protection..." -ForegroundColor Yellow
Write-Host "   (Accessing protected route without auth)" -ForegroundColor Gray

try {
    $dashTest = Invoke-WebRequest -Uri "$frontendUrl/dashboard" `
        -UseBasicParsing `
        -MaximumRedirection 0 `
        -ErrorAction SilentlyContinue
    
    Write-Host "   ⚠ Dashboard accessible without auth (Status: $($dashTest.StatusCode))" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302 -or $statusCode -eq 307) {
        Write-Host "   ✅ Middleware working (redirecting to login)" -ForegroundColor Green
        
        # Check redirect location
        try {
            $location = $_.Exception.Response.Headers.Location
            Write-Host "   Redirect to: $location" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not read redirect location" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠ Unexpected status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 8: CORS Configuration
Write-Host "8. Testing CORS Configuration..." -ForegroundColor Yellow

try {
    $corsTest = Invoke-WebRequest -Uri "$apiUrl/v1/api/health" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $frontendUrl
            "Access-Control-Request-Method" = "POST"
        } `
        -UseBasicParsing
    
    Write-Host "   ✅ CORS configured (Status: $($corsTest.StatusCode))" -ForegroundColor Green
    
    # Check CORS headers
    $allowOrigin = $corsTest.Headers["Access-Control-Allow-Origin"]
    $allowMethods = $corsTest.Headers["Access-Control-Allow-Methods"]
    
    if ($allowOrigin) {
        Write-Host "   Allow-Origin: $allowOrigin" -ForegroundColor Gray
    }
    if ($allowMethods) {
        Write-Host "   Allow-Methods: $allowMethods" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠ Could not verify CORS: $_" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests passed, the system is operational." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to diagnose user-reported issues:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ask user to clear browser cache and cookies" -ForegroundColor White
Write-Host "   - DevTools (F12) → Application → Clear site data" -ForegroundColor Gray
Write-Host "   - Or try incognito/private mode" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Get browser console errors" -ForegroundColor White
Write-Host "   - F12 → Console tab" -ForegroundColor Gray
Write-Host "   - Copy all red error messages" -ForegroundColor Gray
Write-Host "   - Include full error stack trace" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check Coolify deployment status" -ForegroundColor White
Write-Host "   - Verify cohortle-web is 'Running'" -ForegroundColor Gray
Write-Host "   - Check deployment timestamp" -ForegroundColor Gray
Write-Host "   - Review deployment logs for errors" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test with actual credentials" -ForegroundColor White
Write-Host "   Run this command with real credentials:" -ForegroundColor Gray
Write-Host '   $body = @{ email = "user@example.com"; password = "password" } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '   Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" -Method POST -ContentType "application/json" -Body $body' -ForegroundColor Gray
Write-Host ""
Write-Host "5. Check Network tab in DevTools" -ForegroundColor White
Write-Host "   - F12 → Network tab" -ForegroundColor Gray
Write-Host "   - Try login/signup" -ForegroundColor Gray
Write-Host "   - Check /api/auth/login or /api/auth/signup request" -ForegroundColor Gray
Write-Host "   - Look at Status, Response, and Request payload" -ForegroundColor Gray
Write-Host ""

