# Test Convener Profile Fix
# This script tests that the profile endpoint returns the correct role from the role system

Write-Host "Testing Convener Profile Fix..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "https://api.cohortle.com"
$email = "wecarefng@gmail.com"

# Prompt for password
$password = Read-Host "Enter password for $email" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Step 1: Login..." -ForegroundColor Yellow

try {
    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    if ($loginResponse.error) {
        Write-Host "Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host "  Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Role from login: $($loginResponse.user.role)" -ForegroundColor Gray
    
    $token = $loginResponse.token
    $expectedRole = $loginResponse.user.role

    Write-Host ""
    Write-Host "Step 2: Get Profile..." -ForegroundColor Yellow

    $profileResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/profile" `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $token"
        }

    if ($profileResponse.error) {
        Write-Host "Profile fetch failed: $($profileResponse.message)" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Profile fetched successfully" -ForegroundColor Green
    Write-Host "  User ID: $($profileResponse.user.id)" -ForegroundColor Gray
    Write-Host "  Name: $($profileResponse.user.name)" -ForegroundColor Gray
    Write-Host "  Email: $($profileResponse.user.email)" -ForegroundColor Gray
    Write-Host "  Role from profile: $($profileResponse.user.role)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "Step 3: Verify Role Consistency..." -ForegroundColor Yellow

    if ($profileResponse.user.role -eq $expectedRole) {
        Write-Host "✓ Role is consistent: $($profileResponse.user.role)" -ForegroundColor Green
    } else {
        Write-Host "✗ Role mismatch!" -ForegroundColor Red
        Write-Host "  Expected: $expectedRole" -ForegroundColor Red
        Write-Host "  Got: $($profileResponse.user.role)" -ForegroundColor Red
        exit 1
    }

    if ($profileResponse.user.role -eq "convener") {
        Write-Host "✓ User has convener role - will redirect to /convener/dashboard" -ForegroundColor Green
    } else {
        Write-Host "✗ User does not have convener role - will redirect to /dashboard" -ForegroundColor Red
        Write-Host "  Current role: $($profileResponse.user.role)" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Step 4: Check Stats..." -ForegroundColor Yellow
    Write-Host "  Total Programmes: $($profileResponse.stats.totalProgrammes)" -ForegroundColor Gray
    Write-Host "  Completed Programmes: $($profileResponse.stats.completedProgrammes)" -ForegroundColor Gray
    Write-Host "  Total Lessons Completed: $($profileResponse.stats.totalLessonsCompleted)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All tests passed! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The convener account should now redirect correctly to /convener/dashboard" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
