# Cohortle App Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **npm** or **yarn** (comes with Node.js)
   - Verify: `npm --version` or `yarn --version`

3. **Expo CLI**
   - Install globally: `npm install -g expo-cli`
   - Or use: `npx expo` (no global install needed)

4. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

### For iOS Testing (Mac only)

5. **Xcode** (latest version)
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`

6. **iOS Simulator** (comes with Xcode)
   - Open Xcode → Preferences → Components → Download simulators

### For Android Testing

7. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK and emulator

8. **Java Development Kit (JDK)**
   - Required for Android builds
   - Download from: https://www.oracle.com/java/technologies/downloads/

### For Physical Device Testing

9. **Expo Go App**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

## Step 1: Install Dependencies

Navigate to the cohortz directory and install dependencies:

```bash
cd cohortz
npm install
```

Or if using yarn:

```bash
cd cohortz
yarn install
```

## Step 2: Install Missing Dependencies

The Assignment Submission System requires one additional package that needs to be installed:

```bash
# Install network status detection library
npx expo install @react-native-community/netinfo
```

This package is required for offline support features.

## Step 3: Configure Environment Variables

Create a `.env` file in the `cohortz` directory:

```bash
# In cohortz directory
touch .env
```

Add the following environment variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.cohortle.com
EXPO_PUBLIC_API_BASE_URL=https://api.cohortle.com

# Add any other environment variables your backend requires
```

**Note:** Replace `https://api.cohortle.com` with your actual backend API URL.

## Step 4: Prebuild Native Modules (Required for Network Status)

Since we added `@react-native-community/netinfo`, you need to prebuild:

```bash
npx expo prebuild
```

This generates the native iOS and Android projects with the required native modules.

## Step 5: Start the Development Server

### Option A: Start with Expo Go (Easiest)

```bash
npm start
# or
npx expo start
```

Then:
- Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)
- The app will load on your physical device

### Option B: Start with iOS Simulator (Mac only)

```bash
npm run ios
# or
npx expo run:ios
```

### Option C: Start with Android Emulator

```bash
npm run android
# or
npx expo run:android
```

**Note:** Make sure you have an Android emulator running before executing this command.

## Step 6: Verify Installation

Once the app starts, verify that:

1. ✅ App loads without errors
2. ✅ You can navigate to the login screen
3. ✅ No red error screens appear

## Testing the Assignment Submission System

### Prerequisites for Testing

1. **Backend API must be running** with assignment endpoints
2. **User accounts** (both student and convener roles)
3. **Existing lessons** in the system to attach assignments to

### Test as Convener

1. **Login** as a convener user
2. **Navigate to a lesson** in your course
3. **Create an assignment:**
   - Look for the assignment indicator/button on the lesson screen
   - Fill in title, instructions, and due date
   - Submit the form
4. **View submissions:**
   - Navigate back to the assignment
   - See the list of enrolled students
   - Check submission status for each student
5. **Grade a submission:**
   - Click on a submitted assignment
   - Select Pass/Fail
   - Add optional feedback
   - Submit the grade

### Test as Student

1. **Login** as a student user
2. **View assignments:**
   - Navigate to the assignments screen
   - See all your assignments across cohorts
   - Filter by status (All, Pending, Passed, Failed)
3. **Submit an assignment:**
   - Click on an assignment
   - Enter text answer and/or upload files
   - Watch for auto-save indicator
   - Submit the assignment
4. **View grade:**
   - Return to the assignment after it's graded
   - See your grade (Passed/Failed) and feedback

### Test Offline Features

1. **Enable airplane mode** on your device
2. **Try to submit an assignment** - should queue for later
3. **Disable airplane mode** - submission should sync automatically
4. **Watch for:**
   - Offline banner at top of screen
   - Pending operations indicator
   - Sync notifications when reconnected

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
# or
yarn install
```

#### 2. Metro bundler issues

**Solution:**
```bash
# Clear Metro cache
npx expo start --clear
```

#### 3. Native module errors

**Solution:**
```bash
# Rebuild native modules
npx expo prebuild --clean
```

#### 4. iOS build fails

**Solution:**
```bash
# Clean iOS build
cd ios
pod install
cd ..
npx expo run:ios
```

#### 5. Android build fails

**Solution:**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

#### 6. "API URL not configured" error

**Solution:**
- Check that `.env` file exists in `cohortz` directory
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Restart the development server after changing `.env`

#### 7. Network status not working

**Solution:**
```bash
# Reinstall netinfo
npx expo install @react-native-community/netinfo
npx expo prebuild --clean
```

### Getting Logs

#### View console logs:
```bash
# In the terminal where expo is running
# Press 'j' to open debugger
# Or check the terminal output directly
```

#### View device logs:

**iOS:**
```bash
# Open Console.app on Mac
# Select your device or simulator
# Filter by "Expo" or "Cohortle"
```

**Android:**
```bash
# Use Android Studio Logcat
# Or use adb:
adb logcat | grep -i expo
```

## Development Workflow

### Hot Reload

The app supports hot reload - changes to most files will automatically refresh:
- Save a file
- Watch the app reload automatically
- No need to restart the server

### Debugging

1. **React Native Debugger:**
   - Press `j` in the terminal to open debugger
   - Or shake device and select "Debug"

2. **React Query Devtools:**
   - Already configured in the app
   - View cache state and query status
   - Monitor API calls

3. **Network Inspection:**
   - Use React Native Debugger's Network tab
   - Or use Flipper for advanced debugging

## Running Tests

### Run all tests:
```bash
npm test
# or
yarn test
```

### Run specific test file:
```bash
npm test -- fileValidation.test.ts
```

### Run property-based tests:
```bash
npm test -- --testPathPattern=pbt
```

**Note:** Property-based tests may take longer to run (30-50 iterations each).

## Project Structure

```
cohortz/
├── api/                          # API layer
│   ├── assignments/              # Assignment API functions
│   └── submissions/              # Submission API functions
├── app/                          # Expo Router screens
│   ├── student-screens/          # Student views
│   └── convener-screens/         # Convener views
├── components/                   # React components
│   ├── assignments/              # Assignment-specific components
│   └── ui/                       # Shared UI components
├── hooks/                        # Custom React hooks
│   ├── api/                      # TanStack Query hooks
│   ├── useNetworkStatus.ts      # Network status detection
│   └── useOfflineQueue.ts       # Offline queue processing
├── utils/                        # Utility functions
│   ├── draftManager.ts           # Draft persistence
│   ├── fileValidation.ts         # File validation
│   └── offlineQueue.ts           # Offline queue management
├── types/                        # TypeScript type definitions
├── __tests__/                    # Test files
└── .env                          # Environment variables (create this)
```

## Key Features to Test

### 1. Assignment Creation (Convener)
- ✅ Create assignment with title, instructions, due date
- ✅ Edit existing assignment
- ✅ Delete assignment with confirmation
- ✅ View assignment statistics

### 2. Assignment Submission (Student)
- ✅ View all assignments across cohorts
- ✅ Filter assignments by status
- ✅ Submit text answer
- ✅ Upload multiple files (PDF, PNG, JPG, DOC, DOCX)
- ✅ Auto-save drafts every 30 seconds
- ✅ Manual save draft
- ✅ Submit before due date

### 3. Grading (Convener)
- ✅ View all submissions for an assignment
- ✅ Filter submissions by status
- ✅ Grade submission (Pass/Fail)
- ✅ Add feedback
- ✅ Re-grade if needed
- ✅ Download submissions

### 4. Offline Support
- ✅ Offline banner when disconnected
- ✅ Queue submissions when offline
- ✅ Auto-sync when reconnected
- ✅ Pending operations indicator
- ✅ Draft persistence

### 5. Error Handling
- ✅ Error boundaries catch crashes
- ✅ User-friendly error messages
- ✅ Retry failed operations
- ✅ Validation errors displayed clearly

### 6. Performance
- ✅ Instant navigation with cached data
- ✅ Optimistic updates
- ✅ Reduced API calls
- ✅ Smooth scrolling in lists

## Next Steps

1. **Start the app** using one of the methods above
2. **Login** with test credentials
3. **Test the assignment workflow** as both convener and student
4. **Test offline features** by toggling airplane mode
5. **Report any issues** you encounter

## Additional Resources

- **Expo Documentation:** https://docs.expo.dev/
- **React Native Documentation:** https://reactnative.dev/
- **TanStack Query Documentation:** https://tanstack.com/query/latest
- **Assignment System Spec:** `.kiro/specs/assignment-submission-system/`

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Check that all environment variables are set correctly
4. Verify the backend API is running and accessible
5. Try clearing cache and rebuilding: `npx expo start --clear`

## Summary

You're now ready to test the Assignment Submission System! The key steps are:

1. ✅ Install dependencies: `npm install`
2. ✅ Install netinfo: `npx expo install @react-native-community/netinfo`
3. ✅ Prebuild: `npx expo prebuild`
4. ✅ Configure `.env` file with API URL
5. ✅ Start the app: `npm start` or `npm run ios/android`
6. ✅ Test as both convener and student
7. ✅ Test offline features

Happy testing! 🚀
