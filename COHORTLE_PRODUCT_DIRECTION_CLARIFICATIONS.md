# Cohortle Product Direction Clarifications

**Date:** March 5, 2026  
**Purpose:** Strategic guidance for future spec development  
**Status:** Reference Document for Future Features

---

## Overview

This document captures important product-direction clarifications that should inform future spec development. These insights ensure Cohortle's architecture remains aligned with its vision as infrastructure for running structured programmes (not just an LMS).

---

## 1. Role Model Clarification

### Current Implementation
- User → Single Role (learner, convener, administrator)
- Permission inheritance allows conveners to act as learners

### Conceptual Model for Future Specs
Users should be understood as:

```
User (platform identity)
  → Platform Role (controls permissions)
  → May participate as Learner in many cohorts
  → May act as Convener for programmes they created
```

**Example:**
```
Muhammad
  → Role: Convener (platform permission level)
  → Enrollments:
     - Learner in Leadership Fellowship
     - Learner in Digital Skills Programme
     - Learner in Startup Zaria Incubator
  → Created Programmes:
     - WECARE Leadership Programme (as Convener)
```

**Key Insight:** Platform role only controls permissions. Enrollment in programmes is separate and accumulates learning history.

**No structural change needed** - just clarify this conceptual model in future documentation and specs.

---

## 2. Programme Discovery Layer (Future Feature)

### Current Implementation
Learners join via: **Enrollment Code**

Perfect for:
- Private cohorts
- NGO programmes
- Internal training
- Invitation-only programmes

### Future Expansion: Programme Discovery

Programmes should conceptually support multiple onboarding modes:

```
onboarding_mode:
  - code          (current: enrollment code required)
  - application   (future: apply → review → accept)
  - public_join   (future: browse and join directly)
```

**Architecture Note:** The `onboarding_mode` field already exists in the programmes table, preparing for this expansion.

**Future Features to Consider:**
- Public programme catalogue/browse page
- Application submission and review workflow
- Programme search and filtering
- Programme visibility settings

---

## 3. Convener Identity (Important Branding Insight)

### Current Framing
Conveners = individual programme creators

### Reality of Target Users
Conveners will actually be:
- NGOs
- Incubators
- Communities
- Companies
- Fellowship programmes
- Training organizations

**Key Insight:** Convener ≠ individual person. Convener = programme operator.

Sometimes that's a person. Sometimes it's an organization.

### Future Architecture Consideration

Keep architecture flexible for:

```
Organisation
  → Programmes
    → Cohorts
      → Learners
```

**Implementation Note:** You don't need to implement organisations now, but the system should not block this future structure.

**Future Features to Consider:**
- Organisation workspaces
- Team collaboration on programmes
- White-label capabilities
- Organisation-level branding
- Multi-user programme management

---

## 4. Programme Ownership vs. Convener Role

### Current Implementation
- Convener role → may create programmes
- Programme → created by a convener

### Future Clarification

Internally distinguish:
- **Convener** (role) → may create programmes
- **Programme** → has an owner (user who created it)

This allows for future features:
- Programme collaborators
- Co-facilitators
- Teaching assistants
- Guest speakers with limited permissions

**Without changing the role system.**

---

## 5. What We Got Right ✅

### Separation of Role Assignment from Enrollment Codes

**Decision:** 
- Role assignment → admin system (platform-level)
- Enrollment codes → cohort access (programme-level)

**Why This Matters:**
Many platforms mix invite codes, roles, and course access, which breaks later. Cohortle's clean separation is excellent architecture.

**This was the correct decision and should be maintained.**

---

## 6. The Next Major Feature: Application Workflow

### Current State
Cohortle supports: **Join with Code**

### Immediate Future Need
The moment you run your first public programme, you'll need:

```
Apply → Review → Accept → Enroll
```

This requires a new entity: **applications**

**Architecture Status:** Already prepared for this (onboarding_mode field exists).

**Future Spec Needed:** Learner Application Workflow
- Application submission form
- Convener review dashboard
- Application status tracking (pending, accepted, rejected)
- Notification system for status changes
- Bulk application management

---

## 7. The Missing Layer: Programme Operations

### The Real Problem
Most edtech platforms focus on: **content delivery**
- Upload lesson
- Students watch
- Students submit assignment

But cohort programmes are: **operations-heavy experiences**

### What Programme Organisers Actually Juggle
- Sessions (live workshops, guest speakers)
- Deadlines (assignments, submissions)
- Reminders (engagement, attendance)
- Progress tracking (who's falling behind?)
- Community activity (participation levels)

**Current Reality:** They manage this in 5 different tools:
- Zoom
- Google Sheets
- WhatsApp
- Notion
- Google Classroom

### The Opportunity: Programme Run Sheet

Give conveners a **Programme Run Sheet** - mission control for running the cohort.

**Example View:**
```
Week 3 — Leadership Module

Session
  ✔ Tuesday Live Workshop (completed)
  ✔ Guest Speaker: Fatima Bello

Assignments
  ⏳ Leadership Reflection Essay
     Due: Friday
     37/45 submitted
     8 pending

Learner Activity
  37/45 submitted assignments
  8 learners inactive for 7 days

Upcoming
  Mentor Office Hours – Thursday
```

### Why This Is Powerful

Conveners constantly ask:
- Who hasn't submitted?
- Who missed the session?
- Who is falling behind?

Instead of checking manually everywhere, Cohortle shows:

**Programme Health Dashboard:**
```
Engagement Score: 84%

Attendance
  42/45 attended last session

Assignments
  37 submitted
  8 pending

Inactive Learners
  5 inactive for 10+ days
```

### Product Structure

**New Concept:** Programme Timeline

```
Programme
  → Modules / Weeks
    → Sessions (live events)
    → Assignments (submissions)
    → Events (deadlines, milestones)
```

**Learners see:** Your Journey  
**Conveners see:** Programme Operations

### Strategic Advantage

Most LMS platforms were designed for:
- Courses
- Lectures
- Videos

Cohortle's target users run:
- Fellowships
- Accelerators
- Capacity programmes
- Community learning

These are **structured journeys, not just courses**.

Cohortle should feel like: **Operating system for running programmes**  
Not just: a place to upload lessons

### Real Example

**Startup incubator programme:**

```
Cohort: Startup Zaria 2026

Week 4
  Session
    ✔ Fundraising Workshop

  Assignments
    Pitch Deck Submission
    Due: Sunday

  Mentor Meetings
    24 scheduled
    6 pending

  Engagement
    3 founders inactive for 5 days
```

Convener immediately knows where intervention is needed.

### Why This Matters for Vision

You said: "Cohortle is about organising non-formal education."

Non-formal education is **programmes, not courses**.

Examples:
- Leadership fellowships
- Youth development programmes
- Accelerators
- NGO capacity programmes

**All of these run on operations.**

If Cohortle becomes the best platform for running programmes, you unlock a huge niche.

### Hidden Strategic Insight

If you build this right, Cohortle won't compete with:
- Teachable
- Thinkific
- Kajabi

Instead it competes with:
- Spreadsheets
- WhatsApp groups
- Google Docs chaos

**Which is an enormous market.**

### Mental Model

```
Programme
  ↓
Cohorts
  ↓
Timeline (weeks/modules)
  ↓
Sessions / Assignments / Events
  ↓
Learner Progress
```

Everything flows from the programme timeline.

### Future AI Opportunity

This is where AI later becomes extremely useful:

```
5 learners are disengaging.

Suggested action:
  Send reminder message or schedule a check-in.
```

Or:

```
Assignment completion rate dropped this week.

Suggested action:
  Review assignment difficulty or extend deadline.
```

**But first we need:** timeline + engagement data.

---

## 8. Competitive Positioning

### What Cohortle Is Becoming

Not just an LMS. It's quietly evolving into:

**Infrastructure for running structured programmes**

Which includes:
- Fellowships
- Incubators
- Accelerators
- Leadership programmes
- NGO capacity building

**Almost no platform specialises in this properly.**

### Market Opportunity

Cohortle is one step away from becoming something bigger than an LMS.

The platform that makes it easy to:
- Design programme structure
- Run cohorts operationally
- Track learner progress
- Manage engagement
- Build community

For organisations that run **programmes, not courses**.

---

## Summary: Key Takeaways for Future Specs

1. **Role Model:** Clarify that users have a platform role + multiple programme enrollments
2. **Programme Discovery:** Prepare for public programmes and application workflows
3. **Convener = Organisation:** Keep architecture flexible for organisation layer
4. **Programme Ownership:** Distinguish role from programme ownership for future collaboration features
5. **Application Workflow:** Next major feature after convener dashboard
6. **Programme Operations:** The missing layer that would give Cohortle a huge advantage
7. **Competitive Position:** Infrastructure for structured programmes, not just content delivery

---

## Action Items for Future Development

### Short Term (Next 3-6 months)
- [ ] Learner application workflow spec
- [ ] Programme discovery/browse page
- [ ] Basic programme timeline view

### Medium Term (6-12 months)
- [ ] Programme operations dashboard (run sheet)
- [ ] Engagement tracking and alerts
- [ ] Session management (live events)
- [ ] Assignment submission tracking

### Long Term (12+ months)
- [ ] Organisation layer
- [ ] Team collaboration features
- [ ] White-label capabilities
- [ ] AI-powered engagement insights

---

## Technical Architecture Notes

### Already Prepared For
- ✅ `onboarding_mode` field in programmes table
- ✅ Role separation from enrollment
- ✅ Persistent learner identity
- ✅ Programme lifecycle states

### Future Database Entities Needed
- `applications` (learner applications to programmes)
- `organisations` (multi-user programme operators)
- `programme_timeline_events` (sessions, deadlines, milestones)
- `engagement_metrics` (tracking learner activity)
- `programme_collaborators` (co-facilitators, teaching assistants)

### Architecture Principles to Maintain
- Keep role assignment separate from programme participation
- Support persistent learner identity across programmes
- Allow flexible programme structures (not rigid course templates)
- Enable operational management, not just content delivery

---

*Last Updated: March 5, 2026*  
*Document Type: Strategic Reference*  
*Audience: Future Spec Development*
