# Network Status Setup

## Installation Required

To enable network status detection, install the following package:

```bash
npx expo install @react-native-community/netinfo
```

## What's Implemented

### 1. Network Status Hook (`hooks/useNetworkStatus.ts`)
- Tracks real-time network connectivity
- Uses @react-native-community/netinfo
- Returns connection state, internet reachability, and connection type

### 2. Offline Banner (`components/ui/OfflineBanner.tsx`)
- Displays when device is offline
- Shows message: "You're offline. Changes will sync when reconnected."
- Automatically hides when connection restored

### 3. Integration with Submission Form
- Offline banner displayed at top of form
- Prevents submission when offline
- Shows warning message to connect to internet
- Draft saving continues to work offline

## Usage

The network status hook can be used in any component:

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const MyComponent = () => {
  const { isConnected, isInternetReachable, type } = useNetworkStatus();
  
  if (!isConnected) {
    // Handle offline state
  }
  
  return <View>...</View>;
};
```

## Next Steps

After installing the package:
1. Run `npx expo prebuild` to configure native modules
2. Rebuild the app for iOS/Android
3. Test offline functionality by toggling airplane mode
