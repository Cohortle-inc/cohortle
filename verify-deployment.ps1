# Comprehensive Deployment Verification Script
# Checks if code changes are actually deployed to production

param(
    [string]$ExpectedMarker = "2025-01-BUILD"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Verification" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPass = $true

# =====================
# Backend Verification
# =====================
Write-Host "1. Checking Backend Deployment..." -ForegroundColor Yellow
Write-Host ""

try {
    $backendResponse = Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/deployment/verify" -Method GET -ErrorAction Stop
    
    Write-Host "  Backend Status:" -ForegroundColor White
    Write-Host "    Deployed: $($backendResponse.deployed)" -ForegroundColor $(if ($backendResponse.deployed) { "Green" } else { "Red" })
    Write-Host "    Build Timestamp: $($backendResponse.buildTimestamp)" -ForegroundColor Gray
    Write-Host "    Version: $($backendResponse.version)" -ForegroundColor Gray
    Write-Host "    Environment: $($backendResponse.environment)" -ForegroundColor Gray
    Write-Host ""
    
    if ($backendResponse.codeMarkers -and $backendResponse.codeMarkers.Count -gt 0) {
        Write-Host "  Code Markers Found:" -ForegroundColor White
        foreach ($marker in $backendResponse.codeMarkers) {
            $markerMatch = $marker.marker -eq $ExpectedMarker
            $color = if ($markerMatch) { "Green" } else { "Yellow" }
            Write-Host "    $($marker.file): $($marker.marker)" -ForegroundColor $color
            
            if (-not $markerMatch) {
                Write-Host "      ⚠ Expected: $ExpectedMarker" -ForegroundColor Yellow
                $allChecksPass = $false
            }
        }
    } else {
        Write-Host "  ⚠ No code markers found in backend" -ForegroundColor Yellow
        $allChecksPass = $false
    }
    
    Write-Host ""
    Write-Host "  ✓ Backend deployment endpoint is accessible" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to verify backend deployment" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $allChecksPass = $false
}

Write-Host ""

# =====================
# Frontend Verification
# =====================
Write-Host "2. Checking Frontend Deployment..." -ForegroundColor Yellow
Write-Host ""

try {
    $frontendResponse = Invoke-RestMethod -Uri "https://cohortle.com/api/deployment" -Method GET -ErrorAction Stop
    
    Write-Host "  Frontend Status:" -ForegroundColor White
    Write-Host "    Deployed: $($frontendResponse.deployed)" -ForegroundColor $(if ($frontendResponse.deployed) { "Green" } else { "Red" })
    Write-Host "    Build Timestamp: $($frontendResponse.buildTimestamp)" -ForegroundColor Gray
    Write-Host "    Version: $($frontendResponse.version)" -ForegroundColor Gray
    Write-Host "    Environment: $($frontendResponse.environment)" -ForegroundColor Gray
    Write-Host "    API URL: $($frontendResponse.apiUrl)" -ForegroundColor Gray
    Write-Host ""
    
    if ($frontendResponse.codeMarkers -and $frontendResponse.codeMarkers.Count -gt 0) {
        Write-Host "  Code Markers Found:" -ForegroundColor White
        foreach ($marker in $frontendResponse.codeMarkers) {
            $markerMatch = $marker.marker -eq $ExpectedMarker
            $color = if ($markerMatch) { "Green" } else { "Yellow" }
            Write-Host "    $($marker.file): $($marker.marker)" -ForegroundColor $color
            
            if (-not $markerMatch) {
                Write-Host "      ⚠ Expected: $ExpectedMarker" -ForegroundColor Yellow
                $allChecksPass = $false
            }
        }
    } else {
        Write-Host "  ⚠ No code markers found in frontend" -ForegroundColor Yellow
        $allChecksPass = $false
    }
    
    Write-Host ""
    Write-Host "  ✓ Frontend deployment endpoint is accessible" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to verify frontend deployment" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    $allChecksPass = $false
}

Write-Host ""

# =====================
# Cache Status Check
# =====================
Write-Host "3. Checking Cache Status..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Note: Cache purging is automated via GitHub Actions" -ForegroundColor Gray
Write-Host "  Workflow: .github/workflows/purge-cache-on-deploy.yml" -ForegroundColor Gray
Write-Host ""

if ($env:CLOUDFLARE_API_TOKEN) {
    Write-Host "  ✓ CLOUDFLARE_API_TOKEN is set" -ForegroundColor Green
} else {
    Write-Host "  ⚠ CLOUDFLARE_API_TOKEN not set in environment" -ForegroundColor Yellow
    Write-Host "    Cache purging may not work automatically" -ForegroundColor Yellow
}

Write-Host ""

# =====================
# Summary
# =====================
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($allChecksPass) {
    Write-Host "✓ All deployment checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code is deployed and accessible in production." -ForegroundColor White
    Write-Host "Expected marker '$ExpectedMarker' found in all key files." -ForegroundColor White
    exit 0
} else {
    Write-Host "⚠ Some deployment checks failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Code not yet deployed (wait a few minutes)" -ForegroundColor White
    Write-Host "  2. Cloudflare cache not purged (run: .\purge-cloudflare-cache.ps1)" -ForegroundColor White
    Write-Host "  3. Deployment markers don't match expected version" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Check Coolify deployment logs" -ForegroundColor White
    Write-Host "  2. Verify GitHub Actions workflow ran successfully" -ForegroundColor White
    Write-Host "  3. Manually purge Cloudflare cache if needed" -ForegroundColor White
    exit 1
}
