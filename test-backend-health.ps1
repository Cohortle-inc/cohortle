# Test Backend Health
Write-Host "Testing Cohortle Backend Health..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/health" -Method GET -UseBasicParsing
    Write-Host "✅ Health check successful!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing login endpoint (should return error about credentials)..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@test.com"
        password = "wrongpassword"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing
    
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Write-Host "✅ Login endpoint exists (returned expected error)" -ForegroundColor Green
        Write-Host "Status: $statusCode" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Testing programmes endpoint (should return 401 without auth)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/programmes/enrolled" `
        -Method GET `
        -UseBasicParsing
    
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Programmes endpoint exists (requires auth)" -ForegroundColor Green
        Write-Host "Status: $statusCode" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error" -ForegroundColor Red
        Write-Host "Status: $statusCode" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "If all three tests show ✅, your backend is working correctly."
Write-Host "The issue is likely in the frontend configuration or database."
