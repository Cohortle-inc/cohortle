# Update Deployment Markers Script
# Updates deployment markers in code files before deployment

param(
    [string]$Marker = ""
)

# Generate marker if not provided
if ([string]::IsNullOrEmpty($Marker)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
    $Marker = "BUILD-$timestamp"
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Update Deployment Markers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New Marker: $Marker" -ForegroundColor Yellow
Write-Host ""

$filesUpdated = 0

# =====================
# Backend Files
# =====================
Write-Host "Updating Backend Files..." -ForegroundColor Yellow

# Update app.js
$appJsPath = "cohortle-api/app.js"
if (Test-Path $appJsPath) {
    $content = Get-Content $appJsPath -Raw
    $content = $content -replace '// DEPLOYMENT_MARKER: .+', "// DEPLOYMENT_MARKER: $Marker"
    Set-Content $appJsPath $content -NoNewline
    Write-Host "  ✓ Updated $appJsPath" -ForegroundColor Green
    $filesUpdated++
}

# Update programme.js
$programmeJsPath = "cohortle-api/routes/programme.js"
if (Test-Path $programmeJsPath) {
    $content = Get-Content $programmeJsPath -Raw
    $content = $content -replace '// DEPLOYMENT_MARKER: .+', "// DEPLOYMENT_MARKER: $Marker"
    Set-Content $programmeJsPath $content -NoNewline
    Write-Host "  ✓ Updated $programmeJsPath" -ForegroundColor Green
    $filesUpdated++
}

# Update deployment-info.json
$backendDeploymentInfoPath = "cohortle-api/deployment-info.json"
if (Test-Path $backendDeploymentInfoPath) {
    $deploymentInfo = @{
        deployed = $true
        buildTimestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        version = "1.0.0"
        environment = "production"
        marker = $Marker
        description = "Programme Creation Workflow Fixes - Deployment Verification"
    }
    $deploymentInfo | ConvertTo-Json | Set-Content $backendDeploymentInfoPath
    Write-Host "  ✓ Updated $backendDeploymentInfoPath" -ForegroundColor Green
    $filesUpdated++
}

Write-Host ""

# =====================
# Frontend Files
# =====================
Write-Host "Updating Frontend Files..." -ForegroundColor Yellow

# Update layout.tsx
$layoutPath = "cohortle-web/src/app/layout.tsx"
if (Test-Path $layoutPath) {
    $content = Get-Content $layoutPath -Raw
    $content = $content -replace '// DEPLOYMENT_MARKER: .+', "// DEPLOYMENT_MARKER: $Marker"
    Set-Content $layoutPath $content -NoNewline
    Write-Host "  ✓ Updated $layoutPath" -ForegroundColor Green
    $filesUpdated++
}

# Update dashboard page
$dashboardPath = "cohortle-web/src/app/dashboard/page.tsx"
if (Test-Path $dashboardPath) {
    $content = Get-Content $dashboardPath -Raw
    $content = $content -replace '// DEPLOYMENT_MARKER: .+', "// DEPLOYMENT_MARKER: $Marker"
    Set-Content $dashboardPath $content -NoNewline
    Write-Host "  ✓ Updated $dashboardPath" -ForegroundColor Green
    $filesUpdated++
}

# Update deployment-info.json
$frontendDeploymentInfoPath = "cohortle-web/deployment-info.json"
if (Test-Path $frontendDeploymentInfoPath) {
    $deploymentInfo = @{
        deployed = $true
        buildTimestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        version = "1.0.0"
        environment = "production"
        marker = $Marker
        description = "Programme Creation Workflow Fixes - Deployment Verification"
    }
    $deploymentInfo | ConvertTo-Json | Set-Content $frontendDeploymentInfoPath
    Write-Host "  ✓ Updated $frontendDeploymentInfoPath" -ForegroundColor Green
    $filesUpdated++
}

Write-Host ""

# =====================
# Summary
# =====================
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Updated $filesUpdated files with marker: $Marker" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Commit these changes to git" -ForegroundColor White
Write-Host "  2. Push to main branch to trigger deployment" -ForegroundColor White
Write-Host "  3. Wait for Coolify deployment to complete" -ForegroundColor White
Write-Host "  4. Run .\verify-deployment.ps1 -ExpectedMarker '$Marker'" -ForegroundColor White
Write-Host ""
