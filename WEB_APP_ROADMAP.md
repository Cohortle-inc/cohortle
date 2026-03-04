# Cohortle Web App Development Roadmap

**Last Updated:** February 21, 2026  
**Current Status:** Authentication & Dashboard Complete, Lesson Viewer Partially Complete

---

## Quick Summary

### ✅ What's Done
1. Authentication system (login, signup, password reset)
2. Student dashboard (programme list, progress display)
3. Programme viewer (module list)
4. Module viewer (lesson list)
5. Lesson viewer components (partially - see details below)
6. Deployment infrastructure (Coolify, environment setup)

### 🚧 What's In Progress
1. **Lesson Viewer** - Some components exist, needs completion and integration
2. **Deployment Fix** - Server Action error (fix pushed, awaiting rebuild)

### 📋 What's Next
1. Complete lesson viewer implementation
2. Test authentication flow end-to-end
3. Add assignment submission UI (optional)
4. Build convener dashboard (future)

---

## Priority 1: Complete Lesson Viewer (2-3 days)

**Spec Location:** `.kiro/specs/student-lesson-viewer-web/`

### Already Implemented ✅
Based on your open files, these components exist:
- `LessonViewer.tsx` - Main viewer component
- `LessonComments.tsx` - Comments section
- `LessonNavigation.tsx` - Next/back navigation
- `CompletionButton.tsx` - Mark complete button
- `TextLessonContent.tsx` - Text lesson display
- `VideoLessonContent.tsx` - Video player
- `PdfLessonContent.tsx` - PDF viewer
- `LinkLessonContent.tsx` - External link display
- `useLessonData.ts` - Data fetching hook
- `useLessonCompletion.ts` - Completion hook
- `useLessonComments.ts` - Comments hook
- `lessonTypeDetection.ts` - Type detection utility
- `videoUrlHelpers.ts` - Video URL parsing
- API functions in `lessons.ts` and `comments.ts`

### Needs Completion 🔧

#### Task 1: Create Lesson Page Route
**File:** `cohortle-web/src/app/lessons/[lessonId]/page.tsx`
**Status:** Exists but may need updates
**What to do:**
- Verify it extracts lessonId from params
- Verify it gets cohortId from searchParams
- Ensure it renders LessonViewer component
- Test the route works: `/lessons/123?cohortId=456`

#### Task 2: Verify React Query Setup
**File:** `cohortle-web/src/app/providers.tsx`
**Status:** Exists with QueryClientProvider
**What to do:**
- Confirm QueryClient is configured
- Check default staleTime and cacheTime settings
- Ensure it's wrapped around the app in layout.tsx

#### Task 3: Test All Components
**What to do:**
- Visit a lesson page: `/lessons/[id]?cohortId=[cohortId]`
- Verify each lesson type renders correctly:
  - Text lessons show formatted content
  - Video lessons embed YouTube/BunnyStream
  - PDF lessons show PDF viewer
  - Link lessons show external link button
- Test completion button works
- Test navigation to next lesson
- Test comments posting

#### Task 4: Add Missing Pieces (if any)
Check if these exist and work:
- Error boundaries for graceful error handling
- Loading states for all async operations
- Responsive design (mobile, tablet, desktop)
- Accessibility (keyboard navigation, ARIA labels)

#### Task 5: Environment Variables
**File:** `.env.local` or Coolify settings
**What to do:**
- Ensure `NEXT_PUBLIC_API_URL=https://api.cohortle.com` is set
- Document any other required variables

---

## Priority 2: Test Authentication Flow (1 day)

Once deployment is fixed, thoroughly test:

### Test Checklist
- [ ] Visit https://cohortle.com
- [ ] Click "Sign Up"
- [ ] Create new account
- [ ] Verify redirect to login
- [ ] Log in with new credentials
- [ ] Verify redirect to dashboard
- [ ] Check dashboard shows programmes
- [ ] Click on a programme
- [ ] Verify modules list appears
- [ ] Click on a module
- [ ] Verify lessons list appears
- [ ] Click on a lesson
- [ ] Verify lesson viewer loads
- [ ] Test marking lesson complete
- [ ] Test posting a comment
- [ ] Test navigation to next lesson
- [ ] Log out
- [ ] Verify redirect to login
- [ ] Try accessing protected route without auth
- [ ] Verify redirect to login with returnUrl

### Common Issues to Watch For
1. **CORS errors** - Check API allows requests from cohortle.com
2. **Token not persisting** - Check cookie/localStorage storage
3. **401 errors** - Check token is included in API requests
4. **Redirect loops** - Check middleware logic
5. **Missing data** - Check API endpoints return expected format

---

## Priority 3: Assignment Submission UI (Optional, 1-2 days)

**Note:** Backend API already supports assignments. This is just the UI.

### What to Build
1. **Assignment List Page** (`/assignments`)
   - Show all assignments for enrolled programmes
   - Filter by status (pending, submitted, graded)
   - Show due dates and grades

2. **Assignment Detail Page** (`/assignments/[id]`)
   - Show assignment description
   - File upload interface
   - Submit button
   - View submission status
   - View grade and feedback (if graded)

3. **Components Needed**
   - `AssignmentCard.tsx` - Display assignment summary
   - `AssignmentList.tsx` - List of assignments
   - `SubmitAssignmentForm.tsx` - File upload and submit
   - `AssignmentDetail.tsx` - Full assignment view

4. **API Functions Needed**
   - `fetchAssignments()` - GET /api/assignments
   - `fetchAssignment(id)` - GET /api/assignments/:id
   - `submitAssignment(id, file)` - POST /api/assignments/:id/submit
   - `fetchSubmission(id)` - GET /api/submissions/:id

---

## Priority 4: Convener Dashboard (Future, 4-8 weeks)

**Note:** This is a large undertaking. Conveners can use the mobile app in the meantime.

### Phase 1: Programme Management (1-2 weeks)
- Create programme form
- Edit programme details
- View enrolled students
- Manage programme settings

### Phase 2: Module & Lesson Creation (2-3 weeks)
- Module creation form
- Lesson creation forms (all 6 types)
- Rich text editor for text lessons
- Video upload/link interface
- PDF upload interface
- Quiz builder
- Live session scheduler

### Phase 3: Student Management (1 week)
- View student list
- Enroll/unenroll students
- View student progress
- Send messages/announcements

### Phase 4: Analytics (1-2 weeks)
- Programme completion rates
- Lesson engagement metrics
- Student progress tracking
- Export reports

---

## Development Workflow

### For Each Feature
1. **Check the spec** - Read requirements, design, and tasks
2. **Identify what exists** - Check if components/files already exist
3. **Implement missing pieces** - Follow the task list
4. **Test locally** - Use `npm run dev` to test
5. **Run tests** - Use `npm test` to run unit/property tests
6. **Commit and push** - Git commit with clear message
7. **Deploy** - Coolify auto-deploys on push
8. **Test production** - Verify on https://cohortle.com

### Commands
```bash
# Development
cd cohortle-web
npm run dev          # Start dev server on localhost:3000

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Check test coverage

# Linting
npm run lint         # Check for ESLint errors

# Building
npm run build        # Build for production
npm start            # Start production server

# Deployment
git add .
git commit -m "feat: description of changes"
git push origin main # Coolify auto-deploys
```

---

## Current Blockers

### 1. Server Action Error (CRITICAL) ⚠️
- **Status:** Fix pushed, awaiting rebuild
- **Action:** Wait for Coolify to rebuild, then test
- **ETA:** 5-10 minutes after rebuild starts

### 2. Lesson Viewer Not Fully Tested
- **Status:** Components exist but not verified working
- **Action:** Test each component after deployment fix
- **ETA:** 1-2 hours of testing

---

## Success Metrics

### Learner Experience is "Good" When:
- ✅ Can create account and log in
- ✅ Can see enrolled programmes
- ✅ Can browse modules and lessons
- ⏳ Can view all lesson types correctly
- ⏳ Can mark lessons complete
- ⏳ Can post comments
- ⏳ Can navigate between lessons
- ⏳ Progress tracking is accurate

### Platform is "Production Ready" When:
- All above metrics are met
- No critical bugs in authentication
- Lesson viewer works for all 6 lesson types
- Mobile responsive design works
- Error handling is graceful
- Loading states are clear
- Accessibility standards met

---

## Next Steps (Immediate)

1. **Wait for deployment** - Coolify should rebuild with the fix
2. **Test authentication** - Try signup and login flows
3. **Test lesson viewer** - Visit a lesson page and verify it works
4. **Report issues** - If anything doesn't work, we'll debug together
5. **Complete missing tasks** - Work through the lesson viewer task list

---

## Resources

### Documentation
- **Spec Files:** `.kiro/specs/student-lesson-viewer-web/`
- **API Docs:** Check `cohortle-api/` for endpoint details
- **Design System:** Tailwind CSS classes in existing components

### Key Files to Reference
- **Auth:** `src/lib/contexts/AuthContext.tsx`
- **API Client:** `src/lib/api/client.ts`
- **Routing:** `src/app/` directory structure
- **Components:** `src/components/` directory

### Testing
- **Unit Tests:** `__tests__/` directories
- **Property Tests:** Files ending in `.pbt.tsx` or `.pbt.ts`
- **Integration Tests:** `INTEGRATION_TESTING_GUIDE.md`

---

## Questions to Consider

1. **Do you want to complete the lesson viewer first?** (Recommended)
   - This makes the platform usable for learners
   - Estimated: 2-3 days

2. **Or focus on assignment submission UI?** (Optional)
   - Adds more functionality for learners
   - Estimated: 1-2 days

3. **Or start on convener dashboard?** (Large undertaking)
   - Enables conveners to use web instead of mobile
   - Estimated: 4-8 weeks

**My recommendation:** Complete lesson viewer first, then test thoroughly. Once that's solid, decide between assignments or convener features based on user needs.
