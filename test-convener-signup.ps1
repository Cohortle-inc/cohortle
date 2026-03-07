# Test convener signup with invitation code
$apiUrl = "https://api.cohortle.com/v1/api/auth/register-email"

$body = @{
    email = "test-convener-$(Get-Random)@example.com"
    password = "TestPassword123"
    first_name = "Test"
    last_name = "Convener"
    role = "convener"
    invitation_code = "COHORTLE_CONVENER_2024"
} | ConvertTo-Json

Write-Host "Testing convener signup..." -ForegroundColor Cyan
Write-Host "URL: $apiUrl" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body:" -ForegroundColor Yellow
    Write-Host $responseBody
}

Write-Host ""
Write-Host "Also testing student signup (should work without code)..." -ForegroundColor Cyan

$studentBody = @{
    email = "test-student-$(Get-Random)@example.com"
    password = "TestPassword123"
    first_name = "Test"
    last_name = "Student"
    role = "student"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $studentBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Student signup SUCCESS!" -ForegroundColor Green
} catch {
    Write-Host "❌ Student signup FAILED!" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody
}
