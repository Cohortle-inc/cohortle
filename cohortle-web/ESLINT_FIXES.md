# ESLint Fixes for Deployment

## Issue
Deployment failed due to ESLint errors during the build process.

## Errors Fixed

### 1. LessonNavigation.tsx (Line 10)
**Error**: `'ModuleLesson' is defined but never used`

**Fix**: Removed unused import
```typescript
// Before
import { ModuleLesson } from '@/types/lesson';

// After
// Import removed - not needed
```

### 2. VideoLessonContent.tsx (Line 50)
**Error**: `'e' is defined but never used`

**Fix**: Changed catch block to not capture the error variable
```typescript
// Before
} catch (e) {
  // Ignore parsing errors
}

// After
} catch {
  // Ignore parsing errors
}
```

## Status
✅ Both ESLint errors fixed
✅ Ready to redeploy

## Next Steps
Push these changes to trigger a new deployment:

```bash
cd cohortle-web
git add src/components/lessons/LessonNavigation.tsx
git add src/components/lessons/VideoLessonContent.tsx
git add src/app/layout.tsx
git commit -m "Fix: ESLint errors and add metadataBase"
git push origin main
```

This will trigger Coolify to rebuild and deploy successfully.
