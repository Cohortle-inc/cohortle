# Test Signup Flow After Token Validation Fix
# This script tests the complete signup flow to verify the fix works

Write-Host "=== Testing Signup Flow After Token Fix ===" -ForegroundColor Cyan
Write-Host ""

$testEmail = "test-$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$testPassword = "TestPassword123!"

Write-Host "Test Account Details:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray
Write-Host ""

# Test 1: Sign up new student account
Write-Host "1. Testing Student Signup..." -ForegroundColor Yellow
try {
    $signupBody = @{
        email = $testEmail
        password = $testPassword
        firstName = "Test"
        lastName = "Student"
        role = "student"
    } | ConvertTo-Json

    $signupResponse = Invoke-WebRequest -Uri "https://cohortle.com/api/auth/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $signupBody `
        -UseBasicParsing `
        -SessionVariable session

    if ($signupResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Signup successful" -ForegroundColor Green
        $signupData = $signupResponse.Content | ConvertFrom-Json
        Write-Host "   User ID: $($signupData.user.id)" -ForegroundColor Gray
        Write-Host "   Role: $($signupData.user.role)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Signup failed with status: $($signupResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Signup error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Verify dashboard is accessible (should not crash)
Write-Host "2. Testing Dashboard Access..." -ForegroundColor Yellow
try {
    $dashboardResponse = Invoke-WebRequest -Uri "https://cohortle.com/dashboard" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction SilentlyContinue

    if ($dashboardResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Dashboard accessible" -ForegroundColor Green
        
        # Check if response contains error indicators
        if ($dashboardResponse.Content -match "Cannot read properties of undefined") {
            Write-Host "   ❌ Token validation error still present!" -ForegroundColor Red
        } elseif ($dashboardResponse.Content -match "user not authenticated") {
            Write-Host "   ❌ Authentication error present!" -ForegroundColor Red
        } else {
            Write-Host "   ✅ No token validation errors detected" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠ Dashboard returned status: $($dashboardResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302 -or $statusCode -eq 307) {
        Write-Host "   ✅ Dashboard redirected (expected for auth flow)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Dashboard error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Test with convener signup (with invitation code)
Write-Host "3. Testing Convener Signup..." -ForegroundColor Yellow
$convenerEmail = "convener-$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
try {
    $convenerBody = @{
        email = $convenerEmail
        password = $testPassword
        firstName = "Test"
        lastName = "Convener"
        role = "convener"
        invitationCode = "COHORTLE_CONVENER_2024"
    } | ConvertTo-Json

    $convenerResponse = Invoke-WebRequest -Uri "https://cohortle.com/api/auth/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $convenerBody `
        -UseBasicParsing `
        -SessionVariable convenerSession

    if ($convenerResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Convener signup successful" -ForegroundColor Green
        $convenerData = $convenerResponse.Content | ConvertFrom-Json
        Write-Host "   User ID: $($convenerData.user.id)" -ForegroundColor Gray
        Write-Host "   Role: $($convenerData.user.role)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Convener signup failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Convener signup error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Verify convener dashboard access
Write-Host "4. Testing Convener Dashboard Access..." -ForegroundColor Yellow
try {
    $convenerDashResponse = Invoke-WebRequest -Uri "https://cohortle.com/convener/dashboard" `
        -Method GET `
        -UseBasicParsing `
        -WebSession $convenerSession `
        -ErrorAction SilentlyContinue

    if ($convenerDashResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Convener dashboard accessible" -ForegroundColor Green
        
        # Check for errors
        if ($convenerDashResponse.Content -match "Cannot read properties of undefined") {
            Write-Host "   ❌ Token validation error still present!" -ForegroundColor Red
        } else {
            Write-Host "   ✅ No token validation errors" -ForegroundColor Green
        }
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 302 -or $statusCode -eq 307) {
        Write-Host "   ✅ Convener dashboard redirected (expected)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "The fix should prevent the following errors:" -ForegroundColor Gray
Write-Host "  ❌ 'Cannot read properties of undefined (reading split)'" -ForegroundColor Gray
Write-Host "  ❌ 'user not authenticated' after successful signup" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see ✅ green checkmarks above, the fix is working!" -ForegroundColor Gray
Write-Host ""
Write-Host "Test accounts created:" -ForegroundColor Yellow
Write-Host "  Student: $testEmail" -ForegroundColor Gray
Write-Host "  Convener: $convenerEmail" -ForegroundColor Gray
Write-Host "  Password: $testPassword" -ForegroundColor Gray
Write-Host ""
