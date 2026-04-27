# Test enrolled programmes endpoint
# This script tests if the enrolled programmes API is working correctly

$API_URL = "https://api.cohortle.com"

Write-Host "Testing Enrolled Programmes Endpoint..." -ForegroundColor Cyan
Write-Host ""

# First, login to get a token
Write-Host "Step 1: Logging in as a learner..." -ForegroundColor Yellow
$loginBody = @{
    email = "learner5@cohortle.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/v1/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.error) {
        Write-Host "❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Gray
    Write-Host ""
    
    $token = $loginResponse.token
    
    # Test enrolled programmes endpoint
    Write-Host "Step 2: Fetching enrolled programmes..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $enrolledResponse = Invoke-RestMethod -Uri "$API_URL/v1/api/programmes/enrolled" -Method Get -Headers $headers
    
    if ($enrolledResponse.error) {
        Write-Host "❌ Failed to fetch enrolled programmes: $($enrolledResponse.message)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Enrolled programmes fetched successfully" -ForegroundColor Green
    Write-Host "   Number of programmes: $($enrolledResponse.programmes.Count)" -ForegroundColor Gray
    Write-Host ""
    
    if ($enrolledResponse.programmes.Count -gt 0) {
        Write-Host "Programmes:" -ForegroundColor Cyan
        foreach ($programme in $enrolledResponse.programmes) {
            Write-Host "  - $($programme.name) (ID: $($programme.id))" -ForegroundColor White
            Write-Host "    Cohort: $($programme.cohortName) (ID: $($programme.cohortId))" -ForegroundColor Gray
            Write-Host "    Week: $($programme.currentWeek) / $($programme.totalWeeks)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  User is not enrolled in any programmes" -ForegroundColor Yellow
    }
    
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
