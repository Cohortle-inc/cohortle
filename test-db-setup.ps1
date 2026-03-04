# Test Backend-Frontend Database Connection
# Simple verification script for Windows

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Database Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Backend Test Database Setup
Write-Host "=== Backend Test Database ===" -ForegroundColor Yellow
Write-Host ""

$setupScript = "cohortle-api\__tests__\setup-test-db.js"
if (Test-Path $setupScript) {
    Write-Host "[OK] Test database setup script exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test database setup script not found" -ForegroundColor Red
}

$testHelpers = "cohortle-api\__tests__\helpers\testSetup.js"
if (Test-Path $testHelpers) {
    Write-Host "[OK] Test helpers exist" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Test helpers not found" -ForegroundColor Red
}

$jestConfig = "cohortle-api\jest.config.js"
if (Test-Path $jestConfig) {
    Write-Host "[OK] Backend Jest configuration exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend Jest configuration not found" -ForegroundColor Red
}

$configFile = "cohortle-api\config\config.js"
if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    if ($configContent -match "test:") {
        Write-Host "[OK] Test database configuration found" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Test database configuration not found" -ForegroundColor Red
    }
}

Write-Host ""

# Test Backend API
Write-Host "=== Backend API ===" -ForegroundColor Yellow
Write-Host ""

$apiUrl = "http://localhost:3001"
Write-Host "Checking: $apiUrl/health" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$apiUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend API is running" -ForegroundColor Green
    $apiRunning = $true
} catch {
    Write-Host "[FAIL] Backend API is not running" -ForegroundColor Red
    Write-Host "       Start with: cd cohortle-api ; npm start" -ForegroundColor Gray
    $apiRunning = $false
}

Write-Host ""

# Test Frontend Configuration
Write-Host "=== Frontend Configuration ===" -ForegroundColor Yellow
Write-Host ""

$envLocal = "cohortle-web\.env.local"
if (Test-Path $envLocal) {
    Write-Host "[OK] .env.local exists" -ForegroundColor Green
    
    $envContent = Get-Content $envLocal -Raw
    if ($envContent -match 'NEXT_PUBLIC_API_URL') {
        Write-Host "[OK] NEXT_PUBLIC_API_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] NEXT_PUBLIC_API_URL not set" -ForegroundColor Red
    }
} else {
    Write-Host "[FAIL] .env.local does not exist" -ForegroundColor Red
    Write-Host "       Create with: cd cohortle-web ; copy .env.example .env.local" -ForegroundColor Gray
}

$frontendJestConfig = "cohortle-web\jest.config.js"
if (Test-Path $frontendJestConfig) {
    Write-Host "[OK] Frontend Jest configuration exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend Jest configuration not found" -ForegroundColor Red
}

Write-Host ""

# Check for existing tests
Write-Host "=== Existing Tests ===" -ForegroundColor Yellow
Write-Host ""

$backendTests = @(Get-ChildItem -Path "cohortle-api\__tests__" -Filter "*.test.js" -Recurse -ErrorAction SilentlyContinue)
$backendPbtTests = @(Get-ChildItem -Path "cohortle-api\__tests__" -Filter "*.pbt.js" -Recurse -ErrorAction SilentlyContinue)

Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "  Unit tests: $($backendTests.Count)" -ForegroundColor Gray
Write-Host "  Property-based tests: $($backendPbtTests.Count)" -ForegroundColor Gray

$frontendTests = @(Get-ChildItem -Path "cohortle-web\__tests__" -Filter "*.test.*" -Recurse -ErrorAction SilentlyContinue)
$frontendPbtTests = @(Get-ChildItem -Path "cohortle-web\__tests__" -Filter "*.pbt.*" -Recurse -ErrorAction SilentlyContinue)

Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "  Unit tests: $($frontendTests.Count)" -ForegroundColor Gray
Write-Host "  Property-based tests: $($frontendPbtTests.Count)" -ForegroundColor Gray

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Yellow
Write-Host ""

$dbSetupExists = Test-Path $setupScript
$frontendConfigExists = Test-Path $envLocal

if ($dbSetupExists) {
    Write-Host "[OK] Backend test database setup available" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend test database setup missing" -ForegroundColor Red
}

if ($apiRunning) {
    Write-Host "[OK] Backend API is running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend API is not running" -ForegroundColor Red
}

if ($frontendConfigExists) {
    Write-Host "[OK] Frontend configuration exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend configuration missing" -ForegroundColor Red
}

Write-Host ""

if ($dbSetupExists -and $apiRunning -and $frontendConfigExists) {
    Write-Host "SUCCESS: Test environment is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Setup test DB: cd cohortle-api ; node __tests__\setup-test-db.js" -ForegroundColor Gray
    Write-Host "  2. Run backend tests: cd cohortle-api ; npm test" -ForegroundColor Gray
    Write-Host "  3. Run frontend tests: cd cohortle-web ; npm test" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION: Setup required" -ForegroundColor Red
    Write-Host ""
    if (-not $apiRunning) {
        Write-Host "  - Start backend: cd cohortle-api ; npm start" -ForegroundColor Gray
    }
    if (-not $frontendConfigExists) {
        Write-Host "  - Create frontend config: cd cohortle-web ; copy .env.example .env.local" -ForegroundColor Gray
    }
}

Write-Host ""
