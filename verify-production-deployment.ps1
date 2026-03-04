# Verify Production Deployment Status
# This script checks if the WLIMP endpoints exist in production

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Verification" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is accessible
Write-Host "1. Checking backend health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/health" -Method GET -UseBasicParsing -ErrorAction Stop
    $healthStatus = $healthResponse.StatusCode
    
    if ($healthStatus -eq 200) {
        Write-Host "✓ Backend is accessible" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Backend returned unexpected status: $healthStatus" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "✗ Backend is not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Cannot proceed with endpoint checks" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if WLIMP endpoint exists (without auth - will get 401 but that's OK)
Write-Host "2. Checking if WLIMP endpoints exist..." -ForegroundColor Yellow
$endpointExists = $false

try {
    $enrolledResponse = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/programmes/enrolled" -Method GET -UseBasicParsing -ErrorAction Stop
    $enrolledStatus = $enrolledResponse.StatusCode
    
    if ($enrolledStatus -eq 200) {
        Write-Host "✓ /v1/api/programmes/enrolled endpoint EXISTS" -ForegroundColor Green
        Write-Host "  (Got 200 OK - endpoint exists)" -ForegroundColor Gray
        $endpointExists = $true
    }
    else {
        Write-Host "? Unexpected status: $enrolledStatus" -ForegroundColor Yellow
        $endpointExists = $false
    }
}
catch {
    $statusCode = 0
    if ($_.Exception.Response -ne $null) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }
    
    if ($statusCode -eq 401) {
        Write-Host "✓ /v1/api/programmes/enrolled endpoint EXISTS" -ForegroundColor Green
        Write-Host "  (Got 401 Unauthorized - endpoint exists but needs auth)" -ForegroundColor Gray
        $endpointExists = $true
    }
    elseif ($statusCode -eq 404) {
        Write-Host "✗ /v1/api/programmes/enrolled endpoint DOES NOT EXIST" -ForegroundColor Red
        Write-Host "  (Got 404 Not Found - backend needs deployment)" -ForegroundColor Gray
        $endpointExists = $false
    }
    else {
        Write-Host "? Unexpected error (status: $statusCode)" -ForegroundColor Yellow
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        $endpointExists = $false
    }
}

Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($endpointExists) {
    Write-Host "✓ Backend is deployed with WLIMP code" -ForegroundColor Green
    Write-Host ""
    Write-Host "The error you're seeing is likely:" -ForegroundColor Yellow
    Write-Host "  1. Authentication issue (check browser cookies)" -ForegroundColor White
    Write-Host "  2. Database migrations not run (check backend logs)" -ForegroundColor White
    Write-Host "  3. Frontend not deployed (old code calling new endpoints)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Check backend logs in Coolify for migration messages" -ForegroundColor White
    Write-Host "  2. Deploy frontend if not already deployed" -ForegroundColor White
    Write-Host "  3. Check browser console for specific error messages" -ForegroundColor White
}
else {
    Write-Host "✗ Backend needs deployment" -ForegroundColor Red
    Write-Host ""
    Write-Host "The WLIMP endpoints don't exist in production yet." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open Coolify dashboard" -ForegroundColor White
    Write-Host "  2. Find 'cohortle-api' application" -ForegroundColor White
    Write-Host "  3. Click 'Deploy' button" -ForegroundColor White
    Write-Host "  4. Wait 2-3 minutes for deployment" -ForegroundColor White
    Write-Host "  5. Check logs for migration messages" -ForegroundColor White
    Write-Host "  6. Then deploy 'cohortle-web' frontend" -ForegroundColor White
}

Write-Host ""
