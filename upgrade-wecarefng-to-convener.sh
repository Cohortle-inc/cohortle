#!/bin/bash
# Bash script to upgrade wecarefng@gmail.com to convener role on production server
# Run this script on the production server where the API is deployed

echo "🚀 Upgrading wecarefng@gmail.com to Convener Role"
echo "================================================="
echo ""

# Navigate to API directory
if [ -d "cohortle-api" ]; then
    cd cohortle-api
    echo "✅ Found API directory"
else
    echo "❌ API directory not found. Please run this from the project root."
    exit 1
fi

# Run the upgrade script
echo ""
echo "🔄 Running upgrade script..."
node upgrade-user-to-convener.js wecarefng@gmail.com

echo ""
echo "✨ Done!"
