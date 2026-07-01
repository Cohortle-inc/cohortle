# Phase 2 Design: Convener Learner Management (Cohort CRM)

Following the successful implementation of Phase 1 (Learner Directory & Status Management), this document outlines the audit and design for **Phase 2**, focusing on Cross-Programme History, Activity Tracking, and Completion Tracking.

---

# Part 1: Current State Audit

## 1.1 Learner History
The system has a distributed but comprehensive record of learner history across the following sources:

| Data Point | Data Source (Table) | Current State |
| :--- | :--- | :--- |
| **Completed Programmes** | `enrollments` (status='completed') | Identified via status in Phase 1. |
| **Current Enrollments** | `enrollments` (status='active') | Accessible via `EnrollmentService`. |
| **Cohort Participation** | `enrollments` joined with `cohorts` | Tracks which specific instances a user joined. |
| **Applications Submitted** | `applications` | Full history of interest and reviewer notes. |
| **Programme Acceptances** | `applications` (status='accepted') | Maps directly to conversion. |
| **Achievements/Streaks** | `user_achievements`, `user_streaks` | Tracks milestones and consistent engagement. |

**Existing contributions to history:**
*   `enrollments`: The source of truth for participation.
*   `applications`: The record of intent and acceptance.
*   `community_members`: Records social integration.

## 1.2 Activity Tracking
Cohortle already records most critical engagement signals. We do not need a new event infrastructure yet.

| Activity Type | Status | Location |
| :--- | :--- | :--- |
| **Lesson Completion** | **Exists** | `lesson_completions` (Timestamped) |
| **Assignment Submission** | **Exists** | `assignment_submissions` (Timestamped) |
| **Community Posts** | **Exists** | `cohort_posts` (Timestamped) |
| **Comments** | **Exists** | `post_comments`, `lesson_comments` |
| **Quiz Completion** | **Exists** | `quiz_attempts` (Timestamped) |
| **General Audit Trail** | **Exists** | `activity_logs` (Tracks enrollments/completions/comments) |
| **Login Activity** | **Missing** | Not granularly tracked. |
| **Streak activity** | **Exists** | `user_streaks.last_activity_date` |

## 1.3 Completion Tracking
*   **Mechanism:** `ProgressService` calculates completion by counting rows in `lesson_completions` against total lessons in a cohort's weeks.
*   **Cache:** The results are stored in `programme_progress` (`completion_percentage`, `completed_lessons`).
*   **Milestones:** Currently manual or status-based (`enrollments.status = 'completed'`).

---

# Part 2: Product Review

Evaluating the Convener's ability to manage learners today:

### Learner Understanding
*   **Who is this learner? (Can answer today):** Basic identity is available in the directory.
*   **What programmes participated in? (Partially answer):** Convener can see their own programmes, but lacks a cross-organisation history.
*   **Are they active elsewhere? (Cannot answer):** No visibility into global activity.
*   **Have they completed previous programmes? (Partially answer):** Limited to current convener's silo.

### Engagement
*   **Is this learner active? (Can answer today):** Visible via completion % and status.
*   **When were they last active? (Can answer today):** Stored in `programme_progress.last_activity_at`.
*   **Are they at risk of dropping off? (Cannot answer):** No automated analysis or alerts.

### Outcomes
*   **Who completed my programme? (Can answer today):** Filterable in directory.
*   *Who is highly engaged? (Partially answer):** Inferred by sorting progress, but lacks "Community Activity" weight.

---

# Part 3: Recommended Future State

Design for a **Convener-facing Learner Profile** (Detail View):

## 3.1 Learner Overview
*   **Profile Header:** Name, Email, Bio, Join Date.
*   **Reputation Badge:** "Cohortle Member for 1 year • 95% Completion across 3 programmes".

## 3.2 Programme History
*   **Timeline of Programmes:** Chronological list of Enrolled, Completed, and Withdrawn cohorts.
*   **Application Log:** History of all applications to this convener's programmes (including rejections/withdrawals).

## 3.3 Activity Timeline (The "Learner Story")
A chronological feed aggregated from existing tables:
*   *June 12:* Completed Lesson "Unit 1: Fundamentals"
*   *June 10:* Submitted Assignment "Market Research Report"
*   *June 08:* Posted in "General Discussion"
*   *June 01:* Joined Cohort "Summer 2026 Batch"

## 3.4 Engagement Summary
*   **Stats:** Total Lessons, Assignments, Quiz Average, Community Post Count.
*   **Velocity:** Lessons completed per week compared to cohort average.

---

# Part 4: Architecture Review

### 4.1 Cross-Programme History
**Approach:** **Calculate dynamically.**
*   **Rationale:** Querying `enrollments` for a specific `user_id` across all cohorts is lightweight. No need for a redundant "global profile" table. A `LearnerHistoryService` can provide this aggregation for the UI.

### 4.2 Activity Tracking
**Approach:** **Reuse existing signals via a Timeline Service.**
*   **Rationale:** We do **not** need a new `activity_events` table. Instead, a `TimelineService` should perform a `UNION` query (or concurrent fetches) on `lesson_completions`, `assignment_submissions`, and `cohort_posts`. This tells a rich story without the overhead of maintaining a separate duplicate event log.

### 4.3 Completion Tracking
**Approach:** **Derived for Logic, Explicit for Status.**
*   **Rationale:** Keep the dynamic calculation for real-time progress. However, when a user hits 100%, trigger a background job to update `enrollments.status` to `completed`. This allows for fast "Outcomes" reporting while maintaining the flexibility of the derived model.

---

# Part 5: Roadmap

## 5.1 Quick Wins (Immediate Value)
*   **Learner Detail View:** Clicking a learner in the directory opens their profile page.
*   **Personal Stats:** Show "Lessons Completed" vs "Total" and "Assignments Submitted" on the profile page using simple `COUNT` queries on existing tables.
*   **Application History:** Link the learner to their previous application records.

## 5.2 Phase 2 MVP (Aggregation)
*   **Aggregated Timeline:** Implement the `TimelineService` to show the chronological engagement feed.
*   **Platform-wide reputation:** Allow conveners to see completion stats from other organisations (if privacy settings allow) to identify "vetted" learners.
*   **Last Active Visibility:** Surface the `last_activity_at` date directly in the main Learner Directory table.

## 5.3 Future Vision
*   **Employability Profile:** A shareable portfolio for the learner showcasing their assignments and achievements.
*   **At-Risk Alerts:** Automated flagging of learners who haven't completed a lesson in X days.
*   **Reputation Score:** A metric combining completion rate, assignment grades, and community participation to rank top talent.
