# Design Document: Learner Join Flow Fix

## Overview

This design addresses the bug where learners successfully join a community but remain stuck on the "Join Community" screen. The root cause is a combination of missing state persistence, improper navigation handling, and inadequate response data from the backend. The fix involves enhancing the backend response, implementing proper state management with AsyncStorage, and ensuring automatic navigation after successful join operations.

## Architecture

The join flow follows a client-server architecture with three key layers:

1. **Backend API Layer**: Handles join requests, validates community codes, creates membership records, and returns complete membership data
2. **Frontend State Layer**: Manages membership state using React Query for server state and AsyncStorage for persistence
3. **Frontend UI Layer**: Displays join interface, handles user input, and navigates to appropriate screens based on membership status

### Data Flow

```
User enters code → Frontend validates input → API call to /communities/join
→ Backend creates community_members record → Returns membership data
→ Frontend stores in AsyncStorage → Invalidates query cache → Navigates to dashboard
```

## Components and Interfaces

### Backend Components

#### 1. Join Community Endpoint Enhancement

**Location**: `cohortle-api/routes/community.js`

**Current Behavior**: Returns minimal data (community_id and message)

**Enhanced Response Structure**:
```javascript
{
  error: false,
  message: "Joined community successfully",
  data: {
    community_id: number,
    community_name: string,
    community_description: string,
    membership: {
      id: number,
      user_id: number,
      community_id: number,
      status: 'active' | 'pending',
      role: 'learner' | 'instructor',
      created_at: timestamp
    },
    programme_count: number
  }
}
```

**Changes Required**:
- After inserting community_members record, fetch the complete community details
- Include community name, description, and programme count in response
- Return the created membership record with all fields
- For "already a member" case, return the same structure with existing membership data

#### 2. Membership Validation Helper

**New Function**: `getMembershipData(community_id, user_id)`

**Purpose**: Retrieve complete membership and community data for validation

**Returns**:
```javascript
{
  membership: { id, user_id, community_id, status, role, created_at },
  community: { id, name, description, programme_count }
}
```

### Frontend Components

#### 1. Enhanced useJoinCommunity Hook

**Location**: `cohortz/hooks/api/useJoinCommunity.ts`

**Current Issues**:
- Only invalidates cache, doesn't handle navigation
- Doesn't persist membership data
- Shows generic error for "already a member" case

**Enhanced Implementation**:
```typescript
interface JoinResponse {
  error: boolean;
  message: string;
  data: {
    community_id: number;
    community_name: string;
    community_description: string;
    membership: {
      id: number;
      user_id: number;
      community_id: number;
      status: string;
      role: string;
      created_at: string;
    };
    programme_count: number;
  };
}

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: async (response: JoinResponse) => {
      // Store membership data in AsyncStorage
      await storeMembershipData(response.data);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['learnerCohorts'] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      
      // Navigate to dashboard
      navigateToDashboard(response.data);
      
      // Show success message
      Alert.alert('Success', `Welcome to ${response.data.community_name}!`);
    },
    onError: (error: any) => {
      // Handle "already a member" as success
      if (error.message.includes('already a member')) {
        handleAlreadyMember(error);
      } else {
        Alert.alert('Error', error.message);
      }
    },
  });
};
```

#### 2. Membership Storage Manager

**New File**: `cohortz/utils/membershipStorage.ts`

**Purpose**: Centralize AsyncStorage operations for membership data

**Functions**:

```typescript
// Store membership data for a community
async function storeMembershipData(data: MembershipData): Promise<void>

// Retrieve membership data for a specific community
async function getMembershipData(communityId: string): Promise<MembershipData | null>

// Retrieve all stored memberships
async function getAllMemberships(): Promise<MembershipData[]>

// Remove membership data (for leave community)
async function removeMembershipData(communityId: string): Promise<void>

// Check if user is member of a community
async function isMemberOfCommunity(communityId: string): Promise<boolean>
```

**Storage Key Format**: `membership_${communityId}`

#### 3. Navigation Helper

**New File**: `cohortz/utils/joinFlowNavigation.ts`

**Purpose**: Handle navigation logic after join operations

**Functions**:

```typescript
// Navigate to programme dashboard with proper params
async function navigateToDashboard(data: MembershipData): Promise<void> {
  await AsyncStorage.setItem('communityID', String(data.community_id));
  await AsyncStorage.setItem('communityName', data.community_name);
  await AsyncStorage.setItem('description', data.community_description);
  
  router.push({
    pathname: '/student-screens/cohorts/programmes',
    params: { communityID: data.community_id }
  });
}

// Handle "already a member" scenario
async function handleAlreadyMember(communityCode: string): Promise<void> {
  // Fetch membership data from backend
  // Store in AsyncStorage
  // Navigate to dashboard
}
```

#### 4. Enhanced Cohorts Index Screen

**Location**: `cohortz/app/student-screens/cohorts/index.tsx`

**Changes Required**:

1. **Add membership validation on mount**:
```typescript
useEffect(() => {
  validateMemberships();
}, []);

async function validateMemberships() {
  const storedMemberships = await getAllMemberships();
  if (storedMemberships.length > 0) {
    // Validate against backend
    // Update local storage if needed
  }
}
```

2. **Enhance handleJoin function**:
```typescript
const handleJoin = async () => {
  if (!code.trim()) {
    Alert.alert('Invalid Code', 'Please enter a valid join code.');
    return;
  }
  
  // Check if already a member locally
  const existingMembership = await checkLocalMembership(code);
  if (existingMembership) {
    navigateToDashboard(existingMembership);
    return;
  }
  
  // Proceed with join
  joinCommunity(code);
};
```

3. **Add focus listener for data refresh**:
```typescript
useFocusEffect(
  useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['learnerCohorts'] });
  }, [])
);
```

## Data Models

### MembershipData Interface

```typescript
interface MembershipData {
  community_id: number;
  community_name: string;
  community_description: string;
  membership: {
    id: number;
    user_id: number;
    community_id: number;
    status: 'active' | 'pending';
    role: 'learner' | 'instructor';
    created_at: string;
  };
  programme_count: number;
  stored_at: string; // Timestamp when stored locally
}
```

### AsyncStorage Schema

```typescript
// Key: `membership_${communityId}`
// Value: JSON.stringify(MembershipData)

// Example:
{
  "membership_123": {
    "community_id": 123,
    "community_name": "React Native Bootcamp",
    "community_description": "Learn React Native",
    "membership": {
      "id": 456,
      "user_id": 789,
      "community_id": 123,
      "status": "active",
      "role": "learner",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "programme_count": 5,
    "stored_at": "2024-01-15T10:30:05Z"
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Backend API Properties

**Property 1: Complete membership data in join response**
*For any* successful join operation, the API response should contain all required fields: community_id, user_id, status, created_at, community_name, community_description, and programme_count.
**Validates: Requirements 1.1, 1.4**

**Property 2: Existing membership returns complete data**
*For any* join attempt where the user is already a member, the API response should return the existing membership data with all fields populated, not an error.
**Validates: Requirements 1.2**

**Property 3: Descriptive error messages**
*For any* failed join operation (invalid code, missing auth, etc.), the API response should contain a specific error message describing the failure reason, not a generic "something went wrong" message.
**Validates: Requirements 1.3**

### Frontend State Persistence Properties

**Property 4: Membership data persistence**
*For any* successful join operation, the membership data should be immediately stored in AsyncStorage and retrievable using the key format `membership_${communityId}`.
**Validates: Requirements 2.1**

**Property 5: Unique storage keys per community**
*For any* set of multiple community memberships, each should be stored with a unique key, and storing a new membership should not overwrite existing memberships.
**Validates: Requirements 2.4**

**Property 6: Backend validation of stored data**
*For any* membership data found in AsyncStorage, a backend validation request should be made before using the data for navigation or display.
**Validates: Requirements 2.3**

### Navigation Properties

**Property 7: Automatic navigation after successful join**
*For any* successful join operation (whether from API or local cache hit), the app should automatically navigate to the Programme_Dashboard with community_id and community_name as route parameters.
**Validates: Requirements 3.1, 3.2, 7.2**

**Property 8: Already-member navigation**
*For any* "already a member" response from the backend, the frontend should update local storage, navigate to the Programme_Dashboard, and display a friendly welcome message instead of an error.
**Validates: Requirements 3.3, 5.3, 7.3, 7.4**

**Property 9: Input field cleanup**
*For any* successful join operation that results in navigation, the join code input field should be cleared before or during navigation.
**Validates: Requirements 3.4**

### UI State Properties

**Property 10: Community list display**
*For any* non-empty set of memberships retrieved from AsyncStorage or the backend, the UI should display the community list view instead of the empty join screen.
**Validates: Requirements 4.2**

**Property 11: Accurate programme counts**
*For any* community displayed in the list, the programme_count shown should match the value from the most recent backend response or stored membership data.
**Validates: Requirements 4.3**

**Property 12: Data refresh on focus**
*For any* focus event on the cohorts index screen, the learnerCohorts query should be invalidated and refetched from the backend.
**Validates: Requirements 4.4**

### Cache Management Properties

**Property 13: Query cache invalidation**
*For any* successful join operation, both 'communities' and 'learnerCohorts' query keys should be invalidated in the React Query cache.
**Validates: Requirements 6.1, 6.4**

**Property 14: Automatic refetch after invalidation**
*For any* query cache invalidation, React Query should automatically trigger a refetch of the invalidated queries.
**Validates: Requirements 6.2**

**Property 15: UI update after refetch**
*For any* completed refetch of learnerCohorts data, the UI should update to display the newly joined community in the list.
**Validates: Requirements 6.3**

### Duplicate Prevention Properties

**Property 16: Local-first membership check**
*For any* join attempt, the frontend should check AsyncStorage for existing membership before making an API call to the backend.
**Validates: Requirements 7.1**

### Loading State Properties

**Property 17: Loading indicator during join**
*For any* join operation in progress (isPending === true), the join button should display a loading indicator and be disabled.
**Validates: Requirements 8.1, 8.2**

**Property 18: Loading state during validation**
*For any* membership validation operation on app load, a loading state should be displayed before rendering the join screen or community list.
**Validates: Requirements 8.3**

## Error Handling

### Network Errors

When network requests fail:
1. Display user-friendly error message with retry option
2. Preserve user input (join code) for retry
3. Log error details for debugging
4. Do not clear AsyncStorage or local state

### Invalid Join Codes

When an invalid code is entered:
1. Display clear message: "Invalid community code. Please check and try again."
2. Keep input field populated for correction
3. Do not make repeated API calls for the same invalid code

### AsyncStorage Failures

When AsyncStorage operations fail:
1. Log error with full context
2. Continue with in-memory state only
3. Display warning to user about potential data loss on app restart
4. Attempt to retry storage operation on next successful join

### Already a Member Scenario

When backend returns "already a member":
1. Treat as success, not error
2. Fetch complete membership data if not in response
3. Store in AsyncStorage
4. Navigate to Programme_Dashboard
5. Display: "Welcome back to [Community Name]!"

## Testing Strategy

### Unit Tests

Unit tests should focus on specific examples and edge cases:

1. **AsyncStorage Operations**
   - Test storing membership data with valid structure
   - Test retrieving membership data by community ID
   - Test handling AsyncStorage errors gracefully
   - Test clearing membership data on logout

2. **Navigation Logic**
   - Test navigation with correct route parameters
   - Test navigation after "already a member" response
   - Test input field clearing after navigation

3. **Error Message Formatting**
   - Test error message for invalid code
   - Test error message for network failure
   - Test friendly message for "already a member"

4. **Loading State Management**
   - Test button disabled state during pending operation
   - Test loading indicator visibility
   - Test loading state during validation

### Property-Based Tests

Property tests should verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property 1: Complete membership data in join response**
   - Generate random valid join codes
   - Verify all required fields present in response
   - Tag: **Feature: learner-join-flow-fix, Property 1: Complete membership data in join response**

2. **Property 4: Membership data persistence**
   - Generate random membership data
   - Store in AsyncStorage
   - Verify retrieval returns identical data
   - Tag: **Feature: learner-join-flow-fix, Property 4: Membership data persistence**

3. **Property 5: Unique storage keys per community**
   - Generate multiple random community memberships
   - Store all in AsyncStorage
   - Verify each has unique key and correct data
   - Tag: **Feature: learner-join-flow-fix, Property 5: Unique storage keys per community**

4. **Property 7: Automatic navigation after successful join**
   - Generate random successful join responses
   - Verify navigation called with correct parameters
   - Tag: **Feature: learner-join-flow-fix, Property 7: Automatic navigation after successful join**

5. **Property 9: Input field cleanup**
   - Generate random join codes
   - Simulate successful join
   - Verify input field cleared
   - Tag: **Feature: learner-join-flow-fix, Property 9: Input field cleanup**

6. **Property 10: Community list display**
   - Generate random non-empty membership arrays
   - Verify community list rendered, not empty state
   - Tag: **Feature: learner-join-flow-fix, Property 10: Community list display**

7. **Property 11: Accurate programme counts**
   - Generate random communities with programme counts
   - Verify displayed count matches data
   - Tag: **Feature: learner-join-flow-fix, Property 11: Accurate programme counts**

8. **Property 13: Query cache invalidation**
   - Simulate successful join
   - Verify both query keys invalidated
   - Tag: **Feature: learner-join-flow-fix, Property 13: Query cache invalidation**

9. **Property 16: Local-first membership check**
   - Pre-populate AsyncStorage with memberships
   - Attempt to join existing community
   - Verify no API call made, navigation occurs
   - Tag: **Feature: learner-join-flow-fix, Property 16: Local-first membership check**

10. **Property 17: Loading indicator during join**
    - Simulate pending join operation
    - Verify button disabled and loading indicator visible
    - Tag: **Feature: learner-join-flow-fix, Property 17: Loading indicator during join**

### Integration Tests

Integration tests should verify the complete flow:

1. **Complete Join Flow**
   - Enter valid join code
   - Verify API call made
   - Verify AsyncStorage updated
   - Verify navigation to dashboard
   - Verify community appears in list on return

2. **Already Member Flow**
   - Join community successfully
   - Attempt to join same community again
   - Verify friendly message displayed
   - Verify navigation to dashboard

3. **App Restart Persistence**
   - Join community
   - Simulate app restart
   - Verify membership data loaded from AsyncStorage
   - Verify community list displayed

4. **Multiple Communities**
   - Join multiple communities
   - Verify all stored with unique keys
   - Verify all displayed in list
   - Verify navigation works for each

### Testing Tools

- **Unit Tests**: Jest with React Native Testing Library
- **Property Tests**: fast-check library for TypeScript
- **Integration Tests**: Detox for end-to-end testing
- **API Mocking**: MSW (Mock Service Worker) for API responses

### Test Configuration

All property-based tests must be configured with:
- Minimum 100 iterations per test
- Seed value logging for reproducibility
- Shrinking enabled for minimal failing examples
- Timeout of 30 seconds per test

