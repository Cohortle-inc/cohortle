@echo off
echo ========================================
echo   COHORTLE - BUILD ANDROID APK
echo ========================================
echo.

echo Step 1: Installing EAS CLI...
call npm install -g eas-cli
if errorlevel 1 (
    echo ERROR: Failed to install EAS CLI
    pause
    exit /b 1
)
echo ✓ EAS CLI installed
echo.

echo Step 2: Logging in to Expo...
echo (You'll need to create a free account at expo.dev if you don't have one)
call eas login
if errorlevel 1 (
    echo ERROR: Login failed
    pause
    exit /b 1
)
echo ✓ Logged in successfully
echo.

echo Step 3: Building APK...
cd cohortz
call eas build --platform android --profile preview
if errorlevel 1 (
    echo ERROR: Build failed
    echo Check the EAS dashboard for logs
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD STARTED!
echo ========================================
echo.
echo The build is running in the cloud.
echo This will take 10-20 minutes.
echo.
echo You'll receive a link to download your APK when it's ready.
echo.
echo Check your email or the EAS dashboard at:
echo https://expo.dev/accounts/[your-account]/projects/cohortle/builds
echo.
pause
