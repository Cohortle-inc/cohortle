# Deployment Checklist - Cohortle Web

## Pre-Deployment Checklist

### ✅ Code Readiness
- [x] All features implemented
- [x] All tests passing (unit + property-based)
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code reviewed and approved
- [x] Documentation updated

### ✅ Configuration
- [x] `next.config.mjs` has `output: "standalone"`
- [x] Dockerfile exists and is tested
- [x] `.env.example` documents all required variables
- [x] Environment variables configured for production

### ✅ Dependencies
- [x] `package-lock.json` is committed
- [x] All dependencies are production-ready
- [x] No security vulnerabilities (`npm audit`)

### ✅ Build Verification
- [ ] Local build succeeds: `npm run build`
- [ ] Local Docker build succeeds
- [ ] Local Docker container runs successfully
- [ ] All pages accessible in production build

## Environment Variables for Production

### Required Variables
```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0
```

### Application-Specific Variables
```bash
# Backend API URL (CRITICAL - Update for production)
NEXT_PUBLIC_API_URL=https://api.cohortle.com

# Analytics (Optional)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-production-website-id
```

## Deployment Steps

### Step 1: Pre-Deployment Testing

#### 1.1 Test Local Build
```bash
cd cohortle-web
npm run build
npm start
```
Visit `http://localhost:3000` and verify:
- [ ] Homepage loads
- [ ] All marketing pages load
- [ ] Lesson viewer pages load (with test data)
- [ ] No console errors

#### 1.2 Test Docker Build Locally
```bash
# Build Docker image
docker build -t cohortle-web:test .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001 \
  cohortle-web:test

# Test in browser
curl http://localhost:3000
```

Verify:
- [ ] Container starts successfully
- [ ] Homepage loads
- [ ] No errors in container logs

### Step 2: Deploy to Coolify

#### 2.1 Create/Update Application in Coolify
1. Log into Coolify dashboard
2. Navigate to your project
3. Create new application or select existing `cohortle-web`

#### 2.2 Configure Repository
- **Repository URL**: `https://github.com/cohortle-inc/cohortle-web`
- **Branch**: `main` (or your production branch)
- **Base Directory**: (leave empty - root)

#### 2.3 Configure Build
- **Build Method**: Dockerfile
- **Dockerfile Path**: `Dockerfile`
- **Build Command**: (leave empty - Dockerfile handles it)
- **Port**: `3000`

#### 2.4 Set Environment Variables
In Coolify Environment tab, add:
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOST=0.0.0.0
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

#### 2.5 Configure Domain
- **Domain**: `cohortle.com` (or your domain)
- **SSL**: Enable (Let's Encrypt)
- **Force HTTPS**: Enable

#### 2.6 Deploy
1. Click "Deploy" button
2. Watch build logs for errors
3. Wait for deployment to complete

### Step 3: Verify Deployment

#### 3.1 Check Build Logs
Look for successful build indicators:
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization
```

#### 3.2 Check Runtime Logs
Should see:
```
▲ Next.js 14.2.13
- Local:        http://0.0.0.0:3000
✓ Ready in XXXms
```

#### 3.3 Test Website
- [ ] Visit `https://cohortle.com`
- [ ] Homepage loads correctly
- [ ] SSL certificate is valid (green padlock)
- [ ] No mixed content warnings

#### 3.4 Test All Routes
- [ ] `/` - Homepage
- [ ] `/about` - About page
- [ ] `/contact` - Contact page
- [ ] `/learner` - Learner page
- [ ] `/partner` - Partner page
- [ ] `/our-approach` - Our Approach page
- [ ] `/what-we-support` - What We Support page
- [ ] `/login` - Login page
- [ ] `/lessons/[id]?cohortId=[id]` - Lesson viewer (with valid IDs)

#### 3.5 Test Lesson Viewer Functionality
With valid lesson and cohort IDs:
- [ ] Text lessons display correctly
- [ ] Video lessons embed properly (YouTube/BunnyStream)
- [ ] PDF lessons display in viewer
- [ ] Link lessons show external link button
- [ ] Completion button works
- [ ] Comments load and post successfully
- [ ] Navigation works (next lesson, back)

#### 3.6 Test Error Handling
- [ ] Invalid lesson ID shows error message
- [ ] Missing cohortId shows validation error
- [ ] Unauthenticated access redirects to login
- [ ] 404 page displays for non-existent routes

#### 3.7 Test Performance
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90 (Performance)
- [ ] No console errors
- [ ] Images load properly
- [ ] Fonts load correctly

#### 3.8 Test Responsive Design
- [ ] Desktop view (≥1024px) looks correct
- [ ] Tablet view (768px-1023px) looks correct
- [ ] Mobile view (< 768px) looks correct
- [ ] Touch interactions work on mobile

#### 3.9 Test Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Step 4: Post-Deployment Tasks

#### 4.1 Monitor Application
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation
- [ ] Configure alerts for downtime

#### 4.2 Performance Monitoring
- [ ] Set up analytics (if not already done)
- [ ] Monitor Core Web Vitals
- [ ] Track API response times
- [ ] Monitor error rates

#### 4.3 Security
- [ ] Verify HTTPS is enforced
- [ ] Check security headers
- [ ] Run security scan (e.g., Mozilla Observatory)
- [ ] Verify no sensitive data in client-side code

#### 4.4 Documentation
- [ ] Update deployment documentation
- [ ] Document any issues encountered
- [ ] Update runbook for operations team
- [ ] Create rollback procedure

## Rollback Procedure

If deployment fails or issues are discovered:

### Option 1: Rollback in Coolify
1. Go to Coolify dashboard
2. Navigate to `cohortle-web` application
3. Click "Deployments" tab
4. Find last successful deployment
5. Click "Redeploy" on that deployment

### Option 2: Revert Git Commit
1. Identify last working commit
2. Revert changes: `git revert <commit-hash>`
3. Push to main branch
4. Coolify will auto-deploy (if webhook configured)

### Option 3: Manual Rollback
1. SSH into server (if you have access)
2. Stop current container
3. Start previous container version
4. Verify application is working

## Troubleshooting

### Issue: Build Fails

**Symptoms**: Deployment fails during build phase

**Check**:
1. Review build logs in Coolify
2. Look for npm errors or TypeScript errors
3. Verify all dependencies are in package.json
4. Check if Node version is correct (20.x)

**Solutions**:
- Fix any code errors
- Update dependencies if needed
- Clear build cache in Coolify
- Test build locally first

### Issue: Container Won't Start

**Symptoms**: Build succeeds but container doesn't run

**Check**:
1. Review runtime logs in Coolify
2. Check if port 3000 is exposed
3. Verify environment variables are set
4. Check if standalone build was created

**Solutions**:
- Verify Dockerfile CMD is correct
- Check if .next/standalone exists
- Ensure PORT and HOST env vars are set
- Test Docker container locally

### Issue: 404 on All Pages

**Symptoms**: Deployment succeeds but all pages return 404

**Check**:
1. Verify domain is pointing to correct deployment
2. Check if Next.js server is running
3. Review nginx/proxy configuration (if applicable)
4. Check if static files were copied correctly

**Solutions**:
- Verify domain DNS settings
- Check Coolify domain configuration
- Ensure .next/static was copied in Dockerfile
- Test with direct IP:port access

### Issue: API Calls Failing

**Symptoms**: Frontend loads but API calls fail

**Check**:
1. Verify NEXT_PUBLIC_API_URL is set correctly
2. Check if backend API is running
3. Review CORS configuration on backend
4. Check network tab in browser DevTools

**Solutions**:
- Update NEXT_PUBLIC_API_URL environment variable
- Verify backend is accessible from frontend
- Configure CORS on backend to allow frontend domain
- Check for mixed content issues (HTTP vs HTTPS)

### Issue: Slow Performance

**Symptoms**: Pages load slowly

**Check**:
1. Run Lighthouse audit
2. Check server resources (CPU, memory)
3. Review network waterfall in DevTools
4. Check if images are optimized

**Solutions**:
- Optimize images (use Next.js Image component)
- Enable caching headers
- Consider CDN for static assets
- Upgrade server resources if needed

## Monitoring & Maintenance

### Daily Checks
- [ ] Check uptime monitoring dashboard
- [ ] Review error logs for critical issues
- [ ] Monitor API response times

### Weekly Checks
- [ ] Review performance metrics
- [ ] Check for security updates
- [ ] Review user feedback/issues
- [ ] Update dependencies if needed

### Monthly Checks
- [ ] Run full security audit
- [ ] Review and optimize performance
- [ ] Update documentation
- [ ] Plan for upcoming features

## Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Backend Team**: [Contact Info]
- **Frontend Team**: [Contact Info]
- **Coolify Support**: [Support Channel]

## Success Criteria

Deployment is considered successful when:
- ✅ All pages load without errors
- ✅ Lesson viewer functionality works end-to-end
- ✅ API integration works correctly
- ✅ Performance metrics meet targets (< 3s load time)
- ✅ No critical errors in logs
- ✅ SSL certificate is valid
- ✅ All tests pass in production environment

## Next Steps After Successful Deployment

1. Announce deployment to team
2. Monitor closely for first 24 hours
3. Gather user feedback
4. Address any issues promptly
5. Plan for next iteration/features

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Version/Commit**: _____________
**Status**: ⬜ Success ⬜ Failed ⬜ Rolled Back
**Notes**: _____________
