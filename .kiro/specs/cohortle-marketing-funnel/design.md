# Design Document: Cohortle Marketing Funnel

## Overview

The Cohortle Marketing Funnel is a purpose-built conversion system layered on top of the existing `cohortle-web` (Next.js App Router) and `cohortle-api` (Express) codebases. It introduces new public-facing pages under `/apply`, a new internal demo guide page, a new `funnel_leads` database table, a new `Funnel_API` route module, two new Resend email templates (`demo_booking_confirmation` and `demo_follow_up`), and an optional `demo_reminder` template.

The funnel is intentionally application-gated — visitors must go through a qualification form before booking a demo — giving it a premium, selective feel that aligns with Cohortle's positioning.

---

## Architecture

```
Visitor Browser
      │
      ▼
cohortle-web (Next.js App Router)
  /                          → Homepage (redesigned)
  /apply                     → Pre-Form Landing Page
  /apply/form                → Interest Form + Calendly embed
  /apply/confirmation        → Confirmation Page
  /internal/demo-guide       → Demo Guide (auth-gated)
      │
      │  POST /v1/api/funnel/leads
      │  GET  /v1/api/funnel/leads
      │  POST /v1/api/funnel/leads/:id/close
      │  PATCH /v1/api/funnel/leads/:id/status
      ▼
cohortle-api (Express)
  routes/funnel.js
  services/FunnelService.js
  models/funnel_leads.js
      │
      ├── ResendService (existing) — new templates added
      └── DB (Sequelize) — new funnel_leads table
```

The frontend communicates with the API via the existing `/api/proxy/[...path]` Next.js proxy route, keeping the same auth and CORS patterns already in use across the app.

---

## Components and Interfaces

### Frontend Components (cohortle-web)

#### Pages

| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Homepage — updated with funnel sections |
| `/apply` | `src/app/apply/page.tsx` | Pre-form landing page |
| `/apply/form` | `src/app/apply/form/page.tsx` | Interest form + Calendly |
| `/apply/confirmation` | `src/app/apply/confirmation/page.tsx` | Post-submission confirmation |
| `/internal/demo-guide` | `src/app/internal/demo-guide/page.tsx` | Auth-gated demo script |

#### Shared Marketing Components

```
src/components/marketing/
  HeroSection.tsx          — Headline, subheadline, dual CTAs
  ProblemSection.tsx       — Pain points grid
  SolutionSection.tsx      — Cohortle solution overview
  UseCasesSection.tsx      — Organisation type cards
  HowItWorksSection.tsx    — 3-step numbered flow
  SocialProofSection.tsx   — Partner logos + testimonials
  FinalCtaSection.tsx      — Bottom CTA banner
  FunnelLayout.tsx         — Stripped layout (no nav) for /apply pages
```

#### Form Components

```
src/components/funnel/
  InterestForm.tsx         — Multi-section form with validation
  CalendlyEmbed.tsx        — Iframe wrapper for Calendly widget
  FormSection.tsx          — Reusable labelled section wrapper
```

#### API Client

```
src/lib/api/funnel.ts      — submitLead(payload): Promise<{id: string}>
```

### Backend Components (cohortle-api)

#### New Files

| File | Purpose |
|---|---|
| `routes/funnel.js` | Express route handlers for all funnel endpoints |
| `services/FunnelService.js` | Business logic: lead creation, status updates, email triggers |
| `models/funnel_leads.js` | Sequelize model for `funnel_leads` table |
| `migrations/YYYYMMDD-create-funnel-leads.js` | DB migration |

#### Updated Files

| File | Change |
|---|---|
| `services/ResendService.js` | Add `demo_booking_confirmation`, `demo_follow_up`, `demo_reminder` templates |
| `routes/email.js` | Add new types to the validation enum |
| `app.js` | Register `funnelRoutes(app)` |

---

## Data Models

### funnel_leads Table

```sql
CREATE TABLE funnel_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_name   VARCHAR(255) NOT NULL,
  contact_name        VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50),
  website             VARCHAR(500),
  programme_type      ENUM('fellowship','training','bootcamp','community','other') NOT NULL,
  participant_count   INTEGER,
  current_tools       TEXT,
  pain_points         TEXT,
  cohort_start_date   VARCHAR(100),
  demo_scheduled_at   TIMESTAMP WITH TIME ZONE,
  status              ENUM('new','contacted','demo_scheduled','demo_completed','partner')
                      NOT NULL DEFAULT 'new',
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_funnel_leads_email  ON funnel_leads(email);
CREATE INDEX idx_funnel_leads_status ON funnel_leads(status);
```

### Sequelize Model (funnel_leads.js)

```javascript
module.exports = (sequelize, DataTypes) => {
  const FunnelLead = sequelize.define('FunnelLead', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation_name: { type: DataTypes.STRING, allowNull: false },
    contact_name:      { type: DataTypes.STRING, allowNull: false },
    email:             { type: DataTypes.STRING, allowNull: false },
    phone:             { type: DataTypes.STRING },
    website:           { type: DataTypes.STRING },
    programme_type:    { type: DataTypes.ENUM('fellowship','training','bootcamp','community','other'), allowNull: false },
    participant_count: { type: DataTypes.INTEGER },
    current_tools:     { type: DataTypes.TEXT },
    pain_points:       { type: DataTypes.TEXT },
    cohort_start_date: { type: DataTypes.STRING },
    demo_scheduled_at: { type: DataTypes.DATE },
    status:            { type: DataTypes.ENUM('new','contacted','demo_scheduled','demo_completed','partner'),
                         defaultValue: 'new', allowNull: false },
  }, { tableName: 'funnel_leads', timestamps: true, underscored: true });
  return FunnelLead;
};
```

### API Payload Shapes

**POST /v1/api/funnel/leads** (request body)
```typescript
{
  organisation_name:  string;   // required
  contact_name:       string;   // required
  email:              string;   // required, valid email
  phone?:             string;
  website?:           string;
  programme_type:     'fellowship' | 'training' | 'bootcamp' | 'community' | 'other'; // required
  participant_count?: number;
  current_tools?:     string;
  pain_points?:       string;
  cohort_start_date?: string;
  demo_scheduled_at?: string;   // ISO 8601
}
```

**PATCH /v1/api/funnel/leads/:id/status** (request body)
```typescript
{ status: 'new' | 'contacted' | 'demo_scheduled' | 'demo_completed' | 'partner' }
```

### Email Template Data Shapes

**demo_booking_confirmation**
```typescript
{
  first_name:        string;
  organisation_name: string;
  demo_date:         string;   // human-readable
  confirmation_url:  string;
}
```

**demo_follow_up**
```typescript
{
  first_name:        string;
  organisation_name: string;
  onboarding_url:    string;
}
```

---

## Correctness Properties

*A property is a characteristic or behaviour that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid lead submission is persisted

*For any* valid lead payload (all required fields present, valid email), submitting it to `POST /v1/api/funnel/leads` should result in the lead being retrievable from the Lead_Store with the same field values.

**Validates: Requirements 4.1, 4.2**

---

### Property 2: Invalid lead payloads are rejected

*For any* lead payload missing at least one required field (organisation_name, contact_name, email, or programme_type), the API should return HTTP 400 and the Lead_Store should remain unchanged.

**Validates: Requirements 4.3, 4.4**

---

### Property 3: Status transition validity

*For any* existing lead and any valid status value from the allowed enum (`new`, `contacted`, `demo_scheduled`, `demo_completed`, `partner`), calling `PATCH /v1/api/funnel/leads/:id/status` should update the lead's status to the new value and return the updated record.

**Validates: Requirements 8.4, 8.5**

---

### Property 4: Email is triggered on lead creation

*For any* valid lead submission, the `demo_booking_confirmation` email should be dispatched to the lead's email address exactly once.

**Validates: Requirements 6.1, 4.5**

---

### Property 5: Email template round-trip data integrity

*For any* `demo_booking_confirmation` or `demo_follow_up` template data object, rendering the template should produce an HTML string that contains the organisation name and the contact's first name.

**Validates: Requirements 6.5, 8.3**

---

### Property 6: Unknown lead ID returns 404

*For any* lead ID that does not exist in the Lead_Store, calling `PATCH /v1/api/funnel/leads/:id/status` or `POST /v1/api/funnel/leads/:id/close` should return HTTP 404.

**Validates: Requirements 8.6**

---

## Error Handling

### Frontend

- **Form validation**: Client-side validation runs on submit. Each required field shows an inline error message below the input. The submit button is disabled while a submission is in flight.
- **API errors**: If the API returns a non-2xx response, the form displays a top-level error banner: "Something went wrong. Please try again or email us at hello@cohortle.com."
- **Calendly not loaded**: If the Calendly iframe fails to load, a fallback message is shown: "Can't load the scheduler? Email us at hello@cohortle.com to book manually."
- **Confirmation page direct access**: Redirect to `/apply` if no submission context is present (checked via sessionStorage flag set on successful submission).

### Backend

- **Validation errors**: Return `{ error: true, message: string, fields?: string[] }` with HTTP 400.
- **Not found**: Return `{ error: true, message: 'Lead not found' }` with HTTP 404.
- **Email send failure**: Log the error via `errorLogger` but still return HTTP 201 for the lead creation — the lead is stored even if the email fails. A retry mechanism can be added later.
- **Database errors**: Return HTTP 500 with a generic message; log the full error server-side.

---

## Testing Strategy

### Unit Tests

- `FunnelService.createLead()` — valid payload, missing required fields, invalid email
- `FunnelService.updateStatus()` — valid transition, unknown ID
- `FunnelService.triggerClosingEmail()` — verifies ResendService is called with correct template data
- Email template rendering — `demo_booking_confirmation` and `demo_follow_up` contain expected fields
- `InterestForm` component — renders all five sections, shows validation errors on empty submit

### Property-Based Tests

Property tests use **fast-check** (already available in the codebase pattern) on the backend and **fast-check** via Jest on the frontend.

Each property test runs a minimum of **100 iterations**.

Tag format: `Feature: cohortle-marketing-funnel, Property {N}: {property_text}`

| Property | Test file | Library |
|---|---|---|
| P1: Valid lead persisted | `cohortle-api/__tests__/cohortle-marketing-funnel/leadPersistence.pbt.js` | fast-check |
| P2: Invalid payloads rejected | `cohortle-api/__tests__/cohortle-marketing-funnel/leadValidation.pbt.js` | fast-check |
| P3: Status transitions | `cohortle-api/__tests__/cohortle-marketing-funnel/statusTransition.pbt.js` | fast-check |
| P4: Email triggered on creation | `cohortle-api/__tests__/cohortle-marketing-funnel/emailTrigger.pbt.js` | fast-check |
| P5: Template data integrity | `cohortle-api/__tests__/cohortle-marketing-funnel/emailTemplateIntegrity.pbt.js` | fast-check |
| P6: Unknown ID returns 404 | `cohortle-api/__tests__/cohortle-marketing-funnel/leadNotFound.pbt.js` | fast-check |
