# Phase 2 Future Readiness Review: Learner Intelligence

This document evaluates the current Learner Intelligence architecture (Phase 2) against the long-term requirements for Cohortle's growth as an "operating system for programmes."

## Evaluation Summary

| Capability | Readiness | Notes |
| :--- | :--- | :--- |
| **Payments** | Minor Extension | Requires `payments` table joined to `enrollments`. |
| **Attendance** | Minor Extension | Requires a new `attendance` table tracked by `session_id` and `user_id`. |
| **Certificates** | Minor Extension | Can be derived from `programme_progress` and status. |
| **Mentor Notes** | Minor Extension | Requires a `notes` table with polymorphic relationship to `user_id`. |
| **Internal Learner Tags** | Minor Extension | Requires a many-to-many relationship between `users` and `tags`. |
| **Risk Scoring** | Minor Extension | Derived metric based on activity velocity and progress gaps. |
| **Learner Messaging** | Architectural Change | Requires full chat/notification infrastructure and real-time state. |
| **AI Learner Insights** | Minor Extension | Can consume the existing `activity_timeline` and `progress` APIs. |
| **Employer Outcomes** | Minor Extension | Metadata addition to the `GlobalLearnerProfile`. |
| **Alumni Tracking** | Supported Today | Visibility exists via `History` tab (status='completed'). |
| **Multi-convener Collaboration**| Architectural Change | Requires "Organisation" level RBAC and shared access logic. |
| **Organisation-wide Records** | Minor Extension | The `GlobalLearnerProfile` is already designed for this. |

---

## Detailed Evaluation

### 1. Payments & Attendance
*   **Current State**: No visibility into financial standing or physical/live presence.
*   **Recommendation**: The `LearnerDetail` interface should be extended to include a `financialStatus` object. Since `enrollments` is the central join for learners, adding a one-to-many relationship with a `payments` table is the logical path. Attendance should be aggregated in the `stats` object of the `GlobalLearnerProfile`.

### 2. Mentor Notes & Internal Tags
*   **Current State**: Profiles are read-only views of system activity.
*   **Recommendation**: To move toward a "CRM-style" dashboard, the backend must support a `POST /v1/api/convener/learners/:id/notes` endpoint. The frontend `LearnerDetailPage` is already tabbed, making the addition of a "Mentor Notes" tab trivial without affecting the existing "Intelligence" tabs.

### 3. Risk Scoring & AI Insights
*   **Current State**: Stats are static snapshots (Total Lessons, %).
*   **Recommendation**: The `TimelineService` implemented in Phase 2 provides the perfect data source for a "Risk Engine." By calculating the gap between the last activity timestamp and the cohort average, we can generate a `riskScore`. This score should be surfaced as a color-coded badge in the `LearnerTable`.

### 4. Multi-convener Collaboration
*   **Current State**: Access is silos to the `created_by` or direct owner.
*   **Recommendation**: **Architectural Change**. We need to move from "Convener owns Programme" to "Organisation owns Programme", where multiple conveners have permissions. The `useConvenerAPI` hooks will need to shift from fetching "My" programmes to fetching "Organisation" programmes based on an `org_id` in the JWT.

### 5. Learner Messaging
*   **Current State**: mailto: links only.
*   **Recommendation**: **Architectural Change**. Implementing an in-app messaging system requires a dedicated WebSocket or polling service. However, the UI is already "prepared" for this via the "Message Learner" button placeholder added in the stabilization sprint.

---

## Preferred Architecture for CRM Capabilities

To support high-scale management of 2,000+ learners, the architecture should transition to a **"Learner-Centric Event Store"**:

1.  **Unified Activity Schema**: Instead of UNIONing multiple tables (completions, posts, assignments), the backend should asynchronously project these events into a single `activity_feed` table for O(1) retrieval.
2.  **Metadata Field**: Add a JSONB `metadata` field to the `enrollments` table. This allows for immediate support of Tags, Custom Fields, and Risk Scores without migrating schemas every time a new feature is added.
3.  **Scoped Intelligence API**: The `getGlobalProfile` API should accept a scope parameter (e.g., `scope=organisation` or `scope=programme`) to allow for flexible data leakage control as multi-convener features are added.
