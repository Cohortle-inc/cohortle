# Convener Pages Status

## Existing Pages ✅

All main convener pages have been created:

### Dashboard & Programme Management
- ✅ `/convener/dashboard` - Main dashboard showing all programmes
- ✅ `/convener/programmes/new` - Create new programme
- ✅ `/convener/programmes/[id]` - Programme detail view
- ✅ `/convener/programmes/[id]/edit` - Edit programme

### Cohort Management
- ✅ `/convener/programmes/[id]/cohorts/new` - Create new cohort
- ✅ `/convener/programmes/[id]/cohorts/[cohortId]` - Cohort detail view (placeholder)

### Week Management
- ✅ `/convener/programmes/[id]/weeks/new` - Create new week
- ✅ `/convener/programmes/[id]/weeks/[weekId]` - Week detail view

### Lesson Management
- ✅ `/convener/programmes/[id]/weeks/[weekId]/lessons/new` - Create new lesson

## Pages That Don't Exist (But May Not Be Needed)

Based on the requirements, these pages are NOT explicitly required:

### Edit Pages (Can be done inline or in modals)
- ❌ `/convener/programmes/[id]/cohorts/[cohortId]/edit` - Edit cohort
- ❌ `/convener/programmes/[id]/weeks/[weekId]/edit` - Edit week  
- ❌ `/convener/programmes/[id]/weeks/[weekId]/lessons/[lessonId]/edit` - Edit lesson

### Learner Management
- ❌ `/convener/programmes/[id]/cohorts/[cohortId]/learners` - View enrolled learners
- ❌ `/convener/programmes/[id]/cohorts/[cohortId]/learners/[learnerId]` - View learner details

### Analytics/Reports (Not in MVP requirements)
- ❌ `/convener/programmes/[id]/analytics` - Programme analytics
- ❌ `/convener/programmes/[id]/cohorts/[cohortId]/analytics` - Cohort analytics

## Recommendation

All required pages exist. The missing pages are either:
1. **Edit pages** - Can be implemented as modals or inline editing
2. **Learner management** - Not in the original requirements
3. **Analytics** - Not in MVP scope

If you want to add any of these, please specify which ones are priority.

## Alternative: What Might Be "Missing"

If you're seeing 404 errors, it might be because:
1. Some pages have placeholder content (like cohort detail)
2. Some functionality is marked as "TODO" or "coming soon"
3. Backend API endpoints might not be fully implemented

Would you like me to:
1. Add edit pages for cohorts, weeks, and lessons?
2. Add learner management pages?
3. Complete the placeholder content in existing pages?
4. Something else?
