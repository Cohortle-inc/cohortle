# Test Dashboard Endpoints
# Tests the dashboard API endpoints using PowerShell

$API_BASE_URL = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://localhost:3001" }
$TEST_USER_EMAIL = "test@example.com"
$TEST_USER_PASSWORD = "password123"

Write-Host "🧪 Testing Dashboard Endpoints..." -ForegroundColor Cyan
Write-Host ""

try {
    # Step 1: Login to get auth token
    Write-Host "1. Logging in..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = $TEST_USER_EMAIL
        password = $TEST_USER_PASSWORD
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE_URL/v1/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.error) {
        throw "Login failed: $($loginResponse.message)"
    }
    
    $token = $loginResponse.token
    Write-Host "✅ Login successful" -ForegroundColor Green
    
    # Set up auth headers
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Step 2: Test upcoming sessions endpoint
    Write-Host ""
    Write-Host "2. Testing upcoming sessions..." -ForegroundColor Yellow
    
    try {
        $sessionsResponse = Invoke-RestMethod -Uri "$API_BASE_URL/v1/api/dashboard/upcoming-sessions" -Method Get -Headers $headers
        
        Write-Host "✅ Upcoming sessions endpoint working" -ForegroundColor Green
        Write-Host "   Sessions found: $($sessionsResponse.sessions.Count)" -ForegroundColor Gray
        
        if ($sessionsResponse.sessions.Count -gt 0) {
            $sample = $sessionsResponse.sessions[0]
            Write-Host "   Sample session: $($sample.title) - $($sample.programmeName)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Upcoming sessions endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Step 3: Test recent activity endpoint
    Write-Host ""
    Write-Host "3. Testing recent activity..." -ForegroundColor Yellow
    
    try {
        $activityResponse = Invoke-RestMethod -Uri "$API_BASE_URL/v1/api/dashboard/recent-activity?limit=5" -Method Get -Headers $headers
        
        Write-Host "✅ Recent activity endpoint working" -ForegroundColor Green
        Write-Host "   Activities found: $($activityResponse.activities.Count)" -ForegroundColor Gray
        
        if ($activityResponse.activities.Count -gt 0) {
            $sample = $activityResponse.activities[0]
            Write-Host "   Sample activity: $($sample.title) - $($sample.programmeName)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Recent activity endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Step 4: Test next lesson endpoint
    Write-Host ""
    Write-Host "4. Testing next lesson..." -ForegroundColor Yellow
    
    try {
        $nextLessonResponse = Invoke-RestMethod -Uri "$API_BASE_URL/v1/api/dashboard/next-lesson" -Method Get -Headers $headers
        
        Write-Host "✅ Next lesson endpoint working" -ForegroundColor Green
        
        if ($nextLessonResponse.lesson) {
            Write-Host "   Next lesson: $($nextLessonResponse.lesson.title)" -ForegroundColor Gray
        } else {
            Write-Host "   No incomplete lessons found" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Next lesson endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Step 5: Test enrolled programmes endpoint
    Write-Host ""
    Write-Host "5. Testing enrolled programmes..." -ForegroundColor Yellow
    
    try {
        $programmesResponse = Invoke-RestMethod -Uri "$API_BASE_URL/v1/api/programmes/enrolled" -Method Get -Headers $headers
        
        Write-Host "✅ Enrolled programmes endpoint working" -ForegroundColor Green
        Write-Host "   Programmes found: $($programmesResponse.programmes.Count)" -ForegroundColor Gray
        
        if ($programmesResponse.programmes.Count -gt 0) {
            $sample = $programmesResponse.programmes[0]
            Write-Host "   Sample programme: $($sample.name)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Enrolled programmes endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "🎉 Dashboard endpoint testing completed!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}