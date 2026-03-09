# Deploy Convener Role Redirect Fix

## Quick Summary
Fixed the profile endpoint to return the correct role from the role system, enabling proper redirect for convener accounts.

## Changes
- Modified `cohortle-api/services/ProfileService.js` to join with roles table

## Deployment Steps

### 1. Test Locally (Optional)
```bash
cd cohortle-api
npm test
```

### 2. Commit Changes
```bash
git add cohortle-api/services/ProfileService.js
git commit -m "Fix: Profile endpoint now returns role from role system

- Updated ProfileService.getUserProfile() to join with roles table
- Updated ProfileService.updateProfileImage() to use role system
- Updated ProfileService.updateProfile() to use role system
- Fixes convener redirect issue where profile returned wrong role
- User wecarefng@gmail.com will now correctly redirect to /convener/dashboard"
```

### 3. Push to Production
```bash
git push origin main
```

### 4. Verify Deployment
Wait for Coolify to deploy, then run:
```powershell
.\test-convener-profile.ps1
```

Or manually test:
1. Go to https://cohortle.com/login
2. Login with `wecarefng@gmail.com`
3. Should redirect to `/convener/dashboard` (not `/dashboard`)
4. Open browser DevTools → Network tab
5. Check the `/v1/api/profile` response - should show `role: "convener"`

### 5. Verify in Database (Optional)
```sql
-- Check user's role assignment
SELECT u.id, u.email, u.role_id, r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
WHERE u.email = 'wecarefng@gmail.com';

-- Should show:
-- id: 24
-- email: wecarefng@gmail.com
-- role_id: 2 (or whatever convener role_id is)
-- role_name: convener
```

## Rollback Plan
If issues occur, revert the commit:
```bash
git revert HEAD
git push origin main
```

## Expected Behavior After Fix

### Before Fix
1. Login → JWT has `role: 'convener'` ✓
2. Profile API → Returns `role: null` or old value ✗
3. Dashboard → Redirects to `/dashboard` (wrong) ✗

### After Fix
1. Login → JWT has `role: 'convener'` ✓
2. Profile API → Returns `role: 'convener'` ✓
3. Dashboard → Redirects to `/convener/dashboard` (correct) ✓

## Notes
- No database migration needed (role system already in place)
- No frontend changes needed (already checks user.role)
- Only backend ProfileService needed updating
- Fix is backward compatible with existing code
