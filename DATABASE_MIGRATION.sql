-- ============================================
-- Lesson Type Selection Feature - Database Migration
-- ============================================
-- This script adds support for lesson types to the lessons table
-- Run this on your production/staging database

-- ============================================
-- STEP 1: Add the type column
-- ============================================
-- This adds a new 'type' column with a default value of 'video'
-- for backward compatibility with existing lessons

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'video';

-- ============================================
-- STEP 2: Update existing lessons (optional)
-- ============================================
-- Set all existing lessons to type 'video' if they don't have a type
-- This ensures consistency for lessons created before this migration

UPDATE lessons 
SET type = 'video' 
WHERE type IS NULL OR type = '';

-- ============================================
-- STEP 3: Add index for performance (optional but recommended)
-- ============================================
-- This improves query performance when filtering lessons by type

CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);

-- ============================================
-- STEP 4: Add constraint for data integrity (optional)
-- ============================================
-- This ensures only valid lesson types can be stored
-- Comment out if you want more flexibility

ALTER TABLE lessons
ADD CONSTRAINT IF NOT EXISTS check_lesson_type 
CHECK (type IN (
  'text',           -- Text-based lesson with rich content
  'video',          -- Video lesson (default)
  'pdf',            -- PDF document lesson
  'live_session',   -- Scheduled live session
  'link',           -- External link/resource
  'assignment',     -- Assignment for students
  'quiz',           -- Quiz with questions
  'form',           -- Form or survey
  'reflection',     -- Reflection prompt
  'practical_task'  -- Practical task with file submission
));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration was successful

-- Check if the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'lessons' AND column_name = 'type';

-- Check if the index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'lessons' AND indexname = 'idx_lessons_type';

-- Check if the constraint was added
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'lessons' AND constraint_name = 'check_lesson_type';

-- Count lessons by type
SELECT type, COUNT(*) as count 
FROM lessons 
GROUP BY type 
ORDER BY count DESC;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- Run this if you need to undo the migration

/*
-- Remove constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS check_lesson_type;

-- Remove index
DROP INDEX IF EXISTS idx_lessons_type;

-- Remove column (WARNING: This will delete all type data)
ALTER TABLE lessons DROP COLUMN IF EXISTS type;
*/

-- ============================================
-- NOTES
-- ============================================
-- 1. This migration is backward compatible
-- 2. Existing lessons will default to type 'video'
-- 3. The constraint can be removed if you need more flexibility
-- 4. The index improves performance but is optional
-- 5. Test this on a staging database first!
