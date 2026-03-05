# Diagnose Authentication 403 Forbidden Issue
# This script helps diagnose why users get 403 Forbidden on /v1/api/programmes/enrolled

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Authentication 403 Forbidden Diagnosis" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Issue: Users get 403 Forbidden on /v1/api/programmes/enrolled" -ForegroundColor Yellow
Write-Host "Endpoint uses: TokenMiddleware({ role: 'learner' })" -ForegroundColor White
Write-Host ""

Write-Host "Possible Causes:" -ForegroundColor Yellow
Write-Host "1. User role is not 'learner' in JWT token" -ForegroundColor White
Write-Host "2. JWT token doesn't include role claim (defaults to 'unassigned')" -ForegroundColor White
Write-Host "3. User role in database is not 'learner'" -ForegroundColor White
Write-Host "4. TokenMiddleware validation issue" -ForegroundColor White
Write-Host ""

Write-Host "Diagnosis Steps:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Check JWT Token" -ForegroundColor Cyan
Write-Host "-----------------------" -ForegroundColor Cyan
Write-Host "1. Log in as a user" -ForegroundColor White
Write-Host "2. Open browser Developer Tools (F12)" -ForegroundColor White
Write-Host "3. Go to Application tab > Local Storage" -ForegroundColor White
Write-Host "4. Look for 'auth' or 'token' key" -ForegroundColor White
Write-Host "5. Copy the JWT token" -ForegroundColor White
Write-Host "6. Decode at https://jwt.io/" -ForegroundColor White
Write-Host "7. Check if 'role' claim exists and equals 'learner'" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Check Database" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan
Write-Host "1. Connect to production database" -ForegroundColor White
Write-Host "2. Run query: SELECT id, email, role FROM users WHERE email = 'user@example.com';" -ForegroundColor White
Write-Host "3. Check if role column exists and value is 'learner'" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Check TokenMiddleware" -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan
Write-Host "File: cohortle-api/middleware/TokenMiddleware.js" -ForegroundColor White
Write-Host "Line 17: req.role = result.role || 'unassigned';" -ForegroundColor White
Write-Host "Line 20-28: Role validation logic" -ForegroundColor White
Write-Host ""

Write-Host "Step 4: Check JWT Service" -ForegroundColor Cyan
Write-Host "--------------------------" -ForegroundColor Cyan
Write-Host "File: cohortle-api/services/JwtService.js" -ForegroundColor White
Write-Host "Check if JWT tokens include 'role' claim when created" -ForegroundColor White
Write-Host ""

Write-Host "Immediate Fix Options:" -ForegroundColor Yellow
Write-Host "1. Update JWT token generation to include role claim" -ForegroundColor White
Write-Host "2. Update database to set user role to 'learner'" -ForegroundColor White
Write-Host "3. Temporarily modify TokenMiddleware to accept 'unassigned' role" -ForegroundColor White
Write-Host "   Change: TokenMiddleware({ role: 'learner|unassigned' })" -ForegroundColor White
Write-Host ""

Write-Host "Quick Test:" -ForegroundColor Cyan
Write-Host "-----------" -ForegroundColor Cyan
Write-Host "To test if role is the issue, temporarily modify:" -ForegroundColor White
Write-Host "cohortle-api/routes/programme.js line 57:" -ForegroundColor White
Write-Host "Change: TokenMiddleware({ role: 'learner' })" -ForegroundColor White
Write-Host "To: TokenMiddleware({ role: 'learner|unassigned' })" -ForegroundColor White
Write-Host "Then redeploy backend and test" -ForegroundColor White
Write-Host ""

Write-Host "Note: This is a temporary fix. The permanent fix is to ensure" -ForegroundColor Yellow
Write-Host "JWT tokens include the correct role claim and database has correct roles." -ForegroundColor White