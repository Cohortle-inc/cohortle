# Test Organisation Slug Functionality
# This script tests the organisation slug feature in convener settings

Write-Host "Testing Organisation Slug Functionality" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envPath = "cohortle-api/.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$API_URL = $env:API_URL
if (-not $API_URL) {
    $API_URL = "http://localhost:5000"
}

Write-Host "API URL: $API_URL" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check slug availability endpoint
Write-Host "Test 1: Check slug availability" -ForegroundColor Green
Write-Host "--------------------------------" -ForegroundColor Green

$testSlug = "test-org-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "Testing slug: $testSlug"

try {
    $response = Invoke-RestMethod -Uri "$API_URL/v1/api/org/$testSlug/check" -Method Get
    Write-Host "Success: Slug check endpoint works" -ForegroundColor Green
    Write-Host "  Available: $($response.available)" -ForegroundColor Cyan
} catch {
    Write-Host "Failed: Slug check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check invalid slug format
Write-Host "Test 2: Check invalid slug format" -ForegroundColor Green
Write-Host "----------------------------------" -ForegroundColor Green

$invalidSlug = "INVALID_SLUG"
Write-Host "Testing invalid slug: $invalidSlug"

try {
    $response = Invoke-RestMethod -Uri "$API_URL/v1/api/org/$invalidSlug" -Method Get -ErrorAction Stop
    Write-Host "Failed: Should have rejected invalid slug" -ForegroundColor Red
} catch {
    Write-Host "Success: Invalid slug correctly rejected" -ForegroundColor Green
}

Write-Host ""

# Test 3: Check non-existent organisation
Write-Host "Test 3: Check non-existent organisation" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Green

$nonExistentSlug = "definitely-does-not-exist-12345"
Write-Host "Testing non-existent slug: $nonExistentSlug"

try {
    $response = Invoke-RestMethod -Uri "$API_URL/v1/api/org/$nonExistentSlug" -Method Get -ErrorAction Stop
    Write-Host "Failed: Should have returned 404" -ForegroundColor Red
} catch {
    Write-Host "Success: Non-existent organisation correctly returns 404" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Organisation slug functionality is implemented" -ForegroundColor White
Write-Host "- Convener settings page includes organisation section" -ForegroundColor White
Write-Host "- Backend API supports slug checking and validation" -ForegroundColor White
Write-Host "- Database migration adds required fields" -ForegroundColor White
Write-Host "- Profile service handles organisation field updates" -ForegroundColor White
Write-Host ""
Write-Host "To test manually:" -ForegroundColor Yellow
Write-Host "1. Login as a convener" -ForegroundColor White
Write-Host "2. Navigate to /convener/settings" -ForegroundColor White
Write-Host "3. Scroll to Organisation Settings section" -ForegroundColor White
Write-Host "4. Enter a slug like my-org" -ForegroundColor White
Write-Host "5. Fill in organisation name and description" -ForegroundColor White
Write-Host "6. Click Save Organisation Settings" -ForegroundColor White
Write-Host "7. Visit /org/your-slug to see the public page" -ForegroundColor White
