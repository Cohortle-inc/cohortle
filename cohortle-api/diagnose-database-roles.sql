-- ============================================================
-- DATABASE ROLE SYSTEM DIAGNOSTIC SCRIPT (SQL)
-- ============================================================
-- This script checks the integrity of the role system
-- Run this directly in your database client (MySQL/MariaDB)
-- ============================================================

-- Test 1: Check roles table
SELECT '=== Test 1: Roles Table ===' AS test;
SELECT role_id, name, description FROM roles;

-- Test 2: Total users count
SELECT '=== Test 2: Total Users ===' AS test;
SELECT COUNT(*) AS total_users FROM users;

-- Test 3: Users with active role assignments (last 10)
SELECT '=== Test 3: Users with Active Role Assignments ===' AS test;
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  r.name AS role,
  ura.assigned_at,
  ura.status
FROM users u
INNER JOIN user_role_assignments ura ON u.id = ura.user_id
INNER JOIN roles r ON ura.role_id = r.role_id
WHERE ura.status = 'active'
ORDER BY u.id DESC
LIMIT 10;

-- Test 4: Users WITHOUT role assignments
SELECT '=== Test 4: Users WITHOUT Role Assignments ===' AS test;
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL
ORDER BY u.id DESC;

-- Test 5: Role distribution
SELECT '=== Test 5: Role Distribution ===' AS test;
SELECT 
  r.name AS role,
  COUNT(ura.id) AS user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name
ORDER BY user_count DESC;

-- Test 6: Duplicate active role assignments
SELECT '=== Test 6: Duplicate Active Role Assignments ===' AS test;
SELECT 
  ura.user_id,
  u.email,
  COUNT(*) AS assignment_count
FROM user_role_assignments ura
INNER JOIN users u ON ura.user_id = u.id
WHERE ura.status = 'active'
GROUP BY ura.user_id, u.email
HAVING COUNT(*) > 1;

-- Test 7: Recent registrations (last 10)
SELECT '=== Test 7: Recent Registrations ===' AS test;
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at,
  r.name AS role,
  ura.assigned_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
LEFT JOIN roles r ON ura.role_id = r.role_id
ORDER BY u.created_at DESC
LIMIT 10;

-- Test 8: Email verification status
SELECT '=== Test 8: Email Verification Status ===' AS test;
SELECT 
  CASE 
    WHEN email_verified = 1 THEN 'Verified'
    ELSE 'Not Verified'
  END AS verification_status,
  COUNT(*) AS user_count
FROM users
GROUP BY email_verified;

-- Test 9: Check old role_id column (if exists)
SELECT '=== Test 9: Old role_id Column Check ===' AS test;
SELECT 
  id,
  email,
  role_id
FROM users
WHERE role_id IS NOT NULL
LIMIT 10;

-- Test 10: Referential integrity - invalid role_id foreign keys
SELECT '=== Test 10: Orphaned role_id Foreign Keys ===' AS test;
SELECT 
  ura.id AS assignment_id,
  ura.user_id,
  ura.role_id,
  ura.status
FROM user_role_assignments ura
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE r.role_id IS NULL;

-- Test 11: Referential integrity - invalid user_id foreign keys
SELECT '=== Test 11: Orphaned user_id Foreign Keys ===' AS test;
SELECT 
  ura.id AS assignment_id,
  ura.user_id,
  ura.role_id,
  ura.status
FROM user_role_assignments ura
LEFT JOIN users u ON ura.user_id = u.id
WHERE u.id IS NULL;

-- Test 12: Inactive role assignments
SELECT '=== Test 12: Inactive Role Assignments ===' AS test;
SELECT 
  u.id,
  u.email,
  r.name AS role,
  ura.status,
  ura.assigned_at
FROM user_role_assignments ura
INNER JOIN users u ON ura.user_id = u.id
INNER JOIN roles r ON ura.role_id = r.role_id
WHERE ura.status = 'inactive'
ORDER BY ura.assigned_at DESC
LIMIT 10;

-- Test 13: Role assignment timing (delayed assignments)
SELECT '=== Test 13: Delayed Role Assignments (>5 seconds) ===' AS test;
SELECT 
  u.id,
  u.email,
  u.created_at AS user_created,
  ura.assigned_at AS role_assigned,
  TIMESTAMPDIFF(SECOND, u.created_at, ura.assigned_at) AS delay_seconds
FROM users u
INNER JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE TIMESTAMPDIFF(SECOND, u.created_at, ura.assigned_at) > 5
ORDER BY delay_seconds DESC
LIMIT 10;

-- ============================================================
-- SUMMARY QUERIES
-- ============================================================

SELECT '=== SUMMARY ===' AS summary;

-- Count summary
SELECT 
  'Total Users' AS metric,
  COUNT(*) AS count
FROM users
UNION ALL
SELECT 
  'Users with Active Roles' AS metric,
  COUNT(DISTINCT ura.user_id) AS count
FROM user_role_assignments ura
WHERE ura.status = 'active'
UNION ALL
SELECT 
  'Users without Roles' AS metric,
  COUNT(*) AS count
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL
UNION ALL
SELECT 
  'Duplicate Active Assignments' AS metric,
  COUNT(*) AS count
FROM (
  SELECT user_id
  FROM user_role_assignments
  WHERE status = 'active'
  GROUP BY user_id
  HAVING COUNT(*) > 1
) AS duplicates
UNION ALL
SELECT 
  'Orphaned role_id FKs' AS metric,
  COUNT(*) AS count
FROM user_role_assignments ura
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE r.role_id IS NULL
UNION ALL
SELECT 
  'Orphaned user_id FKs' AS metric,
  COUNT(*) AS count
FROM user_role_assignments ura
LEFT JOIN users u ON ura.user_id = u.id
WHERE u.id IS NULL;

-- ============================================================
-- END OF DIAGNOSTIC SCRIPT
-- ============================================================
