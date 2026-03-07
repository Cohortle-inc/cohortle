-- Get all registered users with their roles
-- Run this query in your database management tool (phpMyAdmin, MySQL Workbench, etc.)

-- All users with details
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(r.name, 'unassigned') as role,
    DATE_FORMAT(u.joined_at, '%Y-%m-%d %H:%i:%s') as joined_date,
    u.status
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
ORDER BY u.joined_at DESC;

-- Summary by role
SELECT 
    COALESCE(r.name, 'unassigned') as role,
    COUNT(*) as count
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
GROUP BY r.name
ORDER BY count DESC;

-- Students only
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    DATE_FORMAT(u.joined_at, '%Y-%m-%d') as joined_date
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'student'
ORDER BY u.joined_at DESC;

-- Conveners only
SELECT 
    u.id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    DATE_FORMAT(u.joined_at, '%Y-%m-%d') as joined_date
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'convener'
ORDER BY u.joined_at DESC;

-- Email list for students (comma-separated)
SELECT GROUP_CONCAT(u.email SEPARATOR ', ') as student_emails
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'student';

-- Email list for conveners (comma-separated)
SELECT GROUP_CONCAT(u.email SEPARATOR ', ') as convener_emails
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE r.name = 'convener';
