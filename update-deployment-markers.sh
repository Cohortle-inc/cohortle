#!/bin/bash

# Update Deployment Markers Script
# Updates deployment markers in code files before deployment

MARKER="${1:-}"

# Generate marker if not provided
if [ -z "$MARKER" ]; then
    MARKER="BUILD-$(date +%Y-%m-%d-%H%M%S)"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Update Deployment Markers${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${YELLOW}New Marker: $MARKER${NC}"
echo ""

FILES_UPDATED=0

# =====================
# Backend Files
# =====================
echo -e "${YELLOW}Updating Backend Files...${NC}"

# Update app.js
APP_JS_PATH="cohortle-api/app.js"
if [ -f "$APP_JS_PATH" ]; then
    sed -i "s|// DEPLOYMENT_MARKER: .*|// DEPLOYMENT_MARKER: $MARKER|g" "$APP_JS_PATH"
    echo -e "  ${GREEN}✓ Updated $APP_JS_PATH${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

# Update programme.js
PROGRAMME_JS_PATH="cohortle-api/routes/programme.js"
if [ -f "$PROGRAMME_JS_PATH" ]; then
    sed -i "s|// DEPLOYMENT_MARKER: .*|// DEPLOYMENT_MARKER: $MARKER|g" "$PROGRAMME_JS_PATH"
    echo -e "  ${GREEN}✓ Updated $PROGRAMME_JS_PATH${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

# Update deployment-info.json
BACKEND_DEPLOYMENT_INFO="cohortle-api/deployment-info.json"
if [ -f "$BACKEND_DEPLOYMENT_INFO" ]; then
    cat > "$BACKEND_DEPLOYMENT_INFO" <<EOF
{
  "deployed": true,
  "buildTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "version": "1.0.0",
  "environment": "production",
  "marker": "$MARKER",
  "description": "Programme Creation Workflow Fixes - Deployment Verification"
}
EOF
    echo -e "  ${GREEN}✓ Updated $BACKEND_DEPLOYMENT_INFO${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

echo ""

# =====================
# Frontend Files
# =====================
echo -e "${YELLOW}Updating Frontend Files...${NC}"

# Update layout.tsx
LAYOUT_PATH="cohortle-web/src/app/layout.tsx"
if [ -f "$LAYOUT_PATH" ]; then
    sed -i "s|// DEPLOYMENT_MARKER: .*|// DEPLOYMENT_MARKER: $MARKER|g" "$LAYOUT_PATH"
    echo -e "  ${GREEN}✓ Updated $LAYOUT_PATH${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

# Update dashboard page
DASHBOARD_PATH="cohortle-web/src/app/dashboard/page.tsx"
if [ -f "$DASHBOARD_PATH" ]; then
    sed -i "s|// DEPLOYMENT_MARKER: .*|// DEPLOYMENT_MARKER: $MARKER|g" "$DASHBOARD_PATH"
    echo -e "  ${GREEN}✓ Updated $DASHBOARD_PATH${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

# Update deployment-info.json
FRONTEND_DEPLOYMENT_INFO="cohortle-web/deployment-info.json"
if [ -f "$FRONTEND_DEPLOYMENT_INFO" ]; then
    cat > "$FRONTEND_DEPLOYMENT_INFO" <<EOF
{
  "deployed": true,
  "buildTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "version": "1.0.0",
  "environment": "production",
  "marker": "$MARKER",
  "description": "Programme Creation Workflow Fixes - Deployment Verification"
}
EOF
    echo -e "  ${GREEN}✓ Updated $FRONTEND_DEPLOYMENT_INFO${NC}"
    FILES_UPDATED=$((FILES_UPDATED + 1))
fi

echo ""

# =====================
# Summary
# =====================
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Summary${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${GREEN}✓ Updated $FILES_UPDATED files with marker: $MARKER${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  ${WHITE}1. Commit these changes to git${NC}"
echo -e "  ${WHITE}2. Push to main branch to trigger deployment${NC}"
echo -e "  ${WHITE}3. Wait for Coolify deployment to complete${NC}"
echo -e "  ${WHITE}4. Run ./verify-deployment.sh $MARKER${NC}"
echo ""
