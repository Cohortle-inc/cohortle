# Role-Based Access Control Analysis

## Question
Is it ideal to allow both learners and conveners to access learner endpoints without proper structure checking if it's a deliberate design or a flaw?

## Current System Design

### Role System
From `cohortle-api/routes/auth.js`:
- Users register with a **single role**: `learner` or `convener`
- Role is stored in the database `users.role` field
- Role is embedded in JWT tokens: `{ user_id, role, email }`
- Role is enforced by `TokenMiddleware({ role: "learner|convener" })`

### Requirements Analysis

#### Convener Requirements (from `.kiro/specs/convener-dashboard/requirements.md`)
Conveners are designed to:
- Create and manage programmes
- Create cohorts with enrollment codes
- Create weeks and lessons
- Preview programmes in learner view
- **NO MENTION** of conveners enrolling as learners

#### Learner Requirements (from `.kiro/specs/web-student-auth-dashboard/requirements.md`)
Learners are designed to:
- Enroll in programmes using enrollment codes
- View enrolled programmes
- Access lessons and mark them complete
- Track learning progress

### The Design Ambiguity

**The system has a SINGLE-ROLE design** but the real-world use case suggests **DUAL-ROLE capability**:

1. **Single-Role Design Evidence:**
   - Registration requires choosing ONE role: `role: "required|in:learner,convener"`
   - No mechanism to switch roles or have multiple roles
   - Separate dashboards: `/dashboard` (learner) vs `/convener/dashboard`
   - Separate middleware checks

2. **Real-World Use Case:**
   - A convener who creates a programme may want to **test it as a learner**
   - A convener may want to **enroll in other conveners' programmes** to learn
   - The "Preview Mode" (Requirement 7) suggests conveners need learner-like access

## The Problem with Current Fix

### What We Changed
We modified 4 endpoints to allow `role: "learner|convener"`:
1. `/v1/api/programmes/enrolled` - GET enrolled programmes
2. `/v1/api/programmes/enroll` - POST enroll in programme
3. `/v1/api/cohorts/:cohort_id/join` - POST join cohort
4. `/v1/api/lessons/:lesson_id/complete` - POST mark lesson complete

### Why This May Be Wrong

1. **No Business Logic Separation**
   - A convener enrolling in their OWN programme creates confusion
   - Should conveners see their created programmes in "enrolled programmes"?
   - Should conveners' test enrollments count as real enrollments?

2. **Data Integrity Issues**
   - Enrollment analytics will be skewed (conveners counted as learners)
   - Completion tracking mixes creators with consumers
   - Cohort size metrics become inaccurate

3. **Missing Context Checks**
   - No check if convener is enrolling in their own programme
   - No distinction between "preview mode" and "actual enrollment"
   - No way to filter convener test data from learner analytics

## Recommended Solutions

### Option 1: Dual-Role System (Proper Implementation)
**Best for:** Systems where conveners legitimately need to be learners

```javascript
// Database: Add role_type field
users: {
  primary_role: 'learner' | 'convener',
  secondary_roles: ['learner', 'convener'] // Array of roles
}

// Middleware: Check if user has ANY of the required roles
TokenMiddleware({ roles: ["learner", "convener"] })

// Business Logic: Separate convener-as-learner from real learners
if (user.primary_role === 'convener' && user.secondary_roles.includes('learner')) {
  // Mark as test enrollment
  enrollment.is_test = true;
}
```

### Option 2: Preview Mode (Current Design Intent)
**Best for:** Conveners only need to TEST, not actually enroll

```javascript
// Keep learner-only restrictions
TokenMiddleware({ role: "learner" })

// Add separate preview endpoints for conveners
app.get("/v1/api/programmes/:id/preview", 
  [TokenMiddleware({ role: "convener" })],
  async (req, res) => {
    // Return programme data WITHOUT creating enrollment
    // Convener can see content but not tracked as learner
  }
);
```

### Option 3: Context-Aware Access (Hybrid)
**Best for:** Allow conveners to enroll BUT track the context

```javascript
app.post("/v1/api/programmes/enroll",
  [TokenMiddleware({ role: "learner|convener" })],
  async (req, res) => {
    const { code } = req.body;
    const cohort = await validateCode(code);
    
    // Check if convener is enrolling in their own programme
    if (req.user_role === 'convener') {
      const programme = await getProgramme(cohort.programme_id);
      
      if (programme.created_by === req.user_id) {
        return res.status(400).json({
          error: true,
          message: "Conveners cannot enroll in their own programmes. Use Preview Mode instead."
        });
      }
      
      // Mark as convener enrollment for analytics
      enrollment.enrolled_as = 'convener';
    }
    
    // Continue with enrollment...
  }
);
```

## Recommendation

**I recommend Option 3: Context-Aware Access** because:

1. **Fixes the immediate 403 error** (MVP can function)
2. **Maintains data integrity** (tracks who enrolled as what)
3. **Prevents logical errors** (conveners can't enroll in own programmes)
4. **Enables future analytics** (filter convener test data)
5. **Minimal code changes** (builds on current fix)

## Implementation Plan

1. **Keep the current role changes** (`learner|convener`)
2. **Add business logic checks** in enrollment endpoints
3. **Add `enrolled_as` field** to enrollments table
4. **Update analytics queries** to filter by `enrolled_as`
5. **Add frontend warnings** when conveners enroll

## Conclusion

**The current fix is a QUICK FIX but not architecturally sound.** It solves the 403 error but creates potential data integrity and business logic issues. The system needs either:
- A proper dual-role architecture, OR
- Context-aware access controls with business logic validation

For MVP purposes, the current fix works, but it should be flagged as **technical debt** to be addressed before production scaling.
