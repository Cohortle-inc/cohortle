#!/bin/bash

# WLIMP Deployment Test Script
# This script tests if the deployment is working correctly

echo "========================================="
echo "WLIMP Deployment Test"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-https://api.cohortle.com}"
WEB_URL="${WEB_URL:-https://cohortle.com}"

echo "Testing with:"
echo "  API URL: $API_URL"
echo "  Web URL: $WEB_URL"
echo ""

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
echo "------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Backend is not accessible (HTTP $HTTP_CODE)${NC}"
    echo "  Fix: Deploy backend in Coolify"
    exit 1
fi
echo ""

# Test 2: Frontend Health Check
echo "Test 2: Frontend Health Check"
echo "------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible (HTTP $HTTP_CODE)${NC}"
    echo "  Fix: Deploy frontend in Coolify"
    exit 1
fi
echo ""

# Test 3: Enrolled Programmes Endpoint (requires auth token)
echo "Test 3: Enrolled Programmes Endpoint"
echo "-------------------------------------"
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Skipped (AUTH_TOKEN not set)${NC}"
    echo "  To test: export AUTH_TOKEN=your-token-here"
else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/v1/api/programmes/enrolled" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Endpoint is working (HTTP $HTTP_CODE)${NC}"
        echo "  Response: $BODY"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${YELLOW}⚠ Authentication failed (HTTP $HTTP_CODE)${NC}"
        echo "  Fix: Use a valid auth token"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${RED}✗ Endpoint not found (HTTP $HTTP_CODE)${NC}"
        echo "  Fix: Deploy backend with latest code"
    else
        echo -e "${RED}✗ Endpoint error (HTTP $HTTP_CODE)${NC}"
        echo "  Response: $BODY"
    fi
fi
echo ""

# Test 4: Check if migrations endpoint exists (indirect test)
echo "Test 4: Check WLIMP Endpoints"
echo "------------------------------"
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Skipped (AUTH_TOKEN not set)${NC}"
else
    # Test enrollment endpoint with invalid code (should return 404, not 500)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/v1/api/programmes/enroll" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"code":"TEST-9999"}')
    
    if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "400" ]; then
        echo -e "${GREEN}✓ WLIMP endpoints are deployed${NC}"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${YELLOW}⚠ Authentication required${NC}"
    else
        echo -e "${RED}✗ WLIMP endpoints may not be deployed (HTTP $HTTP_CODE)${NC}"
        echo "  Fix: Deploy backend with latest code"
    fi
fi
echo ""

# Summary
echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If backend test failed: Deploy backend in Coolify"
echo "2. If frontend test failed: Deploy frontend in Coolify"
echo "3. If endpoint tests were skipped: Set AUTH_TOKEN and re-run"
echo "4. If all tests passed: Check browser console for errors"
echo ""
echo "For detailed troubleshooting, see:"
echo "  - DEPLOYMENT_TROUBLESHOOTING.md"
echo "  - WLIMP_DEPLOYMENT_GUIDE.md"
echo ""
