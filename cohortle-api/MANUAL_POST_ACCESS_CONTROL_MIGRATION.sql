-- ============================================================================
-- Community Post Access Control Migration
-- Run this in phpMyAdmin at db.cohortle.com
-- ============================================================================

-- Step 1: Add visibility_scope column with ENUM type
ALTER TABLE posts 
ADD COLUMN visibility_scope ENUM('community', 'cohort') NOT NULL DEFAULT 'community'
COMMENT 'Determines if post is visible to entire community or specific cohort';

-- Step 2: Add cohort_id column as nullable foreign key
ALTER TABLE posts 
ADD COLUMN cohort_id INT NULL
COMMENT 'Cohort ID when visibility_scope is cohort';

-- Step 3: Add foreign key constraint
ALTER TABLE posts
ADD CONSTRAINT fk_posts_cohort 
FOREIGN KEY (cohort_id) REFERENCES cohorts(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX idx_posts_visibility_scope ON posts(visibility_scope);
CREATE INDEX idx_posts_cohort_id ON posts(cohort_id);
CREATE INDEX idx_posts_community_cohort ON posts(visibility_scope, community_ids(100), cohort_id);

-- Step 5: Verify the migration
-- Run these queries to check everything worked:

-- Check new columns exist
DESCRIBE posts;

-- Check existing posts have default values
SELECT id, visibility_scope, cohort_id, community_ids 
FROM posts 
LIMIT 10;
-- All should have visibility_scope='community' and cohort_id=NULL

-- Check indexes were created
SHOW INDEX FROM posts WHERE Key_name LIKE 'idx_posts%';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment and run these if you need to undo the migration:

-- DROP INDEX idx_posts_community_cohort ON posts;
-- DROP INDEX idx_posts_cohort_id ON posts;
-- DROP INDEX idx_posts_visibility_scope ON posts;
-- ALTER TABLE posts DROP FOREIGN KEY fk_posts_cohort;
-- ALTER TABLE posts DROP COLUMN cohort_id;
-- ALTER TABLE posts DROP COLUMN visibility_scope;
