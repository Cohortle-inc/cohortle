# Test Cloudflare API Token and Purge Cache
$ZONE_ID = "931b969b7a90e93c0eb56351db72529a"
$CF_API_TOKEN = "Ah3akec6ZsNr8lN4-WozIp_5WMWt3-qhy_BLOB0R"

Write-Host "🔍 Testing Cloudflare API token..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Verify token
Write-Host "Test 1: Verifying token..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $CF_API_TOKEN"
    "Content-Type" = "application/json"
}

try {
    $verifyResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Method Get -Headers $headers

    if ($verifyResponse.success) {
        Write-Host "✅ Token is valid!" -ForegroundColor Green
        Write-Host "   Token ID: $($verifyResponse.result.id)" -ForegroundColor Gray
        Write-Host "   Status: $($verifyResponse.result.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Token verification failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error verifying token: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Purge cache
Write-Host "Test 2: Purging Cloudflare cache..." -ForegroundColor Cyan

$body = @{ purge_everything = $true } | ConvertTo-Json

try {
    $purgeResponse = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" -Method Post -Headers $headers -Body $body

    if ($purgeResponse.success) {
        Write-Host "✅ Cache purged successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 All tests passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Add this token to GitHub Secrets as CLOUDFLARE_API_TOKEN"
        Write-Host "2. Push your changes to trigger automatic cache purging"
        Write-Host "3. Check https://cohortle.com to verify changes are live"
    } else {
        Write-Host "❌ Cache purge failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error purging cache: $_" -ForegroundColor Red
    exit 1
}
