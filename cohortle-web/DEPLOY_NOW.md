# Deploy Cohortle Web - Quick Start

## ✅ Ready to Deploy!

The Student Lesson Viewer Web application is ready for deployment with:
- ✅ All features implemented
- ✅ Comprehensive test coverage (28 properties + 35+ unit tests)
- ✅ Docker configuration ready
- ✅ Standalone Next.js build configured
- ✅ Error boundaries and loading states
- ✅ Responsive design
- ✅ Integration testing guide

## Quick Deployment Steps

### 1. Pre-Flight Check (5 minutes)

```bash
cd cohortle-web

# Install dependencies
npm install

# Run build locally
npm run build

# Test the build
npm start
# Visit http://localhost:3000 - should work!
```

### 2. Test Docker Build (5 minutes)

```bash
# Build Docker image
docker build -t cohortle-web:test .

# Run container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3001 cohortle-web:test

# Test in browser - http://localhost:3000
```

### 3. Deploy to Coolify (10 minutes)

#### Option A: Auto-Deploy (Recommended)
1. Push code to GitHub main branch
2. Coolify will auto-deploy (if webhook configured)
3. Monitor deployment in Coolify dashboard

#### Option B: Manual Deploy
1. Log into Coolify: [Your Coolify URL]
2. Navigate to `cohortle-web` application
3. Click "Redeploy" button
4. Watch logs for completion

### 4. Configure Environment Variables

In Coolify, set these environment variables:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0

# CRITICAL: Update this to your production API URL
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

### 5. Verify Deployment (5 minutes)

Visit your domain and check:
- [ ] Homepage loads: `https://cohortle.com`
- [ ] Marketing pages work: `/about`, `/contact`, etc.
- [ ] Login page loads: `/login`
- [ ] Lesson viewer works: `/lessons/[id]?cohortId=[id]` (with valid IDs)

## What's Included

### Features Deployed
✅ **Marketing Pages**
- Homepage with hero, features, testimonials
- About, Contact, Learner, Partner pages
- Our Approach, What We Support pages

✅ **Student Lesson Viewer**
- Text lessons with rich HTML formatting
- Video lessons (YouTube + BunnyStream)
- PDF document viewer
- External link lessons
- Lesson completion tracking
- Comments and discussions
- Navigation between lessons
- Authentication middleware
- Error boundaries and loading states
- Responsive design (desktop + tablet)

### Technical Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Deployment**: Docker + Coolify
- **Build**: Standalone output (optimized)

## Expected Build Output

When deployment succeeds, you should see:

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95 kB
├ ○ /about                               2.1 kB         92 kB
├ ○ /contact                             1.8 kB         91 kB
├ ○ /learner                             2.3 kB         92 kB
├ ○ /lessons/[lessonId]                  8.5 kB        105 kB
├ ○ /login                               3.2 kB         93 kB
├ ○ /our-approach                        2.4 kB         92 kB
├ ○ /partner                             2.2 kB         92 kB
└ ○ /what-we-support                     2.1 kB         92 kB

○  (Static)  prerendered as static content
```

## Post-Deployment Testing

### Critical Paths to Test

1. **Homepage Flow**
   ```
   Visit https://cohortle.com
   → Should see hero section
   → Navigation should work
   → All links should be clickable
   ```

2. **Lesson Viewing Flow**
   ```
   Visit https://cohortle.com/lessons/1?cohortId=1
   → Should redirect to login (if not authenticated)
   → After login, should show lesson
   → Should be able to mark complete
   → Should be able to post comments
   ```

3. **Error Handling**
   ```
   Visit https://cohortle.com/lessons/999?cohortId=1
   → Should show "Lesson not found" error
   → Should have retry/back button
   ```

## Monitoring

After deployment, monitor:

1. **Coolify Logs**
   - Check for any runtime errors
   - Monitor memory/CPU usage
   - Watch for failed requests

2. **Browser Console**
   - Visit site and open DevTools
   - Check for JavaScript errors
   - Verify API calls succeed

3. **Performance**
   - Run Lighthouse audit
   - Check page load times
   - Monitor Core Web Vitals

## Rollback Plan

If something goes wrong:

### Quick Rollback
1. Go to Coolify dashboard
2. Click "Deployments" tab
3. Find last working deployment
4. Click "Redeploy"

### Git Rollback
```bash
# Find last working commit
git log --oneline

# Revert to that commit
git revert <commit-hash>

# Push to trigger redeploy
git push origin main
```

## Common Issues & Quick Fixes

### Issue: "Cannot find module" error
**Fix**: Clear build cache in Coolify and redeploy

### Issue: API calls failing
**Fix**: Check NEXT_PUBLIC_API_URL environment variable

### Issue: 404 on all pages
**Fix**: Verify domain configuration in Coolify

### Issue: Slow performance
**Fix**: Check server resources, consider upgrading

## Support Resources

- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Coolify Guide**: See `COOLIFY_DEPLOYMENT.md`
- **Integration Testing**: See `INTEGRATION_TESTING_GUIDE.md`
- **Testing Summary**: See `TESTING_SUMMARY.md`

## Success Indicators

✅ Deployment is successful when:
- Homepage loads in < 3 seconds
- All marketing pages accessible
- Lesson viewer works with backend API
- No errors in browser console
- SSL certificate is valid
- Lighthouse score > 90

## Ready to Deploy?

If all pre-flight checks pass, you're ready to deploy!

```bash
# Final check
npm run build && npm start

# If that works, deploy to Coolify!
```

---

**Questions?** Check the full deployment checklist in `DEPLOYMENT_CHECKLIST.md`

**Need help?** Review troubleshooting section or contact DevOps team

**Good luck! 🚀**
