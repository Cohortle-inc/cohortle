# Quick Fix Script for Server Action Mismatch
# Run this when you see "Failed to find Server Action" errors

Write-Host "Server Action Mismatch Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check git status
Write-Host "Step 1: Checking Git Status..." -ForegroundColor Yellow
cd cohortle-web
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes found!" -ForegroundColor Red
    Write-Host "Please commit and push your changes first." -ForegroundColor Red
    exit 1
}

$unpushed = git log origin/main..HEAD --oneline
if ($unpushed) {
    Write-Host "Unpushed commits found!" -ForegroundColor Red
    Write-Host "Pushing to origin..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to push. Please push manually." -ForegroundColor Red
        exit 1
    }
    Write-Host "Pushed successfully" -ForegroundColor Green
} else {
    Write-Host "Git is up to date" -ForegroundColor Green
}

cd ..

# Step 2: Purge Cloudflare Cache
Write-Host ""
Write-Host "Step 2: Purging Cloudflare Cache..." -ForegroundColor Yellow
if (Test-Path ".\purge-cloudflare-cache.ps1") {
    & .\purge-cloudflare-cache.ps1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Cache purged successfully" -ForegroundColor Green
    } else {
        Write-Host "Cache purge failed (may need manual purge)" -ForegroundColor Yellow
    }
} else {
    Write-Host "Cache purge script not found - skip or purge manually in Cloudflare" -ForegroundColor Yellow
}

# Step 3: Get current commit hash
Write-Host ""
Write-Host "Step 3: Getting Current Commit Hash..." -ForegroundColor Yellow
cd cohortle-web
$commitHash = git rev-parse --short HEAD
Write-Host "Current commit: $commitHash" -ForegroundColor Cyan
cd ..

# Step 4: Instructions for Coolify
Write-Host ""
Write-Host "Step 4: Coolify Deployment Instructions" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please complete these steps in Coolify:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to Coolify Dashboard" -ForegroundColor White
Write-Host "2. Navigate to 'cohortle-web' service" -ForegroundColor White
Write-Host "3. Click 'Redeploy' button" -ForegroundColor White
Write-Host "4. Enable 'Force Rebuild' option" -ForegroundColor White
Write-Host "5. Wait for deployment to complete" -ForegroundColor White
Write-Host "6. Check logs for errors" -ForegroundColor White
Write-Host "7. Verify only ONE container is running" -ForegroundColor White
Write-Host ""
Write-Host "Expected commit in Coolify: $commitHash" -ForegroundColor Cyan
Write-Host ""

# Step 5: Verification
Write-Host "Step 5: Post-Deployment Verification" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After Coolify deployment completes:" -ForegroundColor White
Write-Host ""
Write-Host "1. Run: .\verify-production-deployment.ps1" -ForegroundColor White
Write-Host "2. Check that commit hash matches: $commitHash" -ForegroundColor White
Write-Host "3. Test the app in incognito mode" -ForegroundColor White
Write-Host "4. Hard refresh (Ctrl+Shift+R) if needed" -ForegroundColor White
Write-Host ""

# Step 6: User Instructions
Write-Host "Step 6: User Instructions" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If users still see the error, they should:" -ForegroundColor White
Write-Host ""
Write-Host "1. Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)" -ForegroundColor White
Write-Host "2. Or clear browser cache completely" -ForegroundColor White
Write-Host "3. Close all tabs and reopen the app" -ForegroundColor White
Write-Host ""

Write-Host "Pre-deployment steps complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Deploy in Coolify, then run verification script" -ForegroundColor Cyan
Write-Host ""
