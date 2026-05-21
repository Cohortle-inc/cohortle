# Discover Programmes — Technical Design

## Overview

The discover feature adds a public, server-rendered discovery layer at `/discover` that lets potential learners find and apply to open programmes without needing an invite code. It is the top of the growth funnel: Discover → Organisation → Apply.

## Architecture

### Visibility Rule

A programme appears on `/discover` if and only if:

```
lifecycle_status = 'recruiting'
AND onboarding_mode IN ('application', 'hybrid')
AND (application_deadline IS NULL OR application_deadline >= NOW())
```

This is intentional. Programmes with `lifecycle_status = 'active'` are already running cohorts and are not recruiting. Only `recruiting` programmes with an application-based onboarding mode are surfaced. Expired deadlines are excluded automatically.

### Data Flow

```
Browser → GET /discover?q=...&format=...
  → Next.js server component (ISR, revalidate 300s)
    → fetch() → cohortle-api GET /v1/api/programmes/discover
      → Raw SQL JOIN programmes + users
        → Returns enriched programme list
```

The page is server-rendered for SEO. It revalidates every 5 minutes via ISR (`revalidate = 300`). No client-side fetching is used on the discover page itself.

## Backend: `/v1/api/programmes/discover`

**File:** `cohortle-api/routes/programme.js` (line 1437)

**Auth:** None required — public endpoint, `UrlMiddleware` only.

**Route ordering:** Registered before `/:programme_id` to prevent Express param shadowing.

### Query Parameters

| Param | Type | Behaviour |
|---|---|---|
| `q` | string | LIKE search across `name`, `description`, `highlights`, `learning_outcomes`, `organisation_name` |
| `format` | `online` \| `in-person` \| `hybrid` | Exact match on `programmes.format` |
| `free` | `true` | Matches `price_info IS NULL` or contains "free"/"funded" (case-insensitive) |
| `closingSoon` | `true` | `application_deadline BETWEEN NOW() AND NOW() + 7 days` |
| `sort` | `closing` \| `newest` \| `name` | Default: `closing` (nulls last, then soonest deadline) |
| `limit` | integer | Default 50, max 100 |

### Response Shape

```json
{
  "error": false,
  "message": "Discoverable programmes fetched successfully",
  "programmes": [
    {
      "id": 1,
      "name": "Leadership Fellowship",
      "description": "...",
      "application_deadline": "2026-06-30T00:00:00.000Z",
      "application_form_slug": "leadership-fellowship-2026",
      "onboarding_mode": "application",
      "lifecycle_status": "recruiting",
      "format": "hybrid",
      "duration": "12 weeks",
      "highlights": ["Weekly live sessions", "Mentorship"],
      "learning_outcomes": null,
      "prerequisites": null,
      "price_info": "Fully funded",
      "thumbnail_url": "https://...",
      "organisation_slug": "wecarefng",
      "organisation_name": "WeCare Foundation",
      "organisation_url": "/org/wecarefng",
      "apply_url": "/apply/leadership-fellowship-2026"
    }
  ]
}
```

`highlights` and `learning_outcomes` are normalised from MySQL JSON columns (which may be returned as strings) into arrays or null.

`organisation_url` is derived from `organisation_slug` — null if the org has no slug.
`apply_url` is derived from `application_form_slug` — null if no form is configured.

## Frontend: `/discover`

**File:** `cohortle-web/src/app/discover/page.tsx`

**Rendering:** Server component, ISR with `revalidate = 300`.

**SEO:** Full `<Metadata>` with title, description, and OpenGraph tags.

### Filter Form

A native HTML `<form>` with `GET` method. Submitting the form appends query params to the URL, which Next.js passes as `searchParams` to the server component. No JavaScript required for filtering — works without JS.

Filters:
- Keyword text input (`name="q"`)
- Format select (`name="format"`)
- Sort select (`name="sort"`)
- Free/funded checkbox (`name="free" value="true"`)
- Closing within 7 days checkbox (`name="closingSoon" value="true"`)

### ProgrammeCard Component

Inline server component. Renders:
- Thumbnail (if present)
- Format, duration, price badges
- Organisation name (attribution)
- Programme name and description (3-line clamp)
- Highlights list (up to 3 bullets)
- Deadline label with urgency copy ("Closing soon: X" if ≤7 days)
- Apply button → `/apply/[slug]`
- View organisation button → `/org/[slug]` (if org has a slug)

### Deadline Label Logic

```
days <= 0  → "Closes {date}"
days <= 7  → "Closing soon: {date}"
days > 7   → "Deadline: {date}"
null       → not shown
```

Dates formatted in `en-GB` locale (e.g. "30 Jun 2026").

## Routing Changes

| Old route | New route | Method |
|---|---|---|
| `/browse` | `/discover` | 301 redirect via `redirect()` in `browse/page.tsx` |

Navigation references updated:
- `NavigationHandlers.tsx` → `handleBrowseProgrammes()` pushes `/discover`
- `EnhancedEmptyState.tsx` → `router.push('/discover')`
- `LearnerNavBar.tsx` → nav link `{ href: '/discover', label: 'Discover' }`

## Model: `programmes`

**File:** `cohortle-api/models/programmes.js`

Enrichment fields added (via migration `20260422000012-add-programme-enrichment-fields.js`):

| Field | Type | Purpose |
|---|---|---|
| `format` | ENUM(`online`, `in-person`, `hybrid`) | Display badge, filter |
| `duration` | STRING(100) | Display badge (e.g. "12 weeks") |
| `highlights` | JSON | Bullet points on card |
| `learning_outcomes` | JSON | Future use |
| `prerequisites` | TEXT | Future use |
| `price_info` | STRING(255) | Display badge, free filter |
| `intro_video_url` | STRING(500) | Future use |
| `thumbnail_url` | STRING(500) | Card image |

## TypeScript Types

**File:** `cohortle-web/src/lib/api/programmes.ts`

```typescript
export interface DiscoverProgramme {
  id: number;
  name: string;
  description: string | null;
  application_deadline: string | null;
  application_form_slug: string | null;
  onboarding_mode: 'application' | 'hybrid';
  lifecycle_status: 'recruiting';
  format: 'online' | 'in-person' | 'hybrid' | null;
  duration: string | null;
  highlights: string[] | null;
  learning_outcomes: string[] | null;
  prerequisites: string | null;
  price_info: string | null;
  thumbnail_url: string | null;
  organisation_slug: string | null;
  organisation_name: string;
  organisation_url: string | null;
  apply_url: string | null;
}

export interface DiscoverProgrammesResponse {
  error: boolean;
  message: string;
  programmes: DiscoverProgramme[];
}
```

A `getDiscoverProgrammes()` client function also exists for any future client-side usage, though the page itself uses direct `fetch()` for SSR.

## Out of Scope (Phase 1)

The following spec requirements are deferred to later phases:

- **Bookmarking (AC-4):** Local storage + account migration
- **Email notifications (AC-5):** Subscription form + Resend integration
- **Featured/pinned programmes (AC-3):** Requires convener-side tooling
- **Pagination (AC-8.3):** Current limit is 50 (max 100); cursor pagination deferred
- **XML sitemap (AC-6.5):** Deferred
- **Attribution tracking (AC-7.1–7.3):** Discovery source through to application
- **Analytics events (AC-10):** Filter usage, conversion tracking

## Known Issues / Notes

- The stale test assertion in `EnhancedEmptyState.pbt.tsx` (line 188) still expects `mockPush` to be called with `/browse`. This should be updated to `/discover` before running the test suite.
- The pre-existing duplicate `POST /v1/api/programmes/:programme_id/publish` route (lines 2371 and 2445 in `programme.js`) is unrelated to this feature but should be cleaned up separately.
