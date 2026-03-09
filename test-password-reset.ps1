# Test Password Reset Flow
# This script tests the complete password reset flow

Write-Host "Testing Password Reset Flow..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "https://api.cohortle.com"
$testEmail = Read-Host "Enter email to test password reset"

Write-Host ""
Write-Host "Step 1: Request password reset..." -ForegroundColor Yellow

try {
    $forgotBody = @{
        email = $testEmail
    } | ConvertTo-Json

    $forgotResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/forgot-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $forgotBody

    if ($forgotResponse.error) {
        Write-Host "✗ Forgot password request failed: $($forgotResponse.message)" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Password reset email sent" -ForegroundColor Green
    Write-Host "  Reset link: $($forgotResponse.link)" -ForegroundColor Gray
    
    # Extract token from link
    $token = $forgotResponse.link -replace '.*token=', ''
    Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Gray

    Write-Host ""
    Write-Host "Step 2: Decode token to check expiry..." -ForegroundColor Yellow
    
    # Decode JWT (just the payload part)
    $tokenParts = $token.Split('.')
    if ($tokenParts.Length -eq 3) {
        $payload = $tokenParts[1]
        # Add padding if needed
        while ($payload.Length % 4 -ne 0) {
            $payload += '='
        }
        $payloadBytes = [Convert]::FromBase64String($payload)
        $payloadJson = [System.Text.Encoding]::UTF8.GetString($payloadBytes)
        $payloadObj = $payloadJson | ConvertFrom-Json
        
        $exp = $payloadObj.exp
        $expDate = [DateTimeOffset]::FromUnixTimeSeconds($exp).LocalDateTime
        $now = Get-Date
        $timeLeft = $expDate - $now
        
        Write-Host "  Token expires at: $expDate" -ForegroundColor Gray
        Write-Host "  Time left: $([Math]::Round($timeLeft.TotalMinutes, 2)) minutes" -ForegroundColor Gray
        Write-Host "  User ID: $($payloadObj.user_id)" -ForegroundColor Gray
        Write-Host "  Email: $($payloadObj.email)" -ForegroundColor Gray
        Write-Host "  Role: $($payloadObj.role)" -ForegroundColor Gray
        Write-Host "  Email Verified: $($payloadObj.email_verified)" -ForegroundColor Gray
        
        if ($timeLeft.TotalMinutes -lt 5) {
            Write-Host "  ⚠ Token expires in less than 5 minutes!" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "Step 3: Test token validity..." -ForegroundColor Yellow
    
    # Try to use the token immediately
    $resetBody = @{
        password = "TestPassword123!"
    } | ConvertTo-Json

    $resetResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/reset-password" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{
            Authorization = "Bearer $token"
        } `
        -Body $resetBody

    if ($resetResponse.error) {
        Write-Host "✗ Password reset failed: $($resetResponse.message)" -ForegroundColor Red
        Write-Host "  This indicates the token is not being accepted" -ForegroundColor Red
        exit 1
    }

    Write-Host "✓ Password reset successful!" -ForegroundColor Green
    Write-Host "  The token works correctly" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Password reset flow is working! ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
