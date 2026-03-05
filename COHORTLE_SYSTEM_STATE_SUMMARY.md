# Cohortle System State - Role System Complete

**Date:** March 5, 2026  
**Status:** Production Ready ✅

---

## System Overview

Cohortle is now a fully functional learning management platform with a comprehensive role-based access control system. The platform supports three user roles with clear permissions and workflows.

---

## Three-Role System

### 1. Learner (Default Role)
**Who gets it:** Every new user automatically upon registration

**What they can do:**
- ✅ Join programmes using enrollment codes
- ✅ Access lessons and complete coursework
- ✅ Participate in cohort community discussions
- ✅ Build learning portfolio across multiple programmes
- ✅ View personal dashboard and progress
- ✅ Track completion and achievements

**How to access:**
- Simply register on the platform
- Automatic assignment - no approval needed

---

### 2. Convener
**Who gets it:** Programme creators and facilitators (admin-approved only)

**What they can do:**
- ✅ Everything a Learner can do, PLUS:
- ✅ Create and manage programmes
- ✅ Organize cohorts and manage enrollments
- ✅ Create and edit lessons and content
- ✅ Manage programme lifecycle (Draft → Recruiting → Active → Completed → Archived)
- ✅ View programme analytics
- ✅ Facilitate community discussions
- ✅ Generate enrollment codes for cohorts

**How to access:**
- Contact a platform administrator
- Explain your use case for creating programmes
- Admin reviews and approves your request
- Admin assigns convener role via API

---

### 3. Administrator
**Who gets it:** Platform governance team only

**What they can do:**
- ✅ Everything Conveners and Learners can do, PLUS:
- ✅ Assign and upgrade user roles
- ✅ Manage platform-level configurations
- ✅ Oversee all programmes and users
- ✅ Access system-wide analytics
- ✅ Handle platform governance

**How to access:**
- Restricted to platform owners and designated governance team
- Requires authorization from platform owner

---

## Key Workflows

### For Administrators

#### 1. Accessing Admin Features
**Current Implementation:**
- Admin features are accessed via API endpoints
- No dedicated admin UI yet (API-first approach)
- Use tools like Postman, curl, or custom scripts

**API Base URL:**
```
Production: https://api.cohortle.com/v1/api
Development: http://localhost:3000/v1/api
```

#### 2. Assigning Convener Role to a User

**Step 1: Get the user's ID**
```bash
# Find user by email or list all learners
GET /v1/api/users/with-role/learner
```

**Step 2: Assign convener role**
```bash
PUT /v1/api/users/{userId}/role
Content-Type: application/json
Authorization: Bearer <admin-jwt-token>

{
  "role": "convener",
  "reason": "User requested convener access to create leadership programme"
}
```

**Step 3: User is notified**
- User receives automatic notification
- JWT token automatically refreshes
- User can immediately access convener dashboard

**Example using PowerShell:**
```powershell
# Set variables
$userId = "123e4567-e89b-12d3-a456-426614174000"
$apiUrl = "http://localhost:3000/v1/api"
$token = "your-admin-jwt-token"

# Assign convener role
$body = @{
    role = "convener"
    reason = "User requested convener access"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/users/$userId/role" `
    -Method PUT `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $body `
    -ContentType "application/json"
```

#### 3. Viewing All Conveners
```bash
GET /v1/api/users/with-role/convener?page=1&limit=20
Authorization: Bearer <admin-jwt-token>
```

#### 4. Viewing Role Assignment History
```bash
GET /v1/api/users/{userId}/role/history
Authorization: Bearer <admin-jwt-token>
```

---

### For Conveners

#### 1. Starting a Programme

**Step 1: Access Convener Dashboard**
- Navigate to `/convener/dashboard`
- View your programmes and cohorts

**Step 2: Create Programme**
- Click "Create Programme"
- Define programme structure
- Add weeks and lessons
- Programme starts in "Draft" status

**Step 3: Create Cohort**
- Select your programme
- Click "Create Cohort"
- Set start and end dates
- System generates enrollment code

**Step 4: Transition to Recruiting**
- Change programme status to "Recruiting"
- Share enrollment code with learners
- Monitor enrollments

**Step 5: Start Programme**
- When ready, transition to "Active"
- Learners can access content
- Facilitate learning experience

**Programme Lifecycle States:**
- **Draft**: Structure being created (full editing)
- **Recruiting**: Accepting enrollments (structure can be modified)
- **Active**: Programme running (content updates only)
- **Completed**: Programme finished (read-only)
- **Archived**: Long-term storage (read-only)

---

### For Learners

#### 1. Joining a Cohort

**Step 1: Get Enrollment Code**
- Convener shares enrollment code
- Code is specific to a cohort

**Step 2: Join Programme**
- Navigate to "Join Programme"
- Enter enrollment code
- System validates code against cohort
- You're enrolled!

**Step 3: Access Content**
- View programme structure
- Access lessons
- Complete coursework
- Participate in community

**Important:** Enrollment codes join you to cohorts, NOT assign roles. Your role remains "Learner" regardless of which programmes you join.

---

## Critical Architectural Principles

### 1. Role Assignment vs. Enrollment

**SEPARATE CONCEPTS:**

**Role Assignment** (System-Level):
- Learner, Convener, Administrator
- Managed by administrators only
- NOT assigned via enrollment codes
- Persistent across all programmes

**Cohort Enrollment** (Programme-Level):
- Uses enrollment codes
- Validates against cohort entity only
- Learners join specific cohorts
- Does NOT affect system role

### 2. Persistent Learner Identity

Learners build a persistent platform identity:
```
Learner Profile
├── Programmes Completed
│   ├── WECARE Leadership Programme
│   ├── Startup Zaria Incubator
│   └── Digital Skills Fellowship
├── Current Enrollments
└── Learning Portfolio
```

Your learner identity persists across all programmes, accumulating your learning history.

### 3. Permission Inheritance

Higher-level roles inherit lower-level permissions:
- Conveners have ALL Learner permissions + convener-specific permissions
- Administrators have ALL permissions

This means:
- Conveners can join programmes as learners
- Administrators can do everything conveners and learners can do

---

## Current System Capabilities

### ✅ Fully Implemented

1. **Role System**
   - Three-tier role hierarchy
   - Automatic learner role assignment
   - Admin-controlled role upgrades
   - Permission inheritance

2. **Authentication & Authorization**
   - JWT token-based authentication
   - Role information in JWT payload
   - Automatic token refresh on role changes
   - Multi-level access control

3. **Programme Management**
   - Programme creation and editing
   - Cohort management
   - Lesson content management
   - Programme lifecycle states

4. **Enrollment System**
   - Enrollment code generation
   - Code validation against cohorts
   - Learner enrollment tracking

5. **Community Features**
   - Cohort discussions
   - Post and comment system
   - Community engagement

6. **Progress Tracking**
   - Lesson completion tracking
   - Progress indicators
   - Learning portfolio

7. **Audit Trail**
   - Complete role assignment history
   - All role changes logged
   - Security event logging

### 🔄 Architecture Prepared (Future)

1. **Learner Application Workflow**
   - Application submission system
   - Convener review and approval
   - Application status tracking

2. **Organisation Layer**
   - Multi-organisation support
   - Organisation-level roles
   - Cross-organisation permissions

---

## Testing & Quality

### Test Coverage ✅

**Unit Tests:**
- Role validation logic
- Role assignment logic
- JWT token generation
- Access control services
- Error handling
- Permission inheritance

**Integration Tests:**
- Complete role workflows
- Security validation
- Token refresh scenarios
- Multi-level authorization

**Property-Based Tests:**
- Role transition integrity
- Access control enforcement
- JWT token consistency
- Role assignment validation
- Error handling consistency
- Permission inheritance
- Multi-level access control

**Total:** 45+ test suites with comprehensive coverage

---

## Security Measures

### Implemented ✅

1. **Token Security**
   - Strong JWT secret (256 bits minimum)
   - httpOnly cookies prevent XSS
   - Secure flag in production
   - sameSite: 'strict' prevents CSRF

2. **Password Security**
   - bcrypt hashing (10 rounds)
   - Strong password requirements
   - Rate limiting on login attempts

3. **Role Security**
   - Multi-level validation
   - Complete audit trail
   - Admin approval for upgrades
   - Minimum administrator constraint

4. **API Security**
   - HTTPS in production
   - Rate limiting
   - Input validation
   - Output sanitization

---

## Documentation

### Available Documentation ✅

1. **Technical Documentation**
   - Role System Schema
   - Role Management API
   - Authentication & Authorization
   - Role Hierarchy & Permission Inheritance
   - Multi-Level Access Control

2. **User Documentation**
   - Role Management User Guide
   - Convener Setup Guide
   - Quick Start Guide

3. **Implementation Documentation**
   - Role System Implementation Summary
   - Role System Architecture Update
   - Task completion summaries

---

## Quick Reference: Common Admin Tasks

### 1. Make Someone a Convener

```bash
# Using curl
curl -X PUT http://localhost:3000/v1/api/users/{userId}/role \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "convener", "reason": "User needs to create programmes"}'
```

### 2. List All Conveners

```bash
curl -X GET http://localhost:3000/v1/api/users/with-role/convener \
  -H "Authorization: Bearer {admin-token}"
```

### 3. View User's Role History

```bash
curl -X GET http://localhost:3000/v1/api/users/{userId}/role/history \
  -H "Authorization: Bearer {admin-token}"
```

### 4. Check Your Own Permissions

```bash
curl -X GET http://localhost:3000/v1/api/permissions \
  -H "Authorization: Bearer {your-token}"
```

---

## Database Schema

### Core Tables

**roles**
- role_id, name, description, hierarchy_level
- Defines: learner, convener, administrator

**permissions**
- permission_id, name, description, resource_type, action, scope
- Defines all available permissions

**role_permissions**
- Maps roles to permissions
- Supports permission inheritance

**user_role_assignments**
- Current role assignments
- Links users to roles

**role_assignment_history**
- Complete audit trail
- All role changes logged

**programmes**
- Includes lifecycle_status, onboarding_mode
- Supports programme lifecycle management

---

## Next Steps for You

### As an Administrator

1. **Get Your Admin Token**
   - Log in to the platform
   - Extract JWT token from browser cookies or API response

2. **Test Role Assignment**
   - Create a test user account
   - Assign convener role via API
   - Verify user can access convener dashboard

3. **Set Up Admin Tools**
   - Consider creating admin scripts for common tasks
   - Or build a simple admin UI
   - Use provided API documentation

### As a Convener

1. **Request Convener Access**
   - Contact platform administrator
   - Explain your programme idea
   - Wait for approval

2. **Create Your First Programme**
   - Access convener dashboard
   - Create programme structure
   - Add content and lessons

3. **Launch Your Cohort**
   - Create cohort
   - Generate enrollment code
   - Share with learners

### As a Learner

1. **Register on Platform**
   - Create account
   - Automatic learner role assigned

2. **Join a Programme**
   - Get enrollment code from convener
   - Enter code to join cohort
   - Start learning!

---

## Support & Resources

### Getting Help

- **Email:** support@cohortle.com
- **Documentation:** https://docs.cohortle.com
- **API Docs:** See `cohortle-api/docs/ROLE_MANAGEMENT_API.md`

### Troubleshooting

**"Insufficient Permissions" Error:**
- Check your current role in profile settings
- Contact admin if you need role upgrade
- Try logging out and back in

**Enrollment Code Not Working:**
- Verify code with convener
- Check if you're already enrolled
- Ensure programme is in "Recruiting" or "Active" status

**Cannot Access Convener Dashboard:**
- Verify you have convener role
- Check JWT token is valid
- Contact admin if role is incorrect

---

## Summary

**Cohortle is production-ready with:**

✅ Complete role-based access control system  
✅ Three-tier role hierarchy (Learner, Convener, Administrator)  
✅ Automatic learner role assignment on registration  
✅ Admin-controlled convener role upgrades via API  
✅ Programme lifecycle management  
✅ Enrollment system with cohort-specific codes  
✅ Comprehensive security measures  
✅ Full audit trail  
✅ Extensive test coverage  
✅ Complete documentation  

**Key Capabilities:**
- ✅ Admin can assign convener role to users via API
- ✅ Convener can create programmes and cohorts
- ✅ Learner can join cohorts using enrollment codes
- ✅ All roles work as designed with proper permissions

**The system is ready for use!**

---

*Last Updated: March 5, 2026*  
*System Status: Production Ready ✅*
