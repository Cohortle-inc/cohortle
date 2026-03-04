# Environment Variables Clarification

## Summary
Having database credentials in cohortle-web is **harmless but unnecessary**. They won't cause any problems, but they're not used.

---

## Why It's Fine

### cohortle-web Does NOT Connect to Database
- cohortle-web is a Next.js frontend application
- It makes HTTP requests to cohortle-api (via `/api/proxy`)
- It **never** connects directly to the database
- All database operations happen in cohortle-api

### Database Credentials Are Ignored
The following variables in cohortle-web are **not used**:
- `DB_HOSTNAME` - Ignored
- `DB_DATABASE` - Ignored  
- `DB_USER` - Ignored
- `DB_PASSWORD` - Ignored
- `DB_PORT` - Ignored
- `JWT_SECRET` - Ignored
- `BUNNY_STREAM_API_KEY` - Ignored
- `BUNNY_STREAM_LIBRARY_ID` - Ignored

### Only NEXT_PUBLIC_API_URL Matters
cohortle-web only uses:
- `NEXT_PUBLIC_API_URL` - To know where to send API requests

---

## Architecture Overview

```
User Browser
    ↓
cohortle-web (Next.js)
    ↓ HTTP requests via /api/proxy
cohortle-api (Express)
    ↓ Database queries
MySQL Database
```

- **cohortle-web**: Frontend only, no database access
- **cohortle-api**: Backend with database access

---

## Should You Remove Them?

### Option 1: Leave Them (Recommended)
- **Pros**: No work needed, no risk of breaking anything
- **Cons**: Slightly cluttered environment variables
- **Verdict**: ✅ This is fine

### Option 2: Remove Them
- **Pros**: Cleaner configuration
- **Cons**: Extra work, need to redeploy
- **Verdict**: ⚠️ Optional, not necessary

---

## What Actually Matters

### For cohortle-api (CRITICAL):
```bash
DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk  ✅ Correct
DB_DATABASE=cohortle.com               ❌ WRONG - Fix this!
NODE_ENV=development                   ❌ WRONG - Change to "production"
JWT_SECRET=<your-secret>               ✅ Should be set
```

### For cohortle-web (CRITICAL):
```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com  ✅ Correct
# Must be available at: Build Time AND Runtime  ❌ Currently runtime only
```

---

## Priority Actions

### High Priority (Fix These Now):
1. **cohortle-api**: Change `DB_DATABASE` from `cohortle.com` to actual database name
2. **cohortle-api**: Change `NODE_ENV` from `development` to `production`
3. **cohortle-web**: Make `NEXT_PUBLIC_API_URL` available at build time AND runtime

### Low Priority (Optional):
4. Remove unused database credentials from cohortle-web (if you want cleaner config)

---

## Bottom Line

**Don't worry about the database credentials in cohortle-web.** They're not being used and won't cause any issues.

**Focus on fixing:**
1. `DB_DATABASE` in cohortle-api (wrong value)
2. `NODE_ENV` in cohortle-api (should be production)
3. `NEXT_PUBLIC_API_URL` availability in cohortle-web (needs build time access)

These three fixes will solve your deployment issues.
