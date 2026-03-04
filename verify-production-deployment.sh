#!/bin/bash

# Verify Production Deployment Status
# This script checks if the WLIMP endpoints exist in production

echo "========================================="
echo "Production Deployment Verification"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is accessible
echo "1. Checking backend health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.cohortle.com/health)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Backend is accessible${NC}"
else
    echo -e "${RED}✗ Backend is not accessible (HTTP $HEALTH_STATUS)${NC}"
    echo "  Cannot proceed with endpoint checks"
    exit 1
fi

echo ""

# Check if WLIMP endpoint exists (without auth - will get 401 but that's OK)
echo "2. Checking if WLIMP endpoints exist..."
ENROLLED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.cohortle.com/v1/api/programmes/enrolled)

if [ "$ENROLLED_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ /v1/api/programmes/enrolled endpoint EXISTS${NC}"
    echo "  (Got 401 Unauthorized - endpoint exists but needs auth)"
    ENDPOINT_EXISTS=true
elif [ "$ENROLLED_STATUS" = "404" ]; then
    echo -e "${RED}✗ /v1/api/programmes/enrolled endpoint DOES NOT EXIST${NC}"
    echo "  (Got 404 Not Found - backend needs deployment)"
    ENDPOINT_EXISTS=false
else
    echo -e "${YELLOW}? Unexpected status: HTTP $ENROLLED_STATUS${NC}"
    ENDPOINT_EXISTS=false
fi

echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="

if [ "$ENDPOINT_EXISTS" = true ]; then
    echo -e "${GREEN}✓ Backend is deployed with WLIMP code${NC}"
    echo ""
    echo "The error you're seeing is likely:"
    echo "  1. Authentication issue (check browser cookies)"
    echo "  2. Database migrations not run (check backend logs)"
    echo "  3. Frontend not deployed (old code calling new endpoints)"
    echo ""
    echo "Next steps:"
    echo "  1. Check backend logs in Coolify for migration messages"
    echo "  2. Deploy frontend if not already deployed"
    echo "  3. Check browser console for specific error messages"
else
    echo -e "${RED}✗ Backend needs deployment${NC}"
    echo ""
    echo "The WLIMP endpoints don't exist in production yet."
    echo ""
    echo "Next steps:"
    echo "  1. Open Coolify dashboard"
    echo "  2. Find 'cohortle-api' application"
    echo "  3. Click 'Deploy' button"
    echo "  4. Wait 2-3 minutes for deployment"
    echo "  5. Check logs for migration messages"
    echo "  6. Then deploy 'cohortle-web' frontend"
fi

echo ""
