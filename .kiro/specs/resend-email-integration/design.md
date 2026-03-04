# Design Document: Resend Email Integration

## Overview

This design specifies the integration of Resend email service into the Cohortle Express.js backend to replace the current Nodemailer implementation. The integration will provide a more reliable, modern email sending solution with better deliverability using the verified domain mail.cohortle.com. The implementation will maintain backward compatibility with existing email functionality while providing a cleaner, more maintainable API.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Web App)     │
└────────┬────────┘
         │ HTTP POST
         │ /v1/api/email/send
         ▼
┌─────────────────────────────────────┐
│   Express.js Backend                │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Email Route                 │  │
│  │  - Authentication            │  │
│  │  - Validation                │  │
│  │  - Rate Limiting (future)    │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  ResendService               │  │
│  │  - Template Management       │  │
│  │  - Email Formatting          │  │
│  │  - Error Handling            │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Resend Client (lib/)        │  │
│  │  - API Key Management        │  │
│  │  - Client Initialization     │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │ HTTPS
              ▼
     ┌────────────────┐
     │  Resend API    │
     │  (External)    │
     └────────────────┘
```

### Component Interaction Flow

1. Frontend makes authenticated POST request to `/v1/api/email/send`
2. Email route validates authentication and request payload
3. Email route calls ResendService with validated data
4. ResendService formats email using appropriate template
5. ResendService calls Resend client to send email
6. Resend client communicates with Resend API
7. Response flows back through the stack to frontend

## Components and Interfaces

### 1. Resend Client Utility (`lib/resend.js`)

**Purpose**: Initialize and export a singleton Resend client instance.

**Interface**:
```javascript
// lib/resend.js
const { Resend } = require('resend');

/**
 * Initialize Resend client with API key from environment
 * @throws {Error} If RESEND_API_KEY is not configured
 */
function initializeResend() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured');
  }
  
  return new Resend(apiKey);
}

// Export singleton instance
module.exports = initializeResend();
```

**Error Handling**:
- Throws descriptive error if API key is missing
- Error is caught during application startup

### 2. ResendService (`services/ResendService.js`)

**Purpose**: Provide high-level email sending functionality with template management.

**Interface**:
```javascript
// services/ResendService.js
const resendClient = require('../lib/resend');
const errorLogger = require('../utils/errorLogger');

const SENDER_EMAIL = 'noreply@mail.cohortle.com';
const SENDER_NAME = 'Cohortle';

/**
 * Email template definitions
 */
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to Cohortle!',
    getHtml: (data) => `...`
  },
  password_reset: {
    subject: 'Reset Your Cohortle Password',
    getHtml: (data) => `...`
  },
  enrollment_confirmation: {
    subject: 'Enrollment Confirmed',
    getHtml: (data) => `...`
  },
  notification: {
    subject: (data) => data.subject || 'Notification from Cohortle',
    getHtml: (data) => `...`
  }
};

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.type - Email type (welcome, password_reset, etc.)
 * @param {Object} options.data - Template data
 * @param {string} [options.subject] - Optional custom subject (overrides template)
 * @returns {Promise<{error: boolean, message: string, messageId?: string}>}
 */
async function sendEmail({ to, type, data, subject }) {
  try {
    // Validate email type
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`Invalid email type: ${type}`);
    }

    // Get subject and HTML content
    const emailSubject = subject || 
      (typeof template.subject === 'function' 
        ? template.subject(data) 
        : template.subject);
    const htmlContent = template.getHtml(data);

    // Send via Resend
    const response = await resendClient.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [to],
      subject: emailSubject,
      html: htmlContent
    });

    // Log success
    errorLogger.logInfo('Email sent successfully', {
      to,
      type,
      messageId: response.id,
      timestamp: new Date().toISOString()
    });

    return {
      error: false,
      message: 'Email sent successfully',
      messageId: response.id
    };
  } catch (error) {
    // Log error
    errorLogger.logError('Email sending failed', {
      to,
      type,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return {
      error: true,
      message: error.message || 'Failed to send email'
    };
  }
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  sendEmail,
  isValidEmail,
  EMAIL_TEMPLATES
};
```

**Template Structure**:
Each template includes:
- `subject`: Static string or function that returns subject
- `getHtml(data)`: Function that generates HTML content from data

### 3. Email Route (`routes/email.js`)

**Purpose**: Provide HTTP endpoint for sending emails with authentication and validation.

**Interface**:
```javascript
// routes/email.js
const ResendService = require('../services/ResendService');
const ValidationService = require('../services/ValidationService');
const TokenMiddleware = require('../middleware/TokenMiddleware');
const UrlMiddleware = require('../middleware/UrlMiddleware');

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/email/send:
   *   post:
   *     summary: Send an email using Resend
   *     tags: [Email]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - to
   *               - type
   *             properties:
   *               to:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               type:
   *                 type: string
   *                 enum: [welcome, password_reset, enrollment_confirmation, notification]
   *                 example: welcome
   *               data:
   *                 type: object
   *                 description: Template-specific data
   *               subject:
   *                 type: string
   *                 description: Optional custom subject line
   *     responses:
   *       200:
   *         description: Email sent successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.post(
    '/v1/api/email/send',
    [TokenMiddleware, UrlMiddleware],
    async function (req, res) {
      try {
        const { to, type, data, subject } = req.body;

        // Validate required fields
        const validationResult = await ValidationService.validateObject(
          {
            to: 'required|email',
            type: 'required|in:welcome,password_reset,enrollment_confirmation,notification',
            data: 'object'
          },
          { to, type, data: data || {} }
        );

        if (validationResult.error) {
          return res.status(400).json(validationResult);
        }

        // Additional email validation
        if (!ResendService.isValidEmail(to)) {
          return res.status(400).json({
            error: true,
            message: 'Invalid email address format'
          });
        }

        // Validate subject length if provided
        if (subject && subject.length > 200) {
          return res.status(400).json({
            error: true,
            message: 'Subject line must be 200 characters or less'
          });
        }

        // Send email
        const result = await ResendService.sendEmail({
          to,
          type,
          data: data || {},
          subject
        });

        if (result.error) {
          return res.status(500).json(result);
        }

        return res.status(200).json(result);
      } catch (error) {
        console.error('Email route error:', error);
        return res.status(500).json({
          error: true,
          message: 'Failed to send email'
        });
      }
    }
  );

  return [];
};
```

### 4. Updated MailService (Backward Compatibility)

**Purpose**: Update existing MailService to use ResendService internally while maintaining existing interface.

**Interface**:
```javascript
// services/MailService.js (updated)
const ResendService = require('./ResendService');

module.exports = {
  // Keep existing template constants for backward compatibility
  VERIFICATION_EMAIL: `...`,
  FORGOT_PASSWORD: `...`,

  /**
   * Initialize method (now a no-op for backward compatibility)
   * @deprecated Use ResendService directly
   */
  initialize: function (config, pool, maxMessages, maxConnections) {
    console.warn('MailService.initialize is deprecated. Using ResendService instead.');
    // No-op: Resend client is initialized in lib/resend.js
  },

  /**
   * Send email using Resend
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @returns {Promise<{error: boolean, message: string}>}
   */
  send: async function ({ to, subject, html }) {
    try {
      // Use ResendService with notification type for custom HTML
      const result = await ResendService.sendEmail({
        to,
        type: 'notification',
        data: { customHtml: html },
        subject
      });

      return result;
    } catch (error) {
      return {
        error: true,
        message: error.message
      };
    }
  }
};
```

## Data Models

### Email Request Payload

```typescript
interface EmailRequest {
  to: string;              // Recipient email address
  type: EmailType;         // Email template type
  data?: object;           // Template-specific data
  subject?: string;        // Optional custom subject
}

type EmailType = 
  | 'welcome'
  | 'password_reset'
  | 'enrollment_confirmation'
  | 'notification';
```

### Email Response

```typescript
interface EmailResponse {
  error: boolean;
  message: string;
  messageId?: string;      // Resend message ID (on success)
}
```

### Template Data Structures

```typescript
// Welcome email data
interface WelcomeEmailData {
  first_name: string;
  verification_link?: string;
}

// Password reset email data
interface PasswordResetEmailData {
  first_name: string;
  reset_link: string;
}

// Enrollment confirmation email data
interface EnrollmentConfirmationData {
  first_name: string;
  programme_name: string;
  cohort_name: string;
  start_date: string;
}

// Notification email data
interface NotificationEmailData {
  title?: string;
  message: string;
  action_link?: string;
  action_text?: string;
  customHtml?: string;     // For backward compatibility
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Email validation rejects invalid formats
*For any* email address string, if it does not match the standard email format (user@domain.tld), then the validation should reject it and return an error
**Validates: Requirements 5.1**

### Property 2: Subject validation enforces length constraints
*For any* subject string, if it is empty or exceeds 200 characters, then the validation should reject it and return an error
**Validates: Requirements 5.2**

### Property 3: Content validation rejects empty content
*For any* email content string, if it is empty or contains only whitespace, then the validation should reject it and return an error
**Validates: Requirements 5.3**

### Property 4: Request validation rejects missing required fields
*For any* email request, if it is missing any required field (to, type, or data), then the API should reject it with a 400 status and descriptive error message
**Validates: Requirements 3.2, 3.5**

### Property 5: Authentication requirement for all email requests
*For any* request to the email API endpoint, if it lacks valid authentication credentials, then the request should be rejected with a 401 status
**Validates: Requirements 4.1, 4.2**

### Property 6: Sender address consistency
*For any* email sent through the system, the sender address should always be noreply@mail.cohortle.com
**Validates: Requirements 3.7**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing RESEND_API_KEY
   - Invalid API key format
   - **Handling**: Throw error during initialization, log warning, prevent application startup if critical

2. **Validation Errors**
   - Invalid email format
   - Missing required fields
   - Subject too long
   - Empty content
   - **Handling**: Return 400 status with descriptive error message, log validation failure

3. **Authentication Errors**
   - Missing authentication token
   - Invalid or expired token
   - **Handling**: Return 401 status, log authentication attempt

4. **Service Errors**
   - Resend API failure
   - Network timeout
   - Rate limiting
   - **Handling**: Return 500 status, log error with context, retry logic (future enhancement)

5. **Template Errors**
   - Invalid email type
   - Missing template data
   - **Handling**: Return 400 status with descriptive error, log template error

### Error Response Format

All error responses follow this structure:
```json
{
  "error": true,
  "message": "Descriptive error message",
  "field": "field_name"  // Optional: for validation errors
}
```

### Logging Strategy

**Success Logging**:
```javascript
{
  level: 'info',
  message: 'Email sent successfully',
  to: 'user@example.com',
  type: 'welcome',
  messageId: 'resend-message-id',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Error Logging**:
```javascript
{
  level: 'error',
  message: 'Email sending failed',
  to: 'user@example.com',
  type: 'welcome',
  error: 'Error message',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Security Considerations**:
- Never log API keys
- Never log full email content (only metadata)
- Sanitize user input before logging
- Use structured logging for easier parsing

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Test specific email templates render correctly
- Test authentication middleware integration
- Test Resend client initialization with valid/invalid API keys
- Test error responses for specific failure scenarios
- Test logging output for success and failure cases

**Property-Based Tests**: Verify universal properties across all inputs
- Generate random email addresses and verify validation
- Generate random subject lines of various lengths and verify validation
- Generate random request payloads with missing fields and verify rejection
- Generate random authentication tokens and verify access control

### Property-Based Testing Configuration

- **Library**: fast-check (already in devDependencies)
- **Iterations**: Minimum 100 iterations per property test
- **Tag Format**: `Feature: resend-email-integration, Property {number}: {property_text}`

### Test Organization

```
cohortle-api/__tests__/
├── services/
│   └── ResendService.test.js          # Unit tests for ResendService
├── routes/
│   └── email.test.js                  # Unit tests for email route
├── lib/
│   └── resend.test.js                 # Unit tests for Resend client init
└── resend-email-integration/
    ├── emailValidation.pbt.js         # Property tests for validation
    ├── authenticationRequirement.pbt.js # Property tests for auth
    └── senderConsistency.pbt.js       # Property tests for sender address
```

### Example Property Test

```javascript
// __tests__/resend-email-integration/emailValidation.pbt.js
const fc = require('fast-check');
const { isValidEmail } = require('../../services/ResendService');

describe('Feature: resend-email-integration, Property 1: Email validation rejects invalid formats', () => {
  test('should reject invalid email formats', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@') || !s.includes('.')),
        (invalidEmail) => {
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should accept valid email formats', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (validEmail) => {
          expect(isValidEmail(validEmail)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests should verify:
1. End-to-end email sending flow (with Resend API mocked)
2. Authentication middleware integration with email route
3. Error handling across the full stack
4. Template rendering with various data inputs
5. Backward compatibility with existing MailService usage

### Manual Testing Checklist

Before deployment:
- [ ] Verify RESEND_API_KEY is configured in Coolify
- [ ] Test welcome email sends successfully
- [ ] Test password reset email sends successfully
- [ ] Test enrollment confirmation email sends successfully
- [ ] Test notification email sends successfully
- [ ] Verify emails arrive in inbox (not spam)
- [ ] Verify sender shows as "Cohortle <noreply@mail.cohortle.com>"
- [ ] Test authentication requirement (unauthenticated requests fail)
- [ ] Test validation errors return appropriate messages
- [ ] Check logs for sensitive information leakage
- [ ] Verify backward compatibility with existing auth routes

## Migration Strategy

### Phase 1: Add Resend Integration (Non-Breaking)
1. Install resend npm package
2. Create lib/resend.js utility
3. Create services/ResendService.js
4. Create routes/email.js
5. Add tests
6. Deploy without changing existing code

### Phase 2: Update Existing Routes (Gradual Migration)
1. Update auth.js to use ResendService for password reset
2. Update auth.js to use ResendService for verification emails
3. Test thoroughly in production
4. Monitor for issues

### Phase 3: Deprecate Old MailService (Future)
1. Update MailService to use ResendService internally
2. Add deprecation warnings
3. Update all remaining usages
4. Eventually remove Nodemailer dependency

### Rollback Plan

If issues arise:
1. Revert to previous deployment
2. RESEND_API_KEY can be removed from environment
3. Old Nodemailer code remains functional
4. No data loss or corruption risk

## Security Considerations

1. **API Key Protection**
   - API key stored in environment variables only
   - Never exposed to frontend
   - Never logged or included in error messages

2. **Authentication**
   - All email endpoints require valid JWT token
   - Token validation via existing TokenMiddleware
   - Rate limiting (future enhancement)

3. **Input Validation**
   - Email address format validation
   - Subject length limits
   - Content sanitization
   - Type enumeration (prevents arbitrary template access)

4. **Email Spoofing Prevention**
   - Sender address hardcoded to noreply@mail.cohortle.com
   - Cannot be overridden by API requests
   - Verified domain ensures deliverability

5. **Logging Security**
   - No sensitive data in logs
   - Structured logging for audit trail
   - Error messages sanitized

## Performance Considerations

1. **Resend Client Initialization**
   - Singleton pattern (initialized once at startup)
   - No per-request initialization overhead

2. **Email Sending**
   - Asynchronous operation (non-blocking)
   - Resend API handles queuing and delivery
   - No local queue needed

3. **Template Rendering**
   - Simple string interpolation (fast)
   - No complex template engine overhead
   - Templates cached in memory

4. **Future Optimizations**
   - Batch email sending for multiple recipients
   - Queue system for high-volume scenarios
   - Retry logic with exponential backoff

## Deployment Checklist

- [ ] Add RESEND_API_KEY to Coolify environment variables
- [ ] Install resend npm package (`npm install resend`)
- [ ] Deploy updated code to production
- [ ] Verify health check endpoint shows email service as healthy
- [ ] Send test email via new API endpoint
- [ ] Monitor logs for errors
- [ ] Update API documentation
- [ ] Notify frontend team of new endpoint availability
