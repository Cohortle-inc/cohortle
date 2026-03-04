@echo off
echo ========================================
echo   STARTING CLOUD BUILD
echo ========================================
echo.
echo Starting build in the cloud...
echo You can close this window and your laptop after the build starts!
echo.

cd cohortz
start cmd /k "eas build --platform android --profile preview --non-interactive"

echo.
echo ========================================
echo   BUILD STARTED IN CLOUD!
echo ========================================
echo.
echo The build is now running on Expo's servers.
echo You can safely:
echo   - Close this window
echo   - Close your laptop
echo   - Turn off your computer
echo.
echo To check build status later:
echo   1. Go to: https://expo.dev/accounts/thetrueseeker/projects/cohortz/builds
echo   2. Or run: eas build:list
echo.
echo You'll receive an email when the build is complete!
echo.
pause
