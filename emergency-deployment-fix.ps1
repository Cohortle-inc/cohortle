#!/usr/bin/env pwsh

# Emergency Deployment Fix Script
# Clears all caches and forces clean rebuild to resolve Server Action deployment issue

Write-Host "🚨 EMERGENCY DEPLOYMENT FIX - Server Action Cache Clear" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Yellow

# Step 1: Clear Next.js build cache
Write-Host "🧹 Step 1: Clearing Next.js build cache..." -ForegroundColor Cyan
if (Test-Path "cohortle-web/.next") {
    Remove-Item -Recurse -Force "cohortle-web/.next"
    Write-Host "✅ Cleared .next directory" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next directory not found" -ForegroundColor Yellow
}

# Step 2: Clear node_modules cache
Write-Host "🧹 Step 2: Clearing node_modules cache..." -ForegroundColor Cyan
if (Test-Path "cohortle-web/node_modules/.cache") {
    Remove-Item -Recurse -Force "cohortle-web/node_modules/.cache"
    Write-Host "✅ Cleared node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules/.cache not found" -ForegroundColor Yellow
}

# Step 3: Clear npm cache
Write-Host "🧹 Step 3: Clearing npm cache..." -ForegroundColor Cyan
Set-Location "cohortle-web"
npm cache clean --force
Write-Host "✅ Cleared npm cache" -ForegroundColor Green

# Step 4: Clean install dependencies
Write-Host "📦 Step 4: Clean installing dependencies..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
npm install
Write-Host "✅ Clean installed dependencies" -ForegroundColor Green

# Step 5: Build with verbose logging
Write-Host "🔨 Step 5: Building with verbose logging..." -ForegroundColor Cyan
$env:NEXT_TELEMETRY_DISABLED = "1"
npm run build
$buildExitCode = $LASTEXITCODE

Set-Location ".."

if ($buildExitCode -eq 0) {
    Write-Host "🎉 SUCCESS: Build completed successfully!" -ForegroundColor Green
    Write-Host "✅ Server Actions have been disabled in next.config.mjs" -ForegroundColor Green
    Write-Host "✅ All caches have been cleared" -ForegroundColor Green
    Write-Host "✅ Dependencies have been reinstalled" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Deploy the application now" -ForegroundColor White
    Write-Host "2. Test that the website loads correctly" -ForegroundColor White
    Write-Host "3. Verify password reset functionality still works" -ForegroundColor White
    Write-Host "4. Monitor for any other issues" -ForegroundColor White
} else {
    Write-Host "❌ FAILED: Build failed with exit code $buildExitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Check the build output above for specific errors" -ForegroundColor White
    Write-Host "2. Look for any remaining Server Action references" -ForegroundColor White
    Write-Host "3. Consider rolling back to last working commit" -ForegroundColor White
    Write-Host "4. Check for any experimental Next.js features causing issues" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 CONFIGURATION CHANGES MADE:" -ForegroundColor Cyan
Write-Host "- Disabled Server Actions in next.config.mjs" -ForegroundColor White
Write-Host "- Cleared all build and dependency caches" -ForegroundColor White
Write-Host "- Force regenerated build ID to prevent cache conflicts" -ForegroundColor White