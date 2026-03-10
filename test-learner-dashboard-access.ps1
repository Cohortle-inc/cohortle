#!/usr/bin/env pwsh

# Test script to verify learner dashboard access without email verification
# This tests the fix for learners getting "user not authenticated" error

Write-Host "Testing learner dashboard access without email verification..." -ForegroundColor Green

# Test 1: Check if environment variable is properly set
Write-Host "`n1. Checking frontend environment configuration..." -ForegroundColor Yellow
$envFile = "cohortle-web/.env.production"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $emailVerificationSetting = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION" }
    Write-Host "Environment setting: $emailVerificationSetting"
    
    if ($emailVerificationSetting -match "false") {
        Write-Host "✓ Email verification is disabled in frontend environment" -ForegroundColor Green
    } else {
        Write-Host "✗ Email verification setting not found or not set to false" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Production environment file not found" -ForegroundColor Red
}

# Test 2: Check backend email verification setting
Write-Host "`n2. Checking backend environment configuration..." -ForegroundColor Yellow
$backendEnvFile = "cohortle-api/.env"
if (Test-Path $backendEnvFile) {
    $backendEnvContent = Get-Content $backendEnvFile
    $backendEmailVerificationSetting = $backendEnvContent | Where-Object { $_ -match "REQUIRE_EMAIL_VERIFICATION" }
    Write-Host "Backend setting: $backendEmailVerificationSetting"
    
    if ($backendEmailVerificationSetting -match "false") {
        Write-Host "✓ Email verification is disabled in backend environment" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend email verification setting not found or not set to false" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Backend environment file not found" -ForegroundColor Red
}

# Test 3: Check if ProgrammeActionGuard is working correctly
Write-Host "`n3. Checking ProgrammeActionGuard component logic..." -ForegroundColor Yellow
$guardFile = "cohortle-web/src/components/programmes/ProgrammeActionGuard.tsx"
if (Test-Path $guardFile) {
    $guardContent = Get-Content $guardFile -Raw
    
    if ($guardContent -match "process\.env\.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION !== 'false'") {
        Write-Host "✓ ProgrammeActionGuard checks environment variable correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ ProgrammeActionGuard environment check not found" -ForegroundColor Red
    }
    
    if ($guardContent -match "if \(!requireVerification\)") {
        Write-Host "✓ ProgrammeActionGuard has bypass logic for disabled verification" -ForegroundColor Green
    } else {
        Write-Host "✗ ProgrammeActionGuard bypass logic not found" -ForegroundColor Red
    }
} else {
    Write-Host "✗ ProgrammeActionGuard file not found" -ForegroundColor Red
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Configuration checks completed."

Write-Host "`nNext steps if learners still can't access dashboard:" -ForegroundColor Yellow
Write-Host "1. Verify the frontend build includes the correct environment variables" -ForegroundColor Yellow
Write-Host "2. Check browser console for any JavaScript errors" -ForegroundColor Yellow
Write-Host "3. Verify the production deployment has the latest code" -ForegroundColor Yellow
Write-Host "4. Test with a fresh browser session" -ForegroundColor Yellow