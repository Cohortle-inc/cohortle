# Authentication and Authorization System

## Overview

This document describes the authentication and authorization architecture for the Cohortle platform. The system combines JWT-based authentication with role-based access control (RBAC) to provide secure, scalable access management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Authorization Flow](#authorization-flow)
4. [JWT Token Structure](#jwt-token-structure)
5. [Middleware](#middleware)
6. [Security Considerations](#security-considerations)
7. [Implementation Guide](#implementation-guide)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Browser, Mobile App, API Client)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS + JWT Token
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   API Gateway Layer                          │
│  - Request Validation                                        │
│  - Rate Limiting                                             │
│  - CORS Handling                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Authentication Middleware                     │
│  - Extract JWT Token                                         │
│  - Verify Token Signature                                    │
│  - Check Token Expiration                                    │
│  - Extract User & Role Information                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Authorization Middleware                      │
│  - Validate User Role                                        │
│  - Check Required Permissions                                │
│  - Verify Resource Ownership                                 │
│  - Enforce Access Control                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  - Route Handlers                                            │
│  - Service Layer                                             │
│  - Data Access Layer                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      Database Layer                          │
│  - User Data                                                 │
│  - Role Assignments                                          │
│  - Permissions                                               │
│  - Audit Logs                                                │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Stateless Authentication:** JWT tokens contain all necessary information
2. **Role-Based Authorization:** Access control based on user roles
3. **Permission Inheritance:** Higher roles inherit lower role permissions
4. **Defense in Depth:** Multiple layers of security validation
5. **Audit Trail:** All authentication and authorization events logged

---

## Authentication Flow

### 1. User Registration

```
User                    API                     Database
  │                      │                         │
  ├─ POST /register ────>│                         │
  │                      ├─ Validate Input ────────┤
  │                      │                         │
  │                      ├─ Hash Password ─────────┤
  │                      │                         │
  │                      ├─ Create User ──────────>│
  │                      │                         │
  │                      ├─ Assign Learner Role ──>│
  │                      │                         │
  │                      ├─ Generate JWT Token ────┤
  │                      │                         │
  │<─ 201 Created ───────┤                         │
  │   + JWT Token        │                         │
  │   + User Data        │                         │
```

**Key Points:**
- All new users automatically assigned Learner role
- Password hashed using bcrypt (10 rounds)
- JWT token generated with role information
- Token stored in httpOnly cookie (secure)

### 2. User Login

```
User                    API                     Database
  │                      │                         │
  ├─ POST /login ───────>│                         │
  │   email, password    │                         │
  │                      ├─ Find User ────────────>│
  │                      │<─ User Data ────────────┤
  │                      │                         │
  │                      ├─ Verify Password ───────┤
  │                      │                         │
  │                      ├─ Get User Role ────────>│
  │                      │<─ Role & Permissions ───┤
  │                      │                         │
  │                      ├─ Generate JWT Token ────┤
  │                      │                         │
  │                      ├─ Log Login Event ──────>│
  │                      │                         │
  │<─ 200 OK ────────────┤                         │
  │   + JWT Token        │                         │
  │   + User Data        │                         │
```

**Key Points:**
- Password verified using bcrypt.compare()
- User role and permissions fetched from database
- JWT token includes role claim
- Login event logged for security auditing

### 3. Token Refresh

```
User                    API                     Database
  │                      │                         │
  ├─ POST /refresh ─────>│                         │
  │   (with JWT token)   │                         │
  │                      ├─ Verify Token ──────────┤
  │                      │                         │
  │                      ├─ Check Role Conflict ──>│
  │                      │<─ Current Role ─────────┤
  │                      │                         │
  │                      ├─ Generate New Token ────┤
  │                      │                         │
  │<─ 200 OK ────────────┤                         │
  │   + New JWT Token    │                         │
```

**Key Points:**
- Detects role conflicts between token and database
- Automatically refreshes token with updated role
- Maintains user session continuity

---

## Authorization Flow

### 1. Route-Level Authorization

```
Request                 Middleware              Database
  │                         │                      │
  ├─ GET /convener/... ────>│                      │
  │   (with JWT token)      │                      │
  │                         ├─ Extract Token ──────┤
  │                         │                      │
  │                         ├─ Verify Signature ───┤
  │                         │                      │
  │                         ├─ Extract Role ───────┤
  │                         │                      │
  │                         ├─ Check Required Role ┤
  │                         │   (convener)         │
  │                         │                      │
  │                         ├─ [PASS] ────────────>│
  │                         │   Continue to handler│
  │                         │                      │
  │                    OR   │                      │
  │                         │                      │
  │<─ 403 Forbidden ────────┤                      │
  │   [FAIL]                │                      │
```

**Implementation:**
```javascript
// Route with role requirement
router.get('/convener/dashboard', 
  TokenMiddleware({ role: 'convener' }),
  convenerDashboardHandler
);
```

### 2. Resource-Level Authorization

```
Request                 Service                 Database
  │                         │                      │
  ├─ PUT /programmes/123 ──>│                      │
  │   (with JWT token)      │                      │
  │                         ├─ Get Programme ─────>│
  │                         │<─ Programme Data ────┤
  │                         │                      │
  │                         ├─ Check Ownership ────┤
  │                         │   (user owns it?)    │
  │                         │                      │
  │                         ├─ Check Permission ───┤
  │                         │   (can update?)      │
  │                         │                      │
  │                         ├─ [PASS] ────────────>│
  │                         │   Update programme   │
  │                         │                      │
  │                    OR   │                      │
  │                         │                      │
  │<─ 403 Forbidden ────────┤                      │
  │   [FAIL]                │                      │
```

**Implementation:**
```javascript
// Service method with resource-level check
async updateProgramme(userId, programmeId, updates) {
  // Check ownership
  const programme = await Programme.findByPk(programmeId);
  if (programme.created_by !== userId) {
    throw new ForbiddenError('You do not own this programme');
  }
  
  // Check permission
  const canUpdate = await roleValidationService.canPerformAction(
    userId, 
    'update_programme', 
    { type: 'programme', id: programmeId }
  );
  
  if (!canUpdate) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  // Perform update
  return await programme.update(updates);
}
```

### 3. Multi-Level Authorization

The system enforces authorization at multiple levels:

1. **Route Level:** Validates user has required role to access endpoint
2. **Resource Level:** Validates user can access specific resource
3. **Action Level:** Validates user can perform specific action on resource

**Example Flow:**
```
1. User requests: PUT /programmes/123
2. Route middleware checks: User has 'convener' role? ✓
3. Service checks: User owns programme 123? ✓
4. Service checks: User has 'update_programme' permission? ✓
5. Action proceeds
```

---

## JWT Token Structure

### Token Payload

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "convener",
  "permissions": [
    "view_dashboard",
    "join_cohort",
    "view_lessons",
    "complete_lessons",
    "participate_community",
    "build_portfolio",
    "create_programme",
    "manage_cohorts",
    "manage_lessons",
    "view_analytics",
    "manage_enrollments",
    "manage_programme_lifecycle"
  ],
  "role_assignment_id": "uuid",
  "iat": 1709553600,
  "exp": 1709640000
}
```

### Token Generation

```javascript
const jwt = require('jsonwebtoken');

function generateToken(user, role, permissions) {
  const payload = {
    user_id: user.id,
    email: user.email,
    role: role.name,
    permissions: permissions.map(p => p.name),
    role_assignment_id: user.role_assignment_id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256'
  });
}
```

### Token Verification

```javascript
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    
    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Token Storage

**Backend:**
- Tokens stored in httpOnly cookies (secure, not accessible via JavaScript)
- Cookie settings: `httpOnly: true, secure: true, sameSite: 'strict'`

**Frontend:**
- Tokens automatically included in requests via cookies
- No manual token management required
- Reduced XSS attack surface

---

## Middleware

### 1. Authentication Middleware

**Purpose:** Verify user identity via JWT token

```javascript
const TokenMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Extract token from cookie or Authorization header
      const token = req.cookies.token || 
                    req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          error: true,
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to request
      req.user = {
        id: decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      };
      
      // Check role requirement if specified
      if (options.role) {
        const hasRole = await roleValidationService.hasRole(
          req.user.id, 
          options.role
        );
        
        if (!hasRole) {
          return res.status(403).json({
            error: true,
            message: `Insufficient permissions. Required role: ${options.role}`,
            code: 'ROLE_REQUIRED',
            details: {
              required_role: options.role,
              user_role: req.user.role
            }
          });
        }
      }
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        error: true,
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
  };
};
```

### 2. Role Validation Middleware

**Purpose:** Validate user has required role for route

```javascript
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;
      
      // Check if user has required role or higher
      const hasRequiredRole = await roleValidationService.hasRole(
        req.user.id,
        requiredRole
      );
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          error: true,
          message: `Insufficient permissions. Required role: ${requiredRole}`,
          code: 'ROLE_REQUIRED',
          details: {
            required_role: requiredRole,
            user_role: userRole,
            suggestion: 'Contact an administrator to request role upgrade'
          }
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 3. Permission Validation Middleware

**Purpose:** Validate user has required permission

```javascript
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const hasPermission = req.user.permissions.includes(requiredPermission);
      
      if (!hasPermission) {
        return res.status(403).json({
          error: true,
          message: `Insufficient permissions. Required permission: ${requiredPermission}`,
          code: 'PERMISSION_DENIED',
          details: {
            required_permission: requiredPermission,
            user_permissions: req.user.permissions
          }
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

### 4. Resource Ownership Middleware

**Purpose:** Validate user owns or can access resource

```javascript
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;
      
      const isOwner = await accessControlService.validateResourceOwnership(
        userId,
        resourceType,
        resourceId
      );
      
      if (!isOwner) {
        return res.status(403).json({
          error: true,
          message: 'You do not have access to this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

---

## Security Considerations

### 1. Token Security

**Best Practices:**
- Use strong JWT secret (minimum 256 bits)
- Store secret in environment variables
- Rotate secrets periodically
- Use httpOnly cookies to prevent XSS
- Set secure flag in production
- Use sameSite: 'strict' to prevent CSRF

**Token Expiration:**
- Access tokens: 24 hours
- Refresh tokens: 7 days (future feature)
- Automatic token refresh on role changes

### 2. Password Security

**Best Practices:**
- Hash passwords using bcrypt (10 rounds)
- Never store plain text passwords
- Enforce strong password requirements
- Implement rate limiting on login attempts
- Log failed login attempts

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 3. Role Security

**Best Practices:**
- Validate roles at multiple levels
- Log all role changes
- Require administrator approval for role upgrades
- Enforce minimum administrator constraint
- Audit role assignments regularly

### 4. API Security

**Best Practices:**
- Use HTTPS in production
- Implement rate limiting
- Validate all input
- Sanitize output
- Use CORS properly
- Log security events

### 5. Database Security

**Best Practices:**
- Use parameterized queries
- Implement row-level security
- Encrypt sensitive data
- Regular backups
- Audit database access

---

## Implementation Guide

### Setting Up Authentication

1. **Install Dependencies**
```bash
npm install jsonwebtoken bcrypt cookie-parser
```

2. **Configure Environment**
```env
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRATION=24h
NODE_ENV=production
```

3. **Implement Auth Routes**
```javascript
// routes/auth.js
router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.post('/refresh', refreshTokenHandler);
```

4. **Apply Middleware**
```javascript
// Protect routes
router.get('/dashboard', 
  TokenMiddleware(),
  dashboardHandler
);

// Require specific role
router.get('/convener/dashboard',
  TokenMiddleware({ role: 'convener' }),
  convenerDashboardHandler
);

// Require specific permission
router.post('/programmes',
  TokenMiddleware(),
  requirePermission('create_programme'),
  createProgrammeHandler
);
```

### Testing Authentication

```javascript
// Test login
const response = await request(app)
  .post('/v1/api/auth/login')
  .send({
    email: 'user@example.com',
    password: 'password123'
  });

expect(response.status).toBe(200);
expect(response.body.data.token).toBeDefined();

// Test protected route
const protectedResponse = await request(app)
  .get('/v1/api/dashboard')
  .set('Authorization', `Bearer ${token}`);

expect(protectedResponse.status).toBe(200);
```

---

## Related Documentation

- [Role Management API](./ROLE_MANAGEMENT_API.md)
- [Role System Schema](./ROLE_SYSTEM_SCHEMA.md)
- [Role Management User Guide](./ROLE_MANAGEMENT_USER_GUIDE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

---

*Last Updated: March 4, 2024*
