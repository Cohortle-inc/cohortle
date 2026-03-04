# Test Welcome Email and Audience Management
# This script tests the complete new user registration flow with Resend

$apiUrl = "https://api.cohortle.com"
$testEmail = "test-welcome-$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"

Write-Host "Testing Welcome Email Flow" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register new user
Write-Host "1. Registering new user..." -ForegroundColor Yellow
Write-Host "   Email: $testEmail" -ForegroundColor Gray

$body = @{
    email = $testEmail
    password = "TestPassword123!"
    first_name = "Test"
    last_name = "User"
    role = "learner"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/register-email" `
        -Method POST `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "   ✓ Registration successful" -ForegroundColor Green
    Write-Host "   Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""

    # Expected results
    Write-Host "2. Expected Results:" -ForegroundColor Yellow
    Write-Host "   ✓ User account created" -ForegroundColor Green
    Write-Host "   ✓ Welcome email sent to: $testEmail" -ForegroundColor Green
    Write-Host "   ✓ User added to 'New signups' audience in Resend" -ForegroundColor Green
    Write-Host ""

    Write-Host "3. Manual Verification Steps:" -ForegroundColor Yellow
    Write-Host "   [ ] Check $testEmail inbox for welcome email" -ForegroundColor White
    Write-Host "   [ ] Verify email contains verification link" -ForegroundColor White
    Write-Host "   [ ] Check Resend dashboard → Audiences → 'New signups'" -ForegroundColor White
    Write-Host "   [ ] Verify $testEmail appears in audience" -ForegroundColor White
    Write-Host ""

    Write-Host "4. Check Logs:" -ForegroundColor Yellow
    Write-Host "   Run this in Coolify logs:" -ForegroundColor White
    Write-Host "   grep 'ResendService' | grep '$testEmail'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Look for:" -ForegroundColor White
    Write-Host "   - [ResendService] Email sent successfully" -ForegroundColor Gray
    Write-Host "   - [ResendService] Contact added to audience successfully" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "   ✗ Registration failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetails.message)" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

Write-Host "Test completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check the test email inbox" -ForegroundColor White
Write-Host "2. Verify welcome email received" -ForegroundColor White
Write-Host "3. Check Resend dashboard for audience membership" -ForegroundColor White
Write-Host "4. Review Coolify logs for any errors" -ForegroundColor White
