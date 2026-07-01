-- Manual Migration: Add type column to module_lessons
-- Run this directly on your database at db.cohortle.com
-- Date: 2026-02-18

-- Select the database (replace 'your_database_name' with your actual database name)
USE your_database_name;

-- Step 1: Check if column already exists (optional check)
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'module_lessons' 
AND COLUMN_NAME = 'type';

-- Step 2: Add the type column
ALTER TABLE module_lessons 
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'video';

-- Step 3: Add index for performance
CREATE INDEX idx_module_lessons_type ON module_lessons(type);

-- Step 4: Verify the column was added
DESCRIBE module_lessons;

-- Step 5: Update the SequelizeMeta table to mark migration as complete
-- (This prevents Sequelize from trying to run it again)
INSERT INTO SequelizeMeta (name) 
VALUES ('20260218000000-add-type-to-module-lessons.js');

-- Done! The migration is now complete.
