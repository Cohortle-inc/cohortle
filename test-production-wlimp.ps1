# WLIMP Production Testing Script
param(
    [string]$ApiUrl = "https://api.cohortle.com",
    [string]$Action = "help"
)

Write-Host "=== WLIMP Production Test ===" -ForegroundColor Cyan
Write-Host ""

if ($Action -eq "help") {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\test-production-wlimp.ps1 -Action <action>" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  health       - Check if API is accessible" -ForegroundColor White
    Write-Host "  register     - Register a new convener account" -ForegroundColor White
    Write-Host "  login        - Login with existing account" -ForegroundColor White
    Write-Host "  create       - Create a test programme (requires token)" -ForegroundColor White
    Write-Host ""
    exit
}

if ($Action -eq "health") {
    Write-Host "Testing API health..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method GET -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "SUCCESS: API is accessible" -ForegroundColor Green
            Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "FAILED: API is not accessible" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit
}

if ($Action -eq "register") {
    Write-Host "Registering new convener account..." -ForegroundColor Yellow
    Write-Host ""
    
    $email = Read-Host "Enter email"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    $body = @{
        email = $email
        password = $passwordPlain
        role = "convener"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/api/auth/register" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.token) {
            Write-Host "SUCCESS: Registration successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Your authentication token:" -ForegroundColor Cyan
            Write-Host $response.token -ForegroundColor White
            Write-Host ""
            
            $response.token | Out-File -FilePath "convener-token.txt" -NoNewline
            Write-Host "Token saved to: convener-token.txt" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "FAILED: Registration failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit
}

if ($Action -eq "login") {
    Write-Host "Logging in..." -ForegroundColor Yellow
    Write-Host ""
    
    $email = Read-Host "Enter email"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    $body = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/api/auth/login" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.token) {
            Write-Host "SUCCESS: Login successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Your authentication token:" -ForegroundColor Cyan
            Write-Host $response.token -ForegroundColor White
            Write-Host ""
            
            $response.token | Out-File -FilePath "convener-token.txt" -NoNewline
            Write-Host "Token saved to: convener-token.txt" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "FAILED: Login failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit
}

if ($Action -eq "create") {
    if (-not (Test-Path "convener-token.txt")) {
        Write-Host "ERROR: No token found. Please register or login first." -ForegroundColor Red
        exit
    }
    
    $token = Get-Content "convener-token.txt" -Raw
    
    Write-Host "Creating test programme..." -ForegroundColor Yellow
    
    $programmeBody = @{
        name = "WLIMP Test Programme"
        description = "Test programme for WLIMP feature"
        start_date = "2026-03-01"
        type = "structured"
        status = "active"
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $programme = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes" -Method POST -Body $programmeBody -Headers $headers
        Write-Host "SUCCESS: Programme created!" -ForegroundColor Green
        Write-Host "Programme ID: $($programme.programme.id)" -ForegroundColor Cyan
        Write-Host "Name: $($programme.programme.name)" -ForegroundColor Cyan
        
        $programmeId = $programme.programme.id
        
        Write-Host ""
        Write-Host "Creating cohort with enrollment code..." -ForegroundColor Yellow
        $cohortBody = @{
            name = "WLIMP 2026 Cohort"
            start_date = "2026-03-01"
            enrollment_code = "WLIMP-2026"
        } | ConvertTo-Json
        
        $cohort = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/$programmeId/cohorts" -Method POST -Body $cohortBody -Headers $headers
        Write-Host "SUCCESS: Cohort created!" -ForegroundColor Green
        Write-Host "Enrollment Code: WLIMP-2026" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "Creating weeks and lessons..." -ForegroundColor Yellow
        for ($i = 1; $i -le 3; $i++) {
            $weekBody = @{
                week_number = $i
                title = "Week $i"
                description = "Week $i content"
                start_date = "2026-03-01"
            } | ConvertTo-Json
            
            $week = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/$programmeId/weeks" -Method POST -Body $weekBody -Headers $headers
            Write-Host "  Week $i created (ID: $($week.week.id))" -ForegroundColor Green
            
            $lesson1Body = @{
                title = "Week $i - Lesson 1"
                description = "First lesson of week $i"
                content_type = "video"
                content_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                order_index = 0
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "$ApiUrl/v1/api/weeks/$($week.week.id)/lessons" -Method POST -Body $lesson1Body -Headers $headers | Out-Null
            Write-Host "    Lesson 1 created" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "=== Programme Created Successfully! ===" -ForegroundColor Green
        Write-Host "Programme ID: $programmeId" -ForegroundColor Cyan
        Write-Host "Enrollment Code: WLIMP-2026" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Learners can now enroll at: https://cohortle.com/join" -ForegroundColor Yellow
        Write-Host "Using code: WLIMP-2026" -ForegroundColor Yellow
    }
    catch {
        Write-Host "FAILED: Could not create programme" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit
}

Write-Host "Unknown action: $Action" -ForegroundColor Red
Write-Host "Use -Action help for usage information" -ForegroundColor Yellow
