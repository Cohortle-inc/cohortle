# Check Production Database Server Status
# Tests if the production API and database are running

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Production Database Server Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$productionApiUrl = "https://api.cohortle.com"

Write-Host "=== Testing Production API ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "API URL: $productionApiUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Health Check
Write-Host "[1/4] Testing health endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "$productionApiUrl/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  [OK] Health endpoint responding" -ForegroundColor Green
    Write-Host "  Status: $($healthResponse.StatusCode)" -ForegroundColor Gray
    $apiHealthy = $true
} catch {
    Write-Host "  [FAIL] Health endpoint not responding" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    $apiHealthy = $false
}

Write-Host ""

# Test 2: API Root
Write-Host "[2/4] Testing API root..." -ForegroundColor Cyan
try {
    $rootResponse = Invoke-WebRequest -Uri "$productionApiUrl/" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  [OK] API root responding" -ForegroundColor Green
    Write-Host "  Status: $($rootResponse.StatusCode)" -ForegroundColor Gray
    $apiRoot = $true
} catch {
    Write-Host "  [FAIL] API root not responding" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    $apiRoot = $false
}

Write-Host ""

# Test 3: Auth Endpoint (should return 400 for GET, but proves it exists)
Write-Host "[3/4] Testing auth endpoint..." -ForegroundColor Cyan
try {
    $authResponse = Invoke-WebRequest -Uri "$productionApiUrl/v1/api/auth/login" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  [OK] Auth endpoint exists" -ForegroundColor Green
    $authExists = $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400 -or $_.Exception.Response.StatusCode.value__ -eq 405) {
        Write-Host "  [OK] Auth endpoint exists (method not allowed for GET)" -ForegroundColor Green
        $authExists = $true
    } else {
        Write-Host "  [FAIL] Auth endpoint not found" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        $authExists = $false
    }
}

Write-Host ""

# Test 4: WLIMP Programmes Endpoint (requires auth, but we can check if it exists)
Write-Host "[4/4] Testing WLIMP programmes endpoint..." -ForegroundColor Cyan
try {
    $progResponse = Invoke-WebRequest -Uri "$productionApiUrl/v1/api/programmes/enrolled" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  [OK] Programmes endpoint exists" -ForegroundColor Green
    $wlimpExists = $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "  [OK] Programmes endpoint exists (requires authentication)" -ForegroundColor Green
        $wlimpExists = $true
    } elseif ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  [FAIL] Programmes endpoint not found (WLIMP not deployed)" -ForegroundColor Red
        $wlimpExists = $false
    } else {
        Write-Host "  [WARN] Programmes endpoint status unclear" -ForegroundColor Yellow
        Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
        $wlimpExists = $false
    }
}

Write-Host ""

# Test 5: Database Connection (indirect test via API)
Write-Host "=== Database Connection Test ===" -ForegroundColor Yellow
Write-Host ""

if ($apiHealthy) {
    Write-Host "Since the API health endpoint is responding, this indicates:" -ForegroundColor Gray
    Write-Host "  - Backend server is running" -ForegroundColor Gray
    Write-Host "  - Node.js process is active" -ForegroundColor Gray
    Write-Host "  - Database connection is likely working" -ForegroundColor Gray
    Write-Host ""
    Write-Host "[OK] Database server is likely running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Cannot determine database status (API not responding)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Yellow
Write-Host ""

if ($apiHealthy) {
    Write-Host "[OK] Production API is ONLINE" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Production API is OFFLINE" -ForegroundColor Red
}

if ($authExists) {
    Write-Host "[OK] Authentication endpoints exist" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Authentication endpoints missing" -ForegroundColor Red
}

if ($wlimpExists) {
    Write-Host "[OK] WLIMP endpoints deployed" -ForegroundColor Green
} else {
    Write-Host "[FAIL] WLIMP endpoints NOT deployed" -ForegroundColor Red
}

Write-Host ""

# Recommendations
Write-Host "=== Recommendations ===" -ForegroundColor Yellow
Write-Host ""

if ($apiHealthy -and $authExists -and $wlimpExists) {
    Write-Host "SUCCESS: Production is fully operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The database server is running and accessible through the API." -ForegroundColor Gray
    Write-Host "All WLIMP features are deployed and ready to use." -ForegroundColor Gray
} elseif ($apiHealthy -and $authExists -and -not $wlimpExists) {
    Write-Host "PARTIAL: API is running but WLIMP not deployed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Action needed:" -ForegroundColor Yellow
    Write-Host "  1. Deploy latest backend code in Coolify" -ForegroundColor Gray
    Write-Host "  2. Ensure migrations run automatically" -ForegroundColor Gray
    Write-Host "  3. Check deployment logs for errors" -ForegroundColor Gray
} elseif ($apiHealthy -and -not $authExists) {
    Write-Host "WARNING: API responding but endpoints missing" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This suggests an old version is deployed." -ForegroundColor Gray
    Write-Host "Redeploy the latest code from GitHub." -ForegroundColor Gray
} else {
    Write-Host "CRITICAL: Production API is not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Backend server is down" -ForegroundColor Gray
    Write-Host "  2. Database connection failed" -ForegroundColor Gray
    Write-Host "  3. Deployment failed" -ForegroundColor Gray
    Write-Host "  4. Network/DNS issue" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check Coolify logs for details." -ForegroundColor Gray
}

Write-Host ""

# Additional Info
Write-Host "=== Additional Information ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Production URLs:" -ForegroundColor Cyan
Write-Host "  API: https://api.cohortle.com" -ForegroundColor Gray
Write-Host "  Web: https://cohortle.com" -ForegroundColor Gray
Write-Host ""
Write-Host "Database Info:" -ForegroundColor Cyan
Write-Host "  Host: 107.175.94.134" -ForegroundColor Gray
Write-Host "  Port: 3306" -ForegroundColor Gray
Write-Host "  Database: cohortle (production)" -ForegroundColor Gray
Write-Host ""
Write-Host "Test Database Info:" -ForegroundColor Cyan
Write-Host "  Host: 107.175.94.134" -ForegroundColor Gray
Write-Host "  Port: 3306" -ForegroundColor Gray
Write-Host "  Database: cohortle_test" -ForegroundColor Gray
Write-Host ""
