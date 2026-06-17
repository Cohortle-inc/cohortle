# Cohortle: Convener Learner Management Audit & Phase 1 Design

**Date:** March 10, 2026
**Status:** Final Audit & Recommendations

---

## 1. Current State Audit

### 1.1 Learner Data Model
The current platform architecture follows a clear hierarchical relationship for learner participation:

**User (Identity)**
  ↓
**Enrollment (Participation - Source of Truth)**
  ↓
**Cohort (Instance)**
  ↓
**Programme (Structure)**

*   **Users:** Stores platform-wide accounts with roles (Learner, Convener, Administrator).
*   **Enrollments:** Currently used in the WLIMP (Week-based) system to link users to cohorts via UUID.
*   **Cohorts:** Instances of a programme with unique enrollment codes.
*   **Programmes:** High-level containers owned by a Convener.
*   **Cohort Members:** A secondary table (INT-based) used in some modules, creating a slight inconsistency with the UUID-based `enrollments` table.

### 1.2 Existing Capabilities
Currently, the platform is **content-centric**. A convener can build a programme, but has limited visibility into the learners once they join.

| Capability | Status | Notes |
| :--- | :--- | :--- |
| View learners in a programme | **Missing** | No dedicated UI or API aggregation. |
| View all learners across programmes | **Missing** | Directory view does not exist. |
| Search/Filter learners | **Missing** | No search or filtering logic implemented. |
| View learner progress | **Partially Exists** | Data in `lesson_progress`, but no convener-facing view. |
| Suspend / Remove Access | **Missing** | Enrollment status management is currently unimplemented. |

### 1.3 How a Convener Answers Questions Today:
*   **Who are all my learners?** Not possible in the UI. Requires SQL query on `enrollments` joined with `users`.
*   **Which programme is a learner in?** Only visible by checking enrollments for a specific user ID.
*   **What is a learner's progress?** Requires manual inspection of the `lesson_progress` table.

---

## 2. Experience Audit

*   **Scale of 1 Programme (30 learners):** Manageable but high friction for administrative tasks like manually checking who has joined.
*   **Scale of 5 Programmes (500 learners):** **Unmanaged.** The platform currently lacks the administrative tools to handle this volume. There is no way to perform bulk actions or get a high-level view of ecosystem health.
*   **Administrative Workload:** High. Any "management" of learners currently happens outside the platform (e.g., in spreadsheets).
*   **Reporting:** Non-existent in the current UI.

---

## 3. Product Review
The current model works well for **content delivery** but limits Cohortle's vision as an **"Operating System for Programmes."**

To support Fellowships and Accelerators, Cohortle must transition from an LMS to a **Cohort CRM**, where the relationship with the learner (the Enrollment) is as important as the content itself.

---

## 4. Best Practice Research
*   **Patterns to Adopt:**
    *   **Mini-CRM (Kajabi/Thinkific):** A centralized "People" tab for all administrative actions.
    *   **Space-Specific Status (Circle):** Overriding access at the cohort level without banning the user from the platform.
*   **Cohortle's Opportunity:** Leveraging the existing multi-programme identity to provide a "Cross-Programme Learner History" that traditional LMS platforms struggle with.

---

## 5. Phase 1 Design: The "Cohort CRM"

### 5.1 Requirements
*   **Centralized Directory:** Cross-programme enrollment view for conveners.
*   **Status Management:** Enrollment-specific statuses (Active, Suspended, Removed).
*   **Access Control:** Real-time enforcement of status at the API level.

### 5.2 Database Changes
Exactly one migration is required:
```sql
ALTER TABLE enrollments
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active';
CREATE INDEX idx_enrollments_status ON enrollments(status);
```

### 5.3 API Design
*   **`GET /v1/api/convener/learners`**: Aggregates enrollments joined with user data across all programmes owned by the convener. Supports search (`name`/`email`) and filters (`programme`, `cohort`, `status`).
*   **`PATCH /v1/api/enrollments/:id/status`**: Updates the enrollment status with immediate effect on access.

### 5.4 UI Design
*   **"Learners" Section:** A new navigation item in the Convener Dashboard.
*   **The Table:** Displays Name, Email, Programme/Cohort, Status, and Join Date.
*   **Management Actions:** Inline buttons for "Suspend" and "Remove."

---

## 6. Roadmap

### Quick Wins (High Impact / Low Effort)
1.  **Status Migration:** Add the `status` column to `enrollments`.
2.  **Status PATCH API:** Enable programmatic suspension/removal.

### MVP Implementation (Required for Phase 1)
1.  **Learner Directory API:** Aggregated cross-programme query.
2.  **Directory UI:** The searchable/filterable table for conveners.
3.  **Access Enforcement:** Update content delivery services to respect the `suspended` status.

### Strategic Long-Term Features
1.  **Application Workflow:** "Apply → Review → Accept → Enroll" pipeline.
2.  **Engagement Analytics:** "At-Risk" flags based on inactivity.
3.  **Alumni Management:** Automated workflows for learners with 'Completed' status.

---

## Conclusion
This design aligns with the "Final Direction" for Phase 1 by anchoring all management actions on the **Enrollment** record, ensuring Cohortle scales into a powerful Relationship Management System for non-formal education.
