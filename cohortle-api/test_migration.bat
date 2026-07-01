@echo off
echo ========================================
echo Testing Post Visibility Migration
echo ========================================
echo.

cd /d "%~dp0"
node test_post_migration.js

echo.
echo ========================================
echo Test Complete
echo ========================================
pause
