# Design Document: Profile Avatar Generator

## Overview

The Profile Avatar Generator feature enables Cohortle users to generate culturally appropriate profile avatars with a single button click. This design leverages the DiceBear Avatars API (https://dicebear.com), an open-source avatar generation library that provides diverse, customisable avatar styles through a simple HTTP API.

### Key Design Decisions

1. **Avatar Service**: DiceBear Avatars API (specifically the "avataaars" or "big-smile" style)
   - Rationale: Open-source, free for commercial use, highly customisable, supports diverse representation
   - Provides deterministic generation (same seed = same avatar)
   - No API key required for basic usage
   - CDN-hosted for reliability and performance

2. **Storage Strategy**: Store DiceBear URLs in profile_image field
   - Rationale: Leverages existing infrastructure, no additional storage costs
   - DiceBear CDN provides reliable hosting and caching
   - URLs are deterministic and can be regenerated if needed

3. **Customisation Approach**: Seed-based generation with optional style parameters
   - Generate random seed for each avatar generation
   - Allow users to regenerate until satisfied
   - Future enhancement: expose specific customisation options (accessories, colours)

4. **Cultural Appropriateness**: Use DiceBear's "big-smile" or "avataaars" style with skin tone parameters
   - Configure diverse skin tone palette reflecting African diversity
   - Ensure variety in hairstyles and features
   - Test generated avatars for cultural sensitivity

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Profile Settings Page                                  │ │
│  │  - Generate Avatar Button                               │ │
│  │  - Avatar Preview                                        │ │
│  │  - Loading State                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ HTTP Request                     │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client (lib/api/profile.ts)                        │ │
│  │  - generateAvatar()                                      │ │
│  │  - updateProfile()                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ POST /api/profile/avatar/generate
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express API)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Avatar Route (routes/avatar.js)                        │ │
│  │  - POST /profile/avatar/generate                        │ │
│  │  - Authentication middleware                             │ │
│  │  - Rate limiting middleware                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AvatarService (services/AvatarService.js)              │ │
│  │  - generateAvatarUrl()                                   │ │
│  │  - validateAvatarUrl()                                   │ │
│  │  - buildDiceBearUrl()                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProfileService (services/ProfileService.js)            │ │
│  │  - updateProfileImage()                                  │ │
│  │  - getProfile()                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Users Model (models/users.js)                          │ │
│  │  - profile_image field (VARCHAR 500)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Request
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DiceBear Avatars API (External)                 │
│  https://api.dicebear.com/7.x/{style}/svg                   │
│  - Generates SVG avatars                                     │
│  - Deterministic (seed-based)                                │
│  - CDN-hosted                                                │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. User clicks "Generate Avatar" button in profile settings
2. Frontend sends POST request to `/api/profile/avatar/generate`
3. Backend authenticates user and checks rate limits
4. AvatarService generates random seed and builds DiceBear URL
5. AvatarService validates the generated URL (optional HEAD request)
6. ProfileService updates user's profile_image field with new URL
7. Backend returns new avatar URL to frontend
8. Frontend displays new avatar immediately

## Components and Interfaces

### Frontend Components

#### GenerateAvatarButton Component
```typescript
interface GenerateAvatarButtonProps {
  currentAvatarUrl?: string;
  onAvatarGenerated: (newAvatarUrl: string) => void;
  disabled?: boolean;
}

// Component responsibilities:
// - Display "Generate Avatar" button
// - Handle loading state during generation
// - Call API to generate avatar
// - Update parent component with new avatar URL
// - Display error messages if generation fails
// - Keyboard accessible (Enter/Space)
// - ARIA labels and live regions for screen readers
```

#### AvatarPreview Component
```typescript
interface AvatarPreviewProps {
  avatarUrl?: string;
  userName: string;
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

// Component responsibilities:
// - Display current avatar or placeholder
// - Show loading skeleton during generation
// - Provide alt text for accessibility
// - Responsive sizing
// - Fallback to initials if no avatar
```

### Backend Services

#### AvatarService
```javascript
class AvatarService {
  /**
   * Generates a new avatar URL using DiceBear API
   * @param {Object} options - Generation options
   * @param {string} options.userId - User ID for seed generation
   * @param {string} options.style - Avatar style (default: 'big-smile')
   * @param {Object} options.customisation - Optional customisation parameters
   * @returns {Promise<string>} - Generated avatar URL
   */
  async generateAvatarUrl(options) {
    // Generate random seed (or use userId + timestamp for uniqueness)
    // Build DiceBear URL with parameters
    // Validate URL format
    // Return URL
  }

  /**
   * Builds DiceBear API URL with parameters
   * @param {string} seed - Unique seed for avatar generation
   * @param {string} style - Avatar style
   * @param {Object} params - Additional parameters (skin tone, accessories, etc.)
   * @returns {string} - Complete DiceBear URL
   */
  buildDiceBearUrl(seed, style, params) {
    // Construct URL: https://api.dicebear.com/7.x/{style}/svg?seed={seed}&...
    // Add skin tone parameters for diversity
    // Add size parameters
    // Return complete URL
  }

  /**
   * Validates that an avatar URL is accessible
   * @param {string} url - Avatar URL to validate
   * @returns {Promise<boolean>} - True if URL is valid and accessible
   */
  async validateAvatarUrl(url) {
    // Optional: Make HEAD request to verify URL is accessible
    // Check URL length < 500 characters
    // Return validation result
  }

  /**
   * Generates a random seed for avatar generation
   * @param {string} userId - User ID for additional entropy
   * @returns {string} - Random seed string
   */
  generateSeed(userId) {
    // Combine userId, timestamp, and random value
    // Return unique seed string
  }
}
```

#### ProfileService Extension
```javascript
// Extend existing ProfileService with avatar-specific method
class ProfileService {
  /**
   * Updates user's profile image
   * @param {number} userId - User ID
   * @param {string} avatarUrl - New avatar URL
   * @returns {Promise<Object>} - Updated user profile
   */
  async updateProfileImage(userId, avatarUrl) {
    // Validate URL length <= 500 characters
    // Update users.profile_image field
    // Return updated user object
  }
}
```

### API Endpoints

#### POST /api/profile/avatar/generate
```javascript
// Request
{
  // No body required - uses authenticated user context
  // Optional: customisation preferences in future
}

// Response (Success)
{
  "success": true,
  "avatarUrl": "https://api.dicebear.com/7.x/big-smile/svg?seed=abc123&...",
  "message": "Avatar generated successfully"
}

// Response (Error)
{
  "success": false,
  "error": "Failed to generate avatar",
  "message": "User-friendly error message"
}
```

### Middleware

#### Rate Limiting Middleware
```javascript
// Limit avatar generation to 5 requests per minute per user
const avatarRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per window
  message: 'Too many avatar generation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Data Models

### Users Table (Existing)
```sql
-- No schema changes required
-- Uses existing profile_image field

users {
  id: INTEGER PRIMARY KEY AUTO_INCREMENT
  first_name: VARCHAR(255)
  last_name: VARCHAR(255)
  email: VARCHAR(255) UNIQUE NOT NULL
  profile_image: VARCHAR(500) NULL  -- Stores DiceBear URL
  -- ... other fields
}
```

### DiceBear URL Format
```
https://api.dicebear.com/7.x/{style}/svg?seed={seed}&backgroundColor={color}&skinColor={tone}

Example:
https://api.dicebear.com/7.x/big-smile/svg?seed=user123-1234567890&backgroundColor=b6e3f4&skinColor=ae5d29

Parameters:
- style: 'big-smile' or 'avataaars' (culturally diverse styles)
- seed: Unique identifier for deterministic generation
- backgroundColor: Hex colour from Cohortle brand palette
- skinColor: Diverse skin tones (ae5d29, 614335, d08b5b, etc.)
- size: 200 (default size in pixels)
```

### Avatar Generation Configuration
```javascript
const AVATAR_CONFIG = {
  style: 'big-smile', // Primary style choice
  baseUrl: 'https://api.dicebear.com/7.x',
  defaultSize: 200,
  
  // Cohortle brand colours for backgrounds
  backgroundColors: [
    'b6e3f4', // Light blue
    'c2f0c2', // Light green
    'ffd4a3', // Light orange
    'e6ccff', // Light purple
  ],
  
  // Diverse African skin tones
  skinTones: [
    'ae5d29', // Medium brown
    '614335', // Deep brown
    'd08b5b', // Light brown
    '8d5524', // Rich brown
    'a55728', // Warm brown
  ],
  
  // Timeout for external API calls
  requestTimeout: 10000, // 10 seconds
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Avatar Generation Performance
*For any* authenticated user request to generate an avatar, the Avatar_Generator should return a valid avatar URL within 5 seconds.
**Validates: Requirements 1.2**

### Property 2: Successful Generation UI Update
*For any* successful avatar generation, the Profile_System should immediately update the displayed avatar to show the new avatar URL.
**Validates: Requirements 1.4**

### Property 3: Error Handling Preserves Previous Avatar
*For any* avatar generation failure, the Profile_System should display an error message and the user's profile_image field should remain unchanged from its previous value.
**Validates: Requirements 1.5, 10.5**

### Property 4: Diverse Skin Tone Configuration
*For any* generated avatar URL, the skinColor parameter should be one of the configured diverse African skin tones from the AVATAR_CONFIG.
**Validates: Requirements 2.1**

### Property 5: Avatar Variety Through Unique Seeds
*For any* sequence of avatar generations for the same user, each generated avatar URL should contain a different seed value, ensuring visual variety.
**Validates: Requirements 2.4**

### Property 6: Brand Colour Consistency
*For any* generated avatar URL, the backgroundColor parameter should be one of the colours from Cohortle's brand palette defined in AVATAR_CONFIG.
**Validates: Requirements 3.1**

### Property 7: Consistent Avatar Dimensions
*For any* generated avatar URL, the size parameter should be consistent with the configured default size (200 pixels).
**Validates: Requirements 3.2**

### Property 8: Avatar URL Consistency Across Contexts
*For any* user, the avatar URL retrieved from the profile_image field should be identical regardless of which UI context (profile page, comments, dashboard) requests it.
**Validates: Requirements 3.4**

### Property 9: Avatar Storage Round-Trip
*For any* successfully generated avatar, storing the URL in the profile_image field and then retrieving the user's profile should return the same avatar URL.
**Validates: Requirements 4.1, 4.4**

### Property 10: URL Length Validation
*For any* avatar URL that exceeds 500 characters, attempting to store it in the profile_image field should be rejected with a validation error.
**Validates: Requirements 4.2**

### Property 11: Avatar Replacement on Regeneration
*For any* user with an existing profile_image value, generating a new avatar should replace the old value with the new avatar URL in the database.
**Validates: Requirements 4.3**

### Property 12: Storage Failure Data Integrity
*For any* avatar storage operation that fails, the user's profile_image field should retain its previous value without corruption.
**Validates: Requirements 4.5**

### Property 13: Valid DiceBear URL Format
*For any* avatar generation request, the resulting URL should match the DiceBear API format: `https://api.dicebear.com/7.x/{style}/svg?seed={seed}&...` with all required parameters present.
**Validates: Requirements 5.1, 5.2**

### Property 14: URL Accessibility Validation
*For any* avatar URL returned by the Avatar_Generator, the URL should be a valid HTTP/HTTPS URL that can be accessed (returns 200 status code).
**Validates: Requirements 5.4, 10.3**

### Property 15: Request Timeout Enforcement
*For any* avatar generation request that takes longer than 10 seconds, the Avatar_Generator should timeout and return an error.
**Validates: Requirements 5.5**

### Property 16: Alt Text Presence
*For any* avatar image displayed in the UI, the img element should include a descriptive alt attribute for screen reader accessibility.
**Validates: Requirements 6.4**

### Property 17: Button Disabled During Generation
*For any* avatar generation request in progress, the Generate Avatar button should be in a disabled state until the request completes (success or failure).
**Validates: Requirements 6.5**

### Property 18: Customisation Parameters Propagation
*For any* avatar generation request with customisation options selected, the generated URL should include parameters corresponding to those selected options.
**Validates: Requirements 7.2**

### Property 19: Rate Limiting Enforcement
*For any* user making more than 5 avatar generation requests within a 60-second window, the 6th request should be rejected with a rate limit error.
**Validates: Requirements 8.2**

### Property 20: Authentication Requirement
*For any* avatar generation request without valid authentication credentials, the request should be rejected with an authentication error.
**Validates: Requirements 9.1, 9.3**

## Error Handling

### Error Categories

1. **External Service Errors**
   - DiceBear API unavailable (503, timeout)
   - Invalid response from DiceBear
   - Network connectivity issues

2. **Validation Errors**
   - URL length exceeds 500 characters
   - Invalid URL format
   - Missing required parameters

3. **Authentication Errors**
   - User not authenticated
   - Invalid or expired session token

4. **Rate Limiting Errors**
   - Too many requests in time window
   - Quota exceeded

5. **Database Errors**
   - Failed to update profile_image field
   - Database connection issues
   - Transaction failures

### Error Handling Strategy

```javascript
// Error response format
{
  success: false,
  error: 'ERROR_CODE',
  message: 'User-friendly error message',
  details: 'Technical details for logging (not sent to client)'
}

// Error codes
const ERROR_CODES = {
  SERVICE_UNAVAILABLE: 'Avatar generation service is temporarily unavailable',
  GENERATION_TIMEOUT: 'Avatar generation took too long. Please try again',
  INVALID_URL: 'Generated avatar URL is invalid',
  URL_TOO_LONG: 'Avatar URL exceeds maximum length',
  RATE_LIMIT_EXCEEDED: 'Too many avatar generation requests. Please wait a moment',
  AUTHENTICATION_REQUIRED: 'You must be logged in to generate an avatar',
  DATABASE_ERROR: 'Failed to save avatar. Please try again',
  NETWORK_ERROR: 'Network connection failed. Please check your connection',
};
```

### Error Recovery

1. **Automatic Retry**: For transient network errors, implement exponential backoff retry (max 2 retries)
2. **Fallback Behaviour**: On persistent errors, maintain existing avatar
3. **User Notification**: Display clear, actionable error messages
4. **Logging**: Log all errors with context for debugging (user ID, timestamp, error details)
5. **Graceful Degradation**: If avatar generation fails, users can still use the platform with their existing avatar or initials

### Error Logging

```javascript
// Log format
{
  timestamp: '2024-03-09T10:30:00Z',
  level: 'error',
  service: 'AvatarService',
  operation: 'generateAvatarUrl',
  userId: 123,
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'DiceBear API returned 503',
    stack: '...',
  },
  context: {
    seed: 'abc123',
    style: 'big-smile',
    attemptNumber: 1,
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and UI component behavior
- **Property tests**: Verify universal properties across all inputs, ensuring correctness at scale

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness across the input space.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library. Each property test will run a minimum of 100 iterations to ensure thorough coverage through randomization.

#### Property Test Configuration

```javascript
// Example property test structure
import fc from 'fast-check';

describe('Avatar Generator Properties', () => {
  it('Property 1: Avatar Generation Performance', () => {
    // Feature: profile-avatar-generator, Property 1: Avatar generation completes within 5 seconds
    fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // userId
        async (userId) => {
          const startTime = Date.now();
          const avatarUrl = await avatarService.generateAvatarUrl({ userId });
          const duration = Date.now() - startTime;
          
          expect(duration).toBeLessThan(5000);
          expect(avatarUrl).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test Tags

Each property test must include a comment tag referencing the design document property:

```javascript
// Feature: profile-avatar-generator, Property {number}: {property_text}
```

### Unit Testing

Unit tests will focus on:

1. **Component Behavior**
   - GenerateAvatarButton renders correctly
   - Loading states display properly
   - Error messages appear on failure
   - Keyboard accessibility works

2. **Service Layer**
   - AvatarService.buildDiceBearUrl constructs valid URLs
   - Seed generation produces unique values
   - URL validation catches invalid formats
   - ProfileService.updateProfileImage updates database correctly

3. **API Endpoints**
   - POST /api/profile/avatar/generate requires authentication
   - Rate limiting middleware blocks excessive requests
   - Error responses have correct format
   - Success responses include valid avatar URLs

4. **Edge Cases**
   - Empty or null user IDs
   - Extremely long seeds
   - Special characters in parameters
   - Concurrent generation requests

5. **Integration Points**
   - Frontend API client calls backend correctly
   - Backend updates database successfully
   - DiceBear URLs are accessible
   - Authentication middleware integration

### Test Coverage Goals

- **Unit test coverage**: Minimum 80% code coverage
- **Property test coverage**: All 20 correctness properties implemented
- **Integration test coverage**: End-to-end avatar generation flow
- **Accessibility testing**: WCAG 2.1 AA compliance for avatar UI components

### Testing Tools

- **Unit Testing**: Jest (backend), Jest + React Testing Library (frontend)
- **Property Testing**: fast-check
- **Integration Testing**: Supertest (API), Playwright (E2E)
- **Accessibility Testing**: jest-axe, manual testing with screen readers

### Test Data

```javascript
// Test fixtures
const TEST_USER_IDS = [1, 42, 999, 10000];
const TEST_SEEDS = ['test-seed-1', 'user-123-timestamp', 'random-abc-xyz'];
const VALID_SKIN_TONES = ['ae5d29', '614335', 'd08b5b', '8d5524', 'a55728'];
const VALID_BG_COLORS = ['b6e3f4', 'c2f0c2', 'ffd4a3', 'e6ccff'];
const INVALID_URLS = [
  '', 
  'not-a-url', 
  'http://', 
  'a'.repeat(501), // Too long
];
```

### Continuous Integration

- Run all tests on every pull request
- Block merges if tests fail
- Generate coverage reports
- Run property tests with increased iterations (1000) in CI for thorough validation
