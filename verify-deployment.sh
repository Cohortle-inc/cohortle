#!/bin/bash

# Comprehensive Deployment Verification Script
# Checks if code changes are actually deployed to production

EXPECTED_MARKER="${1:-2025-01-BUILD}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Deployment Verification${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

ALL_CHECKS_PASS=true

# =====================
# Backend Verification
# =====================
echo -e "${YELLOW}1. Checking Backend Deployment...${NC}"
echo ""

BACKEND_RESPONSE=$(curl -s https://api.cohortle.com/v1/api/deployment/verify)

if [ $? -eq 0 ]; then
    DEPLOYED=$(echo "$BACKEND_RESPONSE" | jq -r '.deployed')
    BUILD_TIMESTAMP=$(echo "$BACKEND_RESPONSE" | jq -r '.buildTimestamp')
    VERSION=$(echo "$BACKEND_RESPONSE" | jq -r '.version')
    ENVIRONMENT=$(echo "$BACKEND_RESPONSE" | jq -r '.environment')
    
    echo "  Backend Status:"
    if [ "$DEPLOYED" = "true" ]; then
        echo -e "    Deployed: ${GREEN}$DEPLOYED${NC}"
    else
        echo -e "    Deployed: ${RED}$DEPLOYED${NC}"
    fi
    echo -e "    Build Timestamp: ${GRAY}$BUILD_TIMESTAMP${NC}"
    echo -e "    Version: ${GRAY}$VERSION${NC}"
    echo -e "    Environment: ${GRAY}$ENVIRONMENT${NC}"
    echo ""
    
    MARKER_COUNT=$(echo "$BACKEND_RESPONSE" | jq '.codeMarkers | length')
    
    if [ "$MARKER_COUNT" -gt 0 ]; then
        echo "  Code Markers Found:"
        for i in $(seq 0 $((MARKER_COUNT - 1))); do
            FILE=$(echo "$BACKEND_RESPONSE" | jq -r ".codeMarkers[$i].file")
            MARKER=$(echo "$BACKEND_RESPONSE" | jq -r ".codeMarkers[$i].marker")
            
            if [ "$MARKER" = "$EXPECTED_MARKER" ]; then
                echo -e "    ${GREEN}$FILE: $MARKER${NC}"
            else
                echo -e "    ${YELLOW}$FILE: $MARKER${NC}"
                echo -e "      ${YELLOW}⚠ Expected: $EXPECTED_MARKER${NC}"
                ALL_CHECKS_PASS=false
            fi
        done
    else
        echo -e "  ${YELLOW}⚠ No code markers found in backend${NC}"
        ALL_CHECKS_PASS=false
    fi
    
    echo ""
    echo -e "  ${GREEN}✓ Backend deployment endpoint is accessible${NC}"
else
    echo -e "  ${RED}✗ Failed to verify backend deployment${NC}"
    ALL_CHECKS_PASS=false
fi

echo ""

# =====================
# Frontend Verification
# =====================
echo -e "${YELLOW}2. Checking Frontend Deployment...${NC}"
echo ""

FRONTEND_RESPONSE=$(curl -s https://cohortle.com/api/deployment)

if [ $? -eq 0 ]; then
    DEPLOYED=$(echo "$FRONTEND_RESPONSE" | jq -r '.deployed')
    BUILD_TIMESTAMP=$(echo "$FRONTEND_RESPONSE" | jq -r '.buildTimestamp')
    VERSION=$(echo "$FRONTEND_RESPONSE" | jq -r '.version')
    ENVIRONMENT=$(echo "$FRONTEND_RESPONSE" | jq -r '.environment')
    API_URL=$(echo "$FRONTEND_RESPONSE" | jq -r '.apiUrl')
    
    echo "  Frontend Status:"
    if [ "$DEPLOYED" = "true" ]; then
        echo -e "    Deployed: ${GREEN}$DEPLOYED${NC}"
    else
        echo -e "    Deployed: ${RED}$DEPLOYED${NC}"
    fi
    echo -e "    Build Timestamp: ${GRAY}$BUILD_TIMESTAMP${NC}"
    echo -e "    Version: ${GRAY}$VERSION${NC}"
    echo -e "    Environment: ${GRAY}$ENVIRONMENT${NC}"
    echo -e "    API URL: ${GRAY}$API_URL${NC}"
    echo ""
    
    MARKER_COUNT=$(echo "$FRONTEND_RESPONSE" | jq '.codeMarkers | length')
    
    if [ "$MARKER_COUNT" -gt 0 ]; then
        echo "  Code Markers Found:"
        for i in $(seq 0 $((MARKER_COUNT - 1))); do
            FILE=$(echo "$FRONTEND_RESPONSE" | jq -r ".codeMarkers[$i].file")
            MARKER=$(echo "$FRONTEND_RESPONSE" | jq -r ".codeMarkers[$i].marker")
            
            if [ "$MARKER" = "$EXPECTED_MARKER" ]; then
                echo -e "    ${GREEN}$FILE: $MARKER${NC}"
            else
                echo -e "    ${YELLOW}$FILE: $MARKER${NC}"
                echo -e "      ${YELLOW}⚠ Expected: $EXPECTED_MARKER${NC}"
                ALL_CHECKS_PASS=false
            fi
        done
    else
        echo -e "  ${YELLOW}⚠ No code markers found in frontend${NC}"
        ALL_CHECKS_PASS=false
    fi
    
    echo ""
    echo -e "  ${GREEN}✓ Frontend deployment endpoint is accessible${NC}"
else
    echo -e "  ${RED}✗ Failed to verify frontend deployment${NC}"
    ALL_CHECKS_PASS=false
fi

echo ""

# =====================
# Cache Status Check
# =====================
echo -e "${YELLOW}3. Checking Cache Status...${NC}"
echo ""

echo -e "  ${GRAY}Note: Cache purging is automated via GitHub Actions${NC}"
echo -e "  ${GRAY}Workflow: .github/workflows/purge-cache-on-deploy.yml${NC}"
echo ""

if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "  ${GREEN}✓ CLOUDFLARE_API_TOKEN is set${NC}"
else
    echo -e "  ${YELLOW}⚠ CLOUDFLARE_API_TOKEN not set in environment${NC}"
    echo -e "    ${YELLOW}Cache purging may not work automatically${NC}"
fi

echo ""

# =====================
# Summary
# =====================
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Summary${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

if [ "$ALL_CHECKS_PASS" = true ]; then
    echo -e "${GREEN}✓ All deployment checks passed!${NC}"
    echo ""
    echo "Your code is deployed and accessible in production."
    echo "Expected marker '$EXPECTED_MARKER' found in all key files."
    exit 0
else
    echo -e "${YELLOW}⚠ Some deployment checks failed${NC}"
    echo ""
    echo -e "${YELLOW}Possible issues:${NC}"
    echo "  1. Code not yet deployed (wait a few minutes)"
    echo "  2. Cloudflare cache not purged (run: ./purge-cloudflare-cache.sh)"
    echo "  3. Deployment markers don't match expected version"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Check Coolify deployment logs"
    echo "  2. Verify GitHub Actions workflow ran successfully"
    echo "  3. Manually purge Cloudflare cache if needed"
    exit 1
fi
