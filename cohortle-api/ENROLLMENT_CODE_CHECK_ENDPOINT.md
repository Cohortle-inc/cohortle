# Enrollment Code Availability Check Endpoint

## Overview

This document describes the enrollment code availability check endpoint that allows conveners to verify if an enrollment code is available before creating a cohort.

## Endpoint Details

### GET /v1/api/enrollment-codes/check

**Purpose**: Check if an enrollment code is already in use

**Authentication**: Required (Bearer token)

**Authorization**: Convener role required

**Query Parameters**:
- `code` (required): The enrollment code to check

### Request Example

```http
GET /v1/api/enrollment-codes/check?code=PROG-2026-ABC123
Authorization: Bearer <token>
```

### Response Examples

#### Success - Code Available

```json
{
  "available": true
}
```

**Status Code**: 200 OK

#### Success - Code Not Available

```json
{
  "available": false
}
```

**Status Code**: 200 OK

#### Error - Missing Code Parameter

```json
{
  "error": true,
  "message": "Enrollment code is required"
}
```

**Status Code**: 400 Bad Request

#### Error - Server Error

```json
{
  "error": true,
  "message": "something went wrong"
}
```

**Status Code**: 500 Internal Server Error

## Implementation Details

### Location
- File: `cohortle-api/routes/cohort.js`
- Function: GET endpoint handler for `/v1/api/enrollment-codes/check`

### Logic Flow

1. Extract `code` parameter from query string
2. Validate that `code` parameter is provided
   - If missing, return 400 error
3. Query the `cohorts` table for existing enrollment code
4. Return availability status:
   - `available: true` if no cohort found with that code
   - `available: false` if a cohort exists with that code
5. Handle any database errors with 500 response

### Database Query

```javascript
sdk.setTable('cohorts');
const existingCohort = await sdk.get({ enrollment_code: code });
const available = existingCohort.length === 0;
```

## Requirements Satisfied

This endpoint satisfies the following requirements from the spec:

- **Requirement 11.1**: Backend provides endpoint GET /v1/api/enrollment-codes/check?code=XXX
- **Requirement 11.2**: Returns 400 with 'Enrollment code is required' when code parameter is missing
- **Requirement 11.3**: Returns {available: true} when code is available
- **Requirement 11.4**: Returns {available: false} when code is already in use

## Testing

### Unit Tests

Unit tests are located in `cohortle-api/__tests__/routes/enrollment-code.test.js`

Test coverage includes:
- Missing code parameter (400 error)
- Available code (returns true)
- Code already in use (returns false)
- Empty string code parameter
- Codes with special characters
- Database error handling
- Very long enrollment codes
- Case-sensitive code checking

Run tests with:
```bash
npm test -- __tests__/routes/enrollment-code.test.js
```

### Integration with Frontend

The frontend should call this endpoint when:
1. User types an enrollment code in the cohort creation form
2. Debounced by 500ms to avoid excessive API calls
3. Display availability status to the user in real-time
4. Prevent form submission if code is not available

Example frontend usage:
```javascript
const checkEnrollmentCodeAvailability = async (code) => {
  if (!code || code.length < 3) return null;
  
  try {
    const response = await apiClient.get(
      `/v1/api/enrollment-codes/check?code=${encodeURIComponent(code)}`
    );
    return response.data.available;
  } catch (error) {
    console.error('Error checking enrollment code:', error);
    return null;
  }
};
```

## Security Considerations

1. **Authentication Required**: Only authenticated users can check code availability
2. **Authorization**: Only conveners can access this endpoint
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **Input Validation**: Code parameter is validated before database query
5. **SQL Injection Protection**: BackendSDK uses parameterized queries

## Performance Considerations

1. **Database Index**: Ensure `enrollment_code` column in `cohorts` table has a unique index for fast lookups
2. **Caching**: Consider caching recently checked codes (with short TTL) to reduce database load
3. **Debouncing**: Frontend should debounce requests to avoid excessive API calls while user is typing

## Future Enhancements

1. Add code format validation (e.g., must match PROG-YYYY-XXXXXX pattern)
2. Return suggested alternative codes if requested code is taken
3. Add analytics to track popular code patterns
4. Implement code reservation system (temporarily reserve a code while form is being filled)
