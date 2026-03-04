# Design Document: Learning Units Repositioning

## Overview

This design document outlines the implementation approach for repositioning "Module" terminology to "Learning Unit" throughout the Cohortle application. The design follows a "Big Bang" migration approach where all changes are deployed simultaneously to maintain consistency.

## Design Principles

1. **Simplicity**: Keep it simple - just ordered, grouped, progress-trackable. No smart/conditional/fancy logic.
2. **Backward Compatibility**: Maintain existing database schema and API contracts
3. **Display-Only Changes**: Change only user-facing terminology, not internal implementation
4. **Progress Transparency**: Make learning progress visible and trackable at the unit level

## System Architecture

### Current Architecture
```
Frontend (cohortz/) ←→ Backend API (cohortle-api/) ←→ Database (cohortle)
```

### Data Flow
```
User Action → Frontend Request → API Endpoint → Database Query → API Response → Frontend Display
```

## Database Design

### No Schema Changes Required

The existing database schema remains unchanged:
- Table: `programme_modules` (stores Learning Units)
- Table: `module_lessons` (stores lessons within Learning Units)
- Table: `lesson_progress` (tracks lesson completion)

**Rationale**: Changing table names would require complex migrations and risk breaking existing integrations. Display terminology can be handled at the API response layer.

## API Design

### Enhanced Response Format

Add display fields to existing API responses without removing any fields:

```javascript
// Before (existing)
{
  "id": 1,
  "programme_id": 5,
  "title": "Introduction to Programming",
  "order": 1
}

// After (enhanced)
{
  "id": 1,
  "programme_id": 5,
  "title": "Introduction to Programming",
  "order": 1,
  "display_type": "learning_unit",
  "display_name": "Learning Unit 1",
  "progress": {
    "completed_lessons": 3,
    "total_lessons": 10,
    "percentage": 30
  }
}
```

### API Endpoints (No Changes)

Existing endpoints remain unchanged:
- `GET /api/programmes/:id/modules` - List Learning Units
- `GET /api/modules/:id` - Get Learning Unit details
- `POST /api/modules` - Create Learning Unit
- `PUT /api/modules/:id` - Update Learning Unit
- `DELETE /api/modules/:id` - Delete Learning Unit

## Frontend Design

### Component Updates

#### 1. Screen Titles
Update all screen components that display "Module":
- `app/student-screens/cohorts/module.tsx` → "Learning Unit"
- `app/convener-screens/(cohorts)/community/(course)/[id].tsx` → "Learning Unit"

#### 2. Navigation Labels
Update navigation configuration:
- Tab labels
- Breadcrumb navigation
- Side menu items

#### 3. Button Text
Update button labels:
- "Add Module" → "Add Learning Unit"
- "Edit Module" → "Edit Learning Unit"
- "Delete Module" → "Delete Learning Unit"

#### 4. Form Labels
Update form field labels:
- "Module Name" → "Learning Unit Name"
- "Module Description" → "Learning Unit Description"

### Progress Display Components

#### Progress Bar Component
```typescript
interface ProgressBarProps {
  completed: number;
  total: number;
  showPercentage?: boolean;
}

// Display: [=====>    ] 30% (3/10 lessons)
```

#### Completion Indicator Component
```typescript
interface CompletionIndicatorProps {
  isComplete: boolean;
  lessonTitle: string;
}

// Display: ✓ Lesson 1: Introduction (complete)
//          ○ Lesson 2: Variables (pending)
```

## Backend Design

### Progress Calculation Service

```javascript
// services/progressService.js
class ProgressService {
  async calculateUnitProgress(moduleId, userId) {
    // 1. Get all lessons in the unit
    const lessons = await ModuleLessons.findAll({ 
      where: { module_id: moduleId } 
    });
    
    // 2. Get completed lessons for user
    const completedLessons = await LessonProgress.count({
      where: { 
        lesson_id: { [Op.in]: lessons.map(l => l.id) },
        user_id: userId,
        completed: true
      }
    });
    
    // 3. Calculate percentage
    const total = lessons.length;
    const percentage = total > 0 ? (completedLessons / total * 100) : 0;
    
    return {
      completed_lessons: completedLessons,
      total_lessons: total,
      percentage: Math.round(percentage)
    };
  }
}
```

### API Response Enhancement

```javascript
// routes/modules.js
router.get('/api/programmes/:id/modules', async (req, res) => {
  const modules = await ProgrammeModules.findAll({
    where: { programme_id: req.params.id },
    order: [['order', 'ASC']]
  });
  
  // Enhance each module with display fields and progress
  const enhancedModules = await Promise.all(
    modules.map(async (module) => {
      const progress = await progressService.calculateUnitProgress(
        module.id, 
        req.user.id
      );
      
      return {
        ...module.toJSON(),
        display_type: 'learning_unit',
        display_name: `Learning Unit ${module.order}`,
        progress
      };
    })
  );
  
  res.json(enhancedModules);
});
```

## Implementation Strategy

### Phase 1: Backend Enhancement (Week 1)
1. Create progress calculation service
2. Update API responses to include display fields
3. Add progress calculation to all module endpoints
4. Test API responses

### Phase 2: Frontend Update (Week 1-2)
1. Update screen titles and navigation
2. Update button labels and form fields
3. Add progress bar components
4. Add completion indicator components
5. Update error messages

### Phase 3: Testing (Week 2)
1. Test all screens with new terminology
2. Verify progress calculations are accurate
3. Test backward compatibility with existing data
4. Perform end-to-end testing

### Phase 4: Deployment (Week 2)
1. Deploy backend changes
2. Deploy frontend changes
3. Monitor for issues
4. Gather user feedback

## Testing Strategy

### Unit Tests
- Progress calculation logic
- API response formatting
- Component rendering with new terminology

### Integration Tests
- API endpoints return correct display fields
- Progress updates when lessons are completed
- Frontend displays progress correctly

### Manual Testing
- Verify all screens show "Learning Unit"
- Verify progress bars display correctly
- Verify completion indicators work
- Test on both learner and convener accounts

## Rollback Plan

If issues arise:
1. Frontend rollback: Revert terminology changes (display only, low risk)
2. Backend rollback: Remove display fields from API responses (backward compatible)
3. Database: No changes made, no rollback needed

## Performance Considerations

### Progress Calculation Caching
- Cache progress calculations for 5 minutes
- Invalidate cache when lesson completion changes
- Use Redis for distributed caching if needed

### Database Query Optimization
- Add index on `lesson_progress(user_id, lesson_id)` if not exists
- Use batch queries for multiple units
- Implement pagination for large lists

## Security Considerations

- No new security concerns introduced
- Existing authentication and authorization remain unchanged
- Progress data is user-specific and properly scoped

## Accessibility

- Progress bars include ARIA labels
- Completion indicators use semantic HTML
- Screen readers announce progress updates
- Color is not the only indicator of completion

## Correctness Properties

### Property 1: Terminology Consistency
**Statement**: All user-facing text that previously said "Module" now says "Learning Unit"

**Validation**: Search codebase for "Module" in display strings and verify all are updated

### Property 2: Progress Accuracy
**Statement**: Progress percentage equals (completed_lessons / total_lessons * 100)

**Validation**: For any Learning Unit, verify progress calculation matches formula

### Property 3: Backward Compatibility
**Statement**: Existing API clients continue to receive all original fields

**Validation**: API responses include all original fields plus new display fields

### Property 4: Progress Bounds
**Statement**: Progress percentage is always between 0 and 100 inclusive

**Validation**: For any Learning Unit, verify 0 ≤ progress.percentage ≤ 100

### Property 5: Completion Consistency
**Statement**: When all lessons are complete, progress percentage equals 100

**Validation**: For any Learning Unit where completed_lessons == total_lessons, verify percentage == 100

## Open Questions

None - design is complete and ready for implementation.

## Appendix

### Files to Update (Frontend)

**Screen Files:**
- `cohortz/app/student-screens/cohorts/module.tsx`
- `cohortz/app/convener-screens/(cohorts)/community/(course)/[id].tsx`
- Any other screens that display "Module"

**Component Files:**
- Navigation components
- Form components
- Button components

**Type Definitions:**
- Add progress types to module interfaces

### Files to Update (Backend)

**Service Files:**
- Create `cohortle-api/services/progressService.js`

**Route Files:**
- `cohortle-api/routes/modules.js` (or equivalent)
- Any routes that return module data

**Model Files:**
- Update comments in `cohortle-api/models/programme_modules.js`
- Update comments in `cohortle-api/models/module_lessons.js`
