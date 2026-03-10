# Check GitHub Actions Workflow Status
# This script helps you verify if your GitHub Actions are running

Write-Host "🔍 GitHub Actions Deployment Check" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

Write-Host "✅ Recent commits pushed to GitHub:" -ForegroundColor Green
git log --oneline -5
Write-Host ""

Write-Host "📋 To check if GitHub Actions are running:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://github.com/Cohortle-inc/cohortle/actions" -ForegroundColor White
Write-Host "2. Look for 'Purge Cloudflare Cache on Deploy' workflow" -ForegroundColor White
Write-Host "3. Check if it's running or completed" -ForegroundColor White
Write-Host ""

Write-Host "Expected behavior after the fix:" -ForegroundColor Cyan
Write-Host "  ✅ Workflow should trigger on push to master" -ForegroundColor Gray
Write-Host "  ✅ Wait 90 seconds for Coolify to deploy" -ForegroundColor Gray
Write-Host "  ✅ Purge Cloudflare cache" -ForegroundColor Gray
Write-Host "  ✅ Verify deployment" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "  • GitHub Actions only triggers Cloudflare cache purge" -ForegroundColor Gray
Write-Host "  • It does NOT trigger Coolify deployment" -ForegroundColor Gray
Write-Host "  • Coolify must be configured separately for auto-deploy" -ForegroundColor Gray
Write-Host ""

Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Configure Coolify Auto-Deploy (Recommended)" -ForegroundColor Green
Write-Host "  1. Open Coolify dashboard" -ForegroundColor Gray
Write-Host "  2. Go to cohortle-api → Settings → Source" -ForegroundColor Gray
Write-Host "  3. Enable 'Auto Deploy' on master branch" -ForegroundColor Gray
Write-Host "  4. Repeat for cohortle-web" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Manual Deploy (Quick Fix)" -ForegroundColor Yellow
Write-Host "  1. Open Coolify dashboard" -ForegroundColor Gray
Write-Host "  2. Click 'Deploy' on cohortle-api" -ForegroundColor Gray
Write-Host "  3. Click 'Deploy' on cohortle-web" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Set Up GitHub Webhook" -ForegroundColor Blue
Write-Host "  See: check-deployment-config.md for detailed steps" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  • check-deployment-config.md - Complete setup guide" -ForegroundColor Gray
Write-Host "  • DEPLOYMENT_TROUBLESHOOTING.md - Troubleshooting help" -ForegroundColor Gray
Write-Host ""
