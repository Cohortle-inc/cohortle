# Test password reset flow in production
Write-Host "=== TESTING PASSWORD RESET FLOW ===" -ForegroundColor Green

# Step 1: Request password reset
Write-Host "`n1. Testing forgot password request..." -ForegroundColor Yellow
$forgotResponse = try {
    Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/auth/forgot-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email": "teamcohortle@gmail.com"}' `
        -ErrorAction Stop
} catch {
    Write-Host "❌ Forgot password failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Response
}

if ($forgotResponse) {
    Write-Host "✅ Forgot password request successful" -ForegroundColor Green
    Write-Host "Response: $($forgotResponse | ConvertTo-Json -Depth 3)"
} else {
    Write-Host "❌ No response from forgot password endpoint" -ForegroundColor Red
    exit 1
}

# Step 2: Test with a fresh token (user needs to get this from email)
Write-Host "`n2. Testing reset password with token..." -ForegroundColor Yellow
Write-Host "⚠️  User needs to:" -ForegroundColor Yellow
Write-Host "   - Check email for reset link" -ForegroundColor Yellow
Write-Host "   - Extract token from the link" -ForegroundColor Yellow
Write-Host "   - Use that token in the reset password form" -ForegroundColor Yellow

# Step 3: Check if production server has the new JWT_SECRET
Write-Host "`n3. Testing JWT_SECRET deployment..." -ForegroundColor Yellow
$testResponse = try {
    Invoke-RestMethod -Uri "https://api.cohortle.com/v1/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email": "test@example.com", "password": "wrongpassword"}' `
        -ErrorAction SilentlyContinue
} catch {
    # Expected to fail, we just want to see if server is responding
    Write-Host "✅ Production API is responding" -ForegroundColor Green
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Ensure production server has been restarted with new JWT_SECRET" -ForegroundColor White
Write-Host "2. Request a fresh password reset email" -ForegroundColor White
Write-Host "3. Use the NEW token from the email (not old ones)" -ForegroundColor White
Write-Host "4. Check browser network tab for actual error details" -ForegroundColor White