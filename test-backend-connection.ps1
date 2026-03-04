# Test Backend-Frontend Database Connection
# This script tests if the backend test database is properly configured

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Backend-Frontend Test Database Connection Verification   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test Backend Test Database Setup
Write-Host "=== Testing Backend Test Database ===" -ForegroundColor Yellow
Write-Host ""

# Check if setup script exists
$setupScript = "cohortle-api\__tests__\setup-test-db.js"
if (Test-Path $setupScript) {
    Write-Host "OK Test database setup script exists" -ForegroundColor Green
} else {
    Write-Host "FAIL Test database setup script not found" -ForegroundColor Red
    exit 1
}

# Check if test helpers exist
$testHelpers = "cohortle-api\__tests__\helpers\testSetup.js"
if (Test-Path $testHelpers) {
    Write-Host "✓ Test helpers exist" -ForegroundColor Green
} else {
    Write-Host "✗ Test helpers not found" -ForegroundColor Red
}

# Check Jest config
$jestConfig = "cohortle-api\jest.config.js"
if (Test-Path $jestConfig) {
    Write-Host "✓ Backend Jest configuration exists" -ForegroundColor Green
} else {
    Write-Host "✗ Backend Jest configuration not found" -ForegroundColor Red
}

# Check if test database config exists in config.js
$configFile = "cohortle-api\config\config.js"
if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    if ($configContent -match "test:") {
        Write-Host "✓ Test database configuration found in config.js" -ForegroundColor Green
        
        # Extract test config details
        if ($configContent -match 'database:\s*process\.env\.DB_TEST_DATABASE\s*\|\|\s*"([^"]+)"') {
            $testDb = $matches[1]
            Write-Host "  Database: $testDb" -ForegroundColor Gray
        }
        if ($configContent -match 'host:\s*process\.env\.DB_HOSTNAME\s*\|\|\s*"([^"]+)"') {
            $testHost = $matches[1]
            Write-Host "  Host: $testHost" -ForegroundColor Gray
        }
    } else {
        Write-Host "✗ Test database configuration not found in config.js" -ForegroundColor Red
    }
}

Write-Host ""

# Test Backend API
Write-Host "=== Testing Backend API ===" -ForegroundColor Yellow
Write-Host ""

$apiUrl = "http://localhost:3001"
Write-Host "API URL: $apiUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$apiUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend API is running and healthy" -ForegroundColor Green
    $apiRunning = $true
} catch {
    Write-Host "✗ Backend API is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the backend:" -ForegroundColor Yellow
    Write-Host "  cd cohortle-api" -ForegroundColor Gray
    Write-Host "  npm start" -ForegroundColor Gray
    $apiRunning = $false
}

Write-Host ""

# Test Frontend Configuration
Write-Host "=== Testing Frontend Configuration ===" -ForegroundColor Yellow
Write-Host ""

$envLocal = "cohortle-web\.env.local"
$envExample = "cohortle-web\.env.example"

if (Test-Path $envLocal) {
    Write-Host "✓ .env.local exists" -ForegroundColor Green
    
    $envContent = Get-Content $envLocal -Raw
    if ($envContent -match 'NEXT_PUBLIC_API_URL=(.+)') {
        $apiUrlConfig = $matches[1].Trim()
        Write-Host "✓ NEXT_PUBLIC_API_URL is configured: $apiUrlConfig" -ForegroundColor Green
    } else {
        Write-Host "✗ NEXT_PUBLIC_API_URL is not set in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "✗ .env.local does not exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "To create it:" -ForegroundColor Yellow
    Write-Host "  cd cohortle-web" -ForegroundColor Gray
    Write-Host "  copy .env.example .env.local" -ForegroundColor Gray
    Write-Host "  # Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:3001" -ForegroundColor Gray
}

# Check Jest configuration
$frontendJestConfig = "cohortle-web\jest.config.js"
if (Test-Path $frontendJestConfig) {
    Write-Host "✓ Frontend Jest configuration exists" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend Jest configuration not found" -ForegroundColor Red
}

# Check if integration testing guide exists
$integrationGuide = "cohortle-web\INTEGRATION_TESTING_GUIDE.md"
if (Test-Path $integrationGuide) {
    Write-Host "✓ Integration testing guide exists" -ForegroundColor Green
} else {
    Write-Host "✗ Integration testing guide not found" -ForegroundColor Red
}

Write-Host ""

# Check for existing tests
Write-Host "=== Checking Existing Tests ===" -ForegroundColor Yellow
Write-Host ""

# Backend tests
$backendTests = Get-ChildItem -Path "cohortle-api\__tests__" -Filter "*.test.js" -Recurse -ErrorAction SilentlyContinue
$backendPbtTests = Get-ChildItem -Path "cohortle-api\__tests__" -Filter "*.pbt.js" -Recurse -ErrorAction SilentlyContinue

Write-Host "Backend Tests:" -ForegroundColor Cyan
Write-Host "  Unit tests: $($backendTests.Count)" -ForegroundColor Gray
Write-Host "  Property-based tests: $($backendPbtTests.Count)" -ForegroundColor Gray

# Frontend tests
$frontendTests = Get-ChildItem -Path "cohortle-web\__tests__" -Filter "*.test.*" -Recurse -ErrorAction SilentlyContinue
$frontendPbtTests = Get-ChildItem -Path "cohortle-web\__tests__" -Filter "*.pbt.*" -Recurse -ErrorAction SilentlyContinue

Write-Host "Frontend Tests:" -ForegroundColor Cyan
Write-Host "  Unit tests: $($frontendTests.Count)" -ForegroundColor Gray
Write-Host "  Property-based tests: $($frontendPbtTests.Count)" -ForegroundColor Gray

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Yellow
Write-Host ""

$dbSetupExists = Test-Path $setupScript
$apiOk = $apiRunning
$frontendConfigExists = Test-Path $envLocal

Write-Host "Backend Test Database Setup: $(if ($dbSetupExists) { '✓ EXISTS' } else { '✗ MISSING' })" -ForegroundColor $(if ($dbSetupExists) { 'Green' } else { 'Red' })
Write-Host "Backend API: $(if ($apiOk) { '✓ RUNNING' } else { '✗ NOT RUNNING' })" -ForegroundColor $(if ($apiOk) { 'Green' } else { 'Red' })
Write-Host "Frontend Configuration: $(if ($frontendConfigExists) { '✓ CONFIGURED' } else { '✗ NEEDS SETUP' })" -ForegroundColor $(if ($frontendConfigExists) { 'Green' } else { 'Red' })

Write-Host ""

if ($dbSetupExists -and $apiOk -and $frontendConfigExists) {
    Write-Host "✓ Test environment is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Setup test database: cd cohortle-api ; node __tests__\setup-test-db.js" -ForegroundColor Gray
    Write-Host "  2. Run backend tests: cd cohortle-api ; npm test" -ForegroundColor Gray
    Write-Host "  3. Run frontend tests: cd cohortle-web ; npm test" -ForegroundColor Gray
    Write-Host "  4. Follow INTEGRATION_TESTING_GUIDE.md for manual integration tests" -ForegroundColor Gray
} else {
    Write-Host "✗ Setup required before testing" -ForegroundColor Red
    Write-Host ""
    Write-Host "Required actions:" -ForegroundColor Yellow
    
    if (-not $dbSetupExists) {
        Write-Host "  • Ensure test database setup script exists" -ForegroundColor Gray
    }
    
    if (-not $apiOk) {
        Write-Host "  • Start the backend API (cd cohortle-api ; npm start)" -ForegroundColor Gray
    }
    
    if (-not $frontendConfigExists) {
        Write-Host "  • Create .env.local in cohortle-web with NEXT_PUBLIC_API_URL" -ForegroundColor Gray
    }
}

Write-Host ""
