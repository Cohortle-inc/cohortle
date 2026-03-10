Write-Host "=== Testing Authentication Issue ===" -ForegroundColor Cyan

# Test backend health
Write-Host "1. Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
    Write-Host "Backend is running" -ForegroundColor Green
} catch {
    Write-Host "Backend not running" -ForegroundColor Red
    exit 1
}

# Test login
Write-Host "2. Testing login..." -ForegroundColor Yellow
$loginData = @{
    email = "wecarefng@gmail.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($loginResponse.user.role)" -ForegroundColor Gray
    $token = $loginResponse.token
} catch {
    Write-Host "Login failed" -ForegroundColor Red
    exit 1
}

# Test profile
Write-Host "3. Testing profile..." -ForegroundColor Yellow
$headers = @{ "Authorization" = "Bearer $token" }

try {
    $profile = Invoke-RestMethod -Uri "http://localhost:3001/api/profile" -Method GET -Headers $headers
    Write-Host "Profile successful" -ForegroundColor Green
    Write-Host ($profile | ConvertTo-Json -Depth 2) -ForegroundColor Gray
} catch {
    Write-Host "Profile failed" -ForegroundColor Red
}

Write-Host "Test Complete" -ForegroundColor Cyan