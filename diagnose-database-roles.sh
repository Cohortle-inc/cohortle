#!/bin/bash
# ============================================================
# Database Role System Diagnostic Runner
# ============================================================
# This script runs the comprehensive database diagnostic
# for the authentication and role system
# ============================================================

echo "============================================================"
echo "DATABASE ROLE SYSTEM DIAGNOSTICS"
echo "============================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "cohortle-api/diagnose-database-roles.js" ]; then
    echo "Error: Must run from project root directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install Node.js"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Using Node.js version: $NODE_VERSION"

# Check if .env file exists
if [ ! -f "cohortle-api/.env" ]; then
    echo "Warning: .env file not found in cohortle-api/"
    echo "Make sure database credentials are configured"
    echo ""
fi

echo "Running database diagnostics..."
echo ""

# Run the diagnostic script
cd cohortle-api
node diagnose-database-roles.js
EXIT_CODE=$?
cd ..

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "Diagnostic completed successfully"
else
    echo "Diagnostic completed with errors (exit code: $EXIT_CODE)"
fi

echo ""
echo "============================================================"
echo "NEXT STEPS"
echo "============================================================"
echo ""
echo "If issues were found:"
echo "  1. Review the diagnostic output above"
echo "  2. Run fix script if users without roles: node cohortle-api/scripts/fix-users-without-roles.js"
echo "  3. Document findings in MVP_AUTH_BUG_HUNT_FINDINGS.md"
echo ""
echo "To run SQL diagnostics directly:"
echo "  mysql -u [user] -p [database] < cohortle-api/diagnose-database-roles.sql"
echo ""
