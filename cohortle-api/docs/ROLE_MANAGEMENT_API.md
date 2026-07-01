# Role Management API Documentation

## Overview

This document provides comprehensive API documentation for the role validation and assignment system. The API enables role-based access control (RBAC) for the Cohortle platform, supporting Learner, Convener, and Administrator roles.

## Base URL

```
Production: https://api.cohortle.com/v1/api
Development: http://localhost:3000/v1/api
```

## Authentication

All endpoints require authentication via JWT token in httpOnly cookie or Authorization header:

```
Authorization: Bearer <jwt_token>
```

JWT tokens include role information in the payload:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "learner",
  "permissions": ["view_dashboard", "join_cohort", "view_lessons"],
  "role_assignment_id": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Role Hierarchy

The system implements a three-tier role hierarchy with permission inheritance:

1. **Learner** (Level 1) - Default role for all new users
   - Can join programmes, access lessons, participate in community
   - Persistent identity across all programmes

2. **Convener** (Level 2) - Programme creators and facilitators
   - Inherits all Learner permissions
   - Can create and manage programmes, cohorts, and content
   - Assigned by administrators only

3. **Administrator** (Level 3) - Platform governance
   - Inherits all Convener and Learner permissions
   - Can manage users, assign roles, configure platform

## API Endpoints

### 1. Get All Roles

Retrieve all available roles and their permissions.

**Endpoint:** `GET /roles`

**Authentication:** Required (any authenticated user)

**Request:**
```http
GET /v1/api/roles HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "role_id": "uuid",
        "name": "learner",
        "description": "Participant enrolled in programmes. Default role for all new users.",
        "hierarchy_level": 1,
        "permissions": [
          {
            "permission_id": "uuid",
            "name": "view_dashboard",
            "description": "View learner dashboard",
            "resource_type": "dashboard",
            "action": "read",
            "scope": "own"
          },
          {
            "permission_id": "uuid",
            "name": "join_cohort",
            "description": "Join cohorts using enrollment code",
            "resource_type": "cohort",
            "action": "create",
            "scope": "all"
          }
        ],
        "created_at": "2024-03-04T10:00:00Z",
        "updated_at": "2024-03-04T10:00:00Z"
      },
      {
        "role_id": "uuid",
        "name": "convener",
        "description": "Programme creator and facilitator. Assigned by administrators.",
        "hierarchy_level": 2,
        "permissions": [
          "... (includes all learner permissions plus convener-specific permissions)"
        ]
      },
      {
        "role_id": "uuid",
        "name": "administrator",
        "description": "Platform governance role.",
        "hierarchy_level": 3,
        "permissions": [
          "... (includes all permissions)"
        ]
      }
    ]
  }
}
```

**Error Responses:**

`401 Unauthorized` - Missing or invalid authentication token
```json
{
  "error": true,
  "message": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

---

### 2. Get User Role

Retrieve the current role for a specific user.

**Endpoint:** `GET /users/:userId/role`

**Authentication:** Required
- Users can view their own role
- Administrators can view any user's role

**Path Parameters:**
- `userId` (string, required) - User ID

**Request:**
```http
GET /v1/api/users/123e4567-e89b-12d3-a456-426614174000/role HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "role": {
      "role_id": "uuid",
      "name": "learner",
      "description": "Participant enrolled in programmes",
      "hierarchy_level": 1,
      "assigned_at": "2024-03-04T10:00:00Z",
      "assigned_by": null,
      "status": "active"
    },
    "permissions": [
      "view_dashboard",
      "join_cohort",
      "view_lessons",
      "complete_lessons",
      "participate_community",
      "build_portfolio"
    ]
  }
}
```

**Error Responses:**

`403 Forbidden` - User lacks permission to view this role
```json
{
  "error": true,
  "message": "Insufficient permissions. You can only view your own role.",
  "code": "ROLE_VIEW_FORBIDDEN",
  "details": {
    "required_permission": "manage_users",
    "suggestion": "Contact an administrator if you need to view other users' roles"
  }
}
```

`404 Not Found` - User not found
```json
{
  "error": true,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

### 3. Update User Role

Update a user's role (administrator only).

**Endpoint:** `PUT /users/:userId/role`

**Authentication:** Required (Administrator only)

**Path Parameters:**
- `userId` (string, required) - User ID

**Request Body:**
```json
{
  "role": "convener",
  "reason": "User requested convener access to create programmes",
  "effective_from": "2024-03-04T10:00:00Z",
  "effective_until": null
}
```

**Request:**
```http
PUT /v1/api/users/123e4567-e89b-12d3-a456-426614174000/role HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "role": "convener",
  "reason": "User requested convener access"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "previous_role": "learner",
    "new_role": "convener",
    "assigned_by": "admin-user-id",
    "assigned_at": "2024-03-04T10:00:00Z",
    "effective_from": "2024-03-04T10:00:00Z",
    "effective_until": null,
    "status": "active"
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid role or parameters
```json
{
  "error": true,
  "message": "Invalid role assignment",
  "code": "INVALID_ROLE_ASSIGNMENT",
  "details": {
    "role": "Role must be one of: learner, convener, administrator"
  }
}
```

`403 Forbidden` - User lacks administrator permission
```json
{
  "error": true,
  "message": "Insufficient permissions. Required role: administrator",
  "code": "ROLE_REQUIRED",
  "details": {
    "required_role": "administrator",
    "user_role": "convener",
    "suggestion": "Contact a platform administrator to request role changes"
  }
}
```

`409 Conflict` - Role change violates system constraints
```json
{
  "error": true,
  "message": "Cannot change role: System would be left without administrators",
  "code": "ROLE_TRANSITION_VIOLATION",
  "details": {
    "constraint": "minimum_administrators",
    "current_count": 1
  }
}
```

---

### 4. List Users by Role

Retrieve all users with a specific role.

**Endpoint:** `GET /users/with-role/:roleName`

**Authentication:** Required (Administrator only)

**Path Parameters:**
- `roleName` (string, required) - Role name (learner, convener, administrator)

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Results per page (default: 20, max: 100)
- `status` (string, optional) - Assignment status filter (active, inactive, pending)

**Request:**
```http
GET /v1/api/users/with-role/convener?page=1&limit=20&status=active HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "role": "convener",
    "users": [
      {
        "user_id": "uuid",
        "email": "convener@example.com",
        "name": "John Doe",
        "role_assignment": {
          "assigned_at": "2024-03-04T10:00:00Z",
          "assigned_by": "admin-user-id",
          "status": "active"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

**Error Responses:**

`400 Bad Request` - Invalid role name
```json
{
  "error": true,
  "message": "Invalid role name",
  "code": "INVALID_ROLE",
  "details": {
    "valid_roles": ["learner", "convener", "administrator"]
  }
}
```

`403 Forbidden` - User lacks administrator permission
```json
{
  "error": true,
  "message": "Insufficient permissions. Required role: administrator",
  "code": "ROLE_REQUIRED"
}
```

---

### 5. Get Role Assignment History

Retrieve the role assignment history for a user.

**Endpoint:** `GET /users/:userId/role/history`

**Authentication:** Required
- Users can view their own history
- Administrators can view any user's history

**Path Parameters:**
- `userId` (string, required) - User ID

**Request:**
```http
GET /v1/api/users/123e4567-e89b-12d3-a456-426614174000/role/history HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "history": [
      {
        "history_id": "uuid",
        "previous_role": "learner",
        "new_role": "convener",
        "changed_by": {
          "user_id": "admin-uuid",
          "email": "admin@example.com",
          "name": "Admin User"
        },
        "changed_at": "2024-03-04T10:00:00Z",
        "reason": "User requested convener access",
        "metadata": {
          "request_id": "req-123",
          "ip_address": "192.168.1.1"
        }
      },
      {
        "history_id": "uuid",
        "previous_role": null,
        "new_role": "learner",
        "changed_by": null,
        "changed_at": "2024-01-15T08:30:00Z",
        "reason": "Initial registration",
        "metadata": {
          "registration_source": "web"
        }
      }
    ]
  }
}
```

---

### 6. Validate Role Action

Validate if a user can perform a specific action.

**Endpoint:** `POST /validate/role`

**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "uuid",
  "action": "create_programme",
  "resource": {
    "type": "programme",
    "id": "programme-uuid"
  }
}
```

**Request:**
```http
POST /v1/api/validate/role HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "create_programme"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "can_perform": true,
    "user_role": "convener",
    "required_permission": "create_programme",
    "has_permission": true
  }
}
```

**Response (Access Denied):** `200 OK`
```json
{
  "success": true,
  "data": {
    "can_perform": false,
    "user_role": "learner",
    "required_permission": "create_programme",
    "has_permission": false,
    "reason": "User role 'learner' does not have permission 'create_programme'",
    "suggestion": "Contact an administrator to request convener role"
  }
}
```

---

### 7. Get User Permissions

Retrieve all permissions for the authenticated user.

**Endpoint:** `GET /permissions`

**Authentication:** Required

**Request:**
```http
GET /v1/api/permissions HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "role": "convener",
    "permissions": [
      {
        "name": "view_dashboard",
        "description": "View learner dashboard",
        "resource_type": "dashboard",
        "action": "read",
        "scope": "own"
      },
      {
        "name": "create_programme",
        "description": "Create new programmes",
        "resource_type": "programme",
        "action": "create",
        "scope": "all"
      },
      {
        "name": "manage_cohorts",
        "description": "Manage programme cohorts",
        "resource_type": "cohort",
        "action": "manage",
        "scope": "own"
      }
    ]
  }
}
```

---

### 8. Validate Resource Access

Validate if a user can access a specific resource.

**Endpoint:** `POST /validate/access`

**Authentication:** Required

**Request Body:**
```json
{
  "user_id": "uuid",
  "resource_type": "programme",
  "resource_id": "programme-uuid",
  "action": "update"
}
```

**Request:**
```http
POST /v1/api/validate/access HTTP/1.1
Host: api.cohortle.com
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "resource_type": "programme",
  "resource_id": "123e4567-e89b-12d3-a456-426614174000",
  "action": "update"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "can_access": true,
    "user_role": "convener",
    "resource_type": "programme",
    "resource_id": "123e4567-e89b-12d3-a456-426614174000",
    "action": "update",
    "is_owner": true,
    "has_permission": true
  }
}
```

**Response (Access Denied):** `200 OK`
```json
{
  "success": true,
  "data": {
    "can_access": false,
    "user_role": "learner",
    "resource_type": "programme",
    "resource_id": "123e4567-e89b-12d3-a456-426614174000",
    "action": "update",
    "is_owner": false,
    "has_permission": false,
    "reason": "User does not have permission to update programmes",
    "suggestion": "Contact an administrator to request convener role"
  }
}
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this consistent format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE_FOR_PROGRAMMATIC_HANDLING",
  "details": {
    "field": "Additional context about the error"
  },
  "timestamp": "2024-03-04T10:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication token missing or invalid |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `TOKEN_INVALID` | 401 | JWT token is malformed or invalid |
| `ROLE_REQUIRED` | 403 | User lacks required role for this action |
| `PERMISSION_DENIED` | 403 | User lacks required permission |
| `ROLE_VIEW_FORBIDDEN` | 403 | User cannot view requested role information |
| `INVALID_ROLE_ASSIGNMENT` | 400 | Invalid role or assignment parameters |
| `ROLE_TRANSITION_VIOLATION` | 409 | Role change violates system constraints |
| `USER_NOT_FOUND` | 404 | Requested user does not exist |
| `ROLE_NOT_FOUND` | 404 | Requested role does not exist |
| `RESOURCE_ACCESS_DENIED` | 403 | User cannot access requested resource |
| `INVALID_ROLE` | 400 | Invalid role name provided |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute per user
- **Role validation endpoints**: 200 requests per minute per user
- **Role assignment endpoints**: 20 requests per minute per administrator

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Webhooks (Future Feature)

Webhook support for role change events is planned for future releases:

- `role.assigned` - Triggered when a role is assigned to a user
- `role.updated` - Triggered when a user's role is changed
- `role.revoked` - Triggered when a role is revoked

---

## SDK Support

Official SDKs are available for:

- **JavaScript/TypeScript**: `@cohortle/api-client`
- **Python**: `cohortle-api` (planned)
- **Ruby**: `cohortle-api` (planned)

Example usage with JavaScript SDK:
```javascript
import { CohortleAPI } from '@cohortle/api-client';

const api = new CohortleAPI({ token: 'your-jwt-token' });

// Get all roles
const roles = await api.roles.list();

// Update user role
await api.users.updateRole('user-id', {
  role: 'convener',
  reason: 'User requested convener access'
});

// Validate action
const canCreate = await api.validate.action('create_programme');
```

---

## Changelog

### Version 1.0.0 (2024-03-04)
- Initial release of role management API
- Support for Learner, Convener, and Administrator roles
- Role validation and assignment endpoints
- Permission inheritance based on role hierarchy
- Comprehensive error handling and validation

---

## Support

For API support, please contact:
- Email: api-support@cohortle.com
- Documentation: https://docs.cohortle.com
- Status Page: https://status.cohortle.com
