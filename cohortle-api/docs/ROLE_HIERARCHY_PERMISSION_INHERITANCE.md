# Role Hierarchy and Permission Inheritance

## Overview

This document describes the implementation of role hierarchy and permission inheritance for the Cohortle platform, as specified in requirement 1.3 of the role-validation-assignment-logic spec.

## Implementation

### Core Concept

The system implements a three-level role hierarchy:
- **Learner** (Level 1): Base role with fundamental permissions
- **Convener** (Level 2): Inherits all Learner permissions + additional convener-specific permissions
- **Administrator** (Level 3): Inherits all Learner and Convener permissions + administrative permissions

### Key Features

1. **Automatic Permission Inheritance**: Higher-level roles automatically inherit all permissions from lower-level roles
2. **Hierarchy Validation**: System can validate that role hierarchy is consistent
3. **Permission Enforcement**: System can automatically add missing inherited permissions to roles

### New Methods in RoleValidationService

#### 1. `getRolePermissionsWithInheritance(roleName)`

Returns all permissions for a role, including inherited permissions from lower-level roles.

**Parameters:**
- `roleName` (string): Name of the role

**Returns:**
- Array of permission objects, each with an `inherited_from` property indicating the source role (null for own permissions)

**Example:**
```javascript
const permissions = await RoleValidationService.getRolePermissionsWithInheritance('convener');
// Returns: [
//   { name: 'view_dashboard', inherited_from: 'learner', ... },
//   { name: 'enroll_programme', inherited_from: 'learner', ... },
//   { name: 'create_programme', inherited_from: null, ... }
// ]
```

#### 2. `validateRoleHierarchyConsistency(roleName = null)`

Validates that higher-level roles have all permissions from lower-level roles.

**Parameters:**
- `roleName` (string, optional): Specific role to validate, or null to validate all roles

**Returns:**
- Object with:
  - `valid` (boolean): Whether hierarchy is consistent
  - `error` (object|null): Error details if invalid
  - `inconsistencies` (array): List of missing permissions per role
  - `message` (string): Human-readable result message

**Example:**
```javascript
const result = await RoleValidationService.validateRoleHierarchyConsistency();
// Returns: {
//   valid: false,
//   inconsistencies: [
//     {
//       role_name: 'convener',
//       hierarchy_level: 2,
//       missing_permissions: [
//         { permission_name: 'view_dashboard', should_inherit_from: 'learner' }
//       ]
//     }
//   ],
//   message: 'Found 1 role(s) with missing inherited permissions'
// }
```

#### 3. `ensurePermissionInheritance(roleName, adminId)`

Automatically adds missing inherited permissions to a role.

**Parameters:**
- `roleName` (string): Role to ensure inheritance for
- `adminId` (number): Admin user ID performing the operation

**Returns:**
- Object with:
  - `success` (boolean): Whether operation succeeded
  - `permissions_added` (number): Count of permissions added
  - `message` (string): Result message
  - `added_permissions` (array, optional): IDs of added permissions

**Example:**
```javascript
const result = await RoleValidationService.ensurePermissionInheritance('convener', adminUserId);
// Returns: {
//   success: true,
//   permissions_added: 2,
//   message: 'Added 2 inherited permission(s) to role "convener"',
//   added_permissions: ['perm-uuid-1', 'perm-uuid-2']
// }
```

## Usage

### Checking Role Permissions with Inheritance

The existing `_getRolePermissions` method has been updated to automatically use inheritance:

```javascript
// This now returns permissions with inheritance
const permissions = await RoleValidationService._getRolePermissions('convener');
```

### Validating Hierarchy Consistency

To check if all roles have proper permission inheritance:

```javascript
const result = await RoleValidationService.validateRoleHierarchyConsistency();

if (!result.valid) {
  console.log('Hierarchy inconsistencies found:');
  result.inconsistencies.forEach(issue => {
    console.log(`- ${issue.role_name}: missing ${issue.missing_permissions.length} permissions`);
  });
}
```

### Fixing Missing Inherited Permissions

To automatically add missing inherited permissions:

```javascript
// For a specific role
const result = await RoleValidationService.ensurePermissionInheritance('convener', adminUserId);

// For all roles
const roles = ['convener', 'administrator'];
for (const roleName of roles) {
  await RoleValidationService.ensurePermissionInheritance(roleName, adminUserId);
}
```

## Manual Testing

### 1. Check Current Hierarchy Status

```javascript
// In Node.js REPL or script
const RoleValidationService = require('./services/RoleValidationService');

// Check all roles
const result = await RoleValidationService.validateRoleHierarchyConsistency();
console.log(JSON.stringify(result, null, 2));
```

### 2. View Permissions with Inheritance

```javascript
// Check learner permissions
const learnerPerms = await RoleValidationService.getRolePermissionsWithInheritance('learner');
console.log('Learner permissions:', learnerPerms.length);

// Check convener permissions (should include learner permissions)
const convenerPerms = await RoleValidationService.getRolePermissionsWithInheritance('convener');
console.log('Convener permissions:', convenerPerms.length);
console.log('Inherited from learner:', convenerPerms.filter(p => p.inherited_from === 'learner').length);

// Check administrator permissions (should include all)
const adminPerms = await RoleValidationService.getRolePermissionsWithInheritance('administrator');
console.log('Administrator permissions:', adminPerms.length);
```

### 3. Fix Missing Permissions

```javascript
// Get admin user ID (replace with actual admin ID)
const adminUserId = 1;

// Ensure convener has all learner permissions
const convenerResult = await RoleValidationService.ensurePermissionInheritance('convener', adminUserId);
console.log(convenerResult);

// Ensure administrator has all permissions
const adminResult = await RoleValidationService.ensurePermissionInheritance('administrator', adminUserId);
console.log(adminResult);
```

## Database Impact

The implementation:
- **Does NOT modify** the existing database schema
- **Does NOT modify** existing role or permission records
- **Only adds** missing role-permission mappings to the `role_permissions` table
- **Maintains** complete audit trail via `granted_by` and `granted_at` fields

## Integration with Existing Code

The permission inheritance is automatically integrated into the existing role validation flow:

1. When `canPerformAction` is called, it uses `_getRolePermissions`
2. `_getRolePermissions` now calls `getRolePermissionsWithInheritance`
3. This means all role checks now automatically respect the hierarchy

No changes are needed to existing code that uses `RoleValidationService.canPerformAction`.

## Requirements Satisfied

This implementation satisfies requirement 1.3:

> **1.3** WHERE role hierarchy exists, THE System SHALL enforce that higher-level roles inherit permissions from lower-level roles

The system now:
- ✅ Automatically includes inherited permissions when checking role permissions
- ✅ Can validate that hierarchy is consistent
- ✅ Can automatically fix missing inherited permissions
- ✅ Maintains audit trail of permission grants

## Future Enhancements

Potential future improvements:
1. Automatic permission inheritance on role creation
2. Webhook/event system to notify when hierarchy becomes inconsistent
3. Admin UI for visualizing role hierarchy and permissions
4. Scheduled job to periodically validate and fix hierarchy
5. Property-based tests for permission inheritance (when test database is available)
