@echo off
echo ========================================
echo CHECKING BUILD STATUS
echo ========================================
echo.

cd cohortz
eas build:list --platform android --limit 5

echo.
echo ========================================
echo.
echo To see more details, visit:
echo https://expo.dev/accounts/thetrueseeker/projects/cohortz/builds
echo.
pause
