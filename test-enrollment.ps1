# Test enrollment functionality
# This script checks if enrollment codes exist and tests the enrollment flow

$API_URL = "https://api.cohortle.com"

Write-Host "=== Enrollment Code Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if any cohorts with enrollment codes exist
Write-Host "1. Checking for active cohorts with enrollment codes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/v1/api/deployment" -Method Get
    Write-Host "   API is reachable" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Cannot reach API" -ForegroundColor Red
    Write-Host "   $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. To test enrollment, you need:" -ForegroundColor Yellow
Write-Host "   - A valid enrollment code (e.g., WLIMP-2026)" -ForegroundColor White
Write-Host "   - To be logged in as a learner" -ForegroundColor White
Write-Host ""

# Prompt for enrollment code
$enrollmentCode = Read-Host "Enter enrollment code to test (or press Enter to skip)"

if ($enrollmentCode) {
    Write-Host ""
    Write-Host "3. Testing enrollment code: $enrollmentCode" -ForegroundColor Yellow
    
    # Prompt for learner token
    $token = Read-Host "Enter your learner auth token (from browser cookies)"
    
    if ($token) {
        try {
            $headers = @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            }
            
            $body = @{
                code = $enrollmentCode
            } | ConvertTo-Json
            
            Write-Host "   Attempting enrollment..." -ForegroundColor White
            $enrollResponse = Invoke-RestMethod -Uri "$API_URL/v1/api/programmes/enroll" -Method Post -Headers $headers -Body $body
            
            Write-Host "   SUCCESS! Enrolled in programme" -ForegroundColor Green
            Write-Host "   Programme ID: $($enrollResponse.programme_id)" -ForegroundColor White
            Write-Host "   Programme Name: $($enrollResponse.programme_name)" -ForegroundColor White
            Write-Host "   Cohort ID: $($enrollResponse.cohort_id)" -ForegroundColor White
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            
            Write-Host "   FAILED with status $statusCode" -ForegroundColor Red
            Write-Host "   Error: $($errorBody.message)" -ForegroundColor Red
            
            if ($statusCode -eq 404) {
                Write-Host ""
                Write-Host "   The enrollment code '$enrollmentCode' was not found." -ForegroundColor Yellow
                Write-Host "   Please check:" -ForegroundColor Yellow
                Write-Host "   - The code is correct (case-insensitive)" -ForegroundColor White
                Write-Host "   - A cohort with this code exists in the database" -ForegroundColor White
                Write-Host "   - The convener has created a cohort with this enrollment code" -ForegroundColor White
            } elseif ($statusCode -eq 400) {
                Write-Host ""
                Write-Host "   The enrollment code format is invalid." -ForegroundColor Yellow
                Write-Host "   Expected format: PROGRAMME-YEAR (e.g., WLIMP-2026)" -ForegroundColor White
            } elseif ($statusCode -eq 401) {
                Write-Host ""
                Write-Host "   Authentication failed. Please check your token." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   Skipped - no token provided" -ForegroundColor Gray
    }
} else {
    Write-Host "   Skipped - no enrollment code provided" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
