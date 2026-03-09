# Profile Bio and LinkedIn Feature Implementation

## Overview
Added bio section and LinkedIn profile field to learner profiles with automatic URL generation.

## Changes Made

### Database
- **Migration**: `20260309000000-add-bio-linkedin-to-users.js`
  - Added `bio` (TEXT) field for user biography
  - Added `linkedin_username` (VARCHAR 255) field for LinkedIn username only

### Backend (API)

#### Models
- **users.js**: Added `bio` and `linkedin_username` fields to the model

#### Services
- **ProfileService.js**:
  - Updated `getUserProfile()` to return bio and linkedinUsername
  - Updated `updateProfile()` to handle bio and linkedinUsername fields
  - Profile picture now properly saved to `profile_image` field

#### Routes
- **profile.js**: Updated PUT `/v1/api/profile` to accept `bio` and `linkedinUsername` parameters

### Frontend (Web)

#### Types
- **profile.ts**:
  - Added `bio` and `linkedinUsername` to `UserProfile` interface
  - Added `bio` and `linkedinUsername` to `ProfileUpdate` interface

#### Components

**ProfileEditForm.tsx**:
- Added bio textarea with 500 character limit and counter
- Added LinkedIn username field with:
  - LinkedIn icon in the label
  - Prefix text showing "linkedin.com/in/"
  - Placeholder for username only
  - Helper text explaining to enter username only

**ProfileHeader.tsx**:
- Added LinkedIn profile link with icon (opens in new tab)
- Added "About" section displaying bio below profile info
- Bio supports multi-line text with proper formatting

**LearnerProfile.tsx**:
- Updated to pass bio and linkedinUsername to child components
- Updated profile update handler to include new fields

## Features

### Bio Section
- Multi-line text area for user biography
- 500 character limit with live counter
- Displayed in "About" section on profile
- Optional field

### LinkedIn Profile
- User enters only their username (e.g., "john-doe")
- System automatically generates full URL: `https://linkedin.com/in/john-doe`
- Displayed with LinkedIn icon
- Opens in new tab with proper security attributes
- Optional field

## Usage

### For Users
1. Click "Edit Profile" on profile page
2. Enter bio in the text area (optional)
3. Enter LinkedIn username in the field (optional)
   - Example: If your LinkedIn is `linkedin.com/in/jane-smith`, enter only `jane-smith`
4. Click "Save Changes"

### LinkedIn URL Generation
- Input: `jane-smith`
- Generated URL: `https://linkedin.com/in/jane-smith`
- Displayed as clickable link with icon

## Migration Instructions

Run the migration on your database:

```bash
# Local development
cd cohortle-api
npm run migrate

# Production
node run-production-migration.js
```

## Testing

1. Edit your profile and add a bio
2. Add your LinkedIn username (without the full URL)
3. Save and verify:
   - Bio appears in "About" section
   - LinkedIn link appears with icon
   - Clicking LinkedIn link opens correct profile in new tab

## Security & Accessibility
- LinkedIn links open in new tab with `rel="noopener noreferrer"`
- Proper ARIA labels for screen readers
- Bio text is sanitized on display
- Character limit prevents excessive data storage
- All fields are optional

## API Changes

### GET /v1/api/profile
Response now includes:
```json
{
  "user": {
    "bio": "string or null",
    "linkedinUsername": "string or null"
  }
}
```

### PUT /v1/api/profile
Accepts additional fields:
```json
{
  "bio": "string (optional)",
  "linkedinUsername": "string (optional)"
}
```
