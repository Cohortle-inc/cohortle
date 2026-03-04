# Quick Reference: Convener Features

## All Available Features

### Programme Management
- ✅ Create Programme
- ✅ Edit Programme (name, description, start date)
- ✅ Delete Programme
- ✅ Publish Programme
- ✅ View Programme Details

### Cohort Management
- ✅ Create Cohort (with enrollment code)
- ✅ Edit Cohort (name, code, start date)
- ✅ Delete Cohort
- ✅ View Cohort Details
- ✅ Check Enrollment Code Availability
- ✅ View Enrolled Learners
- ✅ View Learner Progress

### Week Management
- ✅ Create Week
- ✅ Edit Week (title, start date)
- ✅ Delete Week
- ✅ View Week Details

### Lesson Management
- ✅ Create Lesson (video, PDF, link, text)
- ✅ Edit Lesson (title, description, URL)
- ✅ Delete Lesson
- ✅ Reorder Lessons (drag & drop)

### Learner Management
- ✅ View All Learners in Cohort
- ✅ See Learner Progress (percentage, lessons completed)
- ✅ View Individual Learner Details
- ✅ See Lesson-by-Lesson Completion
- ✅ Track Enrollment and Activity Dates

## Page Routes

### Dashboard
- `/convener/dashboard` - List all my programmes

### Programme Routes
- `/convener/programmes/new` - Create programme
- `/convener/programmes/[id]` - View programme
- `/convener/programmes/[id]/edit` - Edit programme

### Cohort Routes
- `/convener/programmes/[id]/cohorts/new` - Create cohort
- `/convener/programmes/[id]/cohorts/[cohortId]` - View cohort
- `/convener/programmes/[id]/cohorts/[cohortId]/learners` - List learners
- `/convener/programmes/[id]/cohorts/[cohortId]/learners/[learnerId]` - Learner details

### Week Routes
- `/convener/programmes/[id]/weeks/new` - Create week
- `/convener/programmes/[id]/weeks/[weekId]` - View week

### Lesson Routes
- `/convener/programmes/[id]/weeks/[weekId]/lessons/new` - Create lesson

## API Endpoints

### Programme
- `POST /v1/api/programmes` - Create
- `GET /v1/api/programmes/:id` - Read
- `PUT /v1/api/programmes/:id` - Update
- `DELETE /v1/api/programmes/:id` - Delete
- `GET /v1/api/programmes/my` - List my programmes
- `POST /v1/api/programmes/:id/publish` - Publish

### Cohort
- `POST /v1/api/programmes/:id/cohorts` - Create
- `GET /v1/api/cohorts/:id` - Read
- `PUT /v1/api/cohorts/:id` - Update
- `DELETE /v1/api/cohorts/:id` - Delete
- `GET /v1/api/cohorts/:id/learners` - List learners
- `GET /v1/api/cohorts/:id/learners/:learner_id` - Get learner detail
- `GET /v1/api/enrollment-codes/check?code=XXX` - Check code availability

### Week
- `POST /v1/api/programmes/:id/weeks` - Create
- `GET /v1/api/programmes/:id/weeks` - List
- `PUT /v1/api/weeks/:id` - Update
- `DELETE /v1/api/weeks/:id` - Delete

### Lesson
- `POST /v1/api/weeks/:id/lessons` - Create
- `GET /v1/api/lessons/:id` - Read
- `PUT /v1/api/lessons/:id` - Update
- `DELETE /v1/api/lessons/:id` - Delete
- `PUT /v1/api/weeks/:id/lessons/reorder` - Reorder

## Common Workflows

### Creating a Programme
1. Go to `/convener/dashboard`
2. Click "Create Programme"
3. Fill in name, description, start date
4. Click "Create Programme"
5. Add cohorts, weeks, and lessons
6. Click "Publish" when ready

### Managing Learners
1. Go to cohort detail page
2. Click "View Learners"
3. See all enrolled learners with progress
4. Click "View Details" on any learner
5. See lesson-by-lesson completion

### Editing Content
1. Navigate to resource detail page
2. Click "Edit" button
3. Make changes in modal
4. Click "Save Changes"

### Deleting Content
1. Navigate to resource detail page
2. Click "Delete" button
3. Confirm in modal
4. Resource is deleted

## Keyboard Shortcuts
- None currently implemented

## Tips
- Enrollment codes must be unique across all cohorts
- Deleting a programme deletes all cohorts, weeks, and lessons
- Deleting a week deletes all lessons in that week
- Learner progress is calculated automatically
- Published programmes are visible to learners

---

**Last Updated**: February 25, 2026
**Version**: 1.0 (MVP Complete)
