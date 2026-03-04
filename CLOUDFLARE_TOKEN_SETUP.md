# Cloudflare API Token Setup Guide

## Issue Found

Your current token (`Ah3akec6ZsNr8lN4-WozIp_5WMWt3-qhy_BLOB0R`) returned a **403 Forbidden** error, which means it doesn't have the correct permissions for cache purging.

## How to Create the Correct Token

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com/
2. Log in to your account
3. Click on your **profile icon** (top right)
4. Select **"API Tokens"**

### Step 2: Create New Token

1. Click **"Create Token"** button
2. You have two options:

#### Option A: Use Template (Easier)
1. Find the **"Edit zone DNS"** template
2. Click **"Use template"**
3. Modify the permissions (see Step 3)

#### Option B: Create Custom Token
1. Click **"Create Custom Token"**
2. Give it a name: `Cohortle Cache Purge`

### Step 3: Set Permissions

**Required Permission:**
- **Zone** → **Cache Purge** → **Purge**

**Optional but Recommended:**
- **Zone** → **Zone** → **Read** (to verify zone access)

### Step 4: Set Zone Resources

1. Under **Zone Resources**:
   - Select **"Include"**
   - Choose **"Specific zone"**
   - Select **"cohortle.com"** from the dropdown

### Step 5: Additional Settings (Optional)

**Client IP Address Filtering:**
- Leave blank (or add your server IPs if you want extra security)

**TTL:**
- Leave as default or set expiration date

### Step 6: Create and Copy Token

1. Click **"Continue to summary"**
2. Review the permissions
3. Click **"Create Token"**
4. **IMPORTANT**: Copy the token immediately (you won't see it again!)

### Step 7: Test the Token

Run this PowerShell command to test:

\`\`\`powershell
$ZONE_ID = "931b969b7a90e93c0eb56351db72529a"
$CF_API_TOKEN = "YOUR_NEW_TOKEN_HERE"
$headers = @{"Authorization" = "Bearer $CF_API_TOKEN"; "Content-Type" = "application/json"}
$body = '{"purge_everything":true}'
Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" -Method Post -Headers $headers -Body $body
\`\`\`

**Expected Success Response:**
\`\`\`json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "..."
  }
}
\`\`\`

## What Went Wrong with Current Token

The token you provided (`Ah3akec6ZsNr8lN4-WozIp_5WMWt3-qhy_BLOB0R`) likely has one of these issues:

1. ❌ **Missing Cache Purge permission**
2. ❌ **Wrong zone selected**
3. ❌ **Read-only permissions**
4. ❌ **Expired or revoked**

## After Creating the Correct Token

### For GitHub Actions (Automated):

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: [paste your new token]
6. Click **"Add secret"**

### For Manual Use:

**PowerShell:**
\`\`\`powershell
$env:CLOUDFLARE_API_TOKEN = "YOUR_NEW_TOKEN_HERE"
.\purge-cloudflare-cache.ps1
\`\`\`

**Bash:**
\`\`\`bash
export CLOUDFLARE_API_TOKEN="YOUR_NEW_TOKEN_HERE"
./purge-cloudflare-cache.sh
\`\`\`

## Security Best Practices

✅ **DO:**
- Create tokens with minimal required permissions
- Use specific zone selection (not "All zones")
- Set expiration dates for tokens
- Store tokens in GitHub Secrets (never in code)
- Rotate tokens periodically

❌ **DON'T:**
- Use Global API Key (too powerful)
- Commit tokens to git
- Share tokens publicly
- Give tokens more permissions than needed

## Troubleshooting

### 403 Forbidden Error
**Cause**: Token doesn't have Cache Purge permission  
**Fix**: Create new token with correct permissions (see above)

### 401 Unauthorized Error
**Cause**: Invalid or expired token  
**Fix**: Verify token is correct, create new one if needed

### 404 Not Found Error
**Cause**: Wrong Zone ID  
**Fix**: Verify Zone ID is `931b969b7a90e93c0eb56351db72529a`

## Quick Reference

**Your Zone ID:** `931b969b7a90e93c0eb56351db72529a`  
**Your Domain:** `cohortle.com`  
**Required Permission:** Zone → Cache Purge → Purge  
**API Endpoint:** `https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache`

Once you have the correct token, the automation will work perfectly!