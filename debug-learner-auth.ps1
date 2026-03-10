#!/usr/bin/env pwsh

# Debug script to test learner authentication flow
Write-Host "Debugging learner authentication flow..." -ForegroundColor Green

# Test the API directly
$apiUrl = "https://api.cohortle.com"

Write-Host "`nTesting API authentication..." -ForegroundColor Yellow

# Test with a simple profile request to see what happens
try {
    # First, let's test if the API is responding
    Write-Host "1. Testing API health..." -ForegroundColor Cyan
    $healthResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/health" -Method GET -ErrorAction Stop
    Write-Host "✓ API is responding" -ForegroundColor Green
    
    # Test profile endpoint without authentication (should return 401)
    Write-Host "`n2. Testing profile endpoint without auth (should return 401)..." -ForegroundColor Cyan
    try {
        $profileResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/profile" -Method GET -ErrorAction Stop
        Write-Host "✗ Profile endpoint returned data without authentication (unexpected)" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "✓ Profile endpoint correctly returns 401 without authentication" -ForegroundColor Green
        } else {
            Write-Host "✗ Profile endpoint returned unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n3. Testing with a known learner account..." -ForegroundColor Cyan
    
    # Try to login with the wecarefng account (which should now be a convener)
    $loginData = @{
        email = "wecarefng@gmail.com"
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -ErrorAction Stop
        
        if ($loginResponse.error -eq $false) {
            Write-Host "✓ Login successful" -ForegroundColor Green
            Write-Host "User role: $($loginResponse.user.role)" -ForegroundColor Cyan
            Write-Host "Email verified: $($loginResponse.user.email_verified)" -ForegroundColor Cyan
            
            # Test profile access with token
            $headers = @{
                "Authorization" = "Bearer $($loginResponse.token)"
            }
            
            $profileResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/profile" -Method GET -Headers $headers -ErrorAction Stop
            
            if ($profileResponse.error -eq $false) {
                Write-Host "✓ Profile access successful with token" -ForegroundColor Green
                Write-Host "Profile role: $($profileResponse.user.role)" -ForegroundColor Cyan
                Write-Host "Profile email_verified: $($profileResponse.user.email_verified)" -ForegroundColor Cyan
                
                # Check if this user should be able to access dashboard
                if ($profileResponse.user.role -eq "student" -or $profileResponse.user.role -eq "learner") {
                    if ($profileResponse.user.email_verified -eq $false -or $profileResponse.user.email_verified -eq 0) {
                        Write-Host "✓ This is an unverified learner - should be able to access dashboard with email verification disabled" -ForegroundColor Green
                    } else {
                        Write-Host "! This learner is already verified" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "! This user is not a learner (role: $($profileResponse.user.role))" -ForegroundColor Yellow
                }
            } else {
                Write-Host "✗ Profile access failed: $($profileResponse.message)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ Login failed: $($loginResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If the API tests pass but learners still can't access the dashboard," -ForegroundColor Yellow
Write-Host "the issue is likely in the frontend authentication flow or environment variables." -ForegroundColor Yellow