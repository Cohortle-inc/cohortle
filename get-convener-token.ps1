# Get Convener Authentication Token
# This script helps you get a token for convener API access

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://api.cohortle.com",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("register", "login")]
    [string]$Action = "login"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Get Convener Token" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($Action -eq "register") {
    Write-Host "Creating a new convener account..." -ForegroundColor Yellow
    Write-Host ""
    
    # Get user input
    $email = Read-Host "Enter email address"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    $firstName = Read-Host "Enter first name"
    $lastName = Read-Host "Enter last name"
    
    Write-Host ""
    Write-Host "Registering convener account..." -ForegroundColor Yellow
    
    # Register request
    $registerBody = @{
        email = $email
        password = $passwordPlain
        first_name = $firstName
        last_name = $lastName
        role = "convener"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/api/auth/register-email" -Method POST -Headers $headers -Body $registerBody
        
        if ($response.error -eq $false) {
            Write-Host "✓ Account created successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Your convener token:" -ForegroundColor Yellow
            Write-Host $response.token -ForegroundColor Green
            Write-Host ""
            Write-Host "Save this token! You'll need it to create programmes." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Next step: Run the programme setup script:" -ForegroundColor Yellow
            Write-Host "  powershell -ExecutionPolicy Bypass -File create-test-programme.ps1 -Token `"$($response.token)`"" -ForegroundColor White
        }
        else {
            Write-Host "✗ Registration failed" -ForegroundColor Red
            Write-Host "  Error: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ Registration failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "  Details: $($errorObj.message)" -ForegroundColor Red
        }
    }
}
else {
    Write-Host "Logging in with existing account..." -ForegroundColor Yellow
    Write-Host ""
    
    # Get user input
    $email = Read-Host "Enter email address"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    Write-Host ""
    Write-Host "Logging in..." -ForegroundColor Yellow
    
    # Login request
    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/api/auth/login" -Method POST -Headers $headers -Body $loginBody
        
        if ($response.error -eq $false) {
            Write-Host "✓ Login successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "User Details:" -ForegroundColor Yellow
            Write-Host "  Email: $($response.user.email)" -ForegroundColor White
            Write-Host "  Role: $($response.user.role)" -ForegroundColor White
            Write-Host ""
            
            if ($response.user.role -ne "convener") {
                Write-Host "⚠ Warning: This account is not a convener!" -ForegroundColor Yellow
                Write-Host "  You need a convener account to create programmes." -ForegroundColor Yellow
                Write-Host "  Run this script with -Action register to create a convener account." -ForegroundColor Yellow
                Write-Host ""
            }
            
            Write-Host "Your authentication token:" -ForegroundColor Yellow
            Write-Host $response.token -ForegroundColor Green
            Write-Host ""
            Write-Host "Save this token! You'll need it to create programmes." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Next step: Run the programme setup script:" -ForegroundColor Yellow
            Write-Host "  powershell -ExecutionPolicy Bypass -File create-test-programme.ps1 -Token `"$($response.token)`"" -ForegroundColor White
        }
        else {
            Write-Host "✗ Login failed" -ForegroundColor Red
            Write-Host "  Error: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ Login failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "  Details: $($errorObj.message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
