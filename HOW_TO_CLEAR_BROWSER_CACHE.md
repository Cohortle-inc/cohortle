# How to Clear Browser Cache for Cohortle

## Why Clear Cache?

Your browser may have saved the old broken version of Cohortle. Clearing the cache forces it to download the new fixed version.

## Method 1: Clear Site Data (Recommended)

### Chrome / Edge / Brave
1. Go to https://cohortle.com
2. Press `F12` (or right-click → Inspect)
3. Click the `Application` tab at the top
4. In the left sidebar, find `Storage`
5. Click `Clear site data` button
6. Close the browser completely
7. Reopen and try logging in

### Firefox
1. Go to https://cohortle.com
2. Press `F12` (or right-click → Inspect)
3. Click the `Storage` tab at the top
4. Right-click on `https://cohortle.com` in the left sidebar
5. Click `Delete All`
6. Close the browser completely
7. Reopen and try logging in

### Safari
1. Go to Safari → Preferences → Privacy
2. Click `Manage Website Data`
3. Search for "cohortle"
4. Click `Remove`
5. Close the browser completely
6. Reopen and try logging in

## Method 2: Incognito/Private Mode (Fastest)

### Chrome / Edge / Brave
- Press `Ctrl + Shift + N` (Windows)
- Press `Cmd + Shift + N` (Mac)
- Go to https://cohortle.com/login
- Try logging in

### Firefox
- Press `Ctrl + Shift + P` (Windows)
- Press `Cmd + Shift + P` (Mac)
- Go to https://cohortle.com/login
- Try logging in

### Safari
- Press `Cmd + Shift + N` (Mac)
- Go to https://cohortle.com/login
- Try logging in

## Method 3: Hard Refresh

This forces the browser to reload everything:

### Windows
- Press `Ctrl + Shift + R`
- Or `Ctrl + F5`

### Mac
- Press `Cmd + Shift + R`

## Method 4: Clear All Browser Data

### Chrome / Edge / Brave
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select `All time` from the time range dropdown
3. Check these boxes:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click `Clear data`
5. Close browser completely
6. Reopen and try logging in

### Firefox
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select `Everything` from the time range dropdown
3. Check these boxes:
   - ✅ Cookies
   - ✅ Cache
4. Click `Clear Now`
5. Close browser completely
6. Reopen and try logging in

### Safari
1. Go to Safari → Clear History
2. Select `all history`
3. Click `Clear History`
4. Close browser completely
5. Reopen and try logging in

## After Clearing Cache

1. Go to https://cohortle.com/login
2. Try logging in with your credentials
3. If it still doesn't work, try incognito mode
4. If incognito works, the cache wasn't fully cleared - try Method 4

## Still Not Working?

If none of these methods work, we need more information:

1. Open DevTools (F12)
2. Go to Console tab
3. Try to login
4. Copy any red error messages
5. Share them so we can help

## Quick Test

To verify the cache is cleared:

1. Go to https://cohortle.com
2. Press F12
3. Go to Network tab
4. Refresh the page (F5)
5. Look for requests - they should all say "200" status
6. If you see "304" status, cache is still being used

## Expected Behavior After Cache Clear

When you login:
- ✅ No "Cannot read properties of undefined" errors
- ✅ No "user not authenticated" errors
- ✅ Successfully redirects to dashboard
- ✅ Can see your name/email in the dashboard

## Convener Signup

If signing up as a convener, you need the invitation code:
```
COHORTLE_CONVENER_2024
```

Enter this code in the "Invitation Code" field when you select "Create and manage courses" option.
