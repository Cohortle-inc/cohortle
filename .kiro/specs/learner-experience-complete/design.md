# Design Document: Learner Experience Complete

## Overview

This design document specifies the complete learner experience for the Cohortle web platform, building upon existing authentication and basic dashboard functionality. The learner experience encompasses programme discovery, enrollment, content consumption, progress tracking, and community engagement.

The platform follows a structured learning model where:
- Programmes contain Weeks (modules) which contain Lessons
- Learners enroll in Cohorts (specific instances of programmes with start/end dates)
- Content is unlocked progressively based on week start dates
- Progress is tracked at lesson, week, and programme levels
- Community features are scoped to cohorts for focused peer interaction

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- TailwindCSS for styling
- Cookie-based authentication with httpOnly cookies

**Backend:**
- Node.js/Express API
- MySQL database
- JWT tokens stored in httpOnly cookies
- RESTful API architecture

### Existing Foundation

The platform already has:
- Authentication system (login/signup/password reset)
- Basic learner dashboard showing enrolled programmes
- Programme/week/lesson data models
- Enrollment system with enrollment codes
- Convener dashboard for content management

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        A[Public Pages] --> B[Programme Catalogue]
        A --> C[Programme Details]
        D[Authenticated Pages] --> E[Learning Dashboard]
        D --> F[Programme View]
        D --> G[Lesson Viewer]
        D --> H[Community Feed]
        D --> I[Profile]
    end
    
    subgraph "API Layer"
        J[API Proxy Route] --> K[Backend API]
    end
    
    subgraph "Backend Services"
        K --> L[Programme Service]
        K --> M[Enrollment Service]
        K --> N[Content Service]
        K --> O[Progress Service]
        K --> P[Community Service]
    end
    
    subgraph "Data Layer"
        Q[(MySQL Database)]
        L --> Q
        M --> Q
        N --> Q
        O --> Q
        P --> Q
    end
    
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
```

### Page Structure


```
/browse                          - Public programme catalogue
/programmes/[id]                 - Public programme details
/join                           - Enrollment code entry (existing)
/dashboard                      - Learning dashboard (existing, needs enhancement)
/programmes/[id]/learn          - Programme learning view
/programmes/[id]/community      - Cohort community feed
/lessons/[id]                   - Lesson viewer (existing, needs enhancement)
/profile                        - Learner profile and settings
/profile/settings               - Notification preferences
```

### Authentication Flow

The platform uses cookie-based authentication:
1. User logs in via `/login`
2. Backend returns JWT token stored in httpOnly cookie
3. Frontend API proxy (`/api/proxy/[...path]`) forwards requests with cookie
4. Middleware validates token and injects `user_id` into requests
5. Role-based access control restricts learner vs convener routes

## Components and Interfaces

### Frontend Components

#### 1. Programme Discovery Components

**ProgrammeCatalogue Component**
```typescript
interface ProgrammeCatalogueProps {
  programmes: PublicProgramme[];
  onProgrammeClick: (id: string) => void;
}

interface PublicProgramme {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  weekCount: number;
  lessonCount: number;
  duration: string; // e.g., "8 weeks"
}
```

**ProgrammeDetailView Component**
```typescript
interface ProgrammeDetailViewProps {
  programme: ProgrammeDetail;
  onEnroll: () => void;
}

interface ProgrammeDetail {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  weeks: WeekSummary[];
  prerequisites?: string;
  totalLessons: number;
  estimatedDuration: string;
}

interface WeekSummary {
  weekNumber: number;
  title: string;
  lessonCount: number;
}
```

#### 2. Learning Dashboard Components

**EnhancedDashboard Component**
```typescript
interface EnhancedDashboardProps {
  enrolledProgrammes: EnrolledProgramme[];
  upcomingSessions: LiveSession[];
  recentActivity: CompletedLesson[];
  onContinueLearning: () => void;
}

interface EnrolledProgramme {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  progress: number; // 0-100
  cohortName: string;
  cohortId: number;
  nextLesson?: {
    id: string;
    title: string;
    weekNumber: number;
  };
}

interface LiveSession {
  id: string;
  title: string;
  programmeName: string;
  programmeId: number;
  dateTime: string; // ISO 8601
  joinUrl?: string;
}

interface CompletedLesson {
  id: string;
  title: string;
  programmeName: string;
  completedAt: string; // ISO 8601
}
```

**ProgressCard Component**
```typescript
interface ProgressCardProps {
  programme: EnrolledProgramme;
  onClick: () => void;
}
```

**UpcomingSessionsList Component**
```typescript
interface UpcomingSessionsListProps {
  sessions: LiveSession[];
  maxDisplay?: number; // default 5
}
```

**RecentActivityFeed Component**
```typescript
interface RecentActivityFeedProps {
  activities: CompletedLesson[];
  maxDisplay?: number; // default 5
}
```

#### 3. Programme Learning View Components

**ProgrammeStructureView Component**
```typescript
interface ProgrammeStructureViewProps {
  programme: ProgrammeWithWeeks;
  cohortId: number;
  onLessonClick: (lessonId: string) => void;
}

interface ProgrammeWithWeeks {
  id: number;
  name: string;
  description: string;
  progress: number;
  weeks: WeekWithLessons[];
}

interface WeekWithLessons {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  startDate: string;
  isLocked: boolean;
  progress: number;
  lessons: LessonSummary[];
}

interface LessonSummary {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'link' | 'quiz' | 'live_session';
  duration?: number; // minutes
  isCompleted: boolean;
  orderIndex: number;
}
```

**WeekAccordion Component**
```typescript
interface WeekAccordionProps {
  week: WeekWithLessons;
  isExpanded: boolean;
  onToggle: () => void;
  onLessonClick: (lessonId: string) => void;
}
```

**LessonListItem Component**
```typescript
interface LessonListItemProps {
  lesson: LessonSummary;
  isLocked: boolean;
  onClick: () => void;
}
```

**ProgressIndicator Component**
```typescript
interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}
```


#### 4. Lesson Viewer Components

**EnhancedLessonViewer Component**
```typescript
interface EnhancedLessonViewerProps {
  lesson: LessonDetail;
  navigation: LessonNavigation;
  onComplete: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'pdf' | 'link' | 'quiz' | 'live_session';
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  isCompleted: boolean;
  weekNumber: number;
  weekTitle: string;
  programmeId: number;
  programmeName: string;
}

interface LessonNavigation {
  hasPrevious: boolean;
  hasNext: boolean;
  previousLessonId?: string;
  nextLessonId?: string;
}
```

**LessonContentRenderer Component**
```typescript
interface LessonContentRendererProps {
  type: string;
  contentUrl?: string;
  contentText?: string;
}
```

**VideoLessonContent Component**
```typescript
interface VideoLessonContentProps {
  url: string;
  title: string;
}
```

**TextLessonContent Component**
```typescript
interface TextLessonContentProps {
  content: string;
}
```

**PdfLessonContent Component**
```typescript
interface PdfLessonContentProps {
  url: string;
  title: string;
}
```

**LinkLessonContent Component**
```typescript
interface LinkLessonContentProps {
  url: string;
  title: string;
  description?: string;
}
```

**QuizLessonContent Component**
```typescript
interface QuizLessonContentProps {
  questions: QuizQuestion[];
  onSubmit: (answers: QuizAnswer[]) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number; // index
}

interface QuizAnswer {
  questionId: string;
  selectedOption: number;
}
```

**LiveSessionContent Component**
```typescript
interface LiveSessionContentProps {
  sessionDate: string;
  sessionTime: string;
  joinUrl?: string;
  description?: string;
}
```

**CompletionButton Component**
```typescript
interface CompletionButtonProps {
  isCompleted: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}
```

**LessonNavigationButtons Component**
```typescript
interface LessonNavigationButtonsProps {
  navigation: LessonNavigation;
  onNavigate: (direction: 'prev' | 'next') => void;
}
```

**BreadcrumbNavigation Component**
```typescript
interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}
```

#### 5. Comments and Discussion Components

**LessonComments Component**
```typescript
interface LessonCommentsProps {
  lessonId: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
  onEditComment: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (parentId: string, text: string) => void;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  replies: Comment[];
  canEdit: boolean;
  canDelete: boolean;
}
```

**CommentItem Component**
```typescript
interface CommentItemProps {
  comment: Comment;
  onEdit: (commentId: string, text: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (parentId: string, text: string) => void;
  depth: number; // 0 or 1 (max 2 levels)
}
```

**CommentForm Component**
```typescript
interface CommentFormProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
}
```

#### 6. Community Feed Components

**CommunityFeed Component**
```typescript
interface CommunityFeedProps {
  cohortId: number;
  posts: Post[];
  onCreatePost: (content: string) => void;
  onEditPost: (postId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  onLikePost: (postId: string) => void;
  onUnlikePost: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  likeCount: number;
  isLikedByUser: boolean;
  commentCount: number;
  comments: PostComment[];
  canEdit: boolean;
  canDelete: boolean;
}

interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}
```

**PostItem Component**
```typescript
interface PostItemProps {
  post: Post;
  onEdit: (postId: string, content: string) => void;
  onDelete: (postId: string) => void;
  onLike: () => void;
  onUnlike: () => void;
  onAddComment: (text: string) => void;
}
```

**PostForm Component**
```typescript
interface PostFormProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  maxLength?: number; // default 2000
}
```

#### 7. Profile Components

**LearnerProfile Component**
```typescript
interface LearnerProfileProps {
  user: UserProfile;
  stats: LearningStats;
  achievements: Achievement[];
  onUpdateProfile: (data: ProfileUpdate) => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  joinedAt: string;
}

interface LearningStats {
  totalProgrammes: number;
  completedProgrammes: number;
  totalLessonsCompleted: number;
  currentStreak: number; // days
  longestStreak: number; // days
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface ProfileUpdate {
  name?: string;
  profilePicture?: string;
}
```

**NotificationSettings Component**
```typescript
interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onUpdate: (preferences: NotificationPreferences) => void;
}

interface NotificationPreferences {
  emailLessonReminders: boolean;
  emailCommunityActivity: boolean;
  emailProgrammeUpdates: boolean;
  emailWeeklyDigest: boolean;
}
```

**LearningGoals Component**
```typescript
interface LearningGoalsProps {
  currentGoal?: LearningGoal;
  onSetGoal: (goal: LearningGoal) => void;
}

interface LearningGoal {
  type: 'lessons_per_week' | 'hours_per_week';
  target: number;
  current: number;
}
```


### Backend API Endpoints

#### Programme Discovery Endpoints

```
GET /v1/api/programmes/public
- Returns: List of all public programmes
- Auth: None required
- Response: { programmes: PublicProgramme[] }

GET /v1/api/programmes/:id/public
- Returns: Detailed programme information
- Auth: None required
- Response: { programme: ProgrammeDetail }
```

#### Enrollment Endpoints (Existing)

```
POST /v1/api/programmes/enroll
- Body: { code: string }
- Returns: { success: boolean, programme_id: string, cohort_id: string }
- Auth: Required (learner)

GET /v1/api/programmes/enrolled
- Returns: List of enrolled programmes with progress
- Auth: Required (learner)
- Response: { programmes: EnrolledProgramme[] }
```

#### Programme Learning Endpoints

```
GET /v1/api/programmes/:id/weeks
- Query: cohort_id (optional)
- Returns: Programme weeks with lessons and completion status
- Auth: Required (learner)
- Response: { weeks: WeekWithLessons[] }

GET /v1/api/programmes/:id/progress
- Query: cohort_id
- Returns: Overall programme progress
- Auth: Required (learner)
- Response: { progress: number, completedLessons: number, totalLessons: number }
```

#### Lesson Endpoints

```
GET /v1/api/lessons/:id
- Returns: Lesson detail with metadata
- Auth: Required (learner)
- Response: { lesson: LessonDetail }

GET /v1/api/lessons/:id/navigation
- Query: cohort_id
- Returns: Previous/next lesson IDs
- Auth: Required (learner)
- Response: { navigation: LessonNavigation }

POST /v1/api/lessons/:id/complete
- Body: { cohort_id: number }
- Returns: Success confirmation
- Auth: Required (learner)
- Response: { success: boolean, completedAt: string }

DELETE /v1/api/lessons/:id/complete
- Body: { cohort_id: number }
- Returns: Success confirmation
- Auth: Required (learner)
- Response: { success: boolean }
```

#### Comment Endpoints

```
GET /v1/api/lessons/:id/comments
- Returns: All comments for a lesson
- Auth: Required (learner)
- Response: { comments: Comment[] }

POST /v1/api/lessons/:id/comments
- Body: { text: string, parent_id?: string }
- Returns: Created comment
- Auth: Required (learner)
- Response: { comment: Comment }

PUT /v1/api/comments/:id
- Body: { text: string }
- Returns: Updated comment
- Auth: Required (learner, must be author)
- Response: { comment: Comment }

DELETE /v1/api/comments/:id
- Returns: Success confirmation
- Auth: Required (learner, must be author)
- Response: { success: boolean }
```

#### Community Feed Endpoints

```
GET /v1/api/cohorts/:id/posts
- Query: page, limit (default 20)
- Returns: Paginated posts for cohort
- Auth: Required (learner, must be enrolled)
- Response: { posts: Post[], hasMore: boolean, total: number }

POST /v1/api/cohorts/:id/posts
- Body: { content: string }
- Returns: Created post
- Auth: Required (learner, must be enrolled)
- Response: { post: Post }

PUT /v1/api/posts/:id
- Body: { content: string }
- Returns: Updated post
- Auth: Required (learner, must be author)
- Response: { post: Post }

DELETE /v1/api/posts/:id
- Returns: Success confirmation
- Auth: Required (learner, must be author)
- Response: { success: boolean }

POST /v1/api/posts/:id/like
- Returns: Success confirmation
- Auth: Required (learner)
- Response: { success: boolean, likeCount: number }

DELETE /v1/api/posts/:id/like
- Returns: Success confirmation
- Auth: Required (learner)
- Response: { success: boolean, likeCount: number }

POST /v1/api/posts/:id/comments
- Body: { text: string }
- Returns: Created comment
- Auth: Required (learner)
- Response: { comment: PostComment }
```

#### Profile Endpoints

```
GET /v1/api/profile
- Returns: User profile and learning stats
- Auth: Required (learner)
- Response: { user: UserProfile, stats: LearningStats }

PUT /v1/api/profile
- Body: { name?: string, profile_picture?: string }
- Returns: Updated profile
- Auth: Required (learner)
- Response: { user: UserProfile }

GET /v1/api/profile/achievements
- Returns: User achievements
- Auth: Required (learner)
- Response: { achievements: Achievement[] }

GET /v1/api/profile/preferences
- Returns: Notification preferences
- Auth: Required (learner)
- Response: { preferences: NotificationPreferences }

PUT /v1/api/profile/preferences
- Body: NotificationPreferences
- Returns: Updated preferences
- Auth: Required (learner)
- Response: { preferences: NotificationPreferences }

GET /v1/api/profile/goals
- Returns: Current learning goal
- Auth: Required (learner)
- Response: { goal: LearningGoal | null }

PUT /v1/api/profile/goals
- Body: LearningGoal
- Returns: Updated goal
- Auth: Required (learner)
- Response: { goal: LearningGoal }
```

#### Dashboard Endpoints

```
GET /v1/api/dashboard/upcoming-sessions
- Returns: Upcoming live sessions across all enrolled programmes
- Auth: Required (learner)
- Response: { sessions: LiveSession[] }

GET /v1/api/dashboard/recent-activity
- Query: limit (default 5)
- Returns: Recently completed lessons
- Auth: Required (learner)
- Response: { activities: CompletedLesson[] }

GET /v1/api/dashboard/next-lesson
- Returns: Next incomplete lesson across all programmes
- Auth: Required (learner)
- Response: { lesson: { id: string, title: string, programmeId: number } | null }
```


## Data Models

### Database Schema Extensions

The platform already has core tables (users, programmes, cohorts, weeks, lessons, enrollments). We need to add:

#### lesson_completions Table
```sql
CREATE TABLE lesson_completions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  lesson_id VARCHAR(36) NOT NULL,
  cohort_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  UNIQUE KEY unique_completion (user_id, lesson_id, cohort_id)
);
```

#### lesson_comments Table
```sql
CREATE TABLE lesson_comments (
  id VARCHAR(36) PRIMARY KEY,
  lesson_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  parent_id VARCHAR(36) NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES lesson_comments(id) ON DELETE CASCADE
);
```

#### cohort_posts Table
```sql
CREATE TABLE cohort_posts (
  id VARCHAR(36) PRIMARY KEY,
  cohort_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### post_likes Table
```sql
CREATE TABLE post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES cohort_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_like (post_id, user_id)
);
```

#### post_comments Table
```sql
CREATE TABLE post_comments (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES cohort_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### user_preferences Table
```sql
CREATE TABLE user_preferences (
  user_id INT PRIMARY KEY,
  email_lesson_reminders BOOLEAN DEFAULT TRUE,
  email_community_activity BOOLEAN DEFAULT TRUE,
  email_programme_updates BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### learning_goals Table
```sql
CREATE TABLE learning_goals (
  user_id INT PRIMARY KEY,
  goal_type ENUM('lessons_per_week', 'hours_per_week') NOT NULL,
  target_value INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### achievements Table
```sql
CREATE TABLE achievements (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  criteria JSON NOT NULL
);
```

#### user_achievements Table
```sql
CREATE TABLE user_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE KEY unique_achievement (user_id, achievement_id)
);
```

### Service Layer

#### ProgressService

Handles all progress calculation and tracking logic.

```javascript
class ProgressService {
  /**
   * Calculate programme progress for a user
   * @param {number} userId
   * @param {number} programmeId
   * @param {number} cohortId
   * @returns {Promise<{progress: number, completedLessons: number, totalLessons: number}>}
   */
  async calculateProgrammeProgress(userId, programmeId, cohortId) {
    // Get all lessons in programme
    // Count completed lessons for user
    // Return progress percentage
  }

  /**
   * Calculate week progress for a user
   * @param {number} userId
   * @param {string} weekId
   * @param {number} cohortId
   * @returns {Promise<{progress: number, completedLessons: number, totalLessons: number}>}
   */
  async calculateWeekProgress(userId, weekId, cohortId) {
    // Get all lessons in week
    // Count completed lessons for user
    // Return progress percentage
  }

  /**
   * Mark lesson as complete
   * @param {number} userId
   * @param {string} lessonId
   * @param {number} cohortId
   * @returns {Promise<{success: boolean, completedAt: string}>}
   */
  async markLessonComplete(userId, lessonId, cohortId) {
    // Insert or update completion record
    // Return completion timestamp
  }

  /**
   * Mark lesson as incomplete
   * @param {number} userId
   * @param {string} lessonId
   * @param {number} cohortId
   * @returns {Promise<{success: boolean}>}
   */
  async markLessonIncomplete(userId, lessonId, cohortId) {
    // Delete completion record
  }

  /**
   * Get user's recent activity
   * @param {number} userId
   * @param {number} limit
   * @returns {Promise<CompletedLesson[]>}
   */
  async getRecentActivity(userId, limit = 5) {
    // Query recent completions with lesson/programme details
  }

  /**
   * Get next incomplete lesson for user
   * @param {number} userId
   * @returns {Promise<{id: string, title: string, programmeId: number} | null>}
   */
  async getNextIncompleteLesson(userId) {
    // Find first incomplete lesson across all enrolled programmes
    // Respect week unlock dates
  }
}
```

#### CommentService

Handles lesson comments and discussions.

```javascript
class CommentService {
  /**
   * Get comments for a lesson
   * @param {string} lessonId
   * @returns {Promise<Comment[]>}
   */
  async getLessonComments(lessonId) {
    // Query comments with user details
    // Build threaded structure (max 2 levels)
  }

  /**
   * Create a comment
   * @param {string} lessonId
   * @param {number} userId
   * @param {string} text
   * @param {string} parentId
   * @returns {Promise<Comment>}
   */
  async createComment(lessonId, userId, text, parentId = null) {
    // Validate nesting depth (max 2 levels)
    // Insert comment
    // Return with user details
  }

  /**
   * Update a comment
   * @param {string} commentId
   * @param {number} userId
   * @param {string} text
   * @returns {Promise<Comment>}
   */
  async updateComment(commentId, userId, text) {
    // Verify ownership
    // Update comment
  }

  /**
   * Delete a comment
   * @param {string} commentId
   * @param {number} userId
   * @returns {Promise<{success: boolean}>}
   */
  async deleteComment(commentId, userId) {
    // Verify ownership
    // Delete comment (cascade to replies)
  }
}
```

#### CommunityService

Handles cohort community feed.

```javascript
class CommunityService {
  /**
   * Get posts for a cohort
   * @param {number} cohortId
   * @param {number} userId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{posts: Post[], hasMore: boolean, total: number}>}
   */
  async getCohortPosts(cohortId, userId, page = 1, limit = 20) {
    // Verify user is enrolled in cohort
    // Query posts with pagination
    // Include like status for current user
  }

  /**
   * Create a post
   * @param {number} cohortId
   * @param {number} userId
   * @param {string} content
   * @returns {Promise<Post>}
   */
  async createPost(cohortId, userId, content) {
    // Verify enrollment
    // Insert post
  }

  /**
   * Update a post
   * @param {string} postId
   * @param {number} userId
   * @param {string} content
   * @returns {Promise<Post>}
   */
  async updatePost(postId, userId, content) {
    // Verify ownership
    // Update post
  }

  /**
   * Delete a post
   * @param {string} postId
   * @param {number} userId
   * @returns {Promise<{success: boolean}>}
   */
  async deletePost(postId, userId) {
    // Verify ownership
    // Delete post (cascade to likes and comments)
  }

  /**
   * Like a post
   * @param {string} postId
   * @param {number} userId
   * @returns {Promise<{success: boolean, likeCount: number}>}
   */
  async likePost(postId, userId) {
    // Insert like (ignore if exists)
    // Return updated count
  }

  /**
   * Unlike a post
   * @param {string} postId
   * @param {number} userId
   * @returns {Promise<{success: boolean, likeCount: number}>}
   */
  async unlikePost(postId, userId) {
    // Delete like
    // Return updated count
  }

  /**
   * Add comment to post
   * @param {string} postId
   * @param {number} userId
   * @param {string} text
   * @returns {Promise<PostComment>}
   */
  async addPostComment(postId, userId, text) {
    // Insert comment
  }
}
```

#### ProfileService

Handles user profile and preferences.

```javascript
class ProfileService {
  /**
   * Get user profile with stats
   * @param {number} userId
   * @returns {Promise<{user: UserProfile, stats: LearningStats}>}
   */
  async getUserProfile(userId) {
    // Query user details
    // Calculate learning stats
  }

  /**
   * Update user profile
   * @param {number} userId
   * @param {ProfileUpdate} data
   * @returns {Promise<UserProfile>}
   */
  async updateProfile(userId, data) {
    // Update user record
  }

  /**
   * Get notification preferences
   * @param {number} userId
   * @returns {Promise<NotificationPreferences>}
   */
  async getPreferences(userId) {
    // Query or create default preferences
  }

  /**
   * Update notification preferences
   * @param {number} userId
   * @param {NotificationPreferences} preferences
   * @returns {Promise<NotificationPreferences>}
   */
  async updatePreferences(userId, preferences) {
    // Upsert preferences
  }

  /**
   * Get learning goal
   * @param {number} userId
   * @returns {Promise<LearningGoal | null>}
   */
  async getLearningGoal(userId) {
    // Query goal with current progress
  }

  /**
   * Set learning goal
   * @param {number} userId
   * @param {LearningGoal} goal
   * @returns {Promise<LearningGoal>}
   */
  async setLearningGoal(userId, goal) {
    // Upsert goal
  }

  /**
   * Get user achievements
   * @param {number} userId
   * @returns {Promise<Achievement[]>}
   */
  async getUserAchievements(userId) {
    // Query earned achievements
  }
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Enrollment Properties

Property 1: Valid enrollment code acceptance
*For any* valid enrollment code and learner, submitting the code should create an enrollment record linking the learner to the correct cohort
**Validates: Requirements 1.6**

Property 2: Invalid enrollment code rejection
*For any* invalid or expired enrollment code, the system should reject the enrollment attempt and return a descriptive error message
**Validates: Requirements 1.5**

Property 3: Enrollment idempotence
*For any* learner and cohort combination, enrolling multiple times should have the same effect as enrolling once (no duplicate enrollments)
**Validates: Requirements 1.8**

### Progress Calculation Properties

Property 4: Programme progress calculation
*For any* programme and completion state, the progress percentage should equal (completed lessons / total lessons) × 100
**Validates: Requirements 2.4, 6.1**

Property 5: Week progress calculation
*For any* week and completion state, the progress percentage should equal (completed lessons in week / total lessons in week) × 100
**Validates: Requirements 3.6, 6.2**

Property 6: Progress update propagation
*For any* lesson completion, all affected progress indicators (lesson, week, programme) should update immediately to reflect the new completion state
**Validates: Requirements 4.10, 6.4**

### Content Access Control Properties

Property 7: Week locking by date
*For any* week with a start date in the future, the week should be displayed as locked and lessons within it should be inaccessible
**Validates: Requirements 3.7, 3.8**

Property 8: Cohort feed access restriction
*For any* cohort community feed, only learners enrolled in that cohort should be able to view or post content
**Validates: Requirements 7.2, 13.3**

Property 9: Lesson content access restriction
*For any* lesson, only learners enrolled in the programme containing that lesson should be able to access the content
**Validates: Requirements 13.4**

### Data Persistence Properties

Property 10: Completion status persistence
*For any* lesson marked complete by a learner, querying the completion status should return completed across all sessions and devices
**Validates: Requirements 6.10, 12.1**

Property 11: Profile update persistence
*For any* valid profile update, the changes should be immediately retrievable from the database
**Validates: Requirements 8.4**

Property 12: Preference update persistence
*For any* notification preference change, the new preferences should be immediately saved and retrievable
**Validates: Requirements 8.9**

### Sorting and Ordering Properties

Property 13: Live session chronological sorting
*For any* set of upcoming live sessions, they should be sorted with the nearest session first
**Validates: Requirements 2.8**

Property 14: Community feed reverse chronological order
*For any* set of posts in a community feed, they should be displayed in reverse chronological order (newest first)
**Validates: Requirements 7.3**

Property 15: Lesson sequence navigation
*For any* lesson with adjacent lessons, clicking next/previous should navigate to the correct adjacent lesson in the programme sequence
**Validates: Requirements 4.12**

### Input Validation Properties

Property 16: Empty comment rejection
*For any* string composed entirely of whitespace or empty, submitting it as a comment should be rejected
**Validates: Requirements 5.4**

Property 17: Empty post rejection
*For any* string composed entirely of whitespace or empty, submitting it as a post should be rejected
**Validates: Requirements 7.6**

Property 18: Empty name rejection
*For any* profile update with an empty or whitespace-only name, the update should be rejected
**Validates: Requirements 8.3**

Property 19: Input sanitization
*For any* user input containing potentially malicious content, the system should sanitize it to prevent injection attacks
**Validates: Requirements 13.5**

Property 20: Output sanitization
*For any* user-generated content displayed to other users, the system should sanitize it to prevent XSS attacks
**Validates: Requirements 13.6**

### Comment Threading Properties

Property 21: Comment nesting limit
*For any* comment thread, replies should be limited to a maximum depth of 2 levels
**Validates: Requirements 5.9**

Property 22: Comment creation with linkage
*For any* valid comment submission, a comment record should be created and correctly linked to the lesson and author
**Validates: Requirements 5.5**

### Community Engagement Properties

Property 23: Like count increment
*For any* post, when a learner likes it, the like count should increment by 1 and the like button should be highlighted for that learner
**Validates: Requirements 7.12**

Property 24: Like/unlike round trip
*For any* post, liking then immediately unliking should restore the original like count and button state
**Validates: Requirements 7.13**

Property 25: Feed pagination
*For any* community feed with more than 20 posts, the system should paginate results showing 20 posts per page
**Validates: Requirements 7.18**

### Error Handling Properties

Property 26: Network error retry
*For any* save operation that fails due to network error, the system should retry up to 3 times before displaying an error
**Validates: Requirements 12.5**

Property 27: Optimistic update rollback
*For any* optimistic UI update where server confirmation fails, the UI should revert to the previous state and display an error message
**Validates: Requirements 12.10**

### Authentication and Authorization Properties

Property 28: Authentication requirement
*For any* learner page or API endpoint, unauthenticated requests should be rejected and redirected to login
**Validates: Requirements 13.1, 13.2**


## Error Handling

### Client-Side Error Handling

**Network Errors:**
- Display user-friendly error messages
- Implement automatic retry with exponential backoff (3 attempts)
- Queue failed operations for later retry when connection restored
- Show offline indicator when network unavailable

**Validation Errors:**
- Display inline validation messages on forms
- Highlight invalid fields with clear error text
- Prevent form submission until validation passes
- Provide helpful hints for correct input format

**Authentication Errors:**
- Redirect to login page when session expires
- Display session timeout warning before expiration
- Preserve user's intended destination for post-login redirect
- Clear sensitive data from memory on logout

**Authorization Errors:**
- Display "Access Denied" message for unauthorized resources
- Redirect to appropriate page based on user role
- Log authorization failures for security monitoring

**Content Loading Errors:**
- Display fallback UI when content fails to load
- Provide retry button for failed requests
- Show skeleton loaders during initial load
- Handle missing or malformed data gracefully

### Server-Side Error Handling

**Input Validation:**
- Validate all request parameters before processing
- Return 400 Bad Request with detailed validation errors
- Sanitize inputs to prevent injection attacks
- Log validation failures for security monitoring

**Database Errors:**
- Catch and log all database exceptions
- Return 500 Internal Server Error for unexpected failures
- Implement transaction rollback for failed operations
- Monitor database connection health

**Business Logic Errors:**
- Return appropriate HTTP status codes (404, 409, etc.)
- Provide descriptive error messages
- Log errors with context for debugging
- Implement circuit breakers for external dependencies

**Rate Limiting:**
- Return 429 Too Many Requests when limits exceeded
- Include Retry-After header with wait time
- Implement per-user and per-IP rate limits
- Log rate limit violations

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "validation_errors": [
    {
      "field": "field_name",
      "message": "Field-specific error message",
      "rule": "validation_rule"
    }
  ]
}
```

## Testing Strategy

### Dual Testing Approach

The learner experience requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Test specific examples and edge cases
- Verify component rendering with different props
- Test API endpoint responses with known inputs
- Validate error handling for specific scenarios
- Test integration between components

**Property-Based Tests:**
- Verify universal properties across all inputs
- Test progress calculations with random completion states
- Validate sorting and ordering with random data sets
- Test input validation with generated invalid inputs
- Verify access control with random user/resource combinations

### Property-Based Testing Configuration

**Testing Library:** fast-check (JavaScript/TypeScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: **Feature: learner-experience-complete, Property {number}: {property_text}**

**Example Property Test:**

```typescript
import fc from 'fast-check';

// Feature: learner-experience-complete, Property 4: Programme progress calculation
test('programme progress equals (completed / total) × 100', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100 }), // total lessons
      fc.integer({ min: 0, max: 100 }), // completed lessons
      (total, completed) => {
        fc.pre(completed <= total); // precondition
        
        const progress = calculateProgrammeProgress(completed, total);
        const expected = total === 0 ? 0 : (completed / total) * 100;
        
        expect(progress).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Testing Priorities

**High Priority (Must Test):**
1. Progress calculation accuracy (Properties 4, 5, 6)
2. Access control enforcement (Properties 7, 8, 9, 28)
3. Data persistence (Properties 10, 11, 12)
4. Input validation and sanitization (Properties 16-20)
5. Enrollment logic (Properties 1, 2, 3)

**Medium Priority (Should Test):**
1. Sorting and ordering (Properties 13, 14, 15)
2. Comment threading (Properties 21, 22)
3. Community engagement (Properties 23, 24, 25)
4. Error handling (Properties 26, 27)

**Low Priority (Nice to Test):**
1. UI responsiveness
2. Performance benchmarks
3. Accessibility compliance
4. Cross-browser compatibility

### Integration Testing

**Critical User Flows:**
1. Browse programmes → Enroll → View content → Complete lesson → Check progress
2. View dashboard → Continue learning → Navigate lessons → Complete programme
3. Access community feed → Create post → Like post → Comment on post
4. Update profile → Change preferences → Set learning goal → View achievements

**API Integration Tests:**
- Test complete request/response cycles
- Verify authentication and authorization
- Test error responses and status codes
- Validate data transformations

### End-to-End Testing

**Key Scenarios:**
1. New learner enrollment journey
2. Returning learner continuing progress
3. Community engagement workflow
4. Profile management workflow
5. Mobile responsive experience

**Tools:**
- Playwright or Cypress for E2E tests
- Test on multiple browsers and devices
- Validate accessibility with axe-core
- Monitor performance with Lighthouse

## Mobile Responsiveness

### Breakpoints

```css
/* Mobile: 320px - 767px */
/* Tablet: 768px - 1023px */
/* Desktop: 1024px+ */
```

### Mobile-Specific Considerations

**Navigation:**
- Hamburger menu for mobile
- Bottom navigation bar for quick access
- Swipe gestures for lesson navigation

**Content Display:**
- Collapsible accordions for week lists
- Card-based layouts for programmes
- Optimized video players for mobile
- Touch-friendly button sizes (44×44px minimum)

**Performance:**
- Lazy load images and videos
- Reduce bundle size for mobile
- Implement service worker for offline support
- Optimize API responses for mobile networks

**Accessibility:**
- Ensure touch targets are adequately sized
- Support pinch-to-zoom for text content
- Provide alternative text for all images
- Test with mobile screen readers

## Deployment Considerations

### Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://api.cohortle.com
NEXT_PUBLIC_ENVIRONMENT=production
```

**Backend (.env):**
```
DATABASE_URL=mysql://user:pass@host:3306/cohortle
JWT_SECRET=<secret>
COOKIE_DOMAIN=.cohortle.com
CORS_ORIGIN=https://cohortle.com
```

### Database Migrations

All new tables must be created via migration scripts:
- lesson_completions
- lesson_comments
- cohort_posts
- post_likes
- post_comments
- user_preferences
- learning_goals
- achievements
- user_achievements

### Performance Monitoring

**Metrics to Track:**
- Page load times
- API response times
- Database query performance
- Error rates
- User engagement metrics

**Tools:**
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics (Google Analytics, Mixpanel)
- Database monitoring

### Security Considerations

**Authentication:**
- httpOnly cookies for token storage
- Secure flag on cookies in production
- CSRF protection on state-changing operations
- Session timeout after inactivity

**Authorization:**
- Role-based access control (learner vs convener)
- Resource-level permissions (cohort enrollment checks)
- API endpoint protection with middleware

**Data Protection:**
- Input validation on all endpoints
- Output sanitization for user-generated content
- SQL injection prevention (parameterized queries)
- XSS prevention (content sanitization)
- Rate limiting to prevent abuse

## Future Enhancements

### Phase 2 Features

1. **Advanced Progress Tracking:**
   - Learning streaks and gamification
   - Detailed analytics dashboard
   - Time spent tracking
   - Completion certificates

2. **Enhanced Community:**
   - Direct messaging between learners
   - Study groups within cohorts
   - Mentor matching
   - Live chat during sessions

3. **Content Enhancements:**
   - Interactive quizzes with scoring
   - Assignments and submissions
   - Peer review system
   - Resource library

4. **Notifications:**
   - Email notifications for activity
   - Push notifications (web and mobile)
   - SMS reminders for live sessions
   - Weekly digest emails

5. **Mobile App:**
   - Native iOS and Android apps
   - Offline content access
   - Push notifications
   - Mobile-optimized video player

### Technical Debt

- Implement comprehensive caching strategy
- Add full-text search for content
- Optimize database queries with indexes
- Implement CDN for static assets
- Add automated backup system
- Implement feature flags for gradual rollouts
