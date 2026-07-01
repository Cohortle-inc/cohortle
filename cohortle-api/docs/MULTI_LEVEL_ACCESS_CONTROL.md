# Multi-Level Access Control

## Overview

The multi-level access control system provides consistent security enforcement at both route and resource levels throughout the Cohortle API. This ensures that users not only have the correct role to access a route, but also have permission to perform actions on specific resources.

**Requirements:** 6.4 - Multi-level access control

## Architecture

### Two Levels of Access Control

1. **Route-Level Access Control**
   - Validates user has required role to access the route
   - Enforces role hierarchy (administrator > convener > learner)
   - Checks authentication and role from JWT token
   - Fast, token-based validation

2. **Resource-Level Access Control**
   - Validates user can access specific resource
   - Checks resource ownership or assignment
   - Enforces permission scopes (own, enrolled, assigned, all)
   - Database-backed validation

### Flow Diagram

```
Request → Route-Level Check → Resource-Level Check → Handler
          (Role validation)    (Ownership/Permission)
          
          ✓ Has role?          ✓ Owns resource?
          ✓ Token valid?       ✓ Has permission?
                               ✓ Correct scope?
```

## Usage

### Import the Middleware

```javascript
const { 
  multiLevelAccessControl,
  routeLevelAccessControl,
  resourceLevelAccessControl 
} = require('../middleware/multiLevelAccessControl');
```

### Multi-Level Access Control (Recommended)

Use this for routes that operate on specific resources:

```javascript
// Update a cohort - requires convener role AND ownership
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
    // Handler code - access already validated
    // req.resourceAccess contains validation info
  }
);
```

### Route-Level Only

Use this for routes that don't operate on specific resources:

```javascript
// List all programmes - only requires authentication
app.get(
  "/v1/api/programmes",
  [
    UrlMiddleware,
    ...routeLevelAccessControl(['learner', 'convener', 'administrator'])
  ],
  async function (req, res) {
    // Handler code
  }
);
```

### Resource-Level Only

Use this when you already have route-level auth but need resource validation:

```javascript
app.put(
  "/v1/api/programmes/:id",
  [
    UrlMiddleware,
    JwtService.verifyTokenMiddleware(process.env.JWT_SECRET),
    resourceLevelAccessControl({
      resourceType: 'programme',
      resourceIdParam: 'id',
      action: 'update'
    })
  ],
  async function (req, res) {
    // Handler code
  }
);
```

## Configuration Options

### multiLevelAccessControl(config)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requiredRoles` | string\|Array | Yes | Role(s) required to access route |
| `resourceType` | string | Conditional | Type of resource (e.g., 'programme', 'cohort', 'lesson') |
| `resourceIdParam` | string | Conditional | Request parameter containing resource ID |
| `action` | string | Conditional | Action being performed (e.g., 'read', 'update', 'delete', 'manage') |
| `skipResourceCheck` | boolean | No | Skip resource-level check (default: false) |

**Note:** `resourceType`, `resourceIdParam`, and `action` are required when `skipResourceCheck` is false.

### Resource Types

Supported resource types:
- `programme` - Educational programmes
- `cohort` - Programme cohorts
- `lesson` - Lesson content
- `week` - Week structures
- `user` - User profiles
- `profile` - User profile data

### Actions

Standard actions:
- `read` - View resource
- `update` - Modify resource
- `delete` - Remove resource
- `manage` - Full control (includes all actions)
- `create` - Create new resource (typically route-level only)

## Permission Scopes

The resource-level check validates against permission scopes:

| Scope | Description | Example |
|-------|-------------|---------|
| `all` | Full access to all resources | Administrator can access any programme |
| `own` | Access only to owned resources | Convener can only update their own programmes |
| `enrolled` | Access to enrolled resources | Learner can view lessons in enrolled programmes |
| `assigned` | Access to assigned resources | Teaching assistant assigned to specific cohort |

## Role Hierarchy

The system enforces role hierarchy:

```
Administrator (level 3)
    ↓ inherits all permissions
Convener (level 2)
    ↓ inherits all permissions
Learner (level 1)
```

- Administrator can access all convener and learner routes
- Convener can access all learner routes
- Learner can only access learner routes

## Request Object Enhancement

After successful validation, the middleware adds `resourceAccess` to the request:

```javascript
req.resourceAccess = {
  resourceType: 'cohort',
  resourceId: '123',
  action: 'update',
  validated: true
};
```

Use this in handlers to confirm validation occurred:

```javascript
async function handler(req, res) {
  if (!req.resourceAccess?.validated) {
    return res.status(500).json({ error: 'Access validation missing' });
  }
  
  // Proceed with handler logic
}
```

## Error Responses

### 401 Unauthorized
Token missing, expired, or invalid:
```json
{
  "success": false,
  "error": true,
  "message": "UNAUTHORIZED",
  "code": "UNAUTHORIZED"
}
```

### 403 Forbidden (Insufficient Role)
User lacks required role:
```json
{
  "success": false,
  "error": true,
  "message": "Insufficient permissions. Required role: convener",
  "code": "ROLE_REQUIRED",
  "details": {
    "required_roles": ["convener"],
    "user_role": "learner",
    "suggestion": "Contact an administrator to request convener role"
  }
}
```

### 403 Forbidden (Resource Access Denied)
User cannot access specific resource:
```json
{
  "success": false,
  "error": true,
  "message": "You do not have permission to access this resource",
  "code": "RESOURCE_ACCESS_DENIED"
}
```

### 404 Not Found
Resource doesn't exist (or user shouldn't know it exists):
```json
{
  "success": false,
  "error": true,
  "message": "Resource not found",
  "code": "RESOURCE_NOT_FOUND"
}
```

### 400 Bad Request
Missing required parameters:
```json
{
  "success": false,
  "error": true,
  "message": "Resource ID parameter 'cohort_id' is required",
  "code": "MISSING_RESOURCE_ID"
}
```

## Security Logging

All access denials are logged for security monitoring:

```javascript
{
  type: 'RESOURCE_ACCESS_DENIED',
  timestamp: '2024-01-15T10:30:00Z',
  user_id: 123,
  resource_type: 'programme',
  resource_id: '456',
  action: 'update',
  reason: 'User does not own resource',
  route: '/v1/api/programmes/456',
  method: 'PUT'
}
```

These logs can be used for:
- Security auditing
- Anomaly detection
- Access pattern analysis
- Compliance reporting

## Examples

### Example 1: Cohort Update (Multi-Level)

```javascript
// Only conveners/admins can update cohorts they own
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
    // Access validated - proceed with update
    const { cohort_id } = req.params;
    // ... update logic
  }
);
```

**Validation Flow:**
1. Check user has 'convener' or 'administrator' role ✓
2. Check user owns the cohort (via programme ownership) ✓
3. If both pass, allow access

### Example 2: Lesson Delete (Multi-Level)

```javascript
// Only conveners/admins can delete lessons they own
app.delete(
  "/v1/api/lessons/:lesson_id",
  [
    UrlMiddleware,
    ...multiLevelAccessControl({
      requiredRoles: ['convener', 'administrator'],
      resourceType: 'lesson',
      resourceIdParam: 'lesson_id',
      action: 'delete'
    }),
    validateLessonIdFormat,
    validateLessonExists
  ],
  async function (req, res) {
    // Access validated - proceed with deletion
  }
);
```

### Example 3: Programme List (Route-Level Only)

```javascript
// Any authenticated user can list programmes
app.get(
  "/v1/api/programmes",
  [
    UrlMiddleware,
    ...routeLevelAccessControl(['learner', 'convener', 'administrator'])
  ],
  async function (req, res) {
    // Only role checked - no specific resource
  }
);
```

### Example 4: User Profile (Resource-Level with Self-Access)

```javascript
// Users can only access their own profile
app.get(
  "/v1/api/users/:id/profile",
  [
    UrlMiddleware,
    ...multiLevelAccessControl({
      requiredRoles: ['learner', 'convener', 'administrator'],
      resourceType: 'user',
      resourceIdParam: 'id',
      action: 'read'
    })
  ],
  async function (req, res) {
    // User can only access if req.user_id === req.params.id
    // (unless they're an administrator with 'all' scope)
  }
);
```

## Testing

The middleware includes comprehensive unit tests covering:
- Configuration validation
- Route-level access control
- Resource-level access control
- Multi-level integration
- Error handling
- Security logging
- Role hierarchy enforcement

Run tests:
```bash
npm test -- __tests__/middleware/multiLevelAccessControl.test.js
```

## Best Practices

1. **Always use multi-level control for resource operations**
   - PUT, PATCH, DELETE on specific resources
   - Ensures users can only modify their own resources

2. **Use route-level only for list/search operations**
   - GET endpoints that return filtered results
   - POST endpoints that create new resources

3. **Specify most restrictive roles first**
   ```javascript
   requiredRoles: ['convener', 'administrator'] // Good
   requiredRoles: ['administrator', 'convener'] // Also works, but less clear
   ```

4. **Use descriptive action names**
   - Prefer 'manage' for full control operations
   - Use specific actions ('read', 'update', 'delete') when possible

5. **Check req.resourceAccess in handlers**
   - Confirms validation occurred
   - Provides resource context

6. **Handle errors gracefully**
   - Return appropriate HTTP status codes
   - Provide clear error messages
   - Log security events

## Migration Guide

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
    // ... handler logic
  }
);
```

**Benefits:**
- Consistent access control across all routes
- Automatic security logging
- Reduced boilerplate code
- Centralized permission logic
- Better error messages

## Related Documentation

- [Role System Architecture](./ROLE_SYSTEM_ARCHITECTURE_UPDATE.md)
- [Role Hierarchy and Permission Inheritance](./ROLE_HIERARCHY_PERMISSION_INHERITANCE.md)
- [Role-Based Access Control Service](../services/RoleBasedAccessControlService.js)
- [JWT Service](../services/JwtService.js)

## Support

For questions or issues with multi-level access control:
1. Check this documentation
2. Review test cases in `__tests__/middleware/multiLevelAccessControl.test.js`
3. Examine existing route implementations
4. Consult the role system design document
