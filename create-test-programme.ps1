# Create Test Programme Script
# This script creates a complete WLIMP programme with weeks and lessons

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://api.cohortle.com"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "WLIMP Programme Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Headers for all requests
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Step 1: Create Programme
Write-Host "1. Creating programme..." -ForegroundColor Yellow
$programmeBody = @{
    name = "WLIMP – Workforce Leadership & Impact Mentorship Programme"
    description = "A 12-week structured programme for emerging leaders"
    start_date = "2026-03-01"
} | ConvertTo-Json

try {
    $programmeResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes" -Method POST -Headers $headers -Body $programmeBody
    $programmeId = $programmeResponse.programme.id
    Write-Host "✓ Programme created (ID: $programmeId)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create programme" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create Cohort
Write-Host "2. Creating cohort with enrollment code..." -ForegroundColor Yellow
$cohortBody = @{
    name = "WLIMP 2026 Cohort 1"
    enrollment_code = "WLIMP-2026"
    start_date = "2026-03-01"
} | ConvertTo-Json

try {
    $cohortResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/$programmeId/cohorts" -Method POST -Headers $headers -Body $cohortBody
    $cohortId = $cohortResponse.cohort.id
    $enrollmentCode = $cohortResponse.cohort.enrollment_code
    Write-Host "✓ Cohort created (Code: $enrollmentCode)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to create cohort" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Create Weeks
Write-Host "3. Creating weeks..." -ForegroundColor Yellow

$weeks = @(
    @{ number = 1; title = "Introduction to Leadership"; date = "2026-03-01" },
    @{ number = 2; title = "Communication Skills"; date = "2026-03-08" },
    @{ number = 3; title = "Team Building"; date = "2026-03-15" }
)

$weekIds = @()

foreach ($week in $weeks) {
    $weekBody = @{
        week_number = $week.number
        title = $week.title
        start_date = $week.date
    } | ConvertTo-Json
    
    try {
        $weekResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/api/programmes/$programmeId/weeks" -Method POST -Headers $headers -Body $weekBody
        $weekIds += $weekResponse.week.id
        Write-Host "  ✓ Week $($week.number): $($week.title)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to create Week $($week.number)" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Step 4: Create Lessons
Write-Host "4. Creating lessons..." -ForegroundColor Yellow

$lessons = @(
    @{
        week_index = 0
        title = "What is Leadership?"
        description = "An introduction to leadership principles"
        content_type = "video"
        content_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        order_index = 0
    },
    @{
        week_index = 0
        title = "Leadership Styles"
        description = "Understanding different leadership approaches"
        content_type = "link"
        content_url = "https://example.com/leadership-styles"
        order_index = 1
    },
    @{
        week_index = 1
        title = "Effective Communication"
        description = "Learn how to communicate effectively"
        content_type = "video"
        content_url = "https://www.youtube.com/watch?v=example"
        order_index = 0
    },
    @{
        week_index = 2
        title = "Building High-Performance Teams"
        description = "Strategies for team building"
        content_type = "video"
        content_url = "https://www.youtube.com/watch?v=example2"
        order_index = 0
    }
)

foreach ($lesson in $lessons) {
    $weekId = $weekIds[$lesson.week_index]
    $lessonBody = @{
        title = $lesson.title
        description = $lesson.description
        content_type = $lesson.content_type
        content_url = $lesson.content_url
        order_index = $lesson.order_index
    } | ConvertTo-Json
    
    try {
        $lessonResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/api/weeks/$weekId/lessons" -Method POST -Headers $headers -Body $lessonBody
        Write-Host "  ✓ $($lesson.title)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to create lesson: $($lesson.title)" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Programme Details:" -ForegroundColor Yellow
Write-Host "  Programme ID: $programmeId" -ForegroundColor White
Write-Host "  Cohort ID: $cohortId" -ForegroundColor White
Write-Host "  Enrollment Code: $enrollmentCode" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Share the enrollment code with learners: $enrollmentCode" -ForegroundColor White
Write-Host "  2. Learners can join at: https://cohortle.com/join" -ForegroundColor White
Write-Host "  3. After joining, they'll see the programme on their dashboard" -ForegroundColor White
Write-Host ""
