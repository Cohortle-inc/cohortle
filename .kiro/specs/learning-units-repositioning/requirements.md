# Requirements Document

## Introduction

This feature repositions the terminology from "Module" to "Learning Unit" throughout the Cohortle application (frontend and backend). The goal is to make the learning structure clearer and more intuitive for users while maintaining backward compatibility with existing data and APIs. Additionally, this feature enhances progress tracking by adding unit-level progress calculation and display.

The current learning hierarchy is:
```
Community → Programme → Cohort → Module → Lesson → Lesson Type → Submission
```

The new terminology will be:
```
Community → Programme → Cohort → Learning Unit → Lesson → Lesson Type → Submission
```

This is a terminology change only - no structural changes to the data model or business logic are required.

## Glossary

- **Learning_Unit**: A collection of related lessons on a specific topic, previously called "Module". Learning Units are ordered sequentially and group lessons together for progress tracking.
- **Frontend**: The mobile application (cohortz/) built with React Native and Expo
- **Backend**: The API server (cohortle-api/) that provides data to the frontend
- **Display_Name**: User-facing terminology shown in the UI, distinct from internal database field names
- **Progress_Percentage**: The ratio of completed lessons to total lessons within a Learning Unit, expressed as a percentage
- **Backward_Compatibility**: The ability for the system to continue functioning with existing data and API contracts without breaking changes

## Requirements

### Requirement 1: Frontend Terminology Update

**User Story:** As a learner or convener, I want to see "Learning Unit" instead of "Module" throughout the application, so that the learning structure is clearer and more intuitive.

#### Acceptance Criteria

1. WHEN a user views any screen title, THE Frontend SHALL display "Learning Unit" instead of "Module"
2. WHEN a user views navigation labels, THE Frontend SHALL display "Learning Units" instead of "Modules"
3. WHEN a user views button text, THE Frontend SHALL display "Add Learning Unit" instead of "Add Module"
4. WHEN a user views form labels, THE Frontend SHALL display "Learning Unit" instead of "Module"
5. WHEN a user views error messages, THE Frontend SHALL display "Learning Unit" instead of "Module"
6. WHEN a user views breadcrumb navigation, THE Frontend SHALL display "Learning Unit" instead of "Module"

### Requirement 2: Code Keyword Preservation

**User Story:** As a developer, I want code keywords and package names to remain unchanged, so that the application continues to function correctly.

#### Acceptance Criteria

1. THE Frontend SHALL NOT modify "node_modules" directory references
2. THE Frontend SHALL NOT modify "module.exports" statements in code
3. THE Frontend SHALL NOT modify "import" statements that reference modules
4. THE Frontend SHALL NOT modify JavaScript/TypeScript module system keywords

### Requirement 3: Backend API Response Enhancement

**User Story:** As a frontend developer, I want the API to provide display terminology, so that I can show user-friendly labels without hardcoding them.

#### Acceptance Criteria

1. WHEN the API returns a Learning Unit object, THE Backend SHALL include a "display_type" field with value "learning_unit"
2. WHEN the API returns a Learning Unit object, THE Backend SHALL include a "display_name" field formatted as "Learning Unit {order}"
3. WHEN the API returns a list of Learning Units, THE Backend SHALL maintain the existing field names for backward compatibility
4. THE Backend SHALL NOT modify database table names (programme_modules, module_lessons)
5. THE Backend SHALL NOT modify internal variable names in existing business logic

### Requirement 4: API Endpoint Compatibility

**User Story:** As a system integrator, I want existing API endpoints to continue working, so that no breaking changes are introduced.

#### Acceptance Criteria

1. THE Backend SHALL maintain existing API endpoint URLs (/api/programmes/:id/modules, /api/modules/:id)
2. WHEN an API endpoint is called, THE Backend SHALL return responses with the same field structure as before
3. THE Backend SHALL add new display fields without removing existing fields

### Requirement 5: Unit-Level Progress Tracking

**User Story:** As a learner, I want to see my progress within each Learning Unit, so that I know how much I have completed and what remains.

#### Acceptance Criteria

1. WHEN the API returns a Learning Unit object, THE Backend SHALL include a "progress" object with "completed_lessons", "total_lessons", and "percentage" fields
2. WHEN a lesson is marked complete, THE Backend SHALL recalculate the Learning Unit progress percentage
3. THE Backend SHALL calculate progress percentage as (completed_lessons / total_lessons * 100)
4. WHEN total_lessons is zero, THE Backend SHALL return a progress percentage of zero

### Requirement 6: Progress Display in UI

**User Story:** As a learner, I want to see visual progress indicators for each Learning Unit, so that I can quickly understand my completion status.

#### Acceptance Criteria

1. WHEN a user views a Learning Unit, THE Frontend SHALL display a progress bar showing the completion percentage
2. WHEN a user views a Learning Unit, THE Frontend SHALL display text showing "X/Y lessons complete"
3. WHEN a user views a Learning Unit, THE Frontend SHALL display a completion percentage
4. WHEN a Learning Unit has zero lessons, THE Frontend SHALL display "0/0 lessons complete (0%)"
5. WHEN a Learning Unit is 100% complete, THE Frontend SHALL display a visual completion indicator

### Requirement 7: Lesson Completion Indicators

**User Story:** As a learner, I want to see which lessons I have completed within a Learning Unit, so that I know what I have already done.

#### Acceptance Criteria

1. WHEN a user views lessons within a Learning Unit, THE Frontend SHALL display a checkmark icon for completed lessons
2. WHEN a user views lessons within a Learning Unit, THE Frontend SHALL display a pending icon for incomplete lessons
3. WHEN a lesson is marked complete, THE Frontend SHALL immediately update the lesson's completion indicator
4. WHEN a lesson is marked complete, THE Frontend SHALL immediately update the Learning Unit's progress display

### Requirement 8: Documentation and Comments Update

**User Story:** As a developer, I want code comments and documentation to use the new terminology, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. THE Frontend SHALL update code comments to reference "Learning Unit" instead of "Module"
2. THE Backend SHALL update code comments to reference "Learning Unit" instead of "Module"
3. THE Backend SHALL update API documentation to reference "Learning Unit" instead of "Module"
4. WHERE comments refer to database tables or internal implementation, THE System SHALL retain the original terminology for clarity

### Requirement 9: Backward Data Compatibility

**User Story:** As a system administrator, I want existing data to continue working without migration, so that the deployment is risk-free.

#### Acceptance Criteria

1. THE Backend SHALL read from existing database tables (programme_modules, module_lessons) without schema changes
2. WHEN existing data is retrieved, THE Backend SHALL apply display terminology in API responses
3. THE Backend SHALL NOT require data migration scripts for this feature
4. WHEN new Learning Units are created, THE Backend SHALL store them in the existing programme_modules table

### Requirement 10: Convener Management Interface

**User Story:** As a convener, I want to create and manage Learning Units with the new terminology, so that I can organize course content clearly.

#### Acceptance Criteria

1. WHEN a convener creates a new Learning Unit, THE Frontend SHALL display "Add Learning Unit" as the button label
2. WHEN a convener edits a Learning Unit, THE Frontend SHALL display "Edit Learning Unit" as the screen title
3. WHEN a convener deletes a Learning Unit, THE Frontend SHALL display "Delete Learning Unit" in the confirmation dialog
4. WHEN a convener views Learning Unit details, THE Frontend SHALL display progress information showing how many learners have completed it
5. WHEN a convener renames a Learning Unit, THE Frontend SHALL display "Rename Learning Unit" as the action label

### Requirement 11: Error Message Consistency

**User Story:** As a user, I want error messages to use the new terminology, so that I am not confused by inconsistent language.

#### Acceptance Criteria

1. WHEN a Learning Unit fails to load, THE Frontend SHALL display an error message referencing "Learning Unit"
2. WHEN a Learning Unit creation fails, THE Frontend SHALL display an error message referencing "Learning Unit"
3. WHEN a Learning Unit deletion fails, THE Frontend SHALL display an error message referencing "Learning Unit"
4. THE Backend SHALL return error messages that reference "Learning Unit" instead of "Module"

### Requirement 12: Search and Filter Terminology

**User Story:** As a user, I want search and filter interfaces to use the new terminology, so that I can find content using consistent language.

#### Acceptance Criteria

1. WHERE search functionality exists for Learning Units, THE Frontend SHALL display "Search Learning Units" as placeholder text
2. WHERE filter options exist for Learning Units, THE Frontend SHALL display "Filter by Learning Unit" as the label
3. WHERE sorting options exist for Learning Units, THE Frontend SHALL display "Sort Learning Units" as the label
