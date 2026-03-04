@echo off
echo ========================================
echo FIXING BUILD ISSUES AND STARTING BUILD
echo ========================================
echo.

cd cohortz

echo Step 1: Removing native folders to allow prebuild...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios
echo Native folders removed.
echo.

echo Step 2: Creating .easignore to reduce build size...
(
echo # Exclude unnecessary files from EAS build
echo __tests__/
echo .git/
echo .idea/
echo .vscode/
echo node_modules/
echo *.md
echo .eslintrc.js
echo .prettierrc
echo jest.config.js
echo tsconfig.json
) > .easignore
echo .easignore created.
echo.

echo Step 3: Starting EAS build in background...
echo This will continue even if you close this window.
start /B cmd /c "eas build --platform android --profile preview --non-interactive > build_output.log 2>&1"
echo.
echo ========================================
echo BUILD STARTED IN BACKGROUND
echo ========================================
echo.
echo The build is now running in the cloud.
echo You can close this window - the build will continue.
echo.
echo To check build status:
echo 1. Go to https://expo.dev/accounts/thetrueseeker/projects/cohortz/builds
echo 2. Or run: eas build:list
echo.
echo Build output is being saved to: cohortz\build_output.log
echo.
pause
