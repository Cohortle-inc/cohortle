# Test Cohort Creation API
# This script tests the cohort creation endpoints

Write-Host "Testing Cohort Creation API..." -ForegroundColor Green

# Test 1: Check enrollment code availability
Write-Host "`n1. Testing enrollment code availability check..." -ForegroundColor Yellow

$testCode = "TEST-2026-ABC123"
$checkUrl = "https://api.cohortle.com/v1/api/enrollment-codes/check?code=$testCode"

try {
    $response = Invoke-RestMethod -Uri $checkUrl -Method GET -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Enrollment code check successful" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Enrollment code check failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 2: Create cohort
Write-Host "`n2. Testing cohort creation..." -ForegroundColor Yellow

$createUrl = "https://api.cohortle.com/v1/api/programmes/10/cohorts"
$cohortData = @{
    name = "Test Cohort"
    enrollment_code = $testCode
    start_date = "2026-03-01"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $createUrl -Method POST -Body $cohortData -Headers @{
        "Authorization" = "Bearer YOUR_TOKEN_HERE"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Cohort creation successful" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cohort creation failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    # Try to get more details
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nTest completed." -ForegroundColor Green
Write-Host "Note: Replace 'YOUR_TOKEN_HERE' with a valid convener token to run this test." -ForegroundColor Yellow