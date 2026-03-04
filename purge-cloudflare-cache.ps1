# Cloudflare Cache Purge Script (PowerShell)
# Automatically purges Cloudflare cache after deployment

# Configuration
$ZONE_ID = "931b969b7a90e93c0eb56351db72529a"
$CF_API_TOKEN = $env:CLOUDFLARE_API_TOKEN

Write-Host "🔄 Purging Cloudflare cache..." -ForegroundColor Yellow

# Check if API token is set
if ([string]::IsNullOrEmpty($CF_API_TOKEN)) {
    Write-Host "❌ Error: CLOUDFLARE_API_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:CLOUDFLARE_API_TOKEN='your_token_here'" -ForegroundColor Yellow
    exit 1
}

# Purge entire cache
$headers = @{
    "Authorization" = "Bearer $CF_API_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    purge_everything = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" `
        -Method Post `
        -Headers $headers `
        -Body $body

    if ($response.success) {
        Write-Host "✅ Cloudflare cache purged successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Failed to purge Cloudflare cache" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error purging Cloudflare cache: $_" -ForegroundColor Red
    exit 1
}
