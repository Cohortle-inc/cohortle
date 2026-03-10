-- SQL to check users table structure and role system
-- Run this in phpMyAdmin or MySQL client

-- 1. Check users table structure
DESCRIBE users;

-- 2. Check if users have role_id column (old system)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cohortle'
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('role', 'role_id');

-- 3. Check sample users with their roles
SELECT 
    u.id,
    u.email,
    u.role_id as direct_role_id,
    r1.name as direct_role_name,
    ura.role_id as assigned_role_id,
    r2.name as assigned_role_name
FROM users u
LEFT JOIN roles r1 ON u.role_id = r1.id
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r2 ON ura.role_id = r2.id
WHERE u.email LIKE '%@%'
ORDER BY u.id
LIMIT 20;

-- 4. Check for users with mismatched roles
SELECT 
    u.id,
    u.email,
    r1.name as direct_role,
    r2.name as assigned_role,
    CASE 
        WHEN r1.name IS NULL AND r2.name IS NULL THEN 'NO_ROLE'
        WHEN r1.name IS NULL THEN 'ONLY_ASSIGNED'
        WHEN r2.name IS NULL THEN 'ONLY_DIRECT'
        WHEN r1.name != r2.name THEN 'MISMATCH'
        ELSE 'MATCH'
    END as status
FROM users u
LEFT JOIN roles r1 ON u.role_id = r1.id
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN roles r2 ON ura.role_id = r2.id
WHERE r1.name IS NULL OR r2.name IS NULL OR r1.name != r2.name
ORDER BY u.id;
