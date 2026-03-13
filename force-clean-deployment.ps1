# Force Clean Deployment Script (PowerShell)
# This script clears all caches and forces a clean build to resolve Server Action issues

Write-Host "🧹 Starting force clean deployment..." -ForegroundColor Green

# Step 1: Clear Next.js cache
Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path "cohortle-web\.next") { Remove-Item -Recurse -Force "cohortle-web\.next" }
if (Test-Path "cohortle-web\node_modules\.cache") { Remove-Item -Recurse -Force "cohortle-web\node_modules\.cache" }

# Step 2: Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
Set-Location cohortle-web
npm cache clean --force

# Step 3: Remove node_modules and reinstall
Write-Host "Reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
npm ci

# Step 4: Clear any build artifacts
Write-Host "Clearing build artifacts..." -ForegroundColor Yellow
if (Test-Path ".vercel") { Remove-Item -Recurse -Force ".vercel" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }

# Step 5: Force build with clean environment
Write-Host "Building with clean environment..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build

Write-Host "✅ Force clean deployment complete!" -ForegroundColor Green
Write-Host "📝 If deployment still fails, check platform-specific cache settings" -ForegroundColor Cyan

Set-Location ..