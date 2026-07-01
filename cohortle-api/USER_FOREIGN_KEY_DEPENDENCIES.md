# User Foreign Key Dependencies

This document lists all tables that have foreign key constraints referencing the `users` table, organized by dependency level.

## Direct User Dependencies (user_id → users.id)

These tables directly reference users and must be deleted before users can be deleted:

1. **user_role_assignments** - User role assignments
2. **role_assignment_history** - History of role changes
3. **verification_tokens** - Email verification tokens
4. **user_achievements** - User achievements/badges
5. **user_preferences** - User preference settings
6. **preferences** - Alternative preferences table (if exists)
7. **lesson_completions** - Completed lessons
8. **lesson_comments** - Comments on lessons
9. **cohort_posts** - Posts in cohort communities
10. **post_comments** - Comments on posts
11. **post_likes** - Likes on posts
12. **enrollments** - Programme enrollments
13. **programme_progress** - Programme progress tracking
14. **programme_intents** - User programme intentions
15. **learning_goals** - User learning goals
16. **lessonProgress** - Lesson progress (alternative table)
17. **cohort_members** - Cohort membership
18. **community_members** - Community membership
19. **communities** - Communities created by users
20. **discussions** - Discussion threads
21. **discussion_comments** - Comments on discussions
22. **announcements** - Announcements
23. **announcement_comments** - Comments on announcements
24. **activity_logs** - User activity logs
25. **partner_contexts** - Partner context data
26. **role_permissions** - Custom role permissions (created_by)

## Indirect Dependencies via Programmes

These tables reference programmes, which are created by users (programmes.created_by → users.id):

1. **programme_modules** - Learning units in programmes
2. **cohorts** - Programme cohorts
3. **weeks** - Programme weeks (if exists)
4. **lessons** - Programme lessons (if exists)

## Indirect Dependencies via Cohorts

These tables reference cohorts, which belong to programmes:

1. **cohort_members** - Members of cohorts
2. **cohort_posts** - Posts in cohort communities

## Indirect Dependencies via Modules

These tables reference programme_modules:

1. **module_lessons** - Lessons within modules

## Deletion Order

To safely delete users, data must be deleted in this order:

### Phase 1: Programme-Related Data (for programmes created by test users)
1. module_lessons (via programme_modules)
2. programme_modules
3. cohort_members (via cohorts)
4. cohorts
5. weeks (if exists)
6. lessons (if exists)
7. programmes

### Phase 2: Direct User Data
1. user_role_assignments
2. role_assignment_history
3. enrollments
4. lesson_completions
5. lesson_comments
6. cohort_posts
7. post_comments
8. post_likes (if exists)
9. user_preferences
10. preferences (if exists)
11. verification_tokens
12. user_achievements (if exists)
13. learning_goals (if exists)
14. lessonProgress (if exists)
15. programme_progress (if exists)
16. programme_intents (if exists)
17. community_members (if exists)
18. communities (if exists)
19. discussions (if exists)
20. discussion_comments (if exists)
21. announcements (if exists)
22. announcement_comments (if exists)
23. activity_logs (if exists)
24. partner_contexts (if exists)

### Phase 3: Users
1. users

## Notes

- Tables marked "(if exists)" are checked for existence before deletion
- All deletions are wrapped in a transaction for safety
- Only test users are deleted; protected users (testaconvener@cohortle.com, wecarefng@gmail.com) are preserved
