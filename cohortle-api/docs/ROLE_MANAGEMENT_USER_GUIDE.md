# Role Management User Guide

## Overview

This guide explains how to use the role management system in Cohortle. The system provides role-based access control (RBAC) to ensure users have appropriate permissions for their responsibilities.

## Table of Contents

1. [Understanding Roles](#understanding-roles)
2. [Role Assignment](#role-assignment)
3. [For Learners](#for-learners)
4. [For Conveners](#for-conveners)
5. [For Administrators](#for-administrators)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

---

## Understanding Roles

Cohortle uses a three-tier role system with permission inheritance:

### Learner (Default Role)

**Who:** All new users automatically receive this role upon registration.

**What you can do:**
- Join programmes using enrollment codes
- Access lessons and complete coursework
- Participate in cohort community discussions
- Build your learning portfolio across multiple programmes
- View your personal dashboard and progress

**Key Concept:** Your learner identity persists across all programmes. As you complete programmes, your learning history accumulates in your profile.

### Convener

**Who:** Programme creators and facilitators. Assigned by administrators only.

**What you can do:**
- Everything a Learner can do, plus:
- Create and manage programmes
- Organize cohorts and manage enrollments
- Create and edit lessons and content
- Manage programme lifecycle (Draft → Recruiting → Active → Completed → Archived)
- View programme analytics
- Facilitate community discussions

**How to get this role:** Contact a platform administrator to request convener access. Explain your use case and why you need to create programmes.

### Administrator

**Who:** Platform governance team.

**What you can do:**
- Everything a Convener and Learner can do, plus:
- Assign and upgrade user roles
- Manage platform-level configurations
- Oversee all programmes and users
- Access system-wide analytics
- Handle platform governance

**How to get this role:** Administrator access is restricted to platform owners and designated governance team members.

---

## Role Assignment

### Automatic Assignment

When you register on Cohortle:
1. You automatically receive the **Learner** role
2. Your learner identity is created
3. You can immediately start exploring and joining programmes

**Important:** Enrollment codes are used to join specific cohorts, NOT to assign roles.

### Role Upgrades

To upgrade from Learner to Convener:

1. **Contact an Administrator**
   - Email: admin@cohortle.com
   - Explain your use case
   - Describe the programmes you want to create

2. **Administrator Reviews Request**
   - Verifies your need for convener access
   - Checks your platform activity

3. **Role Assignment**
   - Administrator upgrades your role
   - You receive email notification
   - New permissions take effect immediately

4. **Token Refresh**
   - Your JWT token automatically refreshes
   - No need to log out and back in

### Role History

All role changes are logged with:
- Previous role
- New role
- Administrator who made the change
- Timestamp
- Reason for the change

You can view your role history in your profile settings.

---

## For Learners

### Getting Started

1. **Register on Cohortle**
   - Create your account
   - Verify your email
   - You're automatically assigned Learner role

2. **Join a Programme**
   - Get an enrollment code from a convener
   - Navigate to "Join Programme"
   - Enter the enrollment code
   - You're enrolled in the cohort!

3. **Access Your Dashboard**
   - View enrolled programmes
   - See upcoming sessions
   - Track your progress
   - Access community discussions

### What You Can Access

✅ **You CAN:**
- Join programmes with enrollment codes
- View lessons in programmes you're enrolled in
- Complete lessons and track progress
- Post and comment in cohort communities
- Update your profile and settings
- View your learning portfolio

❌ **You CANNOT:**
- Create programmes or cohorts
- Edit lesson content
- View programme analytics
- Manage other users' enrollments
- Access convener dashboard

### Requesting Convener Access

If you need to create programmes:

1. **Prepare Your Request**
   - Describe the programme you want to create
   - Explain your facilitation experience
   - Outline your target audience

2. **Contact Administrator**
   - Use the "Request Convener Access" form in settings
   - Or email admin@cohortle.com
   - Include your prepared information

3. **Wait for Review**
   - Administrators typically respond within 2-3 business days
   - You'll receive email notification of the decision

---

## For Conveners

### Getting Started

After receiving convener access:

1. **Access Convener Dashboard**
   - Navigate to `/convener/dashboard`
   - View your programmes and cohorts
   - Access creation tools

2. **Create Your First Programme**
   - Click "Create Programme"
   - Define programme structure
   - Add weeks and lessons
   - Set programme lifecycle status

3. **Create a Cohort**
   - Select your programme
   - Click "Create Cohort"
   - Set start and end dates
   - Generate enrollment code

4. **Invite Learners**
   - Share enrollment code with learners
   - Learners use code to join cohort
   - Monitor enrollments in cohort dashboard

### Programme Lifecycle Management

Conveners can transition programmes through lifecycle states:

**Draft** → **Recruiting** → **Active** → **Completed** → **Archived**

#### Draft
- Programme structure being created
- Full editing allowed
- Not visible to learners
- Use for: Initial programme creation

#### Recruiting
- Programme ready for enrollments
- Learners can join cohorts
- Structure can still be modified
- Use for: Accepting applications/enrollments

#### Active
- Programme running
- Structural changes restricted
- Content updates allowed
- Use for: During programme delivery

#### Completed
- Programme finished
- Read-only for learners
- Analytics available
- Use for: After programme ends

#### Archived
- Programme retained for history
- Read-only for all users
- Use for: Long-term storage

### What You Can Access

✅ **You CAN:**
- Everything learners can do, plus:
- Create and manage programmes
- Create and manage cohorts
- Create and edit lessons
- Manage enrollments in your programmes
- View analytics for your programmes
- Transition programme lifecycle states
- Facilitate community discussions

❌ **You CANNOT:**
- Assign roles to other users
- Access other conveners' programmes (unless enrolled)
- Modify platform-level settings
- View system-wide analytics

### Best Practices

1. **Programme Planning**
   - Start in Draft status
   - Complete all content before Recruiting
   - Test with a small cohort first

2. **Cohort Management**
   - Generate unique enrollment codes per cohort
   - Set clear start and end dates
   - Monitor enrollment numbers

3. **Content Creation**
   - Use clear lesson titles
   - Provide comprehensive descriptions
   - Test all external links and resources

4. **Community Facilitation**
   - Engage regularly in discussions
   - Respond to learner questions
   - Foster peer-to-peer learning

---

## For Administrators

### Responsibilities

As an administrator, you're responsible for:
- Platform governance
- Role management
- User support
- System configuration

### Assigning Roles

#### Upgrading Learner to Convener

1. **Review Request**
   - Check user's platform activity
   - Verify need for convener access
   - Assess programme proposal

2. **Assign Role via API**
   ```bash
   PUT /v1/api/users/{userId}/role
   {
     "role": "convener",
     "reason": "User requested convener access to create leadership programme"
   }
   ```

3. **Notify User**
   - User receives automatic email notification
   - Provide guidance on getting started
   - Share convener resources

#### Assigning Administrator Role

**Critical:** Only assign administrator role to trusted platform governance team members.

1. **Verify Authorization**
   - Confirm with platform owner
   - Document reason for assignment

2. **Assign Role**
   ```bash
   PUT /v1/api/users/{userId}/role
   {
     "role": "administrator",
     "reason": "New platform governance team member"
   }
   ```

3. **Provide Training**
   - Share administrator documentation
   - Review platform policies
   - Explain governance procedures

### Managing Users

#### View Users by Role

```bash
GET /v1/api/users/with-role/convener?page=1&limit=20
```

Returns all users with convener role.

#### View User's Role

```bash
GET /v1/api/users/{userId}/role
```

Returns user's current role and permissions.

#### View Role History

```bash
GET /v1/api/users/{userId}/role/history
```

Returns complete audit trail of role changes.

### System Constraints

**Important:** The system enforces these constraints:

1. **Minimum Administrators**
   - System must always have at least one administrator
   - Cannot downgrade last administrator

2. **Role Hierarchy**
   - Higher-level roles inherit lower-level permissions
   - Cannot create circular permission dependencies

3. **Active Role Limit**
   - Each user can have only one active role
   - Previous roles are logged in history

### Monitoring and Auditing

All role changes are logged with:
- User ID
- Previous role
- New role
- Administrator who made change
- Timestamp
- Reason
- IP address and request metadata

Access audit logs via:
```bash
GET /v1/api/audit/role-changes?start_date=2024-01-01&end_date=2024-12-31
```

---

## Common Scenarios

### Scenario 1: New User Wants to Create a Programme

**Problem:** User registered as learner but needs to create programmes.

**Solution:**
1. User contacts administrator
2. Administrator reviews request
3. Administrator upgrades user to convener role
4. User can now access convener dashboard

### Scenario 2: Convener Wants to Join Another Programme as Learner

**Problem:** Convener wants to participate in another convener's programme.

**Solution:**
- Conveners retain all learner permissions
- Simply use enrollment code to join the cohort
- No role change needed

### Scenario 3: User Accidentally Assigned Wrong Role

**Problem:** Administrator assigned convener role to wrong user.

**Solution:**
1. Administrator changes role back to learner
2. Change is logged in role history
3. User's learner identity and history are preserved

### Scenario 4: Convener No Longer Needs Access

**Problem:** Convener completed their programme and no longer needs convener access.

**Solution:**
- Convener can keep convener role (no harm)
- Or administrator can downgrade to learner
- All learner history is preserved

### Scenario 5: Token Shows Wrong Role

**Problem:** User's JWT token shows old role after role change.

**Solution:**
- System automatically detects role conflict
- Token is refreshed with new role
- No user action required

---

## Troubleshooting

### "Insufficient Permissions" Error

**Symptom:** You see "Insufficient permissions. Required role: convener"

**Causes:**
- You're trying to access convener features with learner role
- Your JWT token hasn't refreshed after role change

**Solutions:**
1. Verify your current role in profile settings
2. If you need convener access, contact administrator
3. If you were recently upgraded, try logging out and back in

### Cannot Access Convener Dashboard

**Symptom:** Convener dashboard shows 403 Forbidden

**Causes:**
- You don't have convener role
- Your session expired

**Solutions:**
1. Check your role in profile settings
2. Log out and log back in
3. Contact administrator if role is incorrect

### Enrollment Code Not Working

**Symptom:** "Invalid enrollment code" error

**Causes:**
- Code is for a different cohort
- Code has expired
- You're already enrolled

**Solutions:**
1. Verify code with convener
2. Check if you're already enrolled in the cohort
3. Ensure you have learner role (or higher)

### Role Change Not Taking Effect

**Symptom:** Role was changed but you still see old permissions

**Causes:**
- JWT token hasn't refreshed
- Browser cache issue

**Solutions:**
1. Log out and log back in
2. Clear browser cache
3. Wait 5 minutes for token to refresh automatically

### Cannot View Other Users' Roles

**Symptom:** 403 Forbidden when viewing user roles

**Causes:**
- You don't have administrator role
- You're trying to view someone else's role

**Solutions:**
- Only administrators can view other users' roles
- You can always view your own role in profile settings

---

## Getting Help

### Support Channels

- **Email:** support@cohortle.com
- **Documentation:** https://docs.cohortle.com
- **Community Forum:** https://community.cohortle.com

### Reporting Issues

When reporting role-related issues, include:
- Your user ID
- Your current role
- Action you were trying to perform
- Error message received
- Screenshot (if applicable)

### Feature Requests

To request new role-related features:
1. Visit https://feedback.cohortle.com
2. Search for existing requests
3. Vote for existing requests or create new one
4. Provide detailed use case

---

## Best Practices

### For All Users

1. **Understand Your Role**
   - Know what you can and cannot do
   - Request role changes when needed

2. **Respect Permissions**
   - Don't try to bypass access controls
   - Contact administrators for legitimate access needs

3. **Keep Profile Updated**
   - Maintain accurate contact information
   - Update profile when responsibilities change

### For Conveners

1. **Plan Before Creating**
   - Design programme structure in advance
   - Test content before launching

2. **Manage Enrollments Carefully**
   - Track enrollment codes
   - Monitor cohort sizes
   - Communicate clearly with learners

3. **Engage Your Community**
   - Respond to learner questions
   - Foster discussions
   - Provide timely feedback

### For Administrators

1. **Verify Before Assigning**
   - Review role change requests carefully
   - Document reasons for changes
   - Communicate with users

2. **Monitor System Health**
   - Review audit logs regularly
   - Watch for unusual patterns
   - Address issues promptly

3. **Maintain Documentation**
   - Keep role policies updated
   - Document governance decisions
   - Share knowledge with team

---

## Appendix

### Permission Reference

#### Learner Permissions
- `view_dashboard` - View learner dashboard
- `join_cohort` - Join cohorts using enrollment code
- `view_lessons` - View lesson content
- `complete_lessons` - Mark lessons as complete
- `participate_community` - Participate in discussions
- `build_portfolio` - Accumulate learning history

#### Convener Permissions (includes all learner permissions)
- `create_programme` - Create new programmes
- `manage_cohorts` - Manage programme cohorts
- `manage_lessons` - Create and edit lessons
- `view_analytics` - View programme analytics
- `manage_enrollments` - Manage enrollments
- `manage_programme_lifecycle` - Change lifecycle states

#### Administrator Permissions (includes all permissions)
- `manage_users` - Manage all users
- `assign_roles` - Assign and upgrade user roles
- `system_settings` - Manage system settings
- `view_all_analytics` - View all analytics
- `manage_all_content` - Manage all content

### Glossary

- **Role:** Set of permissions assigned to a user
- **Permission:** Specific right to perform an action
- **Role Assignment:** Process of assigning a role to a user
- **Role Validation:** Verifying user has required role
- **Access Control:** System restricting access based on roles
- **JWT Token:** Authentication token containing role information
- **Enrollment Code:** Code to join a specific cohort (not for role assignment)
- **Learner Identity:** Persistent platform identity across programmes
- **Programme Lifecycle:** States a programme transitions through
- **Permission Inheritance:** Higher roles inherit lower role permissions

---

## Version History

### Version 1.0.0 (2024-03-04)
- Initial release of role management system
- Support for Learner, Convener, and Administrator roles
- Automatic learner role assignment on registration
- Admin-controlled role upgrades
- Programme lifecycle management
- Comprehensive documentation

---

*Last Updated: March 4, 2024*
