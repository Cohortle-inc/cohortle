# Role System Architecture Update - Complete

**Date:** March 5, 2026  
**Spec:** `.kiro/specs/role-validation-assignment-logic/`  
**Status:** Requirements, Design, and Tasks Updated

---

## Summary of Changes

The role-validation-assignment-logic spec has been comprehensively updated to align with Cohortle's programme-centric architecture and operational model.

## Key Architectural Principles Implemented

### 1. Core System Structure
**Programme → Cohort → Learners**

- Programmes define learning structure and content
- Cohorts represent specific runs with groups of learners
- Learners have persistent platform identity

### 2. Three-Role System

**Learner (Default)**
- Automatically assigned to all new users
- Can join/apply to programmes
- Persistent identity across all programmes
- Accumulates learning portfolio over time

**Convener**
- Programme organizer/facilitator
- Assigned by admin approval only (NO invitation codes)
- Can create and manage programmes and cohorts

**Administrator**
- Platform governance role
- Can assign/upgrade users to convener role
- Manages platform-level configurations

### 3. Role Assignment vs. Enrollment

**Critical Separation:**

**Role Assignment** (System-Level):
- Learner, Convener, Administrator
- Managed by administrators
- NOT assigned via invitation codes
- Persistent across programmes

**Cohort Enrollment** (Programme-Level):
- Uses enrollment codes
- Validates against cohort entity only
- Learners join specific cohorts

### 4. Programme Lifecycle States

Programmes support these lifecycle states:
- **Draft**: Structure being created
- **Recruiting**: Learners can apply/join
- **Active**: Programme running
- **Completed**: Programme finished
- **Archived**: Retained for history

### 5. Learner Onboarding Modes

Two modes supported:
- **Join with Code**: Direct enrollment with cohort code
- **Apply to Join**: Application submission for convener review (future feature)

### 6. Learner Identity Model

Learners build persistent platform identity:
```
Learner Profile
├── Programmes Completed
│   ├── WECARE Leadership Programme
│   ├── Startup Zaria Incubator
│   └── Digital Skills Fellowship
├── Current Enrollments
└── Learning Portfolio
```

### 7. Future Organisation Layer

Architecture designed to support:
```
Organisation → Programmes → Cohorts → Learners
```

Currently, convener effectively represents single organisation. System remains flexible for future enhancement without major refactoring.

---

## Files Updated

### 1. requirements.md
**Changes:**
- Updated role definitions (Student → Learner)
- Removed convener invitation code logic
- Added default Learner role assignment
- Clarified enrollment codes are for cohorts only
- Added programme lifecycle states requirements
- Added learner onboarding modes requirements
- Emphasized persistent learner identity

**New Requirements:**
- Requirement 10: Programme Lifecycle States
- Requirement 11: Learner Onboarding Modes

### 2. design.md
**Changes:**
- Added comprehensive architectural principles section
- Updated role terminology throughout
- Added programme lifecycle model
- Updated database schema with lifecycle fields
- Updated default roles and permissions
- Added constraints for lifecycle states
- Clarified role assignment vs. enrollment separation

**New Data Models:**
- Programme Lifecycle Model with status and onboarding_mode fields

**Database Changes:**
- Added lifecycle_status, status_changed_at, status_changed_by to programmes
- Added onboarding_mode to programmes
- Updated role names: 'student' → 'learner'
- Added constraints for valid lifecycle statuses and onboarding modes

### 3. tasks.md
**Changes:**
- Updated Task 1 to include programme lifecycle fields
- Updated Task 8 to remove convener invitation code logic
- Updated Task 8 to emphasize default Learner role assignment
- Added Task 11.5 for programme lifecycle management
- Added Task 11.6 for application workflow architecture preparation
- Updated notes section with architectural changes
- Updated success criteria

---

## Implementation Impact

### Immediate Changes Required

1. **Database Migration**
   - Add lifecycle_status, status_changed_at, status_changed_by to programmes table
   - Add onboarding_mode to programmes table
   - Update role names in roles table
   - Add constraints for valid values

2. **Registration Logic**
   - Remove convener invitation code handling
   - Ensure all new users get Learner role by default
   - Update error messages

3. **Enrollment Logic**
   - Ensure enrollment codes validate against cohort entity only
   - Remove any role assignment logic from enrollment flow

4. **API Updates**
   - Add programme lifecycle management endpoints
   - Update role assignment endpoints (admin-only for convener upgrades)
   - Update documentation

### Future Enhancements Prepared

1. **Application Workflow**
   - Architecture ready for learner application system
   - onboarding_mode field supports future implementation

2. **Organisation Layer**
   - System designed to support organisation → programmes hierarchy
   - No major refactoring required when adding this layer

3. **Learner Portfolio**
   - Persistent identity supports cross-programme learning history
   - Ready for portfolio features

---

## Testing Updates Required

### Property Tests to Update

**Property 2: Role Assignment Validation**
- Test that all registrations default to Learner role
- Test that enrollment codes don't affect role assignment
- Remove convener invitation code tests

**Property 3: Access Control Enforcement**
- Update to use 'learner' instead of 'student'
- Test cohort enrollment with enrollment codes

### Integration Tests to Add

- Programme lifecycle state transitions
- Learner identity persistence across programmes
- Enrollment code validation against cohort entity

---

## Migration Path

### For Existing Data

1. **Update existing role names:**
   ```sql
   UPDATE roles SET name = 'learner' WHERE name = 'student';
   UPDATE user_role_assignments SET role_id = (SELECT role_id FROM roles WHERE name = 'learner') 
     WHERE role_id = (SELECT role_id FROM roles WHERE name = 'student');
   ```

2. **Set default programme lifecycle:**
   ```sql
   UPDATE programmes SET lifecycle_status = 'draft' WHERE lifecycle_status IS NULL;
   UPDATE programmes SET onboarding_mode = 'code' WHERE onboarding_mode IS NULL;
   ```

3. **Remove convener invitation codes:**
   - Audit existing invitation code logic
   - Remove from registration flow
   - Update documentation

---

## Documentation Updates Needed

1. **API Documentation**
   - Update role names in all endpoints
   - Document programme lifecycle endpoints
   - Clarify enrollment code usage

2. **User Guides**
   - Update convener onboarding process (admin approval required)
   - Document programme lifecycle states
   - Explain learner identity model

3. **Developer Documentation**
   - Update architecture diagrams
   - Document role assignment vs. enrollment separation
   - Add programme lifecycle state machine diagram

---

## Next Steps

1. **Review and Approve**
   - Review updated spec documents
   - Confirm architectural alignment
   - Approve for implementation

2. **Database Migration**
   - Create migration scripts
   - Test on development environment
   - Plan production migration

3. **Code Updates**
   - Update registration logic
   - Update enrollment logic
   - Add programme lifecycle management

4. **Testing**
   - Update existing tests
   - Add new property tests
   - Run full test suite

5. **Documentation**
   - Update API docs
   - Update user guides
   - Update developer docs

---

## Questions for Consideration

1. **Migration Timing**: When should we migrate existing 'student' roles to 'learner'?
2. **Existing Conveners**: How to handle users who may have been assigned convener via old invitation code logic?
3. **Programme Lifecycle**: Should existing programmes default to 'draft' or 'active'?
4. **Application Workflow**: What priority for implementing the application-based enrollment?

---

## Conclusion

The role-validation-assignment-logic spec now fully aligns with Cohortle's programme-centric architecture. The system properly separates role assignment from cohort enrollment, supports programme lifecycle management, maintains persistent learner identity, and prepares the architecture for future enhancements including organisation layers and application workflows.

All three spec documents (requirements.md, design.md, tasks.md) have been updated consistently to reflect these principles.
