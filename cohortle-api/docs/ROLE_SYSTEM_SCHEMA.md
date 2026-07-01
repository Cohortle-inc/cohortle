# Role Validation and Assignment System - Database Schema

## Overview

This document describes the database schema for the role validation and assignment system. The system provides comprehensive role-based access control (RBAC) for the Cohortle platform.

## Database Tables

### 1. roles

Defines the available roles in the system.

| Column | Type | Description |
|--------|------|-------------|
| role_id | UUID | Primary key |
| name | VARCHAR(50) | Unique role name (learner, convener, administrator) |
| description | TEXT | Role description |
| hierarchy_level | INTEGER | Role hierarchy level (1=learner, 2=convener, 3=administrator) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on role_id
- UNIQUE INDEX on name

**Default Roles:**
- **learner** (level 1): Participants enrolled in programmes. Default role for all new users. Persistent identity across programmes.
- **convener** (level 2): Programme creators and facilitators. Assigned by administrators only.
- **administrator** (level 3): Platform governance. Can assign roles and manage platform.

### 2. permissions

Defines the available permissions in the system.

| Column | Type | Description |
|--------|------|-------------|
| permission_id | UUID | Primary key |
| name | VARCHAR(100) | Unique permission name |
| description | TEXT | Permission description |
| resource_type | VARCHAR(50) | Type of resource (programme, lesson, user, etc.) |
| action | VARCHAR(50) | Action type (create, read, update, delete, manage) |
| scope | VARCHAR(20) | Permission scope (own, all, enrolled, assigned) |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes:**
- PRIMARY KEY on permission_id
- UNIQUE INDEX on name

**Permission Scopes:**
- **own**: User can only access their own resources
- **all**: User can access all resources
- **enrolled**: User can access resources they're enrolled in
- **assigned**: User can access resources assigned to them

### 3. role_permissions

Maps permissions to roles (many-to-many relationship).

| Column | Type | Description |
|--------|------|-------------|
| mapping_id | UUID | Primary key |
| role_id | UUID | Foreign key to roles table |
| permission_id | UUID | Foreign key to permissions table |
| granted_at | TIMESTAMP | When permission was granted |
| granted_by | INTEGER | User ID who granted the permission (nullable) |

**Indexes:**
- PRIMARY KEY on mapping_id
- UNIQUE INDEX on (role_id, permission_id)

**Foreign Keys:**
- role_id → roles(role_id) ON DELETE CASCADE
- permission_id → permissions(permission_id) ON DELETE CASCADE
- granted_by → users(id)

### 4. user_role_assignments

Tracks current and historical role assignments for users.

| Column | Type | Description |
|--------|------|-------------|
| assignment_id | UUID | Primary key |
| user_id | INTEGER | Foreign key to users table |
| role_id | UUID | Foreign key to roles table |
| assigned_by | INTEGER | User ID who assigned the role (nullable) |
| assigned_at | TIMESTAMP | When role was assigned |
| effective_from | TIMESTAMP | When assignment becomes effective |
| effective_until | TIMESTAMP | When assignment expires (nullable) |
| status | VARCHAR(20) | Assignment status (active, inactive, pending) |
| notes | TEXT | Additional notes about the assignment |

**Indexes:**
- PRIMARY KEY on assignment_id
- INDEX on user_id
- INDEX on status
- UNIQUE PARTIAL INDEX on user_id WHERE status = 'active' (ensures one active role per user)

**Foreign Keys:**
- user_id → users(id) ON DELETE CASCADE
- role_id → roles(role_id) ON DELETE CASCADE
- assigned_by → users(id)

### 5. role_assignment_history

Audit trail for role changes.

| Column | Type | Description |
|--------|------|-------------|
| history_id | UUID | Primary key |
| user_id | INTEGER | Foreign key to users table |
| previous_role_id | UUID | Previous role (nullable for first assignment) |
| new_role_id | UUID | New role |
| changed_by | INTEGER | User ID who made the change |
| changed_at | TIMESTAMP | When change occurred |
| reason | TEXT | Reason for the change (nullable) |
| metadata | JSON | Additional metadata about the change |

**Indexes:**
- PRIMARY KEY on history_id
- INDEX on user_id

**Foreign Keys:**
- user_id → users(id) ON DELETE CASCADE
- previous_role_id → roles(role_id)
- new_role_id → roles(role_id)
- changed_by → users(id)

### 6. users (updated)

Added role_id column for denormalized role access.

| Column | Type | Description |
|--------|------|-------------|
| ... | ... | (existing columns) |
| role_id | UUID | Current role (denormalized for performance) |

**Indexes:**
- INDEX on role_id

**Foreign Keys:**
- role_id → roles(role_id)

## Permission Hierarchy

The system implements permission inheritance based on role hierarchy:

```
Administrator (level 3)
  ├─ All permissions
  │
Convener (level 2)
  ├─ All learner permissions
  ├─ create_programme
  ├─ manage_cohorts
  ├─ manage_lessons
  ├─ view_analytics
  ├─ manage_enrollments
  └─ manage_programme_lifecycle
  │
Learner (level 1)
  ├─ view_dashboard
  ├─ join_cohort
  ├─ view_lessons
  ├─ complete_lessons
  ├─ participate_community
  └─ build_portfolio
```

## Default Permissions

### Learner Permissions
- `view_dashboard`: View learner dashboard
- `join_cohort`: Join cohorts using enrollment code
- `view_lessons`: View lesson content
- `complete_lessons`: Mark lessons as complete
- `participate_community`: Participate in community discussions
- `build_portfolio`: Accumulate learning history across programmes

### Convener Permissions (includes all learner permissions)
- `create_programme`: Create new programmes
- `manage_cohorts`: Manage programme cohorts
- `manage_lessons`: Create and edit lessons
- `view_analytics`: View programme analytics
- `manage_enrollments`: Manage programme enrollments
- `manage_programme_lifecycle`: Change programme lifecycle states

### Administrator Permissions (includes all permissions)
- `manage_users`: Manage all users
- `assign_roles`: Assign and upgrade user roles
- `system_settings`: Manage system settings
- `view_all_analytics`: View all analytics
- `manage_all_content`: Manage all content

## Migration Files

The schema is created through the following migration files (in order):

1. `20260304000000-create-roles-table.js` - Creates roles table and seeds default roles
2. `20260304000001-create-permissions-table.js` - Creates permissions table and seeds default permissions
3. `20260304000002-create-role-permissions-table.js` - Creates role-permission mappings
4. `20260304000003-create-user-role-assignments-table.js` - Creates user role assignments table
5. `20260304000004-create-role-assignment-history-table.js` - Creates role assignment history table
6. `20260304000005-add-role-id-to-users.js` - Adds role_id to users table and migrates existing data

## Sequelize Models

The following Sequelize models are available:

- `roles.js` - Role model
- `permissions.js` - Permission model
- `role_permissions.js` - Role-Permission mapping model
- `user_role_assignments.js` - User role assignment model
- `role_assignment_history.js` - Role assignment history model
- `users.js` - Updated user model with role_id

## Services

The following services implement role validation and assignment logic:

- `RoleValidationService.js` - Core role validation logic
- `RoleAssignmentService.js` - Role assignment and history management
- `RoleBasedAccessControlService.js` - Role-based resource access control
- `JwtService.js` - Enhanced JWT token generation with role information

## TypeScript Interfaces

TypeScript interfaces are defined in `types/roles.ts`:

- `Role` - Role definition
- `Permission` - Permission definition
- `RolePermission` - Role-permission mapping
- `UserRoleAssignment` - User role assignment
- `RoleAssignmentHistory` - Role assignment history
- `RoleAwareJWTPayload` - Enhanced JWT payload with role information
- Additional interfaces for validation, access control, and API responses

## Seeder

A database seeder is available at `seeders/20260304000000-seed-roles-and-permissions.js` that:
- Seeds default roles (learner, convener, administrator)
- Seeds default permissions with updated terminology
- Creates role-permission mappings with permission inheritance
- Is idempotent (can be run multiple times safely)

**Key Changes:**
- `student` → `learner` (emphasizes persistent identity across programmes)
- `enroll_programme` → `join_cohort` (clarifies cohort-level enrollment)
- Added `build_portfolio` permission for learners
- Added `manage_programme_lifecycle` permission for conveners
- Added `assign_roles` permission for administrators

## Usage

### Running Migrations

```bash
# Run all migrations
npm run migrate

# Rollback last migration
npm run migrate:undo

# Rollback all migrations
npm run migrate:undo:all
```

### Running Seeders

```bash
# Run all seeders
npm run seed

# Run specific seeder
npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js

# Undo all seeders
npm run seed:undo:all
```

## Data Integrity

The schema enforces the following data integrity rules:

1. **One Active Role Per User**: Partial unique index ensures each user has only one active role assignment
2. **Cascade Deletes**: Role and permission deletions cascade to related tables
3. **Audit Trail**: All role changes are logged in role_assignment_history
4. **Permission Inheritance**: Higher-level roles automatically inherit permissions from lower-level roles
5. **Denormalized Role**: users.role_id provides fast role lookups without joins

## Performance Considerations

- Indexes on frequently queried columns (user_id, role_id, status)
- Denormalized role_id in users table for fast role checks
- Partial unique index for active assignments only
- JSON metadata field for flexible audit information

## Security Considerations

- Role changes require administrator privileges
- All role changes are audited
- Permission checks validate both role and resource ownership
- JWT tokens include role information for stateless validation
- Sensitive operations log user_id and timestamp for accountability
