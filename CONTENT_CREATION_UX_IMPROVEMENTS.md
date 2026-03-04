# Programme, Week, Cohort, and Lesson Creation UX Improvements

## Problem
Conveners were encountering errors and confusion when creating programmes, weeks, cohorts, and lessons:
- **Weeks**: 409 errors for duplicate week numbers
- **Cohorts**: Duplicate enrollment codes (already had real-time checking, but no visibility of existing cohorts)
- **Programmes**: Lack of guidance and feedback during creation
- **Lessons**: No visibility of existing lessons, unclear order index, no character counters

The error messages weren't always helpful, and there was limited visibility into what already existed or what makes good content.

## Solutions Implemented

## 1. Programme Creation Improvements

### Helpful Tips Banner
Added contextual guidance for first-time programme creators:
- Tips on choosing clear, descriptive names
- Guidance on writing compelling descriptions
- Advice on setting realistic start dates
- Only shows during creation (not editing)

### Character Counter for Description
- Real-time character count display (X/1000)
- Visual warning when approaching limit (turns orange at 900+ characters)
- Helps users optimize their descriptions
- Shows remaining space available

### Enhanced Placeholder Text
- More descriptive placeholder for description field
- Guides users on what to include
- "Describe what learners will learn and achieve in this programme"

### Date Helper
- Shows countdown to start date in human-readable format
- "Starting today", "Starting tomorrow", "Starting in X days"
- Visual feedback with emoji indicators
- Helps conveners understand timeline at a glance

### Helper Text
- Contextual hints below fields
- "Help learners understand what they'll gain from this programme"
- Guides users toward better content creation

## 2. Week Creation Improvements

### Collapsible Existing Weeks List
Added a collapsible section showing all existing weeks for the programme:
- Shows week number and title for each existing week
- Sorted by week number for easy scanning
- Auto-opens if ≤5 weeks, collapsed if >5 weeks
- Animated chevron icon indicates expand/collapse state
- Uses native `<details>` element for accessibility

### Smart Week Number Suggestion
- Automatically calculates the next available week number
- Uses `Math.max(...existingWeeks.map(w => w.weekNumber)) + 1`
- Defaults to 1 if no weeks exist yet

### Real-time Validation
- Validates week number input against existing weeks before submission
- Shows immediate feedback if user enters a duplicate week number
- Error message includes suggestion for next available week

### Enhanced Error Messages
- When backend returns 409 error, shows helpful message
- Suggests the next available week number
- Clear, actionable guidance for the user

### Simplified Helper Text
- Shows "Next available: Week X" below the input field
- Concise and clear without being verbose
- Only shows when there's no validation error

## 3. Cohort Creation Improvements

### Combined Context Banner
Merged two separate blue banners into one cohesive information section:
- Programme name context at top
- Collapsible existing cohorts list below
- Helpful tip about unique enrollment codes
- Cleaner visual hierarchy

### Collapsible Existing Cohorts List
Added a collapsible section showing all existing cohorts:
- Shows cohort name, enrollment code, and start date
- Auto-opens if ≤3 cohorts, collapsed if >3 cohorts
- Animated chevron icon indicates expand/collapse state
- Uses native `<details>` element for accessibility

### Removed Redundant Information
- Removed separate "Programme ID" display
- Programme name shown once in context banner
- Cleaner, less cluttered interface

### Date Countdown Helper
Added human-readable date feedback:
- "Starting today", "Starting tomorrow", "Starting in X days"
- Visual feedback with emoji indicators
- Helps conveners understand timeline at a glance

### Real-time Code Checking (Already Existed)
- The form already had real-time enrollment code availability checking
- Now enhanced with visibility of existing codes upfront
- Users can see what codes are taken before typing

### Better User Flow
- Users see what exists before creating
- Can reference existing cohort names and codes
- Reduces trial-and-error when choosing enrollment codes

## 4. Lesson Creation Improvements

### Collapsible Existing Lessons List
Added a collapsible section showing all existing lessons in the week:
- Shows lesson order index, title, and content type with icons
- Sorted by order index for easy scanning
- Auto-opens if ≤5 lessons, collapsed if >5 lessons
- Animated chevron icon indicates expand/collapse state
- Uses native `<details>` element for accessibility

### Helpful Tips Banner
Added contextual guidance for first-time lesson creators:
- Tips on writing clear, descriptive titles
- Guidance on choosing the right content type
- Explanation of order index system
- Only shows during creation (not editing)

### Character Counters
Added real-time character counters with visual warnings:
- Description field: X/1000 characters
- Text content field: X/50,000 characters
- Visual warning (orange) when approaching limit
- Helps conveners optimize their content

### Enhanced Placeholders and Helper Text
- More descriptive placeholders for all content types
- Contextual helper text for each field
- Better examples for URLs (YouTube, Zoom, Google Forms, etc.)
- Improved order index helper showing suggested position

### Smart Order Index Suggestion
- Automatically calculates next available order index
- Shows "Suggested: X (next available position)" helper text
- Defaults to 0 if no lessons exist yet
- Helps prevent ordering conflicts

### Content Type Icons
- Visual icons for each content type (🎥 Video, 📄 PDF, 🔗 Link, etc.)
- Makes existing lessons list more scannable
- Helps conveners quickly identify lesson types

## Files Modified

### Programme Creation

**`cohortle-web/src/components/convener/ProgrammeForm.tsx`**
- Added helpful tips banner for create mode
- Added character counter for description field with visual warning
- Enhanced placeholder text for better guidance
- Added date helper showing countdown to start date
- Added helper text below description field
- Improved user feedback throughout the form

### Week Creation

**`cohortle-web/src/components/convener/WeekForm.tsx`**
- Added `existingWeeks` prop (array of existing weeks)
- Added `ExistingWeek` interface for type safety
- Calculated `nextAvailableWeek` using `useMemo`
- Created `existingWeekNumbers` Set for O(1) lookup
- Added validation to check for duplicates
- Added UI section to display existing weeks
- Enhanced error message display
- Added helper text below week number input

**`cohortle-web/src/app/convener/programmes/[id]/weeks/new/page.tsx`**
- Removed `suggestedWeekNumber` state (now calculated in WeekForm)
- Added `existingWeeks` state to store all weeks
- Modified `fetchWeeks` to store complete week data
- Passed `existingWeeks` prop to WeekForm

### Cohort Creation

**`cohortle-web/src/components/convener/CohortForm.tsx`**
- Added `existingCohorts` prop (array of existing cohorts)
- Added `ExistingCohort` interface for type safety
- Added UI section to display existing cohorts with codes and dates
- Enhanced visual hierarchy with cohort information
- Added helpful tip about unique enrollment codes

**`cohortle-web/src/app/convener/programmes/[id]/cohorts/new/page.tsx`**
- Added `existingCohorts` state to store all cohorts
- Modified data fetching to include cohorts alongside programme
- Used `Promise.all` for parallel fetching
- Passed `existingCohorts` prop to CohortForm

### Lesson Creation

**`cohortle-web/src/components/convener/LessonForm.tsx`**
- Added `existingLessons` prop (array of existing lessons)
- Added `weekTitle` prop for context display
- Added `ExistingLesson` interface for type safety
- Added `getContentTypeInfo` helper function for icons and labels
- Added character counters for description and text content fields
- Added collapsible existing lessons list (auto-open if ≤5)
- Added helpful tips banner for create mode
- Enhanced placeholder text for all content types
- Improved order index helper text with suggestions
- Added visual warning for character limits

**`cohortle-web/src/app/convener/programmes/[id]/weeks/[weekId]/lessons/new/page.tsx`**
- Added `existingLessons` state to store all lessons
- Added `weekTitle` state for context display
- Modified `fetchLessons` to store complete lesson data and week title
- Passed `existingLessons` and `weekTitle` props to LessonForm

## User Experience Flow

### Programme Creation
1. User clicks "Create Programme" button
2. Form displays with helpful tips banner at top
3. User fills in programme name
4. User writes description:
   - Character counter updates in real-time
   - Helper text guides on what to include
   - Warning appears when approaching 1000 character limit
5. User selects start date:
   - Date helper shows countdown ("Starting in X days")
   - Visual feedback with emoji indicators
6. Form submission with clear feedback

### Week Creation
1. User clicks "Create Week" button
2. Page loads and fetches existing weeks
3. Form displays:
   - Collapsible list of existing weeks (auto-open if ≤5)
   - Week number input pre-filled with next available number
   - Helper text: "Next available: Week X"
4. If user enters duplicate week number:
   - Immediate validation error appears
   - Error message suggests correct week number
5. If user submits duplicate (edge case):
   - Backend returns 409 error
   - Enhanced error message shows with suggestion

### Cohort Creation
1. User clicks "Create Cohort" button
2. Page loads and fetches programme details and existing cohorts
3. Form displays:
   - Combined context banner with programme name
   - Collapsible list of existing cohorts (auto-open if ≤3)
   - Helpful tip about unique enrollment codes
4. User can reference existing codes while typing
5. Real-time validation checks code availability
6. Date helper shows countdown to start date
7. Clear feedback if code is already in use

### Lesson Creation
1. User clicks "Add Lesson" button for a week
2. Page loads and fetches existing lessons in the week
3. Form displays:
   - Collapsible list of existing lessons with order, title, and type (auto-open if ≤5)
   - Helpful tips banner about creating effective lessons
   - Week title context
4. User fills in lesson details:
   - Title with clear placeholder
   - Description with character counter (X/1000)
   - Content type selection (with icons in existing lessons)
   - Dynamic content fields based on type
   - Text content with character counter (X/50,000) if applicable
5. Order index field shows:
   - Suggested next position if lessons exist
   - Helper text explaining the system
6. Form submission with clear feedback

## Benefits

- **Guidance**: Clear tips and helpers guide users toward better content across all forms
- **Transparency**: Users see all existing items upfront with collapsible sections
- **Prevention**: Catches duplicates before submission (weeks) or during typing (cohorts)
- **Feedback**: Real-time character counts and date helpers provide immediate feedback
- **Efficiency**: Reduces trial-and-error and frustration
- **Context**: Users understand what already exists and what makes good content
- **Scalability**: Collapsible sections handle long lists gracefully (auto-open for short lists, collapsed for long lists)
- **Accessibility**: Proper ARIA labels, error associations, and native `<details>` elements
- **Quality**: Encourages better programme names, descriptions, and lesson content
- **Clean UI**: Removed redundant information, combined banners, simplified helper text
- **Visual Clarity**: Content type icons make lesson lists more scannable
- **Smart Suggestions**: Auto-calculated order indices and week numbers reduce errors

## Backend Unchanged

The backend validation remains the same for all four forms:
- Programmes: Standard validation for required fields and dates
- Weeks: Correctly enforces unique week numbers per programme
- Cohorts: Correctly enforces unique enrollment codes globally
- Lessons: Standard validation for required fields and content types

These are purely frontend UX improvements to make the forms more user-friendly, provide better guidance, and make constraints more visible.
