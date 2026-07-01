#!/bin/bash

# Assign Roles to Existing Users - Production
# This script should be run on the production server AFTER the seeder

echo "=========================================="
echo "Assign Roles to Existing Users"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Assign 'student' role to all users without roles"
echo "  2. Create role assignments"
echo "  3. Log changes in role assignment history"
echo ""
echo "⚠️  Make sure you have run the seeder first!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Running role assignment script..."
node scripts/assign-roles-to-existing-users.js

echo ""
echo "Done!"
