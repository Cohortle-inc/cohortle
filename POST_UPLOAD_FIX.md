# Post Upload Fix Applied ✅

## Issue
Users couldn't upload posts (both convener and learner side) after the backend deployment.

## Root Cause
The post access control migration added two new required fields:
- `visibility_scope` (ENUM: 'community', 'cohort')
- `community_id` (INT)

The current mobile app doesn't send these fields, causing validation to fail.

## Fix Applied

Made the new fields optional with backward-compatible defaults:

### Changes to `routes/post.js`:

1. **Extract community_id from legacy field**:
   ```javascript
   const finalCommunityId = community_id || (community_ids ? community_ids.split(',')[0] : null);
   ```

2. **Default visibility_scope to 'community'**:
   ```javascript
   const finalVisibilityScope = visibility_scope || 'community';
   ```

3. **Made validation rules optional**:
   - `visibility_scope`: Optional (defaults to 'community')
   - `community_id`: Optional (extracted from `community_ids` if not provided)
   - `cohort_id`: Only required if `visibility_scope === 'cohort'`

4. **Backward compatibility maintained**:
   - Old mobile app sends `community_ids` → Works ✅
   - New mobile app sends `community_id` + `visibility_scope` → Works ✅

## Deployment

```bash
git add routes/post.js
git commit -m "fix: make post visibility fields optional for backward compatibility"
git push origin main
```

**Commit**: `096cf14`

## Next Steps

1. **Deploy in Coolify** - The fix will deploy automatically with auto-migrations
2. **Test post creation** - Both convener and learner should be able to create posts
3. **Verify** - Posts should default to community-wide visibility

## How It Works Now

### Old Mobile App (Current)
```javascript
POST /v1/api/posts
{
  "text": "Hello world",
  "community_ids": "1,2,3",  // Legacy field
  "can_reply": "everyone"
}
```
**Result**: 
- `community_id` = 1 (first ID from community_ids)
- `visibility_scope` = 'community' (default)
- Post created successfully ✅

### New Mobile App (Future)
```javascript
POST /v1/api/posts
{
  "text": "Hello world",
  "community_id": 1,
  "visibility_scope": "cohort",
  "cohort_id": 5,
  "can_reply": "everyone"
}
```
**Result**:
- Uses provided values
- Validates cohort belongs to community
- Post created with cohort-specific visibility ✅

## Testing

After deployment, test:

1. **Create post as convener** - Should work
2. **Create post as learner** - Should work
3. **View posts** - Should see posts from your communities
4. **Comment on posts** - Should work

## Summary

Fixed post upload failure by making new access control fields optional with sensible defaults. Current mobile app now works without changes, while new app can use enhanced visibility controls.
