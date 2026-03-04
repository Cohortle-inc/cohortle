# Test forgot-password endpoint in production
# This script helps verify if the Resend email integration is working

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://api.cohortle.com"
)

Write-Host "=== Testing Forgot Password Endpoint ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "Email: $Email" -ForegroundColor Gray
Write-Host ""

$body = @{
    email = $Email
} | ConvertTo-Json

try {
    Write-Host "Sending request..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod `
        -Uri "$ApiUrl/v1/api/auth/forgot-password" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✓ SUCCESS" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.error -eq $false) {
        Write-Host ""
        Write-Host "✓ Email should be sent to: $Email" -ForegroundColor Green
        Write-Host "✓ Check your inbox (and spam folder)" -ForegroundColor Green
        
        if ($response.link) {
            Write-Host ""
            Write-Host "Reset link (for debugging):" -ForegroundColor Yellow
            Write-Host $response.link -ForegroundColor Gray
        }
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    
    Write-Host ""
    Write-Host "✗ FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    
    if ($errorBody) {
        Write-Host "Error Response:" -ForegroundColor Red
        $errorBody | Write-Host
        
        # Parse error message
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            if ($errorJson.message -like "*Failed to send*email*") {
                Write-Host ""
                Write-Host "⚠ Email sending failed!" -ForegroundColor Yellow
                Write-Host "This likely means RESEND_API_KEY is not configured in production." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "1. Go to Coolify dashboard" -ForegroundColor White
                Write-Host "2. Navigate to cohortle-api service" -ForegroundColor White
                Write-Host "3. Add RESEND_API_KEY environment variable" -ForegroundColor White
                Write-Host "4. Restart the service" -ForegroundColor White
                Write-Host "5. Run this script again" -ForegroundColor White
            }
        } catch {
            # Ignore JSON parse errors
        }
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
