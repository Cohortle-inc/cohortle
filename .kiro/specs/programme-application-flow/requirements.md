# Requirements Document

## Introduction

The Programme Application Flow introduces a structured Apply → Review → Accept → Enroll lifecycle for Cohortle programmes. Currently, learners join programmes exclusively via enrollment codes — a model that works well for private or invite-only cohorts. This feature adds a new onboarding pathway for public or semi-public programmes such as fellowships, incubators, accelerators, and NGO training programmes, where conveners need to screen and select participants before granting access.

This spec covers the full lifecycle: how applicants discover and apply to programmes, how conveners review and decide on applications, how accepted applicants are enrolled, and how the system integrates with the existing role, enrollment, and programme infrastructure.

## Glossary

- **Application**: A formal expression of interest submitted by an Applicant to join a specific Programme, subject to Convener review. An Application does not require the Applicant to have a Cohortle account at submission time. Each Application is scoped to one Programme.
- **Applicant**: Any person (with or without a Cohortle account) who submits one or more Applications via a public Organisation Page or Programme-specific Application Form URL
- **Application_Status**: The current state of an Application — one of: `submitted`, `under_review`, `accepted`, `rejected`, `waitlisted`
- **Application_Form**: A publicly accessible URL generated per Programme that allows anyone to submit an Application without logging in
- **Application_Template**: A Convener-defined set of questions embedded in the Application_Form that Applicants must answer
- **Convener**: A User with the convener role who creates and manages Programmes and reviews Applications
- **Cohort**: A time-bounded group of enrolled Learners within a Programme, identified by an enrollment code
- **Enrollment**: A record linking a registered Cohortle User to a Cohort, granting access to Programme content
- **Onboarding_Mode**: A Programme-level configuration field controlling how Learners join — one of: `code`, `application`, or `hybrid`
- **Organisation_Page**: A public-facing page at `/org/[organisation_slug]` that lists all of a Convener's open programmes, allowing applicants to discover and apply to multiple programmes from one place
- **Organisation_Slug**: A unique, URL-safe identifier set by the Convener on their profile, used to generate their Organisation_Page URL (e.g., `/org/wecareforng`)
- **Programme**: A structured learning experience managed by a Convener, containing Cohorts, Weeks, and Lessons
- **Reviewer**: A Convener or Administrator who evaluates and decides on Applications
- **System**: The Cohortle platform (API + web frontend)
- **Waitlist**: A holding state for Applications that are not immediately accepted but may be reconsidered
- **Lifecycle_Status**: The operational state of a Programme — one of: `draft`, `recruiting`, `active`, `completed`, `archived`
- **Acceptance_Email**: An automated email sent to an accepted Applicant containing a unique signup/login link that, once completed, automatically enrolls them in the specified Cohort

---

## Requirements

### Requirement 1: Public Application Form

**User Story:** As a convener, I want to share a public application link for my programme, so that anyone can apply without needing a Cohortle account first.

#### Acceptance Criteria

1. WHEN a Convener sets a Programme's `onboarding_mode` to `application` or `hybrid`, THE System SHALL generate a unique, publicly accessible Application_Form URL for that Programme
2. WHEN an unauthenticated visitor accesses the Application_Form URL, THE System SHALL display the programme name, description, and all Application_Template questions without requiring login
3. WHEN a Convener sets an application deadline on a Programme, THE System SHALL display the deadline on the Application_Form and prevent new submissions after the deadline has passed
4. WHEN a Programme has no remaining capacity across all Cohorts, THE System SHALL display the Application_Form as closed and prevent new submissions
5. THE System SHALL allow the Convener to copy the Application_Form URL from the Programme management dashboard for sharing externally (e.g., via email, social media, or their own website)

---

### Requirement 2: Application Submission (No Account Required)

**User Story:** As a prospective learner, I want to submit an application without needing to create an account first, so that the barrier to applying is as low as possible.

#### Acceptance Criteria

1. WHEN a visitor submits the Application_Form, THE System SHALL require at minimum: the applicant's full name and email address, plus all required Application_Template question responses
2. WHEN a visitor submits a valid Application, THE System SHALL create a new Application record with status `submitted`, storing the applicant's name, email, responses, and submission timestamp — no Cohortle user account is required at this stage
3. WHEN a visitor submits an Application using an email address that already has a pending Application (status `submitted`, `under_review`, or `accepted`) for the same Programme, THE System SHALL reject the duplicate and return an error
4. WHEN an Application is successfully submitted, THE System SHALL display a confirmation message to the Applicant and send a confirmation email to the provided address
5. WHEN an Application is successfully submitted, THE System SHALL notify the Convener of the Programme that a new Application has been received
6. IF a Programme's `lifecycle_status` is not `recruiting`, THEN THE System SHALL reject the Application submission and return an error indicating the programme is not accepting applications

---

### Requirement 3: Application Template Management

**User Story:** As a convener, I want to define the questions applicants must answer, so that I can collect the information I need to make informed decisions.

#### Acceptance Criteria

1. WHEN a Convener configures a Programme with `onboarding_mode` of `application` or `hybrid`, THE System SHALL require the Convener to define at least one Application_Template question before the Programme can be set to `recruiting` status
2. WHEN a Convener creates an Application_Template question, THE System SHALL accept a question text, question type (text, textarea, select, multiselect), whether the question is required, and any options for select/multiselect types
3. WHEN a Convener updates an Application_Template for a Programme that already has submitted Applications, THE System SHALL preserve existing Application response data and only apply the updated template to new Applications
4. THE System SHALL allow a Convener to reorder Application_Template questions without affecting existing Application responses
5. WHEN a Convener deletes a required question from an Application_Template, THE System SHALL warn the Convener that existing draft Applications may be affected

---

### Requirement 4: Convener Application Review

**User Story:** As a convener, I want to review submitted applications in a structured interface, so that I can make fair and efficient decisions.

#### Acceptance Criteria

1. WHEN a Convener views the applications dashboard for a Programme, THE System SHALL display all Applications with status `submitted` or `under_review`, showing applicant name, submission date, and current status
2. WHEN a Convener opens an Application, THE System SHALL display the applicant's full responses alongside their profile information (name, bio, LinkedIn if available)
3. WHEN a Convener opens an Application with status `submitted`, THE System SHALL automatically transition the Application_Status to `under_review`
4. WHEN a Convener adds a reviewer note to an Application, THE System SHALL save the note and associate it with the Reviewer's user ID and a timestamp
5. THE System SHALL allow a Convener to filter Applications by status, submission date, and cohort (if applicable)
6. THE System SHALL allow a Convener to sort Applications by submission date (ascending or descending)
7. WHEN a Convener performs a bulk action (accept or reject) on multiple Applications, THE System SHALL apply the action to all selected Applications and record the Reviewer's user ID on each

---

### Requirement 5: Application Decision — Accept and Post-Acceptance Onboarding

**User Story:** As a convener, I want to accept an application and have the system automatically onboard the applicant, so that accepted applicants can access the programme without manual intervention.

#### Acceptance Criteria

1. WHEN a Convener accepts an Application, THE System SHALL transition the Application_Status to `accepted` and record the Reviewer's user ID and decision timestamp
2. WHEN a Convener accepts an Application, THE System SHALL require the Convener to specify which Cohort the Applicant should be enrolled in
3. WHEN an Application is accepted, THE System SHALL send an Acceptance_Email to the Applicant's email address containing: a personalised congratulations message, programme details, and a unique time-limited signup/login link
4. WHEN an Applicant who does not yet have a Cohortle account clicks the Acceptance_Email link, THE System SHALL direct them to a signup page pre-filled with their name and email, and upon completing signup, SHALL automatically enroll them in the specified Cohort
5. WHEN an Applicant who already has a Cohortle account clicks the Acceptance_Email link, THE System SHALL direct them to login (if not already authenticated) and upon authentication, SHALL automatically enroll them in the specified Cohort
6. WHEN the Enrollment is created via Application acceptance, THE System SHALL record `enrollment_source` as `application` and store the `application_id` reference on the Enrollment
7. IF the specified Cohort has reached its `max_members` capacity, THEN THE System SHALL prevent the acceptance and return an error indicating the cohort is full
8. WHEN the Acceptance_Email link has expired (after 7 days) and the Applicant clicks it, THE System SHALL display an expiry message and provide a way for the Applicant to request a new link

---

### Requirement 6: Application Decision — Reject or Waitlist

**User Story:** As a convener, I want to reject or waitlist applications, so that I can manage programme capacity and communicate decisions clearly.

#### Acceptance Criteria

1. WHEN a Convener rejects an Application, THE System SHALL require the Convener to provide a rejection reason before the rejection is confirmed
2. WHEN an Application is rejected, THE System SHALL transition the Application_Status to `rejected`, record the rejection reason, and notify the Applicant by email with the reason provided
3. WHEN a Convener waitlists an Application, THE System SHALL transition the Application_Status to `waitlisted` without requiring a reason
4. WHEN a Convener promotes a waitlisted Application to accepted, THE System SHALL follow the same acceptance flow as Requirement 5
5. WHEN an Application is rejected, THE System SHALL allow the Applicant to submit a new Application to the same Programme if the Programme is still in `recruiting` status

---

### Requirement 7: Programme Onboarding Mode Configuration

**User Story:** As a convener, I want to configure how learners join my programme, so that I can choose the right onboarding model for my context.

#### Acceptance Criteria

1. WHEN a Convener creates or edits a Programme, THE System SHALL allow the Convener to set `onboarding_mode` to one of: `code`, `application`, or `hybrid`
2. WHEN `onboarding_mode` is `code`, THE System SHALL use the existing enrollment code flow exclusively and not display an application option to Learners
3. WHEN `onboarding_mode` is `application`, THE System SHALL disable the enrollment code join flow and require all Learners to apply
4. WHEN `onboarding_mode` is `hybrid`, THE System SHALL allow Learners to join either via enrollment code or by submitting an Application
5. WHEN a Convener changes `onboarding_mode` from `application` to `code` on a Programme that has pending Applications, THE System SHALL warn the Convener that existing Applications will remain in their current status and will not be automatically resolved
6. THE System SHALL default `onboarding_mode` to `code` for all newly created Programmes to preserve backward compatibility

---

### Requirement 8: Application Lifecycle and Audit Trail

**User Story:** As a convener and as a platform administrator, I want a complete audit trail of application status changes, so that I can track decisions and resolve disputes.

#### Acceptance Criteria

1. WHEN any Application_Status transition occurs, THE System SHALL create an Application_History record capturing: previous status, new status, changed_by user ID, timestamp, and optional notes
2. THE System SHALL preserve Application records and their history indefinitely — Applications SHALL NOT be hard-deleted
3. WHEN a Convener views an Application, THE System SHALL display the full status history in chronological order
4. WHEN an Administrator views the applications for any Programme, THE System SHALL display all Applications regardless of status
5. IF an Application_Status transition is attempted that is not permitted by the state machine (e.g., `accepted` → `submitted`), THEN THE System SHALL reject the transition and return an error describing the valid transitions from the current status

---

### Requirement 9: Learner Application Status Tracking

**User Story:** As a learner, I want to track the status of my applications, so that I know where I stand and what to expect next.

#### Acceptance Criteria

1. WHEN a Learner views their profile or dashboard, THE System SHALL display a list of all their Applications with current status and Programme name
2. WHEN an Application status changes, THE System SHALL send the Learner an email notification describing the new status and any next steps
3. WHEN a Learner's Application is in `draft` status, THE System SHALL allow the Learner to edit and complete the Application before submitting
4. WHEN a Learner's Application is in `submitted` or `under_review` status, THE System SHALL display the Application as read-only and prevent further edits
5. WHEN a Learner's Application is `accepted`, THE System SHALL display a link to the Programme content they are now enrolled in

---

### Requirement 10: Role and Access Control Integration

**User Story:** As a platform architect, I want the application flow to integrate cleanly with the existing role system, so that access control remains consistent and secure.

#### Acceptance Criteria

1. THE System SHALL allow any person to submit an Application via the public Application_Form URL without requiring a Cohortle account or role — account creation is deferred to post-acceptance
2. THE System SHALL enforce that only the Convener who owns a Programme (or an Administrator) can review, accept, or reject Applications for that Programme
3. WHEN a new User account is created via the Acceptance_Email signup link, THE System SHALL automatically assign the `learner` role to the new User
4. WHEN a Learner is enrolled via Application acceptance, THE System SHALL not change the Learner's existing system role — enrollment grants content access, not a role change
5. WHEN the `RoleValidationService` checks if a User can `enroll_in_programme`, THE System SHALL treat Application-based enrollment as equivalent to code-based enrollment for permission purposes
6. THE System SHALL add `manage_applications` as a new permission assigned to the `convener` role, controlling access to application review endpoints

---

### Requirement 11: Enrollment Code Compatibility

**User Story:** As a platform architect, I want the application flow to coexist with the existing enrollment code system, so that existing programmes are not disrupted.

#### Acceptance Criteria

1. WHEN a Programme has `onboarding_mode` of `code`, THE System SHALL behave identically to the current system — no application UI or logic is presented
2. WHEN a Programme has `onboarding_mode` of `hybrid`, THE System SHALL allow both the enrollment code flow and the application flow to operate simultaneously for the same Programme
3. THE System SHALL ensure that a Learner enrolled via code and a Learner enrolled via accepted Application both receive identical access to Programme content
4. WHEN an Enrollment is created via Application acceptance, THE System SHALL use the same `enrollments` table structure as code-based enrollment, adding only `enrollment_source` and `application_id` fields
5. THE System SHALL not modify or break any existing enrollment code validation logic in `EnrollmentService`

---

### Requirement 12: Convener Dashboard — Applications View

**User Story:** As a convener, I want a dedicated section in my dashboard for managing applications, so that I can efficiently process applicants without leaving the platform.

#### Acceptance Criteria

1. WHEN a Convener navigates to a Programme with `onboarding_mode` of `application` or `hybrid`, THE System SHALL display an "Applications" tab or section in the Programme management view
2. WHEN the Applications section is displayed, THE System SHALL show a summary count of Applications by status (submitted, under_review, accepted, rejected, waitlisted)
3. WHEN a Convener views the Applications list, THE System SHALL display each Application as a row with: applicant name, submission date, status badge, and action buttons (Review, Accept, Reject, Waitlist)
4. WHEN a Convener accepts or rejects an Application from the list view, THE System SHALL update the Application status inline without requiring a full page reload
5. THE System SHALL allow a Convener to export the Applications list as a CSV file containing applicant name, email, submission date, status, and reviewer notes



---

### Requirement 13: Organisation Page — Multi-Programme Discovery

**User Story:** As a convener, I want a public organisation page that lists all my open programmes, so that applicants can discover and apply to multiple programmes from a single link I can share.

#### Acceptance Criteria

1. WHEN a Convener sets an `organisation_slug` on their profile, THE System SHALL generate a public Organisation_Page at `/org/[organisation_slug]` listing all of that Convener's Programmes with `onboarding_mode` of `application` or `hybrid` that are in `recruiting` status
2. WHEN an Applicant visits the Organisation_Page, THE System SHALL display the Convener's organisation name, a brief description (if set), and a card for each open Programme showing: programme name, description, application deadline (if set), and an "Apply" button
3. WHEN an Applicant clicks "Apply" on a Programme card from the Organisation_Page, THE System SHALL navigate them to that Programme's individual Application_Form URL
4. WHEN a Convener has no Programmes in `recruiting` status with `onboarding_mode` of `application` or `hybrid`, THE System SHALL display the Organisation_Page with an empty state message indicating no programmes are currently accepting applications
5. THE System SHALL allow a Convener to copy their Organisation_Page URL from the Convener Dashboard for sharing externally
6. WHEN a Convener's `organisation_slug` is not yet set, THE System SHALL prompt the Convener to set one from their profile settings before the Organisation_Page feature is available
7. THE System SHALL enforce that `organisation_slug` values are unique across all Conveners, URL-safe (lowercase alphanumeric and hyphens only), and between 3 and 50 characters
8. WHEN an Applicant has already submitted an Application to a Programme listed on the Organisation_Page, THE System SHALL display that Programme card with a "Applied" badge instead of the "Apply" button (only when the Applicant is authenticated)
9. WHEN a Convener views their Convener Dashboard, THE System SHALL display a cross-programme applications summary showing all Applications across all their Programmes, with the ability to filter by programme
10. WHEN a Convener views a cross-programme applicant (an Applicant who has applied to more than one of the Convener's Programmes), THE System SHALL surface this relationship in the review interface so the Convener is aware of the overlap
