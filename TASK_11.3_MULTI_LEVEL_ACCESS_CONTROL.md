# Task 11.3: Multi-Level Access Control Implementation

## Summary

Successfully implemented comprehensive multi-level access control that validates permissions at both route and resource levels across the Cohortle platform.

**Requirement:** 6.4 - Multi-level access control  
**Status:** ✅ Complete

## What Was Implemented

### 1. Multi-Level Access Control Middleware (`cohortle-api/middleware/multiLevelAccessControl.js`)

Created a comprehensive middleware system that combines:

#### Route-Level Access Control
- Validates user has required role to access the route
- Enforces role hierarchy (administrator > convener > learner)
- Uses JWT token for fast validation
- Leverages existing `JwtService.verifyRoleMiddleware`

#### Resource-Level Access Control
- Validates user can access specific resources
- Checks resource ownership or assignment
- Enforces permission scopes (own, enrolled, assigned, all)
- Uses `RoleBasedAccessControlService` for validation
- Logs all access denials for security monitoring

### 2. Three Middleware Functions

#### `multiLevelAccessControl(config)`
Combines both route and resource-level checks:
```javascript
multiLevelAccessControl({
  requiredRoles: ['convener', 'administrator'],
  resourceType: 'cohort',
  resourceIdParam: 'cohort_id',
  action: 'update'
})
```

#### `routeLevelAccessControl(requiredRoles)`
Convenience wrapper for route-level only checks:
```javascript
routeLevelAccessControl(['learner', 'convener', 'administrator'])
```

#### `resourceLevelAccessControl(config)`
For routes that already have auth but need resource validation:
```javascript
resourceLevelAccessControl({
  resourceType: 'programme',
  resourceIdParam: 'id',
  action: 'update'
})
```

### 3. Updated Routes with Multi-Level Access Control

#### Cohort Routes (`cohortle-api/routes/cohort.js`)
- ✅ PUT `/v1/api/cohorts/:cohort_id` - Update cohort
- ✅ DELETE `/v1/api/cohorts/:cohort_id` - Delete cohort
- ✅ PATCH `/v1/api/cohorts/:cohort_id/members/:member_id/role` - Update member role
- ✅ DELETE `/v1/api/cohorts/:cohort_id/members/:member_id` - Remove member

#### Week Routes (`cohortle-api/routes/week.js`)
- ✅ PUT `/v1/api/weeks/:week_id` - Update week
- ✅ DELETE `/v1/api/weeks/:week_id` - Delete week

#### Lesson Routes (`cohortle-api/routes/lesson.js`)
- ✅ PUT `/v1/api/lessons/:lesson_id` - Update lesson
- ✅ DELETE `/v1/api/lessons/:lesson_id` - Delete lesson

### 4. Enhanced Error Logger

Added `logSecurityEvent` function to `cohortle-api/utils/errorLogger.js`:
- Logs all resource access denials
- Captures user ID, resource type, resource ID, action, and reason
- Provides audit trail for security monitoring
- Suppressed in test environment to avoid cluttering output

### 5. Comprehensive Test Suite

Created `cohortle-api/__tests__/middleware/multiLevelAccessControl.test.js`:
- ✅ 19 test cases covering all scenarios
- ✅ Configuration validation tests
- ✅ Route-level access control tests
- ✅ Resource-level access control tests
- ✅ Multi-level integration tests
- ✅ Error handling tests
- ✅ Security logging tests
- ✅ Role hierarchy enforcement tests

**Test Results:** All 19 tests passing ✅

### 6. Documentation

Created comprehensive documentation in `cohortle-api/docs/MULTI_LEVEL_ACCESS_CONTROL.md`:
- Architecture overview with flow diagrams
- Usage examples for all three middleware functions
- Configuration options reference
- Permission scopes explanation
- Role hierarchy documentation
- Error response formats
- Security logging details
- Best practices guide
- Migration guide from old pattern to new pattern

## Architecture

### Two-Level Validation Flow

```
Request
  ↓
Route-Level Check (Fast)
  ├─ JWT token validation
  ├─ Role verification
  └─ Role hierarchy check
  ↓
Resource-Level Check (Thorough)
  ├─ Resource existence
  ├─ Ownership validation
  ├─ Permission scope check
  └─ Security logging
  ↓
Handler (Access Validated)
```

### Permission Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| `all` | Full access to all resources | Administrator can access any programme |
| `own` | Access only to owned resources | Convener can only update their own programmes |
| `enrolled` | Access to enrolled resources | Learner can view lessons in enrolled programmes |
| `assigned` | Access to assigned resources | Teaching assistant assigned to specific cohort |

### Role Hierarchy

```
Administrator (level 3)
    ↓ inherits all permissions
Convener (level 2)
    ↓ inherits all permissions
Learner (level 1)
```

## Benefits

### 1. Consistent Security
- All resource operations use the same access control pattern
- Reduces risk of security vulnerabilities from inconsistent checks
- Centralized permission logic

### 2. Reduced Boilerplate
- No manual ownership checks in route handlers
- Automatic security logging
- Consistent error responses

### 3. Better Error Messages
- Clear indication of why access was denied
- Helpful suggestions for users
- Proper HTTP status codes (401, 403, 404)

### 4. Security Monitoring
- All access denials logged automatically
- Audit trail for compliance
- Anomaly detection support

### 5. Maintainability
- Single source of truth for access control logic
- Easy to update permission rules
- Well-tested and documented

## Example Usage

### Before (Old Pattern)
```javascript
app.put(
  "/v1/api/cohorts/:cohort_id",
  [UrlMiddleware, TokenMiddleware({ role: "convener" })],
  async function (req, res) {
    // Manual ownership check required
    const cohort = await db.cohorts.findByPk(req.params.cohort_id);
    if (cohort.convener_id !== req.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // ... handler logic
  }
);
```

### After (New Pattern)
```javascript
app.put(
  "/v1/api/cohorts/:cohort_id",
  [
    UrlMiddleware,
    ...multiLevelAccessControl({
      requiredRoles: ['convener', 'administrator'],
      resourceType: 'cohort',
      resourceIdParam: 'cohort_id',
      action: 'update'
    })
  ],
  async function (req, res) {
    // Ownership already validated - proceed directly
    // req.resourceAccess contains validation info
    // ... handler logic
  }
);
```

## Integration with Existing Systems

### Works With
- ✅ `RoleBasedAccessControlService` - Resource-level validation
- ✅ `JwtService.verifyRoleMiddleware` - Route-level validation
- ✅ `roleErrorHandler` - Error response formatting
- ✅ `errorLogger` - Security event logging
- ✅ Frontend `RoleContext` - Client-side role checking
- ✅ Frontend middleware - Route-level protection

### Complements
- Role validation service (task 2.1)
- Role assignment service (task 2.3)
- JWT token enhancements (task 4.1-4.2)
- Role management API (task 5.1-5.2)
- Frontend role context (task 7.1)

## Testing

### Run Tests
```bash
cd cohortle-api
npm test -- __tests__/middleware/multiLevelAccessControl.test.js
```

### Test Coverage
- Configuration validation
- Route-level access control
- Resource-level access control
- Multi-level integration
- Error handling
- Security logging
- Role hierarchy enforcement

**Result:** 19/19 tests passing ✅

## Files Created/Modified

### Created
1. `cohortle-api/middleware/multiLevelAccessControl.js` - Main middleware implementation
2. `cohortle-api/__tests__/middleware/multiLevelAccessControl.test.js` - Comprehensive test suite
3. `cohortle-api/docs/MULTI_LEVEL_ACCESS_CONTROL.md` - Complete documentation
4. `TASK_11.3_MULTI_LEVEL_ACCESS_CONTROL.md` - This summary document

### Modified
1. `cohortle-api/routes/cohort.js` - Updated 4 routes with multi-level access control
2. `cohortle-api/routes/week.js` - Updated 2 routes with multi-level access control
3. `cohortle-api/routes/lesson.js` - Updated 2 routes with multi-level access control
4. `cohortle-api/utils/errorLogger.js` - Added `logSecurityEvent` function

## Security Considerations

### Access Denial Logging
All resource access denials are logged with:
- Timestamp
- User ID
- Resource type and ID
- Action attempted
- Reason for denial
- Route and HTTP method

### Error Response Strategy
- 401: Authentication required (no token or expired token)
- 403: Insufficient permissions (wrong role or no resource access)
- 404: Resource not found (or user shouldn't know it exists)
- 400: Bad request (missing parameters)
- 500: Internal error (unexpected failures)

### Information Disclosure Prevention
- Returns 404 instead of 403 when appropriate to avoid leaking resource existence
- Doesn't reveal ownership information in error messages
- Logs detailed information server-side but returns generic messages to client

## Next Steps

### Recommended
1. Apply multi-level access control to remaining routes:
   - Programme routes (create, update, delete)
   - User management routes
   - Role management routes (already have route-level, add resource-level)

2. Implement property-based test (Task 11.4 - optional):
   - Test multi-level access control with generated inputs
   - Verify consistency across all resource types

3. Add frontend resource-level checks:
   - Disable UI elements for unauthorized actions
   - Show/hide features based on resource ownership

### Future Enhancements
1. Cache permission checks for performance
2. Add support for custom permission scopes
3. Implement time-based access restrictions
4. Add support for delegation (user A grants access to user B)

## Compliance

### Requirements Met
✅ **Requirement 6.4:** Multi-level access control implemented
- Route-level validation enforces role requirements
- Resource-level validation enforces ownership and permissions
- Consistent access control across the application
- Comprehensive security logging

### Design Alignment
✅ Follows design document specifications:
- Two-level access control (route + resource)
- Permission scope enforcement
- Role hierarchy support
- Security audit logging
- Error handling with user guidance

## Conclusion

Task 11.3 is complete. The multi-level access control system provides:
- ✅ Consistent security enforcement at route and resource levels
- ✅ Reduced boilerplate code in route handlers
- ✅ Comprehensive security logging and audit trails
- ✅ Clear error messages with helpful guidance
- ✅ Well-tested and documented implementation
- ✅ Easy migration path from old pattern to new pattern

The system is production-ready and can be applied to additional routes as needed.
