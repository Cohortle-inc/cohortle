#!/bin/bash

# Run Role Assignment Fix on Production Server
# This script should be executed ON the production server where the database is accessible

set -e

echo "============================================================"
echo "Role Assignment Fix - Production Execution"
echo "============================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "scripts/fix-users-without-roles.js" ]; then
    echo "Error: This script must be run from the cohortle-api directory"
    echo "Current directory: $(pwd)"
    echo ""
    echo "Please run:"
    echo "  cd /app  # or wherever cohortle-api is deployed"
    echo "  bash run-role-assignment-fix.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found"
    echo "Please ensure database credentials are configured"
    exit 1
fi

# Load environment variables
source .env

# Check database connection
echo "Step 1: Testing database connection..."
if ! node -e "const db = require('./models'); db.sequelize.authenticate().then(() => { console.log('✓ Database connected'); process.exit(0); }).catch(err => { console.error('✗ Database connection failed:', err.message); process.exit(1); });" 2>/dev/null; then
    echo "✗ Cannot connect to database"
    echo "Please check your database credentials in .env"
    exit 1
fi
echo ""

# Run the fix script
echo "Step 2: Running role assignment fix..."
echo ""
node scripts/fix-users-without-roles.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✓ Fix completed successfully!"
    echo "============================================================"
    echo ""
    echo "Next steps:"
    echo "1. Test user login and dashboard access"
    echo "2. Monitor application logs for authentication errors"
    echo "3. Verify role-based routing works correctly"
    echo "4. Proceed to Task 1.4 (Verify database integrity)"
    echo ""
else
    echo ""
    echo "============================================================"
    echo "✗ Fix failed - please review the errors above"
    echo "============================================================"
    echo ""
    exit 1
fi
