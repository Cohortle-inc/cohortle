# Diagnose Programme Name Issue for Enrollment Code prog-2026-b88glo
# This script uses the production API to check the programme details

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Programme Name Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://api.cohortle.com"
$enrollmentCode = "PROG-2026-B88GLO"

Write-Host "Checking enrollment code: $enrollmentCode" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if the enrollment code exists
Write-Host "[1/2] Validating enrollment code..." -ForegroundColor Cyan
try {
    $validateUrl = "$apiUrl/v1/api/enroll/validate-code"
    $body = @{
        code = $enrollmentCode
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $validateUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "  [OK] Enrollment code is valid" -ForegroundColor Green
    Write-Host ""
    Write-Host "Programme Details:" -ForegroundColor Yellow
    Write-Host "  Programme ID: $($response.programme_id)" -ForegroundColor Gray
    Write-Host "  Programme Name: $($response.programme_name)" -ForegroundColor Gray
    Write-Host "  Cohort ID: $($response.cohort_id)" -ForegroundColor Gray
    Write-Host ""
    
    $programmeId = $response.programme_id
    $programmeName = $response.programme_name
    $cohortId = $response.cohort_id
    
} catch {
    Write-Host "  [FAIL] Could not validate enrollment code" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Step 2: Show the issue
Write-Host "[2/2] Analysis..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Current Programme Name: '$programmeName'" -ForegroundColor Yellow
Write-Host ""
Write-Host "Is this the correct programme name?" -ForegroundColor Yellow
Write-Host ""
Write-Host "If NOT, you need to update the programme name in the database." -ForegroundColor Gray
Write-Host "This will affect ALL users enrolled in ANY cohort of this programme." -ForegroundColor Gray
Write-Host ""

# Provide SQL command
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " To Fix This Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to update the programme name directly in the database." -ForegroundColor Yellow
Write-Host ""
Write-Host "SQL Command:" -ForegroundColor Cyan
Write-Host ""
Write-Host "UPDATE programmes SET name = 'YOUR_CORRECT_PROGRAMME_NAME' WHERE id = $programmeId;" -ForegroundColor White
Write-Host ""
Write-Host "Replace 'YOUR_CORRECT_PROGRAMME_NAME' with the actual programme name." -ForegroundColor Gray
Write-Host ""
Write-Host "Database Access:" -ForegroundColor Cyan
Write-Host "  Host: 107.175.94.134" -ForegroundColor Gray
Write-Host "  Port: 3306" -ForegroundColor Gray
Write-Host "  Database: cohortle" -ForegroundColor Gray
Write-Host "  User: root" -ForegroundColor Gray
Write-Host ""
Write-Host "You can use phpMyAdmin or MySQL client to run this command." -ForegroundColor Gray
Write-Host ""

