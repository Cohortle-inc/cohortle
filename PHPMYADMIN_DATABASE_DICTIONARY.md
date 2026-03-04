# Cohortle API - Database Dictionary for phpMyAdmin

## Complete Database Schema Documentation

This document lists all database tables, their columns, data types, constraints, and relationships as they should be created in phpMyAdmin.

---

## Core User Management

### 1. users
**Purpose:** Store user account information

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| first_name | VARCHAR(255) | YES | | NULL | | User's first name |
| last_name | VARCHAR(255) | YES | | NULL | | User's last name |
| location | TEXT | YES | | NULL | | User's location |
| joined_at | DATETIME | YES | | NULL | | Account creation date |
| socials | TEXT | YES | | NULL | | Social media links (JSON) |
| status | VARCHAR(255) | YES | | NULL | | Account status |
| profile_image | VARCHAR(500) | YES | | NULL | | Profile image URL |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

---

## Community & Organization Management

### 2. communities
**Purpose:** Store community/organization information

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| owner_id | INT | NO | MUL | NULL | | FK to users.id |
| name | VARCHAR(255) | NO | | NULL | | Community name |
| organization_type | VARCHAR(100) | YES | | NULL | | Type of organization |
| description | TEXT | YES | | NULL | | Community description |
| thumbnail | TEXT | YES | | NULL | | Community thumbnail URL |
| status | VARCHAR(255) | NO | | 'active' | | Community status |
| join_code | VARCHAR(255) | YES | UNI | NULL | | Unique join code |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_owner_id (owner_id)
- UNIQUE KEY join_code (join_code)

**Foreign Keys:**
- owner_id REFERENCES users(id)

---

### 3. community_members
**Purpose:** Track community membership

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| community_id | INT | NO | MUL | NULL | | FK to communities.id |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| role | VARCHAR(255) | YES | | NULL | | Member role in community |
| status | VARCHAR(255) | YES | | NULL | | Membership status |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX community_id (community_id)
- INDEX user_id (user_id)

**Foreign Keys:**
- community_id REFERENCES communities(id)
- user_id REFERENCES users(id)

---

## Programme Management

### 4. programmes
**Purpose:** Store learning programme information

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| community_id | INT | NO | MUL | NULL | | FK to communities.id |
| name | VARCHAR(255) | NO | | NULL | | Programme name |
| description | TEXT | YES | | NULL | | Programme description |
| start_date | DATETIME | YES | | NULL | | Programme start date |
| end_date | DATETIME | YES | | NULL | | Programme end date |
| metadata | JSON | YES | | NULL | | Additional metadata |
| status | VARCHAR(100) | NO | | 'draft' | | Programme status |
| type | ENUM('scheduled','structured','self_paced') | NO | | 'scheduled' | | Programme type |
| settings | JSON | YES | | NULL | | Programme settings |
| created_by | INT | YES | | NULL | | Creator user ID |
| thumbnail | TEXT | YES | | NULL | | Programme thumbnail URL |
| created_at | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updated_at | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX community_id (community_id)

**Foreign Keys:**
- community_id REFERENCES communities(id)

---

### 5. programme_modules
**Purpose:** Store learning units (modules) within programmes

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| programme_id | INT | NO | MUL | NULL | | FK to programmes.id |
| title | VARCHAR(255) | NO | | NULL | | Module title |
| status | VARCHAR(255) | NO | | 'active' | | Module status |
| order_number | INT | NO | | 0 | | Display order |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_programme_id (programme_id)

**Foreign Keys:**
- programme_id REFERENCES programmes(id)

---

### 6. module_lessons
**Purpose:** Store individual lessons within modules

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| module_id | INT | NO | MUL | NULL | | FK to programme_modules.id |
| name | VARCHAR(255) | YES | | NULL | | Lesson name |
| description | TEXT | YES | | NULL | | Lesson description |
| media | TEXT | YES | | NULL | | Media URL |
| text | TEXT | YES | | NULL | | Lesson text content |
| video_guid | VARCHAR(255) | YES | | NULL | | Video GUID for streaming |
| order_number | INT | NO | | NULL | | Display order |
| estimated_duration | INT | YES | | 0 | | Duration in minutes |
| is_required | BOOLEAN | NO | | TRUE | | Is lesson required |
| status | VARCHAR(100) | NO | | 'draft' | | Lesson status |
| type | VARCHAR(50) | NO | | 'video' | | Lesson type |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX module_id (module_id)

**Foreign Keys:**
- module_id REFERENCES programme_modules(id)

---

## Cohort Management

### 7. cohorts
**Purpose:** Store cohort information for programmes

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| programme_id | INT | NO | MUL | NULL | | FK to programmes.id |
| name | VARCHAR(255) | NO | | NULL | | Cohort name |
| enrollment_code | VARCHAR(50) | YES | UNI | NULL | | Unique enrollment code |
| start_date | DATE | YES | | NULL | | Cohort start date |
| end_date | DATE | YES | | NULL | | Cohort end date |
| status | VARCHAR(255) | NO | | 'active' | | Cohort status |
| max_members | INT | YES | | NULL | | Maximum members allowed |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_programme_id (programme_id)
- UNIQUE KEY idx_cohorts_enrollment_code (enrollment_code)

**Foreign Keys:**
- programme_id REFERENCES programmes(id)

---

### 8. cohort_members
**Purpose:** Track cohort membership

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| cohort_id | INT | NO | MUL | NULL | | FK to cohorts.id |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| status | VARCHAR(255) | YES | | NULL | | Membership status |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX cohort_id (cohort_id)
- INDEX user_id (user_id)

**Foreign Keys:**
- cohort_id REFERENCES cohorts(id)
- user_id REFERENCES users(id)

---

## WLIMP (Week-based Learning) System

### 9. weeks
**Purpose:** Store weekly structure for programmes

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | CHAR(36) | NO | PRI | NULL | UUID | Primary key (UUID) |
| programme_id | INT | NO | MUL | NULL | | FK to programmes.id |
| week_number | INT | NO | | NULL | | Week number |
| title | VARCHAR(255) | NO | | NULL | | Week title |
| start_date | DATE | NO | | NULL | | Week start date |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_weeks_programme_id (programme_id)
- UNIQUE KEY unique_programme_week (programme_id, week_number)

**Foreign Keys:**
- programme_id REFERENCES programmes(id)

---

### 10. lessons
**Purpose:** Store lessons within weeks (WLIMP system)

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | CHAR(36) | NO | PRI | NULL | UUID | Primary key (UUID) |
| week_id | CHAR(36) | NO | MUL | NULL | | FK to weeks.id |
| title | VARCHAR(255) | NO | | NULL | | Lesson title |
| description | TEXT | YES | | NULL | | Lesson description |
| content_type | VARCHAR(50) | NO | | NULL | | Content type |
| content_url | TEXT | NO | | NULL | | Content URL |
| order_index | INT | NO | | NULL | | Display order |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_lessons_week_id (week_id)

**Foreign Keys:**
- week_id REFERENCES weeks(id)

---

### 11. enrollments
**Purpose:** Track user enrollments in cohorts (WLIMP)

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | CHAR(36) | NO | PRI | NULL | UUID | Primary key (UUID) |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| cohort_id | INT | NO | MUL | NULL | | FK to cohorts.id |
| enrolled_at | DATETIME | NO | | CURRENT_TIMESTAMP | | Enrollment timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_enrollments_user_id (user_id)
- INDEX idx_enrollments_cohort_id (cohort_id)
- UNIQUE KEY unique_user_cohort (user_id, cohort_id)

**Foreign Keys:**
- cohort_id REFERENCES cohorts(id)

---

## Progress Tracking

### 12. lesson_progress
**Purpose:** Track individual lesson completion

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| lesson_id | INT | NO | MUL | NULL | | FK to module_lessons.id |
| cohort_id | INT | NO | MUL | NULL | | FK to cohorts.id |
| completed | BOOLEAN | NO | | FALSE | | Completion status |
| completed_at | DATETIME | YES | | NULL | | Completion timestamp |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY unique_user_lesson_cohort (user_id, lesson_id, cohort_id)

**Foreign Keys:**
- user_id REFERENCES users(id)
- lesson_id REFERENCES module_lessons(id)
- cohort_id REFERENCES cohorts(id)

---

### 13. programme_progress
**Purpose:** Track overall programme progress

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| programme_id | INT | NO | MUL | NULL | | FK to programmes.id |
| cohort_id | INT | NO | MUL | NULL | | FK to cohorts.id |
| total_lessons | INT | NO | | 0 | | Total lessons count |
| completed_lessons | INT | NO | | 0 | | Completed lessons count |
| completion_percentage | DECIMAL(5,2) | NO | | 0.00 | | Completion percentage |
| last_activity_at | DATETIME | YES | | NULL | | Last activity timestamp |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- user_id REFERENCES users(id)
- programme_id REFERENCES programmes(id)
- cohort_id REFERENCES cohorts(id)

---

## Scheduling

### 14. lesson_schedule
**Purpose:** Schedule live sessions and meetings

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| title | VARCHAR(255) | YES | | NULL | | Session title |
| meeting_link | VARCHAR(255) | YES | | NULL | | Meeting URL |
| cohort_id | INT | NO | MUL | NULL | | FK to cohorts.id |
| scheduled_date | DATE | NO | | NULL | | Session date |
| scheduled_time | TIME | YES | | NULL | | Session time |
| duration_minutes | INT | YES | | NULL | | Duration in minutes |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- cohort_id REFERENCES cohorts(id)

---

## Communication & Interaction

### 15. announcements
**Purpose:** Store programme/cohort announcements

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| programme_id | INT | YES | MUL | NULL | | FK to programmes.id |
| cohort_id | INT | YES | MUL | NULL | | FK to cohorts.id |
| title | VARCHAR(255) | NO | | NULL | | Announcement title |
| content | TEXT | NO | | NULL | | Announcement content |
| created_by | INT | NO | MUL | NULL | | FK to users.id |
| priority | ENUM('low','medium','high') | NO | | 'medium' | | Priority level |
| published_at | DATETIME | YES | | NULL | | Publication timestamp |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- programme_id REFERENCES programmes(id)
- cohort_id REFERENCES cohorts(id)
- created_by REFERENCES users(id)

---

### 16. announcement_comments
**Purpose:** Comments on announcements

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| announcement_id | INT | NO | MUL | NULL | | FK to announcements.id |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| comment_text | TEXT | NO | | NULL | | Comment content |
| parent_comment_id | INT | YES | MUL | NULL | | FK to announcement_comments.id |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- announcement_id REFERENCES announcements(id)
- user_id REFERENCES users(id)
- parent_comment_id REFERENCES announcement_comments(id)

---

### 17. discussions
**Purpose:** Store discussion threads

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| programme_id | INT | YES | MUL | NULL | | FK to programmes.id |
| cohort_id | INT | YES | MUL | NULL | | FK to cohorts.id |
| lesson_id | INT | YES | MUL | NULL | | FK to module_lessons.id |
| title | VARCHAR(255) | NO | | NULL | | Discussion title |
| description | TEXT | YES | | NULL | | Discussion description |
| created_by | INT | NO | MUL | NULL | | FK to users.id |
| is_pinned | BOOLEAN | NO | | FALSE | | Pin status |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- programme_id REFERENCES programmes(id)
- cohort_id REFERENCES cohorts(id)
- lesson_id REFERENCES module_lessons(id)
- created_by REFERENCES users(id)

---

### 18. discussion_comments
**Purpose:** Comments on discussions

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| discussion_id | INT | NO | MUL | NULL | | FK to discussions.id |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| comment_text | TEXT | NO | | NULL | | Comment content |
| parent_comment_id | INT | YES | MUL | NULL | | FK to discussion_comments.id |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- discussion_id REFERENCES discussions(id)
- user_id REFERENCES users(id)
- parent_comment_id REFERENCES discussion_comments(id)

---

### 19. lesson_comments
**Purpose:** Comments on lessons

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| lesson_id | INT | NO | MUL | NULL | | FK to module_lessons.id |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| cohort_id | INT | YES | MUL | NULL | | FK to cohorts.id |
| comment_text | TEXT | NO | | NULL | | Comment content |
| parent_comment_id | INT | YES | MUL | NULL | | FK to lesson_comments.id |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updatedAt | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- lesson_id REFERENCES module_lessons(id)
- user_id REFERENCES users(id)
- cohort_id REFERENCES cohorts(id)
- parent_comment_id REFERENCES lesson_comments(id)

---

## Activity Logging

### 20. activity_logs
**Purpose:** Track user activities and system events

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| programme_id | INT | YES | MUL | NULL | | FK to programmes.id |
| cohort_id | INT | YES | MUL | NULL | | FK to cohorts.id |
| action_type | ENUM('create','update','delete','enroll','complete','comment','announce') | NO | | NULL | | Action type |
| entity_type | ENUM('community','programme','cohort','module','lesson','member','discussion','announcement') | NO | | NULL | | Entity type |
| entity_id | INT | YES | | NULL | | Entity ID |
| description | TEXT | YES | | NULL | | Activity description |
| metadata | JSON | YES | | NULL | | Additional metadata |
| createdAt | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |

**Indexes:**
- PRIMARY KEY (id)

**Foreign Keys:**
- user_id REFERENCES users(id)
- programme_id REFERENCES programmes(id)
- cohort_id REFERENCES cohorts(id)

---

## Partner & Intent Management

### 21. programme_intents
**Purpose:** Store user programme creation intents

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| user_id | INT | NO | MUL | NULL | | FK to users.id |
| programme_type | VARCHAR(255) | NO | | NULL | | Programme type |
| expected_cohort_size | VARCHAR(100) | NO | | NULL | | Expected cohort size |
| programme_duration | VARCHAR(100) | NO | | NULL | | Programme duration |
| mode | VARCHAR(100) | NO | | NULL | | Delivery mode |
| created_at | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updated_at | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX user_id (user_id)

**Foreign Keys:**
- user_id REFERENCES users(id)

---

### 22. partner_contexts
**Purpose:** Store partner organization context

| Column | Type | Null | Key | Default | Extra | Description |
|--------|------|------|-----|---------|-------|-------------|
| id | INT | NO | PRI | NULL | AUTO_INCREMENT | Primary key |
| user_id | INT | NO | UNI | NULL | | FK to users.id |
| learner_types | JSON | YES | | NULL | | Types of learners |
| biggest_challenges | JSON | YES | | NULL | | Challenges faced |
| created_at | DATETIME | NO | | CURRENT_TIMESTAMP | | Record creation timestamp |
| updated_at | DATETIME | NO | | CURRENT_TIMESTAMP | ON UPDATE | Record update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY user_id (user_id)

**Foreign Keys:**
- user_id REFERENCES users(id)

---

## Database Relationships Summary

### Primary Relationships:
1. **users** → communities (owner_id)
2. **communities** → programmes (community_id)
3. **programmes** → cohorts (programme_id)
4. **programmes** → programme_modules (programme_id)
5. **programmes** → weeks (programme_id)
6. **programme_modules** → module_lessons (module_id)
7. **weeks** → lessons (week_id)
8. **cohorts** → enrollments (cohort_id)
9. **users** → enrollments (user_id)
10. **users** → lesson_progress (user_id)
11. **module_lessons** → lesson_progress (lesson_id)

### Total Tables: 22

---

## Notes for phpMyAdmin Setup:

1. **Character Set:** Use `utf8mb4` with collation `utf8mb4_unicode_ci`
2. **Storage Engine:** InnoDB (for foreign key support)
3. **UUID Fields:** Use CHAR(36) for UUID storage
4. **JSON Fields:** Requires MySQL 5.7.8+ or MariaDB 10.2.7+
5. **ENUM Fields:** Ensure values match exactly as specified
6. **Timestamps:** Use DATETIME with DEFAULT CURRENT_TIMESTAMP
7. **Foreign Keys:** Enable ON DELETE CASCADE or ON DELETE SET NULL as appropriate

---

**Generated:** 2026-02-25
**Version:** 1.0
**Database:** cohortle_api
