#!/bin/bash
# Shell script to run verification_tokens migration on production
# Run this script on the production server where the database is accessible

echo "🔄 Running verification_tokens migration on production..."
echo ""

# Navigate to API directory
cd cohortle-api

# Run the migration script
echo "📡 Connecting to database and running migration..."
node run-verification-tokens-migration.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify the verification_tokens table exists in the database"
    echo "2. Check that all indexes are created (token, user_id, expires_at)"
    echo "3. Proceed with implementing the VerificationTokenService"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify database credentials in .env file"
    echo "2. Check database connectivity"
    echo "3. Ensure the users table has the email_verified field"
    exit 1
fi
