@echo off
echo ========================================
echo QUICK FIX FOR BUILD ISSUES
echo ========================================
echo.

cd cohortz

echo Removing native folders...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios
echo Done!
echo.

echo Creating .easignore...
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
echo Done!
echo.

echo ========================================
echo FIXES APPLIED
echo ========================================
echo.
echo Next steps:
echo 1. Run: cd cohortz
echo 2. Run: eas build --platform android --profile preview --non-interactive
echo.
echo Or just run: FIX_AND_BUILD.bat
echo.
pause
