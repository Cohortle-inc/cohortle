# Cohortle Phase 3 Blueprint
## Convener Operations Center

## Executive Summary

Phase 1 and Phase 2 made Cohortle strong at learner visibility and learner intelligence. The next step is not to become a generic LMS. The next step is to become the operating system for programme operations.

Phase 3 should focus on the missing layer between “I can see learners” and “I can run a whole programme.” That means giving conveners a single operational workspace to manage learner lifecycle, access, communications, support, payments, and outcomes from recruitment through graduation.

The recommended product direction is:

- Build a Convener Operations Center
- Treat learners as a managed lifecycle, not a static list
- Add payment and installment support for enterprise requirements
- Make operations visible, auditable, and repeatable
- Preserve Cohortle’s identity as a cohort-based operating system rather than a traditional course platform

---

## 1. Current State Audit

### How conveners manage learners today

Today, conveners can already manage learners at a basic operational level through the cohort and learner-management surfaces:

- Create and manage programmes, cohorts, weeks, and lessons
- Share enrolment codes and onboard learners into cohorts
- View learners in a cohort
- See learner progress and lesson completion
- Open a learner detail page to view completion progress and lesson history
- Update learner enrollment status through the backend using values such as active, suspended, completed, withdrawn, and removed

### What exists in the current codebase

The current implementation already includes:

- Learner listing and filtering logic in the backend controller for convener learner management
- Endpoint-based status updates for enrollments
- Learner detail and activity profile endpoints for conveners
- Cohort-level learner pages in the frontend
- Basic progress analytics for lesson completion

Relevant implementation areas include:

- [cohortle-api/controllers/LearnerManagementController.js](cohortle-api/controllers/LearnerManagementController.js)
- [cohortle-api/routes/learnerManagement.js](cohortle-api/routes/learnerManagement.js)
- [cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/learners/page.tsx](cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/learners/page.tsx)
- [cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/learners/[learnerId]/page.tsx](cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/learners/[learnerId]/page.tsx)
- [cohortle-web/src/lib/api/convener.ts](cohortle-web/src/lib/api/convener.ts)

### What conveners can already do

- Create programmes and cohorts
- View assigned learners within a cohort
- See progression and completion data
- Review learner history at a basic level
- Update access state in the backend

### Biggest workflow gaps

The current experience still feels like a set of disconnected admin screens rather than a true operations workflow.

The biggest gaps are:

1. No unified learner operations workspace
   - Conveners still need to jump between programme, cohort, learner, and analytics views to run day-to-day operations.

2. No structured learner lifecycle management
   - There is no clear workflow for onboarding, active engagement, suspension, reactivation, completion, withdrawal, and graduation.

3. No operational actions beyond basic status changes
   - The system can change a status, but it does not support the full operational tasks that programme teams actually perform.

4. No communication layer
   - There is no built-in way to message learners, send reminders, or trigger follow-up workflows.

5. No attendance or support workflow
   - Conveners cannot easily track attendance, issues, interventions, or support notes.

6. No payments or installment management
   - This is a major missing gap for enterprise customers and for programmes that require payment-based access control.

7. No graduation or alumni transition
   - The system does not help conveners move learners from active participant to graduate, alumni, or former participant.

### Repetitive work that still exists

- Manually checking learner progress one by one
- Manually updating learner access status for support issues
- Repeatedly performing the same follow-up actions for disengaged learners
- Manually coordinating communication across cohorts and programmes
- Manually tracking payment status outside the platform
- Manually managing the transition from active learner to completed or alumni

### Information that is still difficult to access

- Which learners need intervention right now
- Which learners are suspended, at risk, or overdue
- Which learners have payment issues
- Which learners are inactive across multiple programmes
- What actions have already been taken for a learner
- What the current support or engagement history looks like

---

## 2. Product Research and Strategic Lessons

The strongest lesson from market platforms is that different products solve different parts of the learner journey well. Cohortle should borrow the useful parts of each, but keep a distinct identity.

### Circle

Circle is strongest at community-led learning and member engagement. Its workflows are centered on membership, discussion, events, and community participation.

Why this workflow exists:
- Community is the main product, and the platform needs to support belonging, participation, and member interaction.

Why it matters for Cohortle:
- Cohort-based programmes need community and peer dynamics.
- However, Circle is not designed for structured cohort operations, formal programme administration, or lifecycle management at scale.

What makes sense for Cohortle:
- Keep community and engagement as a core pillar
- Use community features to support cohort culture, but do not let them replace operational management

### Kajabi

Kajabi is strong at creator-led education and the business layer around learning products. It combines content delivery with student management, subscriptions, and sales pipelines.

Why this workflow exists:
- The product must help educators run a business around learning, not just deliver content.

Why it matters for Cohortle:
- Many cohort-based programmes are also commercial offerings.
- Payments, access control, and learner lifecycle are essential.

What makes sense for Cohortle:
- Adopt the idea that learner operations are part of the value proposition
- Add payment and access lifecycle management, but keep the experience aligned to cohort-based programmes rather than digital course commerce

### Thinkific and Teachable

These platforms focus on course delivery plus learner administration and simple commerce flows. They are strong at making it easy to sell, enroll, and manage students.

Why this workflow exists:
- A simple operating model is needed so course creators can run a programme without becoming administrators.

Why it matters for Cohortle:
- Cohortle should reduce operational overhead for conveners, not increase it.

What makes sense for Cohortle:
- Use their lesson-to-learner management logic as a reference for straightforward access and progression workflows
- Avoid making Cohortle feel like a course marketplace or generic digital product storefront

### Canvas LMS

Canvas is strong at academic administration, assignments, submissions, grading, and records. It is designed for formal learning environments and institutional administration.

Why this workflow exists:
- Institutions need reliable records, structure, grading, and auditability.

Why it matters for Cohortle:
- Many cohort programmes require structured assessments, tracking, and formal records.

What makes sense for Cohortle:
- Borrow the seriousness of learner records and milestone tracking
- Keep the platform lighter and more flexible than a traditional LMS

### Moodle

Moodle is highly configurable and powerful for institution-level learning operations, but it is often complex and admin-heavy.

Why this workflow exists:
- The platform must support highly customized educational administration and large institutional use cases.

Why it matters for Cohortle:
- Some programmes need flexible workflows, but too much complexity would reduce usability for conveners.

What makes sense for Cohortle:
- Use Moodle as a warning about over-engineering
- Build only the operational structures that directly support programme delivery and learner success

### Mighty Networks

Mighty Networks combines community, memberships, and cohorts. It excels at helping groups feel like a movement or community while still structuring participation.

Why this workflow exists:
- Membership and belonging are key products in themselves.

Why it matters for Cohortle:
- Cohort-based learning is often deeply relational and community-driven.

What makes sense for Cohortle:
- Preserve the social side of learning
- Make community features a layer on top of programme operations, not the core operating model

### Strategic takeaway

The best pattern is not to copy any single platform. Cohortle should combine:

- The operational clarity of Kajabi/Thinkific/Teachable
- The formal records and structure of Canvas/Moodle
- The community feel of Circle/Mighty Networks

That combination can position Cohortle as a modern operating system for cohort-based programmes rather than just another LMS or community platform.

---

## 3. Duke Academy Requirements Review

The Duke Academy request included:

- Student Management
- Ability to suspend learner access
- Remove learner access
- Payment gateway
- Installment payments

### Current implementation fit

The current system already partially satisfies the access-management requirements:

- There is a learner-management backend layer
- Enrollment status can be updated
- The model already supports statuses including suspended and removed
- The frontend has learner pages and progress views

### Remaining gaps

The current implementation does not yet fully satisfy the enterprise requirement set:

1. No real payment workflow
   - No payment provider integration
   - No checkout flow
   - No billing records
   - No installment plan management

2. No payment-aware access control
   - Access cannot be automatically gated based on payment status

3. No admin-friendly payment operations UI
   - Conveners cannot see which learners are overdue, pending, or failed

4. No lifecycle action history
   - There is no clear record of why a learner was suspended or removed

5. No structured student management experience
   - The UI is still more like a progress viewer than a student operations console

### Recommendation for Duke Academy

Phase 3 should treat payments and access as one integrated workflow rather than separate features.

For example:

- A learner can be enrolled
- Their payment can be pending, partial, paid, overdue, or failed
- Access can be active, suspended, or removed depending on payment and operational rules
- A convener can see the full state in one screen

That creates a strong fit for enterprise requirements without making the platform feel like a generic billing tool.

---

## 4. Recommended Phase 3 Product Direction

## Phase 3 should become: Convener Operations Center

This should be the central hub for programme delivery operations.

It should help conveners manage:

- Learner lifecycle
- Access and suspension
- Engagement and support
- Communication
- Payments and installments
- Outcomes and graduation

### Proposed features

#### 1. Learner Operations Center

Problem it solves:
- Conveners currently need multiple views to run day-to-day learner operations.

Who benefits:
- Conveners, programme managers, operations teams, and support staff.

Why it matters:
- It turns the current learner-management experience from passive visibility into active operational control.

Implementation complexity:
- Medium

Priority:
- High

Dependencies:
- Existing learner-management APIs
- Frontend route and layout work

Future scalability:
- This becomes the long-term control centre for all programme operations.

#### 2. Learner Lifecycle Management

Problem it solves:
- The system has statuses, but not a meaningful lifecycle workflow.

Who benefits:
- Conveners and programme operations teams.

Why it matters:
- Lifecycle states reduce manual decision-making and make onboarding, support, suspension, completion, and withdrawal consistent.

Implementation complexity:
- Medium

Priority:
- High

Dependencies:
- Status model refinement
- Audit event design

Future scalability:
- Supports future automation and workflows.

#### 3. Bulk Actions and Follow-up Workflows

Problem it solves:
- Repetitive learner support actions are still manual.

Who benefits:
- Conveners and operations staff.

Why it matters:
- It saves time and makes support operations scalable across larger cohorts.

Implementation complexity:
- Medium

Priority:
- High

Dependencies:
- Shared action infrastructure

Future scalability:
- Enables workflow automation and templates later.

#### 4. Communication Hub

Problem it solves:
- Conveners cannot easily reach groups of learners without leaving the platform.

Who benefits:
- Conveners, programme teams, and learners.

Why it matters:
- Communication is part of learner success and operational efficiency.

Implementation complexity:
- Medium

Priority:
- High

Dependencies:
- Notification service and template layer

Future scalability:
- Can become a full engagement engine with triggers and segmentation.

#### 5. Attendance and Milestone Tracking

Problem it solves:
- Many programmes need operational signals beyond lesson completion.

Who benefits:
- Conveners and programme teams.

Why it matters:
- Attendance and milestones capture engagement beyond content consumption.

Implementation complexity:
- Medium to high

Priority:
- Medium-high

Dependencies:
- Attendance data model and event source

Future scalability:
- Supports later analytics and risk prediction.

#### 6. Payments and Installments

Problem it solves:
- The platform lacks a payment-aware learner access model.

Who benefits:
- Conveners, programme providers, and enterprise customers.

Why it matters:
- This is essential for programmes that require paid enrollment and access control.

Implementation complexity:
- High

Priority:
- High

Dependencies:
- Payment provider integration
- Billing and invoice design
- Access gating rules

Future scalability:
- Becomes a revenue operations layer for programme delivery.

#### 7. Graduation and Alumni Management

Problem it solves:
- There is no structured “end of programme” workflow.

Who benefits:
- Conveners, alumni teams, and institutions.

Why it matters:
- Graduation and alumni management are important retention and reputation loops.

Implementation complexity:
- Medium

Priority:
- Medium

Dependencies:
- Completion and outcomes schema

Future scalability:
- Enables alumni networks, referrals, and future enrolment loops.

---

## 5. Proposed Architecture

## A. Database changes

The current enrolment model should remain the core source of truth for learner membership, but it should be extended rather than replaced.

### Recommended tables and extensions

1. Extend enrollments
   - Add fields for:
     - lifecycle_stage
     - access_status_reason
     - suspended_at
     - suspended_by
     - reactivated_at
     - removed_at
     - removed_by
     - payment_status
     - payment_due_date
     - last_contacted_at
     - onboarding_completed_at
     - graduation_status
     - graduation_at
     - notes_count

2. Create learner_notes
   - One-to-many from learner to notes
   - Fields: note_type, content, created_by, created_at, linked_entity_type, linked_entity_id

3. Create learner_communication_events
   - Track communications sent to learners
   - Fields: channel, template_id, subject, body_preview, created_by, created_at, delivery_status

4. Create learner_attendance
   - Track attendance per session or cohort event
   - Fields: learner_id, cohort_id, event_type, event_date, status, recorded_by

5. Create learner_payments
   - Track charges, installment plans, and payment outcomes
   - Fields: enrollment_id, amount, currency, status, provider, provider_reference, installment_number, due_date, paid_at

6. Create learner_milestones
   - Track key milestone events for operational visibility
   - Fields: learner_id, programme_id, milestone_type, title, status, due_date, completed_at

### Design principle

Avoid creating parallel learner records. Keep one authoritative learner identity and attach operational data to the enrollment or learner-programme relationship.

## B. API design

The current learner-management API should be expanded into a more complete operations API.

### Recommended endpoints

- GET /v1/api/convener/operations/overview
  - Returns a high-level view of learner risk, payments, completions, and follow-ups

- GET /v1/api/convener/learners
  - Expand to support status, lifecycle stage, payment status, risk, and bulk filters

- GET /v1/api/convener/learners/:id
  - Return the full learner record with notes, payments, attendance, and timeline

- PATCH /v1/api/enrollments/:id/status
  - Continue to support status changes, but add reason and actor metadata

- POST /v1/api/enrollments/:id/actions/suspend
- POST /v1/api/enrollments/:id/actions/reactivate
- POST /v1/api/enrollments/:id/actions/remove
- POST /v1/api/enrollments/:id/notes

- POST /v1/api/convener/communications/send
  - Send to one learner or a filtered group

- POST /v1/api/convener/communications/templates
  - Manage reusable message templates

- GET /v1/api/convener/payments
  - View payment state across learners

- POST /v1/api/convener/payments/checkout
- POST /v1/api/convener/payments/installments

### API design principle

Use resource-oriented endpoints and strong filtering. Keep the API predictable and easy to use from both web and future mobile surfaces.

## C. Frontend structure

### Route structure

- /convener/operations
  - Overview dashboard
  - Learners tab
  - Communications tab
  - Payments tab
  - Outcomes tab

### Component structure

- LearnerOperationsPage
- LearnerOperationsTable
- LearnerDrawer or Side Sheet
- StatusControl
- AccessActionMenu
- CommunicationComposer
- PaymentPanel
- AttendanceWidget
- MilestoneTimeline
- NotesPanel
- AuditTimeline

### Frontend principle

Build reusable operational components rather than one-off screens. The learner detail experience should be composable and consistent across different programme contexts.

## D. Reusable components

The following components should be shared across the convener experience:

- StatusBadge
- AccessActionButton
- LearnerAvatarCard
- ActivityTimelineItem
- FilterBar
- BulkActionBar
- EmptyStateCard
- NotesComposer
- PaymentStatusBadge
- CommunicationTemplatePicker

## E. Permissions

The recommendations should use a permission model that supports more than one operational role.

Recommended roles:

- convener
- administrator
- operations_manager
- finance_manager

Recommended permission boundaries:

- Conveners can manage learners within their programmes
- Administrators can manage across all programmes
- Finance roles can view and manage payment processes
- Operations roles can view status, notes, and communication history

## F. Audit logging

Every operational change should be logged.

Log events for:

- Status changes
- Suspension or reactivation
- Removal actions
- Payment changes
- Communication sends
- Note creation
- Graduation changes
- Role or access changes

Each record should contain:

- actor_id
- target_type
- target_id
- action
- before_value
- after_value
- reason
- created_at

## G. Scalability considerations

Cohortle should not build a brittle system for a single programme type.

Recommended practices:

- Index learners by programme, cohort, status, payment_status, and lifecycle_stage
- Use pagination and server-side filtering for large cohorts
- Use background jobs for communication and payment syncs
- Keep the learner operations page optimized for large datasets
- Build for multi-programme and multi-organisation use from the start
- Introduce read-model patterns later if reporting volume grows significantly

---

## 6. Prioritised Roadmap

## Must Build (Phase 3)

These are the features that deliver immediate value and close the biggest product gap.

1. Convener Operations Center
   - One place to manage learners across programmes and cohorts

2. Learner Lifecycle Management
   - Structured active, suspended, completed, withdrawn, removed, and reactivated states

3. Access Actions and Auditability
   - Suspend, reactivate, remove, and log the reason for every action

4. Bulk Communication and Follow-up
   - Send reminders, notices, and support messages to selected learners

5. Payments and Installments Foundation
   - Payment status, installment tracking, and payment-aware access rules

## Should Build (Phase 4)

These are features that materially improve programme operations.

1. Attendance tracking
2. Notes and intervention workflows
3. Milestone and risk management
4. Better reporting and exports
5. Template-driven communications and reminders
6. Programme-level operations dashboards

## Future Vision

These features position Cohortle as the operating system for cohort-based programmes over the next 2–3 years.

1. AI-powered learner risk signals
2. Predictive intervention recommendations
3. Alumni and referral networks
4. Integrated programme finance operations
5. Cross-programme learner intelligence at the institution level
6. Full curriculum-to-outcomes management

---

## 7. Implementation Plan

## Milestone 1 — Product and data foundation

Estimated complexity: Low to medium

Scope:
- Finalise the Phase 3 product spec
- Define learner lifecycle states and action rules
- Create the data model for notes, payments, communications, and audit events

Output:
- Approved product blueprint
- Migration plan
- API contract draft

## Milestone 2 — Learner operations workspace

Estimated complexity: Medium

Scope:
- Build the convener operations hub
- Create the learner list, filters, and learner detail experience
- Add lifecycle controls and audit trail

Output:
- Programme teams can manage learners in one place

## Milestone 3 — Communication and follow-up layer

Estimated complexity: Medium

Scope:
- Add communication composer and templates
- Add bulk action support
- Track communication history

Output:
- Conveners can act on learner issues without leaving the platform

## Milestone 4 — Payment and installment support

Estimated complexity: High

Scope:
- Integrate a payment provider
- Add payment status and installment tracking
- Add payment-aware access logic

Output:
- Enterprise-grade learner access and payment management

## Milestone 5 — Graduation and alumni transition

Estimated complexity: Medium

Scope:
- Add graduation workflow
- Support alumni state and completion records
- Create a clean transition from active learner to graduate

Output:
- The platform supports the full programme lifecycle

## Implementation order

1. Data model and lifecycle rules
2. Operations workspace and learner detail
3. Access actions and audit logging
4. Communication workflows
5. Payments and installments
6. Graduation and alumni flows

## Migration strategy

- Make changes additively rather than replacing existing models
- Keep existing enrollment data and map it into the new lifecycle model
- Backfill current learners into the new default lifecycle state
- Preserve current status semantics while introducing richer operational states
- Use feature flags so the rollout can be progressive

## Testing strategy

- Unit tests for lifecycle transitions and permissions
- Integration tests for API behavior and audit logging
- End-to-end tests for suspend/reactivate/remove flows
- Payment sandbox testing for installments and access gating
- Role-based testing for convener, administrator, and finance workflows

## Rollout plan

1. Internal pilot with one programme team
2. Roll out to one enterprise customer or partner programme
3. Gather feedback on workflow clarity, support tasks, and payment experience
4. Expand gradually to additional programmes
5. Add automation and advanced analytics once the core workflow is stable

---

## Final Recommendation

Phase 3 should not be “more analytics” or “more learner pages.” It should be the moment Cohortle becomes an operating system for programme delivery.

The winning direction is to build a Convener Operations Center that gives programme teams a single place to:

- recruit and onboard learners
- manage access and risk
- communicate and support
- collect payments and manage installments
- guide learners through completion and graduation

That is the right evolution for Cohortle because it aligns the product with the real needs of cohort-based organisations and strengthens the company’s differentiation from both generic LMS platforms and pure community tools.
