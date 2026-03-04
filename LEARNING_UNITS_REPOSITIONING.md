# 🔑 Repositioning: Modules → Learning Units

## Current Flow (Confirmed)

```
Community
  └── Programme
       └── Cohort (instance of programme)
            └── Module (programme_modules)
                 └── Lesson (module_lessons)
                      └── Lesson Types (Video, Assignment, Live, Form, PDF, Text, Link)
                           └── Submissions (for assignments)
```

## New Terminology

**"Module" → "Learning Unit"**

Simple. Clear. Progress-trackable.

---

## 🎯 What Learning Units Are

**Not**:
- ❌ Smart
- ❌ Conditional
- ❌ Fancy
- ❌ Adaptive
- ❌ AI-powered

**Just**:
- ✅ Ordered (1, 2, 3...)
- ✅ Grouped (related lessons together)
- ✅ Progress-trackable (% complete)

---

## 📊 New Flow

```
Community
  └── Programme
       └── Cohort
            └── Learning Unit (was: Module)
                 └── Lesson
                      └── Lesson Type
                           └── Submission
```

**Example**:
```
WLIMP Community
  └── Women Leadership Programme 2026
       └── Cohort A (Jan 2026)
            └── Learning Unit 1: Introduction to Leadership
                 ├── Lesson 1.1: What is Leadership? (Video)
                 ├── Lesson 1.2: Leadership Styles (PDF)
                 └── Lesson 1.3: Self-Assessment (Assignment)
            └── Learning Unit 2: Communication Skills
                 ├── Lesson 2.1: Active Listening (Video)
                 ├── Lesson 2.2: Feedback Techniques (Live Session)
                 └── Lesson 2.3: Practice Exercise (Assignment)
```

---

## 🔄 Changes Required

### 1. Database (Backend)

**Table Rename**:
- `programme_modules` → `learning_units` (or keep table name, change display)

**No Schema Changes Needed** - Just terminology!

**Recommended Approach**: Keep database as-is, change only:
- API responses (add `display_name: "Learning Unit"`)
- Frontend labels
- Documentation

### 2. API (Backend)

**Endpoints** (Optional - can keep as-is):
- `/api/programmes/:id/modules` → `/api/programmes/:id/units`
- `/api/modules/:id` → `/api/units/:id`

**Or Keep Endpoints, Change Response**:
```json
{
  "id": 1,
  "name": "Introduction to Leadership",
  "type": "learning_unit",  // ← Add this
  "display_name": "Learning Unit 1",  // ← Add this
  "order": 1,
  "lessons": [...]
}
```

### 3. Frontend (Mobile App)

**UI Labels**:
- "Module" → "Learning Unit"
- "Modules" → "Learning Units"
- "Add Module" → "Add Learning Unit"
- "Edit Module" → "Edit Learning Unit"

**Files to Update**:
- Screen titles
- Navigation labels
- Button text
- Form labels
- Error messages

### 4. Progress Tracking

**Current**: Track lesson completion
**Enhanced**: Show unit-level progress

```
Learning Unit 1: Introduction to Leadership
Progress: 2/3 lessons complete (67%)
├── ✅ Lesson 1.1: What is Leadership?
├── ✅ Lesson 1.2: Leadership Styles
└── ⏳ Lesson 1.3: Self-Assessment
```

---

## 📱 User Experience

### Learner View

**Before**:
```
Programme: Women Leadership 2026
  Module 1: Introduction
    - Lesson 1.1
    - Lesson 1.2
```

**After**:
```
Programme: Women Leadership 2026
  Learning Unit 1: Introduction
    - Lesson 1.1 ✅
    - Lesson 1.2 ⏳
    Progress: 50%
```

### Convener View

**Before**:
```
[+ Add Module]
Module 1: Introduction
  - 3 lessons
  - Edit | Delete
```

**After**:
```
[+ Add Learning Unit]
Learning Unit 1: Introduction
  - 3 lessons
  - 2/3 complete (67%)
  - Edit | Delete
```

---

## 🎨 Design Principles

### 1. Ordered
- Learning Units have explicit order (1, 2, 3...)
- Displayed in sequence
- No skipping ahead (optional enforcement)

### 2. Grouped
- Related lessons grouped together
- Clear boundaries between units
- Logical progression

### 3. Progress-Trackable
- Show completion percentage
- Visual progress indicators
- Clear "what's next" guidance

---

## 🚀 Implementation Plan

### Phase 1: Backend (Week 1)
1. Add `display_name` field to API responses
2. Add `order` field (if not exists)
3. Add progress calculation endpoint
4. Update API documentation

### Phase 2: Frontend Labels (Week 1)
1. Search and replace "Module" → "Learning Unit"
2. Update screen titles
3. Update navigation labels
4. Update button text

### Phase 3: Progress Tracking (Week 2)
1. Add unit-level progress calculation
2. Add progress bars to UI
3. Add completion indicators
4. Test with real data

### Phase 4: Polish (Week 2)
1. Update onboarding to explain "Learning Units"
2. Add tooltips/help text
3. Update documentation
4. User testing

---

## 📝 Terminology Guide

| Old Term | New Term | Context |
|----------|----------|---------|
| Module | Learning Unit | Everywhere |
| Module List | Learning Units | Navigation |
| Add Module | Add Learning Unit | Button |
| Edit Module | Edit Learning Unit | Button |
| Module Progress | Unit Progress | Dashboard |
| programme_modules | learning_units | Database (optional) |

---

## 🔍 Search & Replace Guide

### Frontend Files to Update

**Search for**:
- `"Module"`
- `"module"`
- `"Modules"`
- `"modules"`

**Replace with**:
- `"Learning Unit"`
- `"learning unit"`
- `"Learning Units"`
- `"learning units"`

**Exclude**:
- `node_modules/`
- `module.exports` (code)
- `import ... from` (code)
- Database table names (keep as-is)

### Backend Files to Update

**API Response Labels**:
- Add `display_name: "Learning Unit"`
- Keep internal `type: "module"` for compatibility

**Documentation**:
- Update API docs
- Update README
- Update comments

---

## ✅ Success Criteria

### User Understanding
- [ ] Learners understand what a "Learning Unit" is
- [ ] Conveners can create/manage Learning Units
- [ ] Clear progression through units

### Progress Tracking
- [ ] Unit-level progress visible
- [ ] Lesson-level progress visible
- [ ] Overall programme progress visible

### Simplicity
- [ ] No complex logic
- [ ] No conditional paths
- [ ] Just ordered, grouped, trackable

---

## 🎯 Key Benefits

### For Learners
- Clear structure
- Visible progress
- Sense of achievement
- Know what's next

### For Conveners
- Easy to organize content
- Track learner progress
- Identify struggling learners
- Simple to manage

### For Platform
- Simpler codebase
- Easier to explain
- Better UX
- Scalable structure

---

## 📊 Progress Tracking Logic

### Lesson Progress
```javascript
lesson.completed = true/false
```

### Unit Progress
```javascript
unit.progress = completedLessons / totalLessons * 100
unit.completed = unit.progress === 100
```

### Programme Progress
```javascript
programme.progress = completedUnits / totalUnits * 100
programme.completed = programme.progress === 100
```

### Cohort Analytics
```javascript
cohort.averageProgress = sum(learnerProgress) / totalLearners
cohort.completionRate = completedLearners / totalLearners * 100
```

---

## 🔧 Technical Implementation

### Database (Keep As-Is)
```sql
-- No changes needed!
-- Just change how we display it

SELECT 
  id,
  name,
  'Learning Unit' as display_type,
  CONCAT('Learning Unit ', order_index) as display_name,
  order_index,
  programme_id
FROM programme_modules
ORDER BY order_index;
```

### API Response
```json
{
  "id": 1,
  "name": "Introduction to Leadership",
  "display_type": "learning_unit",
  "display_name": "Learning Unit 1",
  "order": 1,
  "programme_id": 5,
  "lessons": [
    {
      "id": 1,
      "title": "What is Leadership?",
      "type": "video",
      "completed": true
    },
    {
      "id": 2,
      "title": "Leadership Styles",
      "type": "pdf",
      "completed": false
    }
  ],
  "progress": {
    "completed_lessons": 1,
    "total_lessons": 2,
    "percentage": 50
  }
}
```

### Frontend Component
```typescript
// Before
<Text>Module {module.order}: {module.name}</Text>

// After
<Text>Learning Unit {unit.order}: {unit.name}</Text>
<ProgressBar progress={unit.progress} />
<Text>{unit.progress.completed_lessons}/{unit.progress.total_lessons} complete</Text>
```

---

## 🎓 User Education

### Onboarding Message
```
"Learning Units group related lessons together.
Complete lessons in order to track your progress!"
```

### Help Text
```
What are Learning Units?
- Organized groups of lessons
- Complete in sequence
- Track your progress
- Unlock achievements
```

### Tooltips
```
Learning Unit: A collection of related lessons on a specific topic
Progress: Shows how many lessons you've completed
```

---

## 📈 Metrics to Track

### Engagement
- Time spent per unit
- Completion rate per unit
- Drop-off points

### Progress
- Average unit completion time
- Learner progress distribution
- Cohort completion rates

### Content
- Most/least completed units
- Highest/lowest rated units
- Units needing improvement

---

## 🚦 Migration Strategy

### Option 1: Big Bang (Recommended)
- Update everything at once
- Clear cutover
- Single release
- Minimal confusion

### Option 2: Gradual
- Backend first (add display_name)
- Frontend second (update labels)
- Risk: Mixed terminology

**Recommendation**: Option 1 - Do it all at once in one release.

---

## ✨ Future Enhancements (Not Now!)

These are **NOT** part of the initial repositioning:
- ❌ Prerequisites (Unit 2 locked until Unit 1 complete)
- ❌ Adaptive learning paths
- ❌ Personalized recommendations
- ❌ AI-generated content
- ❌ Gamification (badges, points)

**Keep it simple**: Ordered, Grouped, Progress-trackable.

---

## 📋 Checklist

### Backend
- [ ] Add `display_name` to API responses
- [ ] Add progress calculation
- [ ] Update API documentation
- [ ] Test endpoints

### Frontend
- [ ] Update all "Module" labels
- [ ] Add progress indicators
- [ ] Update navigation
- [ ] Update forms

### Testing
- [ ] Test unit creation
- [ ] Test lesson ordering
- [ ] Test progress tracking
- [ ] Test with real users

### Documentation
- [ ] Update README
- [ ] Update user guide
- [ ] Update API docs
- [ ] Update onboarding

---

**Summary**: Simple rename + progress tracking. No complex logic. Just ordered, grouped, trackable learning units.
