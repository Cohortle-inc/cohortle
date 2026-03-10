#!/usr/bin/env pwsh

Write-Host "=== Testing Authentication Issue ===" -ForegroundColor Cyan

# Test backend health
Write-Host "`n1. Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
    Write-Host "✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend not running: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test login with wecarefng@gmail.com (known convener account)
Write-Host "`n2. Testing login..." -ForegroundColor Yellow
$loginData = @{
    email = "wecarefng@gmail.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Gray
    Write-Host "Email Verified: $($loginResponse.user.emailVerified)" -ForegroundColor Gray
    $token = $loginResponse.token
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test profile endpoint
Write-Host "`n3. Testing profile endpoint..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $profile = Invoke-RestMethod -Uri "http://localhost:3001/api/profile" -Method GET -Headers $headers
    Write-Host "✓ Profile endpoint successful" -ForegroundColor Green
    Write-Host "Profile data:" -ForegroundColor Gray
    Write-Host ($profile | ConvertTo-Json -Depth 2) -ForegroundColor Gray
} catch {
    Write-Host "✗ Profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan