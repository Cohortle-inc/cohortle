# Design Document: Email Verification Flow Improvement

## Overview

This design addresses critical UX issues in the Cohortle email verification flow. Currently, users experience confusion after signup due to unclear messaging, broken verification links (404 errors), and restrictive access patterns. The improved flow will provide immediate account access for exploration while restricting programme-related actions until email verification is complete.

The solution involves:
1. Fixing the broken verification endpoint routing
2. Adding a persistent notification bar for unverified users
3. Implementing access control that allows exploration but restricts programme actions
4. Improving messaging throughout the verification journey
5. Enabling real-time session updates when verification completes

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ Notification Bar │  │ Verification Page│  │ Auth Guard ││
│  │  (Unverified)    │  │  (/verify-email) │  │ Components ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│  ┌──────────────────────────────────────────────────────────┤
│  │           AuthContext (with verification state)          ││
│  └──────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ Auth Routes      │  │ Verification     │  │ Access     ││
│  │ /auth/verify     │  │ Token Service    │  │ Control    ││
│  │ /auth/resend     │  │                  │  │ Middleware ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│  ┌──────────────────────────────────────────────────────────┤
│  │              ResendService (Email Delivery)              ││
│  └──────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                          │
│  ┌──────────────────────────────────────────────────────────┤
│  │ users table: id, email, email_verified, password, ...    ││
│  │ verification_tokens table: token, user_id, expires_at    ││
│  └──────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Signup Flow:**
```
User submits signup form
  → Backend creates user (email_verified = 0)
  → Backend generates verification token (24hr expiry)
  → Backend sends welcome email with verification link
  → Backend returns JWT with user data (including email_verified: false)
  → Frontend stores JWT in httpOnly cookie
  → Frontend redirects to dashboard
  → Frontend shows notification bar (unverified state)
```

**Verification Flow:**
```
User clicks verification link in email
  → Frontend routes to /verify-email?token=xxx
  → Frontend calls backend /auth/verify-email
  → Backend validates token (existence, expiration, user association)
  → Backend updates user.email_verified = 1
  → Backend generates new JWT with updated verification status
  → Backend returns new JWT
  → Frontend updates httpOnly cookie
  → Frontend updates AuthContext state
  → Frontend redirects to dashboard with success message
  → Notification bar disappears
```

**Resend Verification Flow:**
```
User clicks "Resend verification email" in notification bar
  → Frontend calls backend /auth/resend-verification
  → Backend validates user is authenticated and unverified
  → Backend generates new verification token
  → Backend sends new verification email
  → Backend returns success message
  → Frontend shows confirmation toast
```

## Components and Interfaces

### Backend Components

#### 1. Verification Token Service

**Purpose:** Manage verification token lifecycle

**Location:** `cohortle-api/services/VerificationTokenService.js`

**Interface:**
```javascript
class VerificationTokenService {
  /**
   * Generate a new verification token for a user
   * @param {number} userId - User ID
   * @returns {Promise<string>} - Verification token
   */
  static async generateToken(userId);

  /**
   * Validate a verification token
   * @param {string} token - Token to validate
   * @returns {Promise<{valid: boolean, userId?: number, error?: string}>}
   */
  static async validateToken(token);

  /**
   * Invalidate a token after successful verification
   * @param {string} token - Token to invalidate
   * @returns {Promise<void>}
   */
  static async invalidateToken(token);

  /**
   * Clean up expired tokens (called by cron job)
   * @returns {Promise<number>} - Number of tokens deleted
   */
  static async cleanupExpiredTokens();
}
```

**Implementation Notes:**
- Tokens stored in new `verification_tokens` table
- Token format: cryptographically secure random string (32 bytes, hex encoded)
- Expiration: 24 hours from creation
- One active token per user (new token invalidates previous)

#### 2. Auth Routes Enhancement

**New Endpoints:**

**POST /v1/api/auth/verify-email**
- **Purpose:** Verify user email with token
- **Request Body:** `{ token: string }`
- **Response:** `{ error: boolean, message: string, token: string, user: object }`
- **Status Codes:**
  - 200: Verification successful
  - 400: Invalid request (missing token)
  - 401: Invalid or expired token
  - 404: User not found
  - 500: Server error

**POST /v1/api/auth/resend-verification**
- **Purpose:** Resend verification email to authenticated user
- **Authentication:** Required (JWT)
- **Request Body:** None (user ID from JWT)
- **Response:** `{ error: boolean, message: string }`
- **Status Codes:**
  - 200: Email sent successfully
  - 400: User already verified
  - 401: Not authenticated
  - 429: Rate limit exceeded (max 3 per hour)
  - 500: Server error

**Implementation Notes:**
- Fix existing `/auth/verify-email` endpoint (currently exists but has issues)
- Add rate limiting to resend endpoint (prevent abuse)
- Update JWT token generation to include `email_verified` field
- Ensure verification link uses correct frontend URL from env var

#### 3. Access Control Middleware

**Purpose:** Enforce verification requirements for specific actions

**Location:** `cohortle-api/middleware/requireEmailVerification.js`

**Interface:**
```javascript
/**
 * Middleware to require email verification for specific routes
 * Returns 403 if user is not verified
 */
function requireEmailVerification(req, res, next);
```

**Protected Endpoints:**
- POST `/v1/api/programmes` (create programme)
- POST `/v1/api/enrollments` (join programme)
- POST `/v1/api/cohorts` (create cohort)

**Implementation Notes:**
- Check `req.email_verified` from JWT payload
- Return clear error message with verification instructions
- Allow all GET requests (browsing/exploration)

### Frontend Components

#### 1. Email Verification Notification Bar

**Purpose:** Persistent reminder for unverified users

**Location:** `cohortle-web/src/components/auth/EmailVerificationBanner.tsx`

**Interface:**
```typescript
interface EmailVerificationBannerProps {
  email: string;
  onResend: () => Promise<void>;
}

export function EmailVerificationBanner(props: EmailVerificationBannerProps): JSX.Element;
```

**Visual Design:**
- Background: Warning yellow (#FEF3C7)
- Border: Amber (#F59E0B)
- Icon: Email icon
- Position: Top of page, below navigation
- Dismissible: No (persists until verified)

**Content:**
```
⚠️ Please verify your email address (user@example.com) to unlock all features.
[Resend verification email]
```

**Behavior:**
- Shows on all pages when user is authenticated but unverified
- Clicking "Resend" calls resend API and shows toast confirmation
- Automatically disappears when verification status updates
- Rate limiting feedback: "Please wait before requesting another email"

#### 2. Email Verification Page

**Purpose:** Handle verification link clicks

**Location:** `cohortle-web/src/app/verify-email/page.tsx`

**Route:** `/verify-email?token=xxx`

**States:**
1. **Loading:** "Verifying your email..."
2. **Success:** "Email verified successfully! Redirecting to dashboard..."
3. **Error - Invalid Token:** "This verification link is invalid. [Request new link]"
4. **Error - Expired Token:** "This verification link has expired. [Request new link]"
5. **Error - Already Verified:** "Your email is already verified. [Go to dashboard]"

**Behavior:**
- Automatically calls verification API on mount
- Shows appropriate state based on API response
- Redirects to dashboard after 3 seconds on success
- Updates AuthContext with new verification status
- Provides clear next steps on error

#### 3. AuthContext Enhancement

**Purpose:** Track and expose email verification status

**Location:** `cohortle-web/src/lib/contexts/AuthContext.tsx`

**Interface Changes:**
```typescript
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role?: 'student' | 'convener' | 'instructor' | 'administrator';
  profilePicture?: string;
  emailVerified: boolean; // NEW
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, firstName: string, lastName: string, password: string, role: 'student' | 'convener', invitationCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>; // NEW
  refreshVerificationStatus: () => Promise<void>; // NEW
}
```

**Implementation Notes:**
- Parse `email_verified` from JWT payload
- Add `resendVerificationEmail` method that calls resend API
- Add `refreshVerificationStatus` method to update user state after verification
- Update user state when new JWT is received (after verification)

#### 4. Programme Action Guards

**Purpose:** Prevent unverified users from creating/joining programmes

**Location:** `cohortle-web/src/components/programmes/ProgrammeActionGuard.tsx`

**Interface:**
```typescript
interface ProgrammeActionGuardProps {
  children: React.ReactNode;
  action: 'create' | 'join';
  fallback?: React.ReactNode;
}

export function ProgrammeActionGuard(props: ProgrammeActionGuardProps): JSX.Element;
```

**Behavior:**
- Checks `user.emailVerified` from AuthContext
- If verified: renders children
- If unverified: renders fallback or default message
- Default message: "Please verify your email to [create/join] programmes. [Verify now]"

**Usage:**
```tsx
<ProgrammeActionGuard action="create">
  <CreateProgrammeButton />
</ProgrammeActionGuard>

<ProgrammeActionGuard action="join">
  <JoinProgrammeButton />
</ProgrammeActionGuard>
```

#### 5. Signup Flow Enhancement

**Purpose:** Improve post-signup messaging

**Location:** `cohortle-web/src/components/auth/SignupForm.tsx`

**Changes:**
- After successful signup, show success message:
  ```
  "Account created successfully! 
   We've sent a verification email to {email}.
   You can explore your account now, but you'll need to verify your email to join or create programmes."
  ```
- Redirect to dashboard (not login page)
- Ensure JWT is stored in httpOnly cookie before redirect

## Data Models

### New Table: verification_tokens

**Purpose:** Store email verification tokens with expiration

**Schema:**
```sql
CREATE TABLE verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `token`: Unique verification token (64 character hex string)
- `expires_at`: Token expiration timestamp (24 hours from creation)
- `created_at`: Token creation timestamp
- `used_at`: Timestamp when token was successfully used (NULL if unused)

**Indexes:**
- `token`: Fast lookup during verification
- `user_id`: Fast lookup of user's tokens
- `expires_at`: Efficient cleanup of expired tokens

### Existing Table Updates: users

**No schema changes needed** - `email_verified` field already exists from migration `20250425194222-add-email-to-users.js`

**Field:**
- `email_verified`: TINYINT(1), default 0, indicates if email is verified

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authenticated Session Creation on Signup

*For any* valid signup request with email, password, and user details, completing the signup process should create an authenticated session with a valid JWT token.

**Validates: Requirements 1.1**

### Property 2: Unverified User Access Permissions

*For any* unverified user (email_verified = 0), the system should allow access to read-only features (dashboard viewing, profile viewing, programme browsing) but prevent write actions.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 3: Verification Notification Visibility

*For any* authenticated user, the notification bar should be visible if and only if the user's email is unverified, and should include the user's email address.

**Validates: Requirements 2.1, 2.2, 2.6, 8.4**

### Property 4: Verification Email Resend

*For any* authenticated unverified user, triggering the resend verification action should generate a new verification token and send a new verification email.

**Validates: Requirements 2.4**

### Property 5: Programme Action Access Control

*For any* user attempting to create or join a programme, the action should succeed if and only if the user's email is verified.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: Programme UI State Based on Verification

*For any* unverified user viewing programme creation or join UI, the action buttons should be in a disabled state with verification requirement messaging.

**Validates: Requirements 3.5**

### Property 7: Verification Token Uniqueness

*For any* set of generated verification tokens, all tokens should be unique, cryptographically secure (sufficient entropy), and properly formatted.

**Validates: Requirements 4.1, 7.1**

### Property 8: Verification Token Expiration

*For any* generated verification token, the expiration time should be set to exactly 24 hours from the creation timestamp.

**Validates: Requirements 7.2**

### Property 9: Successful Verification Updates

*For any* valid verification token, successfully verifying should atomically update both the database (email_verified = 1) and return a new JWT with email_verified: true.

**Validates: Requirements 4.3, 4.4, 8.1, 8.2**

### Property 10: Token Validation Comprehensive Checks

*For any* verification token, the validation process should check token existence, expiration status, user association, and usage status, rejecting tokens that fail any check with specific error messages.

**Validates: Requirements 4.5, 4.6, 7.4**

### Property 11: Token Invalidation After Use

*For any* verification token, after successful verification, attempting to use the same token again should be rejected as the token should be marked as used.

**Validates: Requirements 7.3**

### Property 12: Verification Failure Logging

*For any* failed token validation attempt, the system should log the failure with the specific reason (expired, invalid, already used, etc.) for security monitoring.

**Validates: Requirements 7.5**

### Property 13: Real-time Permission Updates

*For any* user who verifies their email, immediately attempting a previously restricted action (create/join programme) should succeed without requiring re-authentication.

**Validates: Requirements 8.3, 8.5**

### Property 14: Error Message Specificity

*For any* verification failure scenario (invalid token, expired token, already verified), the error message should specifically indicate the failure reason rather than a generic error.

**Validates: Requirements 5.5**

### Property 15: Signup Success Message Content

*For any* successful signup, the success message should include both the user's email address and information about the verification email being sent.

**Validates: Requirements 5.2**

### Property 16: Verification Email Personalization

*For any* verification email sent, the email body should include the user's first name in the greeting.

**Validates: Requirements 6.2**

## Error Handling

### Token Validation Errors

**Invalid Token Format:**
- **Scenario:** Token is malformed or doesn't match expected format
- **Response:** 400 Bad Request
- **Message:** "Invalid verification token format"
- **User Action:** Request new verification email

**Token Not Found:**
- **Scenario:** Token doesn't exist in database
- **Response:** 401 Unauthorized
- **Message:** "This verification link is invalid. Please request a new verification email."
- **User Action:** Click "Request new link" button

**Token Expired:**
- **Scenario:** Token exists but expires_at < current time
- **Response:** 401 Unauthorized
- **Message:** "This verification link has expired. Verification links are valid for 24 hours."
- **User Action:** Click "Request new link" button

**Token Already Used:**
- **Scenario:** Token exists but used_at is not NULL
- **Response:** 400 Bad Request
- **Message:** "This verification link has already been used. If you haven't verified your email, please request a new link."
- **User Action:** Check if already verified, or request new link

**User Not Found:**
- **Scenario:** Token is valid but associated user doesn't exist
- **Response:** 404 Not Found
- **Message:** "User account not found. Please contact support."
- **User Action:** Contact support

**Already Verified:**
- **Scenario:** User's email_verified is already 1
- **Response:** 200 OK (success, idempotent)
- **Message:** "Your email is already verified. You can now access all features."
- **User Action:** Redirect to dashboard

### Resend Verification Errors

**Not Authenticated:**
- **Scenario:** No valid JWT token in request
- **Response:** 401 Unauthorized
- **Message:** "Please log in to resend verification email"
- **User Action:** Redirect to login

**Already Verified:**
- **Scenario:** User's email_verified is already 1
- **Response:** 400 Bad Request
- **Message:** "Your email is already verified"
- **User Action:** No action needed

**Rate Limit Exceeded:**
- **Scenario:** User has requested more than 3 verification emails in the past hour
- **Response:** 429 Too Many Requests
- **Message:** "Too many verification emails requested. Please wait before requesting another."
- **User Action:** Wait and try again later

**Email Service Failure:**
- **Scenario:** ResendService fails to send email
- **Response:** 500 Internal Server Error
- **Message:** "Failed to send verification email. Please try again later."
- **User Action:** Try again later or contact support
- **Logging:** Log full error details for debugging

### Programme Action Errors

**Unverified User Attempts Restricted Action:**
- **Scenario:** Unverified user tries to create/join programme
- **Response:** 403 Forbidden
- **Message:** "Please verify your email address to [create/join] programmes. Check your inbox for the verification email or request a new one."
- **User Action:** Verify email or request new verification link

### General Error Handling Principles

1. **User-Friendly Messages:** All error messages should be clear and actionable
2. **Security:** Don't leak sensitive information (e.g., whether an email exists)
3. **Logging:** Log all errors with context for debugging
4. **Idempotency:** Verification should be idempotent (already verified = success)
5. **Rate Limiting:** Prevent abuse of resend functionality
6. **Graceful Degradation:** If email service fails, don't block signup

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:** Focus on specific examples, edge cases, and integration points
- Specific error scenarios (expired token, invalid format)
- Email template rendering
- UI component rendering with specific states
- API endpoint integration

**Property-Based Tests:** Verify universal properties across all inputs
- Token generation uniqueness and security
- Access control enforcement across all users
- Session update consistency
- Verification flow correctness

### Property-Based Testing Configuration

**Library:** fast-check (JavaScript/TypeScript)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: email-verification-flow-improvement, Property {N}: {property_text}`

**Example Test Structure:**
```javascript
// Property 7: Verification Token Uniqueness
// Feature: email-verification-flow-improvement, Property 7: Verification Token Uniqueness
test('generated tokens are unique and cryptographically secure', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 10, max: 100 }), // number of tokens to generate
      async (count) => {
        const tokens = [];
        for (let i = 0; i < count; i++) {
          const token = await VerificationTokenService.generateToken(userId);
          tokens.push(token);
        }
        
        // All tokens should be unique
        const uniqueTokens = new Set(tokens);
        expect(uniqueTokens.size).toBe(tokens.length);
        
        // All tokens should be 64 characters (32 bytes hex encoded)
        tokens.forEach(token => {
          expect(token).toMatch(/^[a-f0-9]{64}$/);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Backend:**
- VerificationTokenService methods
- Auth route handlers (verify-email, resend-verification)
- Access control middleware
- Email template generation
- Token validation logic
- Rate limiting

**Frontend:**
- EmailVerificationBanner component
- Verify email page states
- AuthContext verification methods
- ProgrammeActionGuard component
- Signup form success messaging

### Integration Tests

**End-to-End Verification Flow:**
1. User signs up
2. Verification email is sent
3. User clicks verification link
4. Email is verified
5. User can now create/join programmes

**Resend Flow:**
1. User signs up
2. User clicks "Resend verification email"
3. New email is sent
4. Old token is invalidated
5. New token works

**Access Control Flow:**
1. Unverified user attempts to create programme → blocked
2. User verifies email
3. User attempts to create programme → succeeds

### Test Data Generators

**For Property-Based Tests:**
```javascript
// Generate random user data
const userArbitrary = fc.record({
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 50 }),
  lastName: fc.string({ minLength: 1, maxLength: 50 }),
  password: fc.string({ minLength: 8, maxLength: 100 }),
  emailVerified: fc.boolean()
});

// Generate random verification tokens
const tokenArbitrary = fc.hexaString({ minLength: 64, maxLength: 64 });

// Generate random timestamps for expiration testing
const timestampArbitrary = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2025-12-31')
});
```

## Implementation Notes

### Security Considerations

1. **Token Security:**
   - Use `crypto.randomBytes(32)` for token generation
   - Store tokens hashed in database (optional enhancement)
   - Implement rate limiting on resend endpoint
   - Log all verification attempts for security monitoring

2. **Session Security:**
   - Use httpOnly cookies for JWT storage
   - Include email_verified in JWT payload
   - Refresh JWT after verification
   - Validate JWT on every request

3. **Email Security:**
   - Use HTTPS for all verification links
   - Include token in query parameter (not in URL path for better logging)
   - Set proper email headers (SPF, DKIM, DMARC)

### Performance Considerations

1. **Database:**
   - Index on verification_tokens.token for fast lookup
   - Index on verification_tokens.expires_at for cleanup
   - Periodic cleanup of expired tokens (daily cron job)

2. **Caching:**
   - Don't cache verification status (must be real-time)
   - Cache email templates for faster rendering

3. **Email Delivery:**
   - Use async email sending (don't block signup)
   - Implement retry logic for failed emails
   - Monitor email delivery rates

### Deployment Considerations

1. **Database Migration:**
   - Create verification_tokens table
   - Verify email_verified field exists in users table
   - Add indexes for performance

2. **Environment Variables:**
   - `FRONTEND_URL`: Frontend base URL for verification links
   - `RESEND_API_KEY`: Resend API key for email sending
   - `JWT_SECRET`: Secret for JWT signing
   - `VERIFICATION_TOKEN_EXPIRY_HOURS`: Token expiration (default: 24)

3. **Backward Compatibility:**
   - Existing users with email_verified = 0 should see notification bar
   - Existing verification endpoint should be fixed, not replaced
   - Graceful handling of missing verification_tokens table

4. **Monitoring:**
   - Track verification email send rate
   - Track verification success rate
   - Track verification link click rate
   - Alert on high failure rates

### Future Enhancements

1. **Email Verification Reminders:**
   - Send reminder email after 24 hours if not verified
   - Send reminder email after 7 days if not verified

2. **Alternative Verification Methods:**
   - SMS verification
   - Social login (auto-verified)

3. **Verification Incentives:**
   - Badge for verified users
   - Priority support for verified users

4. **Admin Tools:**
   - Manually verify users
   - View verification status in admin panel
   - Resend verification on behalf of users
