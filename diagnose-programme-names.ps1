# Diagnose Programme Names
# This script checks the programme names in the database

Write-Host "=== Programme Names Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "cohortle-api")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Checking programme names in database..." -ForegroundColor Yellow
Write-Host ""

# Query the database
$query = "SELECT p.id, p.name, p.description, COUNT(DISTINCT c.id) as cohort_count, COUNT(DISTINCT e.id) as enrollment_count FROM programmes p LEFT JOIN cohorts c ON c.programme_id = p.id LEFT JOIN enrollments e ON e.cohort_id = c.id GROUP BY p.id, p.name, p.description ORDER BY p.id;"

Write-Host "Querying programmes table..." -ForegroundColor Cyan
Write-Host ""

# Execute query using mysql command
$env:MYSQL_PWD = "root"
$result = mysql -h 127.0.0.1 -P 3306 -u root cohortle_db -e $query 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Programme Names:" -ForegroundColor Green
    Write-Host $result
    Write-Host ""
    Write-Host "Success: Query executed successfully" -ForegroundColor Green
} else {
    Write-Host "Error executing query:" -ForegroundColor Red
    Write-Host $result
    exit 1
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
