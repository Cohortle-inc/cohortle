# Organisation Slug Feature - Implementation Complete

## Overview
Item 8: Organisation slug in convener settings is **FULLY IMPLEMENTED** and ready for use.

## Feature Description
Conveners can set up their organisation details including a unique slug that creates a public organisation page at `/org/[slug]`. This allows organisations to have a branded landing page where learners can discover and apply to their programmes.

## Implementation Details

### Frontend Components

#### 1. Convener Settings Page
**Location:** `cohortle-web/src/app/convener/settings/page.tsx`

Features:
- Organisation slug input with real-time validation
- Slug availability checking (checks if slug is already taken)
- Format validation (lowercase alphanumeric + hyphens, 3-50 characters)
- Organisation name input
- Organisation description textarea
- Visual feedback for slug status (checking, available, taken, invalid)
- Save functionality with success/error messages

#### 2. API Client
**Location:** `cohortle-web/src/lib/api/applications.ts`

Functions:
- `checkOrganisationSlug(slug: string)` - Check if a slug is available
- `getOrganisationPage(slug: string)` - Fetch organisation page data

### Backend Implementation

#### 1. Organisation Routes
**Location:** `cohortle-api/routes/org.js`

Endpoints:
- `GET /v1/api/org/:slug/check` - Check slug availability
  - Returns: `{ available: boolean }`
  
- `GET /v1/api/org/:slug` - Get organisation page data
  - Validates slug format (lowercase alphanumeric + hyphens, 3-50 chars)
  - Returns convener info and recruiting programmes
  - Returns 404 if organisation not found
  - Returns 400 if slug format is invalid

#### 2. Profile Service
**Location:** `cohortle-api/services/ProfileService.js`

The `updateProfile` method handles:
- `organisation_slug` - Trimmed and converted to lowercase
- `organisation_name` - Trimmed
- `organisation_description` - Trimmed

Returns organisation fields in the response:
```javascript
{
  organisationSlug: user.organisation_slug || null,
  organisationName: user.organisation_name || null,
  organisationDescription: user.organisation_description || null
}
```

#### 3. Profile Routes
**Location:** `cohortle-api/routes/profile.js`

The `PATCH /v1/api/profile` endpoint accepts:
- `organisation_slug` (string, optional)
- `organisation_name` (string, optional)
- `organisation_description` (string, optional)

### Database Schema

#### Migration
**Location:** `cohortle-api/migrations/20260401000001-add-organisation-fields-to-users.js`

Adds three columns to the `users` table:
1. `organisation_slug` VARCHAR(50) NULL
   - Unique constraint (partial index excluding NULLs)
   - URL-safe identifier for organisation page
   
2. `organisation_name` VARCHAR(255) NULL
   - Display name for the organisation
   
3. `organisation_description` TEXT NULL
   - Brief description shown on organisation page

### Authentication Context

**Location:** `cohortle-web/src/lib/contexts/AuthContext.tsx`

The user object includes:
```typescript
{
  organisationSlug?: string;
}
```

This is populated from the backend response and available throughout the app.

## Validation Rules

### Slug Format
- Must be lowercase
- Can contain: letters (a-z), numbers (0-9), hyphens (-)
- Length: 3-50 characters
- Must be globally unique
- Regex: `/^[a-z0-9-]{3,50}$/`

### Examples
✓ Valid slugs:
- `wecareforng`
- `my-org-2024`
- `tech-academy`

✗ Invalid slugs:
- `My-Org` (uppercase)
- `my_org` (underscore)
- `ab` (too short)
- `my org` (space)

## User Flow

### Setting Up Organisation
1. Convener logs in
2. Navigates to `/convener/settings`
3. Scrolls to "Organisation Settings" section
4. Enters desired slug (e.g., "wecareforng")
5. System checks availability in real-time on blur
6. If available, convener fills in:
   - Organisation name (e.g., "WeCare Foundation Nigeria")
   - Organisation description
7. Clicks "Save Organisation Settings"
8. System validates and saves
9. Success message displayed
10. Organisation page is now live at `/org/wecareforng`

### Viewing Organisation Page
1. Anyone visits `/org/[slug]`
2. System fetches convener details and recruiting programmes
3. Displays organisation information
4. Shows programmes accepting applications
5. Learners can click to apply

## Testing

### Automated Tests
Run the test script:
```powershell
./test-org-slug-functionality.ps1
```

Tests:
1. Slug availability checking
2. Invalid slug format rejection
3. Non-existent organisation 404 response

### Manual Testing
1. Login as convener (e.g., wecarefng@example.com)
2. Go to `/convener/settings`
3. Set organisation slug: `wecareforng`
4. Set organisation name: `WeCare Foundation Nigeria`
5. Set description: `Empowering communities through education`
6. Save settings
7. Visit `/org/wecareforng` to verify public page

## Integration Points

### Programme Application Flow
When a convener has an organisation slug set:
- Their programmes appear on `/org/[slug]`
- Only programmes with:
  - `lifecycle_status: 'recruiting'`
  - `onboarding_mode: 'application'` or `'hybrid'`
- Learners can discover and apply from the organisation page

### Navigation
The organisation slug is available in the auth context, allowing:
- Dynamic links to organisation page
- Conditional UI based on whether slug is set
- Badge/indicator showing organisation is configured

## API Reference

### Check Slug Availability
```http
GET /v1/api/org/:slug/check
```

Response:
```json
{
  "available": true
}
```

### Get Organisation Page
```http
GET /v1/api/org/:slug
```

Response:
```json
{
  "error": false,
  "convener": {
    "name": "John Doe",
    "organisation_name": "WeCare Foundation Nigeria",
    "organisation_description": "Empowering communities",
    "organisation_slug": "wecareforng"
  },
  "programmes": [
    {
      "id": 1,
      "name": "Web Development Bootcamp",
      "description": "Learn full-stack development",
      "application_deadline": "2026-05-01T00:00:00.000Z",
      "application_form_slug": "web-dev-2026",
      "onboarding_mode": "application"
    }
  ]
}
```

### Update Profile with Organisation
```http
PATCH /v1/api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "organisation_slug": "wecareforng",
  "organisation_name": "WeCare Foundation Nigeria",
  "organisation_description": "Empowering communities through education"
}
```

## Status

✅ **COMPLETE** - All components implemented and tested

### Implemented Components
- [x] Frontend settings page with organisation section
- [x] Real-time slug availability checking
- [x] Slug format validation
- [x] Backend API endpoints
- [x] Database migration
- [x] Profile service integration
- [x] Auth context integration
- [x] Organisation page route
- [x] Validation and error handling
- [x] Test script

### Ready for Production
- All code is in place
- Database migration is idempotent
- Validation is comprehensive
- Error handling is robust
- User experience is smooth

## Next Steps (Optional Enhancements)

While the feature is complete, potential future enhancements could include:
1. Custom organisation logo/branding
2. Organisation page analytics
3. Custom domain mapping
4. SEO metadata for organisation pages
5. Social media integration
6. Organisation team members

## Related Files

### Frontend
- `cohortle-web/src/app/convener/settings/page.tsx`
- `cohortle-web/src/lib/api/applications.ts`
- `cohortle-web/src/lib/contexts/AuthContext.tsx`
- `cohortle-web/src/app/org/[slug]/page.tsx`

### Backend
- `cohortle-api/routes/org.js`
- `cohortle-api/routes/profile.js`
- `cohortle-api/services/ProfileService.js`
- `cohortle-api/migrations/20260401000001-add-organisation-fields-to-users.js`

### Testing
- `test-org-slug-functionality.ps1`

## Conclusion

The organisation slug feature is fully implemented and ready for use. Conveners can now set up their organisation details in settings, and learners can discover programmes through the public organisation page at `/org/[slug]`.
