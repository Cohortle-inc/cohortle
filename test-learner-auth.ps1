#!/usr/bin/env pwsh

# Test script to debug learner authentication issue
# This script will test the API endpoints to see what's happening

Write-Host "=== Testing Learner Authentication Issue ===" -ForegroundColor Cyan

# Test 1: Check if backend is running
Write-Host "`n1. Testing backend health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Try to login as a learner (using a test account)
Write-Host "`n2. Testing learner login..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.email) - Role: $($loginResponse.user.role)" -ForegroundColor Gray
    $token = $loginResponse.token
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be expected if test@example.com doesn't exist" -ForegroundColor Gray
    
    # Try with a known user (wecarefng@gmail.com)
    Write-Host "`nTrying with wecarefng@gmail.com..." -ForegroundColor Yellow
    $loginData2 = @{
        email = "wecarefng@gmail.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData2 -ContentType "application/json"
        Write-Host "✓ Login successful with wecarefng@gmail.com" -ForegroundColor Green
        Write-Host "User: $($loginResponse.user.email) - Role: $($loginResponse.user.role)" -ForegroundColor Gray
        $token = $loginResponse.token
    } catch {
        Write-Host "✗ Login failed with wecarefng@gmail.com: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please create a test user or check existing users" -ForegroundColor Yellow
        exit 1
    }
}

# Test 3: Test profile endpoint with token
Write-Host "`n3. Testing profile endpoint..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/profile" -Method GET -Headers $headers
    Write-Host "✓ Profile endpoint successful" -ForegroundColor Green
    Write-Host "Profile response:" -ForegroundColor Gray
    Write-Host ($profileResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    # Check specific fields
    if ($profileResponse.user.email_verified -ne $null) {
        Write-Host "✓ email_verified field present: $($profileResponse.user.email_verified)" -ForegroundColor Green
    } else {
        Write-Host "✗ email_verified field missing!" -ForegroundColor Red
    }
    
    if ($profileResponse.user.role) {
        Write-Host "✓ role field present: $($profileResponse.user.role)" -ForegroundColor Green
    } else {
        Write-Host "✗ role field missing!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Profile endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Gray
}

# Test 4: Check environment variables
Write-Host "`n4. Checking environment variables..." -ForegroundColor Yellow
Write-Host "REQUIRE_EMAIL_VERIFICATION in backend .env:" -ForegroundColor Gray
$envContent = Get-Content "cohortle-api/.env" | Where-Object { $_ -match "REQUIRE_EMAIL_VERIFICATION" }
Write-Host $envContent -ForegroundColor Gray

Write-Host "`nNEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION in frontend .env.local:" -ForegroundColor Gray
$frontendEnvContent = Get-Content "cohortle-web/.env.local" | Where-Object { $_ -match "NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION" }
Write-Host $frontendEnvContent -ForegroundColor Gray

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan