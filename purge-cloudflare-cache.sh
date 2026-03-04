#!/bin/bash

# Cloudflare Cache Purge Script
# Automatically purges Cloudflare cache after deployment

# Configuration
ZONE_ID="931b969b7a90e93c0eb56351db72529a"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Purging Cloudflare cache...${NC}"

# Check if API token is set
if [ -z "$CF_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN environment variable not set${NC}"
    echo "Please set it with: export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

# Purge entire cache
response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')

# Check if successful
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Cloudflare cache purged successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Failed to purge Cloudflare cache${NC}"
    echo "Response: $response"
    exit 1
fi
