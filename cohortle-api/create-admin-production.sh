#!/bin/bash

# Create Administrator User - Production
# This script promotes an existing user to administrator role

echo "=========================================="
echo "Create Administrator User"
echo "=========================================="
echo ""

if [ -z "$1" ]; then
    echo "❌ ERROR: Please provide a user email address"
    echo ""
    echo "Usage:"
    echo "  ./create-admin-production.sh admin@example.com"
    echo "  ./create-admin-production.sh admin@example.com \"Custom reason\""
    exit 1
fi

EMAIL=$1
REASON=${2:-"Promoted to platform administrator"}

echo "Email: $EMAIL"
echo "Reason: $REASON"
echo ""
read -p "Promote this user to administrator? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Creating administrator..."
node scripts/create-admin-user.js "$EMAIL" "$REASON"

echo ""
echo "Done!"
