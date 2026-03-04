# Enrollment Code Validation Fix

## Issue
User could not join with enrollment code `PROG-2026-B88GL0` - frontend validation was rejecting it as invalid.

## Root Cause
Frontend validation regex was too strict and only allowed `PROGRAMME-YEAR` format:
```typescript
const ENROLLMENT_CODE_REGEX = /^[A-Z]+-\d{4}$/;
```

This rejected codes with suffixes like `PROG-2026-B88GL0`, even though the backend supports this format.

## Backend vs Frontend Mismatch
- **Backend** (EnrollmentService.js): Accepts `WORD-YEAR` or `WORD-YEAR-SUFFIX`
  ```javascript
  const codePattern = /^[A-Z0-9]+-\d{4}(-[A-Z0-9]+)?$/i;
  ```

- **Frontend** (validation.ts): Only accepted `WORD-YEAR`
  ```typescript
  const ENROLLMENT_CODE_REGEX = /^[A-Z]+-\d{4}$/;
  ```

## Fix Applied
Updated frontend validation to match backend:

### 1. Updated Regex Pattern
```typescript
const ENROLLMENT_CODE_REGEX = /^[A-Z0-9]+-\d{4}(-[A-Z0-9]+)?$/i;
```

Now accepts:
- `WLIMP-2026` (basic format)
- `PROG-2026-B88GL0` (with suffix)
- `TEST-2025-ABC123` (with suffix)

### 2. Updated Error Message
Changed from:
```
Invalid code format. Use format: PROGRAMME-YEAR (e.g., WLIMP-2026)
```

To:
```
Invalid code format. Use format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX (e.g., WLIMP-2026 or PROG-2026-ABC)
```

### 3. Updated Join Page Placeholder
Changed placeholder and helper text to reflect both formats:
- Placeholder: `e.g., WLIMP-2026 or PROG-2026-ABC`
- Helper text: `Format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX`

## Changes Committed
- **Commit**: `d4a3f53` - "fix: update enrollment code validation to support suffix format (PROGRAMME-YEAR-SUFFIX)"
- **Files Changed**: 
  - `cohortle-web/src/lib/utils/validation.ts`
  - `cohortle-web/src/app/join/page.tsx`

## Testing
After deployment, the code `PROG-2026-B88GL0` should now:
1. Pass frontend validation
2. Be sent to the backend
3. Either enroll successfully (if cohort exists) or return 404 (if cohort doesn't exist)

## Valid Code Formats
- `WLIMP-2026` ✓
- `PROG-2026-B88GL0` ✓
- `TEST-2025-ABC` ✓
- `COURSE-2024-XYZ123` ✓

## Invalid Code Formats
- `wlimp2026` ✗ (missing hyphen)
- `WLIMP` ✗ (missing year)
- `2026-WLIMP` ✗ (wrong order)
- `WLIMP-26` ✗ (year must be 4 digits)

---

**Status**: Fixed and deployed. Wait for Coolify to deploy commit `d4a3f53`.
