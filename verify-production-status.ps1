# Production Deployment Verification Script
# Tests all critical endpoints and features

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://api.cohortle.com"
$webUrl = "https://cohortle.com"
$errors = @()
$warnings = @()
$success = @()

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  Pass - Status: $($response.StatusCode)" -ForegroundColor Green
            $script:success += $Description
            return $true
        } else {
            Write-Host "  Fail - Expected $ExpectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            $script:errors += "$Description - Wrong status code: $($response.StatusCode)"
            return $false
        }
    } catch {
        Write-Host "  Fail - Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:errors += "$Description - $($_.Exception.Message)"
        return $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. API Health Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint -Url "$apiUrl/health" -Description "API Health Endpoint"
Test-Endpoint -Url "$apiUrl/v1/api/health" -Description "API V1 Health Endpoint"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "2. Web Application Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Test-Endpoint -Url "$webUrl" -Description "Homepage"
Test-Endpoint -Url "$webUrl/login" -Description "Login Page"
Test-Endpoint -Url "$webUrl/join" -Description "Join Page"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "3. Git Commit Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking local git status..." -ForegroundColor Yellow
try {
    $currentCommit = git rev-parse HEAD
    $currentBranch = git rev-parse --abbrev-ref HEAD
    $shortCommit = $currentCommit.Substring(0, 7)
    
    Write-Host "  Current Branch: $currentBranch" -ForegroundColor Cyan
    Write-Host "  Current Commit: $shortCommit" -ForegroundColor Cyan
    
    # Check if there are uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Write-Host "  Warning - Uncommitted changes detected" -ForegroundColor Yellow
        $script:warnings += "Uncommitted changes in local repository"
    } else {
        Write-Host "  Pass - Working directory clean" -ForegroundColor Green
    }
    
} catch {
    Write-Host "  Error checking git status: $($_.Exception.Message)" -ForegroundColor Red
    $script:errors += "Git status check failed"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "4. Build Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking if Continue Learning button code exists..." -ForegroundColor Yellow
$programmeHeaderPath = "cohortle-web/src/components/programmes/ProgrammeHeader.tsx"
if (Test-Path $programmeHeaderPath) {
    $content = Get-Content $programmeHeaderPath -Raw
    if ($content -like "*Continue Learning*") {
        Write-Host "  Pass - Continue Learning button code found in source" -ForegroundColor Green
        $script:success += "Continue Learning code exists locally"
    } else {
        Write-Host "  Fail - Continue Learning button code NOT found" -ForegroundColor Red
        $script:errors += "Continue Learning code missing from source"
    }
} else {
    Write-Host "  Fail - ProgrammeHeader.tsx not found" -ForegroundColor Red
    $script:errors += "ProgrammeHeader.tsx file missing"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "5. Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Required environment variables for production:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_API_URL=https://api.cohortle.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "You confirmed this is set correctly in your deployment platform" -ForegroundColor Green
Write-Host ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Passed: $($success.Count)" -ForegroundColor Green
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "Errors: $($errors.Count)" -ForegroundColor Red
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RECOMMENDED ACTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor Yellow
Write-Host "2. Check deployment platform build logs" -ForegroundColor Yellow
Write-Host "3. Clear build cache and redeploy" -ForegroundColor Yellow
Write-Host "4. Try the browser test script: test-production-browser.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "For detailed troubleshooting, see: diagnose-deployment.md" -ForegroundColor Cyan
Write-Host ""
