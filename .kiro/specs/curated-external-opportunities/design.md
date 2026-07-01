# Design Document: Curated External Opportunities

## Overview

The Curated External Opportunities feature adds an "Opportunities" board to Cohortle where conveners post external links (jobs, grants, fellowships, events, scholarships, competitions) for their learners, and admins can post platform-wide opportunities visible to all authenticated users.

The feature touches:
- **Backend**: 2 new database tables, a service layer, and REST routes registered in `app.js`
- **Frontend**: API client additions to `convener.ts`, a new `opportunities.ts` API file, two new pages (`/opportunities`, `/convener/programmes/[id]/opportunities`), and supporting components

---

## Architecture

### Data Flow

```
Convener creates opportunity
  → POST /v1/api/programmes/:id/opportunities
  → OpportunitiesService.createOpportunity(userId, programmeId, data)
  → INSERT into opportunities table
  → Return created opportunity

Learner views opportunities
  → GET /v1/api/opportunities (with auth)
  → OpportunitiesService.getLearnerOpportunities(userId, filters)
  → SELECT from opportunities WHERE
      (scope = 'programme' AND programme_id IN learner's enrolled programmes)
      OR (scope = 'platform')
      AND is_active = true AND (deadline IS NULL OR deadline >= today)
  → Return sorted/filtered list

Learner saves/unsaves
  → POST/DELETE /v1/api/opportunities/:id/save
  → INSERT/DELETE from saved_opportunities
```

### Component Hierarchy

```
/opportunities (learner page)
├── OpportunitiesPage
│   ├── OpportunityFilters (type filter + saved toggle)
│   ├── OpportunityList
│   │   ├── OpportunityCard (×N)
│   │   └── EmptyState
│   └── OpportunityDetailModal (on card click)

/convener/programmes/[id]/opportunities (convener tab)
├── ConvenerOpportunitiesSection
│   ├── CreateOpportunityForm
│   ├── OpportunityManagementList
│   │   └── OpportunityManagementRow (×N)
│   │       ├── Edit (inline modal)
│   │       ├── Toggle active/inactive
│   │       └── Delete (with confirm)

/internal/admin/opportunities (admin — future)
```

---

## Database Schema

### `opportunities` table

```sql
CREATE TABLE opportunities (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  type          ENUM('job','grant','fellowship','scholarship','event','competition','other') NOT NULL,
  external_url  TEXT NOT NULL,
  source_name   VARCHAR(255) NULL,
  deadline      DATE NULL,
  location      VARCHAR(255) NULL,
  scope         ENUM('programme','platform') NOT NULL DEFAULT 'programme',
  programme_id  INT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_opp_programme_id (programme_id),
  INDEX idx_opp_scope (scope),
  INDEX idx_opp_is_active (is_active),
  INDEX idx_opp_deadline (deadline)
);
```

### `saved_opportunities` table

```sql
CREATE TABLE saved_opportunities (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id   INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved (user_id, opportunity_id),
  INDEX idx_saved_user (user_id)
);
```

---

## Backend Design

### Service: `OpportunitiesService.js`

```
createOpportunity(createdByUserId, programmeId, data)          → opportunity
listConvenerOpportunities(convenerUserId, programmeId)         → opportunity[]
getLearnerOpportunities(learnerUserId, { type, includeExpired }) → opportunity[]
getOpportunity(id)                                              → opportunity
updateOpportunity(id, data, requestingUserId, requestingRole)  → opportunity
toggleActive(id, isActive, requestingUserId, requestingRole)   → opportunity
deleteOpportunity(id, requestingUserId, requestingRole)        → void
saveOpportunity(userId, opportunityId)                          → void
unsaveOpportunity(userId, opportunityId)                        → void
getSavedOpportunities(userId)                                   → opportunity[]
```

### Routes: `routes/opportunities.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/api/programmes/:programme_id/opportunities` | convener | Create opportunity |
| GET | `/v1/api/programmes/:programme_id/opportunities` | convener | List programme opportunities |
| GET | `/v1/api/opportunities` | learner/student | Learner opportunities feed |
| GET | `/v1/api/opportunities/saved` | learner/student | Saved opportunities |
| POST | `/v1/api/opportunities/:id/save` | learner/student | Save opportunity |
| DELETE | `/v1/api/opportunities/:id/save` | learner/student | Unsave opportunity |
| PUT | `/v1/api/opportunities/:id` | convener OR admin | Update opportunity |
| DELETE | `/v1/api/opportunities/:id` | convener OR admin | Delete opportunity |
| PATCH | `/v1/api/opportunities/:id/status` | convener OR admin | Toggle is_active |
| POST | `/v1/api/admin/opportunities` | admin | Create platform opportunity |
| GET | `/v1/api/admin/opportunities` | admin | List platform opportunities |

---

## Frontend Design

### API Client additions

**`cohortle-web/src/lib/api/opportunities.ts`** — new file
- `getOpportunities(filters)` → learner feed
- `getSavedOpportunities()` → saved list
- `saveOpportunity(id)` → bookmark
- `unsaveOpportunity(id)` → remove bookmark
- `createOpportunity(programmeId, data)` → convener create
- `listProgrammeOpportunities(programmeId)` → convener list
- `updateOpportunity(id, data)` → convener/admin edit
- `deleteOpportunity(id)` → delete
- `toggleOpportunityStatus(id, isActive)` → toggle

### Key Components

**`OpportunityCard`** (`components/opportunities/OpportunityCard.tsx`)
- Type badge with colour per type
- Title, source name, location, deadline
- "Closing soon" indicator (deadline ≤ 7 days)
- Bookmark toggle button
- Click opens `OpportunityDetailModal`

**`OpportunityDetailModal`** (`components/opportunities/OpportunityDetailModal.tsx`)
- Full description (sanitised)
- "Apply / Learn More" button (opens external URL in new tab, `noopener noreferrer`)
- Save/unsave button
- Type, source, location, deadline details

**`OpportunityFilters`** (`components/opportunities/OpportunityFilters.tsx`)
- Type filter: All | Job | Grant | Fellowship | Scholarship | Event | Competition | Other
- Saved toggle

**`ConvenerOpportunitiesSection`** (`components/convener/ConvenerOpportunitiesSection.tsx`)
- List of programme opportunities with status indicators
- Inline create form
- Edit modal reusing create form fields
- Toggle active/inactive per row
- Delete with `DeleteConfirmModal`

### Pages

**`/opportunities`** (`app/opportunities/page.tsx`)
- Learner-accessible
- Uses `OpportunityFilters`, `OpportunityList`, `OpportunityDetailModal`
- Skeleton loader on fetch, error state with retry
- Empty state when no active opportunities

**`/convener/programmes/[id]/opportunities`** (`app/convener/programmes/[id]/opportunities/page.tsx`)
- New tab on the programme management area
- Uses `ConvenerOpportunitiesSection`

---

## Sorting Logic

Opportunities are returned from the API sorted as:
1. `deadline ASC NULLS LAST` (upcoming deadlines first, no-deadline items last)
2. `created_at DESC` as secondary sort

---

## Correctness Properties

**Property 1: Learner scope isolation**
For any learner, the opportunities feed MUST NOT contain programme-scoped opportunities from programmes they are not enrolled in.

**Property 2: Expired opportunity filtering**
For any current date D, opportunities with `deadline < D` MUST be excluded from the default learner feed unless `include_expired=true` is passed.

**Property 3: Save uniqueness**
For any (user_id, opportunity_id) pair, calling saveOpportunity twice MUST result in exactly one row in `saved_opportunities` (idempotent).

**Property 4: Convener scope enforcement**
For any convener C, they MUST only be able to edit/delete opportunities where `created_by = C.id` OR `programme_id` belongs to a programme they own.

**Property 5: External URL validation**
For any opportunity URL, it MUST begin with `https://` to be accepted.

---

## Tasks

- [ ] 1. Database — migrations and models
  - [ ] 1.1 Create `cohortle-api/migrations/YYYYMMDD-create-opportunities.js`
  - [ ] 1.2 Create `cohortle-api/migrations/YYYYMMDD-create-saved-opportunities.js`
  - [ ] 1.3 Create `cohortle-api/models/opportunities.js` Sequelize model
  - [ ] 1.4 Create `cohortle-api/models/saved_opportunities.js` Sequelize model

- [ ] 2. Backend service
  - [ ] 2.1 Create `cohortle-api/services/OpportunitiesService.js`
  - [ ] 2.2 Implement all service methods with access control

- [ ] 3. Backend routes
  - [ ] 3.1 Create `cohortle-api/routes/opportunities.js`
  - [ ] 3.2 Register in `app.js` (already done)

- [ ] 4. Frontend API client
  - [ ] 4.1 Create `cohortle-web/src/lib/api/opportunities.ts`

- [ ] 5. Frontend components
  - [ ] 5.1 `OpportunityCard`
  - [ ] 5.2 `OpportunityDetailModal`
  - [ ] 5.3 `OpportunityFilters`
  - [ ] 5.4 `ConvenerOpportunitiesSection`

- [ ] 6. Frontend pages
  - [ ] 6.1 Learner `/opportunities` page
  - [ ] 6.2 Convener `/convener/programmes/[id]/opportunities` page
  - [ ] 6.3 Add "Opportunities" link to learner nav

- [ ] 7. Checkpoint — verify end-to-end
