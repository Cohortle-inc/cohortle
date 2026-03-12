# Testing the New User Auth Fix

## Quick Test (5 minutes)

### 1. Create a New Account

```
1. Go to signup page
2. Enter:
   - Email: test-new-user-[timestamp]@example.com
   - First Name: Test
   - Last Name: User
   - Password: TestPassword123!
   - Role: Student
3. Click Sign Up
```

### 2. Verify Welcome Email

```
1. Check email inbox
2. Should receive welcome email from Cohortle
3. Email should arrive within 30 seconds
```

### 3. Test Login

```
1. Log out (or open new incognito window)
2. Go to login page
3. Enter the email and password from step 1
4. Click Login
```

### 4. Verify Dashboard Access

```
1. After login, should see dashboard
2. Should NOT see "user not authenticated" error
3. Should see:
   - Welcome message
   - Programme list (or empty state)
   - Navigation menu
```

## Detailed Test (15 minutes)

### Test 1: Signup Flow

```bash
# Create account
POST /v1/api/auth/signup
{
  "email": "test-user-1@example.com",
  "first_name": "Test",
  "last_name": "User",
  "password": "TestPassword123!",
  "role": "student"
}

# Expected response:
{
  "error": false,
  "message": "User registered successfully...",
  "token": "eyJ...",
  "user": {
    "id": 123,
    "email": "test-user-1@example.com",
    "role": "student"
  }
}
```

### Test 2: Check Database State

```bash
# Run diagnostic
node diagnose-new-user-auth.js

# Should show:
# - User ID, email, created timestamp
# - role_id field: [some number]
# - role via JOIN: student
# - ✅ Role assignments found: 1
#   - Role: student, Status: active
```

### Test 3: Login Flow

```bash
# Login with new account
POST /v1/api/auth/login
{
  "email": "test-user-1@example.com",
  "password": "TestPassword123!"
}

# Expected response:
{
  "error": false,
  "message": "login successfully",
  "token": "eyJ...",
  "user": {
    "id": 123,
    "email": "test-user-1@example.com",
    "role": "student",
    "email_verified": false
  }
}
```

### Test 4: Verify Token Contains Role

```bash
# Decode the JWT token (use jwt.io or similar)
# Token payload should contain:
{
  "user_id": 123,
  "email": "test-user-1@example.com",
  "role": "student",  // NOT "unassigned"
  "permissions": [...],
  "email_verified": false
}
```

### Test 5: Access Protected Route

```bash
# Use the token to access a protected route
GET /v1/api/profile
Authorization: Bearer [token]

# Should return 200 with user profile
# Should NOT return 401 "Unauthorized"
```

## Regression Tests

### Test 6: Old Account Still Works

```bash
# Login with an old account (created before this fix)
POST /v1/api/auth/login
{
  "email": "old-user@example.com",
  "password": "OldPassword123!"
}

# Should work exactly as before
# Should return token with correct role
```

### Test 7: Invalid Credentials Still Fail

```bash
# Try login with wrong password
POST /v1/api/auth/login
{
  "email": "test-user-1@example.com",
  "password": "WrongPassword"
}

# Should return 401
{
  "error": true,
  "message": "email and password does not match"
}
```

### Test 8: Non-existent User Still Fails

```bash
# Try login with non-existent email
POST /v1/api/auth/login
{
  "email": "nonexistent@example.com",
  "password": "SomePassword123!"
}

# Should return 401
{
  "error": true,
  "message": "email and password does not match"
}
```

## Automated Test Script

```bash
#!/bin/bash

# Test new user signup and login
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "Testing new user auth fix..."
echo "Email: $TEST_EMAIL"

# Signup
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3001/v1/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"password\": \"$TEST_PASSWORD\",
    \"role\": \"student\"
  }")

echo "Signup response:"
echo $SIGNUP_RESPONSE | jq .

# Extract token
SIGNUP_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Login response:"
echo $LOGIN_RESPONSE | jq .

# Extract token
LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# Verify tokens contain role
echo "Signup token role:"
echo $SIGNUP_TOKEN | cut -d'.' -f2 | base64 -d | jq '.role'

echo "Login token role:"
echo $LOGIN_TOKEN | cut -d'.' -f2 | base64 -d | jq '.role'

# Test profile access
echo "Testing profile access with login token:"
curl -s -X GET http://localhost:3001/v1/api/profile \
  -H "Authorization: Bearer $LOGIN_TOKEN" | jq .
```

## Expected Results

### ✅ Success Indicators

- New user signup completes successfully
- Welcome email is received
- Login works with new account
- Dashboard loads without "user not authenticated" error
- JWT token contains `"role": "student"` (not `"unassigned"`)
- Profile endpoint returns 200 (not 401)
- Old accounts still work normally

### ❌ Failure Indicators

- Signup fails
- Welcome email not received
- Login fails with "invalid email and password"
- Dashboard shows "user not authenticated"
- JWT token contains `"role": "unassigned"`
- Profile endpoint returns 401

## Troubleshooting

### If New User Still Gets "user not authenticated"

1. Run diagnostic:
   ```bash
   node diagnose-new-user-auth.js
   ```

2. Check if user has role assignment:
   ```bash
   # Look for the user in the output
   # Check if "Role assignments found" shows > 0
   ```

3. If no assignments, run fix:
   ```bash
   node fix-new-user-roles.js
   ```

4. Have user log in again

### If Login Returns "invalid email and password"

1. Verify credentials are correct
2. Check if user exists in database
3. Check if password hash is valid
4. Run diagnostic to check role status

### If Token Doesn't Contain Role

1. Check `getUserWithRole()` is being called
2. Verify role_id is set in users table
3. Verify user_role_assignments has active entry
4. Check roles table has the role

## Performance Notes

The fix adds a few extra database queries in fallback scenarios:
- First query: LEFT JOIN with roles (original)
- Fallback 1: Direct query to roles table (if JOIN fails)
- Fallback 2: Query to user_role_assignments (if role_id is NULL)

In normal cases (role_id is set), only the first query runs. The fallbacks only execute if needed.

## Cleanup

After testing, you can delete test accounts:

```bash
# Delete test user from database
DELETE FROM users WHERE email LIKE 'test-user-%@example.com';
```
