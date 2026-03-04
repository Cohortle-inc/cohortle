# Error Debugging Guide: How to Identify Issues

## Where to Look for Error Information

### 1. Browser Console (Frontend Errors)

**How to Access:**
1. Open your browser (Chrome, Firefox, etc.)
2. Press `F12` or right-click → "Inspect Element"
3. Click the "Console" tab
4. Try to create a cohort and watch for new log messages

**What to Look For:**

#### ✅ **Successful Flow Logs:**
```javascript
CohortForm: Submitting data for programme 10 : {name: "Test Cohort", enrollmentCode: "PROG-2026-ABC123", startDate: "2026-03-01"}
createCohort: Sending request to backend: {programmeId: "10", requestData: {name: "Test Cohort", enrollment_code: "PROG-2026-ABC123", start_date: "2026-03-01"}}
createCohort: Backend response: {error: false, cohort: {...}}
```

#### ❌ **Error Flow Logs:**
```javascript
checkEnrollmentCodeAvailability: Checking code: PROG-2026-WDLNN7
checkEnrollmentCodeAvailability: Error occurred: AxiosError: Request failed with status code 400
checkEnrollmentCodeAvailability: Response data: {error: true, message: "Enrollment code is required"}
checkEnrollmentCodeAvailability: Response status: 400

createCohort: Sending request to backend: {...}
createCohort: Error occurred: AxiosError: Request failed with status code 500
createCohort: Response data: {error: true, message: "Failed to create cohort"}
createCohort: Response status: 500
```

### 2. Backend Logs (Server Errors)

**How to Access Backend Logs:**

Since you're using Coolify for deployment, you can access logs through:

#### Option A: Coolify Dashboard
1. Go to your Coolify dashboard
2. Navigate to your `cohortle-api` application
3. Click on "Logs" or "Runtime Logs"
4. Look for recent entries when you try to create a cohort

#### Option B: SSH into Server (if you have access)
```bash
# If using Docker
docker logs <cohortle-api-container-name>

# If using PM2 or similar
pm2 logs cohortle-api
```

**What to Look For in Backend Logs:**

#### ✅ **Successful Flow:**
```
Enrollment code check request: {query: {code: "PROG-2026-ABC123"}, code: "PROG-2026-ABC123", user_id: 123}
Checking if enrollment code exists: PROG-2026-ABC123
Enrollment code check result: {code: "PROG-2026-ABC123", available: true, existingCohort: null}

Cohort creation request: {programme_id: "10", body: {name: "Test Cohort", enrollment_code: "PROG-2026-ABC123", start_date: "2026-03-01"}, user_id: 123}
Programme found: 10 Test Programme
Creating cohort with data: {programme_id: 10, name: "Test Cohort", enrollment_code: "PROG-2026-ABC123", start_date: "2026-03-01"}
Cohort created with ID: 456
Cohort fetched: {id: 456, name: "Test Cohort", ...}
```

#### ❌ **Error Flow:**
```
Enrollment code check request: {query: {}, code: undefined, user_id: 123}
Enrollment code check failed: No code provided

Cohort creation request: {programme_id: "10", body: {...}, user_id: 123}
Error creating cohort: Error: Column 'enrollment_code' cannot be null
Error details: {message: "Column 'enrollment_code' cannot be null", stack: "...", code: "ER_BAD_NULL_ERROR", sqlMessage: "Column 'enrollment_code' cannot be null"}
```

## Common Error Patterns to Look For

### 1. **Enrollment Code Check 400 Error**

**Frontend Console Shows:**
```javascript
checkEnrollmentCodeAvailability: Checking code: undefined
checkEnrollmentCodeAvailability: Error occurred: AxiosError: Request failed with status code 400
```

**Backend Logs Show:**
```
Enrollment code check request: {query: {}, code: undefined}
Enrollment code check failed: No code provided
```

**What This Means:** The enrollment code is not being passed correctly from the form to the API.

### 2. **Cohort Creation 500 Error**

**Frontend Console Shows:**
```javascript
createCohort: Sending request to backend: {programmeId: "10", requestData: {...}}
createCohort: Error occurred: AxiosError: Request failed with status code 500
createCohort: Response status: 500
```

**Backend Logs Show:**
```
Cohort creation request: {programme_id: "10", body: {...}}
Error creating cohort: Error: [specific database error]
Error details: {message: "...", sqlMessage: "...", code: "..."}
```

**What This Means:** There's a database or server-side processing error.

### 3. **Data Transformation Issues**

**Look for mismatches between:**
- Frontend: `enrollmentCode` (camelCase)
- Backend: `enrollment_code` (snake_case)

**Example Problem:**
```javascript
// Frontend sends:
createCohort: Sending request to backend: {requestData: {enrollment_code: "ABC123"}}

// But backend receives:
Cohort creation request: {body: {enrollmentCode: "ABC123"}} // Wrong format!
```

## Step-by-Step Debugging Process

### Step 1: Reproduce the Error
1. Open browser console (F12 → Console tab)
2. Try to create a cohort with the same data that was failing
3. Watch both browser console and note any error messages

### Step 2: Check Frontend Logs
Look for these specific log messages in browser console:
- `CohortForm: Submitting data for programme`
- `checkEnrollmentCodeAvailability: Checking code`
- `createCohort: Sending request to backend`
- Any error messages with `Error occurred`

### Step 3: Check Backend Logs
Look for these specific log messages in backend logs:
- `Enrollment code check request`
- `Cohort creation request`
- `Error creating cohort`
- `Error checking enrollment code`

### Step 4: Compare Data Flow
1. **Frontend Input:** What data is the form collecting?
2. **Frontend API:** What data is being sent to backend?
3. **Backend Received:** What data is the backend receiving?
4. **Backend Processing:** Where does the backend fail?

## Quick Diagnostic Questions

When you see errors, ask these questions:

1. **Is the enrollment code being passed correctly?**
   - Check: `checkEnrollmentCodeAvailability: Checking code: [value]`
   - Should not be `undefined` or empty

2. **Is the form data being transformed correctly?**
   - Check: `createCohort: Sending request to backend`
   - Should show `enrollment_code` not `enrollmentCode`

3. **Is the backend receiving the data?**
   - Check: `Cohort creation request: {programme_id: "...", body: {...}}`
   - All required fields should be present

4. **What's the specific database error?**
   - Check: `Error details: {message: "...", sqlMessage: "..."}`
   - This tells you exactly what went wrong

## What to Share When Reporting Issues

When you find errors, share:

1. **Browser Console Output** (copy the relevant log messages)
2. **Backend Log Output** (copy the relevant log messages)
3. **Form Data** (what you entered in the form)
4. **Specific Error Messages** (the exact error text)

This will help identify the exact point of failure and implement a targeted fix.