# Test script to verify the convener dashboard summary is working correctly
# This script tests the /programmes/my endpoint to ensure it returns enrolled counts

param(
    [string]$ApiUrl = "https://api.cohortle.com",
    [string]$Token = $env:CONVENER_TOKEN
)

Write-Host "Testing convener dashboard summary..." -ForegroundColor Cyan

if (-not $Token) {
    Write-Host "❌ Please provide a convener token:" -ForegroundColor Red
    Write-Host "   Option 1: Set environment variable: `$env:CONVENER_TOKEN = 'your-token'" -ForegroundColor Yellow
    Write-Host "   Option 2: Run: .\test-dashboard-summary.ps1 -Token 'your-token'" -ForegroundColor Yellow
    Write-Host "   You can get a token by running: .\get-convener-token.ps1" -ForegroundColor Yellow
    exit 1
}

try {
    $headers = @{
        'Authorization' = "Bearer $Token"
        'Content-Type' = 'application/json'
    }
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/my" -Method GET -Headers $headers
    
    if ($response.error) {
        throw $response.message
    }
    
    Write-Host "✅ API Response received successfully" -ForegroundColor Green
    Write-Host "📊 Found $($response.programmes.Count) programmes" -ForegroundColor Blue
    
    $totalLearners = 0
    $activeProgrammes = 0
    $recruitingProgrammes = 0
    
    for ($i = 0; $i -lt $response.programmes.Count; $i++) {
        $programme = $response.programmes[$i]
        $enrolledCount = if ($programme.enrolledCount) { $programme.enrolledCount } elseif ($programme.enrolled_count) { $programme.enrolled_count } else { 0 }
        $cohortCount = if ($programme.cohortCount) { $programme.cohortCount } elseif ($programme.cohort_count) { $programme.cohort_count } else { 0 }
        $status = if ($programme.lifecycle_status) { $programme.lifecycle_status } elseif ($programme.status) { $programme.status } else { 'draft' }
        
        if ($status -in @('active', 'recruiting', 'published')) {
            $activeProgrammes++
        }
        
        if ($status -eq 'recruiting') {
            $recruitingProgrammes++
        }
        
        $totalLearners += $enrolledCount
        
        Write-Host "  $($i + 1). $($programme.name)" -ForegroundColor White
        Write-Host "     Status: $status" -ForegroundColor Gray
        Write-Host "     Enrolled: $enrolledCount learners" -ForegroundColor Gray
        Write-Host "     Cohorts: $cohortCount" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "📈 Dashboard Summary:" -ForegroundColor Magenta
    Write-Host "   Total Programmes: $($response.programmes.Count)" -ForegroundColor White
    Write-Host "   Active Programmes: $activeProgrammes" -ForegroundColor White
    Write-Host "   Total Learners: $totalLearners" -ForegroundColor White
    Write-Host "   Recruiting: $recruitingProgrammes" -ForegroundColor White
    
    if ($totalLearners -eq 0) {
        Write-Host "⚠️  Total learners is 0 - this might indicate:" -ForegroundColor Yellow
        Write-Host "   1. No learners are enrolled in any programmes" -ForegroundColor Yellow
        Write-Host "   2. Backend is not returning enrolled_count correctly" -ForegroundColor Yellow
        Write-Host "   3. Database query issue in /programmes/my endpoint" -ForegroundColor Yellow
        
        # Let's check if there are any cohorts with enrollments
        Write-Host ""
        Write-Host "🔍 Checking individual programmes for cohorts..." -ForegroundColor Cyan
        
        foreach ($programme in $response.programmes) {
            try {
                $cohortsResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/$($programme.id)/cohorts" -Method GET -Headers $headers
                if ($cohortsResponse.cohorts -and $cohortsResponse.cohorts.Count -gt 0) {
                    Write-Host "   Programme '$($programme.name)' has $($cohortsResponse.cohorts.Count) cohorts" -ForegroundColor Blue
                    foreach ($cohort in $cohortsResponse.cohorts) {
                        $cohortEnrolled = if ($cohort.enrolledCount) { $cohort.enrolledCount } elseif ($cohort.enrolled_count) { $cohort.enrolled_count } else { 0 }
                        Write-Host "     - $($cohort.name): $cohortEnrolled enrolled" -ForegroundColor Gray
                    }
                }
            } catch {
                Write-Host "   Could not fetch cohorts for '$($programme.name)': $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✅ Total learners count is working correctly!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error testing dashboard summary: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}