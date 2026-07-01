# Community Post Access Control - Deployment Guide

## Overview

This document outlines the deployment steps for the Community Post Access Control feature, which fixes the critical security vulnerability where posts are visible to all users regardless of community or cohort membership.

## What's Been Implemented

### ✅ Backend Implementation (Complete)

1. **Database Migration** (`migrations/20260220000000-add-post-visibility-scope.js`)
   - Adds `visibility_scope` ENUM column ('community', 'cohort')
   - Adds `cohort_id` foreign key column
   - Creates performance indexes
   - Migrates existing posts to 'community' scope

2. **Access Control Service** (`services/AccessControlService.js`)
   - `getUserCommunities(userId)` - Fetches user's community memberships
   - `getUserCohorts(userId)` - Fetches user's cohort memberships
   - `canAccessPost(userId, post)` - Verifies post access
   - `buildPostFilterClause(userId)` - Generates SQL filter for post queries

3. **Updated API Endpoints** (`routes/post.js`)
   - **POST /v1/api/posts** - Now requires `visibility_scope`, `community_id`, and validates cohort belongs to community
   - **GET /v1/api/posts** - Filters posts based on user memberships (100 post limit)
   - **GET /v1/posts/:post_id** - Checks access before returning (404 if unauthorized)
   - **GET /v1/post/:post_id/comments** - Verifies post access before showing comments
   - **POST /v1/post/:post_id/comments** - Verifies post access before allowing comments

### ⚠️ Frontend Implementation (Required)

The frontend needs to be updated to support the new visibility scope selection:

1. **Post Creation Form Updates**
   - Add visibility scope selector (radio buttons: "Entire Community" / "Specific Cohort")
   - Add cohort dropdown (appears when "Specific Cohort" selected)
   - Update API call to include `visibility_scope`, `community_id`, `cohort_id`
   - Disable submit until valid scope selected

2. **API Integration**
   - Update post creation API calls to include new fields
   - Handle validation errors for cohort-community mismatch

## Deployment Steps

### Step 1: Run Database Migration

**CRITICAL: Run this on staging first, then production**

```bash
# On staging/production server
cd cohortle-api
npx sequelize-cli db:migrate --env production
```

**Verify migration:**
```sql
-- Check new columns exist
DESCRIBE posts;

-- Verify existing posts migrated correctly
SELECT id, visibility_scope, cohort_id FROM posts LIMIT 10;
-- All should have visibility_scope='community' and cohort_id=NULL
```

### Step 2: Deploy Backend Code

```bash
# Deploy updated files
git add cohortle-api/services/AccessControlService.js
git add cohortle-api/routes/post.js
git add cohortle-api/migrations/20260220000000-add-post-visibility-scope.js
git commit -m "feat: implement community post access control"
git push origin main
```

### Step 3: Update Frontend (Required Before Full Deployment)

**Location:** `cohortz/app/convener-screens/(cohorts)/community/`

Update the post creation screen to include:

```typescript
// Add to post creation form state
const [visibilityScope, setVisibilityScope] = useState<'community' | 'cohort'>('community');
const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);

// Add to API call
const createPost = async () => {
  const response = await fetch(`${API_URL}/v1/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      text: postText,
      visibility_scope: visibilityScope,
      community_id: currentCommunityId,
      cohort_id: visibilityScope === 'cohort' ? selectedCohortId : null,
      can_reply: 'everyone'
    })
  });
};
```

### Step 4: Testing Checklist

**Before deploying to production:**

- [ ] Migration runs successfully on staging
- [ ] Existing posts still visible to community members
- [ ] New community-scoped posts visible to all community members
- [ ] New cohort-scoped posts only visible to cohort members
- [ ] Non-members cannot see posts (get empty feed)
- [ ] Accessing post by ID returns 404 for non-members
- [ ] Comments only accessible if user has post access
- [ ] Validation errors for invalid cohort-community combinations

**Test Scenarios:**

1. **Community-Scoped Post**
   - Create post with visibility_scope='community'
   - Verify all community members see it
   - Verify non-members don't see it

2. **Cohort-Scoped Post**
   - Create post with visibility_scope='cohort' and valid cohort_id
   - Verify only cohort members see it
   - Verify other community members don't see it

3. **Invalid Cohort**
   - Try creating post with cohort from different community
   - Should get 400 error: "Cohort does not belong to the specified community"

4. **Access Control**
   - Try accessing post by ID as non-member
   - Should get 404 (not 403)

## Backward Compatibility

The implementation maintains backward compatibility:

- Existing posts automatically get `visibility_scope='community'`
- `community_ids` field still populated for backward compatibility
- Posts without `visibility_scope` treated as community-scoped
- No breaking changes to existing API consumers

## Rollback Plan

If issues arise:

```bash
# Rollback migration
cd cohortle-api
npx sequelize-cli db:migrate:undo --env production

# Rollback code
git revert <commit-hash>
git push origin main
```

## Performance Considerations

- Database indexes created for `visibility_scope`, `cohort_id`, and composite queries
- Post queries limited to 100 results
- User membership data cached per request
- Single optimized query for post filtering

## Security Notes

- Unauthorized access returns 404 (not 403) to avoid leaking post existence
- All access control violations logged for auditing
- Cohort-community validation prevents cross-community access
- SQL injection protection through parameterized queries

## Monitoring

After deployment, monitor:

- Post creation success rate
- API response times for GET /v1/api/posts
- Access control violation logs
- User reports of missing/unexpected posts

## Support

If issues arise:

1. Check application logs for access control errors
2. Verify migration completed successfully
3. Check user membership data in `community_members` and `cohort_members` tables
4. Review access control service logs

## Next Steps (Optional Enhancements)

- Property-based tests for comprehensive coverage
- Frontend visibility indicator on posts
- Bulk post visibility updates
- Analytics on post visibility usage
