#!/usr/bin/env pwsh

# Script to check learner role mismatches in production database via API

Write-Host "Checking learner role mismatches in production..." -ForegroundColor Green

$apiUrl = "https://api.cohortle.com"

# Get all users to check for role mismatches
Write-Host "`n1. Fetching users from production..." -ForegroundColor Yellow

try {
    # We'll need to use a test account to check
    # First, let's try to get a list of users with different roles
    
    Write-Host "`nChecking for potential role mismatches..." -ForegroundColor Cyan
    Write-Host "This requires database access. Checking via SQL query..." -ForegroundColor Cyan
    
    # Create SQL query to check for mismatches
    $sqlQuery = @"
-- Check for users with role mismatches
SELECT 
    u.id,
    u.email,
    u.name,
    u.role as old_role,
    r.name as new_role,
    u.email_verified,
    CASE 
        WHEN u.role IN ('student', 'learner') AND r.name != 'student' THEN 'MISMATCH'
        WHEN u.role IN ('student', 'learner') AND r.name IS NULL THEN 'NO_ROLE_ASSIGNED'
        ELSE 'OK'
    END as status
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r ON ura.role_id = r.id
WHERE u.role IN ('student', 'learner')
ORDER BY u.id;
"@

    Write-Host "`nSQL Query to run on production database:" -ForegroundColor Yellow
    Write-Host $sqlQuery -ForegroundColor Gray
    
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "MANUAL STEPS TO CHECK DATABASE:" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    Write-Host "`n1. Connect to production database using phpMyAdmin or MySQL client"
    Write-Host "2. Run the SQL query above"
    Write-Host "3. Look for rows with status = 'MISMATCH' or 'NO_ROLE_ASSIGNED'"
    Write-Host "`n4. If mismatches found, run this query to fix them:"
    
    $fixQuery = @"
-- Fix role mismatches for learners
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at)
SELECT 
    u.id,
    (SELECT id FROM roles WHERE name = 'student' LIMIT 1),
    1,
    NOW()
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
WHERE u.role IN ('student', 'learner')
AND ura.user_id IS NULL;
"@

    Write-Host "`n" -ForegroundColor Yellow
    Write-Host $fixQuery -ForegroundColor Gray
    
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "ALTERNATIVE: Check specific user via API" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    
    # Try to check a specific learner account
    Write-Host "`nAttempting to check a learner account via API..." -ForegroundColor Yellow
    
    # You'll need to provide a learner email and password
    $learnerEmail = Read-Host "Enter learner email to test (or press Enter to skip)"
    
    if ($learnerEmail) {
        $learnerPassword = Read-Host "Enter password" -AsSecureString
        $learnerPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($learnerPassword)
        )
        
        $loginData = @{
            email = $learnerEmail
            password = $learnerPasswordPlain
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($loginResponse.error -eq $false) {
            Write-Host "✓ Login successful" -ForegroundColor Green
            Write-Host "User role from login: $($loginResponse.user.role)" -ForegroundColor Cyan
            
            # Check profile
            $headers = @{
                "Authorization" = "Bearer $($loginResponse.token)"
            }
            
            $profileResponse = Invoke-RestMethod -Uri "$apiUrl/v1/api/profile" -Method GET -Headers $headers
            
            if ($profileResponse.error -eq $false) {
                Write-Host "✓ Profile fetch successful" -ForegroundColor Green
                Write-Host "User role from profile: $($profileResponse.user.role)" -ForegroundColor Cyan
                Write-Host "Email verified: $($profileResponse.user.email_verified)" -ForegroundColor Cyan
                
                if ($profileResponse.user.role -eq 'student' -or $profileResponse.user.role -eq 'learner') {
                    Write-Host "`n✓ This learner account appears to be correctly configured" -ForegroundColor Green
                } else {
                    Write-Host "`n⚠️  Role mismatch detected!" -ForegroundColor Red
                    Write-Host "Expected: student or learner" -ForegroundColor Red
                    Write-Host "Got: $($profileResponse.user.role)" -ForegroundColor Red
                }
            } else {
                Write-Host "✗ Profile fetch failed: $($profileResponse.message)" -ForegroundColor Red
            }
        } else {
            Write-Host "✗ Login failed: $($loginResponse.message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "`nTo fully diagnose role mismatches, you need database access."
Write-Host "Use the SQL queries provided above in phpMyAdmin or MySQL client."