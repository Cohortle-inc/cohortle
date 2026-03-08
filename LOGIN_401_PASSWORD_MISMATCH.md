# Login 401 - Password Mismatch

## What's Happening

Backend logs show:
```
SELECT users.id, users.password, role.name 
FROM users 
WHERE users.email = 'learner11@cohortle.com'
```
✅ User found in database
❌ POST /v1/api/auth/login 401 (password comparison failed)

## Root Cause

The backend successfully:
1. Found the user in the database
2. Retrieved the password hash
3. Compared the provided password with the hash
4. **Password didn't match** → returned 401

## Possible Reasons

### 1. Wrong Password
You're entering the wrong password for learner11@cohortle.com.

### 2. Account Has No Password
The account might have been created without a password (e.g., through a script or migration).

### 3. Password Hash Corruption
The password hash in the database might be corrupted or in the wrong format.

## Solution

### Option 1: Try a Different Account
Use an account you know the password for:
- learner10@cohortle.com
- Or any other test account you've created

### Option 2: Create a New Test Account
Sign up with a new account:
1. Go to https://cohortle.com
2. Click "Sign Up"
3. Create a new student account
4. Use that to test login

### Option 3: Reset Password for learner11
Use the "Forgot Password" feature:
1. Go to login page
2. Click "Forgot Password"
3. Enter learner11@cohortle.com
4. Check email for reset link
5. Set new password

### Option 4: Check Database Directly
Run this query to see if the account has a password:

```sql
SELECT id, email, password, role_id 
FROM users 
WHERE email = 'learner11@cohortle.com';
```

If `password` is NULL or empty, the account has no password set.

### Option 5: Create Test Account via Script
Create a test account with a known password:

```javascript
// create-test-user.js
const bcrypt = require('bcrypt');
const { sequelize } = require('./cohortle-api/models');

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  
  await sequelize.query(`
    INSERT INTO users (email, first_name, last_name, password, role_id, created_at, updated_at)
    VALUES ('testuser@cohortle.com', 'Test', 'User', '${hashedPassword}', 2, NOW(), NOW())
  `);
  
  console.log('Test user created:');
  console.log('Email: testuser@cohortle.com');
  console.log('Password: TestPassword123!');
}

createTestUser();
```

## What's Working

✅ Backend is running
✅ Database connection works
✅ User lookup works
✅ Password field is being retrieved (our fix worked!)
✅ Password comparison is happening

The only issue is the password doesn't match.

## Quick Test

Try these credentials (if you have them):
- Email: Any account you created yourself
- Password: The password you set when creating it

Or create a new account via the signup page and use that.

## Summary

The login system is working correctly. The 401 error is expected behavior when the password is wrong. Either:
1. Use the correct password for learner11@cohortle.com
2. Use a different account you know the password for
3. Create a new test account via signup
4. Reset the password for learner11@cohortle.com
